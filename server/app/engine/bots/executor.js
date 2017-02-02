
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
var botsDao = require('_pr/model/bots/1.1/botsDao.js');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
const fileHound= require('filehound');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');

const errorType = 'executor';

var executor = module.exports = {};

executor.executeScriptBot = function executeScriptBot(botsDetails,callback) {
    if(botsDetails.env && botsDetails.env !== null){
        executeScriptOnNode(botsDetails,function(err,data){
            if(err){
                callback(err,null);
                return;
            }else{
                callback(null,data);
                return;
            }
        });
    }else{
        executeScriptOnNode(botsDetails,function(err,data){
            if(err){
                callback(err,null);
                return;
            }else{
                callback(null,data);
                return;
            }
        });
    }
}


function executeScriptOnNode(botsScriptDetails,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var args = [],cmd = null,count = 0;
    var gitHubDirPath = appConfig.gitHubDir + botsScriptDetails.gitHubRepoName;
    for(var i = 0; i < botsScriptDetails.execution.length; i++) {
        (function(scriptObj) {
            fileHound.create()
                .paths(gitHubDirPath)
                .match(scriptObj.start)
                .ext('sh')
                .find().then(function (files) {
                if (scriptObj.sudoFlag && scriptObj.sudoFlag === true) {
                    cmd = 'sudo ' +scriptObj.type + ' ' + files[0];
                } else {
                    cmd = scriptObj.type + ' ' + files[0]
                }
                for (var j = 0; j < botsScriptDetails.params.length; j++) {
                    var decryptedText = cryptography.decryptText(botsScriptDetails.params[j], cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    args.push(decryptedText);
                }
                var spawn = require("child_process").spawn;
                var child = spawn(cmd, args);
                child.stdout.on("data", function (data) {
                    console.log(data);
                });
                child.stdout.on("end", function () {
                    count++;
                    if(count === botsScriptDetails.params.length) {
                        callback(null, botsScriptDetails);
                        return;
                    }
                });
                child.stdout.on("error", function (err) {
                    count++;
                    logger.error(err);
                    if(count === botsScriptDetails.params.length) {
                        callback(null, botsScriptDetails);
                        return;
                    }
                });
            });
        })(botsScriptDetails.execution[i])
    }
};








