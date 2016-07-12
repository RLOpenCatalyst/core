
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
var script = require('_pr/model/scripts/scripts');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var fileIo = require('_pr/lib/utils/fileio');

const errorType = 'scriptService';

var scriptService = module.exports = {};

scriptService.getScripts = function getScripts(reqQuery,callback){
    var reqObj = {};
    async.waterfall(
        [
            function (next) {
                apiUtil.changeRequestForJqueryPagination(reqQuery, next);
            },
            function (reqData, next) {
                reqObj = reqData;
                apiUtil.paginationRequest(reqData, 'scripts', next);
            },
            function (paginationReq, next) {
                apiUtil.databaseUtil(paginationReq, next);
            },
            function (queryObj, next) {
                script.getScripts(queryObj, next);
            },
            function (scripts, next) {
                apiUtil.changeResponseForJqueryPagination(scripts, reqObj, next);
            },

        ], function (err, results) {
            if (err){
                callback(err,null);
            }else{
                callback(null,results);
            }
        });
};

scriptService.saveAndUpdateScript=function saveAndUpdateScript(scriptData,callback){
    async.waterfall([
        function(next){
            script.getScriptById(scriptData.scriptId,next);
        },
        function(scripts,next){
            if(scripts.length > 0){
                var filePath = scripts[0].fileDetails.path + scripts[0].fileDetails.id +'_'+scripts[0].fileDetails.name;
                async.waterfall([
                    function(next){
                        script.updateScript(scriptData,next);
                    },
                    function(updateScript,next){
                        fileIo.removeFile(filePath,next);
                    }
                ],function(err,results){
                    if(err){
                        next(err,null);
                    }else{
                        next(null,results)
                    }
                })
            }else{
                script.createNew(scriptData, next);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while Creating or Updating Scripts "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

scriptService.getScriptById=function saveAndUpdateScript(scriptId,callback){
    async.waterfall([
        function(next){
            script.getScriptById(scriptId,next);
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while fetching Scripts "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
};

scriptService.removeScriptById=function removeScriptById(scriptId,callback){
    async.waterfall([
        function(next){
            script.getScriptById(scriptId,next);
        },
        function(scripts,next){
            if(scripts.length > 0){
                var filePath = scripts[0].fileDetails.path + scripts[0].fileDetails.id +'_'+scripts[0].fileDetails.name;
                async.parallel({
                    removeFile: function(callback){
                        fileIo.removeFile(filePath,callback);
                    },
                    removeScript: function(callback){
                        script.removeScriptById(scriptId,callback);
                    }
                },function(err,results){
                    if(err){
                        next(err,null);
                    }else{
                        next(null,results)
                    }
                })
            }else{
                next(null,scripts);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while removing Scripts "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};
