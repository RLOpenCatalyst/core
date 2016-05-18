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
        // params structure
        /*params = {
            "blueprints":{},
            "networkConfig": {},
            "providers": {}
        }*/
        // Create a new VM using the latest OS image of your choice. 
        var zone = gce.zone(params.zone);
        var name = "D4D-" + params.blueprints.name;

        var paramConfig = {
            "name": name,
            "zone": params.networkConfig.zone,
            "machineType": params.blueprints.instanceType,
            "metadata": {
                "items": [{
                    "key": "ssh-keys",
                    "value": params.providers.sshFile
                }]
            },
            "disks": [{
                "boot": true, // Mandatory field
                "deviceName": name,
                "initializeParams": {
                    "sourceImage": params.blueprints.vmImage.sourceImage, // url mandatory
                    "diskType": params.blueprints.bootDiskType, // url mandatory
                    "diskSizeGb": params.blueprints.bootDiskSize
                }
            }],
            "networkInterfaces": [{
                "network": params.networkConfig.network, // url mandatory
                "subnetwork": params.networkConfig.subnetwork, // url mandatory
                "accessConfigs": params.networkConfig.accessConfigs
            }]
        };


        /*var param1 = {
            "name": "gobinda-instance",
            "zone": "us-central1-b",
            "machineType": "f1-micro",
            "metadata": {
                "items": [{
                    "key": "ssh-keys",
                    "value": "root:ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDgAc/oTIxLPlI77dyl5CF9noGxPUslp/Cg/zymDgy0ewhBBwMm6KPlJaVHigVfLlYHGl7WqZ3toBCZ8IbHEGakLPgx+Yu//yjVmFlLG6y6ud8n/2ocwlX4WgCSKzORmiGM3kC0VL8GzOAYqm7uN0MjueJsu4PTX6QT0JtVlNQnSFnjyBrkaPU3vPWDRGdnLMmKHKFc5Dqh8HCBmKCh8NVmtpYUhnghuMr7IhmJrr3HgmLH4fPjOfPSHjAqtvCxjtEEJieeDLCrFG36+iDQ9m6nxWe9E2+Zatnq7jEwZIKs9NFDw9HcB+E79a7uTIdVB9eBnn3SxM37gvCERayWcBhx root@gobinda-Latitude-3450"
                }]
            },
            "disks": [{
                "boot": true, // Mandatory field
                "deviceName": "gobinda-instance",
                "initializeParams": {
                    "sourceImage": "https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-1404-trusty-v20160516", // url mandatory
                    "diskType": "projects/eastern-clock-129807/zones/us-central1-b/diskTypes/pd-ssd", // url mandatory
                    "diskSizeGb": "10"
                }
            }],
            "networkInterfaces": [{
                "network": "projects/eastern-clock-129807/global/networks/default", // url mandatory
                "subnetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614", // url mandatory
                "accessConfigs": [{
                    "name": "External NAT",
                    "type": "ONE_TO_ONE_NAT"
                }]
            }]
        };*/

        zone.createVM(name, paramConfig, function(err, vm, operation) {
            if (err) {
                var error = new Error("Error to create VM.");
                error.status(500);
                return callback(error, null);
            }
            if (operation) {
                operation.on('complete', function(metadata) {
                    gce.getVMs({
                        filter: "id eq " + metadata.targetId
                    }, function(err, data) {
                        if (err) {
                            logger.debug("Error to fetch VM: ", err);
                            var error = new Error("Failed to get VM from GCP.");
                            error.status(500);
                            return callback(error, null);
                        }
                        if (data && data.length) {
                            var name = data[0].metadata.name;
                            var id = data[0].metadata.id;
                            var status = data[0].metadata.status;
                            var ip = data[0].metadata.networkInterfaces[0].accessConfigs[0].natIP || data[0].metadata.networkInterfaces[0].networkIP;
                            return callback(null, { "id": id, "name": name, "status": status, "ip": ip });
                        } else {
                            var error = new Error("No VM found from GCP.");
                            error.status(404);
                            return callback(error, null);
                        }
                    });
                });
            } else {
                var error = new Error("Error to create VM.");
                error.status(500);
                return callback(error, null);
            }
        });
    };

    this.getNetworks = function getNetworks(callback) {
        gce.getNetworks(function(err, networks) {
            if (err) {
                var error = new Error("Failed to get Networks from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, networks);
        });
    };

    this.getZones = function getZones(callback) {
        gce.getZones(function(err, zones) {
            if (err) {
                var error = new Error("Failed to get Zones from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, zones);
        });
    };
    this.getVMs = function getVMs(callback) {
        gce.getVMs(function(err, vms) {
            if (err) {
                var error = new Error("Failed to get VMs from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, vms);
        });
    };
    this.getDisks = function getDisks(callback) {
        gce.getDisks(function(err, disks) {
            if (err) {
                var error = new Error("Failed to get Disks from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, disks);
        });
    };
    this.getDisks = function getDisks(callback) {
        gce.getDisks(function(err, disks) {
            if (err) {
                var error = new Error("Failed to get Disks from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, disks);
        });
    };
    this.getDisks = function getDisks(callback) {
        gce.getDisks(function(err, disks) {
            if (err) {
                var error = new Error("Failed to get Disks from GCP.");
                error.status(500);
                return callback(error, null);
            }
            return callback(null, disks);
        });
    };

};

module.exports = GCP;
