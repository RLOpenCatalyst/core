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

schedulerService.executeSchedulerForInstances = function executeSchedulerForInstances(instance,callback) {
    logger.debug("Instance Scheduler is started for Instance. "+instance.platformId);
    async.waterfall([
        function(next) {
            if (instance.cronJobId && instance.cronJobId !== null) {
                cronTab.cancelJob(instance.cronJobId);
                next(null, instance.cronJobId);
            } else {
                next(null, instance.cronJobId);
            }
        },
        function(jobId,next){
            var catUser = 'superadmin';
            if(instance.catUser){
                catUser = instance.catUser;
            }
            if(instance.instanceState === 'running'){
                var stopJobId = cronTab.scheduleJob(instance.instanceStopScheduler.cronPattern, function() {
                    instancesDao.updateInstanceSchedulerCronJobId(instance._id,stopJobId,function(err,data){
                        if(err){
                            logger.error(err);
                        }
                        logger.debug(data);
                    });
                    var schedulerService = require('_pr/services/schedulerService');
                    schedulerService.startStopInstance(instance._id,catUser,'Stop',function(err,data){
                        if(err){
                            cronTab.cancelJob(stopJobId);
                            next(err);
                        }
                        cronTab.cancelJob(stopJobId);
                        next(null,stopJobId);
                    });
                });
            }else if(instance.instanceState === 'stopped'){
                var startJobId = cronTab.scheduleJob(instance.instanceStartScheduler.cronPattern, function() {
                    instancesDao.updateInstanceSchedulerCronJobId(instance._id,startJobId,function(err,data){
                        if(err){
                            logger.error(err);
                        }
                        logger.debug(data);
                    });
                    var schedulerService = require('_pr/services/schedulerService');
                    schedulerService.startStopInstance(instance._id,catUser,'Start',function(err,data){
                        if(err){
                            cronTab.cancelJob(startJobId);
                            next(err);
                        }
                        cronTab.cancelJob(startJobId);
                        next(null,startJobId);
                    });
                });
            }else{
                logger.debug("Instance current state is not match as per scheduler "+instance.instanceState);
                next(null,null);
            }
        },
    ],function(err,results){
        if(err){
            logger.error(err);
            catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
            catalystSync.executeScheduledInstances();
            callback(err,null);
            return;
        }else{
            logger.debug("Instance Scheduler Finished for Instance. "+instance.platformId);
            catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
            catalystSync.executeScheduledInstances();
            callback(null,results);
            return;
        }
    })
}

schedulerService.startStopInstance= function startStopInstance(instanceId,catUser,action,callback){
    async.waterfall([
        function(next){
            instancesDao.getInstanceById(instanceId, next);
        },
        function(instanceDetails,next){
            var currentDate = new Date();
            if (instanceDetails[0].isScheduled && instanceDetails[0].isScheduled === true && currentDate >= instanceDetails[0].schedulerEndOn) {
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
            }else if(instanceDetails[0].providerType ==='aws'){
                startStopAwsInstance(instanceDetails[0],catUser,action,next);
            }
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })

}

function startStopAwsInstance(instance,catUser,action,callback){
    var actionStartLog = '',actionCompleteLog='',actionFailedLog='';
    if(action === 'Start'){
        actionStartLog = 'Instance Starting';
        actionCompleteLog = 'Instance Started';
        actionFailedLog='Unable to start instance'
    }else if(action === 'Stop'){
        actionStartLog = 'Instance Stopping';
        actionCompleteLog = 'Instance Stopped';
        actionFailedLog='Unable to stop instance'
    }else{
        logger.debug("Action is not matched for corresponding operation. "+action);
        callback(null,null);
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
            if(action === 'Start') {
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
            }else{
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
    instanceLog.actionId = logReferenceIds[i];
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