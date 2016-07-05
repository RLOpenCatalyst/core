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
var mongoosePaginate = require('mongoose-paginate');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
var apiUtils = require('_pr/lib/utils/apiUtil.js');

var Schema = mongoose.Schema;
var InstanceLogSchema = new Schema({
    actionId: String,
    instanceId: String,
    orgName: String,
    bgName: String,
    projectName: String,
    envName: String,
    status: String,
    bootStrap: String,
    platformId: String,
    blueprintName: String,
    data: [String],
    platform: String,
    os: String,
    size: String,
    user: String,
    createdOn: Number,
    startedOn: Number,
    endedOn: Number,
    providerType: String,
    action: String,
    logs: [{
        err: Boolean,
        logText: String,
        timestamp: Number
    }]
});

InstanceLogSchema.plugin(mongoosePaginate);
var InstanceLogs = mongoose.model('instancelogs', InstanceLogSchema);

var InstanceLog = function() {
    this.createOrUpdate = function(actionId, instanceId, logData, callback) {
        InstanceLogs.find({
            actionId: actionId,
            instanceId: instanceId
        }, function(err, data) {
            if (err) {
                logger.debug("Failed to fetch InstanceLogs: ", err);
                return callback(err, null);
            }
            if (data && data.length) {
                var setData = {};
                var keys = Object.keys(logData);
                for (var i = 0; i < keys.length; i++) {
                    setData[keys[i]] = logData[keys[i]];
                }
                delete setData['logs'];
                InstanceLogs.update({
                    actionId: actionId,
                    instanceId: instanceId
                }, {
                    $set: setData,
                    $push: { logs: logData.logs }
                }, {
                    upsert: false
                }, function(err, updatedData) {
                    if (err) {
                        logger.debug("Failed to update: ", err);
                        callback(err, null);
                        return;
                    }
                    callback(null, updatedData);
                    return;
                });
            } else {
                var log = new InstanceLogs(logData);
                log.save(function(err, data) {
                    if (err) {
                        logger.error("Failed to insertLog", err);
                        if (typeof callback === 'function') {
                            callback(err, null);
                        }
                        return;
                    }
                    if (typeof callback === 'function') {
                        callback(null, data);
                    }
                });
            }

        });
    };

    this.getLogsByActionId = function(actionId, callback) {
        var queryObj = {
            actionId: actionId
        }

        InstanceLogs.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getLogsByActionId ", err);
                callback(err, null);
                return;
            }
            callback(null, data);
        });

    }

    this.getInstanceActionList = function getInstanceActionList(jsonData, callback) {
        if (jsonData && jsonData.pageSize) {
            jsonData['searchColumns'] = ['platformId', 'status', 'bootStrap', 'orgName', 'bgName', 'projectName', 'envName', 'providerType'];
            apiUtils.databaseUtil(jsonData, function(err, databaseCall) {
                if (err) {
                    var err = new Error('Internal server error');
                    err.status = 500;
                    return callback(err);
                } else {
                    databaseCall.queryObj['$or'] = [{ "status": "running" }, { "status": "stopped" }, { "status": "pending" }];
                    InstanceLogs.paginate(databaseCall.queryObj, databaseCall.options, function(err, instanceActions) {
                        if (err) {
                            logger.error(err);
                            var err = new Error('Internal server error');
                            err.status = 500;
                            return callback(err);
                        } else {
                            if(instanceActions && instanceActions.docs && instanceActions.docs.length){
                                for(var i=0; i< instanceActions.docs.length; i++){
                                    instanceActions.docs[i] = JSON.parse(JSON.stringify(instanceActions.docs[i]));
                                    delete instanceActions.docs[i]['logs'];
                                    delete instanceActions.docs[i]['_id'];
                                }
                            }
                            return callback(null, instanceActions);
                        }
                    });
                }
            });
        } else {
            InstanceLogs.find(function(err, data) {
                if (err) {
                    logger.error("Failed to getInstances :: ", err);
                    callback(err, null);
                    return;
                }
                return callback(null, data);
            });
        }
    }
}


module.exports = new InstanceLog();
