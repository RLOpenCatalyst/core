/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
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
var GCP = require('_pr/lib/gcp.js');
//var blueprintModel = require('_pr/model/v2.0/blueprint/blueprints.js');
var blueprintModel = require('_pr/model/blueprint/blueprint.js');
var providerService = require('./providerService.js');
var async = require('async');
var instanceService = require('./instanceService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var instancesModel = require('_pr/model/classes/instance/instance');
var fs = require('fs');
const errorType = 'blueprint';

var blueprintService = module.exports = {};

blueprintService.getBlueprintById = function getBlueprintById(blueprintId, callback) {
    blueprintModel.findById(blueprintId, function(err, blueprint) {
        if (err) {
            var error = new Error("Error to get blueprint.");
            error.status(404);
            return callback(error, null);
        }
        return callback(null, blueprint);
    });
}

blueprintService.launchBlueprint = function launchBlueprint(blueprint, callback) {
    var networkProfile = blueprint.networkProfile;
    if (networkProfile) {
        var providerId = networkProfile.providerId;

        async.waterfall([
            function(next) {
                providerService.getProviderById(providerId, next);
            },
            function(provider, next) {
                switch (networkProfile.type) {
                    case 'GCP':
                        // Get file from provider decode it and save, after use delete file
                        var filePath = "/home/gobinda/keyFile.json"
                        fs.writeFile('/tmp/'+provider.id+'.json', provider.keyFile, next);
                        var params = {
                            "projectId": provider.projectId,
                            "keyFilename": '/tmp/'+provider.id+'.json'
                        }
                        var gcp = new GCP(params);
                        var launchParams = {
                            "blueprints": blueprint,
                            "networkConfig": networkProfile,
                            "providers": provider
                        }
                        gcp.createVM(launchParams, next);
                        break;
                        defaut:
                            break;
                }
            },
            function(instance, next) {
                var instanceObj = {
                    "blueprint": blueprint,
                    "instance": instance
                }
                instanceService.createInstance(instanceObj, next);
            },
            function(instanceData, next) {
                var timestampStarted = new Date().getTime();
                var actionLog = instancesModel.insertBootstrapActionLog(instanceData.id, instanceData.runlist, instanceData.sessionUser, timestampStarted);
                var logsReferenceIds = [instanceData.id, actionLog._id];
                logsDao.insertLog({
                    referenceId: logsReferenceIds,
                    err: false,
                    log: "Starting instance",
                    timestamp: timestampStarted
                });
                instanceService.bootstrapInstance(instanceData, next);
            }
        ], function(err, results) {
            if (err) {
                logger.error("GCP Blueprint launch failed: " + err);
                next(err);
            } else {
                fs.unlink('/tmp/'+provider.id+'.json');
                next(null, results);
            }
        })
    } else {
        var err = new Error("NetworkProfile not configured in Blueprint.");
        err.status = 404;
        return callback(err, null);
    }
}
