/*
Copyright [2016] [Relevance Lab]
loLicensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var logger = require('_pr/logger')(module);
var gcloud = require('gcloud');

// GCP constructor to initialize gcp config
var GCP = function GCP(params) {
    var gce = gcloud.compute({
        projectId: params.projectId,
        keyFilename: params.keyFilename
    });


    this.createVM = function createVM(params, callback) {
        // Create a new VM using the latest OS image of your choice. 
        var zone = gce.zone(params.zone);
        var name = params.instanceName;
        var osName = params.osName;

        zone.createVM(name, { os: osName }, function(err, vm, operation) {
            // `operation` lets you check the status of long-running tasks. 

            operation.onComplete(function(err, metadata) {
                if (!err) {
                    // Virtual machine created! 
                    logger.debug("Create VM: ",metadata);
                    return callback(null,metadata);
                }else{
                	return callback(err,null);
                }
            });
        });
    }

};

module.exports = GCP;
