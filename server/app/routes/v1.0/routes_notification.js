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


// This file act as a Controller which contains notification related all end points.


var https = require('https');
var instancesDao = require('_pr/model/classes/instance/instance');
var EC2 = require('_pr/lib/ec2.js');
var Chef = require('_pr/lib/chef.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var usersDao = require('_pr/model/users.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var logger = require('_pr/logger')(module);
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var currentDirectory = __dirname;
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var CloudFormation = require('_pr/model/cloud-formation');
var AwsAutoScaleInstance = require('_pr/model/aws-auto-scale-instance');
var AWSCloudFormation = require('_pr/lib/awsCloudFormation.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var crontab = require('node-crontab');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var VmwareCloud = require('_pr/lib/vmware.js');

var socketIo = require('_pr/socket.io').getInstance();

module.exports.setRoutes = function(app) {
    // setting up socket.io
    var socketCloudFormationAutoScate = socketIo.of('/cloudFormationAutoScaleGroup');

    socketCloudFormationAutoScate.on('connection', function(socket) {
        socket.on('joinCFRoom', function(data) {
            logger.debug('room joined', data);
            socket.join(data.orgId + ':' + data.bgId + ':' + data.projId + ':' + data.envId);
        });

    });



    app.post('/notifications/aws/cfAutoScale', function(req, res) {
        var notificationType = req.headers['x-amz-sns-message-type'];
        var topicArn = req.headers['x-amz-sns-topic-arn'];

        var bodyarr = [];
        var reqBody;
        req.on('data', function(chunk) {
            bodyarr.push(chunk);
        })
        req.on('end', function() {
            var reqBody = JSON.parse(bodyarr.join(''));
            if (notificationType) {
                if (notificationType === 'SubscriptionConfirmation') { // confirmation notification
                    var confirmationURL = reqBody.SubscribeURL;

                    if (confirmationURL) {
                        https.get(confirmationURL, function(res) {
                            logger.debug("Got response: " + res.statusCode);
                        }).on('error', function(e) {
                            logger.debug("Got error: " + e.message);
                        });
                        res.send(200);
                    } else {
                        res.send(400);
                    }

                } else if (notificationType === 'Notification') { // message notification
                    logger.debug('Got message');
                    logger.debug(' Notification Subject ==> ', reqBody.Subject);
                    logger.debug(' Notification Message  ==> ', reqBody.Message);
                    var autoScaleMsg = JSON.parse(reqBody.Message);
                    logger.debug("service ==> " + typeof autoScaleMsg);
                    if (autoScaleMsg.Service == "AWS Auto Scaling" && autoScaleMsg.StatusCode !== 'Failed') {
                        var autoScaleId = autoScaleMsg.AutoScalingGroupName;
                        if (autoScaleId) {
                            logger.debug('finding by autoscale topic arn ==>' + topicArn);

                            if (!topicArn) {
                                return;
                            }
                            CloudFormation.findByAutoScaleResourceId(autoScaleId, function(err, cloudFormations) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }
                                logger.debug('found by autoscaleid ==>' + cloudFormations.length);
                                if (cloudFormations && cloudFormations.length) {

                                    var cloudFormation = cloudFormations[0];
                                    var awsInstanceId = autoScaleMsg.EC2InstanceId;
                                    if (!awsInstanceId) {
                                        logger.error('Unable to get instance Id from notification');
                                        return;
                                    }
                                    if (autoScaleMsg.Event === 'autoscaling:EC2_INSTANCE_TERMINATE') {
                                        logger.debug('removing instance ==> ' + awsInstanceId);



                                        instancesDao.findInstancebyCloudFormationIdAndAwsId(cloudFormation.id, awsInstanceId, function(err, instances) {
                                            if (err) {
                                                logger.error("Unable to fetch instance by cloudformation and instance id", err);
                                                return;
                                            }
                                            for (var i = 0; i < instances.length; i++) {
                                                (function(instance) {
                                                    instancesDao.removeInstancebyId(instance.id, function(err) {
                                                        if (err) {
                                                            logger.error("Unable to delete instance by instance id", err);
                                                            return;
                                                        }
                                                        logger.debug('emiting delete event');
                                                        socketCloudFormationAutoScate.to(instance.orgId + ':' + instance.bgId + ':' + instance.projectId + ':' + instance.envId).emit('cfAutoScaleInstanceRemoved', {
                                                            instanceId: instance.id,
                                                            cloudformationId: cloudFormation.id
                                                        });


                                                    });
                                                })(instances[i]);
                                            }
                                        });

                                    } else if (autoScaleMsg.Event === 'autoscaling:EC2_INSTANCE_LAUNCH') {
                                        if (!cloudFormation.infraManagerId) {
                                            logger.error("Inframanager id not found for cloudformation stack id : " + cloudformation.id);
                                            return;
                                        }
                                        masterUtil.getCongifMgmtsById(cloudFormation.infraManagerId, function(err, infraManagerDetails) {
                                            if (err) {
                                                logger.error("Unable to fetch infra manager details ", err);
                                                return;
                                            }
                                            if (!infraManagerDetails) {
                                                logger.error("infra manager details is null");
                                                return;
                                            }

                                            AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                                                if (err) {
                                                    logger.error("Unable to fetch provide", err);
                                                    return;
                                                }

                                                var ec2;
                                                if(aProvider.isDefault) {
                                                    ec2 = new EC2({
                                                        "isDefault": true,
                                                        "region": cloudFormation.region
                                                    });
                                                } else {
                                                    var cryptoConfig = appConfig.cryptoSettings;
                                                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                                                        cryptoConfig.password);

                                                    var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                                                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                                                    var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                                                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                                                    ec2 = new EC2({
                                                        "access_key": decryptedAccessKey,
                                                        "secret_key": decryptedSecretKey,
                                                        "region": cloudFormation.region
                                                    });
                                                }

                                                var keyPairName;
                                                var parameters = cloudFormation.stackParameters;
                                                for (var i = 0; i < parameters.length; i++) {
                                                    if (parameters[i].ParameterKey === 'KeyName') {
                                                        keyPairName = parameters[i].ParameterValue;
                                                        break;
                                                    }
                                                }

                                                var instances = [];
                                                logger.debug('aws Instance Id == ' + awsInstanceId);
                                                if (!awsInstanceId) {
                                                    return;
                                                }

                                                ec2.describeInstances([awsInstanceId], function (err, awsRes) {
                                                    if (err) {
                                                        logger.error("Unable to get instance details from aws", err);
                                                        return;
                                                    }
                                                    if (!(awsRes.Reservations && awsRes.Reservations.length)) {
                                                        return;
                                                    }
                                                    var reservations = awsRes.Reservations;
                                                    for (var k = 0; k < reservations.length; k++) {

                                                        if (reservations[k].Instances && reservations[k].Instances.length) {
                                                            instances = instances.concat(reservations[k].Instances);
                                                        }


                                                        logger.debug(awsRes);

                                                    }
                                                    logger.debug('Instances length ==>', instances.length);
                                                    //creating jsonAttributesObj ??? WHY
                                                    var jsonAttributesObj = {
                                                        instances: {}
                                                    };
                                                    for (var i = 0; i < instances.length; i++) {
                                                        addAndBootstrapInstance(instances[i], jsonAttributesObj);
                                                    }

                                                    function addAndBootstrapInstance(instanceData, jsonAttributesObj) {

                                                        var keyPairName = instanceData.KeyName;
                                                        AWSKeyPair.getAWSKeyPairByProviderIdAndKeyPairName(cloudFormation.cloudProviderId, keyPairName, function (err, keyPairs) {
                                                            if (err) {
                                                                logger.error("Unable to get keypairs", err);
                                                                return;
                                                            }
                                                            if (!(keyPairs && keyPairs.length)) {
                                                                return;
                                                            }
                                                            var keyPair = keyPairs[0];
                                                            var encryptedPemFileLocation = appConfig.instancePemFilesDir + keyPair._id;

                                                            var appUrls = [];
                                                            if (appConfig.appUrls && appConfig.appUrls.length) {
                                                                appUrls = appUrls.concat(appConfig.appUrls);
                                                            }
                                                            var os = instanceData.Platform;
                                                            if (os) {
                                                                os = 'windows';
                                                            } else {
                                                                os = 'linux';
                                                            }
                                                            var instanceName = cloudFormation.stackName + '-AutoScale';
                                                            if (instanceData.Tags && instanceData.Tags.length) {
                                                                for (var j = 0; j < instanceData.Tags.length; j++) {
                                                                    if (instanceData.Tags[j].Key === 'Name') {
                                                                        instanceName = instanceData.Tags[j].Value;
                                                                    }

                                                                }
                                                            }

                                                            var runlist = cloudFormation.autoScaleRunlist || [];
                                                            var instanceUsername = cloudFormation.autoScaleUsername || 'ubuntu';

                                                            var instance = {
                                                                name: instanceName,
                                                                orgId: cloudFormation.orgId,
                                                                bgId: cloudFormation.bgId,
                                                                projectId: cloudFormation.projectId,
                                                                envId: cloudFormation.envId,
                                                                providerId: cloudFormation.cloudProviderId,
                                                                keyPairId: keyPair._id,
                                                                chefNodeName: instanceData.InstanceId,
                                                                runlist: runlist,
                                                                platformId: instanceData.InstanceId,
                                                                appUrls: appUrls,
                                                                instanceIP: instanceData.PublicIpAddress || instanceData.PrivateIpAddress,
                                                                instanceState: instanceData.State.Name,
                                                                bootStrapStatus: 'waiting',
                                                                users: cloudFormation.users,
                                                                hardware: {
                                                                    platform: 'unknown',
                                                                    platformVersion: 'unknown',
                                                                    architecture: 'unknown',
                                                                    memory: {
                                                                        total: 'unknown',
                                                                        free: 'unknown',
                                                                    },
                                                                    os: os
                                                                },
                                                                credentials: {
                                                                    username: instanceUsername,
                                                                    pemFileLocation: encryptedPemFileLocation,
                                                                },
                                                                cloudFormationId: cloudFormation._id
                                                            };

                                                            if (infraManagerDetails.configType === 'chef') {
                                                                instance.chef = {
                                                                    serverId: infraManagerDetails.rowid,
                                                                    chefNodeName: instanceName + '-' + instance.instanceIP
                                                                }
                                                            } else {
                                                                instance.puppet = {
                                                                    serverId: infraManagerDetails.rowid
                                                                }
                                                            }

                                                            logger.debug('Creating instance in catalyst');
                                                            instancesDao.createInstance(instance, function (err, data) {
                                                                logger.debug("Instance Created");
                                                                if (err) {
                                                                    logger.error("Failed to create Instance", err);
                                                                    return;
                                                                }
                                                                instance.id = data._id;
                                                                var timestampStarted = new Date().getTime();
                                                                var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, "autoscale-user", timestampStarted);
                                                                var logsReferenceIds = [instance.id, actionLog._id];
                                                                logsDao.insertLog({
                                                                    referenceId: logsReferenceIds,
                                                                    err: false,
                                                                    log: "Waiting for instance ok state",
                                                                    timestamp: timestampStarted
                                                                });
                                                                logger.debug("Saving logs");
                                                                logger.debug("Waiting for instance " + instanceData.InstanceId);

                                                                //emiting socket event

                                                                socketCloudFormationAutoScate.to(instance.orgId + ':' + instance.bgId + ':' + instance.projectId + ':' + instance.envId).emit('cfAutoScaleInstanceAdded', data);


                                                                ec2.waitForEvent(instanceData.InstanceId, 'instanceStatusOk', function (err) {
                                                                    logger.debug("Wait Complete " + instanceData.InstanceId);
                                                                    if (err) {
                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {

                                                                        });
                                                                        var timestampEnded = new Date().getTime();
                                                                        logsDao.insertLog({
                                                                            referenceId: logsReferenceIds,
                                                                            err: true,
                                                                            log: "Bootstrap failed",
                                                                            timestamp: timestampEnded
                                                                        });
                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                        return;
                                                                    }

                                                                    //decrypting pem file
                                                                    var cryptoConfig = appConfig.cryptoSettings;
                                                                    var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
                                                                    credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                                                                        if (err) {
                                                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
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
                                                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                                            if (instance.hardware.os != 'windows')
                                                                                return;
                                                                        }

                                                                        configmgmtDao.getEnvNameFromEnvId(cloudFormation.envId, function (err, envName) {

                                                                            if (err) {
                                                                                logger.error('Unable to fetch env name from envId', err);
                                                                                return;
                                                                            }

                                                                            var infraManager;
                                                                            var bootstrapOption;
                                                                            if (infraManagerDetails.configType === 'chef') {
                                                                                logger.debug('In chef ');
                                                                                infraManager = new Chef({
                                                                                    userChefRepoLocation: infraManagerDetails.chefRepoLocation,
                                                                                    chefUserName: infraManagerDetails.loginname,
                                                                                    chefUserPemFile: infraManagerDetails.userpemfile,
                                                                                    chefValidationPemFile: infraManagerDetails.validatorpemfile,
                                                                                    hostedChefUrl: infraManagerDetails.url
                                                                                });
                                                                                bootstrapOption = {
                                                                                    instanceIp: instance.instanceIP,
                                                                                    pemFilePath: decryptedCredentials.pemFileLocation,
                                                                                    instancePassword: decryptedCredentials.password,
                                                                                    instanceUsername: instance.credentials.username,
                                                                                    nodeName: instance.chef.chefNodeName,
                                                                                    environment: envName,
                                                                                    instanceOS: instance.hardware.os,
                                                                                    runlist: instance.runlist
                                                                                };
                                                                            } else {
                                                                                var puppetSettings = {
                                                                                    host: infraManagerDetails.hostname,
                                                                                    username: infraManagerDetails.username,
                                                                                };
                                                                                if (infraManagerDetails.pemFileLocation) {
                                                                                    puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
                                                                                } else {
                                                                                    puppetSettings.password = infraManagerDetails.puppetpassword;
                                                                                }
                                                                                logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
                                                                                bootstrapOption = {
                                                                                    host: instance.instanceIP,
                                                                                    username: instance.credentials.username,
                                                                                    pemFileLocation: decryptedCredentials.pemFileLocation,
                                                                                    password: decryptedCredentials.password,
                                                                                    environment: envName
                                                                                };

                                                                                infraManager = new Puppet(puppetSettings);
                                                                            }

                                                                            infraManager.bootstrapInstance(bootstrapOption, function (err, code, bootstrapData) {

                                                                                if (err) {
                                                                                    logger.error("knife launch err ==>", err);
                                                                                    instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {

                                                                                    });
                                                                                    if (err.message) {
                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: true,
                                                                                            log: err.message,
                                                                                            timestamp: timestampEnded
                                                                                        });

                                                                                    }
                                                                                    var timestampEnded = new Date().getTime();
                                                                                    logsDao.insertLog({
                                                                                        referenceId: logsReferenceIds,
                                                                                        err: true,
                                                                                        log: "Bootstrap Failed",
                                                                                        timestamp: timestampEnded
                                                                                    });
                                                                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                                                } else {
                                                                                    if (code == 0) {
                                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function (err, updateData) {
                                                                                            if (err) {
                                                                                                logger.error("Unable to set instance bootstarp status. code 0");
                                                                                            } else {
                                                                                                logger.debug("Instance bootstrap status set to success");
                                                                                            }
                                                                                        });

                                                                                        // updating puppet node name
                                                                                        var nodeName;
                                                                                        if (bootstrapData && bootstrapData.puppetNodeName) {
                                                                                            instancesDao.updateInstancePuppetNodeName(instance.id, bootstrapData.puppetNodeName, function (err, updateData) {
                                                                                                if (err) {
                                                                                                    logger.error("Unable to set puppet node name");
                                                                                                } else {
                                                                                                    logger.debug("puppet node name updated successfully");
                                                                                                }
                                                                                            });
                                                                                            nodeName = bootstrapData.puppetNodeName;
                                                                                        } else {
                                                                                            nodeName = instance.chef.chefNodeName;
                                                                                        }


                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: false,
                                                                                            log: "Instance Bootstrapped Successfully",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                                                        var hardwareData = {};
                                                                                        if (bootstrapData && bootstrapData.puppetNodeName) {
                                                                                            var runOptions = {
                                                                                                username: decryptedCredentials.username,
                                                                                                host: instance.instanceIP,
                                                                                                port: 22,
                                                                                            }

                                                                                            if (decryptedCredentials.pemFileLocation) {
                                                                                                runOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
                                                                                            } else {
                                                                                                runOptions.password = decryptedCredentials.password;
                                                                                            }

                                                                                            infraManager.runClient(runOptions, function (err, retCode) {
                                                                                                if (decryptedCredentials.pemFileLocation) {
                                                                                                    fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                                                                                                        if (err) {
                                                                                                            logger.debug("Unable to delete temp pem file =>", err);
                                                                                                        } else {
                                                                                                            logger.debug("temp pem file deleted =>", err);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                if (err) {
                                                                                                    logger.error("Unable to run puppet client", err);
                                                                                                    return;
                                                                                                }
                                                                                                // waiting for 30 sec to update node data
                                                                                                setTimeout(function () {
                                                                                                    infraManager.getNode(nodeName, function (err, nodeData) {
                                                                                                        if (err) {
                                                                                                            logger.debug(err);
                                                                                                            return;
                                                                                                        }
                                                                                                        // is puppet node
                                                                                                        hardwareData.architecture = nodeData.facts.values.hardwaremodel;
                                                                                                        hardwareData.platform = nodeData.facts.values.operatingsystem;
                                                                                                        hardwareData.platformVersion = nodeData.facts.values.operatingsystemrelease;
                                                                                                        hardwareData.memory = {
                                                                                                            total: 'unknown',
                                                                                                            free: 'unknown'
                                                                                                        };
                                                                                                        hardwareData.memory.total = nodeData.facts.values.memorysize;
                                                                                                        hardwareData.memory.free = nodeData.facts.values.memoryfree;
                                                                                                        hardwareData.os = instance.hardware.os;
                                                                                                        instancesDao.setHardwareDetails(instance.id, hardwareData, function (err, updateData) {
                                                                                                            if (err) {
                                                                                                                logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                                                            } else {
                                                                                                                logger.debug("Instance hardware details set successessfully");
                                                                                                            }
                                                                                                        });
                                                                                                    });
                                                                                                }, 30000);
                                                                                            });

                                                                                        } else {
                                                                                            infraManager.getNode(nodeName, function (err, nodeData) {
                                                                                                if (err) {
                                                                                                    logger.error("unable to fetch node data from chef", err);
                                                                                                    return;
                                                                                                }
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
                                                                                                instancesDao.setHardwareDetails(instance.id, hardwareData, function (err, updateData) {
                                                                                                    if (err) {
                                                                                                        logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                                                    } else {
                                                                                                        logger.debug("Instance hardware details set successessfully");
                                                                                                    }
                                                                                                });
                                                                                                if (decryptedCredentials.pemFilePath) {
                                                                                                    fileIo.removeFile(decryptedCredentials.pemFilePath, function (err) {
                                                                                                        if (err) {
                                                                                                            logger.error("Unable to delete temp pem file =>", err);
                                                                                                        } else {
                                                                                                            logger.debug("temp pem file deleted");
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });

                                                                                        }

                                                                                    } else {
                                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
                                                                                            if (err) {
                                                                                                logger.error("Unable to set instance bootstarp status code != 0");
                                                                                            } else {
                                                                                                logger.debug("Instance bootstrap status set to failed");
                                                                                            }
                                                                                        });

                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: true,
                                                                                            log: "Bootstrap Failed",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                                                    }
                                                                                }

                                                                            }, function (stdOutData) {

                                                                                logsDao.insertLog({
                                                                                    referenceId: logsReferenceIds,
                                                                                    err: false,
                                                                                    log: stdOutData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                });

                                                                            }, function (stdErrData) {

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

                                                        });

                                                    }

                                                });

                                            });

                                        });
                                    }
                                } else {
                                    // creating or removing a temp entry in database for this notification
                                    var awsInstanceId = autoScaleMsg.EC2InstanceId;
                                    if (!awsInstanceId) {
                                        logger.error('Unable to get instance Id from notification');
                                        return;
                                    }
                                    if (autoScaleMsg.Event === 'autoscaling:EC2_INSTANCE_TERMINATE') {
                                        // removing the entry from temp database if any
                                        AwsAutoScaleInstance.removeByAutoScaleResourceAndInstanceId(autoScaleId, awsInstanceId, function(err, deleteCount) {
                                            if (err) {
                                                logger.error("Unable to delete by resourceId and instanceId", autoScaleId, awsInstanceId);
                                                return;
                                            }
                                            logger.debug("Deleted ==>" + JSON.stringify(deleteCount));
                                        });

                                    } else if (autoScaleMsg.Event === 'autoscaling:EC2_INSTANCE_LAUNCH') {
                                        AwsAutoScaleInstance.createNew({
                                            autoScaleResourceId: autoScaleId,
                                            awsInstanceId: awsInstanceId
                                        }, function(err, autoScaleInstance) {
                                            if (err) {
                                                logger.error("Unable to create aws autoscale instance");
                                                return;
                                            }
                                            logger.debug("Added instance notification in temp database");

                                        });
                                    }


                                }
                            });
                        }
                    }

                    res.send(200);
                }
            } else {
                res.send(400);
            }
            res.send(200);
        });
    });

    
    




};
