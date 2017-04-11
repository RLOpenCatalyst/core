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

const errorType = 'jenkinsExecutor';

var jenkinsExecutor = module.exports = {};

jenkinsExecutor.execute = function execute(jenkinsBotDetails,auditTrail,reqBody,userName,callback) {
    configmgmtDao.getJenkinsDataFromId(jenkinsBotDetails.jenkinsServerId, function(err, jenkinsData) {
        if (err) {
            logger.error('jenkins list fetch error', err);
            callback(err, null);
            return;
        } else if (!(jenkinsData && jenkinsData.length)) {
            var err = new Error();
            err.status = 400;
            err.message = 'Jenkins Data Not Found';
            callback(err, null);
            return;
        } else {
            jenkinsData = jenkinsData[0];
            var jenkins = new Jenkins({
                url: jenkinsData.jenkinsurl,
                username: jenkinsData.jenkinsusername,
                password: jenkinsData.jenkinspassword
            });
            jenkins.getJobInfo(jenkinsBotDetails.jobName, function (err, jobInfo) {
                if (err) {
                    logger.error(err);
                    var err = new Error();
                    err.status = 400;
                    err.message = "Unable to fetch jenkins job info of job :- " + jenkinsBotDetails.jobName;
                    callback(err, null);
                    return;
                }
                if (!jobInfo.inQueue) {
                    if (typeof jenkinsBotDetails.isParameterized !== 'undefined' && jenkinsBotDetails.isParameterized) {
                        logger.debug("parameterized executing.....");
                        var params = jenkinsBotDetails.parameterized;
                        var param = {};
                        if (params.length > 0) {
                            if (jenkinsBotDetails.choiceParam) {
                                param = jenkinsBotDetails.choiceParam;
                            } else {
                                for (var i = 0; i < params.length; i++) {
                                    param[params[i].name] = params[i].defaultValue;
                                }
                            }
                        } else {
                            var err = new Error();
                            err.status = 400;
                            err.message = "No Parameter available for job:- " + jenkinsBotDetails.jobName;
                            callback(err, null);
                            return;
                        }
                        logger.debug("param object: ", JSON.stringify(param));
                        jenkins.buildJobWithParams(jenkinsBotDetails.jobName, param, function (err, buildRes) {
                            if (err) {
                                logger.error(err);
                                var err = new Error();
                                err.status = 400;
                                err.message = "Unable to Build job :- " + jenkinsBotDetails.jobName;
                                callback(err, null);
                                return;
                            }
                            logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                            callback(null, {
                                buildNumber: jobInfo.nextBuildNumber,
                                jenkinsServerId: jenkinsBotDetails.jenkinsServerId,
                                jobName: jenkinsBotDetails.jobName,
                                lastBuildNumber: jobInfo.lastBuild.number,
                                nextBuildNumber: jobInfo.nextBuildNumber
                            });
                            function pollBuildStarted() {
                                jenkins.getJobInfo(jenkinsBotDetails.jobName, function (err, latestJobInfo) {
                                    if (err) {
                                        logger.error(err);
                                        callback(err,null);
                                        return;
                                    }
                                    if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                        function pollBuildStatus() {
                                            jenkins.getBuildInfo(jenkinsBotDetails.jobName, jobInfo.nextBuildNumber, function (err, buildInfo) {
                                                if (err) {
                                                    logger.error(err);
                                                    callback(err,null);
                                                    return;
                                                }
                                                if (buildInfo.building) {
                                                    pollBuildStatus();
                                                } else {
                                                    var status = 1;
                                                    if (buildInfo.result === 'SUCCESS') {
                                                        status = 0;
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
                        jenkins.buildJob(self.jobName, function (err, buildRes) {
                            if (err) {
                                logger.error(err);
                                var err = new Error();
                                err.status = 400;
                                err.message = "Unable to Build job :- " + jenkinsBotDetails.jobName;
                                callback(err, null);
                                return;
                            }
                            logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                            callback(null, {
                                buildNumber: jobInfo.nextBuildNumber,
                                jenkinsServerId: jenkinsBotDetails.jenkinsServerId,
                                jobName: jenkinsBotDetails.jobName,
                                lastBuildNumber: jobInfo.lastBuild.number,
                                nextBuildNumber: jobInfo.nextBuildNumber
                            });
                            function pollBuildStarted() {
                                jenkins.getJobInfo(jenkinsBotDetails.jobName, function (err, latestJobInfo) {
                                    if (err) {
                                        logger.error(err);
                                        callback(err,null);
                                        return;
                                    }
                                    if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                        function pollBuildStatus() {
                                            jenkins.getBuildInfo(self.jobName, jobInfo.nextBuildNumber, function (err, buildInfo) {
                                                if (err) {
                                                    logger.error(err);
                                                    callback(err,null);
                                                    return;
                                                }
                                                if (buildInfo.building) {
                                                    pollBuildStatus();
                                                } else {
                                                    var status = 1;
                                                    if (buildInfo.result === 'SUCCESS') {
                                                        status = 0;
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
                    var err = new Error();
                    err.status = 200;
                    err.message = 'A build is already in queue';
                    callback(err, null);
                    return;
                }
            });
        }
    });
};
