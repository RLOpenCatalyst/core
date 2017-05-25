var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var GitHubTempFileSchema = new Schema({
    id:{
        type: String,
        trim: true,
        required: false
    },
    name: {
        type: String,
        trim: true,
        required: false
    },
    type: {
        type: String,
        trim: true,
        required: false
    },
    category: {
        type: String,
        trim: true,
        required: false
    },
    executionCount:{
        type:Number,
        required:false,
        default:0
    },
    status:{
        type: String,
        trim: true,
        required: false
    },
    isScheduled:{
        type: Boolean,
        required: false,
        default:false
    },
    gitHubId:{
        type: String,
        trim: true,
        required: false
    },
})
GitHubTempFileSchema.plugin(mongoosePaginate);
GitHubTempFileSchema.statics.gitFilesInsert = function gitFilesInsert(tempOject, callback) {
    githubTemp.create(tempOject, function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};
GitHubTempFileSchema.statics.gitFilesList = function gitFilesList(params,callback) {
    githubTemp.paginate(params.queryObj, params.options,function(err, githubfile) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else{
            return callback(null, githubfile);
        }
    });
};
GitHubTempFileSchema.statics.gitFilesdelete = function gitFilesdelete(gitHubId,callback) {
    githubTemp.remove({gitHubId:gitHubId}, function(err){
        if (err) {
            logger.error(err);
            return callback(err);
        }else 
            return callback(null);
    });
}
GitHubTempFileSchema.statics.getAllBots = function (gitHubId,callback) {
    githubTemp.find({"gitHubId":gitHubId}, {"_id":0,"id":1,"type":1,"status":1},function(err, botsList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else{
            return callback(null, botsList);
        }
    });
};
var githubTemp = mongoose.model('githubTemp', GitHubTempFileSchema);
module.exports = githubTemp;