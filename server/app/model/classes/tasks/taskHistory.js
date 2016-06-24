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


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var schemaValidator = require('../../dao/schema-validator');

var Schema = mongoose.Schema;

var taskHistorySchema = new Schema({
	taskId: String,
	taskType: String,
	runlist: [String],
	nodeIds: [String],
	nodeIdsWithActionLog: [{
		nodeId: String,
		actionLogId: String
	}],
	attributes: Schema.Types.Mixed,
	jenkinsServerId: String,
	jobName: String,
	buildNumber: Number,
	previousBuildNumber: Number,
	status: String,
	user: String,
	timestampStarted: Number,
	timestampEnded: Number,
	jobResultURL: [String],
	executionResults: [Schema.Types.Mixed],
	assignedTaskIds: [String],
	taskHistoryIds: [{
		taskId: String,
		historyId: String
	}],

	blueprintExecutionResults: Schema.Types.Mixed
});

taskHistorySchema.method.update = function(status, timestampEnded, callback) {
	var self = this;
	var taskHistory = new self(historyData);

	taskHistory.save(function(err, tHistory) {
		if (err) {
			callback(err, null);
			return;
		}
		callback(null, tHistory);
	});
};

taskHistorySchema.statics.createNew = function(historyData, callback) {
	var self = this;
	var taskHistory = new self(historyData);

	taskHistory.save(function(err, tHistory) {
		logger.debug('saving task history ==>');
		if (err) {
			callback(err, null);
			return;
		}
		callback(null, tHistory);
	});
};

taskHistorySchema.statics.getHistoryByTaskId = function(taskId, callback) {
	// this.find({
	// 	$query: {
	// 		taskId: taskId
	// 	},
	// 	$orderby: {
	// 		"buildNumber": -1
	// 	}
	// }, function(err, tHistories) {
	// 	if (err) {
	// 		logger.debug('err = >', err);
	// 		callback(err, null);
	// 		return;
	// 	}
	// 	tHistories.sort({
	// 		"buildNumber": -1
	// 	})
	// 	callback(null, tHistories);
	// });

	this.find({
		taskId: taskId
	}).sort({
		"buildNumber": 'desc'
	}).exec(function(err, tHistories) {
		if (err) {
			logger.debug('err', err);
			callback(err, null);
			return;
		}
		callback(null, tHistories);
	});
};



taskHistorySchema.statics.getHistoryByTaskIdAndHistoryId = function(taskId, historyId, callback) {
	this.find({
		taskId: taskId,
		_id: new ObjectId(historyId)
	}, function(err, tHistories) {
		if (err) {
			callback(err, null);
			return;
		}
		if (tHistories.length) {
			callback(null, tHistories[0]);
		} else {
			callback(null, null);
		}
	});
};


taskHistorySchema.statics.getLast100HistoriesByTaskId = function(taskId, callback) {

	this.find({
		taskId: taskId
	}, function(err, tHistories) {
		if (err) {
			callback(err, null);
			return;
		}
		callback(null, tHistories);
	}).sort({
		buildNumber: -1
	}).limit(100);
};

taskHistorySchema.statics.listHistory = function(callback) {

	this.find(function(err, tHistories) {
		if (err) {
			callback(err, null);
			return;
		}
		callback(null, tHistories);
	});
};

var TaskHistory = mongoose.model('taskHistory', taskHistorySchema);

module.exports = TaskHistory;