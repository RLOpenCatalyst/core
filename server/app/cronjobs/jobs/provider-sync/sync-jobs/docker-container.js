/**
 * Created by Durgesh Sharma on 6/4/16.
 */

var logger = require('_pr/logger')(module);
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var credentialCrpto = require('_pr/lib/credentialcryptography.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var containerDao = require('_pr/model/container');
var fileIo = require('_pr/lib/utils/fileio');
var node_ssh, ssh;
node_ssh = require('node-ssh');
ssh = new node_ssh();
function sync() {
    var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
    var orgs = MasterUtils.getAllActiveOrg(function(err, orgs) {
        for (var i = 0; i < orgs.length; i++) {
            (function(org) {
                MasterUtils.getBusinessGroupsByOrgId(org.rowid, function(err, businessGroups) {
                    if (err) {
                        logger.error("Unable to get BusinessGroupsByOrgId :", err);
                        return;
                    }
                    for (var j = 0; j < businessGroups.length; j++) {
                        (function(businessGroups) {
                            MasterUtils.getProjectsBybgId(businessGroups.rowid, function(err, projects) {
                                if (err) {
                                    logger.error("Unable to get ProjectsBybgId :", err);
                                    return;
                                }
                                for (var k = 0; k < projects.length; k++) {
                                    (function (projects) {
                                        MasterUtils.getEnvironmentsByprojectId(projects.rowid, function (err, environments) {
                                            if (err) {
                                                logger.error("Unable to get EnvironmentsByprojectId :", err);
                                                return;
                                            }
                                            for (var l = 0; l < environments.length; l++) {
                                                (function (environments) {
                                                    var jsonData={
                                                        orgId:org.rowid,
                                                        bgId :businessGroups.rowid,
                                                        projectId:projects.rowid,
                                                        envId:environments.rowid
                                                    };
                                                    instancesDao.getInstancesByOrgBgProjectAndEnvId(jsonData,function(err,instances){
                                                        if(err){
                                                            logger.error("Unable to get InstancesByOrgBgProjectAndEnvId :", err);
                                                            return;
                                                        }
                                                        if (instances.length) {
                                                            var instanceoptions = instances[0];
                                                            credentialCrpto.decryptCredential(instanceoptions.credentials, function(err, decrptedCredentials) {
                                                                if (err) {
                                                                    logger.error("Unable to get InstancesByOrgBgProjectAndEnvId :", err);
                                                                    return;
                                                                }
                                                                var options = {
                                                                    host: instanceoptions.instanceIP,
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
                                                                ssh.connect(sshParamObj).then(function() {
                                                                    ssh.execCommand(cmd, {cwd:'', stream: 'both'}).then(function(result) {
                                                                        if(result.stderr){
                                                                            logger.error("Error in SSH Connection ",result.stderr);
                                                                            return;
                                                                        }
                                                                        if(result.stdout){
                                                                            var data = (result.stdout).split('\n')
                                                                                .map(function(s) { return s.replace(/^\s*|\s*$/g, ""); })
                                                                                .filter(function(x) { return x; });
                                                                            var containers=JSON.parse(data[data.length-1]);
                                                                            for(var m =0;m < containers.length; m++){
                                                                                (function(containers){
                                                                                    var containerData={
                                                                                        orgId:org.rowid,
                                                                                        bgId :businessGroups.rowid,
                                                                                        projectId:projects.rowid,
                                                                                        envId:environments.rowid,
                                                                                        Id: containers.Id,
                                                                                        instanceIP:instanceoptions.instanceIP,
                                                                                        Names: containers.Names,
                                                                                        Image: containers.Image,
                                                                                        ImageID: containers.ImageID,
                                                                                        Command: containers.Command,
                                                                                        Created: containers.Created,
                                                                                        Ports: containers.Ports,
                                                                                        Labels: containers.Labels,
                                                                                        Status: containers.Status,
                                                                                        HostConfig: containers.HostConfig
                                                                                    };
                                                                                    containerDao.getContainerByIdInstanceIP(containerData,function(err,data){
                                                                                        if(err){
                                                                                            logger.error("Error in fetching Container By ID and Instance IP:", err);
                                                                                            return;
                                                                                        }
                                                                                        if(data.length){
                                                                                            containerDao.updateContainer(containerData,function(err,updatedata){
                                                                                                if(err){
                                                                                                    logger.error("Error in Updating Container:", err);
                                                                                                    return;
                                                                                                }
                                                                                            })

                                                                                        }
                                                                                        else{
                                                                                            containerDao.createContainer(containerData,function(err,insertdata){
                                                                                                if(err){
                                                                                                    logger.error("Error in Creation Container:", err);
                                                                                                    return;
                                                                                                }
                                                                                            })
                                                                                        }

                                                                                    })


                                                                                })(containers[m]);
                                                                            }
                                                                        }
                                                                    });
                                                                });

                                                            });

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
