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

const errorType = 'schedulerService';

var schedulerService = module.exports = {};
var cronTab = require('node-crontab');
var instancesDao = require('_pr/model/classes/instance/instance');
var async = require('async');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var EC2 = require('_pr/lib/ec2.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var appConfig = require('_pr/config');
var Cryptography = require('../lib/utils/cryptography');
var catalystSync = null;
var vmWareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var vmWare = require('_pr/lib/vmware');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var azureCloud = require('_pr/lib/azure');
var fs = require('fs');
var providerService = require('_pr/services/providerService.js');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var GCP = require('_pr/lib/gcp.js');

schedulerService.executeSchedulerForInstances = function executeSchedulerForInstances(instance,callback) {
    logger.debug("Instance Scheduler is started for Instance. "+instance.platformId);
    logger.debug("Instance current state is  "+instance.instanceState);
    var catUser = 'superadmin';
    if(instance.catUser){
        catUser = instance.catUser;
    }
    async.parallel({
        instanceStart : function(callback){
            var resultList = [];
            for (var i = 0; i < instance.instanceStartScheduler.length; i++) {
                (function(interval){
                    resultList.push(function(callback){createCronJob(interval.cronPattern,instance._id,catUser,'Start',callback)});
                })(instance.instanceStartScheduler[i])
            }
            if(resultList.length === instance.instanceStartScheduler.length) {
                async.parallel(resultList, function (err, results) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    }
                    callback(null, results);
                    return;
                })
            }
        },
        instanceStop : function(callback){
            var resultList = [];
            for (var j = 0; j < instance.instanceStopScheduler.length; j++) {
                (function(interval){
                    resultList.push(function(callback){createCronJob(interval.cronPattern,instance._id,catUser,'Stop',callback)});
                })(instance.instanceStopScheduler[j]);
            }
            if(resultList.length === instance.instanceStopScheduler.length){
                async.parallel(resultList, function (err, results) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    }
                    callback(null, results);
                    return;
                })
            }
        }
    },function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })
}

schedulerService.startStopInstance= function startStopInstance(instanceId,catUser,action,callback){
    logger.debug(action+ " is Starting");
    async.waterfall([
        function(next){
            instancesDao.getInstanceById(instanceId, next);
        },
        function(instanceDetails,next){
            var currentDate = new Date();
            if(instanceDetails[0].instanceState === 'terminated'){
                callback({
                    errCode:201,
                    errMsg:"Instance is already in "+instanceDetails[0].instanceState+" state. So no need to do any action."
                })
                return;
            }else if (instanceDetails[0].isScheduled && instanceDetails[0].isScheduled === true && currentDate >= instanceDetails[0].schedulerEndOn) {
                instancesDao.updateInstanceScheduler(instanceDetails[0]._id,function(err, updatedData) {
                    if (err) {
                        logger.error("Failed to update Instance Scheduler: ", err);
                        next(err,null);
                        return;
                    }
                    logger.debug("Scheduler is ended on for Instance. "+instanceDetails[0].platformId);
                    next(null,updatedData);
                    return;
                });
            }else if(!instanceDetails[0].providerId){
                var error = new Error("Provider is not associated with Instance.");
                error.status = 500;
                next(error, null);
                return;
            }else{
                startStopManagedInstance(instanceDetails[0],catUser,action,next);
            }
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        logger.debug(action+ " is Completed");
        callback(null,results);
        return;
    })
}

function startStopManagedInstance(instance,catUser,action,callback){
    var actionStartLog = '',actionCompleteLog='',actionFailedLog='',vmWareAction='',instanceState='';
    if(action === 'Start'){
        actionStartLog = 'Instance Starting';
        actionCompleteLog = 'Instance Started';
        actionFailedLog='Unable to start instance';
        vmWareAction='poweron';
        instanceState='running';
    }else if(action === 'Stop'){
        actionStartLog = 'Instance Stopping';
        actionCompleteLog = 'Instance Stopped';
        actionFailedLog='Unable to stop instance';
        vmWareAction='poweroff';
        instanceState='stopped';
    }else{
        logger.debug("Action is not matched for corresponding operation. "+action);
        callback(null,null);
    }
    if(instanceState !== '' && instanceState === instance.instanceState){
        callback({
            errCode:201,
            errMsg:"Instance is already in "+instanceState+" state. So no need to do same action again"
        })
        return;
    }
    var instanceLog = {
        actionId: "",
        instanceId: instance._id,
        orgName: instance.orgName,
        bgName: instance.bgName,
        projectName: instance.projectName,
        envName: instance.environmentName,
        status: instance.instanceState,
        actionStatus: "pending",
        platformId: instance.platformId,
        blueprintName: instance.blueprintData.blueprintName,
        data: instance.runlist,
        platform: instance.hardware.platform,
        os: instance.hardware.os,
        size: instance.instanceType,
        user: catUser,
        createdOn: new Date().getTime(),
        startedOn: new Date().getTime(),
        providerType: instance.providerType,
        action: action,
        logs: []
    };
    var timestampStarted = new Date().getTime();
    var actionLog = instancesDao.insertStopActionLog(instance._id, catUser, timestampStarted);
    var logReferenceIds = [instance._id];
    if (actionLog) {
        logReferenceIds.push(actionLog._id);
    }
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: false,
        log: actionStartLog,
        timestamp: timestampStarted
    });
    instanceLog.actionId = actionLog._id;
    instanceLog.logs = {
        err: false,
        log: actionStartLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
        }
    });
    if(instance.providerType === 'aws') {
        AWSProvider.getAWSProviderById(instance.providerId, function (err, providerData) {
            if (err) {
                logger.error(err);
                var error = new Error("Unable to find Provider.");
                error.status = 500;
                callback(error, null);
                return;
            }
            function getRegion(callback) {
                if (instance.providerData && instance.providerData.region) {
                    process.nextTick(function () {
                        callback(null, instance.providerData.region);
                    });
                } else {
                    AWSKeyPair.getAWSKeyPairByProviderId(providerData._id, function (err, keyPair) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, keyPair[0].region);
                    });
                }
            }

            getRegion(function (err, region) {
                if (err) {
                    var error = new Error("Error while fetching Keypair.");
                    error.status = 500;
                    callback(error, null);
                    return;
                }
                var ec2;
                if (providerData.isDefault) {
                    ec2 = new EC2({
                        "isDefault": true,
                        "region": region
                    });
                } else {
                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                        cryptoConfig.password);
                    var decryptedAccessKey = cryptography.decryptText(providerData.accessKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    var decryptedSecretKey = cryptography.decryptText(providerData.secretKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    ec2 = new EC2({
                        "access_key": decryptedAccessKey,
                        "secret_key": decryptedSecretKey,
                        "region": region
                    });
                }
                if (action === 'Start') {
                    ec2.startInstance([instance.platformId], function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            ec2.describeInstances([instance.platformId], function (err, instanceData) {
                                if (err) {
                                    logger.error("Hit some error: ", err);
                                    return callback(err, null);
                                }
                                if (instanceData.Reservations.length && instanceData.Reservations[0].Instances.length) {
                                    logger.debug("ip =>", instanceData.Reservations[0].Instances[0].PublicIpAddress);
                                    instancesDao.updateInstanceIp(instance._id, instanceData.Reservations[0].Instances[0].PublicIpAddress, function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance ip err ==>", err);
                                            return callback(err, null);
                                        }
                                        logger.debug('instance ip updated');
                                        logger.debug("Exit get() for /instances/%s/startInstance", instance._id);
                                        callback(null, {
                                            instanceCurrentState: state,
                                            actionLogId: actionLog._id
                                        });
                                        return;
                                    });
                                }
                            });
                        })
                    });
                } else {
                    ec2.stopInstance([instance.platformId], function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            callback(null, {
                                instanceCurrentState: state,
                                actionLogId: actionLog._id
                            });
                            return;
                        })
                    });
                }
            });
        });
    }else if(instance.providerType === 'vmware'){
        vmWareProvider.getvmwareProviderById(instance.providerId, function (err, providerdata) {
            var timestampStarted = new Date().getTime();
            var actionLog = instancesDao.insertStartActionLog(instance._id, catUser, timestampStarted);
            var logReferenceIds = [instance._id];
            if (actionLog) {
                logReferenceIds.push(actionLog._id);
            }
            var vmWareConfig = {
                host: '',
                username: '',
                password: '',
                dc: '',
                serviceHost: ''
            };
            if (providerdata) {
                vmWareConfig.host = providerdata.host;
                vmWareConfig.username = providerdata.username;
                vmWareConfig.password = providerdata.password;
                vmWareConfig.dc = providerdata.dc;
                vmWareConfig.serviceHost = appConfig.vmware.serviceHost;
            } else {
                vmWareConfig = null;
            }
            if (vmWareConfig) {
                var vmWare = new vmWare(vmWareConfig);
                vmWare.startstopVM(vmWareConfig.serviceHost, instance.platformId, vmWareAction, function (err, vmdata) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    } else {
                        checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            callback(null, {
                                instanceCurrentState: instanceState,
                                actionLogId: actionLog._id
                            });
                            return;
                        });
                    }
                });
            }
        })
    }else if(instance.providerType === 'azure'){
        azureProvider.getAzureCloudProviderById(instance.providerId, function (err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ', err);
                callback(err,null);
                return;
            }
            providerdata = JSON.parse(providerdata);
            var pemFile = appConfig.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
            var keyFile = appConfig.instancePemFilesDir + providerdata._id + providerdata.keyFileName;
            logger.debug("pemFile path:", pemFile);
            logger.debug("keyFile path:", pemFile);
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var uniqueVal = uuid.v4().split('-')[0];
            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function (err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    callback(err,null);
                    return;
                }
                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function (err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        callback(err,null);
                        return;
                    }
                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile
                    };
                    var azureCloud = new azureCloud(options);
                    if(action === 'Start') {
                        azureCloud.startVM(instance.chefNodeName, function (err, currentState) {
                            if (err) {
                                checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                    callback(err, null);
                                    return;
                                })
                            }
                            checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                }
                                callback(null, {
                                    instanceCurrentState: instanceState,
                                    actionLogId: actionLog._id
                                });
                                fs.unlink(decryptedPemFile, function (err) {
                                    logger.debug("Deleting decryptedPemFile..");
                                    if (err) {
                                        logger.error("Error in deleting decryptedPemFile..");
                                    }
                                    fs.unlink(decryptedKeyFile, function (err) {
                                        logger.debug("Deleting decryptedKeyFile ..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedKeyFile..");
                                        }
                                    });
                                });
                                return;
                            })
                        });
                    }else{
                        azureCloud.shutDownVM(instance.chefNodeName, function (err, currentState) {
                            if (err) {
                                checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                    callback(err, null);
                                    return;
                                });
                            }
                            checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                }
                                callback(null, {
                                    instanceCurrentState: instanceState,
                                    actionLogId: actionLog._id
                                });
                                fs.unlink(decryptedPemFile, function (err) {
                                    logger.debug("Deleting decryptedPemFile..");
                                    if (err) {
                                        logger.error("Error in deleting decryptedPemFile..");
                                    }
                                    fs.unlink(decryptedKeyFile, function (err) {
                                        logger.debug("Deleting decryptedKeyFile ..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedKeyFile..");
                                        }
                                    });
                                });
                                return;
                            });
                        });
                    }
                });
            });
        })
    }else if(instance.providerType === 'gcp'){
        providerService.getProvider(instance.providerId, function (err, provider) {
            if (err) {
                var error = new Error("Error while fetching Provider.");
                error.status = 500;
                callback(error, null);
                return;
            }
            var gcpProvider = new gcpProviderModel(provider);
            // Get file from provider decode it and save, after use delete file
            // Decode file content with base64 and save.
            var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
            fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded);
            var params = {
                "projectId": gcpProvider.providerDetails.projectId,
                "keyFilename": '/tmp/' + provider.id + '.json'
            }
            var gcp = new GCP(params);
            var gcpParam = {
                "zone": data[0].zone,
                "name": data[0].name
            }
            if(action === 'Start') {
                gcp.startVM(gcpParam, function (err, vmResponse) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    }
                    checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        instancesDao.updateInstanceIp(instance._id, vmResponse.ip, function (err, updateCount) {
                            if (err) {
                                logger.error("update instance ip err ==>", err);
                                return callback(err, null);
                            }
                            logger.debug('instance ip upadated');
                        });
                        callback(null, {
                            instanceCurrentState: instanceState,
                            actionLogId: actionLog._id
                        });
                        fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                            if (err) {
                                logger.error("Unable to delete json file.");
                            }
                        });
                        return;
                    });
                });
            }else{
                gcp.stopVM(gcpParam, function (err, vmResponse) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    }
                    checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        instancesDao.updateInstanceIp(instance._id, vmResponse.ip, function (err, updateCount) {
                            if (err) {
                                logger.error("update instance ip err ==>", err);
                                return callback(err, null);
                            }
                            logger.debug('instance ip upadated');
                        });
                        callback(null, {
                            instanceCurrentState: instanceState,
                            actionLogId: actionLog._id
                        });
                        fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                            if (err) {
                                logger.error("Unable to delete json file.");
                            }
                        });
                        return;
                    });
                });
            }
        });
    }else{
        checkFailedInstanceAction(logReferenceIds,instanceLog,actionFailedLog,function(err){
            callback(err, null);
            return;
        });
    }
}

function checkFailedInstanceAction(logReferenceIds,instanceLog,actionFailedLog,callback) {
    var timestampEnded = new Date().getTime();
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: true,
        log: actionFailedLog,
        timestamp: timestampEnded
    });
    instancesDao.updateActionLog(logReferenceIds[0], logReferenceIds[1], false, timestampEnded);
    instanceLog.endedOn = new Date().getTime();
    instanceLog.actionId = logReferenceIds[1];
    instanceLog.actionStatus = "failed";
    instanceLog.logs = {
        err: true,
        log: actionFailedLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(logReferenceIds[1], logReferenceIds[0], instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
        }
    });
    var error = new Error({
        actionLogId: logReferenceIds[1]
    });
    error.status = 500;
    callback(error, null);
    return;
}

function checkSuccessInstanceAction(logReferenceIds,instanceState,instanceLog,actionCompleteLog,callback){
    instancesDao.updateInstanceState(logReferenceIds[0], instanceState, function (err, updateCount) {
        if (err) {
            logger.error("update instance state err ==>", err);
            return callback(err, null);
        }
        logger.debug('instance state upadated');
    });
    var timestampEnded = new Date().getTime()
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: false,
        log: actionCompleteLog,
        timestamp: timestampEnded
    });
    instancesDao.updateActionLog(logReferenceIds[0], logReferenceIds[1], true, timestampEnded);
    instanceLog.endedOn = new Date().getTime();
    instanceLog.status = instanceState;
    instanceLog.actionStatus = "success";
    instanceLog.logs = {
        err: false,
        log: actionCompleteLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(logReferenceIds[1], logReferenceIds[0], instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
            callback(err,null);
        }
        callback(null,logData);
    });
}

function createCronJob(cronPattern,instanceId,catUser,action,callback){
    var schedulerService = require('_pr/services/schedulerService');
    var cronJobId = cronTab.scheduleJob(cronPattern, function () {
        schedulerService.startStopInstance(instanceId, catUser, action, function (err, data) {
            if (err) {
                callback(err, null);
            }
            callback(null, cronJobId);
        });
    });
}


