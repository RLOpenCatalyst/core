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


// This file act as a Controller which contains Jenkins related all end points.

var Jenkins = require('_pr/lib/jenkins');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var errorResponses = require('./error_responses');
var logger = require('_pr/logger')(module);
var url = require('url');
var fs = require('fs');
var currentDirectory = __dirname;

module.exports.setRoutes = function(app, verificationFunc) {
    app.all('/jenkins/*', verificationFunc);

    app.get('/jenkins/', function(req, res) {
        configmgmtDao.getListNew('20', 'jenkinsname', function(err, jenkinsList) {
            if (err) {
                logger.error('jenkins list fetch error', err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            logger.debug(jenkinsList);
            res.send(jenkinsList);
        });
    });

    app.all('/jenkins/:jenkinsId/*', function(req, res, next) {
        var jenkinsId = req.params.jenkinsId;
        configmgmtDao.getJenkinsDataFromId(jenkinsId, function(err, jenkinsData) {
            if (err) {
                logger.error('jenkins list fetch error', err);
                res.status(500).send(errorResponses.db.error);
                return;
            } else {
                if (!(jenkinsData && jenkinsData.length)) {
                    res.send(404, errorResponses.jenkins.notFound);
                    return;
                }
                req.CATALYST = {
                    jenkins: jenkinsData[0]
                };
                next();
            }
        });
    });

    app.get('/jenkins/:jenkinsId/jobs', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;
        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getJobs(function(err, jobsList) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(jobsList);
        });
    });

    app.get('/jenkins/:jenkinsId/jobs/:jobName', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;

        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getJobInfo(req.params.jobName, function(err, job) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(job);
        });
    });

    //API to get the count of dashboard build number per day.
    app.get('/jenkins/:jenkinsId/dashboardjobs/:jobName', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;

        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        /*jenkins.buildJob(req.params.jobName, function(err, job) {
            console.log("Job=======>"+job);
        });*/
        jenkins.getJobInfo(req.params.jobName, function(err, job) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.send(500, errorResponses.jenkins.serverError);
                return;
            }
            //logger.debug("firstBuild number====="+job.firstBuild.number);
            jenkins.getLastBuildInfo(req.params.jobName, function(err, buildLatest) {
                if (err) {
                    logger.error('jenkins jobs fetch error', err);
                    res.send(500, errorResponses.jenkins.serverError);
                    return;
                }
                //logger.debug("LastBuild details====>"+buildLatest.timestamp);
                var todaytimestamp = new Date().getTime();
                //logger.debug("Today timestamp=====>"+todaytimestamp);
                var yesterdaytimestamp = todaytimestamp - 86400000;
                var buildCount = 0;
                var successfulBuildCount = 0;
                var buildDetails = function(number) {
                    jenkins.getBuildInfo(req.params.jobName, number, function(err, buildData) {
                        if (number && number > job.firstBuild.number) {
                            if (err) {
                                logger.error('jenkins jobs fetch error testing====>', err);
                                //res.send(500, errorResponses.jenkins.serverError);
                                buildDetails(number - 1);
                                return;
                            }
                            if (buildData.timestamp > yesterdaytimestamp) {
                                buildCount++;
                                logger.debug("Successful build=====>"+buildData.result);
                                if(buildData.result == 'SUCCESS'){
                                    successfulBuildCount++;
                                }
                                //logger.debug("buildCOunt=====>" + buildCount);
                                buildDetails(number - 1);
                            } else {
                                res.send(200, {
                                    buildCount: buildCount,
                                    sucessbuildCount: successfulBuildCount
                                });
                                return;
                            }
                        } else {
                            res.send(200, {
                                buildCount: buildCount,
                                sucessbuildCount: successfulBuildCount
                            });
                            return;
                        }

                    });
                };
                buildDetails(buildLatest.number);
            });
        });
    });

    //API to get the count of dashboard build number per day.
    app.get('/jenkins/:jenkinsId/dashboardjobs/:jobName', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;

        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getJobInfo(req.params.jobName, function(err, job) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.send(500, errorResponses.jenkins.serverError);
                return;
            }
            jenkins.getLastBuildInfo(req.params.jobName, function(err, buildLatest) {
                if (err) {
                    logger.error('jenkins jobs fetch error', err);
                    res.send(500, errorResponses.jenkins.serverError);
                    return;
                }
                var todaytimestamp = new Date().getTime();
                var yesterdaytimestamp = todaytimestamp - 86400000;
                var buildCount = 0;
                var successfulBuildCount = 0;
                var buildDetails = function(number) {
                    jenkins.getBuildInfo(req.params.jobName, number, function(err, buildData) {
                        if (number && number > job.firstBuild.number) {
                            if (err) {
                                logger.error('jenkins jobs fetch error testing====>', err);
                                buildDetails(number - 1);
                                return;
                            }
                            if (buildData.timestamp > yesterdaytimestamp) {
                                buildCount++;
                                logger.debug("Successful build=====>"+buildData.result);
                                if(buildData.result == 'SUCCESS'){
                                    successfulBuildCount++;
                                }
                                buildDetails(number - 1);
                            } else {
                                res.send(200, {
                                    buildCount: buildCount,
                                    sucessbuildCount: successfulBuildCount
                                });
                                return;
                            }
                        } else {
                            res.send(200, {
                                buildCount: buildCount,
                                sucessbuildCount: successfulBuildCount
                            });
                            return;
                        }

                    });
                };
                buildDetails(buildLatest.number);
            });
        });
    });

    app.get('/jenkins/:jenkinsId/jobs/:jobName/builds/:buildNumber', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;
        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getBuildInfo(req.params.jobName, req.params.buildNumber, function(err, buildData) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(buildData);
        });
    });

    app.get('/jenkins/:jenkinsId/jobs/:jobName/builds/:buildNumber/output', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;
        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getJobOutput(req.params.jobName, req.params.buildNumber, function(err, jobOutput) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(jobOutput);
        });
    });

    app.get('/jenkins/:jenkinsId/job/:jobName/lastBuild', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;

        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.getJobsBuildNumber(req.params.jobName, function(err, jobOutput) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(jobOutput);
        });
    });

    app.get('/jenkins/:jenkinsId/job/:jobName/update/parameter', function(req, res) {
        var jenkinsData = req.CATALYST.jenkins;
        var jenkins = new Jenkins({
            url: jenkinsData.jenkinsurl,
            username: jenkinsData.jenkinsusername,
            password: jenkinsData.jenkinspassword
        });
        jenkins.updateJob(req.params.jobName, function(err, jobOutput) {
            if (err) {
                logger.error('jenkins jobs fetch error', err);
                res.status(500).send(errorResponses.jenkins.serverError);
                return;
            }
            res.send(jobOutput);
        });
    });
}
