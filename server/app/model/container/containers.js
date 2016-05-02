var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var schemaValidator = require('_pr/model/dao/schema-validator.js');
var ObjectId = require('mongoose').Types.ObjectId;

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
        required: true,
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
    Labels:Schema.Types.Mixed,
    Status: {
        type: String,
        required: true,
        trim: true,
    },
    HostConfig:Schema.Types.Mixed

});
containerSchema.plugin(mongoosePaginate);

containerSchema.statics.getContainerListByOrgBgProjectAndEnvId = function(jsonData, callback) {
    if(jsonData.pageSize) {
        jsonData['searchColumns'] = ['instanceIP', 'state'];
        apiUtil.databaseUtil(jsonData, function (err, databaseCall) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            }
            else {
                container.paginate(databaseCall.queryObj, databaseCall.options, function (err, containerList) {
                    if (err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    }
                    else if (containerList.length === 0) {
                        var err = new Error('Container List is not found');
                        err.status = 404;
                        return callback(err);
                    }
                    else {
                        return callback(null, containerList);
                    }
                });
            }
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
containerSchema.statics.getContainerByIdInstanceIP = function(containerId,instanceId, callback) {
    logger.debug("Enter getContainerByIdInstanceIP");
    container.find({
        Id:containerId,
        instanceId:instanceId
    },function(err, aContainer) {
        if (err) {
            logger.error("getContainerByIdInstanceIP Failed", err, containerData);
            callback(err, null);
            return;
        }
        logger.debug("Exit getContainerByIdInstanceIP : ");
        callback(null, aContainer);
    });
};
containerSchema.statics.updateContainer = function(containerId,containerStatus, callback) {
    logger.debug("Enter updateContainer");
    container.update({
        Id: containerId
    }, {
        $set: {
            Status: containerStatus
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to updateContainer (%s, %s)", err);
            return;
        }
        logger.debug("Exit updateContainer (%s, %s)");
        callback(null, data);
    });

};
containerSchema.statics.deleteContainerById=function(containerId,callback){
    logger.debug("Enter removeContainerById (%s)", containerId);
    container.remove({
        Id: containerId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to removeContainerById (%s)", containerId, err);
            callback(err, null);
            return;
        }
        logger.debug("Exit removeContainerById (%s)", containerId);
        callback(null, data);
    });
}

var container = mongoose.model('containers', containerSchema);
module.exports = container;