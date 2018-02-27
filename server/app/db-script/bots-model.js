

var logger = require('_pr/logger')(module);
var mongodbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var taskHistoryDao = require('_pr/model/classes/tasks/taskHistory.js');
var blueprintDao = require('_pr/model/blueprint/blueprint.js');
var botOldService = require('_pr/services/botOldService.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var botAuditTrail = require('_pr/model/audit-trail/bot-audit-trail.js');
var async = require('async');

var dbOptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongodbConnect(dbOptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dbOptions.host, dbOptions.port, dbOptions.dbName);
    }
});

async.parallel({
    taskSync: function(callback){
        taskDao.getAllServiceDeliveryTask(true,function(err,tasks){
            if(err){
                logger.error("Failed to fetch BOTs Task", err);
                callback(err,null);
            }else if(tasks.length > 0){
                var count = 0;
                for(var i = 0 ; i < tasks.length;i++){
                    (function(task){
                        botService.createOrUpdateBots(task, 'Task', task.taskType, function (err, data) {
                            if (err) {
                                logger.error("Error in creating bots entry." + err);
                            }
                            count++;
                            logger.debug("Successfully added Task data for Bots.")
                            if(count ===tasks.length){
                                callback(null,tasks);
                                return;
                            }
                        });
                    })(tasks[i]);
                }

            }else{
                logger.debug("There is no BOTs task in DB.");
                callback(null,tasks);
            }
        })
    },
    blueprintSync: function(callback){
        blueprintDao.getAllServiceDeliveryBlueprint(true,function(err,blueprints){
            if(err){
                logger.error("Failed to fetch BOTs Blueprint", err);
                callback(err,null);
            }else if(blueprints.length > 0){
                var count = 0;
                for(var i = 0 ; i < blueprints.length;i++){
                    (function(blueprint){
                        masterUtil.getParticularProject(blueprint.projectId, function (err, project) {
                            if (err) {
                                logger.error(err);
                                count++;
                                if(count ===blueprints.length){
                                    callback(null,blueprints);
                                    return;
                                }
                            } else if (project.length > 0) {
                                blueprint.orgName = project[0].orgname;
                                blueprint.bgName = project[0].productgroupname;
                                blueprint.projectName = project[0].projectname;
                                botOldService.createOrUpdateBots(blueprint, 'Blueprint', blueprint.blueprintType, function (err, botsData) {
                                    if (err) {
                                        logger.error("Error in creating bots entry. " + err);
                                    }
                                    count++;
                                    logger.debug("Successfully added Blueprint data for Bots.")
                                    if(count ===blueprints.length){
                                        callback(null,blueprints);
                                        return;
                                    }
                                });
                            } else {
                                logger.debug("Unable to find Project Information from project id:");
                                count++;
                                if(count ===blueprints.length){
                                    callback(null,blueprints);
                                    return;
                                }
                            }
                        });
                    })(blueprints[i]);
                }

            }else{
                logger.debug("There is no BOTs Nlueprint in DB.");
                callback(null,blueprints);
            }
        })
    },
    botsAuditTrailSync: function(callback){
        taskDao.getAllServiceDeliveryTask(true,function(err,tasks){
            if(err){
                logger.error("Failed to fetch BOTs Task", err);
                callback(err,null);
            }else if(tasks.length > 0){
                var count = 0;
                for(var i = 0 ; i < tasks.length;i++){
                    (function(task){
                        var queryObj = {
                            taskId:task._id
                        }
                        taskHistoryDao.getTaskHistory(queryObj,function(err,taskHistories){
                            if(err){
                                count++;
                                logger.error("Failed to fetch BOTs Task History", err);
                                if(count ===tasks.length){
                                    callback(null,tasks);
                                    return;
                                }
                            }else if(taskHistories.length > 0){
                                count++;
                                var taskHistoryCount = 0;
                                for(var i = 0; i < taskHistories.length;i++){
                                    (function(taskHistory){
                                        var auditTrailObj = {
                                            auditId: task._id,
                                            auditType: 'BOTOLD',
                                            masterDetails:{
                                                orgId: task.orgId,
                                                orgName: task.orgName,
                                                bgId: task.bgId,
                                                bgName: task.bgName,
                                                projectId: task.projectId,
                                                projectName: task.projectName,
                                                envId: task.envId,
                                                envName: task.envName
                                            },
                                            status: taskHistory.status,
                                            auditCategory:'Task',
                                            actionStatus: taskHistory.status,
                                            user: 'superadmin',
                                            startedOn: taskHistory.timestampStarted,
                                            endedOn: taskHistory.timestampEnded,
                                            action: 'BOTs Task Execution',
                                            auditTrailConfig:{
                                                nodeIds:task.taskConfig.nodeIds,
                                                name:task.name,
                                                type:task.botType,
                                                description:task.shortDesc,
                                                category:task.botCategory,
                                                executionType:task.taskType,
                                                manualExecutionTime:task.manualExecutionTime,
                                                nodeIdsWithActionLog:taskHistory.nodeIdsWithActionLog
                                            },
                                            auditHistoryId:taskHistory._id,
                                            actionLogId: taskHistory.nodeIdsWithActionLog[0].actionLogId,
                                        };
                                        if(task.taskType ==='jenkins'){
                                            auditTrailObj.actionLogId =taskHistory.jenkinsServerId;
                                            auditTrailObj.auditTrailConfig.jenkinsBuildNumber=taskHistory.buildNumber;
                                            auditTrailObj.auditTrailConfig.jenkinsJobName=taskHistory.jobName;
                                            auditTrailObj.auditTrailConfig.jobResultURL=taskHistory.jobResultURL;
                                            botAuditTrail.createNew(auditTrailObj,function(err,data){
                                                if(err){
                                                    logger.error(err);
                                                    taskHistoryCount++;
                                                    if(count ===tasks.length && taskHistoryCount === taskHistories.length){
                                                        callback(null,tasks);
                                                        return;
                                                    }
                                                }else{
                                                    taskHistoryCount++;
                                                    if(count ===tasks.length && taskHistoryCount === taskHistories.length){
                                                        callback(null,tasks);
                                                        return;
                                                    }
                                                }
                                            });
                                        }else{
                                            botAuditTrail.createNew(auditTrailObj,function(err,data){
                                                if(err){
                                                    logger.error(err);
                                                    taskHistoryCount++;
                                                    if(count ===tasks.length && taskHistoryCount === taskHistories.length){
                                                        callback(null,tasks);
                                                        return;
                                                    }
                                                }else{
                                                    taskHistoryCount++;
                                                    if(count ===tasks.length && taskHistoryCount === taskHistories.length){
                                                        callback(null,tasks);
                                                        return;
                                                    }
                                                }
                                            });
                                        }
                                    })(taskHistories[i]);
                                }
                            }else{
                                count++;
                                logger.debug("There is no BOTs task History in DB.");
                                if(count ===tasks.length){
                                    callback(null,tasks);
                                    return;
                                }
                            }
                        })
                    })(tasks[i]);
                }
            }else{
                logger.debug("There is no BOTs task in DB.");
                callback(null,tasks);
            }
        })
    },
},function(err,results){
    if(err){
        logger.error("Failed to sync Bots with Task and Blueprint ", err);
        process.exit();
    }else{
        logger.debug("Bots Sync is Done with Task and Blueprint ");
        process.exit();
    }
})


