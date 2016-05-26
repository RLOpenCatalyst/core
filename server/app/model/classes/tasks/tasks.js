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
var uniqueValidator = require('mongoose-unique-validator');
var ChefTask = require('./taskTypeChef');
var JenkinsTask = require('./taskTypeJenkins');
var TaskHistory = require('./taskHistory');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var Jenkins = require('_pr/lib/jenkins');
var CompositeTask = require('./taskTypeComposite');
var PuppetTask = require('./taskTypePuppet');
var ScriptTask = require('./taskTypeScript');



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
    lastRunTimestamp: Number,
    timestampEnded: Number,
    blueprintIds: [String]
});

// instance method :-  

// Executes a task
taskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, callback, onComplete) {
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
        taskHistoryData.scriptFileName = this.taskConfig.scriptFileName;
    } else {
        callback({
            message: "Invalid Task Type"
        }, null);
        return;
    }
    var timestamp = new Date().getTime();
    var taskHistory = null;
    task.orgId = this.orgId;
    task.execute(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, function(err, taskExecuteData, taskHistoryEntry) {
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
            scriptFileName: taskData.scriptFileName
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

// creates a new task
taskSchema.statics.getTasksByOrgBgProjectAndEnvId = function(orgId, bgId, projectId, envId, callback) {
    var queryObj = {
        orgId: orgId,
        bgId: bgId,
        projectId: projectId,
        envId: envId
    }

    this.find(queryObj, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

// get task by id
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
            scriptFileName: taskData.scriptFileName
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

var Tasks = mongoose.model('Tasks', taskSchema);

module.exports = Tasks;