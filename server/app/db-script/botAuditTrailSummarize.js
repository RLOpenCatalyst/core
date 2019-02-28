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

var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var botAuditTrail = require('../model/audit-trail/bot-audit-trail');
var botAuditTrailSummaryModel = require('../model/audit-trail/bot-audit-trail-summary');
var botModel = require('../model/bots/1.1/bot');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil');
var logger = require('_pr/logger')(module);
var cronTab = require('node-crontab');
var mongoose = require('mongoose');

var botAuditTrailSummary = module.exports = {
    createCronJob: createCronJob
}

var dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
}

function botAuditTrailSummarize(date) {
    var botAuditTrailSummaryData = [];
    async.parallel({
        botAuditTrailData: function (callback) {
            var query = {}
            if(date) {
                query["$and"] = [{ "startedOn": { $lte: getEndOfDay(date)}}, { "startedOn": { $gte: getStartOfDay(date)}}];
            }
            botAuditTrail.find(query, function (err, botAuditTrailData) {
                if(err) callback(err)
                else callback(null, botAuditTrailData)
            })
        },
        botList: function (callback) {
            botModel.find({}, function (err, botList) {
                if(err) callback(err)
                else callback(null, botList)
            })
        }
    }, function (err, data) {
        if(err) logger.error(JSON.stringify(err))
        else {
            for(let bat of data.botAuditTrailData) {
                var manualExecution = manualExecutionBot(bat.auditId, data.botList)
                var summaryObj = {};
                var startHour = getStartOfDay(bat.startedOn)
                summaryObj['user'] = bat.user;
                summaryObj['botID'] = bat.auditId;
                summaryObj['date'] = startHour;
                var index = getFromData(botAuditTrailSummaryData, summaryObj);
                if(index == -1) {
                    var successCount = 0;
                    var failedCount = 0;
                    var runningCount = 0;
                    if(bat.actionStatus == 'success') successCount++;
                    else if(bat.actionStatus == 'failed') failedCount++;
                    else runningCount++;
                    summaryObj['successCount'] =successCount;
                    summaryObj['failedCount'] = failedCount;
                    summaryObj['runningCount'] = runningCount;
                    summaryObj['timeSaved'] = ((manualExecution * 60 * 1000) - (bat.endedOn - bat.startedOn)) > 0 ? ((manualExecution * 60 * 1000) - (bat.endedOn - bat.startedOn)) : 0  ;
                    botAuditTrailSummaryData.push(summaryObj);
                } else {
                    var summaryObj = botAuditTrailSummaryData[index];
                    var successCount = summaryObj.successCount;
                    var failedCount = summaryObj.failedCount;
                    var runningCount = 0;
                    if(bat.actionStatus == 'success') successCount++;
                    else if(bat.actionStatus == 'failed') failedCount++;
                    else runningCount++;
                    summaryObj['successCount'] =successCount;
                    summaryObj['failedCount'] = failedCount;
                    summaryObj['runningCount'] = runningCount;
                    var timeSaved = ((manualExecution * 60 * 1000) - (bat.endedOn - bat.startedOn)) > 0 ? ((manualExecution * 60 * 1000) - (bat.endedOn - bat.startedOn)) : 0
                    summaryObj['timeSaved'] = summaryObj.timeSaved + timeSaved;
                    botAuditTrailSummaryData[index] = summaryObj;
                }
            }
            botAuditTrailSummaryData.forEach(function (batsData) {
                botAuditTrailSummaryModel.update({
                    botID: batsData.botID,
                    user: batsData.user,
                    date: batsData.date
                }, { $set: batsData}, { upsert: true}, function (err, data) {
                    if(err) logger.error(err)
                    else {
                        logger.info(JSON.stringify(data))
                    }
                })
            })
        }
    })
}

function summarize() {
    if(mongoose.connection.readyState == 1){
     addResolvetagforSnowBots()

    }
    else {
        mongoDbConnect(dboptions, function(err) {
            if (err) {
                logger.error("Unable to connect to mongo db >>" + err);
                throw new Error(err);
            } else {
                logger.info('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
                logger.info('Start Time ', new Date())
                 addResolvetagforSnowBots()
            }
        })
    }
}

function getFromData(summaryArr, obj) {
    var index = summaryArr.findIndex(function (x) {
        return x.user == obj.user
            && x.botID == obj.botID
            && x.date == obj.date
    })
    return index;
}

function manualExecutionBot(botID, botList) {
    for(let bot of botList) {
        if(bot.id == botID)
            return bot.manualExecutionTime
    }
    return 0;
}

function getStartOfDay(date) {
    var d = new Date(date);
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth();
    var day = d.getUTCDate();
    var startHour =Date.UTC(year,month,day,0,0,0,0);
    return startHour;
}

function getEndOfDay(date) {
    var d = new Date(date);
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth();
    var day = d.getUTCDate();
    var endHour =Date.UTC(year, month, day,25,59,59,59);
    return endHour;
}

function createCronJob() {
    var cronConfig = {
        cronRepeatEvery: 30,
        cronFrequency: 'Minutes',
        cronMinute: 30,
        cronHour: 0
    }
    var cronPattern = apiUtil.createCronJobPattern(cronConfig);
    logger.info("Bot Audit trail summarize job started with interval ==> " + cronPattern.cronPattern);
    cronTab.scheduleJob(cronPattern.cronPattern, function () {
        botAuditTrailSummarize(getStartOfDay(new Date()))
    })
}

/** Temp script for add tag if bot has sysid */
function addResolvetagforSnowBots(){
logger.info('inside addResolvetagforSnowBots')
botModel.update({"input.name":"sysid"},{"isResolved":true},{upsert:true,multi:true},function(err,result){
    if(err){
        logger.err('err at addResolvetagforSnowBots'+JSON.stringify(err))
    }else{
        logger.info('asdResolvetagforSnowBots result'+JSON.stringify(result))

    }
})
}

 summarize();

