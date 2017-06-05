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
var logger = require('_pr/logger')(module);

var Schema = mongoose.Schema;
var ContainerLogSchema = new Schema({
    actionId: {
        type: String,
        unique: true
    },
    containerId: String,
    orgName: String,
    orgId: String,
    bgName: String,
    bgId: String,
    projectName: String,
    envName: String,
    envId: String,
    status: String,
    actionStatus: String,
    instanceIP: String,
    platformId: String,
    containerName: String,
    Image: String,
    ImageId: String,
    platform: String,
    os: String,
    user: String,
    createdOn: Number,
    startedOn: Number,
    endedOn: Number,
    providerType: String,
    action: String
});

ContainerLogSchema.plugin(mongoosePaginate);
var ContainerLogs = mongoose.model('containerlogs', ContainerLogSchema);

var ContainerLog = function() {
    this.createOrUpdate = function(logData, callback) {
        ContainerLogs.find({
            actionId: logData.actionId,
            containerId: logData.containerId,
            orgId: logData.orgId,
            bgId: logData.bgId,
            envId: logData.envId
        }, function(err, data) {
            if (err) {
                logger.debug("Failed to fetch ContainerLogs: ", err);
                return callback(err, null);
            }
            if (data && data.length > 0) {
                var logObj = {
                    status:logData.status,
                    action:logData.action,
                    actionStatus:logData.actionStatus,
                    instanceIP:logData.instanceIP,
                    user:logData.user,
                    platform:logData.platform,
                    containerName: logData.containerName,
                    image:logData.image,
                    os:logData.os,
                    logs:logData.logs
                };
                if(logData.endedOn){
                    logObj.endedOn = logData.endedOn;
                };
                ContainerLogs.update({
                    actionId: logData.actionId,
                    containerId: logData.containerId,
                    orgId: logData.orgId,
                    bgId: logData.bgId,
                    envId: logData.envId
                }, {
                    $set: logObj
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
                var log = new ContainerLogs(logData);
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

    this.getContainerActionLogs = function getContainerActionLogs(jsonData,callback){
        ContainerLogs.paginate(jsonData.queryObj, jsonData.options, function (err, containerLogList) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                callback(err,null);
            }
            callback(null, containerLogList);
        });
    }

};


module.exports = new ContainerLog();
