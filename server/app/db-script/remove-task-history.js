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

TaskHistory.listHistory(function(err, histories) {
    if (err) {
        logger.error("Failed to fetch Task Histories: ", err);
        process.exit();
    }
    if (histories && histories.length) {
        for (var i = 0; i < histories.length; i++) {
            (function(i) {
                Tasks.getTaskById(histories[i].taskId, function(err, task) {
                    if (err) {
                        logger.error("Filed to fetch Task: ", err);
                    }
                    if (!task) {
                        TaskHistory.removeByTaskId(histories[i].taskId, function(err, removedHistory) {
                            if (err) {
                                logger.error("Failed to remove history: ", err);
                            } else {
                                logger.debug("Remove success.");
                            }
                        });
                    }
                });
            })(i);
        }
    } else {
        logger.debug("No Task History to update.");
        process.exit();
    }
})
