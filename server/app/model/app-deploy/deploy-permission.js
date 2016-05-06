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
    projectId: {
        type: String,
        required: true,
        trim: true
    },
    envId: {
        type: String,
        required: true,
        trim: true
    },
    appName: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        required: true,
        trim: true
    },
    comments: {
        type: String,
        trim: true
    },
    isApproved: {
        type: Boolean,
        required: true
    }
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
        if (aPermission.length > 0) {
            that.update({
                projectId: permission.projectId,
                envId: permission.envId,
                appName: permission.appName,
                version: permission.version
            }, {
                $set: permission
            }, {
                upsert: false
            }, function (err, updatedData) {
                if (err) {
                    logger.debug("Failed to update: ", err);
                    callback(err, null);
                }
                logger.debug("Deploy Permission is successfully updated.");
                callback(null, updatedData);
            });
        }
        else {
            var appPermission = new that(permission);
            appPermission.save(function(err, aPermission) {
                if (err) {
                    logger.debug("Got error while creating a Permission: ", err);
                    callback(err, null);
                }
                logger.debug("Deploy Permission is successfully saved.");
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
        logger.debug("Got permission: ");
        callback(null, permission);
    });
};

DeployPermissionSchema.statics.getDeployPermissionByProjectIdEnvNameAppNameVersion=function(projectId, envId, appName, version, callback) {
    this.find({
        projectId: projectId,
        envId: envId,
        appName: appName,
        version: version
    }, function(err, aPermission) {
        if (err) {
            logger.debug("Got error while fetching permission: ", err);
            callback(err, null);
        }
        logger.debug("Got permission: ");
        callback(null, aPermission);
    });
};

DeployPermissionSchema.statics.updateDeployPermission=function(aDeployPermission,callback){
    this.update({
        projectId: aDeployPermission.projectId,
        envId: aDeployPermission.envId,
        appName: aDeployPermission.appName,
        version: aDeployPermission.version
    }, {
        $set: aDeployPermission
    }, {
        upsert: false
    }, function (err, updatedDeployPermission) {
        if (err) {
            logger.debug("Failed to update: ", err);
            callback(err, null);
        }
        callback(null, updatedDeployPermission);
    });

};
DeployPermissionSchema.statics.saveDeployPermission=function(aDeployPermission,callback){
    var appPermission = new this(aDeployPermission);
    appPermission.save(function(err, aPermission) {
        if (err) {
            logger.debug("Got error while creating a Permission: ", err);
            callback(err, null);
        }
        callback(null, aPermission);
    });
};
var DeployPermission = mongoose.model("deployPermission", DeployPermissionSchema);
module.exports = DeployPermission;