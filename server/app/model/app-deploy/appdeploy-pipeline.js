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
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var schemaValidator = require('_pr/model/utils/schema-validator');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

// File which contains App Deploy Pipeline DB schema and DAO methods.

var Schema = mongoose.Schema;

var AppDeployPipelineSchema = new Schema({
    orgId: String,
    bgId: String,
    projectId: String,
    envId: [String],
    envSequence: [String],
    loggedInUser: String,
    isEnabled: Boolean
});
AppDeployPipelineSchema.plugin(mongoosePaginate);

// Save all appData informations.
AppDeployPipelineSchema.statics.createNew = function(appDeployPipelineData, callback) {
    var aDeploy = new this(appDeployPipelineData);
    this.find({
        projectId: appDeployPipelineData.projectId
    }, function(err, data) {
        if (err) {
            logger.debug("Error fetching record.", err);
        } else {
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
        }
    });
};
// Get all AppDeploy informations.
AppDeployPipelineSchema.statics.getAppDeployPipeline = function(projectId, callback) {
    this.find({
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

// Get all AppDeploy informations.
AppDeployPipelineSchema.statics.getAppDeployPipelineList = function(jsonData, callback) {
    var databaseReq={};
    jsonData['searchColumns']=['projectId'];
    apiUtil.databaseUtil(jsonData,function(err,databaseCall){
        if(err){
            process.nextTick(function() {
                callback(null, []);
            });
            return;
        }
        databaseReq=databaseCall;
    });
    this.paginate(databaseReq.queryObj, databaseReq.options, function(err, appDeploy) {
        if (err) {
            logger.error("Failed getAppDeployPipelineList (%s)", err);
            callback(err, null);
            return;
        }
        callback(null, appDeploy);
    });

};
//Update AppDeploy Configure
AppDeployPipelineSchema.statics.updateConfigurePipeline = function(projectId, appDeployPipelineUpdateData, callback) {

    this.update({
        "projectId": projectId
    }, {
        $set: appDeployPipelineUpdateData
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

var AppDataPipeline = mongoose.model("appDataPipeline", AppDeployPipelineSchema);
module.exports = AppDataPipeline;