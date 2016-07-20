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
var schemaValidator = require('../../dao/schema-validator');
var ChefTask = require('./taskTypeChef');
var JenkinsTask = require('./taskTypeJenkins');
var TaskHistory = require('./taskHistory');
var CompositeTask = require('./taskTypeComposite');
var PuppetTask = require('./taskTypePuppet');
var ScriptTask = require('./taskTypeScript');
var mongoosePaginate = require('mongoose-paginate');
var ApiUtils = require('_pr/lib/utils/apiUtil.js');
var Schema = mongoose.Schema;

var TASK_TYPE = {
    CHEF_TASK: 'chef',
    JENKINS_TASK: 'jenkins',
    COMPOSITE_TASK: 'composite',
    PUPPET_TASK: 'puppet',
    SCRIPT_TASK: 'script'
};

var TASK_STATUS = {
    SUCCESS: 'success',
    RUNNING: 'running',
    FAILED: 'failed'
};

var taskSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.orgIdValidator
    },
    bgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.bgIdValidator
    },
    projectId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.projIdValidator
    },
    envId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.envIdValidator
    },
    name: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.taskNameValidator
    },
    taskType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    jobResultURLPattern: {
        type: [String]
    },
    taskConfig: Schema.Types.Mixed,
    lastTaskStatus: String,
    normalized: String,
    lastRunTimestamp: Number,
    timestampEnded: Number,
    blueprintIds: [String],
    taskCreatedOn: {
        type: Date,
        default: Date.now
    }
});
taskSchema.plugin(mongoosePaginate);

// instance method :-


// Executes a task
taskSchema.methods.execute = function(userName, baseUrl, choiceParam, appData, blueprintIds, envId, callback, onComplete) {
    logger.debug('Executing');
    var task;
    var self = this;
    var taskHistoryData = {
        taskId: self.id,
        taskType: self.taskType,
        user: userName
    };

    if (this.taskType === TASK_TYPE.CHEF_TASK) {
        task = new ChefTask(this.taskConfig);

        taskHistoryData.nodeIds = this.taskConfig.nodeIds;
        taskHistoryData.runlist = this.taskConfig.runlist;
        taskHistoryData.attributes = this.taskConfig.attributes;

    } else if (this.taskType === TASK_TYPE.JENKINS_TASK) {
        task = new JenkinsTask(this.taskConfig);
        taskHistoryData.jenkinsServerId = this.taskConfig.jenkinsServerId;
        taskHistoryData.jobName = this.taskConfig.jobName;
    } else if (this.taskType === TASK_TYPE.PUPPET_TASK) {
        task = new PuppetTask(this.taskConfig);
        taskHistoryData.nodeIds = this.taskConfig.nodeIds;

    } else if (this.taskType === TASK_TYPE.COMPOSITE_TASK) {
        if (this.taskConfig.assignTasks) {
            task = new CompositeTask(this.taskConfig);
            taskHistoryData.assignedTaskIds = this.taskConfig.assignTasks;
        } else {
            callback({
                message: "At least one task required to execute Composite Task."
            }, null);
            return;
        }

    } else if (this.taskType === TASK_TYPE.SCRIPT_TASK) {
        task = new ScriptTask(this.taskConfig);
        taskHistoryData.nodeIds = this.taskConfig.nodeIds;
        taskHistoryData.scriptIds = this.taskConfig.scriptIds;
    } else {
        callback({
            message: "Invalid Task Type"
        }, null);
        return;
    }
    var timestamp = new Date().getTime();
    var taskHistory = null;
    task.orgId = this.orgId;
    task.envId = this.envId;
    task.execute(userName, baseUrl, choiceParam, appData, blueprintIds, envId, function(err, taskExecuteData, taskHistoryEntry) {
        if (err) {
            callback(err, null);
            return;
        }

        // hack for composite task
        if (taskHistoryEntry) {
            var keys = Object.keys(taskHistoryData);
            for (var i = 0; i < keys.length; i++) {
                taskHistoryEntry[keys[i]] = taskHistoryData[keys[i]];
            }
            taskHistoryData = taskHistoryEntry;
        }

        logger.debug("Task last run timestamp updated", JSON.stringify(taskExecuteData));
        self.lastRunTimestamp = timestamp;
        self.lastTaskStatus = TASK_STATUS.RUNNING;
        self.save(function(err, data) {
            if (err) {
                logger.error("Unable to update task timestamp");
                return;
            }

            logger.debug("Task last run timestamp updated");
        });
        if (!taskExecuteData) {
            taskExecuteData = {};
        }
        taskExecuteData.timestamp = timestamp;
        taskExecuteData.taskType = task.taskType;
        //making task history entry
        if (taskExecuteData.instances) {
            taskHistoryData.nodeIdsWithActionLog = [];
            for (var i = 0; i < taskExecuteData.instances.length; i++) {
                var obj = {
                    nodeId: taskExecuteData.instances[i]._id,
                    actionLogId: taskExecuteData.instances[i].tempActionLogId
                }
                taskHistoryData.nodeIdsWithActionLog.push(obj);
            }
        }

        taskHistoryData.status = TASK_STATUS.RUNNING;
        taskHistoryData.timestampStarted = timestamp;
        if (taskExecuteData.buildNumber) {
            taskHistoryData.buildNumber = taskExecuteData.buildNumber;
        }
        if (taskExecuteData.lastBuildNumber) {
            taskHistoryData.previousBuildNumber = taskExecuteData.lastBuildNumber;
        }
        var acUrl = [];
        if (self.jobResultURLPattern) {
            if (self.jobResultURLPattern.length > 0) {
                for (var i = 0; i < self.jobResultURLPattern.length; i++) {
                    acUrl.push(self.jobResultURLPattern[i].replace("$buildNumber", taskExecuteData.buildNumber));
                }
            }
        }
        //self.taskConfig.jobResultURL = acUrl;
        taskHistoryData.jobResultURL = acUrl;
        if (taskHistoryData.taskType === TASK_TYPE.JENKINS_TASK) {
            var taskConfig = self.taskConfig;
            taskConfig.jobResultURL = acUrl;
            Tasks.update({
                "_id": new ObjectId(self._id)
            }, {
                $set: {
                    taskConfig: taskConfig
                }
            }, {
                upsert: false
            }, function(err, data) {
                if (err) {
                    logger.error("Unable to update task jobResultURL");
                    return;
                }
                logger.debug("Task jobResultURL updated");

            });
        }
        // hack for composite task
        if (taskHistoryEntry) {
            taskHistoryData.save();
            taskHistory = taskHistoryData;
        } else {
            taskHistory = new TaskHistory(taskHistoryData);
            taskHistory.save();
        }

        callback(null, taskExecuteData, taskHistory);
    }, function(err, status, resultData) {
        self.timestampEnded = new Date().getTime();
        if (status == 0) {
            self.lastTaskStatus = TASK_STATUS.SUCCESS;
        } else {
            self.lastTaskStatus = TASK_STATUS.FAILED;
        }
        self.save();

        //updating task history
        if (taskHistory) {
            taskHistory.timestampEnded = self.timestampEnded;
            taskHistory.status = self.lastTaskStatus;
            logger.debug("resultData: ", JSON.stringify(resultData));
            if (resultData) {
                if (resultData.instancesResults && resultData.instancesResults.length) {
                    taskHistory.executionResults = resultData.instancesResults;
                } else if (resultData.blueprintResults && resultData.blueprintResults.length) {
                    logger.debug("resultData blueprint ==>  ", JSON.stringify(resultData.blueprintResults));
                    taskHistory.blueprintExecutionResults = resultData.blueprintResults;
                }

            }
            taskHistory.save();
        }

        if (typeof onComplete === 'function') {
            onComplete(err, status);
        }
    });
};

// Get Nodes list
taskSchema.methods.getChefTaskNodes = function() {
    if (this.taskType === TASK_TYPE.CHEF_TASK) {
        var chefTask = new ChefTask(this.taskConfig);
        return chefTask.getNodes();
    } else {
        return [];
    }
};

taskSchema.methods.getPuppetTaskNodes = function() {
    if (this.taskType === TASK_TYPE.PUPPET_TASK) {
        var puppetTask = new PuppetTask(this.taskConfig);
        return puppetTask.getNodes();
    } else {
        return [];
    }
};

taskSchema.methods.getHistory = function(callback) {
    TaskHistory.getHistoryByTaskId(this.id, function(err, tHistories) {
        if (err) {
            callback(err, null);
            return;
        }
        var count = 0;
        var checker;
        var uniqueResults = [];
        for (var i = 0; i < tHistories.length; ++i) {
            count++;
            if (!checker || comparer(checker, tHistories[i]) != 0) {
                checker = tHistories[i];
                uniqueResults.push(checker);
            }
        }
        if (count === tHistories.length) {
            callback(err, uniqueResults);
        }
    });
};

taskSchema.methods.getHistoryById = function(historyId, callback) {
    TaskHistory.getHistoryByTaskIdAndHistoryId(this.id, historyId, function(err, history) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, history);
    });
};


var comparer = function compareObject(a, b) {
    if (!b.buildNumber) {
        return 1;
    }
    if (a.buildNumber === b.buildNumber) {
        return 0;
    } else {
        return 1;
    }
}


// Static methods :-

// creates a new task
taskSchema.statics.createNew = function(taskData, callback) {
    logger.debug("Got data: ", JSON.stringify(taskData));
    var taskConfig;
    if (taskData.taskType === TASK_TYPE.JENKINS_TASK) {
        taskConfig = new JenkinsTask({
            taskType: TASK_TYPE.JENKINS_TASK,
            jenkinsServerId: taskData.jenkinsServerId,
            jobName: taskData.jobName,
            jobResultURL: taskData.jobResultURL,
            jobURL: taskData.jobURL,
            autoSyncFlag: taskData.autoSyncFlag,
            isParameterized: taskData.isParameterized,
            parameterized: taskData.parameterized
        });
    } else if (taskData.taskType === TASK_TYPE.CHEF_TASK) {
        var attrJson = null;

        taskConfig = new ChefTask({
            taskType: TASK_TYPE.CHEF_TASK,
            nodeIds: taskData.nodeIds,
            runlist: taskData.runlist,
            attributes: taskData.attributes,
            role: taskData.role
        });
    } else if (taskData.taskType === TASK_TYPE.PUPPET_TASK) {

        taskConfig = new PuppetTask({
            taskType: TASK_TYPE.PUPPET_TASK,
            nodeIds: taskData.nodeIds,
        });
    } else if (taskData.taskType === TASK_TYPE.COMPOSITE_TASK) {
        logger.debug("Incomming tasks: ", JSON.stringify(taskData));
        taskConfig = new CompositeTask({
            taskType: TASK_TYPE.COMPOSITE_TASK,
            assignTasks: taskData.assignTasks,
            jobName: taskData.jobName
        });
    } else if (taskData.taskType === TASK_TYPE.SCRIPT_TASK) {
        taskConfig = new ScriptTask({
            taskType: TASK_TYPE.SCRIPT_TASK,
            nodeIds: taskData.nodeIds,
            scriptTypeName: taskData.scriptTypeName,
            scriptDetails: taskData.scriptDetails
        });
    } else {
        callback({
            message: "Invalid Task Type"
        }, null);
        return;
    }
    var taskObj = taskData;
    taskObj.taskConfig = taskConfig;

    var that = this;
    var task = new that(taskObj);
    logger.debug('saved task:' + JSON.stringify(task));

    task.save(function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, task);
    });
};


taskSchema.statics.getTasksByOrgBgProjectAndEnvId = function(jsonData, callback) {
    if (jsonData.pageSize) {
        jsonData['searchColumns'] = ['taskType', 'name'];
        ApiUtils.databaseUtil(jsonData, function(err, databaseCall) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else {
                Tasks.paginate(databaseCall.queryObj, databaseCall.options, function(err, tasks) {
                    if (err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    }
                    callback(null, tasks);
                });
            }
        });
    } else {
        var queryObj = {
            orgId: jsonData.orgId,
            bgId: jsonData.bgId,
            projectId: jsonData.projectId,
            envId: jsonData.envId
        }

        this.find(queryObj, function(err, data) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
            callback(null, data);
        });
    }
}

taskSchema.statics.getTaskById = function(taskId, callback) {
    this.find({
        "_id": new ObjectId(taskId)
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (data.length) {
            callback(null, data[0]);
        } else {
            callback(null, null);
        }

    });
};

// get task by ids
taskSchema.statics.getTaskByIds = function(taskIds, callback) {
    if (!(taskIds && taskIds.length)) {
        callback(null, []);
        return;
    }
    var queryObj = {};
    queryObj._id = {
        $in: taskIds
    }
    logger.debug(taskIds);
    this.find(queryObj, function(err, tasks) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, tasks);
    });
};


// remove task by id
taskSchema.statics.removeTaskById = function(taskId, callback) {
    this.remove({
        "_id": new ObjectId(taskId)
    }, function(err, deleteCount) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, deleteCount);

    });
};


// update tasks by id
taskSchema.statics.updateTaskById = function(taskId, taskData, callback) {
    var taskConfig;

    if (taskData.taskType === TASK_TYPE.JENKINS_TASK) {
        taskConfig = new JenkinsTask({
            taskType: TASK_TYPE.JENKINS_TASK,
            jenkinsServerId: taskData.jenkinsServerId,
            jobName: taskData.jobName,
            jobResultURL: taskData.jobResultURL,
            jobURL: taskData.jobURL,
            autoSyncFlag: taskData.autoSyncFlag,
            isParameterized: taskData.isParameterized,
            parameterized: taskData.parameterized
        });
    } else if (taskData.taskType === TASK_TYPE.CHEF_TASK) {

        taskConfig = new ChefTask({
            taskType: TASK_TYPE.CHEF_TASK,
            nodeIds: taskData.nodeIds,
            runlist: taskData.runlist,
            attributes: taskData.attributes,
            role: taskData.role
        });
    } else if (taskData.taskType === TASK_TYPE.PUPPET_TASK) {

        taskConfig = new PuppetTask({
            taskType: TASK_TYPE.PUPPET_TASK,
            nodeIds: taskData.nodeIds
        });
    } else if (taskData.taskType === TASK_TYPE.COMPOSITE_TASK) {
        taskConfig = new CompositeTask({
            taskType: TASK_TYPE.COMPOSITE_TASK,
            jobName: taskData.jobName,
            assignTasks: taskData.assignTasks
        });
    } else if (taskData.taskType === TASK_TYPE.SCRIPT_TASK) {
        taskConfig = new ScriptTask({
            taskType: TASK_TYPE.SCRIPT_TASK,
            nodeIds: taskData.nodeIds,
            scriptTypeName: taskData.scriptTypeName,
            scriptDetails: taskData.scriptDetails
        });
    } else {
        callback({
            message: "Invalid Task Type"
        }, null);
        return;
    }

    Tasks.update({
        "_id": new ObjectId(taskId)
    }, {
        $set: {
            name: taskData.name,
            taskConfig: taskConfig,
            taskType: taskData.taskType,
            description: taskData.description,
            jobResultURLPattern: taskData.jobResultURL,
            blueprintIds: taskData.blueprintIds
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            callback(err, null);
            return;
        }
        logger.debug('Updated task:' + JSON.stringify(Tasks));
        callback(null, updateCount);

    });

};

taskSchema.statics.getTasksByNodeIds = function(nodeIds, callback) {
    if (!nodeIds) {
        nodeIds = [];
    }
    logger.debug("nodeids ==> ", nodeIds, typeof nodeIds[0]);
    Tasks.find({
        "taskConfig.nodeIds": {
            "$in": nodeIds
        }
    }, function(err, tasks) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tasks);

    });
};

taskSchema.statics.updateJobUrl = function(taskId, taskConfig, callback) {
    Tasks.update({
        "_id": new ObjectId(taskId)
    }, {
        $set: {
            taskConfig: taskConfig
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            callback(err, null);
            return;
        }
        logger.debug('Updated task:' + updateCount);
        callback(null, updateCount);

    });
};

// get task by ids
taskSchema.statics.listTasks = function(callback) {
    this.find(function(err, tasks) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, tasks);
    });
};
taskSchema.statics.getChefTasksByOrgBgProjectAndEnvId = function(jsonData, callback) {
    this.find(jsonData, { _id: 1, taskType: 1, name: 1, taskConfig: 1, blueprintIds: 1 }, function(err, chefTasks) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, chefTasks);
    });
};
taskSchema.statics.getDistinctTaskTypeByIds = function(ids, callback) {
    this.distinct("taskType", { _id: { $in: ids } }, function(err, distinctTaskTypes) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, distinctTaskTypes);
    });
};

taskSchema.statics.NormalizedTasks = function(jsonData, fieldName, callback) {
    var queryObj = {
        orgId: jsonData.orgId,
        bgId: jsonData.bgId,
        projectId: jsonData.projectId,
        envId: jsonData.envId
    };
    this.find(queryObj, function(err, tasks) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        var count = 0;
        for (var i = 0; i < tasks.length; i++) {
            (function(task) {
                count++;
                var normalized = task[fieldName];
                Tasks.update({
                    "_id": new ObjectId(task._id)
                }, {
                    $set: {
                        normalized: normalized.toLowerCase()
                    }
                }, {
                    upsert: false
                }, function(err, updatedTask) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    }
                    if (tasks.length === count) {
                        callback(null, updatedTask);
                    }
                });
            })(tasks[i]);
        }
    })
};

taskSchema.statics.updateTaskConfig = function updateTaskConfig(taskId, taskConfig, callback) {
    Tasks.update({
        "_id": new ObjectId(taskId)
    }, {
        $set: {
            taskConfig: taskConfig
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            return callback(err, null);
        }
        logger.debug('Updated task:' + updateCount);
        return callback(null, updateCount);

    });
};

var Tasks = mongoose.model('Tasks', taskSchema);

module.exports = Tasks;
