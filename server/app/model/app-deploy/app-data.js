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

// File which contains App Data DB schema and DAO methods. 

var Schema = mongoose.Schema;

var AppDataSchema = new Schema({
    projectId: {
        type: String,
        required: true,
        trim: true
    },
    envName: {
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
    nexus: {
        rowId:{
            type: String,
            trim: true
        },
        repository: {
            type: String,
            trim: true
        },
        repoURL: {
            type: String,
            trim: true
        },
        nodeIds: {
            type: [String]
        },
        artifactId: {
            type: String,
            trim: true
        },
        groupId: {
            type: String,
            trim: true
        },
        taskId: {
            type: String,
            trim: true
        }
    },
    docker: {
        rowId:{
            type: String,
            trim: true
        },
        image: {
            type: String,
            trim: true
        },
        containerName: {
            type: String,
            trim: true
        },
        containerPort: {
            type: String,
            trim: true
        },
        hostPort: {
            type: String,
            trim: true
        },
        dockerUser: {
            type: String,
            trim: true
        },
        dockerPassword: {
            type: String,
            trim: true
        },
        dockerEmailId: {
            type: String,
            trim: true
        },
        imageTag: {
            type: String,
            trim: true
        },
        nodeIds: {
            type: [String]
        },
        taskId: {
            type: String,
            trim: true
        }
    },
    s3Bucket: {
        url: {
            type: String,
            trim: true
        },
        nodeIds: {
            type: [String]
        },
        taskId: {
            type: String,
            trim: true
        }
    }
});


// Save or update appData informations.
AppDataSchema.statics.createNewOrUpdate = function createNewOrUpdate(appData, callback) {
    logger.debug("AppData in createNewOrUpdate: ", JSON.stringify(appData));
    var that = this;
    this.find({
        projectId: appData.projectId,
        envName: appData.envName,
        appName: appData.appName,
        version: appData.version
    }, function(err, aData) {
        if (err) {
            logger.debug("Error fetching record.", err);
            callback(err, null);
            return;
        }

        if (aData && aData.length) {
            //var existData = checkDuplicate(aData[0], appData);
            var setData = {};
            //if (existData) {
                var keys = Object.keys(appData);
                for (var i = 0; i < keys.length; i++) {
                    setData[keys[i]] = appData[keys[i]];
                }
            //}

            that.update({
                "_id": aData[0].id
            }, {
                $set: setData
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
            logger.debug("This is the appData going to save: ",JSON.stringify(appData));
            var appDataObj = new that(appData);
            appDataObj.save(function(err, anAppData) {
                if (err) {
                    logger.debug("Got error while creating appData: ", err);
                    callback(err, null);
                    return;
                }
                logger.debug("Creating appData: ", JSON.stringify(anAppData));
                callback(null, anAppData);
                return;
            });
        }
    });
};

var checkDuplicate = function checkDuplicate(aData, reqData) {
    var existDocker = aData.docker;
    var reqDocker = reqData.docker;
    var existNexus = aData.nexus;
    var reqNexus = reqData.nexus;
    if (existDocker && existDocker.length && existDocker[0] != null && reqDocker && reqDocker.length && reqDocker[0] != null && reqDocker[0].nodeIds) {
        for (var i = 0; i < existDocker.length; i++) {
            if (existDocker[i].image === reqDocker[0].image && existDocker[i].imageTag === reqDocker[0].imageTag &&
                existDocker[i].containerPort === reqDocker[0].containerPort && existDocker[i].hostPort === reqDocker[0].hostPort &&
                existDocker[i].containerName === reqDocker[0].containerName && existDocker[i].dockerUser === reqDocker[0].dockerUser &&
                existDocker[i].dockerPassword === reqDocker[0].dockerPassword) {
                if (existDocker[i].nodeIds.indexOf(reqDocker[0].nodeIds[0]) == -1) {
                    existDocker[i].nodeIds.push(reqDocker[0].nodeIds[0]);
                }
            } else {
                existDocker.push(reqDocker[0]);
            }
        }
        reqData.docker = existDocker;
        return reqData;
    } else if (existNexus && reqNexus) {
        if (existNexus.repoURL && reqNexus.nodeIds) {
            if (existNexus.nodeIds.indexOf(reqNexus.nodeIds[0]) == -1) {
                existNexus.nodeIds.push(reqNexus.nodeIds[0]);
            }
        } else {
            existNexus = reqNexus;
        }
        reqData.nexus.nodeIds = existNexus.nodeIds;
        return reqData;
    } else {
        return null;
    }
}

// Get AppData by project,env,appName,version.
AppDataSchema.statics.getAppDataByProjectAndEnv = function getAppDataByProjectAndEnv(projectId, envName, appName, version, callback) {
    this.find({
        projectId: projectId,
        envName: envName,
        appName: appName,
        version: version
    }, function(err, anAppData) {
        if (err) {
            logger.debug("Got error while fetching appData: ", err);
            callback(err, null);
        }
        logger.debug("Got appData: ", JSON.stringify(anAppData));
        callback(null, anAppData);
    });
};

// Get AppData by project,reponame for nexus
AppDataSchema.statics.getAppDataByProjectAndRepo = function getAppDataByProjectAndRepo(projectId, reponame, callback) {
    this.find({
        projectId: projectId,
       
        "nexus.repository": reponame
        }
       
    , function(err, anAppData) {
        if (err) {
            logger.debug("Got error while fetching appData: ", err);
            callback(err, null);
        }
        logger.debug("Got appData: ", JSON.stringify(anAppData));
        callback(null, anAppData);
    });
};

var AppData = mongoose.model("appData", AppDataSchema);
module.exports = AppData;
