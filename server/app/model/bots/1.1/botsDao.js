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

var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var ObjectId = require('mongoose').Types.ObjectId;
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var BotsSchema = new Schema ({
    name: {
        type: String,
        trim: true,
        required: true

    },
    id: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    gitHubId: {
        type: String,
        trim: true,
        required: false
    },
    gitHubRepoName: {
        type: String,
        trim: true,
        required: false
    },
    gitHubRepoBranch: {
        type: String,
        trim: true,
        required: false
    },
    type: {
        type: String,
        trim: true,
        required: true
    },
    subType: {
        type: String,
        trim: true,
        required: false
    },
    category: {
        type: String,
        trim: true,
        required: true
    },
    action: {
        type: String,
        trim: true
    },
    env: {
        type: String,
        trim: true
    },
    savedTime: {
        hours:{
            type: Number,
            default:0
        },
        minutes:{
            type: Number,
            default:0
        }
    },
    ymlJson:Schema.Types.Mixed,
    execution: Schema.Types.Mixed,
    desc: {
        type: String,
        trim: true,
        required: true
    },
    orgId:{
        type: String,
        trim: true,
        required: true
    },
    orgName:{
        type: String,
        trim: true,
        required: true
    },
    inputFormFields:Schema.Types.Mixed,
    outputOptions:Schema.Types.Mixed,
    params:Schema.Types.Mixed,
    isParameterized:{
        type: Boolean,
        default: false
    },
    lastExecutionStatus:{
        type: String,
        trim: true,
        required: false
    },
    ymlDocFileId : {
        type: String,
        trim: true,
        required: false
    },
    scriptDocFilePath:{
        type: String,
        trim: true,
        required: false
    },
    manualExecutionTime: {
        type: Number,
        default: 10
    },
    executionCount: {
        type: Number,
        default: 0
    },
    lastRunTime: {
        type: Number
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    scheduler:{
        cronStartOn: {
            type: String,
            required: false,
            trim: true
        },
        cronEndOn: {
            type: String,
            required: false,
            trim: true
        },
        cronPattern: {
            type: String,
            required: false,
            trim: true
        },
        cronRepeatEvery: {
            type: Number,
            required: false
        },
        cronFrequency: {
            type: String,
            required: false,
            trim: true
        },
        cronMinute:{
            type: Number,
            required: false,
            trim: true
        },
        cronHour:{
            type: Number,
            required: false
        },
        cronWeekDay:{
            type: Number,
            required: false
        },
        cronDate:{
            type: Number,
            required: false
        },
        cronMonth:{
            type: String,
            required: false,
            trim: true
        },
        cronYear:{
            type: Number,
            required: false
        }
    },
    cronJobId:{
        type: String,
        required: false,
        trim: true
    },
    createdOn:{
        type: Number,
        default: Date.now()
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        required: false,
        trim: true
    }
});
BotsSchema.plugin(mongoosePaginate);


BotsSchema.statics.createNew = function(botsDetail,callback){
    var botsData = new Bots(botsDetail);
    botsData.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    });
}
BotsSchema.statics.updateBotsDetail = function(botId,botsDetail,callback){
    Bots.update({_id:ObjectId(botId)},{$set:botsDetail},{upsert:false}, function(err, updateBotDetail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateBotDetail);
    });
};

BotsSchema.statics.getBotsList = function(botsQuery,callback){
    botsQuery.queryObj.isDeleted = false;
    Bots.paginate(botsQuery.queryObj, botsQuery.options, function(err, botsList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, botsList);
    });
};

BotsSchema.statics.getBotsById = function(botId,callback){
    Bots.find({_id:ObjectId(botId)}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};

BotsSchema.statics.getBotsByBotId = function(botId,callback){
    Bots.find({id:botId}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};

BotsSchema.statics.getBotsByBotId = function(botId,callback){
    Bots.find({id:botId}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};

BotsSchema.statics.getBotsByGitHubId = function(gitHubId,callback){
    Bots.find({gitHubId:gitHubId}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};

BotsSchema.statics.getAllBots = function(queryParam,callback){
    Bots.find(queryParam, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};


BotsSchema.statics.removeBotsById = function(botId,callback){
    Bots.remove({_id:ObjectId(botId)}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null, bots);
        }
    });
};

BotsSchema.statics.removeBotsByGitHubId = function(gitHubId,callback){
    Bots.remove({gitHubId:gitHubId}, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null, bots);
        }
    });
};

BotsSchema.statics.getScheduledBots = function getScheduledBots(callback) {
    Bots.find({
        isScheduled: true,
        isDeleted:false
    }, function (err, bots) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        }
        return callback(null, bots);
    })
}

BotsSchema.statics.updateCronJobIdByBotId = function updateCronJobIdByBotId(botId, cronJobId, callback) {
    Bots.update({
        "_id": ObjectId(botId),
    }, {
        $set: {
            cronJobId: cronJobId
        }
    }, {
        upsert: false
    }, function (err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

BotsSchema.statics.updateBotsScheduler = function updateBotsScheduler(botId, callback) {
    Bots.update({
        "_id": ObjectId(botId),
    }, {
        $set: {
            isScheduled: false
        }
    }, {
        upsert: false
    }, function (err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

var Bots = mongoose.model('botsnew', BotsSchema);
module.exports = Bots;
