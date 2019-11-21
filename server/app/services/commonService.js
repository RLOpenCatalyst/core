/*
 Copyright [2017] [Relevance Lab]

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
var yml = require('json2yaml');
var uuid = require('node-uuid');
var appConfig = require('_pr/config');
var fileIo = require('_pr/lib/utils/fileio');
var fileUpload = require('_pr/model/file-upload/file-upload');
var noticeService = require('_pr/services/noticeService.js');
var scriptService = require('_pr/services/scriptService.js');
var async = require('async');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var targz = require('targz');
var fs = require('fs');
var request = require('request');
var path = require('path');
var mkdirp = require('mkdirp');


const errorType = 'commonService';

var commonService = module.exports = {};

commonService.convertJson2Yml = function convertJson2Yml(reqBody,callback) {
    var ymlText = '',scriptFileName = '',count = 0;
    var commonJson = {
        id: reqBody.name.toLowerCase().replace(/ /g,"_") + '_' + uuid.v4().split("-")[0],
        name: reqBody.name,
        desc: reqBody.desc,
        action: reqBody.action,
        type: reqBody.type,
        functionality: reqBody.category,
        subType: reqBody.subType ? reqBody.subType : (reqBody.blueprintType ? reqBody.blueprintType : null),
        manualExecutionTime: parseInt(reqBody.standardTime),
        input: [],
        execution: [],
        output: {
            logs:[],
            msgs: {
                mail: '',
                text: ''
            }
        }
    }
    if (reqBody.filters) {
        commonJson.output.filters = reqBody.filters;
    }
    if (reqBody.messages) {
        commonJson.output.msgs = reqBody.messages;
    }
    if (reqBody.logs) {
        commonJson.output.logs = reqBody.logs;
    }
    if (reqBody.type === 'script') {
        commonJson.output.logs.push('stdout');
        commonJson.output.msgs.text = 'Script BOT has executed successfully Node ${node}';
        commonJson.output.msgs.mail = 'Node: ${node}'
        for(var i = 0; i < reqBody.scriptDetails.length; i ++) {
            (function (scriptDetail) {
                scriptFileName = appConfig.botFactoryDir + 'local/Code/script_BOTs/' + commonJson.id;
                var scriptFolder = path.normalize(scriptFileName);
                mkdirp.sync(scriptFolder);
                scriptService.getScriptById(scriptDetail.scriptId, function (err, fileData) {
                    if (err) {
                        logger.error("Error in reading file: ", err);
                    } else {
                        scriptFileName = scriptFileName + '/' + fileData.fileName;
                        fileIo.writeFile(scriptFileName, fileData.file, null, function (err) {
                            if (err) {
                                logger.error("Error in Writing File:", err);
                            } else {
                                var params = '';
                                count++;
                                scriptDetail.scriptParameters.forEach(function (param) {
                                    commonJson.input.push({
                                        default: param.paramVal,
                                        type: param.paramType === "" ? "text" : param.paramType.toLowerCase(),
                                        label: param.paramDesc,
                                        name: param.paramDesc.toLowerCase().replace(/ /g,"_")
                                    })
                                    if(params === ''){
                                        params = '${' + param.paramDesc.toLowerCase().replace(/ /g,"_") + '}'
                                    }else{
                                        params = params + ' ${' + param.paramDesc.toLowerCase().replace(/ /g,"_") + '}'
                                    }
                                });
                                commonJson.execution.push({
                                    type: reqBody.scriptTypeName.toLowerCase(),
                                    os: reqBody.scriptTypeName === 'Bash' || reqBody.scriptTypeName === 'Python' ? "ubuntu" : "windows",
                                    stage: "Script",
                                    param: params,
                                    entrypoint: fileData.fileName
                                });
                                if(count ===reqBody.scriptDetails.length){
                                    ymlText = yml.stringify(commonJson);
                                    createYML()
                                }
                            }
                        });
                    }
                })
            })(reqBody.scriptDetails[i])
        }
    } else if (reqBody.type === 'jenkins') {
        commonJson.isParameterized = reqBody.isParameterized;
        commonJson.autoSync = reqBody.autoSyncFlag;
        commonJson.input.push(
            {
                default: reqBody.jenkinsServerId,
                type: 'list',
                label: 'Jenkins Server Name',
                name: 'jenkinsServerId'
            },
            {
                default: reqBody.jobName,
                type: 'text',
                label: 'Jenkins JOB Name',
                name: 'jenkinsJobName'
            },
            {
                default: reqBody.jobURL,
                type: 'text',
                label: 'Jenkins JOB URL',
                name: 'jenkinsJobURL'
            }
        )
        if (reqBody.isParameterized === true) {
            commonJson.input.push({
                default: reqBody.parameterized,
                type: 'list',
                label: 'Jenkins JOB Parameters',
                name: 'jenkinsJobParameters'
            })
            commonJson.execution.push({
                type: reqBody.type,
                param: "${jenkinsJobName} ${jenkinsServerId} ${jenkinsJobURL} ${jenkinsJobParameters}",
                entrypoint: reqBody.jobName,
                parameterized: reqBody.parameterized
            })
        } else {
            commonJson.execution.push({
                type: reqBody.type,
                param: "${jenkinsJobName} ${jenkinsServerId} ${jenkinsJobURL}",
                entrypoint: reqBody.jobName,
                jenkinsServerName: reqBody.jenkinsServerName
            })
        }
        commonJson.output.msgs.text = '${jenkinsJobName} job has successfully built on ${jenkinsServerName}';
        commonJson.output.msgs.mail = 'JenkinsJobName: ${jenkinsJobName} JenkinsServerName: ${jenkinsServerName}'

        ymlText = yml.stringify(commonJson);
        createYML()
    } else if (reqBody.type === 'chef') {
        if (reqBody.attributes && (reqBody.attributes !== null || reqBody.attributes.length > 0)) {
            var attributeObj = {}, jsonObjKey = '';
            reqBody.attributes.forEach(function (attribute) {
                if (Object.keys(attributeObj).length === 0) {
                    attributeObj = attribute.jsonObj;
                    jsonObjKey = Object.keys(attribute.jsonObj)[0];
                    var attrValObj = attribute.jsonObj[Object.keys(attribute.jsonObj)[0]];
                    var key = Object.keys(attrValObj)[0];
                    attributeObj[jsonObjKey][key] = '${' + key + '}';
                } else {
                    var attrValObj = attribute.jsonObj[Object.keys(attribute.jsonObj)[0]];
                    var key = Object.keys(attrValObj)[0];
                    attributeObj[jsonObjKey][key] = '${' + key + '}';
                }
                commonJson.input.push({
                    default: attrValObj[key],
                    type: 'text',
                    label: attribute.name,
                    name: key
                })
            });
            commonJson.execution.push({
                type: 'cookBook',
                os: reqBody.os ? reqBody.os : 'ubuntu',
                attributes: attributeObj,
                param: "${runlist} ${attributes}",
                runlist: reqBody.runlist,
                stage: reqBody.name
            })
        } else {
            commonJson.execution.push({
                type: 'cookBook',
                os: reqBody.os,
                attributes: null,
                param: "${runlist}",
                runlist: reqBody.runlist,
                stage: reqBody.name
            })
        }
        commonJson.output.logs.push('stdout');
        commonJson.output.msgs.text = 'Cookbook RunList ${runlist} has executed successful on Node ${node}';
        commonJson.output.msgs.mail = 'RunList: ${runlist} Node: ${node}'
        ymlText = yml.stringify(commonJson);
        createYML()
    } else if (reqBody.type === 'blueprints' || reqBody.type === 'blueprint') {
        if (reqBody.subType === 'aws_cf' || reqBody.subType === 'azure_arm') {
            commonJson.input.push(
                {
                    default: reqBody.stackName ? reqBody.stackName : null,
                    type: 'text',
                    label: 'Stack Name',
                    name: 'stackName'
                })
        } else {
            commonJson.input.push(
                {
                    default: reqBody.domainName ? reqBody.domainName : null,
                    type: 'text',
                    label: 'Domain Name',
                    name: 'domainName'
                })
        }
        commonJson.input.push(
            {
                default: reqBody.blueprintIds ? reqBody.blueprintIds : [],
                type: 'list',
                label: 'Blueprint Name',
                name: 'blueprintIds'
            },
            {
                default: reqBody.envId ? reqBody.envId : [],
                type: 'list',
                label: 'Environment Name',
                name: 'envId'
            },
            {
                default: reqBody.monitorId ? reqBody.monitorId : [],
                type: 'list',
                label: 'Monitor Name',
                name: 'monitorId'
            },
            {
                default: reqBody.tagServer ? reqBody.tagServer : [],
                type: 'list',
                label: 'Tag Server',
                name: 'tagServer'
            }
        )
        commonJson.execution.push({
            type: reqBody.type,
            name: reqBody.blueprintName,
            id: reqBody.blueprintId,
            category: getBlueprintType(reqBody.blueprintType)
        })
        commonJson.output.logs.push('stdout');
        commonJson.output.msgs.text = '${blueprintName} has successfully launched on env ${envId}';
        commonJson.output.msgs.mail = 'BlueprintName: ${blueprintName} EnvName: ${envId}';
        ymlText = yml.stringify(commonJson);
        createYML()
    }
    function createYML() {
        commonJson.category = reqBody.category;
        commonJson.orgId = reqBody.orgId;
        commonJson.orgName = reqBody.orgName;
        commonJson.source = "Catalyst";
        var ymlFolderName = appConfig.botFactoryDir + 'local/YAML';
        var ymlFileName = commonJson.id + '.yaml'
        var ymlFolder = path.normalize(ymlFolderName);
        mkdirp.sync(ymlFolder);
        async.waterfall([
            function (next) {
                fileIo.writeFile(ymlFolder + '/' + ymlFileName, ymlText, null, next);
            },
            function (next) {
                fileUpload.uploadFile(commonJson.id + '.yaml', ymlFolder + '/' + ymlFileName, null, next);
            }
        ], function (err, results) {
            if (err) {
                logger.error(err);
                callback(err, null);
                fileIo.removeFile(ymlFolder + '/' + ymlFileName, function (err, removeCheck) {
                    if (err) {
                        logger.error(err);
                    }
                    logger.debug("Successfully remove YML file");
                })
                fileIo.removeFile(scriptFileName, function (err, removeCheck) {if (err) {
                    logger.error(err);
                }
                    logger.debug("Successfully remove Script file");
                })
                return;
            } else {
                commonJson.ymlDocFileId = results;
                callback(null, commonJson);
                uploadFilesOnBotEngine(reqBody.orgId, function (err, data) {
                    if (err) {
                        logger.error("Error in uploading files at Bot Engine:", err);
                    }
                    return;
                })
            }
        });
    }
}

function getBlueprintType(type){
    var blueprintType = '';
    switch(type) {
        case 'chef':
            blueprintType ="Software Stack";
            break;
        case 'ami':
            blueprintType ="OS Image";
            break;
        case 'docker':
            blueprintType ="Docker";
            break;
        case 'arm':
            blueprintType ="ARM Template";
            break;
        case 'cft':
            blueprintType ="Cloud Formation";
            break;
        default:
            blueprintType ="Software Stack";
            break
    }
    return blueprintType;
}

function uploadFilesOnBotEngine(orgId,callback){
    async.waterfall([
        function (next) {
            var botRemoteServerDetails = {}
            masterUtil.getBotRemoteServerDetailByOrgId(orgId, function (err, botServerDetails) {
                if (err) {
                    logger.error("Error while fetching BOTs Server Details");
                    next(err, null);
                    return;
                } else if (botServerDetails !== null) {
                    botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                    botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                    next(null, botRemoteServerDetails);
                } else {
                    var error = new Error();
                    error.message = 'BOTs Remote Engine is not configured or not in running mode';
                    error.status = 403;
                    next(error, null);
                }
            });
        },
        function (botRemoteServerDetails, next) {
            var uploadCompress = appConfig.botFactoryDir + 'upload_compress.tar.gz';
            var upload = appConfig.botFactoryDir+'local';
            targz.compress({
                src: upload,
                dest: uploadCompress
            }, function (err) {
                if (err) {
                    next(err, null);
                } else {
                    var options = {
                        url: "http://" + botRemoteServerDetails.hostIP + ":" + botRemoteServerDetails.hostPort + "/bot/factory/upload",
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        formData: {
                            file: {
                                value: fs.readFileSync(uploadCompress),
                                options: {
                                    filename: uploadCompress,
                                    contentType: 'application/tar+gzip'
                                }
                            }
                        }
                    };
                    request.post(options, function (err, res, data) {
                        next(err, res)
                        fs.unlinkSync(uploadCompress);
                    });
                }
            });
        }
    ], function (err, res) {
        if (err) {
            logger.error("Unable to connect remote server");
            callback(err,null);
        }else{
            callback(null,null);
            return;
        }
    });

}



