/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

// define the various loading paths
requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
        "app": "https://cdn.jsdelivr.net/gh/awslabs/aws-media-services-application-mapper@v0.3.0/html/js/app/",
        "ruleapp": "../ruleapp",
        "automerge": "https://cdn.jsdelivr.net/npm/automerge@0.7.8/dist/automerge.min",
        "cookie": "https://cdn.jsdelivr.net/npm/js-cookie@2.2.0/src/js.cookie.min",
        "fuse": "https://cdnjs.cloudflare.com/ajax/libs/fuse.js/3.2.0/fuse.min",
        "levenshtein": "https://cdn.jsdelivr.net/npm/fast-levenshtein@2.0.6/levenshtein.min",
        "lodash": "https://cdn.jsdelivr.net/npm/lodash@4.17.10/lodash.min",
        "machina": "https://cdn.jsdelivr.net/npm/machina@2.0.2/lib/machina.min",
        "vis": "https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min",
        "window": "https://cdn.jsdelivr.net/gh/awslabs/aws-media-services-application-mapper@v0.3.0/html/js/app/window",
        "api_check": "https://cdn.jsdelivr.net/gh/awslabs/aws-media-services-application-mapper@v0.3.0/html/js/app/api_check"
    },
    // add a cache-buster for module loading
    //"urlArgs": "t=" + (new Date()).getTime(),
    "waitSeconds": 30
});
// load the main module and go
requirejs(["ruleapp/main"]);