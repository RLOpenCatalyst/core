var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var async = require('async');
var taskService = require('_pr/services/taskService.js');
var Tasks = require('_pr/model/classes/tasks/tasks.js');
var crontab = require('node-crontab');


var TaskSync = Object.create(CatalystCronJob);
//TaskSync.interval = '*/5 * * * *';
TaskSync.execute = taskSync;

module.exports = TaskSync;

function taskSync() {
    Tasks.getScheduledTask(function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch Tasks: ", err);
            return;
        }
        logger.debug("Tasks:   ", JSON.stringify(tasks));
        if (tasks && tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                (function(i) {
                    crontab.scheduleJob(tasks[i].cron, function() {
                        taskService.executeTask(tasks[i]._id, tasks[i].userName, "", "", "", function(err, historyData) {
                            if (err === 404) {
                                logger.error("Task not found.", err);
                            } else if (err) {
                                logger.error("Failed to execute task.", err);
                            }
                            logger.debug("Task Execution Success: ", tasks[i].name);
                        });
                    });
                })(i);
            }
        }else{
            logger.debug("There is no scheduled Job right now.");
        }
    });
}
