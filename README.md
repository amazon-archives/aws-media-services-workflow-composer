# Video On Demand on AWS Workshop

This workshop guides participants in customizing the [Video On Demand on AWS Solution](https://aws.amazon.com/answers/media-entertainment/video-on-demand-on-aws/).  AWS offers this solution as a well-architected starting point for automating file-based video workflows on AWS.  The stack  ingests source videos, processes the videos for playback on a wide range of devices, and stores the transcoded media files for on-demand delivery to end users through Amazon CloudFront. 

In this workshop, we will deploy the Video On Demand on AWS Solution and modify it by adding functionality at different integration points.

# Workshop Requirements

### AWS Account

In order to complete this workshop you'll need an AWS Account with access to create AWS MediaConvert, IAM, S3, Step Function, API Gateway and Lambda resources. The code and instructions in this workshop assume only one participant is using a given AWS account at a time. If you try sharing an account with another participant, you'll run into naming conflicts for certain resources. You can work around these by appending a unique suffix to the resources that fail to create due to conflicts, but the instructions do not provide details on the changes required to make this work.

### Billing FIXME

MediaConvert jobs will incur charges based on the region you are using for the workshop at the rates described in the MediaConvert pricing page: https://aws.amazon.com/mediaconvert/pricing/ .

**Each MediaConvert job from this lab produces outputs with the following characteristics:**

ABR stack 
* 3 outputs: 1280x720, 960x540, 680x360

MP4
* 1 output: 1280x720

Thumbnails
* 1 output: 1280x720

All ouputs:
* MPEG-2 Codec
* 30 - 60 FPS
* 1.5 - 2 minutes long depending on which job in the lab you are running.

**Other lab resources**

S3 and other resources you will launch as part of this workshop are eligible for the AWS free tier if your account is less than 12 months old. See the [AWS Free Tier page](https://aws.amazon.com/free/) for more details.

### Browser

We recommend you use the latest version of Chrome to complete this workshop.

### Video player

Videos can be played out in the browser if the browser supports them.  If you do not have a browser/platform combination that supports playing HLS and MP4 video then you can use:
* **JW Player Stream Tester** https://developer.jwplayer.com/tools/stream-tester/ 

### Text / Code Editor

You will need a local text editor for making minor updates to configuration files.

### Download the Workshop

You will need to download this project to your computer in order to create the browser page, configure Video On Demand on AWS jobs and run CloudFormation templates.

# Workshop Modules

- [**Video On Demand on AWS Solution**](1-VODonAWS/README.md) - This module guides the participant in deploying the Video On Demand on AWS Solution using AWS CloudFormation.



- [**Modifying the VOD on AWS MediaConvert job settings: SPEKE encryption**](2-VideoEncryption/README.md) - This module guides the participant in making changes to the job settings used by the VOD on AWS Solution.

- [**Modifying the VOD on AWS Step Functions: Rules-based Encoding**](3-RuleBasedEncoding/README.md) - This module guides the participant in modifying the Video On Demand on AWS workflow to use rules based on Mediainfo analysis on input videos to dynamically decide betweeen different encoding settings during workflow execution.

- [**Working with VOD on AWS workflow outputs: Video Quality Control**](4-VideoQualityControl/README.md) - This module guides the participant in different kinds of information that they can "burn-in" to a video ouput. They will create a video with timecodes and watermarks burned in to the elemental video stream of one of the outputs of their job.

# Start the Workshop

Move forward to the first module [**Video On Demand on AWS Solution**](1-VODonAWS/README.md).

# Credits


# Contributors



