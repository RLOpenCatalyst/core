var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var GitHubTempFileSchema = new Schema({
    botName:{
        type: String,
        required: false,
        trim: true
    },
	files: [{
        fileName: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        path: {
            type: String,
            required: true,
            trim: true
        },
        state:{
            type: String,
            required: true,
            trim: true
        }
    } ],
    gitHubId:{
        type: String,
        required: true,
        trim: true
    },
    createdOn:{
        type: Number,
        required: false,
        default:Date.now()
    }
})

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
GitHubTempFileSchema.statics.gitFilesList = function gitFilesList(gitHubId,callback) {
    githubTemp.find({gitHubId:gitHubId},function(err, githubfile) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(githubfile.length > 0){
            return callback(null, githubfile);
        }else{
            return callback(null, []);
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
var githubTemp = mongoose.model('githubTemp', GitHubTempFileSchema);
module.exports = githubTemp;