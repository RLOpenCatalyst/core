var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var ApiUtils = require('_pr/lib/utils/apiUtil.js');

var ContainerSchema = new Schema({
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

ContainerSchema.statics.getContainerListByInstanceId = function(jsonData, callback) {
    var databaseReq={};
    jsonData['searchColumns']=['instanceIP','state'];
    ApiUtils.databaseUtil(jsonData,function(err,databaseCall){
        if(err){
            process.nextTick(function() {
                callback(null, []);
            });
            return;
        }
        databaseReq=databaseCall;
    });
    this.paginate(databaseReq.queryObj, databaseReq.options, function(err, instances) {
        if (err) {
            logger.error("Failed getByOrgProviderId (%s)", err);
            callback(err, null);
            return;
        }
        callback(null, instances);
    });
};

var Container = mongoose.model('containers', ContainerSchema);
module.exports = Container;