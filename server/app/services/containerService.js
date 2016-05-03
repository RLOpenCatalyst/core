
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
var containerDao = require('_pr/model/container');
var userDao = require('_pr/model/users.js');
var Docker = require('_pr/model/docker.js');
var async = require('async');

const errorType = 'containerService';

var containerService = module.exports = {};

containerService.executeActionOnContainer=function executeActionOnContainer(jsonData,callback){
    var category = 'dockercontainer' + jsonData.action1;
    var permissionTo = 'execute';
    var cmd = 'sudo docker ' + jsonData.action + ' ' + jsonData.containerId;
    if (jsonData.action === 'delete') {
        cmd = 'sudo docker stop ' + jsonData.containerId + ' &&  sudo docker rm ' + jsonData.containerId;
    }
    var stdOut = '';
    var _docker = new Docker();
    var status='';
    async.waterfall([
        function (next) {
            userDao.haspermission(jsonData.user.cn, category, permissionTo, null, jsonData.permissionSet,next);
        },
        function (permission,next){
            if(permission){
                 containerDao.getContainerByIdInstanceIP(jsonData.containerId,jsonData.instanceId,next);
            }else{
                 callBackReturn(permission,next)
            }
        },
        function (aContainer,next){
            if(aContainer.length > 0){
                 containerDao.getContainerByIdInstanceIP(jsonData.containerId,jsonData.instanceId,next);
            }else{
                 callBackReturn(aContainer,next);
            }
        },
        function(updateContainer,next){
            _docker.runDockerCommands(cmd, jsonData.instanceId,next,function (stdOutData) {
                stdOut += stdOutData;
            }, function (stdOutErr) {
                callback(stdOutErr, null);
            });
        },
        function (retCode,next){
            logger.debug("Code     "+retCode);
            logger.debug("stdOut     "+stdOut);
            if(retCode === 0){
                if(stdOut.trim().length === jsonData.containerId.length){
                    containerDao.updateContainer(jsonData.containerId,jsonData.processStatus,next);
                }
                else{
                    containerDao.deleteContainerById(jsonData.containerId, next);
                }
            }else {
                 containerDao.updateContainer(jsonData.containerId, status, next);
            }
        }

    ],function (err, results) {
        if (err)
            callback(err,null);
        else
            callback(null,results);
    });
};

function callBackReturn(data,callback){
    callback(null,data);
};











