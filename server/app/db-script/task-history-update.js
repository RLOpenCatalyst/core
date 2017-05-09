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

// This script will update task history with org details and create action log.

var logger = require('_pr/logger')(module);
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var TaskHistory = require('_pr/model/classes/tasks/taskHistory');
var Tasks = require('_pr/model/classes/tasks/tasks.js');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');

var dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});

Tasks.listTasks(null, function(err, tasks) {
    if (err) {
        logger.error("Failed to fetch tasks: ", err);
        process.exit();
    }
    if (tasks && tasks.length) {
        for (var i = 0; i < tasks.length; i++) {
            (function(i) {
                TaskHistory.getHistoryByTaskId(tasks[i]._id, function(err, histories) {
                    if (err) {
                        logger.error("Failed to fetch histories: ", err);
                    }
                    if (histories && histories.length) {
                        for (var j = 0; j < histories.length; j++) {
                            (function(j) {
                                histories[j].taskName = tasks[i].name;
                                if (!histories[j].orgName) {
                                    d4dModelNew.d4dModelMastersProjects.find({ rowid: tasks[i].projectId }, function(err, project) {
                                        if (err) {
                                            logger.error("Failed to fetch project: ", err);
                                        }
                                        if (project && project.length) {
                                            histories[j].orgName = project[0].orgname[0];
                                            histories[j].bgName = project[0].productgroupname;
                                            histories[j].projectName = project[0].projectname;
                                            d4dModelNew.d4dModelMastersEnvironments.find({ rowid: tasks[i].envId }, function(err, env) {
                                                if (err) {
                                                    logger.error("Failed to fetch Env: ", err);
                                                }

                                                if (env && env.length) {
                                                    histories[j].envName = env[0].environmentname;
                                                    TaskHistory.updateHistory(histories[j]._id, histories[j], function(err, updatedData) {
                                                        if (err) {
                                                            logger.error("Failed to update Task History: ", err);
                                                        }
                                                        logger.debug("History updated: ", updatedData);
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    TaskHistory.updateHistory(histories[j]._id, histories[j], function(err, updatedData) {
                                        if (err) {
                                            logger.error("Failed to update Task History: ", err);
                                        }
                                        logger.debug("History updated...");
                                    });
                                }
                            })(j);
                        }
                    }
                });
            })(i);
        }
    } else {
        logger.debug("No Task to update.");
        process.exit();
    }
})
