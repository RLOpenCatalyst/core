
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
var deployPermission = require('_pr/model/app-deploy/deploy-permission');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

const errorType = 'DeployPermission';

var appDeployPermissionService = module.exports = {};

appDeployPermissionService.getDeployPermissionByProjectIdEnvNameAppNameVersion=function getDeployPermissionByProjectIdEnvNameNodeIdVersion(projectId,envName,appName,version,callback){
    deployPermission.getDeployPermissionByProjectIdEnvNameAppNameVersion(projectId,envName,appName,version, function(err, aDeployPermission) {
        if (err) {
            logger.debug("Error while fetching Project via projectId in App Deploy");
            callback(err,null);
            return;
        }
        if (aDeployPermission.length > 0) {
            callback(null,aDeployPermission);
            return;
        }
        else
        callback(null,[]);
    });
}

appDeployPermissionService.saveAndUpdateDeployPermission=function saveAndUpdateDeployPermission(aDeployPermission,callback){
    deployPermission.getDeployPermissionByProjectIdEnvNameAppNameVersion(aDeployPermission.projectId,aDeployPermission.envName,aDeployPermission.appName,aDeployPermission.version, function(err, DeployPermission) {
        if (err) {
            logger.debug("Error while fetching Deploy Permission via projectId,EnvName,AppName and Version in App Deploy");
            callback(err,null);
            return;
        }
        if (DeployPermission.length > 0) {
            deployPermission.updateDeployPermission(aDeployPermission,function(err,appDeployPermission){
                if (err) {
                    logger.debug("Error while Updating Deploy Permission");
                    callback(err,null);
                    return;
                }
                else if(appDeployPermission.length === 0){
                    logger.debug("Deploy Permission Record is not successfully updated.");
                    callback(null, appDeploy);
                    return;
                }
                else {
                    logger.debug("Deploy Permission Record is successfully updated.");
                    callback(null, appDeployPermission);
                    return;
                }
            });
        }
        else {
            deployPermission.saveDeployPermission(aDeployPermission, function(err, appDeployPermission) {
                if (err) {
                    logger.debug("Error while Creating App Deploy");
                    callback(err,null);
                    return;
                }
                else if(appDeployPermission.length === 0){
                    logger.debug("Deploy Permission Record is not successfully saved.");
                    callback(null, appDeployPermission);
                    return;
                }
                else {
                    logger.debug("Deploy Permission Record is successfully saved.");
                    callback(null, appDeployPermission);
                    return;
                }
            });
        }
    });
}







