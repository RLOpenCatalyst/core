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

// This script will clean up appdeploy related all data from DB.

var logger = require('_pr/logger')(module);
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var instancesDao = require('_pr/model/classes/instance/instance');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var Blueprints = require('_pr/model/blueprint');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');

var dboptions = {
    host: appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});

instancesDao.listInstances(function(err, instances) {
    if (err) {
        logger.error("Got error while fetching instance: ", err);
    }
    logger.debug("Got Provider list: ");
    var count = 0;
    if (instances && instances.length) {
        for (var i = 0; i < instances.length; i++) {
            count++;
            instancesDao.getInstanceById(instances[i]._id, function(err, instance) {
                if (err) {
                    logger.error("Failed to fetch Instance: ", err);
                }
                if (instance && instance.length) {
                    var instanceLog = {
                        actionId: "",
                        instanceId: instance[0]._id,
                        orgName: "",
                        bgName: "",
                        projectName: "",
                        envName: "",
                        status: instance[0].instanceState,
                        bootStrap: instance[0].bootStrapStatus,
                        platformId: instance[0].platformId,
                        blueprintName: instance[0].blueprintData.name,
                        data: instance[0].runlist,
                        platform: instance[0].hardware.platform,
                        os: instance[0].hardware.os,
                        size: instance[0].instanceType,
                        user: instance[0].,
                        createdOn: 0,
                        providerType: instance[0].providerType,
                        action: "",
                        logs: []
                    };
                    if (!instance[0].orgName) {
                        d4dModelNew.d4dModelMastersProjects.find({ rowid: instance[0].projectId }, function(err, project) {
                            if (err) {
                                logger.error("Failed to fetch project: ", err);
                            }
                            if (project && project.length) {
                                instance[0].orgName = project[0].orgname[0];
                                instance[0].bgName = project[0].productgroupname;
                                instance[0].projectName = project[0].projectname;
                                d4dModelNew.d4dModelMastersEnvironments.find({ rowid: instance[0].envId }, function(err, env) {
                                    if (err) {
                                        logger.error("Failed to fetch Env: ", err);
                                    }
                                    if (env && env.length) {
                                        instance[0].environmentName = env[0].environmentname;
                                    }

                                    if (!instance[0].instanceType) {
                                        Blueprints.getById(instance[0].blueprintData.blueprintId, function(err, bluePrint) {
                                            if (err) {
                                                logger.error("Failed to fetch bluePrint: ", err);
                                            }
                                            if (bluePrint) {
                                                var instanceType = bluePrint.blueprintConfig.cloudProviderData.instanceType;
                                                instance[0].instanceType = instanceType;
                                                instancesDao.updateInstance(instance[0]._id, instance[0], function(err, insData) {
                                                    if (err) {
                                                        logger.error("Instance update Failed: ", err);
                                                    }
                                                    if (insData) {
                                                        logger.debug("Instance updated successfully: ", JSON.stringify(insData));
                                                    }
                                                });
                                            } else {
                                                instancesDao.updateInstance(instance[0]._id, instance[0], function(err, insData) {
                                                    if (err) {
                                                        logger.error("Instance update Failed: ", err);
                                                    }
                                                    if (insData) {
                                                        logger.debug("Instance updated successfully: ", JSON.stringify(insData));
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        instancesDao.updateInstance(instance[0]._id, instance[0], function(err, insData) {
                                            if (err) {
                                                logger.error("Instance update Failed: ", err);
                                            }
                                            if (insData) {
                                                logger.debug("Instance updated successfully: ", JSON.stringify(insData));
                                            }
                                        });
                                    }
                                });
                            }
                            logger.debug("count: ", count + " instances.length: " + instances.length);
                            if (count == instances.length) {
                                logger.debug("updated..");
                                process.exit();
                            }
                        });
                    } else {
                        logger.debug("No orgName attached to instance.");

                    }
                } else {
                    logger.debug("No Instance to update...");
                }
            });
        }
    } else {
        logger.debug("Nothing to update...");
        process.exit();
    }
});
