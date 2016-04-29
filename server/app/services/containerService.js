
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
var logsDao = require('../model/dao/logsdao.js');

const errorType = 'containerService';

var containerService = module.exports = {};

containerService.executeActionOnContainer=function executeActionOnContainer(jsonData,callback){
    var category = 'dockercontainer' + jsonData.action1;
    var permissionTo = 'execute';
    userDao.haspermission(jsonData.user.cn, category, permissionTo, null, jsonData.permissionSet, function(err, data) {
        if (err) {
            logger.debug('Error in User Permission');
            callback(err, null);
            return;
        }
        else {
            logger.debug('Returned from hasPermission :  launch ' + data + ' , Condition State : ' + (data == false));
            if (data == false) {
                logger.debug('No permission to ' + permissionTo + ' on ' + category);
                callback(null, data);
                return;
            } else {
                containerDao.getContainerByIdInstanceIP(jsonData.containerId,jsonData.instanceId,function(err,aContainer) {
                    if (err) {
                        logger.error("Error in fetching Container By ID and Instance ID:", err);
                        callback(err, null);
                        return;
                    } else if (aContainer.length === 0) {
                        logger.debug("Container ID is not present in Database:");
                        callback(null, []);
                        return;
                    } else {
                        containerDao.updateContainer(jsonData, function (err, updateContainer) {
                            if (err) {
                                logger.error("Error in Updating Container Status:", err);
                                callback(err, null);
                                return;
                            }
                            var cmd = 'sudo docker ' + jsonData.action + ' ' + jsonData.containerId;
                            if (jsonData.action == 'delete') {
                                cmd = 'sudo docker stop ' + jsonData.containerId + ' &&  sudo docker rm ' + jsonData.containerId;
                            }
                            var stdOut = '';
                            var _docker = new Docker();
                            _docker.runDockerCommands(cmd, jsonData.instanceId, function (err, retCode) {
                                if (err) {
                                    logsDao.insertLog({
                                        referenceId: jsonData.instanceid,
                                        err: true,
                                        log: "Action Error : " + err,
                                        timestamp: new Date().getTime()
                                    });
                                    logger.error("Error hits while running Docker Command: ", err);
                                    callback(err, null);
                                } else {
                                    logsDao.insertLog({
                                        referenceId: jsonData.instanceId,
                                        err: false,
                                        log: "Container  " + jsonData.containerId + " Action :" + jsonData.action,
                                        timestamp: new Date().getTime()
                                    });
                                    if (retCode === 0) {
                                      if(stdOut.trim().length === jsonData.containerId.length){
                                          jsonData['Status']=jsonData.action+" Successfully";
                                          containerDao.updateContainer(jsonData, function (err, updateContainer) {
                                              if (err) {
                                                  logger.error("Error in updating Container Status:", err);
                                                  callback(err, null);
                                                  return;
                                              }
                                              logger.debug("Docker ID " + jsonData.containerId + " is successfully "+jsonData.action);
                                              callback(null, updateContainer);
                                          });
                                      } else {
                                           containerDao.deleteContainerById(jsonData.containerId, function (err, deleteContainer) {
                                           if (err) {
                                           logger.error("Error in Deleting Container:", err);
                                           callback(err, null);
                                           return;
                                           }
                                           callback(null, deleteContainer);
                                           });
                                      }
                                    } else{
                                        jsonData['Status']=aContainer[0].Status;
                                        containerDao.updateContainer(jsonData, function (err, updateContainer) {
                                            if (err) {
                                                logger.error("Error in updating Container Status:", err);
                                                callback(err, null);
                                                return;
                                            }
                                            logger.debug("Docker ID " + jsonData.containerId + " is not exist in respective machine : ");
                                            callback(null, updateContainer);
                                        });
                                    }

                                }
                            }, function (stdOutData) {
                                stdOut += stdOutData;
                                logger.debug(stdOutData.toString());
                                logsDao.insertLog({
                                    referenceId: jsonData.instanceid,
                                    err: false,
                                    log: "Container  " + jsonData.containerId + ":" + stdOutData,
                                    timestamp: new Date().getTime()
                                });
                            }, function (stdOutErr) {
                                logger.error("Error running Docker Command: ", stdOutErr);
                                callback(err, null);
                            });
                        });

                    }
                })
            }
        }
    });
}











