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
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var schemaValidator = require('_pr/model/utils/schema-validator');

// File which contains App Data Permission DB schema and DAO methods. 

var Schema = mongoose.Schema;

var DeployPermissionSchema = new Schema({
    projectId: String,
    envId: String,
    appName: String,
    version: String,
    comments: String,
    isApproved: String
});


// Save or update appData Permission informations.
DeployPermissionSchema.statics.createNewOrUpdate = function(permission, callback) {
    var that = this;
    this.find({
        projectId: permission.projectId,
        envId: permission.envId,
        appName: permission.appName,
        version: permission.version
    }, function(err, aPermission) {
        if (err) {
            logger.debug("Error fetching record.", err);
            callback(err, null);
        }
        
        if (aPermission.length) {
            var setData = {};
            var keys = Object.keys(permission);
            for (var i = 0; i < keys.length; i++) {
                setData[keys[i]] = permission[keys[i]];
            }
            that.update({
                projectId: permission.projectId,
                envId: permission.envId,
                appName: permission.appName,
                version: permission.version
            }, {
                $set: setData
            }, {
                upsert: false
            }, function(err, updatedData) {
                if (err) {
                    logger.debug("Failed to update: ", err);
                    callback(err, null);
                }
                callback(null, updatedData);
            });
        } else {
            var appPermission = new that(permission);
            appPermission.save(function(err, aPermission) {
                if (err) {
                    logger.debug("Got error while creating a Permission: ", err);
                    callback(err, null);
                }
                logger.debug("Creating a Permission: ", JSON.stringify(aPermission));
                callback(null, aPermission);
            });
        }
    });
};

// Get AppData by ip,project,env.
DeployPermissionSchema.statics.getDeployPermissionByProjectAndEnv = function(projectId, envId, appName, version, callback) {
    this.find({
        projectId: projectId,
        envId: envId,
        appName: appName,
        version: version
    }, function(err, permission) {
        if (err) {
            logger.debug("Got error while fetching permission: ", err);
            callback(err, null);
        }
        logger.debug("Got permission: ", JSON.stringify(permission));
        callback(null, permission);
    });
};

var DeployPermission = mongoose.model("deployPermission", DeployPermissionSchema);
module.exports = DeployPermission;