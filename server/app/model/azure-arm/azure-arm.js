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
var mongoosePaginate = require('mongoose-paginate');

var ChefInfraManager = require('./chef-infra-manager/chef-infra-manager');


var Schema = mongoose.Schema;


var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};

var ARMSchema = new Schema({
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
    parameters: [{
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
    deploymentName: String,
    deploymentId: String,
    status: String,
    users: [String],
    resourceGroup: String,
    isDeleted:{
        type: Boolean,
        required: false,
        default:false
    }
});
ARMSchema.plugin(mongoosePaginate);


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

ARMSchema.methods.execute = function(userName, baseUrl, callback, onComplete) {

};

// Get Nodes list
ARMSchema.methods.getChefTaskNodes = function() {};

ARMSchema.methods.getHistory = function(callback) {

};





// Static methods :- 

// creates a new task
ARMSchema.statics.createNew = function(cfData, callback) {
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
        deploymentName: cfData.deploymentName,
        stackId: cfData.stackId,
        status: cfData.status,
        users: cfData.users,
        templateFile: cfData.templateFile,
        cloudProviderId: cfData.cloudProviderId,
        infraManagerId: cfData.infraManagerId,
        //infraManagerData: infraManager,
        infraManagerType: infraManagerType,
        parameters: cfData.parameters,
        resourceGroup: cfData.resourceGroup,
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



ARMSchema.statics.findByOrgBgProjectAndEnvId = function(jsonData, callback) {
    if(jsonData.pagination) {
        jsonData.queryObj.isDeleted = false
        azureARM.paginate(jsonData.queryObj, jsonData.options, function (err, azureArms) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err,null);
            }
            return callback(null, azureArms);
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
ARMSchema.statics.getById = function(cfId, callback) {
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
ARMSchema.statics.findByIds = function(cfIds, callback) {
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


// remove task by id
ARMSchema.statics.removeById = function(armId, callback) {
    this.remove({
        "_id": new ObjectId(armId)
    }, function(err, deleteCount) {
        if (err) {
            callback(err, null);
            return;
        }
        
        callback(null, deleteCount);

    });
};

ARMSchema.statics.removeArmAzureById = function(armId, callback) {
    this.update({
        "_id": new ObjectId(armId)
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

ARMSchema.statics.findByAutoScaleTopicArn = function(topicArn, callback) {
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

ARMSchema.statics.getAzureArmList = function(queryObj, callback) {
    this.find(queryObj, function(err, arm) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }else{
            callback(null, arm);
            return;
        }
    });
};

ARMSchema.statics.findByAutoScaleResourceId = function(resourceId, callback) {
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




var azureARM = mongoose.model('azureARM', ARMSchema);

module.exports = azureARM;