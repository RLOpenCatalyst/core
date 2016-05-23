
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var credentialCrpto = require('_pr/lib/credentialcryptography.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var containerDao = require('_pr/model/container');
var SSH = require('_pr/lib/utils/sshexec');
var fileIo = require('_pr/lib/utils/fileio');
var toPairs = require('lodash.topairs');
var async = require('async');

var DockerContainerSync = Object.create(CatalystCronJob);
DockerContainerSync.interval = '* * * * *';
DockerContainerSync.execute = sync;

module.exports = DockerContainerSync;

function sync() {
    var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
    async.waterfall([
            function(next){
                MasterUtils.getAllActiveOrg(next);
            },
            function(orgs,next) {
                async.forEach(orgs, function (organization, next) {
                    MasterUtils.getBusinessGroupsByOrgId(organization.rowid, function (err, businessGroups) {
                        if (err) {
                            logger.error(err);
                            return;
                        };
                        async.forEach(businessGroups, function (businessGroup, next) {
                            MasterUtils.getProjectsBybgId(businessGroup.rowid, function (err, projects) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                };
                                async.forEach(projects, function (project, next) {
                                    MasterUtils.getEnvironmentsByprojectId(project.rowid, function (err, environments) {
                                        if (err) {
                                            logger.error(err);
                                            return;
                                        };
                                        if (environments.length > 0) {
                                            async.forEach(environments, function (environment, next) {
                                                var jsonData = {
                                                    orgId: organization.rowid,
                                                    bgId: businessGroup.rowid,
                                                    projectId: project.rowid,
                                                    envId: environment.rowid
                                                };
                                                instancesDao.getInstancesByOrgBgProjectAndEnvIdForDocker(jsonData, function (err, instances) {
                                                    if (err) {
                                                        logger.error(err);
                                                        return;
                                                    };
                                                    if (instances.length > 0) {
                                                        async.forEach(instances, function (instance, next) {
                                                            credentialCrpto.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                                                                if (err) {
                                                                    logger.error(err);
                                                                    return;
                                                                };
                                                                var options = {
                                                                    host: instance.instanceIP,
                                                                    port: '22',
                                                                    username: decryptedCredentials.username,
                                                                    privateKey: decryptedCredentials.pemFileLocation,
                                                                    password: decryptedCredentials.password
                                                                };
                                                                var sshParamObj = {
                                                                    host: options.host,
                                                                    port: options.port,
                                                                    username: options.username
                                                                };
                                                                if (options.privateKey) {
                                                                    sshParamObj.privateKey = options.privateKey;
                                                                    if (options.passphrase) {
                                                                        sshParamObj.passphrase = options.passphrase;
                                                                    }
                                                                } else {
                                                                    sshParamObj.password = options.password;
                                                                }
                                                                var sshConnection = new SSH(sshParamObj);
                                                                var stdOut = '';
                                                                sshConnection.exec(cmd, function (err, code) {
                                                                    if (err) {
                                                                        logger.error(err);
                                                                        return;
                                                                    };
                                                                    if (decryptedCredentials.pemFileLocation) {
                                                                        fileIo.removeFile(decryptedCredentials.pemFileLocation, function () {
                                                                            logger.debug('temp file deleted');
                                                                        });
                                                                    };
                                                                    if (code === -5000) {
                                                                        containerDao.deleteContainerByInstanceId(instance._id, function (err, deleteContainer) {
                                                                            if (err) {
                                                                                logger.error(err);
                                                                                return;
                                                                            };
                                                                            return;
                                                                        });
                                                                    } else {
                                                                        var _stdout = stdOut.split('\r\n');
                                                                        var start = false;
                                                                        var so = '';
                                                                        _stdout.forEach(function (k, v) {
                                                                            if (start == true) {
                                                                                so += _stdout[v];
                                                                                logger.debug(v + ':' + _stdout[v].length);
                                                                            }
                                                                            if (_stdout[v].length == 1)
                                                                                start = true;
                                                                            if (v >= _stdout.length - 1) {
                                                                                if (so.indexOf("Names") > 0) {
                                                                                    var containers = JSON.parse(so);
                                                                                    var containerList = [];
                                                                                    var containerIds = [];
                                                                                    async.forEach(containers, function (container, next) {
                                                                                        var containerName = container.Names[0].replace(/^\//, "");
                                                                                        var status = dockerContainerStatus(container.Status.toString());
                                                                                        var containerData = {
                                                                                            orgId: jsonData.orgId,
                                                                                            bgId: jsonData.bgId,
                                                                                            projectId: jsonData.projectId,
                                                                                            envId: jsonData.envId,
                                                                                            Id: container.Id,
                                                                                            instanceIP: instance.instanceIP,
                                                                                            instanceId: instance._id,
                                                                                            Names: containerName,
                                                                                            Image: container.Image,
                                                                                            ImageID: container.ImageID,
                                                                                            Command: container.Command,
                                                                                            Created: container.Created,
                                                                                            Ports: container.Ports,
                                                                                            Labels: toPairs(container.Labels),
                                                                                            Status: container.Status,
                                                                                            containerStatus: status,
                                                                                            HostConfig: container.HostConfig
                                                                                        };
                                                                                        containerList.push(containerData);
                                                                                        containerIds.push(container.Id);
                                                                                        containerData = {};
                                                                                    });
                                                                                    containerAction(containerList, containerIds, instance._id);
                                                                                } else {
                                                                                    deleteContainerByInstanceId(instance._id);
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                }, function (stdOutData) {
                                                                    stdOut += stdOutData.toString();
                                                                }, function (stdOutErr) {
                                                                    logger.error("Error hits to fetch docker details", stdOutErr);
                                                                });
                                                            });
                                                        })
                                                    } else {
                                                        logger.debug("No instance is Available for Container Cron Job");
                                                        return;
                                                    }
                                                })
                                            });
                                        } else {
                                            logger.debug("No Environment is Available for Container Cron Job");
                                            return;
                                        }
                                    });
                                });
                            })
                        });
                    });
                })
            }
        ],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }

        });
};
function containerAction(containers,containerIds,instanceId){
    async.waterfall([
            function(next){
                containerDao.deleteContainersByContainerIds(instanceId,containerIds,next);
            },
            function(deleteContainers,next){
                async.forEach(containers,function(container,next){
                    async.waterfall([
                        function(next){
                            containerDao.getContainerByIdInstanceId(container.Id,instanceId,next);
                        },
                        function(containerData,next){
                            if(containerData.length === 0){
                                containerDao.createContainer(container,next);
                            }else{
                                containerDao.updateContainerStatus(container.Id,container.Status,container.containerStatus,next);
                            }
                        }
                    ],function (err, results) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                    });
                });
            }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            };
            return;
        });
};

function dockerContainerStatus(status){
    if(status.indexOf('Exited') >= 0){
        return "STOP";
    }else if(status.indexOf('Paused')>= 0){
        return "PAUSE";
    }else{
        return "START";
    }
};

function deleteContainerByInstanceId(instanceId){
    async.waterfall([
            function(next){
                containerDao.deleteContainerByInstanceId(instanceId,next);
            }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            };
            return;
        });
};

