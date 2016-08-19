
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
DockerContainerSync.interval = '*/5 * * * *';
DockerContainerSync.execute = dockerContainerSync;

module.exports = DockerContainerSync;

function dockerContainerSync(){
    async.parallel({
        containerDataSync: function(callback){
            containerDao.getAllContainers(function(err,containers){
                if(err){
                    logger.error(err);
                    callback(err,null);
                    return;
                }else if(containers.length > 0){
                    var count = 0;
                    for(var i = 0;i < containers.length; i++){
                        (function(container){
                            instancesDao.getInstanceById(container.instanceId,function(err,instances){
                                count++;
                                if(err) {
                                    logger.error(err);
                                    return;
                                }else if(instances.length > 0){
                                    if(count === containers.length){
                                        callback(null,containers);
                                        return;
                                    }
                                }else{
                                    containerDao.deleteContainerByInstanceId(container.instanceId,function(err,deleteStatus){
                                        if(err){
                                            logger.error(err);
                                            return;
                                        }
                                        if(count === containers.length){
                                            callback(null,containers);
                                            return;
                                        }
                                    })
                                }
                            })
                        })(containers[i]);
                    }
                }else{
                    logger.info("Containers are not present in catalyst for instance sync");
                    callback(null,containers);
                    return;
                }
            })
        },
        instanceDataSync: function(callback){
            MasterUtils.getAllActiveOrg(function(err, orgs) {
                if(err) {
                    logger.error(err);
                    callback(err,null);
                    return;
                }else if(orgs.length > 0){
                    for(var i = 0; i < orgs.length; i++){
                        (function(org){
                            instancesDao.getInstancesWithContainersByOrgId(org.rowid, function(err, instances) {
                                if(err) {
                                    logger.error(err);
                                    callback(err,null);
                                    return;
                                }else if(instances.length > 0){
                                    var count = 0;
                                    for(var j = 0; j < instances.length; j++){
                                        (function(instance){
                                            count++;
                                            aggregateDockerContainerForInstance(instance)
                                        })(instances[j]);
                                    }
                                    if(count === instances.length){
                                        callback(null,instances);
                                        return;
                                    }
                                }else{
                                    logger.info("There is no Instance in "+org.orgname+" Organization who have docker installed");
                                    callback(null,instances);
                                    return;
                                }
                            });

                        })(orgs[i]);
                    }

                }else{
                    logger.info("There is no Active Organization for Docker Container Sync");
                    callback(null,orgs);
                    return;
                }
            });
        }
    },function(err,results){
        if(err){
            logger.error(err);
        }
        logger.info("Docker Container Sync job is successfully executed");
        return;
    });
}

function aggregateDockerContainerForInstance(instance){
    logger.info("Docker Container Sync started for Instance IP "+instance.instanceIP);
    if(instance.instanceState === 'terminated' || instance.instanceState === 'stopped'){
        deleteContainerByInstanceId(instance._id,function(err,data){
            if(err){
                logger.error(err);
                return;
            }else{
                logger.debug("Deleted Docker Containers for Terminated or Stopped Instance");
                return;
            }
        })
    }else {
        var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
        async.waterfall([
            function (next) {
                credentialCrpto.decryptCredential(instance.credentials, next);
            },
            function (decryptedCredentials, next) {
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
                        if (decryptedCredentials.pemFileLocation) {
                            fileIo.removeFile(decryptedCredentials.pemFileLocation, function () {
                                logger.debug('temp file deleted');
                                var containerObj={
                                    instanceId:instance._id,
                                    operation:'delete'
                                }
                                next(null,containerObj);
                            });
                        } else {
                            var containerObj={
                                instanceId:instance._id,
                                operation:'delete'
                            }
                            next(null,containerObj);
                        }
                    };
                    if (decryptedCredentials.pemFileLocation) {
                        fileIo.removeFile(decryptedCredentials.pemFileLocation, function () {
                            logger.debug('temp file deleted');
                        });
                    };
                    if (code === -5000) {
                        var containerObj={
                            instanceId:instance._id,
                            operation:'delete'
                        }
                        next(null,containerObj);
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
                                    for (var i = 0; i < containers.length; i++) {
                                        (function (container) {
                                            var containerName = container.Names[0].replace(/^\//, "");
                                            var status = dockerContainerStatus(container.Status.toString());
                                            var containerData = {
                                                orgId: instance.orgId,
                                                bgId: instance.bgId,
                                                projectId: instance.projectId,
                                                envId: instance.envId,
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
                                        })(containers[i]);
                                    }
                                    if (containers.length === containerList.length) {
                                        var containerObj={
                                            containers:containerList,
                                            containerIds:containerIds,
                                            instanceId:instance._id,
                                            operation:'create'
                                        }
                                        next(null,containerObj);
                                    } else {
                                        logger.debug("There is no container present");
                                        next(null,null);
                                    }
                                } else {
                                    logger.debug("There is no container present");
                                    var containerObj={
                                        instanceId:instance._id,
                                        operation:'delete'
                                    }
                                    next(null,containerObj);
                                }
                            }
                        });
                    }
                }, function (stdOutData) {
                    stdOut += stdOutData.toString();
                }, function (stdOutErr) {
                    logger.error("Error hits to fetch docker details", stdOutErr);
                    next(stdOutErr,null);
                });
            },
            function(containers,next){
                if(containers.operation === 'delete'){
                    deleteContainerByInstanceId(containers.instanceId,next);
                }else if (containers.operation === 'create'){
                    saveAndUpdateContainers(containers.containers,containers.containerIds,containers.instanceId,next)
                }else{
                    next(null,containers);
                }
            }
        ], function (err, results) {
            if (err) {
                logger.error("Error in Docker Container Sync");
                return;
            } else {
                logger.info("Docker Container Sync ended for Instance IP " + instance.instanceIP);
                return;
            }
        });
    }
};

function saveAndUpdateContainers(containers,containerIds,instanceId,next){
    async.waterfall([
            function(next){
                containerDao.deleteContainersByContainerIds(instanceId,containerIds,next);
            },
            function(deleteContainers,next){
                var count = 0;
                for(var i = 0; i < containers.length; i++) {
                    (function(container) {
                        containerDao.getContainerByIdInstanceId(container.Id, instanceId, function(err,data){
                            if(err){
                                logger.error(err);
                                return;
                            }else if(data.length === 0){
                                containerDao.createContainer(container, function(err,containerData){
                                    if(err){
                                        logger.error(err);
                                        return;
                                    }else{
                                        count++;
                                        if(count === containers.length){
                                            next(null,containers);
                                        }
                                    }
                                });
                            }else{
                                containerDao.updateContainerStatus(container.Id, container.Status, container.containerStatus, function(err,deleteContainer){
                                    if(err){
                                        logger.error(err);
                                        return;
                                    }else{
                                        count++;
                                        if(count === containers.length){
                                            next(null,containers);
                                        }
                                    }
                                });
                            }
                        });
                    })(containers[i]);
                }

            }],
        function (err, results) {
            if(err){
                logger.error("Error in containerAction ");
                next(err);
            }else{
                next(null,results);
            }
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

function deleteContainerByInstanceId(instanceId,next){
    async.waterfall([
            function(next){
                containerDao.deleteContainerByInstanceId(instanceId,next);
            }],
        function (err, results) {
            if(err){
                logger.error("Error in deleteContainerByInstanceId ");
                next(err);
            }else {
                next(null,results);
            }
        });
};

