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
    state: {
        type: String,
        required: true,
        trim: true,
    },
    created: {
        type: Number,
        required: true,
        trim: true
    },
    names: [{
        type: String,
        required: true,
        trim: true
    }],
    instanceIP: {
        type: String,
        index: true,
        trim: true
    },
    containerID:{
        type: Number,
        required: true,
        trim: true
    },
    image:{
        type: String,
        required: true,
        trim: true
    },
    info: {
        type: String,
        trim: true
    }
});
ContainerSchema.plugin(mongoosePaginate);

ContainerSchema.statics.getContainerListByOrgBgProjectAndEnvId = function(jsonData, callback) {
    var databaseReq={};
    jsonData['searchColumns']=['instanceIP','state'];
    ApiUtils.databaseUtil(jsonData,function(err,databaseCall){
        if(err){
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        }
        else
          databaseReq=databaseCall;
    });
    this.paginate(databaseReq.queryObj, databaseReq.options, function(err, containerList) {
        if(err){
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        }
        else if(!containerList) {
            var err = new Error('Container List is not found');
            err.status = 404;
            return callback(err);
        }
        else
            return callback(null, containerList);
    });
};

var Container = mongoose.model('containers', ContainerSchema);
module.exports = Container;