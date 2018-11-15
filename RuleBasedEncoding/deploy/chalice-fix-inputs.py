#!/usr/bin/python
import json
from pprint import pprint

def fix_chalice_sam_template():
    
    sam_json = json.load(open('./dist/sam.json'))
    # pprint(sam_json)

    #stack_inputs_json = json.load(open('./chalice-stack-inputs.json'))
    #pprint(stack_inputs_json)

    sam_json["Parameters"] = {
        "RulesTable": {
                "Type": "String",
                "Description": "RulesTable output from the ruleweb stack" 
                },
        "DynamoDbTable": {
                "Type": "String",
                "Description": "DynamoDbTable output from the Video On Demand on AWS stack" 
                },
        "Source": {
                "Type": "String",
                "Description": "Source output from the Video On Demand on AWS stack" 
                }
        }

    sam_json["Resources"]["APIHandler"]["Properties"]["Environment"] = {
        "Variables": {
                "RULEWEB_RULETABLE": {
                        "Ref":"RulesTable"
                },
                "VODONAWS_DYNAMODBTABLE": {
                        "Ref":"DynamoDbTable"
                },
                "VODONAWS_SOURCE": {
                        "Ref":"Source"
                }
            }
        }

    
    #MediainfoRuleEngine_environment_json = json.load(open('./chalice-environment-MediainfoRuleEngine.json'))
    #pprint(MediainfoRuleEngine_environment_json)
    sam_json["Resources"]["MediainfoRuleEngine"]["Properties"]["Environment"] = {
        "Variables": {
                "RULEWEB_RULETABLE": {
                "Ref":"RulesTable"
                }
            }
        }
    
    #MediainfoRuleEngineProfiler_environment_json = json.load(open('./chalice-environment-MediainfoRuleEngineProfiler.json'))
    #pprint(MediainfoRuleEngineProfiler_environment_json)
    sam_json["Resources"]["MediainfoRuleEngineProfiler"]["Properties"]["Environment"] = {
        "Variables": {
                "RULEWEB_RULETABLE": {
                "Ref":"RulesTable"
                },
                "VODONAWS_DYNAMODBTABLE": {
                "Ref":"DynamoDbTable"
                }
            }
        }

    with open('./dist/sam.json', 'w') as outfile:
        json.dump(sam_json, outfile)

    pprint(json.dumps(sam_json))

def main():
    fix_chalice_sam_template()


if __name__ == '__main__':
    main()