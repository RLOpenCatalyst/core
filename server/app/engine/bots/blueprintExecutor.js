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
var instanceModel = require('_pr/model/classes/instance/instance.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var uuid = require('node-uuid');
const fileHound= require('filehound');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
var auditTrailService = require('_pr/services/auditTrailService.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

const errorType = 'blueprintExecutor';

var pythonHost =  process.env.FORMAT_HOST || 'localhost';
var pythonPort =  process.env.FORMAT_PORT || '2687';
var blueprintExecutor = module.exports = {};

blueprintExecutor.execute = function execute(botsDetails,auditTrail,userName,executionType,nodeList,attributeList,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var cmd = null, count = 0;
    var gitHubDirPath = appConfig.gitHubDir + botsScriptDetails.gitHubId;
    var actionId = uuid.v4();
    var logsReferenceIds = [botsScriptDetails._id, actionId];
    var botLogFile = appConfig.botLogDir + actionId;
    var fileName = 'botExecution.log';
    var winston = require('winston');
    var path = require('path');
    var mkdirp = require('mkdirp');
    var log_folder = path.normalize(botLogFile);
    mkdirp.sync(log_folder);
    var botLogger = new winston.Logger({
        transports: [
            new winston.transports.DailyRotateFile({
                level: 'debug',
                datePattern: '',
                filename: fileName,
                dirname:log_folder,
                handleExceptions: true,
                json: true,
                maxsize: 5242880,
                maxFiles: 5,
                colorize: true,
                timestamp:false,
                name:'bot-execution-log'
            }),
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: true,
                json: false,
                colorize: true,
                name:'bot-console'
            })
        ],
        exitOnError: false
    });
    var replaceTextObj = {};
};












