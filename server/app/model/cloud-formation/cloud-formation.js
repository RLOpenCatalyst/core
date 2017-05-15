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
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/utils/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');
var ChefInfraManager = require('./chef-infra-manager/chef-infra-manager');
var ApiUtils = require('_pr/lib/utils/apiUtil.js');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema;

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};

var CloudFormationSchema = new Schema({
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
    envId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.envIdValidator
    },
    stackParameters: [{
        _id: false,
        ParameterKey: {
            type: String,
            trim: true
        },
        ParameterValue: {
            type: String,
            trim: true
        }
    }],
    templateFile: String,
    cloudProviderId: String,
    infraManagerId: String,
    infraManagerData: Schema.Types.Mixed,
    infraManagerType: String,
    stackName: String,
    stackId: String,
    status: String,
    users: [String],
    region: String,
    instanceUsername: String,
    autoScaleTopicArn: String,
    autoScaleResourceIds: [String],
    autoScaleUsername: String,
    autoScaleRunlist: [String],
    isDeleted:{
        type: Boolean,
        default: false,
        required:false
    }
});

CloudFormationSchema.plugin(mongoosePaginate);


function getInfraManagerConfigType(cf) {
    var InfraManagerConfig;
    if (blueprint.infraMangerType === INFRA_MANAGER_TYPE.CHEF) {
        InfraManagerConfig = ChefInfraManager;
    } else if (blueprint.infraMangerType === INFRA_MANAGER_TYPE.PUPPET) {
        return null;
    } else {
        return null;
    }
    var infraManagerConfig = new InfraManagerConfig(cf.infraManagerData);
    return infraManagerConfig;
}

// instance method :-  

CloudFormationSchema.methods.execute = function(userName, baseUrl, callback, onComplete) {

};

// Get Nodes list
CloudFormationSchema.methods.getChefTaskNodes = function() {};

CloudFormationSchema.methods.getHistory = function(callback) {

};

// Static methods :- 

// creates a new task
CloudFormationSchema.statics.createNew = function(cfData, callback) {
    var infraManager;
    var infraManagerType;
    if (cfData.infraManagerType === INFRA_MANAGER_TYPE.CHEF) {
        infraManagerType = INFRA_MANAGER_TYPE.CHEF;
        infraManager = ChefInfraManager.createNew({
            runlist: cfData.runlist
        });

    } else if (cfData.infraManagerType === INFRA_MANAGER_TYPE.PUPPET) {
        infraManagerType = INFRA_MANAGER_TYPE.PUPPET;
        return null;
    }

    var cfObj = {
        orgId: cfData.orgId,
        bgId: cfData.bgId,
        projectId: cfData.projectId,
        envId: cfData.envId,
        stackName: cfData.stackName,
        stackId: cfData.stackId,
        status: cfData.status,
        users: cfData.users,
        templateFile: cfData.templateFile,
        cloudProviderId: cfData.cloudProviderId,
        infraManagerId: cfData.infraManagerId,
        infraManagerType: infraManagerType,
        stackParameters: cfData.stackParameters,
        region: cfData.region,
        instanceUsername: cfData.instanceUsername,
        autoScaleTopicArn: cfData.autoScaleTopicArn,
        autoScaleUsername: cfData.autoScaleUsername,
        autoScaleRunlist: cfData.autoScaleRunlist
    };

    var that = this;
    var cf = new that(cfObj);

    cf.save(function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};


CloudFormationSchema.statics.findByOrgBgProjectAndEnvId = function(jsonData, callback) {
    jsonData.queryObj.isDeleted = false;
    if(jsonData.pagination) {
        CloudFormation.paginate(jsonData.queryObj, jsonData.options, function (err, cftData) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err,null);
            }
            return callback(null, cftData);

        });
    }
    else{
        var queryObj = {
            orgId: jsonData.orgId,
            bgId: jsonData.bgId,
            projectId: jsonData.projectId,
            envId: jsonData.envId,
            isDeleted:false
        }

        this.find(queryObj, function(err, data) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
            callback(null, data);
        });
    }
};

// get task by id
CloudFormationSchema.statics.getById = function(cfId, callback) {
    this.find({
        "_id": new ObjectId(cfId)
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (data.length) {
            callback(null, data[0]);
        } else {
            callback(null, null);
        }

    });
};

// get task by ids
CloudFormationSchema.statics.findByIds = function(cfIds, callback) {
    if (!(cfIds && cfIds.length)) {
        callback(null, []);
        return;
    }
    var queryObj = {};
    queryObj._id = {
        $in: cfIds
    }
    this.find(queryObj, function(err, cfs) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, cfs);
    });
};

CloudFormationSchema.statics.getCloudFormationList = function(queryObj, callback) {
    this.find(queryObj, function(err, cfs) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }else{
            callback(null, cfs);
            return;
        }
    });
};
// remove task by id
CloudFormationSchema.statics.removeById = function(cfId, callback) {
    this.remove({
        "_id": new ObjectId(cfId)
    }, function(err, deleteCount) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, deleteCount);

    });
};

CloudFormationSchema.statics.removeCloudFormationById = function(cfId, callback) {
    this.update({
        "_id": new ObjectId(cfId)
    },{$set:{isDeleted:true}}, function(err, softDeleteCount) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, softDeleteCount);
        return;
    });
};

//Get by autoscale Id CloudFormation
CloudFormationSchema.statics.findByAutoScaleTopicArn = function(topicArn, callback) {
    if (!topicArn) {
        process.nextTick(function() {
            callback(new Error("Invalid topicArn"));
        });
        return;
    }
    this.find({
        "autoScaleTopicArn": topicArn
    }, function(err, cloudFormations) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, cloudFormations);

    });
};

CloudFormationSchema.statics.findByAutoScaleResourceId = function(resourceId, callback) {
    if (!resourceId) {
        process.nextTick(function() {
            callback(new Error("Invalid resourceId"));
        });
        return;
    }
    this.find({
        "autoScaleResourceIds": {
            '$in': [resourceId]
        }
    }, function(err, cloudFormations) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, cloudFormations);

    });
};


var CloudFormation = mongoose.model('cloudFormation', CloudFormationSchema);

module.exports = CloudFormation;
