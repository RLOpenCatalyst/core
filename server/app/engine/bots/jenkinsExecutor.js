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
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Jenkins = require('_pr/lib/jenkins');
var auditTrailService = require('_pr/services/auditTrailService.js');
var noticeService = require('_pr/services/noticeService.js');


const errorType = 'jenkinsExecutor';

var jenkinsExecutor = module.exports = {};

jenkinsExecutor.execute = function execute(jenkinsBotDetails,auditTrail,reqBody,userName,callback) {
    configmgmtDao.getJenkinsDataFromId(reqBody.data.jenkinsServerId, function(err, jenkinsData) {
        if (err) {
            logger.error('jenkins list fetch error', err);
            var resultTaskExecution = {
                "actionStatus": 'failed',
                "status": 'failed',
                "endedOn": new Date().getTime(),
                "actionLogId": auditTrail.actionId
            };
            auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                if (err) {
                    logger.error("Failed to create or update bots Log: ", err);
                }
            });
            noticeService.notice(userName, {
                title: "Jenkins BOT Execution",
                body:  "Jenkins list fetch error"
            }, "error", function (err, data) {
                if (err) {
                    logger.error("Error in Notification Service, ", err);
                }
            });
            callback(err, null);
            return;
        } else if (!(jenkinsData && jenkinsData.length)) {
            var err = new Error();
            err.status = 400;
            err.message = 'Jenkins Data Not Found';
            logger.error('Jenkins Data Not Found');
            var resultTaskExecution = {
                "actionStatus": 'failed',
                "status": 'failed',
                "endedOn": new Date().getTime(),
                "actionLogId": auditTrail.actionId
            };
            auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                if (err) {
                    logger.error("Failed to create or update bots Log: ", err);
                }
            });
            noticeService.notice(userName, {
                title: "Jenkins BOT Execution",
                body:  'Jenkins Data Not Found'
            }, "error", function (err, data) {
                if (err) {
                    logger.error("Error in Notification Service, ", err);
                }
            });
            callback(err, null);
            return;
        } else {
            jenkinsData = jenkinsData[0];
            var jenkins = new Jenkins({
                url: jenkinsData.jenkinsurl,
                username: jenkinsData.jenkinsusername,
                password: jenkinsData.jenkinspassword
            });
            jenkins.getJobInfo(reqBody.data.jobName, function (err, jobInfo) {
                if (err) {
                    logger.error(err);
                    var err = new Error();
                    err.status = 400;
                    err.message = "Unable to fetch jenkins job info of job :- " + reqBody.data.jobName;
                    logger.error("Unable to fetch jenkins job info of job :- " + reqBody.data.jobName);
                    var resultTaskExecution = {
                        "actionStatus": 'failed',
                        "status": 'failed',
                        "endedOn": new Date().getTime(),
                        "actionLogId": auditTrail.actionId,
                        "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                        "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                        "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                    };
                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                        if (err) {
                            logger.error("Failed to create or update bots Log: ", err);
                        }
                    });
                    noticeService.notice(userName, {
                        title: "Jenkins BOT Execution",
                        body:  "Unable to fetch jenkins job info of job :- " + reqBody.data.jobName
                    }, "error", function (err, data) {
                        if (err) {
                            logger.error("Error in Notification Service, ", err);
                        }
                    });
                    callback(err, null);
                    return;
                }
                if (!jobInfo.inQueue) {
                    if (jenkinsBotDetails.isParameterized && jenkinsBotDetails.isParameterized === true) {
                        var params = reqBody.data.parameterized;
                        var param = {};
                        if (params.length > 0) {
                            if (reqBody.data.choiceParam) {
                                param = reqBody.data.choiceParam;
                            } else {
                                for (var i = 0; i < params.length; i++) {
                                    param[params[i].name] = params[i].defaultValue;
                                }
                            }
                        } else {
                            var err = new Error();
                            err.status = 400;
                            err.message = "No Parameter available for job:- " + reqBody.data.jobName;
                            logger.error("No Parameter available for job:- " + reqBody.data.jobName);
                            var resultTaskExecution = {
                                "actionStatus": 'failed',
                                "status": 'failed',
                                "endedOn": new Date().getTime(),
                                "actionLogId": auditTrail.actionId,
                                "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                            };
                            auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                if (err) {
                                    logger.error("Failed to create or update bots Log: ", err);
                                }
                            });
                            noticeService.notice(userName, {
                                title: "Jenkins BOT Execution",
                                body:  "No Parameter available for job:- " + reqBody.data.jobName
                            }, "error", function (err, data) {
                                if (err) {
                                    logger.error("Error in Notification Service, ", err);
                                }
                            });
                            callback(err, null);
                            return;
                        }
                        logger.debug("param object: ", JSON.stringify(param));
                        jenkins.buildJobWithParams(reqBody.data.jobName, param, function (err, buildRes) {
                            if (err) {
                                logger.error(err);
                                var err = new Error();
                                err.status = 400;
                                err.message = "Unable to Build job :- " + reqBody.data.jobName;
                                logger.error("Unable to Build job :- " + reqBody.data.jobName);
                                var resultTaskExecution = {
                                    "actionStatus": 'failed',
                                    "status": 'failed',
                                    "endedOn": new Date().getTime(),
                                    "actionLogId": auditTrail.actionId,
                                    "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                    "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                    "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                };
                                auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                    if (err) {
                                        logger.error("Failed to create or update bots Log: ", err);
                                    }
                                });
                                noticeService.notice(userName, {
                                    title: "Jenkins BOT Execution",
                                    body:  "Unable to Build job :- " + reqBody.data.jobName
                                }, "error", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                callback(err, null);
                                return;
                            }
                            logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                            callback(null, {
                                buildNumber: jobInfo.nextBuildNumber,
                                jenkinsServerId: reqBody.data.jenkinsServerId,
                                jobName: reqBody.data.jobName,
                                lastBuildNumber: jobInfo.lastBuild.number,
                                nextBuildNumber: jobInfo.nextBuildNumber
                            });
                            function pollBuildStarted() {
                                jenkins.getJobInfo(reqBody.data.jobName, function (err, latestJobInfo) {
                                    if (err) {
                                        logger.error(err);
                                        var resultTaskExecution = {
                                            "actionStatus": 'failed',
                                            "status": 'failed',
                                            "endedOn": new Date().getTime(),
                                            "actionLogId": auditTrail.actionId,
                                            "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                            "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                            "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                        };
                                        auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                            if (err) {
                                                logger.error("Failed to create or update bots Log: ", err);
                                            }
                                        });
                                        noticeService.notice(userName, {
                                            title: "Jenkins BOT Execution",
                                            body:  "Unable to get Job Info :- " + reqBody.data.jobName
                                        }, "error", function (err, data) {
                                            if (err) {
                                                logger.error("Error in Notification Service, ", err);
                                            }
                                        });
                                        callback(err,null);
                                        return;
                                    }
                                    if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                        function pollBuildStatus() {
                                            jenkins.getBuildInfo(reqBody.data.jobName, jobInfo.nextBuildNumber, function (err, buildInfo) {
                                                if (err) {
                                                    logger.error("Error in Jenkins Executor",err);
                                                    var resultTaskExecution = {
                                                        "actionStatus": 'failed',
                                                        "status": 'failed',
                                                        "endedOn": new Date().getTime(),
                                                        "actionLogId": auditTrail.actionId,
                                                        "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                                        "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                                        "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                                    };
                                                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                                        if (err) {
                                                            logger.error("Failed to create or update bots Log: ", err);
                                                        }
                                                    });
                                                    noticeService.notice(userName, {
                                                        title: "Jenkins BOT Execution",
                                                        body:  "Unable to get Job Build Info :- " + reqBody.data.jobName
                                                    }, "error", function (err, data) {
                                                        if (err) {
                                                            logger.error("Error in Notification Service, ", err);
                                                        }
                                                    });
                                                    callback(err,null);
                                                    return;
                                                }
                                                if (buildInfo.building) {
                                                    pollBuildStatus();
                                                } else {
                                                    var status = 1;
                                                    if (buildInfo.result === 'SUCCESS') {
                                                        status = 0;
                                                        logger.debug(jenkinsBotDetails.id+" BOTs Execution is Done")
                                                        var resultTaskExecution = {
                                                            "actionStatus": 'success',
                                                            "status": 'success',
                                                            "endedOn": new Date().getTime(),
                                                            "actionLogId": auditTrail.actionId,
                                                            "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                                            "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                                            "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                                        };

                                                        auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                                            if (err) {
                                                                logger.error("Failed to create or update bots Log: ", err);
                                                            }
                                                        });
                                                        noticeService.notice(userName, {
                                                            title: "BOTs Execution",
                                                            body: reqBody.data.jobName+" job is successfully build on "+jenkinsData.jenkinsname
                                                        }, "success", function (err, data) {
                                                            if (err) {
                                                                logger.error("Error in Notification Service, ", err);
                                                            }
                                                        });
                                                    }
                                                    callback(null, status);
                                                    return;
                                                }
                                            });
                                        }
                                        pollBuildStatus();
                                    } else {
                                        pollBuildStarted();
                                    }
                                });
                            }
                            pollBuildStarted();
                        });
                    } else {
                        jenkins.buildJob(reqBody.data.jobName, function (err, buildRes) {
                            if (err) {
                                logger.error(err);
                                var err = new Error();
                                err.status = 400;
                                err.message = "Unable to Build job :- " + reqBody.data.jobName;
                                logger.error("Unable to Build job :- " + reqBody.data.jobName);
                                var resultTaskExecution = {
                                    "actionStatus": 'failed',
                                    "status": 'failed',
                                    "endedOn": new Date().getTime(),
                                    "actionLogId": auditTrail.actionId,
                                    "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                    "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                    "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                };
                                auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                    if (err) {
                                        logger.error("Failed to create or update bots Log: ", err);
                                    }
                                });
                                noticeService.notice(userName, {
                                    title: "Jenkins BOT Execution",
                                    body: "Unable to Build job :- " + reqBody.data.jobName
                                }, "error", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                callback(err, null);
                                return;
                            }
                            logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                            callback(null, {
                                buildNumber: jobInfo.nextBuildNumber,
                                jenkinsServerId: reqBody.data.jenkinsServerId,
                                jobName: reqBody.data.jobName,
                                lastBuildNumber: jobInfo.lastBuild.number,
                                nextBuildNumber: jobInfo.nextBuildNumber
                            });
                            function pollBuildStarted() {
                                jenkins.getJobInfo(reqBody.data.jobName, function (err, latestJobInfo) {
                                    if (err) {
                                        logger.error(err);
                                        var resultTaskExecution = {
                                            "actionStatus": 'failed',
                                            "status": 'failed',
                                            "endedOn": new Date().getTime(),
                                            "actionLogId": auditTrail.actionId,
                                            "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                            "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                            "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                        };
                                        auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                            if (err) {
                                                logger.error("Failed to create or update bots Log: ", err);
                                            }
                                        });
                                        noticeService.notice(userName, {
                                            title: "Jenkins BOT Execution",
                                            body: "Unable to get job Info :- " + reqBody.data.jobName
                                        }, "error", function (err, data) {
                                            if (err) {
                                                logger.error("Error in Notification Service, ", err);
                                            }
                                        });
                                        callback(err,null);
                                        return;
                                    }
                                    if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                        function pollBuildStatus() {
                                            jenkins.getBuildInfo(reqBody.data.jobName, jobInfo.nextBuildNumber, function (err, buildInfo) {
                                                if (err) {
                                                    logger.error("Error in Jenkins Executor",err);
                                                    var resultTaskExecution = {
                                                        "actionStatus": 'failed',
                                                        "status": 'failed',
                                                        "endedOn": new Date().getTime(),
                                                        "actionLogId": auditTrail.actionId,
                                                        "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                                        "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                                        "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                                    };
                                                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                                        if (err) {
                                                            logger.error("Failed to create or update bots Log: ", err);
                                                        }
                                                    });
                                                    noticeService.notice(userName, {
                                                        title: "Jenkins BOT Execution",
                                                        body: "Unable to get Job Build Info :- " + reqBody.data.jobName
                                                    }, "error", function (err, data) {
                                                        if (err) {
                                                            logger.error("Error in Notification Service, ", err);
                                                        }
                                                    });
                                                    callback(err,null);
                                                    return;
                                                }
                                                if (buildInfo.building) {
                                                    pollBuildStatus();
                                                } else {
                                                    var status = 1;
                                                    if (buildInfo.result === 'SUCCESS') {
                                                        status = 0;
                                                        logger.debug(jenkinsBotDetails.id+" BOTs Execution is Done")
                                                        var resultTaskExecution = {
                                                            "actionStatus": 'success',
                                                            "status": 'success',
                                                            "endedOn": new Date().getTime(),
                                                            "actionLogId": auditTrail.actionId,
                                                            "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                                                            "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                                                            "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                                                        };
                                                        auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                                            if (err) {
                                                                logger.error("Failed to create or update bots Log: ", err);
                                                            }
                                                        });
                                                        noticeService.notice(userName, {
                                                            title: "Jenkins BOT Execution",
                                                            body: reqBody.data.jobName+" job is successfully build on "+jenkinsData.jenkinsname
                                                        }, "success", function (err, data) {
                                                            if (err) {
                                                                logger.error("Error in Notification Service, ", err);
                                                            }
                                                        });
                                                    }
                                                    callback(null, status);
                                                    return;
                                                }
                                            });
                                        }
                                        pollBuildStatus();
                                    } else {
                                        pollBuildStarted();
                                    }
                                });
                            }
                            pollBuildStarted();
                        });
                    }
                } else {
                    logger.error("A build is already in queue");
                    var resultTaskExecution = {
                        "actionStatus": 'failed',
                        "status": 'failed',
                        "endedOn": new Date().getTime(),
                        "actionLogId": auditTrail.actionId,
                        "auditTrailConfig.jenkinsBuildNumber":jobInfo.nextBuildNumber,
                        "auditTrailConfig.jenkinsJobName":reqBody.data.jobName,
                        "auditTrailConfig.jobResultURL":reqBody.data.jobResultURL
                    };
                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                        if (err) {
                            logger.error("Failed to create or update bots Log: ", err);
                        }
                    });
                    var err = new Error();
                    err.status = 200;
                    err.message = 'A build is already in queue';
                    noticeService.notice(userName, {
                        title: "Jenkins BOT Execution",
                        body: "A build is already in queue"
                    }, "error", function (err, data) {
                        if (err) {
                            logger.error("Error in Notification Service, ", err);
                        }
                    });
                    callback(err, null);
                    return;
                }
            });
        }
    });
};
