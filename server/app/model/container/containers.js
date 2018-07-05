var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var schemaValidator = require('_pr/model/dao/schema-validator.js');

var containerSchema = new Schema({
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
    Id:{
        type: String,
        required: true,
        trim: true
    },
    instanceIP:{
        type: String,
        required: true,
        trim: true
    },
    instanceId:{
        type: String,
        trim: true
    },
    Names: [{
        type: String,
        required: true,
        trim: true
    }],
    Image:{
        type: String,
        required: true,
        trim: true
    },
    ImageID: {
        type: String,
        index: true,
        trim: true
    },
    Command: {
        type: String,
        trim: true
    },
    Created: {
        type: Number,
        required: true,
        trim: true
    },
    Ports: [Schema.Types.Mixed],
    Labels:[Schema.Types.Mixed],
    Status: {
        type: String,
        trim: true,
    },
    containerStatus: {
            type: String,
            enum: ["START", "STOP" , "PAUSE","UNPAUSE","RESTART"]
    },
    HostConfig:Schema.Types.Mixed

});
containerSchema.plugin(mongoosePaginate);

containerSchema.statics.getContainerListByOrgBgProjectAndEnvId = function(jsonData, callback) {
    if(jsonData.pagination) {
        container.paginate(jsonData.queryObj, jsonData.options, function (err, containerList) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                callback(err,null);
            }
            callback(null, containerList);
        });
    }
    else{
        var queryObj = {
            orgId: jsonData.orgId,
            bgId: jsonData.bgId,
            projectId: jsonData.projectId,
            envId: jsonData.envId
        }
        container.find(queryObj, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, data);
        });
    }
};


containerSchema.statics.createContainer = function(containerData, callback) {
    logger.debug("Enter createContainer");
    var dockerContainer = new container(containerData);
    dockerContainer.save(function(err, data) {
        if (err) {
            logger.error("createContainer Failed", err, containerData);
            return;
        }
        logger.debug("Exit createContainer : ");
        callback(null, data);
    });
};
containerSchema.statics.getContainerByIdInstanceId = function(containerId,instanceId, callback) {
    logger.debug("Enter getContainerByIdInstanceId");
    container.find({
        Id:containerId,
        instanceId:instanceId
    },function(err, aContainer) {
        if (err) {
            logger.error("getContainerByIdInstanceId Failed", err,containerId,instanceId);
            callback(err, null);
            return;
        }
        logger.debug("Exit getContainerByIdInstanceId : ");
        callback(null, aContainer);
    });
};

containerSchema.statics.getContainerByInstanceId = function(instanceId, callback) {
    logger.debug("Enter getContainerByInstanceId");
    container.find({
        instanceId:instanceId
    },function(err, aContainer) {
        if (err) {
            logger.error("getContainerByInstanceId Failed", err,instanceId);
            callback(err, null);
            return;
        }
        logger.debug("Exit getContainerByInstanceId : ");
        callback(null, aContainer);
    });
};

containerSchema.statics.updateContainerStatus = function(containerId,containerStatus,status,callback) {
    logger.debug("Enter updateContainerStatus");
    container.update({
        Id: containerId
    }, {
        $set: {
            Status: containerStatus,
            containerStatus: status
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to updateContainerStatus (%s, %s)", err);
            callback(err, null);
        }
        logger.debug("Exit updateContainerStatus (%s, %s)");
        callback(null, data);
    });

};
containerSchema.statics.deleteContainerById=function(containerId,callback){
    logger.debug("Enter deleteContainerById (%s)", containerId);
    container.remove({
        Id: containerId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to deleteContainerById (%s)", containerId, err);
            callback(err, null);
            return;
        }
        logger.debug("Exit deleteContainerById (%s)", containerId);
        callback(null, data);
    });
};

containerSchema.statics.deleteContainerByInstanceId=function(instanceId,callback){
    container.remove({
        instanceId: instanceId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to deleteContainerByInstanceId (%s)", instanceId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

containerSchema.statics.deleteContainersByContainerIds=function(instanceId,containerIds,callback){
    container.remove({
        instanceId: instanceId,
        Id:{ $nin: containerIds }
    }, function(err, data) {
        if (err) {
            logger.error("Failed to deleteContainersByContainerIds (%s)", instanceId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

containerSchema.statics.getAllContainers=function(callback){
    logger.debug("Enter getAllContainers");
    container.find({},function(err, containers) {
        if (err) {
            logger.error("getAllContainers Failed", err);
            callback(err, null);
            return;
        }
        logger.debug("Exit getAllContainers : ");
        callback(null, containers);
    });
}

var container = mongoose.model('containers', containerSchema);
module.exports = container;