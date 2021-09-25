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
var mongoose = require('mongoose');
// var extend = require('mongoose-schema-extend');
var extendSchema = require('mongoose-extend-schema');
var ObjectId = require('mongoose').Types.ObjectId;
var Jenkins = require('_pr/lib/jenkins');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var taskTypeSchema = require('./taskTypeSchema');
var Blueprints = require('_pr/model/blueprint');


var jenkinsTaskSchema = extendSchema(taskTypeSchema, {
    _id:false,
    jenkinsServerId: String,
    jobName: String,
    autoSyncFlag: String,
    jobResultURL: [String],
    jobURL: String,
    isParameterized: Boolean,
    parameterized: [{
        _id:false,
        parameterName: String,
        name: {
            type: String,
            unique: true
        },
        defaultValue: [String],
        description: String
    }]
});

// Instance Method :- run task
jenkinsTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    logger.debug("Choice Param in::: ", choiceParam);
    var self = this;
    // For now removed blueprint launch via jenkins, later will use this
    /*if (blueprintIds.length) {
        var count = 0;
        var onCompleteResult = [];
        var overallStatus = 0;
        var launchedBluprintIds = [];
        var failedBluprintIds = [];

        function blueprintOnCompleteHandler(err, status, blueprintId, output) {
            count++;
            var result = {
                blueprintId: blueprintId,
                result: output,
                status: 'success'
            };
            if (status) {
                result.status = 'failed';
                overallStatus = 1;
                failedBluprintIds.push(blueprintId);
            } else {
                launchedBluprintIds.push(blueprintId);
            }
            onCompleteResult.push(result);

            if (count === blueprintIds.length) {
                if (typeof onExecute === 'function') {
                    var msg;
                    if (!launchedBluprintIds.length) {
                        msg = "Unable to launch blueprints";
                    } else if (launchedBluprintIds.length === blueprintIds.length) {
                        msg = "Blueprints launched: " + blueprintIds + ", to see logs go to Instances.";
                    } else {
                        msg = "Go to instances to see log.";
                    }
                    onExecute(null, {
                        blueprintMessage: msg,
                        onCompleteResult: onCompleteResult
                    });
                }

                if (typeof onComplete === 'function') {
                    process.nextTick(function() {
                        logger.debug("onComplete fired for blueprint: ", overallStatus + "  " + onCompleteResult);
                        onComplete(null, overallStatus, {
                            blueprintResults: onCompleteResult
                        });
                    });
                }
            }
        }
        Blueprints.getByIds(blueprintIds, function(err, blueprints) {
            if (err) {
                logger.error("Failed to get blueprints", err);
                onExecute({
                    message: "Failed to get blueprints"
                });
                return;
            }
            if (!blueprints.length) {
                onExecute({
                    message: "Blueprints not found"
                });
                return;
            }
            for (var i = 0; i < blueprints.length; i++) {
                (function(blueprint) {
                    //blueprint.extraRunlist = self.runlist;
                    logger.debug("envId=== ", envId);
                    blueprint.launch({
                        envId: envId,
                        ver: null,
                        stackName: null,
                        sessionUser: userName
                    }, function(err, launchData) {
                        var status = 0;
                        if (err) {
                            logger.error('blueprint launch error. blueprint id ==>', blueprint.id, err);
                            status = 1;
                        }
                        blueprintOnCompleteHandler(err, status, blueprint.id, launchData);
                    });
                })(blueprints[i]);
            }

        });

        return;

    } else {*/

        configmgmtDao.getJenkinsDataFromId(this.jenkinsServerId, function(err, jenkinsData) {
            if (err) {
                logger.error('jenkins list fetch error', err);
                if (typeof onExecute === 'function') {
                    onExecute(err);
                }
                return;
            } else {
                if (!(jenkinsData && jenkinsData.length)) {
                    if (typeof onExecute === 'function') {
                        onExecute({
                            message: "Jenkins Data Not Found"
                        });
                    }
                    return;
                }
                jenkinsData = jenkinsData[0];
                var jenkins = new Jenkins({
                    url: jenkinsData.jenkinsurl,
                    username: jenkinsData.jenkinsusername,
                    password: jenkinsData.jenkinspassword
                });
                jenkins.getJobInfo(self.jobName, function(err, jobInfo) {
                    if (err) {
                        logger.error(err);
                        if (typeof onExecute === 'function') {
                            onExecute({
                                message: "Unable to fetch jenkins job info of job :- " + self.jobName
                            });
                        }
                        return;
                    }
                    // running the job
                    if (!jobInfo.inQueue) {
                        if (typeof self.isParameterized != 'undefined' && self.isParameterized) {
                            logger.debug("parameterized executing.....");
                            var params = self.parameterized;
                            var param = {};
                            if (params.length > 0) {
                                if (choiceParam) {
                                    param = choiceParam;
                                } else {
                                    for (var i = 0; i < params.length; i++) {
                                        param[params[i].name] = params[i].defaultValue;
                                    }
                                }
                            } else {
                                onExecute({
                                    message: "No Parameter available for job:- " + self.jobName
                                });
                            }
                            logger.debug("param object: ", JSON.stringify(param));
                            jenkins.buildJobWithParams(self.jobName, param, function(err, buildRes) {
                                if (err) {
                                    logger.error(err);
                                    if (typeof onExecute === 'function') {
                                        onExecute({
                                            message: "Unable to Build job :- " + self.jobName
                                        });
                                    }
                                    return;
                                }
                                logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                                if (typeof onExecute === 'function') {
                                    onExecute(null, {
                                        buildNumber: jobInfo.nextBuildNumber,
                                        jenkinsServerId: self.jenkinsServerId,
                                        jobName: self.jobName,
                                        lastBuildNumber: jobInfo.lastBuild.number,
                                        nextBuildNumber: jobInfo.nextBuildNumber
                                    });
                                }

                                // polling for job status
                                function pollBuildStarted() {
                                    jenkins.getJobInfo(self.jobName, function(err, latestJobInfo) {
                                        if (err) {
                                            logger.error(err);
                                            if (typeof onComplete === 'function') {
                                                onComplete(err, 1);
                                            }
                                            return;
                                        }
                                        if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                            function pollBuildStatus() {
                                                jenkins.getBuildInfo(self.jobName, jobInfo.nextBuildNumber, function(err, buildInfo) {
                                                    if (err) {
                                                        logger.error(err);
                                                        if (typeof onComplete === 'function') {
                                                            onComplete(err, 1);
                                                        }
                                                        return;
                                                    }
                                                    if (buildInfo.building) {
                                                        pollBuildStatus();
                                                    } else {
                                                        var status = 1;
                                                        if (buildInfo.result === 'SUCCESS') {
                                                            status = 0;
                                                        }
                                                        if (typeof onComplete === 'function') {
                                                            onComplete(null, status);
                                                        }
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
                            jenkins.buildJob(self.jobName, function(err, buildRes) {
                                if (err) {
                                    logger.error(err);
                                    if (typeof onExecute === 'function') {
                                        onExecute({
                                            message: "Unable to Build job :- " + self.jobName
                                        });
                                    }
                                    return;
                                }
                                logger.debug("buildRes ==> ", JSON.stringify(buildRes));
                                if (typeof onExecute === 'function') {
                                    onExecute(null, {
                                        buildNumber: jobInfo.nextBuildNumber,
                                        jenkinsServerId: self.jenkinsServerId,
                                        jobName: self.jobName,
                                        lastBuildNumber: jobInfo.lastBuild.number,
                                        nextBuildNumber: jobInfo.nextBuildNumber
                                    });
                                }

                                // polling for job status
                                function pollBuildStarted() {
                                    jenkins.getJobInfo(self.jobName, function(err, latestJobInfo) {
                                        if (err) {
                                            logger.error(err);
                                            if (typeof onComplete === 'function') {
                                                onComplete(err, 1);
                                            }
                                            return;
                                        }
                                        if (jobInfo.nextBuildNumber <= latestJobInfo.lastBuild.number) {
                                            function pollBuildStatus() {
                                                jenkins.getBuildInfo(self.jobName, jobInfo.nextBuildNumber, function(err, buildInfo) {
                                                    if (err) {
                                                        logger.error(err);
                                                        if (typeof onComplete === 'function') {
                                                            onComplete(err, 1);
                                                        }
                                                        return;
                                                    }
                                                    if (buildInfo.building) {
                                                        pollBuildStatus();
                                                    } else {
                                                        var status = 1;
                                                        if (buildInfo.result === 'SUCCESS') {
                                                            status = 0;
                                                        }
                                                        if (typeof onComplete === 'function') {
                                                            onComplete(null, status);
                                                        }
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
                        if (typeof onExecute === 'function') {
                            onExecute({
                                message: 'A build is already in queue'
                            });
                        }

                    }
                });
            }
        });
    //}

};

var JenkinsTask = mongoose.model('jenkinsTask', jenkinsTaskSchema);

module.exports = JenkinsTask;
