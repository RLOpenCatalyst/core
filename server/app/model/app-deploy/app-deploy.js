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
var mongoosePaginate = require('mongoose-paginate');

// File which contains App Deploy DB schema and DAO methods. 

var Schema = mongoose.Schema;

var AppDeploySchema = new Schema({
    applicationName: String,
    applicationInstanceName: String,
    applicationVersion: String,
    applicationNodeIP: String,
    applicationLastDeploy: String,
    applicationStatus: String,
    orgId: String,
    bgId: String,
    projectId: String,
    envId: String,
    description: String,
    applicationType: String,
    containerId: String,
    hostName: String,
    appLogs: String

});

AppDeploySchema.plugin(mongoosePaginate);
// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeploy = function(callback) {
    this.find(function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        }
    });
};

// Save all AppDeploy informations.
AppDeploySchema.statics.createNew = function(appDeployData, callback) {
    var aDeploy = new this(appDeployData);
    aDeploy.save(function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while creating AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Creating AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        }
    });
};

// Update all AppDeploy informations.
AppDeploySchema.statics.updateAppDeploy = function(anId, appDeployData, callback) {

    logger.debug("Going to Update AppDeploy data: ", anId);
    var setData = {};
    var keys = Object.keys(appDeployData);
    for (var i = 0; i < keys.length; i++) {
        setData[keys[i]] = appDeployData[keys[i]];
    }
    logger.debug("Whole data: ", JSON.stringify(setData));
    this.update({
        "_id": anId
    }, {
        $set: setData
    }, {
        upsert: false
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while creating AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Updating AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        }
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployById = function(anId, callback) {
    this.find({
        "_id": anId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploy[0]));
            callback(null, appDeploy[0]);
        }
    });
};

// Remove AppDeploy informations.
AppDeploySchema.statics.removeAppDeploy = function(anId, callback) {
    this.remove({
        "_id": anId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while removing AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Remove Success....");
            callback(null, appDeploy);
        }
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployByNameAndEnvId = function(appName, envId, callback) {
    this.find({
        applicationName: appName,
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploys));
            callback(null, appDeploys);
        }
    });
};

// Update all AppDeploy informations w.r.t name.
AppDeploySchema.statics.updateAppDeployByName = function(appName, appDeployData, callback) {

    logger.debug("Going to Update AppDeploy data: ", appName);
    var setData = {};
    var keys = Object.keys(appDeployData);
    for (var i = 0; i < keys.length; i++) {
        setData[keys[i]] = appDeployData[keys[i]];
    }
    logger.debug("Whole data: ", JSON.stringify(setData));
    var that = this;
    this.update({
        applicationName: appName
    }, {
        $set: setData
    }, {
        upsert: false,
        multi: true
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while creating AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            that.find({
                applicationName: appName
            }, function(err, list) {
                if (err) {
                    logger.debug("Failed to fetch appDeploy", err);
                }
                callback(null, list);
            });
        }
    });
};

// Get AppDeploy by name.
AppDeploySchema.statics.getAppDeployByName = function(appName, callback) {
    this.find({
        applicationName: appName
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            callback(null, appDeploy);
        }
    });
};

// Get AppDeploy by name.
AppDeploySchema.statics.getAppDeployLogById = function(appId, callback) {
    this.find({
        "_id": appId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy.length) {
            callback(null, appDeploy[0].appLogs);
        } else {
            callback(null, []);
        }
    });
};

// Get all AppDeploy informations for env.
AppDeploySchema.statics.getAppDeployByEnvId = function(envId, callback) {
    this.find({
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploys));
            callback(null, appDeploys);
        }
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployListByEnvId = function(envId, callback) {
    this.find({
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys.length) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploys));
            callback(null, appDeploys);
        } else {
            callback(null, []);
        }
    });
};

AppDeploySchema.statics.getAppDeployListByEnvIdAndProjectId = function(envId,projectId, callback) {
    this.find({
        envId: envId,
        projectId:projectId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys.length) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploys));
            callback(null, appDeploys);
        } else {
            callback(null, []);
        }
    });
};

// Get all AppDeploy informations by Project.
AppDeploySchema.statics.getAppDeployByProjectId = function(projectId, appName, callback) {
    this.find({
        "applicationName": {
            $in: appName
        },
        "projectId": projectId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        }
    });
};

// Get all AppDeploy informations by AppNameAndVersion.
AppDeploySchema.statics.getAppDeployByAppNameAndVersion = function(appName, version, callback) {
    logger.debug("appName: ", appName);
    logger.debug("version: ", version);
    var that = this;
    that.find({
        "applicationName": appName,
        "applicationVersion": version
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        }
    });
};

// Get all AppDeploy informations. with pagination
AppDeploySchema.statics.getAppDeployWithPage = function(offset, limit, sortBy, searchBy, callback) {
    var query = {};
    var k;
    if (searchBy) {
        for(k in searchBy){
            if(searchBy.hasOwnProperty(k)){
                query[k] = {
                    $in: searchBy[k]
                }
            }
        }
        /*query.applicationName= {
            $regex: new RegExp(searchBy, "i")
        }*/
    };
    var options = {
        sort: {},
        lean: false,
        offset: offset,
        limit: limit
    };
    if (sortBy) {
        var key;
        for(key in sortBy){
            if(sortBy.hasOwnProperty(key)){
                options.sort[key] = sortBy[key]
            }
        }
    }
    logger.debug("options: ", JSON.stringify(options));
    logger.debug("query: ", JSON.stringify(query));
    this.paginate(query, options).then(function(appDeploy) {
        callback(null, appDeploy);
    });
};

var AppDeploy = mongoose.model("appDeploy", AppDeploySchema);
module.exports = AppDeploy;
