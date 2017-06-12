
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var Chef = require('_pr/lib/chef');
var chefDao = require('_pr/model/dao/chefDao.js');
var appConfig = require('_pr/config');
var resources = require('_pr/model/resources/resources.js');
var instanceModel = require('_pr/model/resources/instance-resource');
var ChefSync = Object.create(CatalystCronJob);
ChefSync.interval = '*/5 * * * *';
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
    var chefRepoLocation = chefSettings.chefReposLocation + chefDetail.orgname_rowid[0];
    var chefObj = {
        userChefRepoLocation: chefRepoLocation + '/' + chefDetail.loginname +'/',
        chefUserName: chefDetail.loginname,
        chefUserPemFile: chefRepoLocation + chefDetail.folderpath + chefDetail.userpemfile_filename,
        chefValidationPemFile: chefRepoLocation + chefDetail.folderpath + chefDetail.validatorpemfile_filename,
        hostedChefUrl: chefDetail.url
    };
    var chef = new Chef(chefObj);
    async.waterfall([
        function(next){
            chef.getNodesList(next);
        },
        function(nodeList,next) {
            getChefNodeDetails(nodeList,chefObj,chefDetail.rowid,chefDetail.orgname_rowid[0],next);
        },
        function(nodeDetailList,next) {
            chefSyncWithChefNodes(nodeDetailList,next);
        },
        function(nodeDetailList,next){
            chefSyncWithTerminatedNodes(chefObj,chefDetail.orgname_rowid[0],next);
        }
    ],function(err,results){
        if (err) {
            logger.error("Error in chef Sync "+err);
            return;
        } else {
            logger.info("Chef Sync completed");
            return;
        }
    })
};

function chefSyncWithChefNodes(nodeDetailList,callback){
    logger.debug("Syncing Chef-Node Details is started");
    if(nodeDetailList.length > 0){
        var count = 0;
        nodeDetailList.forEach(function(nodeDetail){
            async.parallel({
                chefSync: function(callback){
                    chefDao.getChefNodes({serverId:nodeDetail.serverId,isDeleted:false,name:nodeDetail.name},function(err,chefNodes){
                        if(err){
                            logger.error("Error in fetching Chef Node Details:");
                            callback(err,null);
                        }else if(chefNodes.length > 0){
                            nodeDetail.updatedOn  = new Date().getTime();
                            chefDao.updateChefNodeDetailById(chefNodes[0]._id,nodeDetail,function (err, data) {
                                if (err) {
                                    logger.error("Error in updating Chef Node in DB:",err);
                                    callback(err,null);
                                }else{
                                    callback(null, nodeDetailList);
                                }
                            });
                        }else{
                            nodeDetail.createdOn  = new Date().getTime();
                            chefDao.createNew(nodeDetail, function (err, data) {
                                if (err) {
                                    logger.error("Error in creating Chef Node in DB:",err);
                                    callback(err,null);
                                }else{
                                    callback(null, nodeDetailList);
                                }
                            });
                        }
                    })
                },
                resourceSync: function(callback){
                    var query = {
                        $or: [{
                            'resourceDetails.publicIp': nodeDetail.ip
                            },
                            {
                                'resourceDetails.privateIp': nodeDetail.ip
                            },
                            {
                                'configDetails.nodeName': nodeDetail.name
                            },
                            {
                                'resourceDetails.platformId': nodeDetail.platformId
                            }],
                        isDeleted:false
                    }
                    instanceModel.getInstanceData(query,function(err,instances){
                        if(err){
                            logger.error("Error in fetching Resource Details in DB:",err);
                            callback(err,null);
                        }else if(instances.length > 0){
                            instanceModel.updateInstanceData(instances[0]._id,{'configDetails.id':nodeDetail.serverId,'configDetails.run_list':nodeDetail.run_list,'configDetails.override':nodeDetail.override},function(err,data){
                                if (err) {
                                    logger.error("Error in updating Resource Details in DB:",err);
                                    callback(err,null);
                                }else{
                                    callback(null, data);
                                }
                            })
                        }else{
                            callback(null,instances);
                        }
                    })
                }
            },function(err,results){
                if(err){
                    logger.error("Error in Chef-Node Syncing : ",err);
                }
                count++;
                if (count === nodeDetailList.length) {
                    logger.debug("Syncing Chef-Node Details is Done");
                    return callback(null, nodeDetailList);
                }
            })
        })
    }else{
        logger.debug("There is no Node present in Chef Server for Chef Sync:")
        return callback(null, nodeDetailList);
    }
};

function getAllTerminatedNodes(orgId,callback){
    async.waterfall([
        function(next){
           resources.getResources({'resourceDetails.state':'terminated','masterDetails.orgId':orgId,serverDeletedCheck:false},next);
        },
        function(terminatedResources,next){
            if(terminatedResources.length > 0){
                var nodeNameList = [];
                for(var i = 0; i < terminatedResources.length; i++){
                    if(terminatedResources[i].category ==='managed'){
                        nodeNameList.push({
                            id: terminatedResources[i]._id,
                            nodeName: terminatedResources[i].configDetails.nodeName
                        });
                    }else{
                        nodeNameList.push({
                            id: terminatedResources[i]._id,
                            nodeName: terminatedResources[i].platformId
                        });
                    }
                }
                next(null,nodeNameList);
            }else{
                logger.debug("Terminated Resources are not present in DB");
                next(null,terminatedResources);
            }
        }
    ], function (err, results) {
        if (err) {
            return callback(err,null);
        } else {
            return callback(null,results);
        }
    });
}

function chefSyncWithTerminatedNodes(chefObj,orgId,callback){
    logger.debug("Syncing Terminated Chef-Node Details is started");
    var chef = new Chef(chefObj);
    async.waterfall([
        function(next){
            getAllTerminatedNodes(orgId,next);
        },
        function(terminatedNodeList,next){
            if (terminatedNodeList.length > 0) {
                var count = 0;
                for (var i = 0; i < terminatedNodeList.length; i++) {
                    (function (terminateNode) {
                        async.parallel({
                                deleteTerminatedNodeFromDB: function (callback) {
                                    chefDao.removeTerminatedChefNodes({name: terminateNode.nodeName}, callback);
                                },
                                deleteTerminatedNodeFromChefServer: function (callback) {
                                    chef.deleteNode(terminateNode.nodeName, function (err, data) {
                                        if (err && err.chefStatusCode !== 404) {
                                            logger.error("Error in deleting Node from Chef Server: ", err);
                                        }
                                        callback(null,data);
                                    })
                                },
                                updateServerDeletedCheck: function (callback) {
                                    instanceModel.updateInstanceData(terminateNode.id,{serverDeletedCheck:true}, function (err, data) {
                                        if (err) {
                                            logger.error("Error in updating Server Delete check for Resource: ", err);
                                        }
                                        callback(null, data);
                                    })
                                }
                            },
                            function (err, results) {
                                if (err) {
                                    logger.error("Error in updating and deleting Terminated Resources for Chef Server:",err);
                                }
                                count++;
                                if(count === terminatedNodeList.length){
                                    next(null,results);
                                }
                            })
                    })(terminatedNodeList[i]);
                }
            } else{
                logger.debug("There is no Terminated Resources for Syncing Chef");
                next(null,terminatedNodeList);
            }
        }], function (err, results) {
        if (err) {
            callback(err,null);
            return;
        } else {
            logger.debug("Syncing Terminated Chef-Node Details is Done");
            callback(null,results);
            return;
        }
    });
}
function getChefNodeDetails(nodeList,chefObj,chefServerId,orgId,callback){
    logger.debug("Fetching Chef-Node Details is started");
    var chef = new Chef(chefObj);
    var nodeDetailList=[],count = 0;
    if(nodeList.length > 0) {
        nodeList.forEach(function(node) {
            chef.getNode(node, function (err, nodeDetail) {
                if (err || nodeDetail.err) {
                    logger.error("Error in getting Node Details from Chef : ", err || nodeDetail.err);
                    count++;
                    if (count === nodeList.length) {
                        return callback(null, nodeDetailList);
                    }
                } else {
                    var chefNodeObj = {
                        serverId: chefServerId,
                        orgId: orgId,
                        name: nodeDetail.name,
                        envName: nodeDetail.chef_environment,
                        jsonClass: nodeDetail.json_class,
                        type: nodeDetail.chef_type,
                        fqdn: nodeDetail.automatic.fqdn,
                        upTime: nodeDetail.automatic.uptime,
                        idleTime: nodeDetail.automatic.idletime,
                        state:"unknown"
                    };
                    if (!nodeDetail.automatic) {
                        nodeDetail.automatic = {};
                    }
                    var nodeIp = null,platformId = null;
                    if (nodeDetail.automatic.ipaddress) {
                        nodeIp = nodeDetail.automatic.ipaddress;
                    }
                    if (nodeDetail.automatic.cloud) {
                        if (nodeDetail.automatic.cloud.public_ipv4 && nodeDetail.automatic.cloud.public_ipv4 !== 'null') {
                            nodeIp = nodeDetail.automatic.cloud.public_ipv4;
                        }
                        if (nodeDetail.automatic.cloud.provider === 'ec2') {
                            if (nodeDetail.automatic.ec2) {
                                platformId = nodeDetail.automatic.ec2.instance_id;
                            }
                        }
                    }
                    chefNodeObj.ip = nodeIp;
                    chefNodeObj.platformId = platformId;
                    var hardwareData = {
                        platform: '-',
                        platformVersion: '-',
                        platformFamily: '-',
                        architecture: '-',
                        memory: {
                            total: '-',
                            free: '-'
                        },
                        os: 'linux'
                    };
                    if (nodeDetail.automatic.os) {
                        hardwareData.os = nodeDetail.automatic.os;
                    }
                    if (nodeDetail.automatic.kernel && nodeDetail.automatic.kernel.machine) {
                        hardwareData.architecture = nodeDetail.automatic.kernel.machine;
                    }
                    if (nodeDetail.automatic.platform) {
                        hardwareData.platform = nodeDetail.automatic.platform;
                    }
                    if (nodeDetail.automatic.platform_version) {
                        hardwareData.platformVersion = nodeDetail.automatic.platform_version;
                    }
                    if (nodeDetail.automatic.platform_family) {
                        hardwareData.platformFamily = nodeDetail.automatic.platform_family;
                    }
                    if (nodeDetail.automatic.memory) {
                        hardwareData.memory.total = nodeDetail.automatic.memory.total;
                        hardwareData.memory.free = nodeDetail.automatic.memory.free;
                    }
                    var run_list = nodeDetail.run_list;
                    if (!run_list) {
                        run_list = [];
                    }
                    if (hardwareData.platform === 'windows') {
                        hardwareData.os = "windows";
                    }
                    chefNodeObj.hardware = hardwareData;
                    chefNodeObj.run_list = run_list;
                    nodeDetailList.push(chefNodeObj);
                    count++;
                    if (count === nodeList.length) {
                        logger.debug("Fetching Chef-Node Details is Done");
                        return callback(null, nodeDetailList);
                    }
                }
            });
        });
    }else{
        logger.debug("There is no Node present in Chef Server:")
        return callback(null, nodeList);
    }
}

