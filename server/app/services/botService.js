
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

var logger = require('_pr/logger')(module);
var fs = require('fs')
var botDao = require('_pr/model/bots/1.1/bot.js');
var runbookDao = require('../model/runbook/runbook');
var scheduledBots = require('../model/scheduled-bots/scheduledBots');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileUpload = require('_pr/model/file-upload/file-upload');
var appConfig = require('_pr/config');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var auditTrailSummary = require('_pr/model/audit-trail/bot-audit-trail-summary')
var auditTrailService = require('_pr/services/auditTrailService.js');
var scriptExecutor = require('_pr/engine/bots/scriptExecutor.js');
var chefExecutor = require('_pr/engine/bots/chefExecutor.js');
var blueprintExecutor = require('_pr/engine/bots/blueprintExecutor.js');
var jenkinsExecutor = require('_pr/engine/bots/jenkinsExecutor.js');
var fileIo = require('_pr/lib/utils/fileio');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var uuid = require('node-uuid');
var settingService = require('_pr/services/settingsService');
var commonService = require('_pr/services/commonService');
var crontab = require('node-crontab');

const fileHound = require('filehound');
const yamlJs = require('yamljs');
var gitHubService = require('_pr/services/gitHubService.js');
var gitHubModel = require('_pr/model/github/github.js');
const errorType = 'botService';
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var digitalOceanProvider = require('_pr/model/classes/masters/cloudprovider/digitalOceanProvider');
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var azurecloudProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var botAuditTrailSummary = require('_pr/model/audit-trail/bot-audit-trail-summary');

var appConfig = require('_pr/config');
var botService = module.exports = {};

botService.createNew = function createNew(reqBody, callback) {
    commonService.convertJson2Yml(reqBody, function (err, ymlData) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            botDao.createNew(ymlData, function (err, data) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                    return;
                } else {
                    callback(null, data);
                    return;
                }
            });
        }
    })
}

function createBotScheduler(botId, inputParam, schedulerPatternObj, callback) {
    botDao.getBotsById(botId, function (err, data) {
        if (err) callback(err, null);
        else {
            if (data.length > 0) {
                var ifDeleted = crontab.cancelJob(data[0].cronJobId);
                if (ifDeleted === true) logger.info('Cron Job', data[0].cronJobId, 'Deleted');
                scheduledBots.update({ botId: botId }, {
                    $set: {
                        botName: data[0].id,
                        params: inputParam,
                        botId: botId,
                        scheduler: {
                            cronStartOn: schedulerPatternObj.cronStartOn,
                            cronEndOn: schedulerPatternObj.cronEndOn,
                            cronPattern: schedulerPatternObj.cronPattern,
                            cronRepeatEvery: schedulerPatternObj.cronRepeatEvery,
                            cronFrequency: schedulerPatternObj.cronFrequency,
                            cronMinute: schedulerPatternObj.cronMinute,
                            cronHour: schedulerPatternObj.cronHour,
                            cronWeekDay: schedulerPatternObj.cronWeekDay,
                            cronDate: schedulerPatternObj.cronDate,
                            cronMonth: schedulerPatternObj.cronMonth,
                            cronYear: schedulerPatternObj.cronYear,
                            cronAlternateExecute: schedulerPatternObj.cronAlternateExecute
                        }
                    }
                }, { upsert: true }, function (err) {
                    if (err) callback(err);
                    else {
                        callback(null);
                    }
                });
            } else {
                callback('No Bot exists for this bot ID');
            }
        }
    })
}

botService.updateBotsScheduler = function updateBotsScheduler(botId, botObj, callback) {
    if (botObj.scheduler && botObj.scheduler !== null && Object.keys(botObj.scheduler).length !== 0 && botObj.isScheduled && botObj.isScheduled === true) {
        var inputParam = botObj.scheduler.cronInputParam;
        botObj.scheduler = apiUtil.createCronJobPattern(botObj.scheduler);
        createBotScheduler(botId, inputParam, botObj.scheduler, function (err) {
            if (err) logger.error(err);
            else {
                botObj.isScheduled = true;
            }
        });
    } else {
        botObj.scheduler = {};
        botObj.isScheduled = false;
    }
    botDao.updateBotsDetail(botId, botObj, function (err, data) {
        if (err) {
            logger.error("Error in Updating BOTs Scheduler", err);
            callback(err, null);
            return;
        } else {
            botDao.getBotsById(botId, function (err, botsList) {
                if (err) {
                    logger.error("Error in fetching BOTs", err);
                } else {
                    //if unschedule check if removed...
                    callback(null, data);
                    var schedulerService = require('_pr/services/schedulerService.js');
                    schedulerService.executeNewScheduledBots(botsList[0], function (err, schData) {
                        if (err) {
                            logger.error("Error in executing New BOTs Scheduler");
                        }
                    });
                }
            });
        }
    });
}

botService.removeBotsById = function removeBotsById(botId, callback) {
    async.parallel({
        bots: function (callback) {
            botDao.removeBotsById(botId, callback);
        },
        auditTrails: function (callback) {
            auditTrail.removeAuditTrails({ auditId: botId }, callback);
        }
    }, function (err, resutls) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, resutls);
            return;
        }
    });
}

botService.getBotById = function getBotById(botId, callback) {
    botDao.getBotsByBotId(botId, (err, bot) => {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else if (bot.length > 0) {
            if (bot[0].ymlDocFileId && bot[0].ymlDocFileId !== null) {
                logger.info("in botservice......");
                fileUpload.getReadStreamFileByFileId(bot[0].ymlDocFileId, function (err, file) {
                    if (err) {
                        logger.error("Error in fetching YAML Documents for : " + bot[0].name + " " + err);
                    }
                    var botsObj = {
                        _id: bot[0]._id,
                        name: bot[0].name,
                        gitHubId: bot[0].gitHubId,
                        id: bot[0].id,
                        desc: bot[0].desc,
                        action: bot[0].action,
                        category: bot[0].category,
                        type: bot[0].type,
                        subType: bot[0].subType,
                        inputFormFields: bot[0].input,
                        outputOptions: bot[0].output,
                        ymlDocFileId: bot[0].ymlDocFileId,
                        orgId: bot[0].orgId,
                        orgName: bot[0].orgName,
                        ymlFileName: file !== null ? file.fileName : file,
                        ymlFileData: file !== null ? file.fileData : file,
                        isScheduled: bot[0].isScheduled,
                        manualExecutionTime: bot[0].manualExecutionTime,
                        executionCount: bot[0].executionCount,
                        scheduler: bot[0].scheduler,
                        createdOn: bot[0].createdOn,
                        lastRunTime: bot[0].lastRunTime,
                        savedTime: bot[0].savedTime,
                        source: bot[0].source,
                        execution: bot[0].execution,
                        lastExecutionStatus: bot[0].lastExecutionStatus
                    }
                    if (bot[0].type === 'jenkins') {
                        botsObj.isParameterized = bot[0].isParameterized;
                    }
                    if (botsObj.gitHubId) {
                        //fetching github details
                        gitHubModel.getById(botsObj.gitHubId, function (errgh, ghdata) {
                            if (errgh) {
                                logger.error("Error in fetching Github details for : " + botsObj.name + " " + errgh);
                            }
                            else {
                                botsObj.repoMode = ghdata.repoMode;
                            }
                            return callback(null, botsObj);
                        });
                    } else {
                        return callback(null, botsObj);
                    }

                })
            }
        } else {
            callback(null, []);
            return;
        }
    })
}

botService.getBotsList = function getBotsList(botsQuery, actionStatus, serviceNowCheck, userName, callback) {
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(botsQuery, 'bots', next);
        },
        function (paginationReq, next) {
            paginationReq['searchColumns'] = ['name', 'type', 'category', 'desc', 'orgName'];
            paginationReq['select'] = ['name', 'type', 'category', 'desc', 'orgName', 'lastRunTime', 'executionCount', 'savedTime', 'id', '_id']
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            if (actionStatus !== null) {
                var query = {
                    actionStatus: actionStatus,
                    isDeleted: false
                };
                var botsIds = [];
                auditTrail.getAuditTrails(query, function (err, botsAudits) {
                    if (err) {
                        next(err, null);
                    } else if (botsAudits.length > 0) {
                        for (var i = 0; i < botsAudits.length; i++) {
                            if (botsIds.indexOf(botsAudits[i].auditId) < 0) {
                                botsIds.push(botsAudits[i].auditId);
                            }
                        }
                        queryObj.queryObj._id = { $in: botsIds };
                        settingService.getOrgUserFilter(userName, function (err, orgIds) {
                            if (err) {
                                next(err, null);
                            } else if (orgIds.length > 0) {
                                queryObj.queryObj['orgId'] = { $in: orgIds };
                                botDao.getBotsList(queryObj, next);
                            } else {
                                botDao.getBotsList(queryObj, next);
                            }
                        });
                    } else {
                        queryObj.queryObj._id = null;
                        settingService.getOrgUserFilter(userName, function (err, orgIds) {
                            if (err) {
                                next(err, null);
                            } else if (orgIds.length > 0) {
                                queryObj.queryObj['orgId'] = { $in: orgIds };
                                botDao.getBotsList(queryObj, next);
                            } else {
                                botDao.getBotsList(queryObj, next);
                            }
                        });
                    }
                });
            } else if (serviceNowCheck === true) {
                delete queryObj.queryObj;
                delete queryObj.options.select;
                settingService.getOrgUserFilter(userName, function (err, orgIds) {
                    if (err) {
                        next(err, null);
                    } else if (orgIds.length > 0) {
                        queryObj.queryObj = {
                            auditType: 'BOT',
                            actionStatus: 'success',
                            'auditTrailConfig.serviceNowTicketRefObj': { $ne: null },
                            isDeleted: false,
                            'masterDetails.orgId': { $in: orgIds }
                        };
                        //adding filter by startdate and enddate
                        if (botsQuery.ticketsdate && botsQuery.ticketedate) {
                            //queryObj.queryObj.auditTrailConfig.serviceNowTicketRefObj.
                            var sdate = new Date(botsQuery.ticketsdate);
                            sdate = Math.floor(sdate / 1000);
                            var edate = new Date(botsQuery.ticketedate);
                            edate = Math.floor(edate / 1000);
                            queryObj.queryObj['auditTrailConfig.serviceNowTicketRefObj.createdOn'] = { $lte: edate, $gte: sdate };
                        }
                        auditTrail.getAuditTrailList(queryObj, next);
                    } else {
                        queryObj.queryObj = {
                            auditType: 'BOT',
                            actionStatus: 'success',
                            'auditTrailConfig.serviceNowTicketRefObj': { $ne: null },
                            isDeleted: false
                        };
                        auditTrail.getAuditTrailList(queryObj, next);
                    }
                });
            } else {
                settingService.getOrgUserFilter(userName, function (err, orgIds) {
                    if (err) {
                        next(err, null);
                    } else if (orgIds.length > 0) {
                        queryObj.queryObj['orgId'] = { $in: orgIds };
                        botDao.getBotsList(queryObj, next);
                    } else {
                        botDao.getBotsList(queryObj, next);
                    }
                });
            }
        },
        function (filterBotList, next) {
            apiUtil.paginationResponse(filterBotList, reqData, callback);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        var resultObj = {
            bots: results.botList.bots,
            metaData: results.botList.metaData,
        }
        callback(null, resultObj);
        return;
    });
}

botService.executeBots = function executeBots(botsId, reqBody, userName, executionType, schedulerCallCheck, callback) {
    var botId = null;
    var botRemoteServerDetails = {};
    var bots = [];
    logger.info("Entering WF");
    async.waterfall([
        function (next) {
            botDao.getBotsByBotId(botsId, next);
        },
        function (botList, next) {
            bots = botList;
            logger.info("Got Bots " + JSON.stringify(bots));
            if (schedulerCallCheck)
                scheduledBots.getScheduledBotsByBotId(botsId, next);
            else next(null, []);
        },
        function (scheduledBots, next) {
            if (bots.length > 0) {
                logger.info("Got Bots " + JSON.stringify(scheduledBots));
                botId = bots[0]._id;
                if (scheduledBots.length > 0) {
                    //included check for params if empty.
                    var scheduledRequestBody = {};
                    if (bots[0].params)
                        scheduledRequestBody.data = scheduledBots[0].params;
                    //reqBody = scheduledRequestBody;
                }
                logger.info(bots[0].type);
                //TO DO: There is no else condition, need to check...
                if (bots[0].type === 'script' || bots[0].type === 'chef' || bots[0].type === 'blueprints') {
                    //logger.info("Executing BOTs Deatails", bots[0].execution[0].os, bots[0].execution[0].type);
                    masterUtil.getBotRemoteServerDetailByOrgId(bots[0].orgId, function (err, botServerDetails) {
                        if (err) {
                            logger.error("Error while fetching BOTs Server Details");
                            callback(err, null);
                            return;

                        } else if (botServerDetails !== null && botServerDetails.length > 0) {
                            logger.info("Checking flag status--->", appConfig.enableBotExecuterOsCheck)
                            if (bots[0].type === 'blueprints') {
                                botRemoteServerDetails.hostIP = botServerDetails[0].hostIP;
                                botRemoteServerDetails.hostPort = botServerDetails[0].hostPort;
                            } else {
                                if (appConfig.enableBotExecuterOsCheck === true || process.env.enableBotExecuterOsCheck === true) {
                                    logger.info("Inn OS check condition");
                                    executorOsTypeConditionCheck(botServerDetails, botRemoteServerDetails, bots);
                                } else {

                                    botRemoteServerDetails.hostIP = botServerDetails[0].hostIP;
                                    botRemoteServerDetails.hostPort = botServerDetails[0].hostPort;
                                    logger.info("Default Details as working without Multiple executor feature", botRemoteServerDetails.hostIP, botRemoteServerDetails.hostPort);
                                }
                            }
                            encryptedParam(reqBody, next);
                        } else {
                            var error = new Error();
                            error.message = 'BOTs Remote Engine is not configured or not in running mode';
                            error.status = 403;
                            next(error, null);
                        }
                    });

                }

            } else {
                var error = new Error();
                error.message = 'There is no record available in DB against BOT : ' + botsId;
                error.status = 403;
                next(error, null);
            }
        },
        function (paramObj, next) {
            var botObj = {
                params: paramObj
            }
            if (reqBody.nodeIds) {
                botObj.params.nodeIds = reqBody.nodeIds;
            }
            logger.info("Updating bot details" + JSON.stringify(botObj));
            botDao.updateBotsDetail(botId, botObj, next);
        },
        function (updateStatus, next) {
            botDao.getBotsById(botId, next);
        },
        function (botDetails, next) {
            if (botDetails.length > 0) {
                logger.info("Executor in parallel " + JSON.stringify(botDetails));
                async.parallel({
                    executor: function (callback) {
                        async.waterfall([
                            function (next) {
                                var actionObj = {
                                    auditType: 'BOT',
                                    auditCategory: botDetails[0].type,
                                    status: 'running',
                                    action: 'BOT Execution',
                                    actionStatus: 'running',
                                    catUser: userName
                                };
                                var auditTrailObj = {
                                    name: botDetails[0].name,
                                    type: botDetails[0].action,
                                    description: botDetails[0].desc,
                                    category: botDetails[0].category,
                                    executionType: botDetails[0].type,
                                    manualExecutionTime: botDetails[0].manualExecutionTime
                                };
                                if (schedulerCallCheck === false && reqBody.ref && reqBody.ref !== null) {
                                    auditTrailObj.serviceNowTicketRefObj = {
                                        ticketNo: reqBody.ref, //sys id , ticket number is stored in number
                                        configName: reqBody.configName,
                                        tableName: reqBody.tableName
                                    }
                                }
                                var d = new Date();
                                var year = d.getUTCFullYear();
                                var month = d.getUTCMonth();
                                var day = d.getUTCDate();
                                var startHour = Date.UTC(year, month, day, 0, 0, 0, 0);
                                botAuditTrailSummary.update({
                                    botID: botDetails[0].id,
                                    user: userName,
                                    date: startHour,
                                }, { $inc: { "runningCount": 1 } }, { upsert: true }, function (err, data) {
                                    if (err) logger.error(JSON.stringify(err))
                                    else logger.info("Running count of bot ", botDetails[0].name, "incremented successfully")
                                })
                                auditTrailService.insertAuditTrail(botDetails[0], auditTrailObj, actionObj, next);
                            },
                            function (auditTrail, next) {
                                var uuid = require('node-uuid');
                                botDetails[0].params.category = botDetails[0].type;
                                auditTrail.actionId = uuid.v4();
                                if (botDetails[0].type === 'script') {
                                    scriptExecutor.execute(botDetails[0], auditTrail, userName, executionType, botRemoteServerDetails, next);
                                } else if (botDetails[0].type === 'chef') {
                                    chefExecutor.execute(botDetails[0], auditTrail, userName, executionType, botRemoteServerDetails, next);
                                } else if (botDetails[0].type === 'blueprints') {
                                    reqBody = botDetails[0].params;
                                    logger.info("About to execute " + botDetails[0].id);
                                    logger.info("reqBody");
                                    logger.info(reqBody);

                                    blueprintExecutor.execute(botDetails[0].id, auditTrail, reqBody, userName, next);
                                } else if (botDetails[0].type === 'jenkins') {
                                    reqBody = botDetails[0].params;
                                    jenkinsExecutor.execute(botDetails[0], auditTrail, reqBody, userName, next);
                                } else {
                                    var err = new Error('Invalid BOT Type');
                                    err.status = 400;
                                    err.msg = 'Invalid BOT Type';
                                    callback(err, null);
                                }
                            }
                        ], function (err, executionResult) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                callback(null, executionResult);
                                return;
                            }
                        })
                    },
                    bots: function (callback) {
                        if (botDetails[0].type === 'script' || botDetails[0].type === 'chef' || botDetails[0].type === 'jenkins' || botDetails[0].type === 'blueprints') {
                            var botExecutionCount = botDetails[0].executionCount + 1;
                            var botUpdateObj = {
                                executionCount: botExecutionCount,
                                lastRunTime: new Date().getTime()
                            }
                            botDao.updateBotsDetail(botId, botUpdateObj, callback);
                        } else {
                            var err = new Error('Invalid BOT Type');
                            err.status = 400;
                            err.msg = 'Invalid BOT Type';
                            callback(err, null);
                        }
                    }
                }, function (err, data) {
                    if (err) {
                        next(err, null);
                    } else {
                        next(null, data.executor);
                    }
                });
            } else {
                logger.info("No Botdetails found ");
                next(null, botDetails);
            }
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            logger.info("Completed Bot execution " + JSON.stringify(results));
            callback(null, results);
            return;
        }
    });
}
function executorOsTypeConditionCheck(botServerDetails, botRemoteServerDetails, bots) {
    let botType = bots[0].execution[0].type.toLowerCase();
    let botOSType = bots[0].execution[0].os.toLowerCase();

    var allowedOsCombination = {
        windows: ["powershell", "python", "chef"],
        ubuntu: ["bash", "python", "chef"]
    }
    let found = false;

    for (let botServerDetail of botServerDetails) {
        if (botServerDetail.osType.toLowerCase() === botOSType) {
            if (Object.keys(allowedOsCombination).indexOf(botOSType) > -1) {
                if (allowedOsCombination[botOSType].indexOf(botType) > -1) {
                    botRemoteServerDetails.hostIP = botServerDetail.hostIP;
                    botRemoteServerDetails.hostPort = botServerDetail.hostPort;
                    found = true;
                } else {
                    logger.info(`Bot type ${botType} is not present in ${botOSType} as per config.`);
                }
            } else {
                logger.info(`OS type ${botOSType} is not present in config.`);
            }
            break;
        }
        //Check for native OS type
        if (botOSType === "native") {
            botRemoteServerDetails.hostIP = botServerDetail.hostIP;
            botRemoteServerDetails.hostPort = botServerDetail.hostPort;
            found = true;
        }
    }
    if (!found) {
        logger.info('configure appropriate bot executor with proper osType');
    }
    logger.info("BOTENGINE Details", botRemoteServerDetails);
    return botRemoteServerDetails;
}

botService.syncSingleBotsWithGitHub = function syncSingleBotsWithGitHub(botId, callback) {
    async.waterfall([
        function (next) {
            botDao.getBotsByBotId(botId, next);
        },
        function (botsDetails, next) {
            if (botsDetails.length > 0) {
                fileUpload.getReadStreamFileByFileId(botsDetails[0].ymlDocFileId, function (err, fileData) {
                    if (err) {
                        next(err, null);
                        return;
                    } else {
                        fileUpload.removeFileByFileId(botsDetails[0].ymlDocFileId, function (err, data) {
                            if (err) {
                                next(err, null);
                                return;
                            } else {
                                next(null, fileData, botsDetails);
                                return;
                            }
                        })
                    }
                });
            } else {
                next({ errCode: 400, errMsg: "BOTs is not available" }, null);
                return;
            }
        },
        function (ymlFileDetails, botsDetails, next) {
            var botFactoryDirPath = appConfig.botCurrentFactoryDir;
            fileHound.create()
                .paths(botFactoryDirPath)
                .match(ymlFileDetails.fileName + '.yaml')
                .find().then(function (files) {
                if (files.length > 0) {
                    yamlJs.load(files[0], function (result) {
                        if (result !== null) {
                            fileUpload.uploadFile(result.id, files[0], null, function (err, ymlDocFileId) {
                                if (err) {
                                    logger.error("Error in uploading yaml documents.", err);
                                    next(err, null);
                                } else {
                                    var botsObj = {
                                        ymlJson: result,
                                        name: result.name,
                                        id: result.id,
                                        desc: result.desc,
                                        category: result.botCategory ? result.botCategory : result.functionality,
                                        action: result.action,
                                        execution: result.execution ? result.execution : [],
                                        manualExecutionTime: result.standardTime ? result.standardTime : 10,
                                        type: result.type,
                                        subType: result.subtype,
                                        isParameterized: result.isParameterized ? result.isParameterized : false,
                                        input: result.input && result.input !== null ? result.input[0].form : null,
                                        output: result.output,
                                        ymlDocFileId: ymlDocFileId,
                                        source: "GitHub",
                                        isResolved: result.input ? hassysid(result.input[0].form) : false
                                    }

                                    botDao.updateBotsDetail(botsDetails[0]._id, botsObj, function (err, updateBots) {
                                        if (err) {
                                            logger.error(err);
                                            callback(err, null);
                                            return;
                                        } else {
                                            callback(null, updateBots);
                                            return;
                                        }
                                    })

                                }
                            });
                        } else {
                            next({ errCode: 400, errMsg: "Error in Uploading YML." }, null);
                            return;
                        }
                    });
                } else {
                    logger.debug("YML is not available there.")
                    botDao.removeBotsById(botsDetails[0]._id, next);
                    return;
                }
            })
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, results)
            return;
        }
    });
}


botService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId, callback) {
    async.waterfall([
        function (next) {
            async.parallel({
                gitHub: function (callback) {
                    var gitHubService = require('_pr/services/gitHubService.js');
                    gitHubService.getGitHubById(gitHubId, callback);
                },
                botsDetails: function (callback) {
                    botDao.getBotsByGitHubId(gitHubId, callback);
                }
            }, next);
        },
        function (jsonObt, next) {
            async.parallel({
                fileUpload: function (callback) {
                    if (jsonObt.botsDetails.length > 0) {
                        var count = 0;
                        for (var i = 0; i < jsonObt.botsDetails.length; i++) {
                            (function (botsDetail) {
                                fileUpload.removeFileByFileId(botsDetail.ymlDocFileId, function (err, data) {
                                    if (err) {
                                        logger.error("There are some error in deleting yml file.", err, botsDetail.ymlDocFileId);
                                    }
                                    count++;
                                    if (count === jsonObt.botsDetails.length) {
                                        callback(null, jsonObt.gitHub);
                                        return;
                                    }
                                })
                            })(jsonObt.botsDetails[i]);
                        }
                    } else {
                        callback(null, jsonObt.gitHub);
                        return;
                    }
                },
                botSync: function (callback) {
                    if (jsonObt.botsDetails.length > 0) {
                        if (jsonObt.botsDetails[0].gitHubRepoName !== jsonObt.gitHub.repositoryName || jsonObt.botsDetails[0].gitHubRepoBranch !== jsonObt.gitHub.repositoryBranch) {
                            botDao.removeBotsByGitHubId(jsonObt.gitHub._id, function (err, data) {
                                if (err) {
                                    logger.error("There are some error in deleting BOTs : ", err);
                                    callback(err, null);
                                    return;
                                } else {
                                    callback(null, jsonObt.gitHub);
                                    return;
                                }
                            })
                        } else {
                            callback(null, jsonObt.gitHub);
                            return;
                        }
                    } else {
                        callback(null, jsonObt.gitHub);
                        return;
                    }
                }
            }, next);
        },
        function (gitHubDetails, next) {
            process.setMaxListeners(100);
            if (gitHubDetails.botSync !== null) {
                var botFactoryDirPath = appConfig.botCurrentFactoryDir + "YAML";
                var botFactoryDirPathRunbook = appConfig.botCurrentFactoryDir + "Runbook";


                /*  fileHound.create()
                      .path(botFactoryDirPathRunbook)
                      .ext('yaml')
                      .find((err, files) => {
                          if (err) return console.error(err);
                          else{

                          }

                          console.log(files);
                      });*/




                //run for all Runbook Yaml
                fileHound.create()
                    .paths(botFactoryDirPathRunbook)
                    .ext('yaml')
                    .find().then(function (runbookFiles) {
                    if (runbookFiles.length > 0) {
                        var runbookObjList = [];
                        for (var i = 0; i < runbookFiles.length; i++) {
                            (function (runbookYmlFile) {
                                yamlJs.load(runbookYmlFile, function (result) {

                                    if (result !== null) {
                                        fileUpload.uploadFile(result.metadata.name, runbookYmlFile, null, function (err, ymlDocFileId) {
                                            if (err) {
                                                runbookObjList.push(err);
                                                logger.error("Error in uploading yaml documents.", err);
                                                fileUpload.removeFileByFileId(ymlDocFileId, function (err, data) {
                                                    if (err) {
                                                        logger.error("Error in removing YAML File. ", err);
                                                    }
                                                    if (runbookObjList.length === runbookFiles.length) {
                                                        next(null, runbookObjList);
                                                        return;
                                                    }
                                                });
                                            } else {
                                                var runbookObj = {
                                                    name: result.metadata.name,
                                                    runbookYmlJson: result,
                                                    ymlDocFileId: ymlDocFileId,

                                                }
                                                runbookDao.getRunbookByName(result.metadata.name, function (err, runbookList) {
                                                    if (err) {
                                                        logger.error(err);
                                                        runbookObjList.push(err);
                                                        if (runbookObjList.length === runbookFiles.length) {
                                                            next(null, runbookObjList);
                                                            return;
                                                        }
                                                    } else if (runbookList.length > 0) {
                                                        runbookDao.updateRunbookDetail(runbookList[0]._id, runbookObj, function (err, updateRunbook) {
                                                            if (err) {
                                                                logger.error(err);
                                                            }
                                                            runbookObjList.push(runbookObj);
                                                            if (runbookObjList.length === runbookFiles.length) {
                                                                next(null, runbookObjList);
                                                                return;
                                                            }
                                                        })
                                                    } else {
                                                        runbookDao.createNew(runbookObj, function (err, data) {
                                                            if (err) {
                                                                logger.error(err);
                                                            }
                                                            runbookObjList.push(runbookObj);
                                                            if (runbookObjList.length === runbookFiles.length) {
                                                                next(null, runbookObjList);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        runbookObjList.push(result);
                                        if (runbookObjList.length === runbookFiles.length) {
                                            next(null, runbookObjList);
                                            return;
                                        }
                                    }
                                });
                            })(runbookFiles[i]);

                        }
                    }

                }).catch(function (err) {
                    console.log("No Runbook Directory Found");
                });


                fileHound.create()
                    .paths(botFactoryDirPath)
                    .ext('yaml')
                    .find().then(function (files) {
                    if (files.length > 0) {
                        var botObjList = [];
                        for (var i = 0; i < files.length; i++) {
                            (function (ymlFile) {
                                yamlJs.load(ymlFile, function (result) {
                                    process.on('uncaughtException', function (err) {
                                        botObjList.push(err);
                                        if (botObjList.length === files.length) {
                                            next(null, botObjList);
                                            return;
                                        }
                                    });
                                    if (result !== null) {
                                        fileUpload.uploadFile(result.id, ymlFile, null, function (err, ymlDocFileId) {
                                            if (err) {
                                                botObjList.push(err);
                                                logger.error("Error in uploading yaml documents.", err);
                                                fileUpload.removeFileByFileId(ymlDocFileId, function (err, data) {
                                                    if (err) {
                                                        logger.error("Error in removing YAML File. ", err);
                                                    }
                                                    if (botObjList.length === files.length) {
                                                        next(null, botObjList);
                                                        return;
                                                    }
                                                });
                                            } else {
                                                var botsObj = {
                                                    ymlJson: result,
                                                    name: result.name,
                                                    gitHubId: gitHubDetails.botSync._id,
                                                    gitHubRepoName: gitHubDetails.botSync.repositoryName,
                                                    gitHubRepoBranch: gitHubDetails.botSync.repositoryBranch,
                                                    id: result.id,
                                                    desc: result.desc,
                                                    category: result.botCategory ? result.botCategory : result.functionality,
                                                    action: result.action,
                                                    execution: result.execution ? result.execution : [],
                                                    manualExecutionTime: result.manualExecutionTime ? result.manualExecutionTime : 10,
                                                    type: result.type,
                                                    subType: result.subtype,
                                                    input: result.input && result.input !== null ? result.input[0].form : null,
                                                    output: result.output,
                                                    ymlDocFileId: ymlDocFileId,
                                                    orgId: gitHubDetails.botSync.orgId,
                                                    isParameterized: result.isParameterized ? result.isParameterized : false,
                                                    orgName: gitHubDetails.botSync.orgName,
                                                    source: "GitHub",
                                                    isResolved: result.input ? hassysid(result.input[0].form) : false
                                                }
                                                botDao.getBotsByBotId(result.id, function (err, botsList) {
                                                    if (err) {
                                                        logger.error(err);
                                                        botObjList.push(err);
                                                        if (botObjList.length === files.length) {
                                                            next(null, botObjList);
                                                            return;
                                                        }
                                                    } else if (botsList.length > 0) {
                                                        botDao.updateBotsDetail(botsList[0]._id, botsObj, function (err, updateBots) {
                                                            if (err) {
                                                                logger.error(err);
                                                            }
                                                            botObjList.push(botsObj);
                                                            if (botObjList.length === files.length) {
                                                                next(null, botObjList);
                                                                return;
                                                            }
                                                        })
                                                    } else {
                                                        botDao.createNew(botsObj, function (err, data) {
                                                            if (err) {
                                                                logger.error(err);
                                                            }
                                                            botObjList.push(botsObj);
                                                            if (botObjList.length === files.length) {
                                                                next(null, botObjList);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        botObjList.push(result);
                                        if (botObjList.length === files.length) {
                                            next(null, botObjList);
                                            return;
                                        }
                                    }
                                });
                            })(files[i]);
                        }

                    } else {
                        logger.info("There is no YML files in this directory.", botFactoryDirPath);
                    }
                }).catch(function (err) {
                    next(err, null);
                });

            } else {
                next(null, gitHubDetails.botSync);
            }
        },
        function (botsDetails, next) {
            botDao.getBotsByGitHubId(gitHubId, function (err, botsList) {
                if (err) {
                    next(err, null);
                    return;
                } else if (botsList.length > 0) {
                    var count = 0;
                    for (var i = 0; i < botsList.length; i++) {
                        (function (bots) {
                            fileUpload.getFileByFileId(bots.ymlDocFileId, function (err, data) {
                                if (err) {
                                    logger.error("Error in getting YAML File.", err);
                                }
                                if (data !== null) {
                                    count++;
                                    if (count === botsList.length) {
                                        next(null, botsList);
                                        return;
                                    }
                                } else {
                                    botDao.removeBotsById(bots._id, function (err, data) {
                                        if (err) {
                                            logger.error("Error in Deleting BOTs . ", err);
                                        }
                                        count++;
                                        if (count === botsList.length) {
                                            next(null, botsList);
                                            return;
                                        }
                                    })
                                }
                            })

                        })(botsList[i]);
                    }
                } else {
                    next(null, botsDetails);
                }
            });
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, results)
            return;
        }
    });
}

botService.getBotsHistory = function getBotsHistory(botId, botsQuery, callback) {
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(botsQuery, 'botHistory', next);
        },
        function (paginationReq, next) {
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'auditTrailConfig.name', 'masterDetails.orgName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            queryObj.queryObj.auditId = botId;
            queryObj.queryObj.auditType = 'BOT';
            auditTrail.getAuditTrailList(queryObj, next)
        },
        function (auditTrailList, next) {
            apiUtil.paginationResponse(auditTrailList, reqData, next);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, results)
        return;
    });
}

botService.getParticularBotsHistory = function getParticularBotsHistory(botId, historyId, callback) {
    async.waterfall([
        function (next) {
            botDao.getBotsByBotId(botId, next);
        },
        function (bots, next) {
            if (bots.length > 0) {
                var query = {
                    auditType: 'BOT',
                    auditId: botId,
                    actionLogId: historyId
                };
                auditTrail.getAuditTrails(query, next);

            } else {
                next({ errCode: 400, errMsg: "Bots is not exist in DB" }, null)
            }
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, results);
            return;
        }
    });
}

botService.getParticularBotsHistoryLogs = function getParticularBotsHistoryLogs(botId, historyId, timestamp, callback) {
    async.waterfall([
        function (next) {
            botDao.getBotsByBotId(botId, next);
        },
        function (bots, next) {
            if (bots.length > 0) {
                var logsDao = require('_pr/model/dao/logsdao.js');
                logsDao.getLogsByReferenceId(historyId, timestamp, next);
            } else {
                next({ errCode: 400, errMsg: "Bots is not exist in DB" }, null)
            }
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, results);
            return;
        }
    });
}

botService.updateLastBotExecutionStatus = function updateLastBotExecutionStatus(botId, status, callback) {
    async.waterfall([
        function (next) {
            logger.debug("BotID:...... "+botId);
            botDao.getBotsByBotId(botId, next);
        },
        function (bots, next) {
            logger.debug("BotsLength: "+bots.length );
            if (bots.length > 0) {
                var botObj = {
                    lastExecutionStatus: status
                }
                botDao.updateBotsDetail(bots[0]._id, botObj, next);
            } else {
                next({ code: 400, message: "Bots is not exist in DB" }, null)
            }
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else {
            callback(null, results);
            return;
        }
    });
}

botService.getScheduledBotList = function getScheduledBotList(botId, callback) {
    scheduledBots.find({
        botId: botId
    }, function (err, data) {
        if (err) callback(err, null);
        else callback(null, data);
    })
}

function encryptedParam(paramDetails, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var encryptedObj = {};
    if (paramDetails.category === 'script' && paramDetails.data && paramDetails.data !== null) {
        if (paramDetails.data && (paramDetails.data.sourceGit || paramDetails.data.sourceCloud)) {
            Object.keys(paramDetails.data).forEach(function (key) {
                encryptedObj[key] = paramDetails.data[key];

            });
        } else {
            Object.keys(paramDetails.data).forEach(function (key) {
                var encryptedText = cryptography.encryptText(paramDetails.data[key], cryptoConfig.encryptionEncoding,
                    cryptoConfig.decryptionEncoding);
                encryptedObj[key] = encryptedText;
            });
        }
        paramDetails.data = encryptedObj;
        callback(null, paramDetails);
    } else {
        callback(null, paramDetails);
    }
}

function addYmlFileDetailsForBots(bots, reqData, callback) {
    if (bots.docs.length === 0) {
        return callback(null, bots);
    } else {
        var botsList = [];
        var botsObj = {};
        for (var i = 0; i < bots.docs.length; i++) {
            (function (bot) {
                if (bot.ymlDocFileId && bot.ymlDocFileId !== null) {
                    fileUpload.getReadStreamFileByFileId(bot.ymlDocFileId, function (err, file) {
                        if (err) {
                            logger.error("Error in fetching YAML Documents for : " + bot.name + " " + err);
                        }
                        botsObj = {
                            _id: bot._id,
                            name: bot.name,
                            gitHubId: bot.gitHubId,
                            id: bot.id,
                            desc: bot.desc,
                            action: bot.action,
                            category: bot.category,
                            type: bot.type,
                            subType: bot.subType,
                            inputFormFields: bot.input,
                            outputOptions: bot.output,
                            ymlDocFileId: bot.ymlDocFileId,
                            orgId: bot.orgId,
                            orgName: bot.orgName,
                            ymlFileName: file !== null ? file.fileName : file,
                            ymlFileData: file !== null ? file.fileData : file,
                            isScheduled: bot.isScheduled,
                            manualExecutionTime: bot.manualExecutionTime,
                            executionCount: bot.executionCount,
                            scheduler: bot.scheduler,
                            createdOn: bot.createdOn,
                            lastRunTime: bot.lastRunTime,
                            savedTime: bot.savedTime,
                            source: bot.source,
                            execution: bot.execution,
                            lastExecutionStatus: bot.lastExecutionStatus
                        }
                        if (bot.type === 'jenkins') {
                            botsObj.isParameterized = bot.isParameterized;
                        }
                        botsList.push(botsObj);
                        if (botsList.length === bots.docs.length) {
                            var alaSql = require('alasql');
                            var sortField = reqData.mirrorSort;
                            var sortedField = Object.keys(sortField)[0];
                            var sortedOrder = reqData.mirrorSort ? (sortField[Object.keys(sortField)[0]] == 1 ? 'asc' : 'desc') : '';
                            if (sortedOrder === 'asc') {
                                bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' ASC', [botsList]);
                            } else {
                                bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' DESC', [botsList]);
                            }
                            return callback(null, bots);
                        }
                    })
                } else {
                    botDao.getBotsById(bot.auditId, function (err, botDetails) {
                        if (err) {
                            logger.error("Error in fetching BOT Details for _id: " + bot.auditId + " " + err);
                        } else {
                            fileUpload.getReadStreamFileByFileId(botDetails[0].ymlDocFileId, function (err, file) {
                                if (err) {
                                    logger.error("Error in fetching YAML Documents for : " + bot.name + " " + err);
                                } else {
                                    botsObj = {
                                        _id: botDetails[0]._id,
                                        name: botDetails[0].name,
                                        gitHubId: botDetails[0].gitHubId,
                                        id: botDetails[0].id,
                                        desc: botDetails[0].desc,
                                        action: botDetails[0].action,
                                        category: botDetails[0].category,
                                        type: botDetails[0].type,
                                        subType: botDetails[0].subType,
                                        inputFormFields: botDetails[0].input,
                                        outputOptions: botDetails[0].output,
                                        ymlDocFileId: botDetails[0].ymlDocFileId,
                                        orgId: botDetails[0].orgId,
                                        orgName: botDetails[0].orgName,
                                        ymlFileName: file !== null ? file.fileName : file,
                                        ymlFileData: file !== null ? file.fileData : file,
                                        isScheduled: botDetails[0].isScheduled,
                                        manualExecutionTime: botDetails[0].manualExecutionTime,
                                        executionCount: botDetails[0].executionCount,
                                        scheduler: botDetails[0].scheduler,
                                        createdOn: botDetails[0].createdOn,
                                        lastRunTime: botDetails[0].lastRunTime,
                                        savedTime: botDetails[0].savedTime,
                                        source: botDetails[0].source,
                                        execution: botDetails[0].execution,
                                        lastExecutionStatus: botDetails[0].lastExecutionStatus,
                                        srnTicketNo: bot.auditTrailConfig.serviceNowTicketRefObj.number,
                                        srnTicketLink: bot.auditTrailConfig.serviceNowTicketRefObj.ticketLink,
                                        srnTicketShortDesc: bot.auditTrailConfig.serviceNowTicketRefObj.shortDesc,
                                        srnTicketDesc: bot.auditTrailConfig.serviceNowTicketRefObj.desc,
                                        srnTicketStatus: bot.auditTrailConfig.serviceNowTicketRefObj.state,
                                        srnTicketPriority: bot.auditTrailConfig.serviceNowTicketRefObj.priority,
                                        srnTicketResolvedBy: bot.auditTrailConfig.serviceNowTicketRefObj.resolvedBy,
                                        srnTicketResolvedAt: bot.auditTrailConfig.serviceNowTicketRefObj.resolvedAt,
                                        srnTicketCreatedOn: bot.auditTrailConfig.serviceNowTicketRefObj.createdOn,
                                        srnTicketClosedAt: bot.auditTrailConfig.serviceNowTicketRefObj.closedAt,
                                        srnTicketOpenedAt: bot.auditTrailConfig.serviceNowTicketRefObj.openedAt,
                                        srnTicketUpdatedOn: bot.auditTrailConfig.serviceNowTicketRefObj.updatedOn,
                                        srnTicketCategory: bot.auditTrailConfig.serviceNowTicketRefObj.category,
                                        actionLogId: bot.actionLogId
                                    }
                                    if (bot.type === 'jenkins') {
                                        botsObj.isParameterized = bot.isParameterized;
                                    }
                                    botsList.push(botsObj);
                                    if (botsList.length === bots.docs.length) {
                                        var alaSql = require('alasql');
                                        var sortField = reqData.mirrorSort;
                                        var sortedField = Object.keys(sortField)[0];
                                        var sortedOrder = reqData.mirrorSort ? (sortField[Object.keys(sortField)[0]] == 1 ? 'asc' : 'desc') : '';
                                        if (sortedOrder === 'asc') {
                                            bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' ASC', [botsList]);
                                        } else {
                                            bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' DESC', [botsList]);
                                        }
                                        return callback(null, bots);
                                    }
                                }
                            });
                        }
                    });
                }
            })(bots.docs[i]);
        }
    }
}

function removeScriptFile(filePath) {
    fileIo.removeFile(filePath, function (err, result) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.debug("Successfully Remove file");
            return
        }
    })
}


botService.getBotBysource = function (source, callback) {
    var query = {};
    var fields = { repositoryName: 1, _id: 1 };
    if (source) {
        var sourceName = source.split(',');
        query = { repositoryName: { $in: sourceName } };
        fields = { repositoryBranch: 1, repositoryUserName: 1, repositoryPassword: 1, repositoryName: 1, _id: 1, repositoryOwner: 1 };
    }
    gitHubModel.getGitRepository(query, fields, (err, res) => {
        if (!err) {
            return callback(null, res);
        }
        else {
            return callback(err, null)
        }
    });
}

botService.cloudProviders = function (source, callback) {
    let cloudDetails = [];
    var query = {};
    if (source) {
        var sourceName = source.split(',');
        query = { providerName: { $in: sourceName } };
    }
    AWSProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });

    openstackProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });

    hppubliccloudProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });
    azurecloudProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });
    vmwareProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });
    digitalOceanProvider.getName(query, function (err, result) {
        if (err) {
            return callback(err, null)
        }
        if (result && result.length > 0) {
            result.map(itm => {
                cloudDetails.push(itm);
            });
        }
    });

    setTimeout(function () {
        return callback(null, cloudDetails);
    }, 2000)
}

/**
 *
 * return true if bot is snowbot
 */
function hassysid(input) {
    if (!input) {
        return false;
    } else {
        var obj = input.find(o => o.name === 'sysid');
        return obj ? true : false;
    }
}

botService.getAllBotsList = function getAllBotsList(botsQuery, userName, callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'bots', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['name', 'type', 'category', 'desc', 'orgName'];
            paginationReq['select'] = ['name', 'type', 'input', 'category', 'desc', 'orgName', 'lastRunTime', 'executionCount','savedTime','id','_id']
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            settingService.getOrgUserFilter(userName,function(err,orgIds) {
                if(err){
                    next(err,null);
                }else if(orgIds.length > 0) {
                    queryObj.queryObj['orgId'] = {$in:orgIds};
                    botDao.getBotsList(queryObj, next);
                }else{
                    botDao.getBotsList(queryObj, next);
                }
            });
        },
        function (filterBotList, next) {
            apiUtil.paginationGetAllBotsResponse(filterBotList, reqData, callback);
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        var resultObj = {
            bots : results.botList.bots,
            metaData : results.botList.metaData,
        }
        callback(null,resultObj);
        return;
    });
}
