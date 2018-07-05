
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
var fileUpload = require('_pr/model/file-upload/file-upload');
var settingService = require('_pr/services/settingsService');


const errorType = 'scriptService';

var scriptService = module.exports = {};

scriptService.getScriptListWithPagination = function getScriptListWithPagination(reqQuery,userName,callback){
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
                settingService.getOrgUserFilter(userName,function(err,orgIds){
                    if(err){
                        next(err,null);
                    }else if(orgIds.length > 0){
                        queryObj.queryObj['orgDetails.id'] = {$in:orgIds};
                        script.getScriptListWithPagination(queryObj, next);
                    }else{
                        script.getScriptListWithPagination(queryObj, next);
                    }
                });
            },
            function (scripts, next) {
                addFileDetailsForScripts(scripts,next);
            },
            function (formattedScripts, next) {
                apiUtil.changeResponseForJqueryPagination(formattedScripts, reqObj, next);
            },

        ], function (err, results) {
            if (err){
                return callback(err,null);
            }else{
                return callback(null,results);
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
                script.updateScript(scriptData,next);
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

scriptService.getScriptById=function getScriptById(scriptId,callback){
    async.waterfall([
        function(next){
            script.getScriptById(scriptId,next);
        },
        function(scripts,next){
            if(scripts.length > 0){
                fileUpload.getReadStreamFileByFileId(scripts[0].fileId,function(err,file){
                    if(err){
                        var err = new Error('Internal server error');
                        err.status = 500;
                        next(err,null);
                    }else{
                        var scriptObj= {
                            scriptId: scripts[0]._id,
                            name: scripts[0].name,
                            type: scripts[0].type,
                            description: scripts[0].description,
                            orgDetails: scripts[0].orgDetails,
                            isParametrized: scripts[0].isParametrized,
                            noOfParams: scripts[0].noOfParams,
                            fileId: scripts[0].fileId,
                            fileName: file.fileName,
                            file: file.fileData
                        };
                        next(null,scriptObj);
                    }
                });
            }else{
                next(null,scriptId);
            }
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
            checkScriptAssociatedWithTask(scriptId,next);
        },
        function(taskStatus,next){
            if(taskStatus) {
                next({message:"Script already associated with Some Task.To delete script please delete respective Task first.",code:403},null);
            }else{
                script.getScriptById(scriptId, next);
            }
        },
        function(scripts,next){
            if(scripts.length > 0){
                async.parallel({
                    removeFile: function(callback){
                        fileUpload.removeFileByFileId(scripts[0].fileId,callback);
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

scriptService.getScriptList = function getScriptList(filterBy,userName,callback){
    var filterObj = {};
    async.waterfall([
        function(next){
            apiUtil.queryFilterBy(filterBy,next);
        },
        function(queryObj,next){
            filterObj = queryObj;
            settingService.getOrgUserFilter(userName,next);
        },
        function(orgIds,next){
            if(orgIds.length > 0){
                filterObj['orgDetails.id'] = {$in:orgIds}
            }
            script.getScripts(filterObj,next);
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while fetching All Scripts "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
};

function addFileDetailsForScripts(scripts,callback){
  if (scripts.docs.length === 0) {
      return callback(null,scripts);
  }else{
      var scriptList =[];
      var scriptObj={};
      for(var i = 0; i <scripts.docs.length; i++){
          (function(script){
              fileUpload.getFileByFileId(script.fileId,function(err,file){
                  if(err){
                      var err = new Error('Internal server error');
                      err.status = 500;
                      return callback(err,null);
                  }else{
                     scriptObj = {
                         scriptId:script._id,
                         name:script.name,
                         type:script.type,
                         description:script.description,
                         orgDetails:script.orgDetails,
                         isParametrized: script.isParametrized,
                         noOfParams: script.noOfParams,
                         fileId:script.fileId,
                         fileName:file.filename
                      }
                      scriptList.push(scriptObj);
                      scriptObj={};
                      if (scriptList.length === scripts.docs.length) {
                          scripts.docs = scriptList;
                          return callback(null, scripts);
                      }
                  }
              })
          })(scripts.docs[i]);
      }
  }
}

function checkScriptAssociatedWithTask(scriptId,callback){
    var taskDao = require('_pr/model/classes/tasks/tasks.js');
    taskDao.getScriptTypeTask(function(err,tasks){
        if(err){
            callback(err,null);
            return;
        }else if(tasks.length > 0){
            var count = 0;
            var checkTaskStatus =false;
            for(var i = 0; i < tasks.length; i++){
                (function(task){
                    count++;
                    for(var j = 0;j < task.taskConfig.scriptDetails.length;j++){
                        (function(scriptDetails){
                            if(scriptDetails.scriptId === scriptId){
                                checkTaskStatus = true;
                                return;
                            }else{
                                return;
                            }
                        })(task.taskConfig.scriptDetails[j]);
                    }
                })(tasks[i]);
            }
            if(count === tasks.length){
                callback(null,checkTaskStatus);
            }

        }else{
            callback(null,checkTaskStatus);
        }
    });

}
