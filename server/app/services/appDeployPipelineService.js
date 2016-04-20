
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
var AppDeployPipeline = require('_pr/model/app-deploy/appdeploy-pipeline');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');

const errorType = 'appDeployPipeline';

var appDeployPipelineService = module.exports = {};

appDeployPipelineService.getProjectByProjectId=function getProjectByProjectId(projectId,callback){
    AppDeployPipeline.getAppDeployPipelineByProjectId(projectId, function(err, appDeployProject) {
        if (err) {
            logger.debug("Error while fetching Project via projectId in App Deploy");
            callback(err,null);
            return;
        }
        if (appDeployProject.length > 0) {
            callback(null,appDeployProject);
            return;
        }
        else
        {
            masterUtil.getParticularProject(projectId,function(err,aProject){
                if (err) {
                    logger.debug("Error while fetching Project via projectId in Master Util");
                    callback(err,null);
                    return;
                }
                else{
                    callback(null,aProject);
                    return
                }

            });
        }
    });
}

appDeployPipelineService.saveAndUpdatePipeLineConfiguration=function saveAndUpdatePipeLineConfiguration(configurationData,callback){
    AppDeployPipeline.getAppDeployPipelineByProjectId(configurationData.projectId, function(err, appDeploys) {
        if (err) {
            logger.debug("Error while fetching App Deploy via projectId");
            callback(err,null);
            return;
        }
        if (appDeploys.length > 0) {
            AppDeployPipeline.updateConfigurePipeline(configurationData.projectId,configurationData,function(err,appDeploy){
                if (err) {
                    logger.debug("Error while Updating App Deploy");
                    callback(err,null);
                    return;
                }
                else if(appDeploy.length === 0){
                    logger.debug("App Deploy Record is not successfully updated.");
                    callback(null, appDeploy);
                    return;
                }
                else {
                    logger.debug("App Deploy Record is successfully updated.");
                    callback(null, appDeploy);
                    return;
                }
            });
        }
        else {
            AppDeployPipeline.createNew(configurationData, function(err, appDeploy) {
                if (err) {
                    logger.debug("Error while Creating App Deploy");
                    callback(err,null);
                    return;
                }
                else if(appDeploy.length === 0){
                    logger.debug("App Deploy Record is not successfully saved.");
                    callback(null, appDeploy);
                    return;
                }
                else {
                    logger.debug("App Deploy Record is successfully saved.");
                    callback(null, appDeploy);
                    return;
                }
            });
        }
    });
}







