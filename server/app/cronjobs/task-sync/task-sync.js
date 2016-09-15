var logger = require('_pr/logger')(module);
var taskService = require('_pr/services/taskService.js');
var Tasks = require('_pr/model/classes/tasks/tasks.js');
var crontab = require('node-crontab');


var taskSync = module.exports = {};

taskSync.executeScheduledTasks = function executeScheduledTasks() {
    Tasks.getScheduledTask(function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch Tasks: ", err);
            return;
        }
        logger.debug("Tasks:   ", JSON.stringify(tasks));
        if (tasks && tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                (function(i) {
                       taskService.executeScheduleJob(tasks[i]);
                })(i);
            }
        }else{
            logger.debug("There is no scheduled Job right now.");
        }
    });
}
