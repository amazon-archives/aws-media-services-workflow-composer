#!/usr/bin/env python3

"""Convert SAM templates to CloudFormation templates.
Known limitations: cannot transform CodeUri pointing at local directory.
Usage:
  sam-translate.py --input-file=sam-template.yaml [--output-file=<o>]
Options:
  -i FILE, --input-file=IN_FILE     Location of SAM template to transform.
  -o FILE, --output-file=OUT_FILE    Location to store resulting CloudFormation template [default: cfn-template.json].
"""
import json
import os

import boto3
from docopt import docopt

from samtranslator.public.translator import ManagedPolicyLoader
from samtranslator.translator.transform import transform
from samtranslator.yaml_helper import yaml_parse
from samtranslator.model.exceptions import InvalidDocumentException


iam_client = boto3.client('iam')
cwd = os.getcwd()


def main():
    print(cwd)
    input_file_path = cwd+'/ruleapi.yaml'
    output_file_path = cwd+'/ruleapi_cfn.yaml'

    print(input_file_path)

    with open(input_file_path, 'r') as f:
        sam_template = yaml_parse(f)

    try:
        cloud_formation_template = transform(
            sam_template, {}, ManagedPolicyLoader(iam_client))
        cloud_formation_template_prettified = json.dumps(
            cloud_formation_template, indent=2)

        with open(output_file_path, 'w') as f:
            f.write(cloud_formation_template_prettified)

        print('Wrote transformed CloudFormation template to: ' + output_file_path)
    except InvalidDocumentException as e:
        errorMessage = reduce(lambda message, error: message + ' ' + error.message, e.causes, e.message)
        print(errorMessage)
        errors = map(lambda cause: cause.message, e.causes)
        print(errors)


if __name__ == '__main__':
    main()
