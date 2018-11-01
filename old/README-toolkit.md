# Deploying the toolkit for rules-based encoding

This section gives details about how to deploy the rule API , website and other backend resources that are used in the [main tutorial for this section](./README.md).

# Dynamodb tables and static website pages

# Serverless API

## Prerequisites

None

## Deploy backend resources

### Launching the Stack on AWS

The backend infrastructure can be deployed in US West - Oregon (us-west-2) using the provided CloudFormation template.
Click **Launch Stack** to launch the template in the US West - Oregon (us-west-2) region in your account:

A CloudFormation template is provided for this module in the file `RulesOnAWS.yaml` to build the resources automatically. Click **Launch Stack** to launch the template in your account in the region of your choice : 

Region| Launch
------|-----

US West (Oregon) | [![Launch in us-west-2](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/images/cloudformation-launch-stack-button.png)](https://console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/new?stackName=emc-watchfolder&templateURL=https://s3.amazonaws.com/rodeolabz-us-west-2/vodtk/1a-mediaconvert-watchfolder/WatchFolder.yaml)

1. Make sure to enter the DynamoDB table from the Video On Demand on AWS stack.

(On the last page of the wizard, make sure to:

2. Click the checkboxes to give AWS CloudFormation permission to **"create IAM resources"** and **"create IAM resources with custom names"**
1. Click **"Execute"**
)

The information about the resources created is in the **Outputs** tab of the stack.  Save this in a browser tab so you can use it later when you create other stacks and MediaConvert jobs.

![outputs](../images/cf-watchfolder-stack.png)

### Stack inputs

**vodonawsTable** - the AWS Dynamodb table that was created by the Video On Demand on AWS stack.  Since we will be integrating our rules engine into the workflow, we will use this table to track the result of our rules execution.
**vodonawsSource** - the Amazon S3 bucket that was created by the Video On Demand on AWS stack.


### Resources created

**ruleapi** - an AWS API Gateway API to create and update rules to be used in encoding workflows.

**ruleapiLambda** - lambda backend for processing requests from rulesapi and vodapi

**rulesTable** - an AWS Dynamodb table used to store rules created using the rulesapi

**rulesLambda** - lambda to execute rules.

**websiteS3** - S3 bucket used to host static web pages for creating rules and viewing workflow results.  

### Stack outputs:

**rulesapiEndpoint** - the API enpoint for rulespi

**rulesPage** - webpage for creating and viewing rules

**vodonawsPage** - webpage for viewing the status of Video On Demand on AWS workflow instances.


## Create the API

## Configure the API Lambda

Configure the API by entering the values below in the lambda environment variables:

Replace the APP_RULES_TABLE_NAME string with the RulesTableName output from the stack you created using the rules.yaml template.
Replace the VODONAWS_TABLE_NAME string with the DynamoDBTable output from the Video On Demand on AWS stack.
Replace the VODONAWS_WATCHFOLDER_NAME value with the Source output from the ideo On Demand on AWS stack.

```
{
  "version": "2.0",
  "app_name": "rulesapilab",
  "environment_variables": {
    "APP_RULES_TABLE_NAME": "ruleslab-RulesTable",
    "VODONAWS_TABLE_NAME": "vodaws45",
    "VODONAWS_WATCHFOLDER_NAME": "vodaws45-source-1xc27xd0jfvkc",
    "VODONAWS_INDEX_NAME": "srcBucket-startTime-index"
    },
  "stages": {
    "dev": {
      "api_gateway_stage": "api",
      "manage_iam_role":false,
      "iam_role_arn":"arn:aws:iam::526662735483:role/ruleslab-APILambdaRole"
    }
  }
}
```

## Configure the webpage

Need to add the API endpoint to a config file -- FIXME will try to make this happen in the webpage itself.

## Create and test some rules

Experiment with creating rules and running them against the sample input videos.

1. Create a rule that takes a differnt action based the codec of the input file.  Test with FIXME, FIXME
2. Create a rule that takes a differnt action based the number of audio tracks of the input file. Test with FIXME, FIXME

## Examine the rule execution lambda we are testing with.

Input: mediainfo
Output: rule results 

## Modify the Video On Demand on AWS workflow to use dynamic rules

The VOD on AWS solution already has a set of hardcoded rules that are used for decising which MediaConvert job template to use.  We are going to replace that decision making with dynmaic rules that let us configure rules as part of the user interface.

FIXME Diagram of Step Functions or Overview of Details.

### Open the Step Function for Process Step lambda for VOd on AWS

The Profiler Lambda is the part that makes the template decision.

Look at the inputs and outputs on one of the executed workflows.

We are going to replace this lambda with a new lambda that uses dynamic rules.

### Change the Rule Execution Lambda to take same inputs / outputs as the Profiler lambda

### Change the S3 trigger to use Metadata

We'll use the metadata mechanism to pass in encoding rule mappings which will be evaluated in order by our rule engine using CASE semantics, to select a template for the workflow.  

```
{"ruleMappings": [
  {"rule1":"template1"},
  {"rule2":"template2"},
  ....
]}
```

In order to pass in metadata, we need to modify the S3 trigger for the VOD on AWS workflow to trigger on metadata files of the format `*.json`.


### Replace the lambda for the Processing step to use our rules engine lambda


input is event['guid'] - we'll take this guid an look up mediainfo from the Video on Demand on AWS dydnamodb table.

```
FIXME code for getting mediainfo
```

use existing code for running rules.

use rules to choose a template

```
FIXME code for choosing template
pass rules result and template on output
```


Replace the profiler lambda in step function with this new lambda.

## Test the workflow

## Conclusion

## Appendix 1: Setting up the python development environment

Create a python 3.6 virtual environment:

```
virtualenv ~/virtualenvs/vodawslab
source ~/virtualenvs/vodawslab/bin/activate
```

Install requirements:


```
FIXME
```

## Appendix 2: Possible extensions 

Feel free to enter a pull request if you want to add to this project!

add track selection.  The current implementation is limited:
* assumes only one video track in the input 
* only tests container and video analysis


* add other types of analysis/rules such as ffmpeg for black detection, silence detection, ffprobe. 

Replace Python business-rules package with IOT Rules.  There's always more than one way to do something!  I think we could use IOT Rules for this workflow by generating an SQL expression for each rule and creating a Dynamodb trigger rules with the following structure, name each track then write each rule as a column output of the select clause :

```
SELECT 
    mediainfo.container AS container, mediainfo.video[0] AS video0, ..., 
    mediainfo.audio[0] AS audio0, ...,
    mediainfo.text[0] AS text0, ...,
    (rule 1 expression) AS rule1result, ..., 
    (rule N expression) AS ruleNresult
FROM
    mediainfo
```

The rule would insert the result of each expression into a dynamodb table.  A dynamodb trigger could be used to apply the rule mappings to select a template and continue the workflow.


