var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var ApiUtils = require('_pr/lib/utils/apiUtil.js');
var schemaValidator = require('_pr/model/dao/schema-validator.js');

var ContainerSchema = new Schema({
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
    Ports: [{
         type: String,
         trim: true
    }],
    Labels:Schema.Types.Mixed,
    Status: {
        type: String,
        required: true,
        trim: true,
    },
    HostConfig:Schema.Types.Mixed

});
ContainerSchema.plugin(mongoosePaginate);

ContainerSchema.statics.getContainerListByOrgBgProjectAndEnvId = function(jsonData, callback) {
    if(jsonData.record_Limit) {
        var databaseReq = {};
        jsonData['searchColumns'] = ['instanceIP', 'state'];
        ApiUtils.databaseUtil(jsonData, function (err, databaseCall) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            }
            else
                databaseReq = databaseCall;
        });
        Container.paginate(databaseReq.queryObj, databaseReq.options, function (err, containerList) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            }
            else if (!containerList) {
                var err = new Error('Container List is not found');
                err.status = 404;
                return callback(err);
            }
            else
                return callback(null, containerList);
        });
    }
    else{
        var queryObj = {
            orgId: jsonData.orgId,
            bgId: jsonData.bgId,
            projectId: jsonData.projectId,
            envId: jsonData.envId
        }
        Container.find(queryObj, {
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


ContainerSchema.statics.createContainer = function(containerData, callback) {
    logger.debug("Enter createContainer");
    var container = new Container(containerData);
    container.save(function(err, data) {
        if (err) {
            logger.error("createContainer Failed", err, containerData);
            return;
        }
        logger.debug("Exit createContainer : ");
        callback(null, data);
    });
};
ContainerSchema.statics.getContainerById = function(containerId, callback) {
    logger.debug("Enter getContainerById");
    Container.find({Id:containerId},function(err, data) {
        if (err) {
            logger.error("createContainer Failed", err, containerData);
            callback(err, null);
            return;
        }
        logger.debug("Exit createContainer : ");
        callback(null, data);
    });
};
ContainerSchema.statics.updateContainer = function(containerData, callback) {
    logger.debug("Enter updateContainer");
    Container.update({
        Id: containerData.Id
    }, {
        $set: {
            Status: containerData.Status
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

var Container = mongoose.model('containers', ContainerSchema);
module.exports = Container;