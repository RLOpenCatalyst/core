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
var schemaValidator = require('../../../dao/schema-validator');
var utils = require('../../utils/utils');

var Workflow = require('./workflow');

var DeployHistory = require('./deployHistory');

var Schema = mongoose.Schema;

var AppInstanceSchema = new Schema({
    name: String,
    envId: String,
    workflows: [Workflow.schema]
});

AppInstanceSchema.methods.getNodes = function(callback) {
    var self = this;
    var nodesList = [];
    count = 0;
    if (!this.workflows.length) {
        callback(null, nodesList);
        return;
    }

    function getWorkflowNodes(workflow) {
        workflow.getNodes(function(err, nodes) {
            count++;
            if (err) {
                callback(err, null);
                return;
            }
            nodesList = utils.arrayMerge(nodesList, nodes);
            if (count < self.workflows.length) {
                getWorkflowNodes(self.workflows[count]);
            } else {
                callback(null, nodesList);
            }
        });
    }
    getWorkflowNodes(this.workflows[count]);
};

AppInstanceSchema.methods.executeWorkflow = function(workflowId, username, baseUrl, callback, onComplete) {
    var workflows = this.workflows;
    if (!workflows.length) {
        callback({
            message: "Workflow does not exist"
        }, null);
        return;
    }
    var workflow;
    for (var i = 0; i < workflows.length; i++) {
        if (workflowId == workflows[i]._id) {
            workflow = workflows[i];
            break;
        }
    }
    if (!workflow) {
        callback({
            message: "Workflow does not exist"
        }, null);
        return;
    }

    workflow.execute(username, baseUrl, function(err, tasks) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tasks);

    }, function(err, status) {
        if (typeof onComplete === 'function') {
            onComplete(err, status);
        }
    });
};

var AppInstance = mongoose.model('appInstances', AppInstanceSchema);

module.exports = AppInstance;
