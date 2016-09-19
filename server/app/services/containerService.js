
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
    var enumStatus='';
    async.waterfall([
        function (next) {
            userDao.haspermission(jsonData.user.cn, category, permissionTo, null, jsonData.permissionSet,next);
        },
        function (permission,next){
            if(permission){
                containerDao.getContainerByIdInstanceId(jsonData.containerId,jsonData.instanceId,next);
            }else{
                next(null,permission);
            }
        },
        function (container,next){
            if(container.length > 0){
                status=container[0].Status;
                enumStatus = container[0].containerStatus;
                containerDao.updateContainerStatus(jsonData.containerId,dockerContainerStatus(jsonData.action)+" IN PROGRESS",dockerContainerStatus(jsonData.action)+" IN PROGRESS",next);
            }else{
                next(null,container);
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
            logger.debug("Code >>>>"+retCode);
            logger.debug("stdOut >>>>"+stdOut);
            if(retCode === 0){
                var count = occurrences(stdOut,jsonData.containerId,true);
                logger.debug("Occurrence count is >>>   "+count);
                if(count === 1 || retCode === 0){
                    containerDao.updateContainerStatus(jsonData.containerId,dockerContainerStatus(jsonData.action),dockerContainerStatus(jsonData.action),next);
                }else{
                    containerDao.deleteContainerById(jsonData.containerId,next);
                }
            }else {
                containerDao.updateContainerStatus(jsonData.containerId,status,enumStatus,next);
            }
        }

    ],function (err, results) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
};


function occurrences(string, subString, allowOverlapping) {
    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);
    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function dockerContainerStatus(status){
    if(status === 'stop') {
        return "STOP";
    }else if(status === 'pause'){
        return "PAUSE";
    }else if(status === 'restart'){
        return "RESTART";
    }else if(status === 'unpause'){
        return "UNPAUSE";
    }else if(status === 'delete'){
        return "TERMINATE";
    }else{
        return "START";
    }
};











