from __future__ import unicode_literals
from chalice import Chalice
from chalice import BadRequestError, ChaliceViewError
import boto3
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.conditions import Attr
from boto3 import resource
from botocore.client import ClientError
import uuid
import logging
import os
from datetime import date
from datetime import time
from datetime import datetime
import json
import time
import decimal
import traceback
from urllib.parse import urlparse
import business_rules
from business_rules import export_rule_data
from business_rules import run_all
from business_rules.actions import BaseActions
from business_rules.actions import rule_action
from business_rules.variables import BaseVariables
from business_rules.variables import numeric_rule_variable, \
    string_rule_variable, select_rule_variable
from business_rules.fields import FIELD_NUMERIC, FIELD_TEXT

# Setup logging
logger = logging.getLogger('boto3')
logger.setLevel(logging.INFO)

# Helper class to convert a DynamoDB item to JSON.


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return str(o)
        return super(DecimalEncoder, self).default(o)


# Setup boto3 resources
dynamodb_resource = resource('dynamodb')
S3 = boto3.client('s3')

# Defines names and types of variables that can be used in business-rules expressions and how their values
# can be found in a Mediainfo type object.


class MediainfoVariables(BaseVariables):
    def __init__(self, video):
        self.video = video
        logger.info(video.mediainfo)
        # FIXME - there can be more than one of each track type.  Need to add ability to
        # select a track to the UI.
        self.video0 = video.mediainfo['video'][0]
        self.container = video.mediainfo['container']

    # container variables
    @select_rule_variable(options=["MPEG-4", "QuickTime", "Matroska", "AVI", "MPEG-PS", "MPEG-TS", "MXF", "GXF", "LXF", "WMV", "FLV", "Real"])
    def container_format(self):
        print("container_format({}".format(self.container['format']))
        return [self.container['format']]

    @numeric_rule_variable
    def container_file_size(self):
        return int(self.continer['fileSize'])

    @numeric_rule_variable
    def container_duration(self):
        return float(self.container['duration'])

    @string_rule_variable
    def container_mime_type(self):
        return self.container['mimeType']

    @numeric_rule_variable
    def container_total_bitrate(self):
        return float(self.container['totalBitrate'])

    # video variables - assume a single video track in container
    @string_rule_variable
    def video_codec(self):
        return self.video0['codec']

    @numeric_rule_variable
    def video_frame_count(self):
        return int(self.video0['frameCount'])

    @string_rule_variable
    def video_scan_type(self):
        return self.video0['scanType']

    @string_rule_variable
    def video_profile(self):
        return self.video0['profile']

    @numeric_rule_variable
    def video_height(self):
        return int(self.video0['height'])

    @numeric_rule_variable
    def video_frame_rate(self):
        return int(self.video0['framerate'])

    @string_rule_variable
    def video_aspect_ratio(self):
        return float(self.video0['aspectRatio'])

    @numeric_rule_variable
    def video_bit_depth(self):
        return int(self.video0['bitDepth'])

    @numeric_rule_variable
    def video_duration(self):
        return float(self.video0['duration'])

    @numeric_rule_variable
    def video_bit_rate(self):
        return int(self.video0['bitrate'])

    @string_rule_variable
    def video_color_space(self):
        return self.video0['colorSpace']

    @numeric_rule_variable
    def video_width(self):
        return int(self.video0['width'])


# Defines names and types of actions that can be triggers from the business-rules pacakage.  These
# are mocks for testing only.  The rulesapi simply returns the test result and lets the client make
# decisions about the workflow actions.
class MediainfoActions(BaseActions):
    nothing = "nothing"

    def __init__(self, video):
        self.video = video

    @rule_action()
    def do_test(self):
        return "test result json"

# Defines video facts object.  For now, facts are mediainfo results only


class Mediainfo:
    def __init__(self, mediainfo):
        self.mediainfo = mediainfo


# Setup the Chalice app.  See https://github.com/aws/chalice for more info
app = Chalice(app_name='ruleapi')


'''
Test input to be used in place of Dynamodb row for unit testing
'''
MEDIAINFO_BUSINESSRULES_PROFILER_TEST = {
    "guid": "67ea0602-49a9-48c8-bebd-d3bb4641665e",
    "destBucket": "vodaws45-destination-tc1fbugf08dz",
    "workflowStatus": "Ingest",
    "frameCapture": True,
    "srcMetadataFile": "944faeca-b2e5-47c4-adde-6c09ecbaec87.json",
    "jobTemplate_2160p": "vodaws45_Ott_2160p_Hevc_Aac_16x9",
    "jobTemplate_720p": "vodaws45_Ott_720p_Hevc_Aac_16x9",
    "workflowName": "vodaws45",
    "jobTemplate_1080p": "vodaws45_Ott_1080p_Hevc_Aac_16x9",
    "archiveSource": False,
    "ruleMappings": [
        {"ruleName": "Container_eq_MXF", "template": "theTemplateForContainer_eq_MXF"},
        {"ruleName": "Container_eq_MP4", "template": "theTemplateForContainer_eq_MP4"},
        {"ruleName": "Container_eq_Prores",
         "template": "theTemplateForContainer_eq_Prores"}
    ],
    "srcMediainfo": "{\n  \"filename\": \"futbol_720p60.mp4\",\n  \"container\": {\n    \"format\": \"MPEG-4\",\n    \"mimeType\": \"video/mp4\",\n    \"fileSize\": 229066618,\n    \"duration\": 180224,\n    \"totalBitrate\": 10168085\n  },\n  \"video\": [\n    {\n      \"codec\": \"AVC\",\n      \"profile\": \"High@L3.2\",\n      \"bitrate\": 10000000,\n      \"duration\": 180200,\n      \"frameCount\": 10812,\n      \"width\": 1280,\n      \"height\": 720,\n      \"framerate\": 60,\n      \"scanType\": \"Progressive\",\n      \"aspectRatio\": \"16:9\",\n      \"bitDepth\": 8,\n      \"colorSpace\": \"YUV 4:2:0\"\n    }\n  ],\n  \"audio\": [\n    {\n      \"codec\": \"AAC\",\n      \"bitrate\": 93375,\n      \"duration\": 180224,\n      \"frameCount\": 8448,\n      \"bitrateMode\": \"CBR\",\n      \"language\": \"en\",\n      \"channels\": 2,\n      \"samplingRate\": 48000,\n      \"samplePerFrame\": 1024\n    }\n  ]\n}",
    "startTime": "2018-09-28 18:14.9",
    "srcVideo": "futbol_720p60.mp4",
    "srcBucket": "vodaws45-source-1xc27xd0jfvkc",
    "FrameCapture": True
}

'''
 * @description set an endcoding profile based on the sorurce mediaInfo metadata). 
 * define the height/width for framecapture. define the encoding
 * job template to be used based on the profile (passing in the the event.jobTemplate
 * will overide the workflow defaults)
'''


@app.lambda_function(name="mediainfoRuleEngineProfiler")
def mediainfoRuleEngineProfiler(event, context):

    vodonawsTable = dynamodb_resource.Table(
        os.environ['VODONAWS_DYNAMODBTABLE'])
    rulesTable = dynamodb_resource.Table(os.environ['RULEWEB_RULETABLE'])

    guid = event['guid']

    try:

        # Get the latest workflow data from Dynamodb
        # Set testLambda to true to test with hardcoded input

        testLambda = False
        if (testLambda):
            logger.info("USING TEST EVENT")
            event = MEDIAINFO_BUSINESSRULES_PROFILER_TEST
        else:
            logger.info("Get event from Dynamodb")
            response = vodonawsTable.get_item(Key={'guid': guid})
            event = response['Item']

        logger.info("GetItem succeeded:")
        logger.info(json.dumps(event, indent=4, cls=DecimalEncoder))

        # Get mediainfo analysis results that were collected earlier in the workflow (Ingest Step Function)
        mediaInfo = json.loads(event['srcMediainfo'])

        # Set outputs that are based on mediainfo
        event['srcHeight'] = mediaInfo['video'][0]['height']
        event['srcWidth'] = mediaInfo['video'][0]['width']

        # Decide on a MediaConvert encoding template by running the mediainfo business-rules and selecting
        # the first mapped template whose rule is true.  This implements IF-THEN-ELSE semantics
        if ('ruleMappings' in event):
            video = Mediainfo(mediaInfo)

            for ruleMapping in event['ruleMappings']:

                ruleMapping['testCreateTime'] = datetime.utcnow().strftime(
                    '%Y-%m-%d %H:%M.%S')

                logger.info("rule: {}".format(json.dumps(
                    ruleMapping, indent=4, sort_keys=True)))

                response = rulesTable.get_item(
                    Key={'name': ruleMapping['ruleName']}, ConsistentRead=True)
                logger.info("running test {}".format(
                    json.dumps(response, cls=DecimalEncoder)))

                businessRules = response['Item']['rules']

                ruleMapping['testResult'] = run_all(rule_list=[businessRules],
                                                    defined_variables=MediainfoVariables(
                                                        video),
                                                    defined_actions=MediainfoActions(
                                                        video),
                                                    stop_on_first_trigger=True
                                                    )

                logger.info("test result {}".format(json.dumps(
                    ruleMapping['testResult'], cls=DecimalEncoder)))

                if ruleMapping['testResult'] == True:
                    event['jobTemplate'] = ruleMapping['template']
                    break

        profiles = [2160, 1080, 720]
        encodeProfile = 2160

        for p in profiles:
            if event['srcHeight'] > p:
                break
            encodeProfile = p

        event['EncodingProfile'] = encodeProfile

        if (event['FrameCapture']):
            # Match Height x Width with the encoding profile.
            ratios = {
                '2160': 3840,
                '1080': 1920,
                '720': 1280
            }
            event['frameCaptureHeight'] = encodeProfile
            event['frameCaptureWidth'] = ratios[str(encodeProfile)]

        # If no rule evaluated to True or there were no rules, use the existing default
        # templates

        if 'jobTemplate' not in event:
            # Match the jobTemplate to the encoding Profile.
            jobTemplates = {
                '2160': event['jobTemplate_2160p'],
                '1080': event['jobTemplate_1080p'],
                '720': event['jobTemplate_720p']
            }

            event['jobTemplate'] = jobTemplates[str(encodeProfile)]

        logger.info('Encoding jobTemplates: %s ', event['jobTemplate'])

    except Exception as e:
        logger.info("Exception {}".format(e))
        raise ChaliceViewError("Exception '%s'" % e)

    return event


'''
 * @description set an endcoding profile based on the sorurce mediaInfo metadata). 
 * define the height/width for framecapture. define the encoding
 * job template to be used based on the profile (passing in the the event.jobTemplate
 * will overide the workflow defaults)
'''


@app.lambda_function(name="mediainfoRuleEngine")
def mediainfoRuleEngine(event, context):

    logger.info(json.dumps(event))

    try:
        rulesTable = dynamodb_resource.Table(os.environ['RULEWEB_RULETABLE'])
        mediaInfo = event['mediainfo']
        ruleMappings = event['ruleMappings']

        video = Mediainfo(mediaInfo)

        # Determine Encoding template by running the encoding rules and selecting
        # the first mapped template whose rules is true.

        for ruleMapping in event['ruleMappings']:

            ruleMapping['testCreateTime'] = datetime.utcnow().strftime(
                '%Y-%m-%d %H:%M.%S')

            logger.info("rule: {}".format(json.dumps(
                ruleMapping, indent=4, sort_keys=True)))

            # retrieve the rule expression from the dyanamodb
            response = rulesTable.get_item(
                Key={'name': ruleMapping['ruleName']}, ConsistentRead=True)
            businessRules = response['Item']['rules']

            logger.info("running test {}".format(
                json.dumps(businessRules, cls=DecimalEncoder)))

            ruleMapping['testResult'] = run_all(rule_list=[businessRules],
                                                defined_variables=MediainfoVariables(
                                                    video),
                                                defined_actions=MediainfoActions(
                                                    video),
                                                stop_on_first_trigger=True
                                                )

            logger.info("test result {}".format(json.dumps(
                ruleMapping['testResult'], cls=DecimalEncoder)))

            # Stop on the first rule that evaluates to True as we have found our mapping
            if ruleMapping['testResult'] == True:
                event['selectedRuleString'] = ruleMapping['ruleString']
                break

    except Exception as e:
        logger.info("Exception {}".format(e))
        raise ChaliceViewError("Exception '%s'" % e)

    logger.info('Event: %s', json.dumps(event))

    return event


@app.route('/', cors=True)
def index():
    return {'hello': 'world'}


@app.route('/ping', cors=True)
def ping():
    return {'ping': 'pong'}

# Get a list of varaiable definitions that can be used to create rule expressions


@app.route('/rules/variables', methods=['GET'], cors=True)
def get_variables():

    logger.info('ENTER get_variables()')

    try:

        rule_data = export_rule_data(MediainfoVariables, MediainfoActions)

        logger.info("{}".format(json.dumps(
            rule_data, indent=4, sort_keys=True)))

    except Exception as e:
        logger.info("Error getting rule data {}".format(e))
        raise ChaliceViewError("Dynamodb returned error message '%s'" % e)

    logger.info('LEAVE get_variables: {}'.format(
        json.dumps(rule_data, indent=4, sort_keys=True)))
    return rule_data


# Get a list of all rule defintions created through the API
@app.route('/rules', methods=['GET'], api_key_required=True, cors=True)
def get_rules():

    logger.info('ENTER get_rules()')

    try:
        table = dynamodb_resource.Table(os.environ['RULEWEB_RULETABLE'])
        response = table.scan()

    except Exception as e:
        logger.info("Exception {}".format(e))
        raise ChaliceViewError("Exception '%s'" % e)

    logger.info('LEAVE get_rules: {}'.format(
        json.dumps(response['Items'], cls=DecimalEncoder)))
    return response['Items']

# Get a rule defintion created through the API


@app.route('/rules/{rule_name}', methods=['GET'], api_key_required=True, cors=True)
def get_rule(rule_name):

    logger.info("ENTER get_rule(rule_name = {})".format(rule_name))
    table = dynamodb_resource.Table(os.environ['RULEWEB_RULETABLE'])

    try:
        response = table.get_item(Key={'name': rule_name}, ConsistentRead=True)
        logger.info("{}".format(json.dumps(response, cls=DecimalEncoder)))
    except Exception as e:
        logger.info("Exception {}".format(e))
        raise ChaliceViewError("Exception '%s'" % e)

    logger.info('LEAVE get_rule: {}'.format(
        json.dumps(response['Item'], cls=DecimalEncoder)))
    return response['Item']

# Create a rule defintion


@app.route('/rules/{rule_name}', methods=['POST'], api_key_required=True, cors=True)
def create_or_update_rule(rule_name):

    logger.info("ENTER create_rule: Create rule set name {}".format(rule_name))

    table = dynamodb_resource.Table(os.environ['RULEWEB_RULETABLE'])

    try:
        request_body = app.current_request.json_body
        logger.info("request body {}".format(
            json.dumps(request_body, indent=4, sort_keys=True)))
        ruleSet = {}
        ruleSet['name'] = rule_name
        ruleSet['rules'] = json.loads(request_body['body'])
        ruleSet['rules']['actions'] = [
            {
                "name": "do_test",
            },
        ]
        ruleSet['createTime'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M.%S')

        # convert floats in input to decimal for Dynamodb
        s = json.dumps(ruleSet, cls=DecimalEncoder)
        ruleSet = json.loads(s, parse_float=decimal.Decimal)

        logger.info("create_rule: Create rule set name {} body {}".format(
            rule_name, json.dumps(request_body, indent=4, sort_keys=True)))

        response = table.put_item(Item=ruleSet)
        logger.info("put_item response {}".format(
            json.dumps(response, cls=DecimalEncoder)))

    except Exception as e:
        logger.info("Exception {}".format(e))
        raise ChaliceViewError("Exception '%s'" % e)

    logger.info("LEAVE create_rule")
    return response


@app.route('/vodonaws', methods=['GET'], api_key_required=True, cors=True)
def vod_list_assets():

    watchfolder_bucket = os.environ['VODONAWS_SOURCE']
    table = dynamodb_resource.Table(os.environ['VODONAWS_DYNAMODBTABLE'])
    index_name = 'srcBucket-startTime-index'
    ret = {}

    logger.info('ENTER vod_list_assets()')

    try:

        filtering_exp = Key('srcBucket').eq(watchfolder_bucket)
        response = table.query(
            IndexName=index_name, KeyConditionExpression=filtering_exp, Limit=15, ScanIndexForward=False)
        logger.info("{}".format(json.dumps(response, cls=DecimalEncoder)))

    except ClientError as e:
        logger.info("ClientError from Dynamodb {}".format(
            e.response['Error']['Message']))
        raise BadRequestError(
            "Dynamodb returned error message '%s'" % e.response['Error']['Message'])
    else:
        if 'Items' not in response:
            logger.info("No items in table")
            items = None
        else:
            logger.info("got some items")

    ret['items'] = response['Items']
    ret['region'] = os.environ['AWS_REGION']

    return json.dumps(ret, cls=DecimalEncoder)


# The view function above will return {"hello": "world"}
# whenever you make an HTTP GET request to '/'.
#
# Here are a few more examples:
#
# @app.route('/hello/{name}')
# def hello_name(name):
#    # '/hello/james' -> {"hello": "james"}
#    return {'hello': name}
#
# @app.route('/users', methods=['POST'])
# def create_user():
#     # This is the JSON body the user sent in their POST request.
#     user_as_json = app.current_request.json_body
#     # We'll echo the json body back to the user in a 'user' key.
#     return {'user': user_as_json}
#
# See the README documentation for more examples.
#
