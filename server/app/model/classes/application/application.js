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
var mongoosePaginate = require('mongoose-paginate');
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var schemaValidator = require('_pr/model/dao/schema-validator');
var utils = require('_pr/lib/utils/utils');

var Build = require('./build/build.js');
var AppInstance = require('./appinstance/appInstance');
var DeployHistory = require('./appinstance/deployHistory');

var Schema = mongoose.Schema;

var ApplicationSchema = new Schema({
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
    name: String,
    iconpath: {
        type: String,
        trim: true
    },
    git: {
        repoUrl: String,
        repoUsername: String,
        repoPassword: String,
    },
    users: [{
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.catalystUsernameValidator
    }],
    buildId: String,
    appInstances: [AppInstance.schema],
    deployHistoryIds: [String]
});
ApplicationSchema.plugin(mongoosePaginate);

// instance method 
ApplicationSchema.methods.build = function(user, baseUrl, callback) {
    logger.debug("Executing build");
    Build.getBuildById(this.buildId, function(err, build) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        build.execute(user, baseUrl, callback);
    });
};

// static methods
ApplicationSchema.methods.getBuild = function(callback) {
    Build.getBuildById(this.buildId, function(err, build) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, build);
    });
};

ApplicationSchema.methods.updateBuildParameters = function(buildParameters, callback) {
    Build.getBuildById(this.buildId, function(err, build) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        build.functionalTestUrl = buildParameters.functionalTestUrl;
        build.performanceTestUrl = buildParameters.performanceTestUrl;
        build.securityTestUrl = buildParameters.securityTestUrl;
        build.nonFunctionalTestUrl = buildParameters.nonFunctionalTestUrl;
        build.unitTestUrl = buildParameters.unitTestUrl;
        build.codeCoverageTestUrl = buildParameters.codeCoverageTestUrl;
        build.codeAnalysisUrl = buildParameters.codeAnalysisUrl;
        build.uiPerformaceUrl = buildParameters.uiPerformaceUrl;
        build.save(function(err, build) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, build);
            }

        });

    });
};

ApplicationSchema.methods.getBuildHistory = function(callback) {
    Build.getBuildById(this.buildId, function(err, build) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        build.getHistory(callback);
    });
};


ApplicationSchema.methods.getLastBuildInfo = function(callback) {
    Build.getBuildById(this.buildId, function(err, build) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        build.getLastBuild(callback);
    });
};


ApplicationSchema.methods.addAppInstance = function(appInstanceData, callback) {
    var self = this;
    var appInstance = new AppInstance(appInstanceData);
    this.appInstances.push(appInstance);
    this.save(function(err, application) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, appInstance);
    });
};

ApplicationSchema.methods.removeAppInstance = function(appInstanceId, callback) {
    var found = false;
    if (!this.appInstances.length) {
        callback({
            message: "AppInstance does not exists"
        }, null);
        return;
    }
    var appInstance;
    for (var i = 0; i < this.appInstances.length; i++) {
        if (appInstanceId == this.appInstances[i]._id) {
            appInstance = this.appInstances[i];
            this.appInstances.splice(i, 1);
            found = true;
            break;
        }
    }
    if (!found) {
        callback({
            message: "AppInstance does not exists"
        }, null);
        return;
    }
    this.save(function(err, application) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, appInstance);
    });
};

ApplicationSchema.methods.getAppInstance = function(appInstanceId) {
    var appInstances = this.appInstances;
    if (!appInstances.length) {
        return null;
    }
    var appInstance = null;
    for (var i = 0; i < appInstances.length; i++) {
        if (appInstanceId == appInstances[i]._id) {
            appInstance = appInstances[i];
            break;
        }
    }

    return appInstance;
};

ApplicationSchema.methods.deploy = function(appInstanceId, workflowId, username, baseUrl, callback) {
    var self = this;
    var appInstances = this.appInstances;
    if (!appInstances.length) {
        callback({
            message: "AppInstance does not exist"
        }, null);
        return;
    }
    var appInstance = null;
    for (var i = 0; i < appInstances.length; i++) {
        if (appInstanceId == appInstances[i]._id) {
            appInstance = appInstances[i];
            break;
        }
    }
    if (appInstance) {
        var timestampStarted = new Date().getTime();
        var deployHistory = null;
        appInstance.executeWorkflow(workflowId, username, baseUrl, function(err, tasks) {
            if (err) {
                callback(err, null);
                return;
            }
            DeployHistory.createNew({
                applicationId: self._id,
                appInstanceId: appInstanceId,
                workflowId: workflowId,
                user: username,
                status: DeployHistory.DEPLOY_STATUS.RUNNING,
                timestampStarted: timestampStarted,
            }, function(err, history) {
                if (err) {
                    logger.error("unable to save build history", err);
                    return;
                }
                deployHistory = history;
                self.deployHistoryIds.push(history._id);
                self.save();
            });
            callback(null, tasks);
        }, function(err, status) {
            logger.debug('Deploy Completed');
            if (deployHistory) {
                deployHistory.timestampEnded = new Date().getTime();
                if (status === 0) {
                    deployHistory.status = DeployHistory.DEPLOY_STATUS.SUCCESS;
                } else {
                    deployHistory.status = DeployHistory.DEPLOY_STATUS.FAILED;
                }
                deployHistory.save();
            }
        });
    } else {
        callback({
            message: "AppInstance does not exist"
        }, null);
    }

};

ApplicationSchema.methods.getLastDeploy = function(callback) {
    if (this.deployHistoryIds && this.deployHistoryIds.length) {
        DeployHistory.getHistoryById(this.deployHistoryIds[this.deployHistoryIds.length - 1], function(err, history) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, history);
        });
    } else {
        callback(null, null);
    }
};

ApplicationSchema.methods.getDeployHistory = function(callback) {
    DeployHistory.getHistoryByApplicationId(this._id, function(err, histories) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, histories);
    });
};

ApplicationSchema.methods.getDeployHistoryById = function(id, callback) {
    DeployHistory.getHistoryById(id, function(err, history) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, history);
    });
};


ApplicationSchema.methods.getNodes = function(callback) {
    var self = this;
    var nodesList = [];
    count = 0;
    if (!this.appInstances.length) {
        callback(null, nodesList);
        return;
    }

    function getAppInstanceNodes(appInstance) {
        appInstance.getNodes(function(err, nodes) {
            count++;
            if (err) {
                callback(err, null);
                return;
            }
            nodesList = utils.arrayMerge(nodesList, nodes);
            if (count < self.appInstances.length) {
                getAppInstanceNodes(self.appInstances[count]);
            } else {
                callback(null, nodesList);
            }
        });
    }
    getAppInstanceNodes(this.appInstances[count]);
};


// static methods
ApplicationSchema.statics.getApplicationById = function(applicationId, callback) {
    this.find({
        "_id": new ObjectId(applicationId)
    }, function(err, applications) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (applications.length) {
            var application = applications[0];
            callback(null, application);
        } else {
            callback(null, null);
        }

    });
};


ApplicationSchema.statics.createNew = function(appData, callback) {
    logger.debug("Enter create new application");
    var self = this;
    var build = new Build(appData.build);
    logger.debug('saving build==>');
    build.save(function(err, data) {
        if (err) {
            logger.error("create Application Failed", err, appData);
            callback(err, null);
            return;
        }
        logger.debug('build saved ==>');
        logger.debug(data);
        appData.buildId = data._id;
        var application = new self(appData);

        application.save(function(err, data) {
            if (err) {
                logger.error("create Application Failed", err, appData);
                callback(err, null);
                return;
            }
            logger.debug("Exit createNew application");
            callback(null, data);
        });
    });
};

ApplicationSchema.statics.getAppCardsByOrgBgAndProjectId = function(jsonData, callback) {
    Application.paginate(jsonData.queryObj, jsonData.options, function(err, applications) {
        if(err){
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        }
        return callback(null, applications);
    });
};

ApplicationSchema.statics.getBuildsByTaskId = function(taskId, callback) {
    Build.getBuildsByTaskId(taskId, function(err, builds) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, builds);

    });
};

var Application = mongoose.model('application', ApplicationSchema);

module.exports = Application;
