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

var logger = require('_pr/logger')(module);
var async = require("async");
var logsDao = require('_pr/model/dao/logsdao.js');
var noticeService = require('_pr/services/noticeService.js');
var auditQueue = require('_pr/config/global-data.js');
const errorType = 'apiExecutor';
var apiExecutor = module.exports = {};
apiExecutor.execute = function execute(botDetail,reqBody, auditTrail, userName,botHostDetails,callback) {
    var actionLogId = uuid.v4();
    var reqBodyObj = {
        "data": reqBody.data
    };
    var botAuditTrailObj = {
        botId: botDetail._id,
        actionId: actionLogId
    }
    callback(null, botAuditTrailObj);
    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
    var executorUrl = '/bot/' + botDetail.id + '/exec';
    var options = {
        url: serverUrl + executorUrl,
        headers: {
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        },
        json: true,
        body: reqBodyObj
    };
    request.post(options, function (err, res, body) {
        if (res.statusCode === 200) {
            var auditQueueDetails = {
                userName: userName,
                botId: botDetail.id,
                bot_id: botDetail._id,
                logRefId: [],
                auditId: actionLogId,
                instanceLog: '',
                instanceIP: '',
                auditTrailId: auditTrail._id,
                remoteAuditId: res.body.ref,
                link: res.body.link,
                status: "pending",
                serverUrl: serverUrl,
                env: "local",
                retryCount: 0
            }
            auditQueue.setAudit(auditQueueDetails);
            return;
        } else {
            logger.error(err);
            var logData = {
                botId: botDetail._id,
                botRefId: actionLogId,
                err: true,
                log: "Error in BOT Engine executor:",
                timestamp: new Date().getTime(),
            }
            logsDao.insertLog(logData);
            noticeService.updater(actionLogId,'log',logData);
            var resultTaskExecution = {
                "actionStatus": 'failed',
                "status": 'failed',
                "endedOn": new Date().getTime(),
                "actionLogId": actionLogId
            };
            auditTrailService.updateAuditTrail('BOT', auditTrail._id, resultTaskExecution, function (err, data) {
                if (err) {
                    logger.error("Failed to create or update bots Log: ", err);
                }
                noticeService.notice(userName, {
                    title: "API BOT Execution",
                    body: res.statusCode === 502?"Bot Enginge is not running":"Error in API executor"
                }, "error", function (err, data) {
                    if (err) {
                        logger.error("Error in Notification Service, ", err);
                    }
                    return;
                });
            });
        }
    })
}
