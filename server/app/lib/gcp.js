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
        var zone = gce.zone(params.networkConfig.networkDetails.zone);
        var name = "d4d-" + params.blueprints.name.toLowerCase() + new Date().getTime();

        var paramConfig = {
            "name": name,
            "zone": params.networkConfig.networkDetails.zone,
            "machineType": params.blueprints.machineType,
            "metadata": {
                "items": [{
                    "key": "ssh-keys",
                    "value": params.blueprints.vmImage.userName + ':' + new Buffer(params.providers.providerDetails.sshPublicKey, 'base64').toString()
                }]
            },
            "tags": {
                "items": [
                    "http-server"
                ]
            },
            "disks": [{
                "boot": true, // Mandatory field
                "deviceName": name,
                "initializeParams": {
                    "sourceImage": params.blueprints.vmImage.vmImageId, // url mandatory
                    //"sourceImage": "https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-1404-trusty-v20160516",
                    "diskType": params.blueprints.bootDiskType, // url mandatory
                    "diskSizeGb": params.blueprints.bootDiskSize
                }
            }],
            "networkInterfaces": [{
                "network": params.networkConfig.networkDetails.network, // url mandatory
                "subnetwork": params.networkConfig.networkDetails.subnetwork, // url mandatory
                "accessConfigs": [{
                    "name": params.networkConfig.networkDetails.accessConfigs[0].accessConfigName,
                    "type": params.networkConfig.networkDetails.accessConfigs[0].accessConfigType
                }]
            }]
        };

        zone.createVM(name, paramConfig, function(err, vm, operation) {
            if (err) {
                logger.debug("Error while creating VM: ", err);
                var error = new Error("Error to create VM.");
                error.status = 500;
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
                            error.status = 500;
                            return callback(error, null);
                        }
                        if (data && data.length) {
                            var name = data[0].metadata.name;
                            var id = data[0].metadata.id;
                            var status = data[0].metadata.status;
                            var ip = data[0].metadata.networkInterfaces[0].accessConfigs[0].natIP || data[0].metadata.networkInterfaces[0].networkIP;
                            return callback(null, { "id": id, "name": name, "status": status, "ip": ip, "prvider": params.providers });
                        } else {
                            var error = new Error("No VM found from GCP.");
                            error.status = 404;
                            return callback(error, null);
                        }
                    });
                });
            } else {
                var error = new Error("Error to create VM.");
                error.status = 500;
                return callback(error, null);
            }
        });
    };

    this.getNetworks = function getNetworks(callback) {
        gce.getNetworks(function(err, networks) {
            if (err) {
                var error = new Error("Failed to get Networks from GCP.");
                error.status = 500;
                return callback(error, null);
            }
            return callback(null, networks);
        });
    };

    this.getZones = function getZones(callback) {
        gce.getZones(function(err, zones) {
            if (err) {
                var error = new Error("Failed to get Zones from GCP.");
                error.status = 500;
                return callback(error, null);
            }
            return callback(null, zones);
        });
    };

    this.getVMs = function getVMs(callback) {
        gce.getVMs(function(err, vms) {
            if (err) {
                var error = new Error("Failed to get VMs from GCP.");
                error.status = 500;
                return callback(error, null);
            }
            return callback(null, vms);
        });
    };

    this.getDisks = function getDisks(callback) {
        gce.getDisks(function(err, disks) {
            if (err) {
                var error = new Error("Failed to get Disks from GCP.");
                error.status = 500;
                return callback(error, null);
            }
            return callback(null, disks);
        });
    };

    this.startVM = function startVM(instance, callback) {
        var zone = gce.zone(instance.zone);
        var vm = zone.vm(instance.name);
        vm.start(function(err, operation, apiResponse) {
            if (err) {
                var error = new Error("Failed to start Instance in GCP.");
                error.status = 500;
                return callback(error, null);
            }
            operation.on('complete', function(metadata) {
                gce.getVMs({
                    filter: "id eq " + metadata.targetId
                }, function(err, data) {
                    if (err) {
                        logger.debug("Error to fetch VM: ", err);
                        var error = new Error("Failed to get VM from GCP.");
                        error.status = 500;
                        return callback(error, null);
                    }
                    if (data && data.length) {
                        var name = data[0].metadata.name;
                        var id = data[0].metadata.id;
                        var status = data[0].metadata.status;
                        var ip = data[0].metadata.networkInterfaces[0].accessConfigs[0].natIP || data[0].metadata.networkInterfaces[0].networkIP;
                        logger.debug("After start : ",ip,status);
                        return callback(null, { "id": id, "name": name, "status": status, "ip": ip, "prvider": params.providers });
                    } else {
                        var error = new Error("No VM found from GCP.");
                        error.status = 404;
                        return callback(error, null);
                    }
                });
            });
        });
    };

    this.stopVM = function stopVM(instance, callback) {
        logger.debug("Stop vm params: ", JSON.stringify(instance));
        var zone = gce.zone(instance.zone);
        var vm = zone.vm(instance.name);
        vm.stop(function(err, operation, apiResponse) {
            if (err) {
                var error = new Error("Failed to stop Instance in GCP.");
                error.status = 500;
                return callback(error, null);
            }
            operation.on('complete', function(metadata) {
                gce.getVMs({
                    filter: "id eq " + metadata.targetId
                }, function(err, data) {
                    if (err) {
                        logger.debug("Error to fetch VM: ", err);
                        var error = new Error("Failed to get VM from GCP.");
                        error.status = 500;
                        return callback(error, null);
                    }
                    if (data && data.length) {
                        var name = data[0].metadata.name;
                        var id = data[0].metadata.id;
                        var status = data[0].metadata.status;
                        var ip = data[0].metadata.networkInterfaces[0].accessConfigs[0].natIP || data[0].metadata.networkInterfaces[0].networkIP;
                        logger.debug("After stop : ",ip,status);
                        return callback(null, { "id": id, "name": name, "status": status, "ip": ip, "prvider": params.providers });
                    } else {
                        var error = new Error("No VM found from GCP.");
                        error.status = 404;
                        return callback(error, null);
                    }
                });
            });
        });
    };

    this.deleteVM = function stopVM(instance, callback) {
        logger.debug("Stop vm params: ", JSON.stringify(instance));
        var zone = gce.zone(instance.zone);
        var vm = zone.vm(instance.name);
        vm.delete(function(err, operation, apiResponse) {
            if (err) {
                var error = new Error("Failed to delete Instance in GCP.");
                error.status = 500;
                return callback(error, null);
            }
            operation.on('complete', function(data) {
                logger.debug("Deleted instance response: ", JSON.stringify(data));
                return callback(null, data);
            });
        });
    };
};

module.exports = GCP;
