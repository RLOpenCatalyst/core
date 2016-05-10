


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
        function(orgs,next){
            async.forEach(orgs,function(organization,next){
                MasterUtils.getBusinessGroupsByOrgId(organization.rowid,function(err,businessGroups){
                    if(err){
                        logger.error(err);
                        return;
                    };
                    async.forEach(businessGroups,function(businessGroup,next) {
                        MasterUtils.getProjectsBybgId(businessGroup.rowid, function(err, projects){
                            if(err){
                                logger.error(err);
                                return;
                            };
                            async.forEach(projects,function(project,next) {
                                MasterUtils.getEnvironmentsByprojectId(project.rowid,function(err,environments){
                                    if(err){
                                        logger.error(err);
                                        return;
                                    };
                                    async.forEach(environments,function(environment,next) {
                                        var jsonData={
                                            orgId:organization.rowid,
                                            bgId :businessGroup.rowid,
                                            projectId:project.rowid,
                                            envId:environment.rowid
                                        };
                                        instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData,function(err,instances){
                                            if(err){
                                               logger.error(err);
                                               return;
                                            };
                                            async.forEach(instances,function(instance,next) {
                                                containerDao.deleteContainerByInstanceId(instance._id,function(err,data){
                                                    if(err){
                                                        logger.error(err);
                                                        return;
                                                    };
                                                    credentialCrpto.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                                                    if(err){
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
                                                        if(err){
                                                           logger.error(err);
                                                           return;
                                                        };
                                                        if (decryptedCredentials.pemFileLocation) {
                                                            fileIo.removeFile(decryptedCredentials.pemFileLocation, function () {
                                                                logger.debug('temp file deleted');
                                                            });

                                                        };
                                                        var _stdout = stdOut.split('\r\n');
                                                        var start = false;
                                                        var so = '';
                                                        _stdout.forEach(function(k, v) {
                                                            if (start == true) {
                                                                so += _stdout[v];
                                                                logger.debug(v + ':' + _stdout[v].length);
                                                            }
                                                            if (_stdout[v].length == 1)
                                                                start = true;
                                                            if (v >= _stdout.length - 1) {
                                                                if(so.indexOf("Names")>0){
                                                                    var containers = JSON.parse(so);
                                                                    async.forEach(containers,function(container,next){
                                                                        var containerName=container.Names.toString().replace('/','');
                                                                       // var instanceId=instance._id.toString();
                                                                        var status=dockerContainerStatus(container.Status.toString(),container.Created);
                                                                        var containerData = {
                                                                            orgId: organization.rowid,
                                                                            bgId: businessGroup.rowid,
                                                                            projectId: project.rowid,
                                                                            envId: environment.rowid,
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
                                                                        containerAction(containerData);
                                                                        containerData={};
                                                                    });
                                                                }
                                                            }
                                                        });

                                                    }, function (stdOutData) {
                                                        stdOut += stdOutData.toString();
                                                    }, function (stdOutErr) {
                                                        logger.error("Error hits to fetch docker details", stdOutErr);
                                                        return;
                                                    });
                                                    });
                                                })
                                            })
                                        })
                                    });
                                });
                            });
                        });
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
function containerAction(container){
    async.waterfall([
        function(next){
            containerDao.getContainerByIdInstanceId(container.Id,container.instanceId,next);
        },
        function(containerData,next){
            if(containerData.length === 0){
                containerDao.createContainer(container,next);
            }else{
                containerDao.updateContainer(container.Id,container.Status,next);
            }
        }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }
        });
};

function dockerContainerStatus(status,created){
    if(status.indexOf('Exited') >= 0){
        return "STOP";
    }else if(status.indexOf('Paused')>= 0){
        return "PAUSE";
    }else if(status.indexOf('Up')>= 0){
        var createdDate = new Date(created *1000);
        var currentDate = new Date();
        var dateDifference = currentDate.getTime() - createdDate.getTime();
        var daysDifference=Math.round(dateDifference/(1000*60*60*24));
        var hoursDifference=Math.round(dateDifference/(1000*60*60));
        var minutesDifference=Math.round(dateDifference/(1000*60));
        var times=[daysDifference,hoursDifference,minutesDifference,(minutesDifference-1),(minutesDifference+1)];
        var numb = status.match(/\d/g);
        if (numb != null) {
            numb = numb.join("");
        }
        if(times.indexOf(parseInt(numb)) >= 0){
            return "START";
        }else if(daysDifference===0 && hoursDifference===0 && (minutesDifference===0 || minutesDifference===1)){
            return "START";
        }else{
            return "RESTART";
        }
    }else{
        return "START";
    }
};