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
var AppData = require('_pr/model/app-deploy/app-data');

const errorType = 'appData';

var appDataService = module.exports = {};

appDataService.getAppDataByProjectAndEnv = function getAppDataByProjectAndEnv(projectId, envName, appName, version, callback) {
    AppData.getAppDataByProjectAndEnv(projectId, envName, appName, version, function(err, appDatas) {
        if (err) {
            return callback(err, null);
        }
        if (appDatas && appDatas.length) {
            var appdata = appDatas[0];
            var appDataObj = {
                "projectId": appdata.projectId,
                "envName": appdata.envName,
                "appName": appdata.appName,
                "version": appdata.version
            }
            if (appdata.nexus && appdata.nexus.repoURL) {
                appDataObj['nexus'] = appdata.nexus;
            } else if (appdata.docker) {
                appDataObj['docker'] = appdata.docker;
            } else {
                appDataObj['s3Bucket'] = appdata.s3Bucket;
            }
            return callback(null, appDataObj);
        } else {
            return callback(null, []);
        }
    });
};
