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

var RunbookSchema = new Schema ({

    name: {
        type: String,
        trim: true,
        required: true

    },
    runbookYmlJson:Schema.Types.Mixed,
    ymlDocFileId : {
        type: String,
        trim: true,
        required: false
    },



});
RunbookSchema.plugin(mongoosePaginate);


RunbookSchema.statics.createNew = function(runbookDetail,callback){
    var runbookData = new runbook(runbookDetail);
    runbookData.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    });
}
RunbookSchema.statics.updateRunbookDetail = function(runbookId,runbookDetail,callback){
    runbook.update({_id:ObjectId(runbookId)},{$set:runbookDetail},{upsert:false}, function(err, updateRunbookDetail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateRunbookDetail);
    });
};

RunbookSchema.statics.getBotsList = function(botsQuery,callback){
    botsQuery.queryObj.isDeleted = false;
    runbook.paginate(botsQuery.queryObj, botsQuery.options, function(err, botsList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, botsList);
    });
};

RunbookSchema.statics.getBotsById = function(botId,callback){
    runbook.find({_id:ObjectId(botId)}, function(err, bots) {
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

RunbookSchema.statics.getRunbookByName = function(runbookName,callback){
    runbook.find({name:runbookName}, function(err, runbook) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(runbook.length > 0){
            return callback(null, runbook);
        }else{
            return callback(null, []);
        }
    });
};


RunbookSchema.statics.getBotsByGitHubId = function(gitHubId,callback){
    runbook.find({gitHubId:gitHubId}, function(err, bots) {
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

RunbookSchema.statics.getAllBots = function(queryParam,callback){
    runbook.find(queryParam, function(err, bots) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else if(bots.length > 0){
            logger.info('Exiting getAllBots');
            return callback(null, bots);
        }else{
            return callback(null, []);
        }
    });
};


RunbookSchema.statics.removeBotsById = function(botId,callback){
    runbook.remove({_id:ObjectId(botId)}, function(err, bots) {
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

RunbookSchema.statics.removeBotsByGitHubId = function(gitHubId,callback){
    runbook.remove({gitHubId:gitHubId}, function(err, bots) {
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

RunbookSchema.statics.getScheduledBots = function getScheduledBots(callback) {
    runbook.find({
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

RunbookSchema.statics.updateCronJobIdByBotId = function updateCronJobIdByBotId(botId, cronJobId, callback) {
    runbook.update({
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

RunbookSchema.statics.updateBotsScheduler = function updateBotsScheduler(botId, callback) {
    runbook.update({
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

var runbook = mongoose.model('runbook', RunbookSchema);
module.exports = runbook;
