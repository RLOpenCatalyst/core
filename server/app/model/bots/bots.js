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
    botId: {
        type: String,
        trim: true,
        required: true
    },
    botName: {
        type: String,
        trim: true,
        required: true
    },
    botType: {
        type: String,
        trim: true,
        required: true
    },
    botCategory: {
        type: String,
        trim: true,
        required: true
    },
    botDesc: {
        type: String,
        trim: true,
        required: true
    },
    botConfig:Schema.Types.Mixed,
    runTimeParams:Schema.Types.Mixed,
    masterDetails: {
        orgName: {
            type: String,
            trim: true,
            required: false
        },
        orgId: {
            type: String,
            trim: true,
            required: false
        },
        bgName: {
            type: String,
            trim: true,
            required: false
        },
        bgId: {
            type: String,
            trim: true,
            required: false
        },
        projectName: {
            type: String,
            trim: true,
            required: false
        },
        projectId: {
            type: String,
            trim: true,
            required: false
        },
        envName: {
            type: String,
            trim: true,
            required: false
        },
        envId: {
            type: String,
            trim: true,
            required: false
        }
    },
    botLinkedCategory: {
        type: String,
        trim: true,
        required: false
    },
    botLinkedSubCategory: {
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
    isBotScheduled: {
        type: Boolean,
        default: false
    },
    botScheduler:{
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
    version: {
        type: Number,
        default: 1
    },
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
    Bots.update({botId:botId},{$set:botsDetail},{upsert:false}, function(err, updateBotDetail) {
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
    Bots.find({botId:botId}, function(err, bots) {
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

BotsSchema.statics.getAllBots = function(callback){
    Bots.find({isDeleted:false}, function(err, bots) {
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
    Bots.remove({botId:botId}, function(err, bots) {
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

BotsSchema.statics.removeSoftBotsById = function(botId,callback){
    Bots.update({botId:botId},{$set:{isDeleted:true}}, function(err, bots) {
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

BotsSchema.statics.updateBotsExecutionCount = function updateBotsExecutionCount(botId,count,callback) {
    Bots.update({
        botId: botId,
    }, {
        $set: {
            executionCount: count
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

BotsSchema.statics.getScheduledBots = function getScheduledBots(callback) {
    Bots.find({
        isBotScheduled: true,
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
        "_id": new ObjectId(botId),
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
        "_id": new ObjectId(botId),
    }, {
        $set: {
            isBotBScheduled: false
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

var Bots = mongoose.model('bots', BotsSchema);
module.exports = Bots;
