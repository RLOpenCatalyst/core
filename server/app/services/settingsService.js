
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
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");

const errorType = 'settingsService';

var settingsService = module.exports = {};

settingsService.updateProjectData = function updateProjectData(enviornment,callback){
    async.waterfall([
        function(next){
            masterUtil.getParticularProject(enviornment.projectname_rowid,next);
        },
        function(masterProjectData,next){
            if(masterProjectData.length > 0){
                var envNames=masterProjectData[0].environmentname.split(",");
                var envIds=masterProjectData[0].environmentname_rowid.split(",");
                if(envNames.indexOf(enviornment.environmentname) === -1 && envIds.indexOf(enviornment.environmentname_rowid) === -1){
                    next(null,null);
                }else{
                    var projectObj={
                        projectId:enviornment.projectname_rowid,
                        envNames:changeArrayToString(envNames,enviornment.environmentname),
                        envIds:changeArrayToString(envIds,enviornment.rowid)
                    }
                    next(null,projectObj);
                }
            }else{
                next(null,null);
            }
        },
        function(updatedMasterProjectObj,next){
            if(updatedMasterProjectObj){
                masterUtil.updateParticularProject(updatedMasterProjectObj,next);
            }else{
                next(null,updatedMasterProjectObj);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while updating Environments in Master Data Project "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

function changeArrayToString(list,str){
    var resultStr='';
    for(var i = 0; i < list.length; i++){
        if (i === list.length - 1) {
            if(str !== list[i]) {
                resultStr = resultStr + list[i];
            }
        } else {
            if(str !== list[i]) {
                resultStr = resultStr + list[i] + ',';
            }
        }
    }
    if(resultStr.slice(-1) === ','){
        var res = resultStr.slice(0,-1);
        return res;
    }else{
        return resultStr;
    }
}
