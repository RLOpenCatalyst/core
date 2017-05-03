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
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var taskTypeSchema = require('./taskTypeSchema');
var TaskHistory = require('./taskHistory');



var compositeTaskSchema = taskTypeSchema.extend({
	_id:false,
	assignTasks: [String]
});

// Instance Method :- run composite task

compositeTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
	var Tasks;
	var taskHistory = new TaskHistory();
	if (!Tasks) {
		Tasks = require('_pr/model/classes/tasks/tasks.js');
	}
	var that = this;
	Tasks.getTaskByIds(this.assignTasks, function(err, tasks) {
		if (err) {
			if (typeof onExecute === 'function') {
				onExecute(err, null);
			}
			return;
		}

		if (typeof onExecute === 'function') {
			onExecute(null, null, taskHistory);
		}


		task = [];
		var assignTask = that.assignTasks;
		for (var i = 0; i < assignTask.length; i++) {
			for (var j = 0; j < tasks.length; j++) {
				logger.debug("matched...... ", tasks[j].id);
				if (assignTask[i] === tasks[j].id) {
					task.push(tasks[j]);
				}
			}
		}
		count = 0;

		logger.debug('tasks length', task.length);

		function executeTasks(count) {

			task[count].execute(userName, baseUrl, choiceParam, nexusData, task[count].blueprintIds, envId, function(err, taskExecuteData, history) {
				logger.debug("Calling...");
				if (err) {
					console.error(err);
					return;
				}
				if (!(taskHistory.taskHistoryIds && taskHistory.taskHistoryIds.length)) {
					taskHistory.taskHistoryIds = [];
				}
				taskHistory.taskHistoryIds.push({
					taskId: task[count].id,
					historyId: history.id
				});
				taskHistory.save();
			}, function(err, status) {
				if (err) {
					if (typeof onComplete === 'function') {
						onComplete(null, 1);
					}
					return;
				}
				count++;
				logger.debug("count ", count);
				if (count < tasks.length) {
					if (status === 0) {
						executeTasks(count);
					} else {
						onComplete(null, 1);
					}
				} else {
					if (status === 0) {
						onComplete(null, 0);
					} else {
						logger.debug('firing failure');
						onComplete(null, 1);
					}
				}

			});
		}

		executeTasks(count);
	});
	logger.debug(this.assignTasks);
};

var CompositeTask = mongoose.model('compositeTask', compositeTaskSchema);

module.exports = CompositeTask;