/**
 * Created by Durgesh Sharma on 6/4/16.
 */

var logger = require('_pr/logger')(module);
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var credentialCrpto = require('_pr/lib/credentialcryptography.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var containerDao = require('_pr/model/container');
var SSH = require('_pr/lib/utils/sshexec');
var fileIo = require('_pr/lib/utils/fileio');
function sync() {
    var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
    var orgs = MasterUtils.getAllActiveOrg(function(err, orgs) {
        for (var i = 0; i < orgs.length; i++) {
            (function(aOrg) {
                MasterUtils.getBusinessGroupsByOrgId(aOrg.rowid, function(err, businessGroups) {
                    if (err) {
                        logger.error("Unable to get BusinessGroupsByOrgId :", err);
                        return;
                    }
                    for (var j = 0; j < businessGroups.length; j++) {
                        (function(aBusinessGroup) {
                            MasterUtils.getProjectsBybgId(aBusinessGroup.rowid, function(err, projects) {
                                if (err) {
                                    logger.error("Unable to get ProjectsBybgId :", err);
                                    return;
                                }
                                for (var k = 0; k < projects.length; k++) {
                                    (function (aProject) {
                                        MasterUtils.getEnvironmentsByprojectId(aProject.rowid, function (err, environments) {
                                            if (err) {
                                                logger.error("Unable to get EnvironmentsByprojectId :", err);
                                                return;
                                            }
                                            for (var l = 0; l < environments.length; l++) {
                                                (function (aEnvironment) {
                                                    var jsonData={
                                                        orgId:aOrg.rowid,
                                                        bgId :aBusinessGroup.rowid,
                                                        projectId:aProject.rowid,
                                                        envId:aEnvironment.rowid
                                                    };
                                                    instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData,function(err,instances){
                                                        if(err){
                                                            logger.error("Unable to get InstancesByOrgBgProjectAndEnvId :", err);
                                                            return;
                                                        }
                                                        if (instances.length) {
                                                            for(var m =0; m < instances.length; m++) {
                                                                (function (aInstance) {
                                                                    credentialCrpto.decryptCredential(aInstance.credentials, function (err, decrptedCredentials) {
                                                                        if (err) {
                                                                            logger.error("Unable to get InstancesByOrgBgProjectAndEnvId :", err);
                                                                            return;
                                                                        }
                                                                        var options = {
                                                                            host: aInstance.instanceIP,
                                                                            port: '22',
                                                                            username: decrptedCredentials.username,
                                                                            privateKey: decrptedCredentials.pemFileLocation,
                                                                            password: decrptedCredentials.password
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
                                                                        console.log(sshParamObj);
                                                                        var sshConnection = new SSH(sshParamObj);
                                                                        var stdOut = '';
                                                                        sshConnection.exec(cmd, function (err, code) {
                                                                            if (decrptedCredentials.pemFileLocation) {
                                                                                fileIo.removeFile(decrptedCredentials.pemFileLocation, function () {
                                                                                    logger.debug('temp file deleted');
                                                                                });

                                                                            }

                                                                        }, function (stdOutData) {
                                                                            stdOut += stdOutData.toString();
                                                                            console.log(stdOut);
                                                                        }, function (stdOutErr) {
                                                                            logger.error("Error hits to fetch docker details", stdOutErr);
                                                                            return;
                                                                        });
                                                                        if(stdOut.length>0) {
                                                                            var containers = JSON.parse(stdOut);
                                                                            for (var n = 0; n < containers.length; n++) {
                                                                                (function (aContainer) {
                                                                                    var containerData = {
                                                                                        orgId: aOrg.rowid,
                                                                                        bgId: aBusinessGroup.rowid,
                                                                                        projectId: aProject.rowid,
                                                                                        envId: aEnvironment.rowid,
                                                                                        Id: aContainer.Id,
                                                                                        instanceIP: aInstance.instanceIP,
                                                                                        instanceId:aInstance._id,
                                                                                        Names: aContainer.Names,
                                                                                        Image: aContainer.Image,
                                                                                        ImageID: aContainer.ImageID,
                                                                                        Command: aContainer.Command,
                                                                                        Created: aContainer.Created,
                                                                                        Ports: aContainer.Ports,
                                                                                        Labels: aContainer.Labels,
                                                                                        Status: aContainer.Status,
                                                                                        HostConfig: aContainer.HostConfig
                                                                                    };
                                                                                    containerDao.getContainerByIdInstanceIP(containerData, function (err, data) {
                                                                                        if (err) {
                                                                                            logger.error("Error in fetching Container By ID and Instance IP:", err);
                                                                                            return;
                                                                                        }
                                                                                        if (data.length) {
                                                                                            containerDao.updateContainer(containerData, function (err, updatedata) {
                                                                                                if (err) {
                                                                                                    logger.error("Error in Updating Container:", err);
                                                                                                    return;
                                                                                                }
                                                                                            })

                                                                                        }
                                                                                        else {
                                                                                            containerDao.createContainer(containerData, function (err, insertdata) {
                                                                                                if (err) {
                                                                                                    logger.error("Error in Creation Container:", err);
                                                                                                    return;
                                                                                                }
                                                                                            })
                                                                                        }

                                                                                    })


                                                                                })(containers[n]);
                                                                            }
                                                                        }
                                                                    });
                                                                })(instances[m]);
                                                            }


                                                        }
                                                    })

                                                })(environments[l]);
                                            }
                                        });
                                    })(projects[k]);
                                }
                            });
                        })(businessGroups[j]);
                    }
                });
            })(orgs[i])
        }
    });
}

module.exports = sync;