
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var Chef = require('_pr/lib/chef');
var chefDao = require('_pr/model/dao/chefDao.js');
var appConfig = require('_pr/config');

var instancesDao = require('_pr/model/classes/instance/instance');
var assignedDao = require('_pr/model/unmanaged-instance');
var unassignedDao = require('_pr/model/unassigned-instances');

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
    }
    var chef = new Chef(chefObj);
    async.waterfall([
        function(next){
            chef.getNodesList(next);
        },
        function(nodeList,next){
            async.parallel({
                chefSyncWithNewNode: function(callback){
                    async.waterfall([
                        function(next){
                            getNodeListFilterWithChefNodes(chefDetail.rowid,nodeList,next);
                        },
                        function(filterNodeList,next){
                            if(filterNodeList.length > 0) {
                                getChefNodeDetails(filterNodeList,chefObj,chefDetail.rowid,next);
                            }else{
                                next(null,filterNodeList);
                            }
                        },
                        function(nodeDetailsList,next){
                            saveChefNodeDetails(nodeDetailsList,next);
                        }
                    ], function (err, results) {
                        if (err) {
                            callback(err,null);
                            return;
                        } else {
                            callback(null,results);
                            return;
                        }
                    });
                },
                chefSyncWithTerminatedNode: function(callback){
                    chefSyncWithTerminatedInstance(chefObj,chefDetail.orgname_rowid,nodeList,callback);
                },

            },function(err,results){
                if (err) {
                    next(err,null);
                } else {
                    next(null,results);
                }
            })
        },
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

function getNodeListFilterWithChefNodes(serverId,nodeList,next){
    var chefNodeList = [];
    async.waterfall([
        function(next){
            chefDao.getChefNodesByServerId(serverId,next);
        },
        function(nodes,next){
            if (nodes.length > 0) {
                var count = 0;
                for (var i = 0; i < nodes.length; i++) {
                    (function(node){
                        count++;
                        if(nodeList.indexOf(node.chefNodeName) >= 0){
                            nodeList.splice(nodeList.indexOf(node.chefNodeName),1);
                            return;
                        }else{
                            chefNodeList.push(node.chefNodeName);
                            return;
                        }
                    })(nodes[i]);
                }
                if(count === nodes.length){
                    next(null,nodeList);
                }
            } else {
                next(null,nodeList);
            }
        },
        function(filterNodesList,next){
            if(chefNodeList.length > 0){
                var count = 0;
                for (var i = 0; i < chefNodeList.length; i++) {
                    (function(nodeName){
                        chefDao.removeChefNodeByChefName(nodeName,function(err,data) {
                            if (err) {
                                return next(err, null);
                            }else{
                                count++;
                                if(count === chefNodeList.length){
                                    return next(null,filterNodesList);
                                }else{
                                    return;
                                }
                            }
                        });
                    })(chefNodeList[i]);
                }
            }else{
                next(null,filterNodesList);
            }
        }
    ],function(err,results){
        if(err){
            next(err,null);
        }else{
            next(null,results);
        }
    });
};

function getAllTerminatedNodes(orgId,callback){
    async.parallel({
        managedNodes: function (callback) {
            instancesDao.getAllTerminatedInstances(orgId,function(err,instances){
                if(err){
                    callback(err,null);
                }else{
                    var nodeNameList=[];
                    for(var i = 0; i < instances.length;i++){
                        (function(instance){
                            nodeNameList.push(instance.chef.chefNodeName);
                        })(instances[i]);
                    }
                    if(nodeNameList.length === instances.length)
                    {
                        callback(null,nodeNameList);
                    }
                }
            })
        },
        assignedNodes: function (callback) {
            assignedDao.getAllTerminatedInstances(orgId,function(err,instances){
                if(err){
                    callback(err,null);
                }else{
                    var nodeNameList=[];
                    for(var i = 0; i < instances.length;i++){
                        (function(instance){
                            nodeNameList.push(instance.platformId);
                        })(instances[i]);
                    }
                    if(nodeNameList.length === instances.length)
                    {
                        callback(null,nodeNameList);
                    }
                }
            })
        },
        unassignedNodes: function (callback) {
            unassignedDao.getAllTerminatedInstances(orgId,function(err,instances){
                if(err){
                    callback(err,null);
                }else{
                    var nodeNameList=[];
                    for(var i = 0; i < instances.length;i++){
                        (function(instance){
                            nodeNameList.push(instance.platformId);
                        })(instances[i]);
                    }
                    if(nodeNameList.length === instances.length)
                    {
                        callback(null,nodeNameList);
                    }
                }
            })
        }
    }, function (err, results) {
        if (err) {
            callback(err,null);
            return;
        } else {
            var resultList = [];
            if(results.managedNodes.length > 0){
                resultList = resultList.concat(results.managedNodes);
            }
            if(results.assignedNodes.length > 0){
                resultList = resultList.concat(results.assignedNodes);
            }
            if(results.unassignedNodes.length > 0){
                resultList = resultList.concat(results.unassignedNodes);
            }
            callback(null,resultList);
            return;
        }
    });
}


function chefSyncWithTerminatedInstance(chefObj,orgId,nodeNameList,callback){
    var chef = new Chef(chefObj);
    async.waterfall([
        function(next){
            getAllTerminatedNodes(orgId,next);
        },
        function(terminatedNode,next){
            if(terminatedNode.length > 0){
                var nodeList = [];
                var count = 0;
                for(var i = 0; i < terminatedNode.length;i++){
                    (function(node){
                        if(nodeNameList.indexOf(node) !== -1){
                            count++;
                            nodeList.push(node);
                            return;
                        }else{
                            count++;
                            return;
                        }

                    })(terminatedNode[i]);
                }
                if(count === terminatedNode.length){
                    next(null,nodeList);
                }
            }else{
                next(null,terminatedNode)
            }
        },
        function(nodeNameList,next) {
            if (nodeNameList.length > 0) {
                async.parallel({
                        deleteTerminatedNodeFromDB: function (callback) {
                            chefDao.removeChefNodeByChefName(nodeNameList, callback);
                        },
                        deleteTerminatedNodeFromChefServer: function (callback) {
                            var count = 0;
                            for (var i = 0; i < nodeNameList.length; i++) {
                                (function (nodeName) {
                                    chef.deleteNode(nodeName, function (err, data) {
                                        count++;
                                        if (count === nodeNameList.length) {
                                            return callback(null, data);
                                        } else {
                                            return;
                                        }
                                    })
                                })(nodeNameList[i]);
                            }
                        }
                    },
                    function (err, results) {
                        if (err) {
                            next(err, null);
                        } else {
                            next(null, results);
                        }
                    })
            } else{
                next(null,nodeNameList);
            }
        }], function (err, results) {
        if (err) {
            callback(err,null);
            return;
        } else {
            callback(null,results);
            return;
        }
    });
}

function getChefNodeDetails(filterNodeList,chefObj,chefServerId,callback){
    var chef = new Chef(chefObj);
    var nodeDetailList=[];
    for (var i = 0; i < filterNodeList.length; i++) {
        (function (filterNode) {
            chef.getNode(filterNode, function (err, nodeChefBody) {
                if (err) {
                    nodeDetailList.push({error: err});
                    if (nodeDetailList.length === filterNodeList.length) {
                        return callback(null, nodeDetailList);
                    } else {
                        return;
                    }
                } else if (nodeChefBody.err) {
                    nodeDetailList.push({error: nodeChefBody.err});
                    if (nodeDetailList.length === filterNodeList.length) {
                        return callback(null, nodeDetailList);
                    } else {
                        return;
                    }
                } else {
                    var chefNodeObj = {
                        chefServerId: chefServerId,
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
                    if (nodeDetailList.length === filterNodeList.length) {
                        return callback(null, nodeDetailList);
                    } else {
                        return;
                    }
                }
            });
        })(filterNodeList[i]);
    }
}

function saveChefNodeDetails(nodeDetailList,callback){
    var count = 0;
    if(nodeDetailList.length > 0) {
        for (var i = 0; i < nodeDetailList.length; i++) {
            (function (nodeDetails) {
                if (nodeDetails.error) {
                    count++;
                    if (count === nodeDetailList.length) {
                        callback(nodeDetails.error, null);
                    } else {
                        return;
                    }
                } else {
                    chefDao.createChefNode(nodeDetails, function (err, data) {
                        if (err) {
                            logger.error(err);
                            callback(err, null);
                        } else {
                            count++;
                            if (count === nodeDetailList.length) {
                                callback(null, data);
                            } else {
                                return;
                            }
                        }
                    });
                }
            })(nodeDetailList[i]);
        }
    }else{
        callback(null,null);
    }
}

