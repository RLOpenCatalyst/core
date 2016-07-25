
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var async = require('async');
var Chef = require('_pr/lib/chef');
var chefDao = require('_pr/model/dao/chefDao.js');
var appConfig = require('_pr/config');

var ChefSync = Object.create(CatalystCronJob);
ChefSync.interval = '*/2 * * * *';
ChefSync.execute = chefSync;

module.exports = ChefSync;

function chefSync(){
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        }else if(orgs.length > 0){
            for(var i = 0; i < orgs.length; i++){
                (function(org){
                    MasterUtils.getChefDetailsByOrgId(org.rowid,function(err,chefDetails){
                        if(err){
                            logger.error(err);
                            return;
                        }else if(chefDetails.length > 0){
                            aggregateChefSync(chefDetails[0]);
                            return;
                        }else{
                            logger.info("There is no chef server associated with  "+org.orgname+" Organization");
                            return;
                        }
                    })
   
                })(orgs[i]);
            }

        }else{
            logger.info("There is no Active Organization for Chef Sync");
            return;
        }
    });
}

function aggregateChefSync(chefDetail){
    logger.info("Chef Sync started");
    var chefSettings = appConfig.chef;
    var chef = new Chef({
        userChefRepoLocation: chefSettings.chefReposLocation + chefDetail.orgname_rowid[0] + '/' +  chefDetail.loginname +' /',
        chefUserName: chefDetail.loginname,
        chefUserPemFile: chefSettings.chefReposLocation + chefDetail.orgname_rowid[0]  +  chefDetail.folderpath + chefDetail.userpemfile_filename,
        chefValidationPemFile: chefSettings.chefReposLocation + chefDetail.orgname_rowid[0] +  chefDetail.folderpath + chefDetail.validatorpemfile_filename,
        hostedChefUrl: chefDetail.url
    });
    async.waterfall([
        function(next){
            chef.getNodesList(next);
        },
        function(nodeList,next){
            getNodeListFilterWithManagedInstances(chefDetail.rowid,nodeList,next);
        },
        function(filterNodeList,next){
            async.parallel({
                nodes: function(callback){
                    var nodeDetailList=[];
                    for(var i = 0; i < filterNodeList.length; i++){
                        (function(filterNode){
                            chef.getNode(filterNode,function(err,nodeChefBody){
                                if(err){
                                    nodeDetailList.push({error:err});
                                    if(nodeDetailList.length === filterNodeList.length){
                                        callback(null,nodeDetailList);
                                    }else{
                                        return;
                                    }
                                }else if(nodeChefBody.err){
                                    nodeDetailList.push({error:nodeChefBody.err});
                                    if(nodeDetailList.length === filterNodeList.length){
                                        callback(null,nodeDetailList);
                                    }else{
                                        return;
                                    }
                                }else{
                                    var chefNodeObj = {
                                        chefServerId: chefDetail.rowid,
                                        chefNodeName: nodeChefBody.name,
                                        chefNodeEnv: nodeChefBody.chef_environment,
                                        chefJsonClass: nodeChefBody.json_class,
                                        chefType: nodeChefBody.chef_type,
                                        chefNodeIp: nodeChefBody.automatic.ipaddress,
                                        chefNodeFqdn: nodeChefBody.automatic.fqdn,
                                        chefNodePlatform: nodeChefBody.automatic.platform,
                                        chefNodeUpTime: nodeChefBody.automatic.uptime
                                    };
                                    nodeDetailList.push(chefNodeObj);
                                    chefNodeObj = {};
                                    if(nodeDetailList.length === filterNodeList.length){
                                        callback(null,nodeDetailList);
                                    }else{
                                        return;
                                    }
                                }
                            });
                        })(filterNodeList[i]);
                    }
                },
                environments: function(callback){
                    chef.getEnvironmentsList(callback);
                }

            },function(err,results){
                if(err){
                    next(err,null);
                }else{
                    next(null,results);
                }
            })
        },
        function(nodeDetails,next){
            saveChefNodeDetails(nodeDetails.nodes,nodeDetails.environments,next);
        }
    ], function (err, results) {
        if (err) {
            logger.error("Error in chef Sync");
            return;
        } else {
            logger.info("Chef Sync completed");
            return;
        }
    });
};

function getNodeListFilterWithManagedInstances(serverId,nodeList,callback){
    instancesDao.getInstancesFilterByChefServerIdAndNodeNames(serverId,nodeList,function(err, instances) {
        if (err) {
            callback(err,null);
            return;
        }
        if (instances.length > 0) {
            var count = 0;
            for (var i = 0; i < instances.length; i++) {
                (function(instance){
                    count++;
                    if(nodeList.indexOf(instance.chef.chefNodeName) >= 0){
                        nodeList.splice(nodeList.indexOf(instance.chef.chefNodeName),1);
                        return;
                    }else{
                        return;
                    }
                })(instances[i]);
            }
            if(count === instances.length){
                callback (null,nodeList);
            }
        } else {
            callback (null,nodeList);
        }
    });
};

function saveChefNodeDetails(nodeDetailList,envList,callback){
    var count = 0;
    for(var i = 0; i < nodeDetailList.length; i++) {
        (function (nodeDetails) {
            if(nodeDetails.error){
                count++;
                if (count === nodeDetailList.length) {
                    callback(null, nodeDetailList);
                }else{
                    return;
                }
            }else {
                nodeDetails.chefEnvironments = envList;
                chefDao.getChefNodeByChefName(nodeDetails.name, function (err, chefData) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                    } else if (chefData.length > 0) {
                        chefDao.updateChefNode(chefData[0]._id, nodeDetails, function (err, data) {
                            if (err) {
                                logger.error(err);
                                callback(err, null);
                            } else {
                                count++;
                                if (count === nodeDetailList.length) {
                                    callback(null, nodeDetailList);
                                }else{
                                    return;
                                }
                            }
                        });
                    } else {
                        chefDao.createChefNode(nodeDetails, function (err, data) {
                            if (err) {
                                logger.error(err);
                                callback(err, null);
                            } else {
                                count++;
                                if (count === nodeDetailList.length) {
                                    callback(null, nodeDetailList);
                                }else{
                                    return;
                                }
                            }
                        });
                    }
                });
            }
        })(nodeDetailList[i]);
    }
}

