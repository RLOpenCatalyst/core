
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
var appDeployPipeline = require('_pr/model/app-deploy/appdeploy-pipeline');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var uuid = require('node-uuid');

const errorType = 'appDeployPipeline';

var appDeployPipelineService = module.exports = {};

appDeployPipelineService.getAppDeployPipeLineConfigData=function getAppDeployPipeLineConfigData(projectId,username,callback){
    async.parallel({
            pipeLineConfiguration: function (callback) {
                appDeployPipeline.getAppDeployPipelineByProjectId(projectId, callback);
            },
            projectBasedConfiguration: function (callback) {
                getAppDeployPipeLineConfigDataFromMaster(projectId,username, callback);
            }
        },function(err,results){
            if (err) {
                logger.error("Error while fetching App Deploy Pipeline Configuration  "+err);
                callback(err,null);
                return;
            }else{
                if(results.pipeLineConfiguration.length > 0){
                    results.pipeLineConfiguration[0].envId = results.projectBasedConfiguration[0].envId;
                    callback(null,results.pipeLineConfiguration);
                    return;
                }else{
                    callback(null,results.projectBasedConfiguration);
                    return;
                }
            }
        });
}

appDeployPipelineService.saveAndUpdatePipeLineConfiguration=function saveAndUpdatePipeLineConfiguration(configurationData,callback){
    async.waterfall([
        function(next){
            appDeployPipeline.getAppDeployPipelineByProjectId(configurationData.projectId,next);
        },
        function(appDeployPipelineConfig,next){
            if(appDeployPipelineConfig.length > 0){
                appDeployPipeline.updateConfigurePipeline(configurationData.projectId,configurationData,next);
            }else{
                appDeployPipeline.createNew(configurationData, next);
            }
        },
        function(appDeployConfigData,next){
            appDeployPipeline.getAppDeployPipelineByProjectId(configurationData.projectId,next);
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while Creating App Deploy Pipeline Configuration  "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

appDeployPipelineService.updateAppDeployPipeLineEnviornment=function updateAppDeployPipeLineEnviornment(enviornment,callback){
    async.waterfall([
        function(next){
            appDeployPipeline.getAppDeployPipelineByProjectId(enviornment.projectname_rowid,next);
        },
        function(appDeployPipelineConfig,next){
            if(appDeployPipelineConfig.length > 0){
                updateAppConfigEnv(appDeployPipelineConfig[0],enviornment.environmentname,next);
            }else{
                next(null,appDeployPipelineConfig);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while updating Environments in App Deploy Pipeline Configuration  "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

function getAppDeployPipeLineConfigDataFromMaster(projectId,username,callback){
    var responseProjectList=[],envNameList=[];
    var responseProject={};
    masterUtil.getTeamByProjectIdUserName(projectId,username,function(err,teams){
        if(err){
            callback(err,null);
        }else if(teams.length > 0){
            var count = 0;
            for(var i = 0; i < teams.length;i++){
                (function(team){
                    count++;
                    var envNames = team.environmentname.split(",");
                    for(var j = 0; j < envNames.length;j++){
                        if(envNameList.indexOf(envNames[j]) === -1){
                            envNameList.push(envNames[j]);
                        }
                    }
                    if(count === teams.length){
                        responseProject['_id'] = uuid.v4();
                        responseProject['projectId'] = projectId;
                        responseProject['envSequence'] = envNameList;
                        responseProject['envId'] = envNameList;
                        responseProjectList.push(responseProject);
                        callback(null, responseProjectList);
                    }
                })(teams[i]);
            }

        }else{
            callback(null, teams);
        }
    });
};

function updateAppConfigEnv(configData,envName,callback){
    var envNames=configData.envId;
    var envNameSeq=configData.envSequence;
    if(envNames.indexOf(envName) === -1 && envNameSeq.indexOf(envName) === -1){
        logger.debug("App Deploy Configuration is updated");
        callback(null, configData);
        return;
    } else {
        envNames.remove(envName);
        envNameSeq.remove(envName);
        configData['envId'] = envNames;
        configData['envSequence'] = envNameSeq;
        appDeployPipeline.updateConfigurePipeline(configData.projectId, configData, function (err, appDeployPipeLineConfig) {
            if (err) {
                logger.debug("Error while Updating App Deploy");
                callback(err, null);
            }
            logger.debug("App Deploy Record is successfully updated.");
            callback(null, appDeployPipeLineConfig);
        });
    }
};
