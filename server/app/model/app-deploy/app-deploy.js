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
var mongoosePaginate = require('mongoose-paginate');

// File which contains App Deploy DB schema and DAO methods. 

var Schema = mongoose.Schema;

var AppDeploySchema = new Schema({
    applicationName: {
        type: String,
        required: true,
        trim: true
    },
    applicationInstanceName: {
        type: String,
        required: true,
        trim: true
    },
    applicationVersion: {
        type: String,
        required: true,
        trim: true
    },
    applicationNodeIP: {
        type: String,
        required: true,
        trim: true
    },
    applicationLastDeploy: {
        type: Number,
        required: true,
        trim: true
    },
    applicationStatus: {
        type: String,
        required: true,
        trim: true
    },
    orgId: {
        type: String,
        trim: true
    },
    bgId: {
        type: String,
        trim: true
    },
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
    description: {
        type: String,
        trim: true
    },
    applicationType: {
        type: String,
        required: true,
        trim: true
    },
    containerId: {
        type: String,
        trim: true
    },
    hostName: {
        type: String,
        required: true,
        trim: true
    },
    appLogs: {
        type: String,
        trim: true
    }

});

AppDeploySchema.plugin(mongoosePaginate);
// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeploy = function getAppDeploy(callback) {
    this.find(function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ");
            callback(null, appDeploy);
        } else
            callback(null, []);
    });
};

AppDeploySchema.statics.getDistinctAppDeployVersionByProjectId = function getDistinctAppDeployVersionByProjectId(jsonData, callback) {
    this.aggregate(
        [{
            $match: {
                projectId: jsonData.projectId,
                applicationName: jsonData.appName
            }
        }, {
            $group: {
                _id: "$applicationVersion",
            }
        }],
        function(err, appDeployVersions) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            }
            callback(null, appDeployVersions);
        });
};

AppDeploySchema.statics.getDistinctAppDeployAppNameVersionByProjectId = function getDistinctAppDeployAppNameVersionByProjectId(jsonData, callback) {
    var responseList = [];
    this.aggregate(
        [
            { $match: { projectId: jsonData.projectId } },
            { $group: { "_id": { name: "$applicationName", version: "$applicationVersion" } } }
        ],function(err,appNameVersion) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else {
                AppDeploy.aggregate(
                    [
                        {$match: {projectId: jsonData.projectId}},
                        {$group: {"_id": {name: "$applicationName", version: "$applicationVersion"}}},
                        {$skip: (jsonData.page - 1) * jsonData.pageSize},
                        {$limit: jsonData.pageSize}
                    ],
                    function (err, appDeployData) {
                        if (err) {
                            var err = new Error('Internal server error');
                            err.status = 500;
                            return callback(err);
                        }
                        for (var i = 0; i < appDeployData.length; i++) {
                            responseList.push(appDeployData[i]._id);
                        }
                        var results = {
                            data: responseList,
                            totalRecords: appNameVersion.length
                        }
                        callback(null, results);
                    });
            }
        })
};

AppDeploySchema.statics.getDistinctAppDeployApplicationNameByProjectId = function getDistinctAppDeployApplicationNameByProjectId(jsonData, callback) {
    var responseList = [];
    this.aggregate(
        [
            { $match: { projectId: jsonData.projectId } },
            { $group: { "_id": { name: "$applicationName"} } }
        ],function(err,distinctAppNames) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else {
                AppDeploy.aggregate(
                    [
                        {$match: {projectId: jsonData.projectId}},
                        {$group: {"_id": {name: "$applicationName"}}},
                        {$skip: (jsonData.page - 1) * jsonData.pageSize},
                        {$limit: jsonData.pageSize}
                    ],
                    function (err, appDeployData) {
                        if (err) {
                            var err = new Error('Internal server error');
                            err.status = 500;
                            return callback(err);
                        }
                        for (var i = 0; i < appDeployData.length; i++) {
                            responseList.push(appDeployData[i]._id);
                        }
                        var results = {
                            data: responseList,
                            totalRecords: distinctAppNames.length
                        }
                        callback(null, results);
                    });
            }
        })
};




AppDeploySchema.statics.getAppDeployHistoryListByProjectId = function getAppDeployHistoryListByProjectId(queryObj, options, callback) {
    AppDeploy.paginate(queryObj, options, function(err, appDeployHistoryData) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        }
        callback(null, appDeployHistoryData);

    });
};

AppDeploySchema.statics.getLatestAppDeployListByProjectIdAppNameVersionId = function getLatestAppDeployListByProjectIdAppNameVersionId(projectId, appNameVersion, callback) {
    this.aggregate(
        [{
            $match: {
                projectId: projectId,
                applicationVersion: appNameVersion.version,
                applicationName: appNameVersion.name
            }
        }, {
            $sort: {
                envId: 1,
                applicationLastDeploy: 1
            }
        }, {
            $group: {
                _id: "$envId",
                id: { $last: "$_id" },
                applicationName: { $last: "$applicationName" },
                applicationInstanceName: { $last: "$applicationInstanceName" },
                applicationVersion: { $last: "$applicationVersion" },
                applicationNodeIP: { $last: "$applicationNodeIP" },
                applicationStatus: { $last: "$applicationStatus" },
                orgId: { $last: "$orgId" },
                bgId: { $last: "$bgId" },
                projectId: { $last: "$projectId" },
                envName: { $last: "$envId" },
                applicationType: { $last: "$applicationType" },
                containerId: { $last: "$containerId" },
                hostName: { $last: "$hostName" },
                appLogs: { $last: "$appLogs" },
                lastAppDeployDate: { $last: "$applicationLastDeploy" }
            }
        }],
        function(err, appDeploys) {
            if (err) {
                logger.debug("Got error while fetching AppDeploy: ", err);
                callback(err, null);
            }
            var count = 0;
            if (appDeploys.length > 0) {
                var deployPermission = require('_pr/model/app-deploy/deploy-permission');
                for (var i = 0; i < appDeploys.length; i++) {
                    (function(appDeploy) {
                        deployPermission.getDeployPermissionByProjectIdEnvNameAppNameVersion(projectId, appDeploy.envName, appNameVersion.name, appNameVersion.version, function(err, permission) {
                            if (err) {
                                logger.debug("Got error while fetching Deploy Permission: ", err);
                                callback(err, null);
                            } else {
                                if (permission.length === 0) {
                                    count++;
                                    appDeploy['isApproved'] = false;
                                } else {
                                    count++;
                                    appDeploy['isApproved'] = permission[0].isApproved;
                                }
                                if (appDeploys.length === count) {
                                    callback(null, appDeploys);
                                    return;
                                }
                            }

                        })
                    })(appDeploys[i]);
                }
            }
        });
};

AppDeploySchema.statics.getPipeLineViewListByProjectIdAppName = function getPipeLineViewListByProjectIdAppName(projectId, appName, callback) {
    this.aggregate(
        [{
            $match: {
                projectId: projectId,
                applicationName: appName
            }
        }, {
            $sort: {
                envId: 1,
                applicationLastDeploy: 1
            }
        }, {
            $group: {
                _id: "$envId",
                id: { $last: "$_id" },
                applicationName: { $last: "$applicationName" },
                applicationInstanceName: { $last: "$applicationInstanceName" },
                applicationVersion: { $last: "$applicationVersion" },
                applicationNodeIP: { $last: "$applicationNodeIP" },
                applicationStatus: { $last: "$applicationStatus" },
                envName: { $last: "$envId" },
                applicationType: { $last: "$applicationType" },
                containerId: { $last: "$containerId" },
                hostName: { $last: "$hostName" },
                lastAppDeployDate: { $last: "$applicationLastDeploy" }
            }
        }],
        function(err, appDeploys) {
            if (err) {
                logger.debug("Got error while fetching PipeLine View: ", err);
                callback(err, null);
            };
            var count = 0;
            if (appDeploys.length > 0) {
                var deployPermission = require('_pr/model/app-deploy/deploy-permission');
                for (var i = 0; i < appDeploys.length; i++) {
                    (function(appDeploy) {
                        deployPermission.getDeployPermissionByProjectIdEnvNameAppNameVersion(projectId, appDeploy.envName, appName, appDeploy.applicationVersion, function(err, permission) {
                            if (err) {
                                logger.debug("Got error while fetching Deploy Permission: ", err);
                                callback(err, null);
                            } else {
                                if (permission.length === 0) {
                                    count++;
                                    appDeploy['isApproved'] = false;
                                } else {
                                    count++;
                                    appDeploy['isApproved'] = permission[0].isApproved;
                                }
                                if (appDeploys.length === count) {
                                    callback(null, appDeploys);
                                    return;
                                }
                            }

                        })
                    })(appDeploys[i]);
                }
            }
        });
};

AppDeploySchema.statics.getAppDeployHistoryListByProjectIdEnvNameAppNameVersion = function getAppDeployHistoryListByProjectIdEnvNameAppNameVersion(projectId, envName, appName, version, callback) {
    this.aggregate(
        [{
            $match: {
                projectId: projectId,
                envId: envName,
                applicationName: appName,
                applicationVersion: version
            }
        }, {
            $sort: {
                applicationLastDeploy: 1
            }
        }, {
            $project: {
                _id: 1,
                applicationName: 1,
                applicationInstanceName: 1,
                applicationVersion: 1,
                applicationNodeIP: 1,
                applicationStatus: 1,
                applicationType: 1,
                containerId: 1,
                lastAppDeployDate: 1,
                applicationLastDeploy:1,
                hostName: 1
            }
        }],
        function(err, appDeployHistoryList) {
            if (err) {
                logger.debug("Got error while fetching AppDeploy History: ", err);
                callback(err, null);
            }
            callback(null, appDeployHistoryList);
        });
}

// Save all AppDeploy informations.
AppDeploySchema.statics.createNew = function createNew(appDeployData, callback) {
    appDeployData['applicationLastDeploy'] = Date.parse(appDeployData['applicationLastDeploy']);
    var aDeploy = new this(appDeployData);
    aDeploy.save(function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while creating AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Creating AppDeploy: ", JSON.stringify(appDeploy));
            callback(null, appDeploy);
        } else
            callback(null, []);
    });
};

// Update all AppDeploy informations.
AppDeploySchema.statics.updateAppDeploy = function updateAppDeploy(anId, appDeployData, callback) {

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
        } else
            callback(null, []);
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployById = function getAppDeployById(anId, callback) {
    this.find({
        "_id": anId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ");
            callback(null, appDeploy[0]);
        } else
            callback(null, []);
    });
};

// Remove AppDeploy informations.
AppDeploySchema.statics.removeAppDeploy = function removeAppDeploy(anId, callback) {
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
        } else
            callback(null, []);
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployByNameAndEnvId = function getAppDeployByNameAndEnvId(appName, envId, callback) {
    this.find({
        applicationName: appName,
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys) {
            logger.debug("Got AppDeploy: ");
            callback(null, appDeploys);
        } else
            callback(null, []);
    });
};

// Update all AppDeploy informations w.r.t name.
AppDeploySchema.statics.updateAppDeployByName = function updateAppDeployByName(appName, appDeployData, callback) {

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
AppDeploySchema.statics.getAppDeployByName = function getAppDeployByName(appName, callback) {
    this.find({
        applicationName: appName
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploy) {
            callback(null, appDeploy);
        } else
            callback(null, []);
    });
};

// Get AppDeploy by name.
AppDeploySchema.statics.getAppDeployLogById = function getAppDeployLogById(appId, callback) {
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
AppDeploySchema.statics.getAppDeployByEnvId = function getAppDeployByEnvId(envId, callback) {
    this.find({
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys) {
            logger.debug("Got AppDeploy: ");
            callback(null, appDeploys);
        } else
            callback(null, []);
    });
};

// Get all AppDeploy informations.
AppDeploySchema.statics.getAppDeployListByEnvId = function getAppDeployListByEnvId(projectId, envId, callback) {
    this.find({
        projectId: projectId,
        envId: envId
    }, function(err, appDeploys) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            callback(err, null);
        }
        if (appDeploys.length) {
            logger.debug("Got AppDeploy: ");
            callback(null, appDeploys);
        } else {
            callback(null, []);
        }
    });
};

// Get all AppDeploy informations by Project.
AppDeploySchema.statics.getAppDeployByProjectId = function getAppDeployByProjectId(projectId, callback) {
    this.find({
        "projectId": projectId
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            return callback(err, null);
        }
        logger.debug("Got AppDeploy: ");
        return callback(null, appDeploy);
    });
};

// Get all AppDeploy informations by AppNameAndVersion.
AppDeploySchema.statics.getAppDeployByAppNameAndVersion = function getAppDeployByAppNameAndVersion(projectId, appName, version, callback) {
    logger.debug("appName: ", appName);
    logger.debug("version: ", version);
    var that = this;
    that.find({
        "projectId": projectId,
        "applicationName": appName,
        "applicationVersion": version
    }, function(err, appDeploy) {
        if (err) {
            logger.debug("Got error while fetching AppDeploy: ", err);
            return callback(err, null);
        }
        if (appDeploy) {
            logger.debug("Got AppDeploy: ");
            return callback(null, appDeploy);
        } else
            return callback(null, []);
    });
};

// Get all AppDeploy informations. with pagination
AppDeploySchema.statics.getAppDeployWithPage = function getAppDeployWithPage(offset, limit, sortBy, searchBy, callback) {
    var query = {};
    var k;
    if (searchBy) {
        for (k in searchBy) {
            if (searchBy.hasOwnProperty(k)) {
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
        for (key in sortBy) {
            if (sortBy.hasOwnProperty(key)) {
                options.sort[key] = sortBy[key]
            }
        }
    }
    logger.debug("options: ", JSON.stringify(options));
    logger.debug("query: ", JSON.stringify(query));
    AppDeploy.paginate(query, options).then(function(appDeploy) {
        callback(null, appDeploy);
    });
};

// Get AppData by project,env,app.
AppDeploySchema.statics.getAppDeployByProjectAndEnv = function getAppDeployByProjectAndEnv(projectId, envId, appName, version, callback) {
    this.find({
        projectId: projectId,
        envId: envId,
        applicationName: appName,
        applicationVersion: version
    }, function(err, appData) {
        if (err) {
            logger.debug("Got error while fetching appData: ", err);
            callback(err, null);
        }
        logger.debug("Got appData: ", JSON.stringify(appData));
        callback(null, appData);
    });
};

var AppDeploy = mongoose.model("appDeploy", AppDeploySchema);
module.exports = AppDeploy;
