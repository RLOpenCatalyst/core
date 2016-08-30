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
var blueprintModel = require('_pr/model/blueprint');
var compositeBlueprintModel = require('_pr/model/composite-blueprints');
var blueprintFrameModel = require('_pr/model/blueprint-frame');
var events = require('events');
var async = require('async');

// Launch dependencies
var Chef = require('_pr/lib/chef.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');

var utils = require('_pr/model/classes/utils/utils.js');
var nexus = require('_pr/lib/nexus.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var EC2 = require('_pr/lib/ec2.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var InstanceBlueprint = require('_pr/model/blueprint/blueprint-types/instance-blueprint/instance-blueprint');

var appConfig = require('_pr/config');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');

const errorType = 'composite-blueprints';

var compositeBlueprintService = module.exports = {};

compositeBlueprintService.SUCCESS_EVENT = 'success';
compositeBlueprintService.FAILED_EVENT = 'failed';

compositeBlueprintService.checkCompositeBlueprintAccess
    = function checkCompositeBlueprintAccess(orgs, compositeBlueprintId, callback) {
    compositeBlueprintService.getCompositeBlueprint(compositeBlueprintId, function(err, compositeBlueprint) {
        if (err) {
            return callback(err);
        }

        var authorized = orgs.reduce(function(a, b) {
            if (b == compositeBlueprint.organizationId)
                return true || a;
            else
                return false || a;
        }, false);

        if (!authorized) {
            var err = new Error('Forbidden. Access denied to delete composite blueprint');
            err.status = 403;
            return callback(err);
        } else {
            return callback(null, compositeBlueprint);
        }
    });
};

compositeBlueprintService.checkCompositeBlueprintsAccess
    = function checkCompositeBlueprintsAccess(orgIds, compositeBlueprintIds, callback) {
    var query = {
        '_id': {'$in': compositeBlueprintIds},
        'organizationId': {'$in': orgIds}
    };

    compositeBlueprintModel.countByQuery(query, function(err, compositeBlueprintsCount) {
        if (err) {
            return callback(err);
        }

        console.log(compositeBlueprintsCount);
        var authorized = (compositeBlueprintsCount == compositeBlueprintIds.length);

        if (!authorized) {
            var err = new Error('Forbidden. Access denied to delete all composite blueprints specified');
            err.status = 403;
            return callback(err);
        } else {
            return callback(null, compositeBlueprintIds);
        }
    });
};

compositeBlueprintService.populateComposedBlueprints
    = function populateComposedBlueprints(compositeBlueprint, callback) {
    if (!('blueprints' in compositeBlueprint)) {
        return callback(null, compositeBlueprint);
    }

    //@TODO allowed length should be read from config
    if (compositeBlueprint.blueprints.length <= 0 || compositeBlueprint.blueprints.length > 5) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    var blueprintsMap = {};
    for (var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function(blueprint) {
            blueprintsMap[blueprint.id] = i;
        })(compositeBlueprint.blueprints[i]);
    }

    blueprintModel.getByIds(Object.keys(blueprintsMap), function(err, blueprints) {
        if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (blueprints.length != compositeBlueprint.blueprints.length) {
            logger.error(err);
            var err = new Error('Bad Request');
            err.status = 400;
            return callback(err);
        } else {
            for (var j = 0; j < blueprints.length; j++) {
                (function(blueprintEntry) {
                    var tempBlueprint = blueprintEntry;
                    tempBlueprint.blueprintConfig.infraManagerData.versionsList[0].attributes
                        = compositeBlueprint.blueprints[blueprintsMap[blueprintEntry._id]].attributes;
                    compositeBlueprint.blueprints[blueprintsMap[blueprintEntry._id]] = tempBlueprint;
                })(blueprints[j]);
            }

            return callback(null, compositeBlueprint);
        }
    });
};

compositeBlueprintService.validateCompositeBlueprintCreateRequest
    = function validateCompositeBlueprintCreateRequest(compositeBlueprint, callback) {
    if (!('blueprints' in compositeBlueprint)) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    //@TODO allowed length should be read from config
    if (compositeBlueprint.length <= 0 || compositeBlueprint.length > 5) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    //@TODO Check against supported blueprint types and cloud provider types
    var blueprintType = compositeBlueprint.blueprints[0].blueprintType;
    var providerId = compositeBlueprint.blueprints[0].blueprintConfig.cloudProviderId;

    for (var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function(blueprint) {
            if ((blueprint.blueprintType != blueprintType)
                || (blueprint.blueprintConfig.cloudProviderId != providerId)) {
                var err = new Error('Bad Request');
                err.status = 400;
                return callback(err);
            }
        })(compositeBlueprint.blueprints[i]);
    }

    return callback(null, compositeBlueprint);
};

compositeBlueprintService.createCompositeBlueprint
    = function createCompositeBlueprint(compositeBlueprint, callback) {
    compositeBlueprintModel.createNew(compositeBlueprint, function(err, compositeBlueprint) {
        //@TODO To be generalized
        if (err && err.name == 'ValidationError') {
            logger.error(err);
            var err = new Error('Bad Request');
            err.status = 400;
            return callback(err);
        } else if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else {
            return callback(null, compositeBlueprint);
        }
    });
};

compositeBlueprintService.getCompositeBlueprint
    = function getCompositeBlueprint(compositeBlueprintId, callback) {
    compositeBlueprintModel.getById(compositeBlueprintId, function(err, compositeBlueprint) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!compositeBlueprint) {
            var err = new Error('Composite blueprint not found');
            err.status = 404;
            return callback(err);
        } else if (compositeBlueprint) {
            return callback(null, compositeBlueprint);
        }
    });
};

// @TODO authorization based on user organization should be handled
compositeBlueprintService.getCompositeBlueprintsList
    = function getCompositeBlueprintsList(userOrganizationIds, filterParameters, callback) {
    var query = {};

    compositeBlueprintModel.getAll(filterParameters, function(err, compositeBlueprints) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (compositeBlueprints) {
            return callback(null, compositeBlueprints);
        }
    });
};

compositeBlueprintService.updateCompositeBlueprint
    = function updateCompositeBlueprint(compositeBlueprint, updateFields, callback) {
    var fields = {};
    if ('name' in updateFields) {
        fields.name = updateFields.name;
        compositeBlueprint.name = updateFields.name;
    }

    if ('blueprints' in updateFields) {
        fields.blueprints = updateFields.blueprints;
        compositeBlueprint.blueprints = updateFields.blueprints;
    }

    compositeBlueprintModel.updateById(compositeBlueprint._id, fields, function(err, result) {
        if (err || !result) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else if (result) {
            callback(null, compositeBlueprint);
        }
    });
};

// @TODO State of blueprintframes to be accounted for while developing blueprintframe state APIs
compositeBlueprintService.deleteCompositeBlueprint
    = function deleteCompositeBlueprint(compositeBlueprintId, callback) {
    compositeBlueprintModel.deleteById(compositeBlueprintId, function(err, deleted) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!deleted) {
            var err = new Error('Composite blueprint not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

compositeBlueprintService.deleteCompositeBlueprints
    = function deleteCompositeBlueprints(compositeBlueprintIds, callback) {
    compositeBlueprintModel.deleteAll(compositeBlueprintIds, function(err, deleted) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!deleted) {
            var err = new Error('Composite blueprints not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

compositeBlueprintService.formatCompositeBlueprint
    = function formatCompositeBlueprint(compositeBlueprint, callback) {
    var compositeBlueprintObject = {
        id: compositeBlueprint.id,
        name: compositeBlueprint.name,
        organization: compositeBlueprint.organization,
        businessGroup: compositeBlueprint.businessGroup,
        project: compositeBlueprint.project,
        blueprints: compositeBlueprint.blueprints
    };

    if (!('blueprints' in compositeBlueprint)) {
        var err = new Error('Formatting error');
        err.status = 400;
        return callback(err);
    }

    /*for(var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function (blueprint) {
            blueprint.id = blueprint._id;
            delete blueprint._id;
            compositeBlueprintObject.blueprints[i] =  blueprint;
        })(compositeBlueprint.blueprints[i]);
    }*/

    callback(null, compositeBlueprintObject);
};

compositeBlueprintService.formatCompositeBlueprintsList
    = function formatCompositeBlueprintsList(ownerUpdatedList, compositeBlueprints, callback) {
    var compositeBlueprintsList = [];

    if (ownerUpdatedList.length == 0)
        return callback(null, {compositeBlueprints: {}, metadata: compositeBlueprints.metaData});

    for (var i = 0; i < ownerUpdatedList.length; i++) {
        (function(compositeBlueprint) {
            compositeBlueprintService.formatCompositeBlueprint(compositeBlueprint,
                function(err, formattedCompositeBlueprint) {
                    if (err) {
                        return callback(err);
                    } else {
                        compositeBlueprintsList.push(formattedCompositeBlueprint);
                    }

                    if (compositeBlueprintsList.length == ownerUpdatedList.length) {
                        var compositeBlueprintsListObject = {
                            'compositeBlueprints': compositeBlueprintsList,
                            'metadata': compositeBlueprints.metaData
                        };
                        return callback(null, compositeBlueprintsListObject);
                    }
                });
        })(ownerUpdatedList[i]);
    }
};

compositeBlueprintService.launchComposedBlueprint
    = function launchComposedBlueprint(blueprintFrameId, blueprint, environmentId, userName) {
    var options = {
        blueprintFrameId: blueprintFrameId,
        envId: environmentId,
        ver: blueprint.version,
        stackName: null,
        sessionUser: userName
    };
    compositeBlueprintService.launch(blueprint, options, function(err, launchData) {
        if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return;
        }
    });
};

// @TODO FSM module should be generic
compositeBlueprintService.createBlueprintFrame
    = function createBlueprintFrame(compositeBlueprint, environmentId, userName, callback) {
    if ((compositeBlueprint == null) || !('blueprints' in compositeBlueprint)) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    var stateMap = {};
    for (var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function(i) {
            var blueprint = compositeBlueprint.blueprints[i];
            stateMap[blueprint._id] = {};
            stateMap[blueprint._id].blueprint = blueprint;
            stateMap[blueprint._id].instances = [];

            stateMap[blueprint._id].transitions = {};
            if (i + 1 < compositeBlueprint.blueprints.length) {
                stateMap[blueprint._id].transitions['success'] = compositeBlueprint.blueprints[i + 1]._id;
                stateMap[blueprint._id].transitions['failed'] = null;
            } else {
                stateMap[blueprint._id].transitions['failed'] = null;
                stateMap[blueprint._id].transitions['success'] = '#';
            }
        })(i);
    }

    var blueprintFrame = {
        environmentId: environmentId,
        compositeBlueprintId: compositeBlueprint._id,
        blueprintOwnerName: userName,
        state: compositeBlueprint.blueprints[0]._id,
        stateMap: stateMap
    };
    blueprintFrameModel.createNew(blueprintFrame, function(err, blueprintFrame) {
        //@TODO To be generalized
        if (err && err.name == 'ValidationError') {
            logger.error(err);
            var err = new Error('Bad Request');
            err.status = 400;
            return callback(err);
        } else if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else {
            compositeBlueprintService.launchComposedBlueprint(blueprintFrame._id,
                compositeBlueprint.blueprints[0], environmentId, userName);
            return callback(null, blueprintFrame);
        }
    });
};

//@TODO Design of event handler to be improved
compositeBlueprintService.getCompositeBlueprintEventEmitter = function getCompositeBlueprintEventEmitter() {
    var eventEmitter = new events.EventEmitter();

    eventEmitter.on(compositeBlueprintService.SUCCESS_EVENT,
        compositeBlueprintService.successEventHandler);
    eventEmitter.on(compositeBlueprintService.FAILED_EVENT,
        compositeBlueprintService.failedEventHandler);

    return eventEmitter;
};

compositeBlueprintService.successEventHandler = function successEventHandler(eventData) {
    if (!'blueprintFrameId' in eventData) {
        logger.error('Event data is invalid');
        return;
    }

    blueprintFrameModel.getById(eventData.blueprintFrameId, function(err, blueprintFrame) {
        if (err) {
            logger.error('Internal Server Error');
        } else if (!blueprintFrame) {
            logger.error('Blueprint frame not found');
        } else if (blueprintFrame) {
            // State transition
            if ('instances' in eventData) {
                blueprintFrame.stateMap[blueprintFrame.state].instances = eventData.instances;
            }

            blueprintFrame.state
                = blueprintFrame.stateMap[blueprintFrame.state].transitions[compositeBlueprintService.SUCCESS_EVENT];

            if (blueprintFrame.state != '#') {
                compositeBlueprintService.launchComposedBlueprint(blueprintFrame._id,
                    blueprintFrame.stateMap[blueprintFrame.state].blueprint,
                    blueprintFrame.environmentId, blueprintFrame.blueprintOwnerName);
            }

            blueprintFrame.save();
        }
    });
};

compositeBlueprintService.failedEventHandler = function failedEventHandler(eventData) {
    if (!'blueprintFrameId' in eventData) {
        logger.error('Event data is invalid');
        return;
    }

    blueprintFrameModel.getById(eventData.blueprintFrameId, function(err, blueprintFrame) {
        if (err) {
            logger.error('Internal Server Error');
        } else if (!blueprintFrame) {
            logger.error('Blueprint frame not found');
        } else if (blueprintFrame) {
            // State transition
            if ('instances' in eventData) {
                blueprintFrame.stateMap[blueprintFrame.state].instances = eventData.instances;
            }

            blueprintFrame.state = null;
            blueprintFrame.save();
        }
    });
};

// Code duplicated to support events
// @TODO To be refactored
compositeBlueprintService.launch = function launch(blueprint, opts, callback) {
    var infraManager = {
        infraMangerType: blueprint.blueprintConfig.infraManagerType,
        infraManagerId: blueprint.blueprintConfig.infraManagerId,
        infraManagerData: blueprint.blueprintConfig.infraManagerData
    };
    var self = blueprint;
    masterUtil.getParticularProject(self.projectId, function(err, project) {
        if (err) {
            callback({
                message: "Failed to get project via project id"
            }, null);
            return;
        };
        if (project.length === 0) {
            callback({
                "message": "Unable to find Project Information from project id"
            });
            return;
        }
        configmgmtDao.getEnvNameFromEnvId(opts.envId, function(err, envName) {
            if (err) {
                callback({
                    message: "Failed to get env name from env id"
                }, null);
                return;
            };
            if (!envName) {
                callback({
                    "message": "Unable to find environment name from environment id"
                });
                return;
            };
            configmgmtDao.getChefServerDetails(infraManager.infraManagerId, function(err, chefDetails) {
                if (err) {
                    logger.error("Failed to getChefServerDetails", err);
                    callback({
                        message: "Failed to getChefServerDetails"
                    }, null);
                    return;
                };
                if (!chefDetails) {
                    logger.error("No CHef Server Detailed available.", err);
                    callback({
                        message: "No Chef Server Detailed available"
                    }, null);
                    return;
                };
                var chef = new Chef({
                    userChefRepoLocation: chefDetails.chefRepoLocation,
                    chefUserName: chefDetails.loginname,
                    chefUserPemFile: chefDetails.userpemfile,
                    chefValidationPemFile: chefDetails.validatorpemfile,
                    hostedChefUrl: chefDetails.url
                });
                logger.debug('Chef Repo Location = ', chefDetails.chefRepoLocation);
                // var blueprintConfigType = getBlueprintConfigType(self);
                if (!self.appUrls) {
                    self.appUrls = [];
                }
                var appUrls = self.appUrls;
                if (appConfig.appUrls && appConfig.appUrls.length) {
                    appUrls = appUrls.concat(appConfig.appUrls);
                }
                chef.getEnvironment(envName, function(err, env) {
                    if (err) {
                        logger.error("Failed chef.getEnvironment", err);
                        callback(err, null);
                        return;
                    }
                    var launchOptions = {
                        infraManager: chef,
                        ver: opts.ver,
                        envName: envName,
                        envId: opts.envId,
                        stackName: opts.stackName,
                        blueprintName: self.name,
                        orgId: self.orgId,
                        orgName: project[0].orgname,
                        bgId: self.bgId,
                        bgName: project[0].productgroupname,
                        projectId: self.projectId,
                        projectName: project[0].projectname,
                        appUrls: appUrls,
                        sessionUser: opts.sessionUser,
                        users: self.users
                    };
                    launchOptions.blueprintData = new blueprintModel(self);

                    if ('blueprintFrameId' in opts) {
                        launchOptions.blueprintFrameId = opts.blueprintFrameId;
                    }

                    compositeBlueprintService.launchAWSBlueprint(blueprint,
                        launchOptions,
                        function(err, launchData) {
                            callback(err, launchData);
                        });
                });
            });
        });
    });
};

// Code duplicated to support events
// @TODO To be refactored
compositeBlueprintService.launchAWSBlueprint = function launchAWSBlueprint(blueprint, launchParams, callback) {
    var self = blueprint.blueprintConfig.cloudProviderData;
    var compositeBlueprintEventEmitter = compositeBlueprintService.getCompositeBlueprintEventEmitter();
    var eventData = {
        'blueprintFrameId': launchParams.blueprintFrameId,
        'instances': []
    };

    VMImage.getImageById(self.imageId, function(err, anImage) {
        if (err) {
            logger.error(err);
            compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
            callback({
                message: "db-error"
            });
            return;
        }
        logger.debug("Loaded Image -- : >>>>>>>>>>> %s", anImage.providerId);
        // //determining osType and decrypting the password field if windows found
        // if(anImage.osType === 'windows'){
        //     anImage.instancePassword =
        // }


        AWSProvider.getAWSProviderById(anImage.providerId, function(err, aProvider) {
            if (err) {
                logger.error(err);
                compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                callback({
                    message: "db-error"
                });
                return;
            }
            if (!aProvider) {
                compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                callback({
                    message: "Unable to fetch provider from DB"
                });
                return;
            }
            AWSKeyPair.getAWSKeyPairById(self.keyPairId, function(err, aKeyPair) {
                if (err) {
                    logger.error(err);
                    compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                    callback({
                        message: "db-error"
                    });
                    return;
                }

                var awsSettings;
                if (aProvider.isDefault) {
                    awsSettings = {
                        "isDefault": true,
                        "region": aKeyPair.region,
                        "keyPairName": aKeyPair.keyPairName
                    };
                } else {
                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                        cryptoConfig.password);

                    var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                    awsSettings = {
                        "access_key": decryptedAccessKey,
                        "secret_key": decryptedSecretKey,
                        "region": aKeyPair.region,
                        "keyPairName": aKeyPair.keyPairName
                    };
                }

                logger.debug("Enter launchInstance -- ");
                // New add
                //var encryptedPemFileLocation= currentDirectory + '/../catdata/catalyst/provider-pemfiles/';

                var settings = appConfig;
                //encrypting default pem file
                var cryptoConfig = appConfig.cryptoSettings;
                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

                //setting instance credentials when windows box is used.
                var encrptedPassword;
                var encryptedPemFileLocation;
                if (anImage.instancePassword && anImage.instancePassword.length) {
                    encrptedPassword = anImage.instancePassword;
                } else {
                    encryptedPemFileLocation = settings.instancePemFilesDir + aKeyPair._id;
                }

                var securityGroupIds = [];
                for (var i = 0; i < self.securityGroupIds.length; i++) {
                    securityGroupIds.push(self.securityGroupIds[i]);
                }

                logger.debug("encryptFile of %s successful", encryptedPemFileLocation);

                var ec2 = new EC2(awsSettings);
                //Used to ensure that there is a default value of "1" in the count.
                if (!self.instanceCount) {
                    self.instanceCount = "1";
                }
                var paramRunList = [];
                var paramAttributes = [];
                if (blueprint.blueprintConfig.infraManagerData.versionsList.length > 0) {
                    if ('runlist' in blueprint.blueprintConfig.infraManagerData.versionsList[0])
                        paramRunList = blueprint.blueprintConfig.infraManagerData.versionsList[0].runlist;

                    if ('attributes' in blueprint.blueprintConfig.infraManagerData.versionsList[0])
                        paramAttributes = blueprint.blueprintConfig.infraManagerData.versionsList[0].attributes;
                }

                ec2.launchInstance(anImage.imageIdentifier, self.instanceType, securityGroupIds, self.subnetId, 'D4D-' + launchParams.blueprintName, aKeyPair.keyPairName, self.instanceCount, function(err, instanceDataAll) {
                    if (err) {
                        logger.error("launchInstance Failed >> ", err);
                        compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                        callback({
                            message: "Instance Launched Failed"
                        });
                        return;
                    }


                    var newinstanceIDs = [];

                    function addinstancewrapper(instanceData, instancesLength) {
                        logger.debug('Entered addinstancewrapper ++++++' + instancesLength);
                        var instance = {
                            name: launchParams.blueprintName,
                            orgId: launchParams.orgId,
                            orgName: launchParams.orgName,
                            bgId: launchParams.bgId,
                            bgName: launchParams.bgName,
                            projectId: launchParams.projectId,
                            projectName: launchParams.projectName,
                            envId: launchParams.envId,
                            environmentName: launchParams.envName,
                            providerId: blueprint.blueprintConfig.cloudProviderId,
                            providerType: blueprint.blueprintConfig.cloudProviderType,
                            keyPairId: self.keyPairId,
                            region: aKeyPair.region,
                            chefNodeName: instanceData.InstanceId,
                            runlist: paramRunList,
                            attributes: paramAttributes,
                            platformId: instanceData.InstanceId,
                            appUrls: launchParams.appUrls,
                            instanceIP: instanceData.PublicIpAddress || null,
                            instanceState: instanceData.State.Name,
                            bootStrapStatus: 'waiting',
                            users: launchParams.users,
                            hardware: {
                                platform: 'unknown',
                                platformVersion: 'unknown',
                                architecture: 'unknown',
                                memory: {
                                    total: 'unknown',
                                    free: 'unknown',
                                },
                                os: self.instanceOS
                            },
                            vpcId: instanceData.VpcId,
                            subnetId: instanceData.SubnetId,
                            privateIpAddress: instanceData.PrivateIpAddress,
                            credentials: {
                                username: anImage.userName,
                                pemFileLocation: encryptedPemFileLocation,
                                password: encrptedPassword
                            },
                            chef: {
                                serverId: blueprint.blueprintConfig.infraManagerId,
                                chefNodeName: instanceData.InstanceId
                            },
                            blueprintData: {
                                blueprintId: launchParams.blueprintData.id,
                                blueprintName: launchParams.blueprintData.name,
                                templateId: launchParams.blueprintData.templateId,
                                templateType: launchParams.blueprintData.templateType,
                                templateComponents: launchParams.blueprintData.templateComponents,
                                iconPath: launchParams.blueprintData.iconpath
                            }
                        };

                        logger.debug('Creating instance in catalyst');
                        instancesDao.createInstance(instance, function(err, data) {
                            if (err) {
                                logger.error("Failed to create Instance", err);
                                compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                                callback({
                                    message: "Failed to create instance in DB"
                                });
                                return;
                            }
                            var timestampStarted = new Date().getTime();
                            instance = data;
                            instance.id = data._id;
                            var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, launchParams.sessionUser, timestampStarted);
                            var instanceLog = {
                                actionId: actionLog._id,
                                instanceId: instance.id,
                                orgName: launchParams.orgName,
                                bgName: launchParams.bgName,
                                projectName: launchParams.projectName,
                                envName: launchParams.envName,
                                status: instanceData.State.Name,
                                actionStatus: "waiting",
                                platformId: instanceData.InstanceId,
                                blueprintName: launchParams.blueprintData.name,
                                data: paramRunList,
                                platform: "unknown",
                                os: self.instanceOS,
                                size: self.instanceType,
                                user: launchParams.sessionUser,
                                startedOn: new Date().getTime(),
                                createdOn: new Date().getTime(),
                                providerType: blueprint.blueprintConfig.cloudProviderType,
                                action: "Bootstrap",
                                logs: [{
                                    err: false,
                                    log: "Starting instance",
                                    timestamp: new Date().getTime()
                                }]
                            };

                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            
                            //Returning handle when all instances are created
                            newinstanceIDs.push(instance.id);
                            logger.debug('Lengths ---- ' + newinstanceIDs.length + '  ' + instancesLength);
                            if (newinstanceIDs.length >= instancesLength) {
                                callback(null, {
                                    "id": newinstanceIDs,
                                    "message": "instance launch success"
                                });
                            }

                            var logsReferenceIds = [instance.id, actionLog._id];
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: "Starting instance",
                                timestamp: timestampStarted
                            });
                            //For windows instance handle another check..

                            ec2.waitForInstanceRunnnigState(instance.platformId, function(err, instanceData) {
                                if (err) {
                                    var timestamp = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Instance ready state wait failed. Unable to bootstrap",
                                        timestamp: timestamp
                                    });
                                    logger.error("waitForInstanceRunnnigState returned an error  >>", err);
                                    instanceLog.logs = {
                                        err: true,
                                        log: "Instance ready state wait failed. Unable to bootstrap",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLog.actionStatus = "failed";
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    return;
                                }
                                logger.debug("Enter waitForInstanceRunnnigState :", instanceData);
                                instance.instanceIP = instanceData.PublicIpAddress || instanceData.PrivateIpAddress;
                                instancesDao.updateInstanceIp(instance.id, instance.instanceIP, function(err, updateCount) {
                                    if (err) {
                                        logger.error("instancesDao.updateInstanceIp Failed ==>", err);
                                        return;
                                    }
                                    logger.debug('Instance ip upadated');
                                });

                                instancesDao.updateInstanceState(instance.id, instanceData.State.Name, function(err, updateCount) {
                                    if (err) {
                                        logger.error("error(date instance state err ==>", err);
                                        return;
                                    }
                                    logger.debug('instance state upadated');
                                });

                                logger.debug('waiting for instance');
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: "waiting for instance state to be ok",
                                    timestamp: new Date().getTime()
                                });
                                instanceLog.status = instanceData.State.Name;
                                instanceLog.logs = {
                                    err: false,
                                    log: "waiting for instance state to be ok",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                ec2.waitForEvent(instanceData.InstanceId, 'instanceStatusOk', function(err) {
                                    if (err) {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: "Instance ok state wait failed. Unable to bootstrap",
                                            timestamp: new Date().getTime()
                                        });
                                        logger.error('intance wait failed ==> ', err);
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        return;
                                    }

                                    logger.debug('intance wait success');


                                    //decrypting pem file
                                    var cryptoConfig = appConfig.cryptoSettings;
                                    var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
                                    //cryptography.decryptFile(instance.credentials.pemFileLocation, cryptoConfig.decryptionEncoding, tempUncryptedPemFileLoc, cryptoConfig.encryptionEncoding, function(err) {
                                    credentialcryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {

                                        if (err) {
                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance bootstarp status", err);
                                                } else {
                                                    logger.debug("Instance bootstrap status set to failed");
                                                }
                                            });
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: "Unable to decrpt pem file. Bootstrap failed",
                                                timestamp: timestampEnded
                                            });
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLog.logs = {
                                                err: true,
                                                log: "Unable to decrpt pem file. Bootstrap failed",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                            if (instance.hardware.os != 'windows')
                                                return;
                                        }


                                        var repoData = {};
                                        repoData['projectId'] = launchParams.blueprintData.projectId;
                                        if ('nexus' in launchParams.blueprintData) {
                                            repoData['repoName'] = launchParams.blueprintData.nexus.repoName;
                                        } else if ('docker' in launchParams.blueprintData) {
                                            repoData['repoName'] = launchParams.blueprintData.docker.image;
                                        }

                                        launchParams.blueprintData.getCookBookAttributes(instance, repoData, function(err, jsonAttributes) {
                                            logger.debug("jsonAttributes::::: ", JSON.stringify(jsonAttributes));
                                            var runlist = instance.runlist;
                                            //logger.debug("launchParams.blueprintData.extraRunlist: ", JSON.stringify(launchParams.blueprintData.extraRunlist));
                                            if ('extraRunlist' in launchParams.blueprintData) {
                                                runlist = launchParams.blueprintData.extraRunlist.concat(instance.runlist);
                                            }

                                            //logger.debug("runlist: ", JSON.stringify(runlist));
                                            var bootstrapInstanceParams = {
                                                instanceIp: instance.instanceIP,
                                                pemFilePath: decryptedCredentials.pemFileLocation,
                                                runlist: runlist,
                                                instanceUsername: instance.credentials.username,
                                                nodeName: instance.chef.chefNodeName,
                                                environment: launchParams.envName,
                                                instanceOS: instance.hardware.os,
                                                jsonAttributes: jsonAttributes,
                                                instancePassword: decryptedCredentials.password
                                            };


                                            launchParams.infraManager.bootstrapInstance(bootstrapInstanceParams, function(err, code) {

                                                if (decryptedCredentials.pemFileLocation) {
                                                    fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
                                                        if (err) {
                                                            logger.error("Unable to delete temp pem file =>", err);
                                                        } else {
                                                            logger.debug("temp pem file deleted =>", err);
                                                        }
                                                    });
                                                }


                                                logger.debug('process stopped ==> ', err, code);
                                                if (err) {
                                                    logger.error("knife launch err ==>", err);
                                                    instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {

                                                    });
                                                    instanceLog.endedOn = new Date().getTime();
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: true,
                                                        log: "Bootstrap failed",
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                    var timestampEnded = new Date().getTime();
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: "Bootstrap failed",
                                                        timestamp: timestampEnded
                                                    });
                                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                    eventData.instances = [instance.id];
                                                    compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                                                } else {
                                                    if (code == 0) {
                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
                                                            if (err) {
                                                                logger.error("Unable to set instance bootstarp status. code 0", err);
                                                            } else {
                                                                logger.debug("Instance bootstrap status set to success");
                                                            }
                                                        });
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "success";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: "Instance Bootstraped successfully",
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: false,
                                                            log: "Instance Bootstraped successfully",
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);


                                                        launchParams.infraManager.getNode(instance.chefNodeName, function(err, nodeData) {
                                                            if (err) {
                                                                logger.error("Failed chef.getNode", err);
                                                                return;
                                                            }
                                                            instanceLog.platform = nodeData.automatic.platform;
                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            var hardwareData = {};
                                                            hardwareData.architecture = nodeData.automatic.kernel.machine;
                                                            hardwareData.platform = nodeData.automatic.platform;
                                                            hardwareData.platformVersion = nodeData.automatic.platform_version;
                                                            hardwareData.memory = {
                                                                total: 'unknown',
                                                                free: 'unknown'
                                                            };
                                                            if (nodeData.automatic.memory) {
                                                                hardwareData.memory.total = nodeData.automatic.memory.total;
                                                                hardwareData.memory.free = nodeData.automatic.memory.free;
                                                            }
                                                            hardwareData.os = instance.hardware.os;
                                                            instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
                                                                if (err) {
                                                                    logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                } else {
                                                                    logger.debug("Instance hardware details set successessfully");
                                                                }
                                                            });
                                                            //Checking docker status and updating
                                                            var _docker = new Docker();
                                                            _docker.checkDockerStatus(instance.id,
                                                                function(err, retCode) {
                                                                    if (err) {
                                                                        logger.error("Failed _docker.checkDockerStatus", err);
                                                                        res.send(500);
                                                                        return;
                                                                        //res.end('200');

                                                                    }
                                                                    logger.debug('Docker Check Returned:' + retCode);
                                                                    if (retCode == '0') {
                                                                        instancesDao.updateInstanceDockerStatus(instance.id, "success", '', function(data) {
                                                                            logger.debug('Instance Docker Status set to Success');
                                                                        });

                                                                    }
                                                                });

                                                        });

                                                        eventData.instances = [instance.id];
                                                        compositeBlueprintEventEmitter.emit(compositeBlueprintService.SUCCESS_EVENT, eventData);
                                                    } else {
                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                            if (err) {
                                                                logger.error("Unable to set instance bootstarp status code != 0", err);
                                                            } else {
                                                                logger.debug("Instance bootstrap status set to failed");
                                                            }
                                                        });
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "failed";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: "Bootstrap Failed",
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: false,
                                                            log: "Bootstrap Failed",
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                        eventData.instances = [instance.id];
                                                        compositeBlueprintEventEmitter.emit(compositeBlueprintService.FAILED_EVENT, eventData);
                                                    }
                                                }

                                            }, function(stdOutData) {

                                                instanceLog.logs = {
                                                    err: false,
                                                    log: stdOutData.toString('ascii'),
                                                    timestamp: new Date().getTime()
                                                };
                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });

                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: false,
                                                    log: stdOutData.toString('ascii'),
                                                    timestamp: new Date().getTime()
                                                });

                                            }, function(stdErrData) {

                                                instanceLog.logs = {
                                                    err: true,
                                                    log: stdErrData.toString('ascii'),
                                                    timestamp: new Date().getTime()
                                                };
                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });

                                                //retrying 4 times before giving up.
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: stdErrData.toString('ascii'),
                                                    timestamp: new Date().getTime()
                                                });


                                            });
                                        });


                                    });
                                });
                            });


                        }); //end of create instance.
                    } //end of createinstancewrapper function


                    for (var ic = 0; ic < instanceDataAll.length; ic++) {
                        logger.debug('InstanceDataAll ' + JSON.stringify(instanceDataAll));
                        logger.debug('Length : ' + instanceDataAll.length);
                        addinstancewrapper(instanceDataAll[ic], instanceDataAll.length);
                    }
                });
            });

        });

    });
};
