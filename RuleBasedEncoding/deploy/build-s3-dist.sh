!/bin/bash
regions='us-west-2 eu-west-1'
bucket='rodeolabz' # no / at the end
prefix='rules/3-rulesbasedencoding/v3'		#no / at the beginning or end
aws_profile='default-tm'

#[ -e dist ] && rm -r dist
#mkdir -p dist

echo "create cloudformation for ruleapi"
pwd

pushd ../ruleapi
chalice package ../deploy/dist
popd

# Add non-chalice managed resources to inputs
./chalice-fix-inputs.py

echo "cloudformation for rule core resources"
cp ../ruleweb.yaml ./dist

echo "cloudformation for key resources"
cp ../keys.yaml ./dist

echo "cloudformation for workshop"
cp ../workshop.yaml ./dist

echo "website pages"
cp -r ../website ./dist

ls -l dist

pushd dist
for region in $regions; do
    echo
    echo "CREATING PACKAGE FOR $region"
    echo
    pwd
    bucket='rodeolabz-'$region
    echo $bucket
    # Create a normal cloudformation template from the Chalice generated SAM template
    aws cloudformation package --template-file sam.json --s3-bucket $bucket --s3-prefix $prefix --output-template-file "ruleapi.yaml" --profile default-tm
    ../sam-translate.py
    aws s3 sync . s3://$bucket/$prefix --region $region --acl public-read --profile $aws_profile
    
done
popd

#aws s3 sync . s3://$bucket/$prefix --region $region --acl public-read --delete
