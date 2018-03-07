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
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;

var ScheduledBotSchema = new Schema ({
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
    params:Schema.Types.Mixed,
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
    executionCount: {
        type: Number,
        default: 0
    },
});

ScheduledBotSchema.statics.getScheduledBotsByBotId = function(botId,callback){
    scheduledBot.find({
        botName : botId
    }, function(err, scheduledData) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        } else if(scheduledData.length > 0){
            return callback(null, scheduledData);
        } else{
            return callback(null, []);
        }
    });
};

ScheduledBotSchema.plugin(mongoosePaginate);

var scheduledBot = mongoose.model('scheduledBots', ScheduledBotSchema);
module.exports = scheduledBot;
