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
var gitHubModel = require('_pr/model/github/github.js');
var gitHubTempModel = require('_pr/model/github/githubTemp.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileUpload = require('_pr/model/file-upload/file-upload');
var targz = require('targz');
var async = require('async');
var execCmd = require('exec');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var botsNewService = require("_pr/services/botsNewService.js");
var fs = require('fs');
var dircompare = require('dir-compare');
var botsDao = require('_pr/model/bots/1.1/botsDao.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var glob = require("glob");
var mkdirp = require('mkdirp');
var request = require('request');
var getDirName = require('path').dirname;
var gitGubService = module.exports = {};

gitGubService.checkIfGitHubExists = function checkIfGitHubExists(gitHubId, callback) {
    gitHubModel.getById(gitHubId, function (err, gitHub) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!gitHub) {
            var err = new Error('Git-Hub not found');
            err.status = 404;
            return callback(err);
        } else {
            return callback(null, gitHub);
            
        }
    });
};


gitGubService.createGitHub = function createGitHub(gitHubObj, callback) {
    if(gitHubObj.repositoryType === 'Private' && gitHubObj.authenticationType === 'userName'){
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        gitHubObj.repositoryPassword =  cryptography.encryptText(gitHubObj.repositoryPassword, cryptoConfig.encryptionEncoding,
            cryptoConfig.decryptionEncoding);
    }
    gitHubModel.createNew(gitHubObj, function (err, gitHub) {
        if (err && err.name === 'ValidationError') {
            var err = new Error('Bad Request');
            err.status = 400;
            callback(err);
        } else if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, gitHub);
        }
    });
};

gitGubService.updateGitHub = function updateGitHub(gitHubId, gitHubObj, callback) {
    if(gitHubObj.repositoryType === 'Private' && gitHubObj.authenticationType === 'userName'){
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        gitHubObj.repositoryPassword =  cryptography.encryptText(gitHubObj.repositoryPassword, cryptoConfig.encryptionEncoding,
            cryptoConfig.decryptionEncoding);
    }
    gitHubModel.updateGitHub(gitHubId, gitHubObj, function (err, gitHub) {
        if (err && err.name === 'ValidationError') {
            var err = new Error('Bad Request');
            err.status = 400;
            callback(err);
        } else if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, gitHub);
        }
    });
};

gitGubService.deleteGitHub = function deleteGitHub(gitHubId, callback) {
    gitHubModel.deleteGitHub(gitHubId, function (err, gitHub) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else {
            return callback(null, gitHub);
        }
    });
};

gitGubService.getGitHubSync = function getGitHubSync(gitHubId,task, callback) {
    gitHubModel.getGitHubById(gitHubId, function (err, gitHub) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!gitHub) {
            var err = new Error('Git-Hub not found');
            err.status = 404;
            return callback(err);
        } else{
            formatGitHubResponse(gitHub,function(formattedGitHub){
                var cmd;
                if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'token') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryToken + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.botFactoryDir+formattedGitHub.repositoryName+'.tgz';
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'userName') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.botFactoryDir+formattedGitHub.repositoryName+'.tgz';
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'sshKey') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.botFactoryDir+formattedGitHub.repositoryName+'.tgz';
                }else{
                    cmd = 'curl -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.botFactoryDir+formattedGitHub.repositoryName+'.tgz';
                }
                gitHubCloning(formattedGitHub,task,cmd,function(err,res){
                    if(err){
                        callback(err,null);
                        return;
                    }else{
                        callback(null,res);
                        return;
                    }
                });
            })
        }
    });
};

gitGubService.getGitHubList = function getGitHubList(query, callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.changeRequestForJqueryPagination(query, next);
        },
        function(filterQuery,next) {
            reqData = filterQuery;
            apiUtil.paginationRequest(filterQuery, 'gitHub', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['name', 'repositoryType', 'repositoryURL'];
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            gitHubModel.getGitHubList(queryObj, next);
        },
        function(gitHubList, next) {
            if (gitHubList.docs.length > 0) {
                var formattedResponseList = [];
                for (var i = 0; i < gitHubList.docs.length; i++) {
                    formatGitHubResponse(gitHubList.docs[i],function(formattedData){
                        formattedResponseList.push(formattedData);
                        if (formattedResponseList.length === gitHubList.docs.length) {
                            gitHubList.docs = formattedResponseList;
                            next(null,gitHubList);
                        }
                    });
                }
            } else {
                next(null,gitHubList);
            }
        },
        function(formattedGitHubResponseList, next) {
            apiUtil.changeResponseForJqueryPagination(formattedGitHubResponseList, reqData, next);
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results)
        return;
    });
};

gitGubService.getGitHubById = function getGitHubById(gitHubId, callback) {
    gitHubModel.getGitHubById(gitHubId, function (err, gitHub) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!gitHub) {
            var err = new Error('Git-Hub not found');
            err.status = 404;
            return callback(err);
        } else{
            formatGitHubResponse(gitHub,function(formattedData){
                callback(null, formattedData);
            });
        }
    });
};

gitGubService.gitHubCopy = function gitHubCopy(gitHubId, reqBody,callback) {
    var dest = appConfig.botCurrentFactoryDir;
    var source = glob.sync(appConfig.botFactoryDir + gitHubId +'.temp/*')[0];
    var upload = appConfig.botFactoryDir+'upload';
    if(!fs.existsSync(upload))
        mkdirp.sync(upload);
    if(reqBody && reqBody.length !== 0) {
        var bots = [];
        gitHubTempModel.gitFilesList(gitHubId,function(err,data) {
            if(err){
                return callback(err, null);
                logger.error("Error in getting bot data from database.", err);  
            }else {
                for(var index = 0;index < reqBody.length;index++){
                    var botdata = data.filter(function(value){ return value.botName == reqBody[index].botName;})
                    if(botdata[0].gitHubId == gitHubId)
                    botdata[0].files.forEach(function(fileData){
                        if(reqBody[index].status){
                            var sourceFile = source+fileData.path+'/'+fileData.fileName;
                            var destFile = dest+fileData.path+'/'+fileData.fileName;
                            var uploadFile = upload+fileData.path+'/'+fileData.fileName;
                            switch(fileData.state){
                                case 'added':
                                    if(!fs.existsSync(destFile)) {
                                        mkdirp(getDirName(destFile), function (err) {
                                            if(err){
                                                var err = new Error();
                                                err.status = 500;
                                                err.msg = 'path does not exists'
                                                return callback(err,null)
                                            } else{
                                                fs.createReadStream(sourceFile).pipe(fs.createWriteStream(destFile));
                                            }
                                        })
                                    }
                                break;
                                case 'updated':
                                    if(fs.existsSync(sourceFile) && fs.existsSync(destFile)) {
                                        fs.createReadStream(sourceFile).pipe(fs.createWriteStream(destFile));
                                    }else {
                                        var err = new Error();
                                        err.status = 500;
                                        err.msg = 'File does not exists'
                                        return callback(err,null);
                                    }
                                break;
                            }
                            if(!fs.existsSync(uploadFile)) {
                                mkdirp(getDirName(uploadFile), function (err) {
                                    if(err){
                                        var err = new Error();
                                        err.status = 500;
                                        err.msg = 'path does not exists'
                                        return callback(err,null)
                                    } else{
                                        fs.createReadStream(sourceFile).pipe(fs.createWriteStream(uploadFile));
                                    }
                                })
                            }
                        }else {
                            if(fileData.state === 'deleted'){
                                var filePath = dest+fileData.path+fileName;
                                if(fs.existsSync(filePath)){
                                    fs.unlinkSync(filePath)
                                }
                            }
                        }
                    });
                    bots.push(reqBody[index].botName);
                }
                botsNewService.syncBotsWithGitHub(gitHubId, function (err, data) {
                    if (err) {
                        callback(err,null)
                        logger.error("Error in Syncing GIT-Hub.", err);
                    } else {
                        gitHubTempModel.gitFilesdelete(gitHubId, function(err){
                            if(err){
                                callback(err,null)
                                logger.error("Error in clearing GIT-Hub data.", err);
                            }
                        });
                        fse.removeSync(appConfig.botFactoryDir + gitHubId +'.temp');
                        logger.debug("Git Hub importing is Done.");
                        callback(null, {gitHubDetails:gitHubId,botsDetails:bots});
                    }
                });
                async.waterfall([
                    function(next) {
                        gitHubModel.getById(gitHubId,function(err,gitdata){
                            if(err)
                                next(err,null);
                            else {
                                next(null,gitdata.orgId);
                            }
                        });
                    },
                    function(orgId,next) {
                        var botRemoteServerDetails = {}
                        masterUtil.getBotRemoteServerDetailByOrgId(orgId,function(err,botServerDetails) {
                            if (err) {
                                logger.error("Error while fetching BOTs Server Details");
                                next(err, null);
                                return;
                            } else if (botServerDetails !== null && botServerDetails.active !== false) {
                                botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                                botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                            } else {
                                botRemoteServerDetails.hostIP = "localhost";
                                botRemoteServerDetails.hostPort = "2687";
                            }
                            next(null,botRemoteServerDetails);
                        });
                    },
                    function(botRemoteServerDetails,next){
                        var uploadCompress=appConfig.botFactoryDir+'upload_compress.tar.gz'
                        targz.compress({
                            src: upload,
                            dest: uploadCompress
                        }, function(err){
                            if(err) {
                                next(err,null);
                            } else {
                                var options = {
                                    url: "http://"+botRemoteServerDetails.hostIP+":"+botRemoteServerDetails.hostPort+"/bot/factory/upload",
                                    headers: {
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    formData:{
                                        file:{
                                            value: fs.readFileSync(uploadCompress),
                                            options:{
                                                filename:uploadCompress,
                                                contentType:'application/tar+gzip'
                                            }
                                        }
                                    }
                                };
                                request.post(options,function(err,res,data){
                                    next(err,res)
                                    fs.unlinkSync(uploadCompress);
                                    fse.removeSync(upload);
                                });
                            } 
                        });
                    }
                ],function(err,res){
                    if(err){
                        logger.error("Unable to connect remote server")
                    }
                });
            }
        }); 
    }else {
        var err = new Error();
        err.status = 400;
        err.msg = 'No files to copy'
        return callback(err);
    }
}

gitGubService.gitHubContentSync = function gitHubContentSync(gitHubId, botId,callback) {
    async.parallel({
        gitHub:function(callback){
            gitHubModel.getGitHubById(gitHubId,callback);
        },
        botsDetails:function(callback){
            botsDao.getBotsByBotId(botId,callback);
        }
    },function(err,result) {
        if(err){
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!result.gitHub || !result.botsDetails) {
            var err = new Error('Data not found');
            err.status = 404;
            return callback(err);
        } else {
            formatGitHubResponse(result.gitHub,function(formattedGitHub){
                var cmd;
                if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'token') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryToken+' -L ' ;
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'userName') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword+' -L ' ;
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'sshKey') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword+' -L ' ;
                }else{
                    cmd = 'curl -L '
                }
                async.parallel([
                    function(callback) {
                        if(result.botsDetails[0].type ==='script') {
                            var cmdFull = cmd + 'https://api.github.com/repos/' + formattedGitHub.repositoryOwner + '/' + formattedGitHub.repositoryName + '/contents/Code/Script_BOTs/' + result.botsDetails[0].id + '?ref=' + formattedGitHub.repositoryBranch;
                            gitHubSingleSync(formattedGitHub, cmdFull, cmd, callback);
                        }else{
                            callback(null,result.botsDetails[0]);
                        }
                    },
                    function(callback) {
                        var cmdFull = cmd  +'https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/contents/YAML/'+result.botsDetails[0].id+'.yaml?ref='+formattedGitHub.repositoryBranch;
                        gitHubSingleSync(formattedGitHub,cmdFull,cmd,callback);
                    }
                ],function(err,res){
                    if(err){
                        callback(err,null);
                        return;
                    }else{
                        botsNewService.syncSingleBotsWithGitHub(botId, function (err, data) {
                            if (err) {
                                logger.error("Error in Syncing GIT-Hub.", err);
                                callback(err, null);
                                return;
                            } else {
                                logger.debug("Git Hub importing is Done.");
                                callback(null, {gitHubDetails:gitHubId,botsDetails:botId});
                                return;
                            }
                        });
                        async.waterfall([
                            function(next) {
                                var botRemoteServerDetails = {}
                                masterUtil.getBotRemoteServerDetailByOrgId(formattedGitHub.orgId,function(err,botServerDetails) {
                                    if (err) {
                                        logger.error("Error while fetching BOTs Server Details");
                                        next(err, null);
                                        return;
                                    } else if (botServerDetails !== null && botServerDetails.active !== false) {
                                        botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                                        botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                                    } else {
                                        botRemoteServerDetails.hostIP = "localhost";
                                        botRemoteServerDetails.hostPort = "2687";
                                    }
                                    next(null,botRemoteServerDetails);
                                });
                            },
                            function(botRemoteServerDetails,next){
                                var upload = appConfig.botFactoryDir +'upload';
                                var uploadCompress=appConfig.botFactoryDir+'upload_compress.tar.gz'
                                if(fs.existsSync(uploadCompress))
                                    fs.unlinkSync(uploadCompress)
                                targz.compress({
                                    src: upload,
                                    dest: uploadCompress
                                }, function(err){
                                    if(err) {
                                        next(err,null);
                                    } else {
                                        var options = {
                                            url: "http://"+botRemoteServerDetails.hostIP+":"+botRemoteServerDetails.hostPort+"/bot/factory/upload",
                                            headers: {
                                                'Content-Type': 'multipart/form-data'
                                            },
                                            formData:{
                                                file:{
                                                    value: fs.readFileSync(uploadCompress),
                                                    options:{
                                                        filename:uploadCompress,
                                                        contentType:'application/tar+gzip'
                                                    }
                                                }
                                            }
                                        };
                                        request.post(options,function(err,res,data){
                                            next(err,res);
                                            fs.unlinkSync(uploadCompress);
                                            fse.removeSync(upload);
                                        });
                                    } 
                                });
                            }
                        ],function(err,res){
                            if(err){
                                logger.error("Unable to connect remote server")
                            }
                        });
                    }
                });
            })
        }
    })
}

function formatGitHubResponse(gitHub,callback) {
    var formatted = {
        _id:gitHub._id,
        repositoryName:gitHub.repositoryName,
        repositoryDesc:gitHub.repositoryDesc,
        repositoryOwner:gitHub.repositoryOwner,
        repositoryType:gitHub.repositoryType,
        repositoryBranch:gitHub.repositoryBranch
    };
    if (gitHub.organization.length) {
        formatted.orgId = gitHub.organization[0].rowid;
        formatted.orgName=gitHub.organization[0].orgname;
    }
    if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'userName') {
        formatted.repositoryUserName = gitHub.repositoryUserName;
        formatted.authenticationType = gitHub.authenticationType;
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        formatted.repositoryPassword =  cryptography.decryptText(gitHub.repositoryPassword, cryptoConfig.decryptionEncoding,
            cryptoConfig.encryptionEncoding);
        callback(formatted);
    }else if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'sshKey') {
        formatted.authenticationType = gitHub.authenticationType;
        fileUpload.getReadStreamFileByFileId(gitHub.repositorySSHPublicKeyFileId,function(err,publicKeyFile){
            if(err){
                var err = new Error('Internal server error');
                err.status = 500;
                logger.error(err);
            }
            formatted.repositorySSHPublicKeyFileId = gitHub.repositorySSHPublicKeyFileId;
            formatted.repositorySSHPublicKeyFileName = publicKeyFile.fileName;
            formatted.repositorySSHPublicKeyFileData = publicKeyFile.fileData;
            fileUpload.getReadStreamFileByFileId(gitHub.repositorySSHPrivateKeyFileId,function(err,privateKeyFile){
                if(err){
                    var err = new Error('Internal server error');
                    err.status = 500;
                    logger.error(err);
                }
                formatted.repositorySSHPrivateKeyFileId = gitHub.repositorySSHPrivateKeyFileId;
                formatted.repositorySSHPrivateKeyFileName = privateKeyFile.fileName;
                formatted.repositorySSHPrivateKeyFileData = privateKeyFile.fileData;
                callback(formatted);
            });
        });
    }else if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'token') {
        formatted.repositoryUserName = gitHub.repositoryUserName;
        formatted.authenticationType = gitHub.authenticationType;
        formatted.repositoryToken = gitHub.repositoryToken;
        callback(formatted);
    }else {
        formatted.authenticationType = gitHub.authenticationType;
        callback(formatted);
    }
}

function gitHubCloning(gitHubDetails,task,cmd,callback){
    var filePath = appConfig.botFactoryDir +gitHubDetails.repositoryName+'.tgz';
    var destPath = appConfig.botFactoryDir + gitHubDetails._id;
    var botFactoryDirPath = appConfig.botFactoryDir;
    var botCurrentFactoryDirPath = appConfig.botCurrentFactoryDir;                                
    var options = {compareContent: true,excludeFilter:'*.md',skipSymlinks:true};
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath)
    }
    if(task && task === 'sync'){
        execCmd(cmd, function (err, out, code) {
            if (code === 0) {
                targz.decompress({
                    src: filePath,
                    dest: destPath
                }, function (err) {
                    if (err) {
                        logger.error("Error in Extracting Files ", err);
                        callback(err, null);
                    } else {
                        gitHubModel.updateGitHub(gitHubDetails._id, {isRepoCloned: true}, function (err, gitHub) {
                            if (err) {
                                logger.error(err);
                            }
                            logger.debug("GIT Repository Clone is Done.");
                            fs.unlinkSync(filePath);
                            fse.removeSync(botCurrentFactoryDirPath);
                            var copydir = require('copy-dir');
                            copydir(glob.sync(destPath+'/*')[0], botCurrentFactoryDirPath, function (err) {
                                if (err) {
                                    logger.error("Error in copy Directory  to BOTs. ", err);
                                    callback(err, null);
                                } else {
                                    if(fs.existsSync(destPath)){
                                        fse.removeSync(destPath)
                                    }
                                    botsNewService.syncBotsWithGitHub(gitHubDetails._id, function (err, data) {
                                        if (err) {
                                            callback(err, null);
                                            logger.error("Error in Syncing GIT-Hub.", err);
                                        } else {
                                            var botsDetails = [];
                                            for (var i = 1; i < data.length; i++) {
                                                botsDetails.push(data[i].id);
                                            }
                                            callback(null, {botsDetails: botsDetails});
                                            logger.debug("Git Hub Sync is Done.");
                                        }
                                    });
                                    async.waterfall([
                                        function(next) {
                                            var botRemoteServerDetails = {}
                                            masterUtil.getBotRemoteServerDetailByOrgId(gitHubDetails.orgId,function(err,botServerDetails) {
                                                if (err) {
                                                    logger.error("Error while fetching BOTs Server Details");
                                                    next(err, null);
                                                    return;
                                                } else if (botServerDetails !== null && botServerDetails.active !== false) {
                                                    botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                                                    botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                                                } else {
                                                    botRemoteServerDetails.hostIP = "localhost";
                                                    botRemoteServerDetails.hostPort = "2687";
                                                }
                                                next(null,botRemoteServerDetails);
                                            });
                                        },
                                        function(botRemoteServerDetails,next){
                                            var postData  = {
                                                "username":gitHubDetails.repositoryUserName, 
                                                "password":gitHubDetails.repositoryPassword, 
                                                "branch":gitHubDetails.repositoryBranch, 
                                                "repo":gitHubDetails.repositoryOwner+'/'+gitHubDetails.repositoryName};
                                            var options = {
                                                url: "http://"+botRemoteServerDetails.hostIP+":"+botRemoteServerDetails.hostPort+"/bot/factory",
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                json:postData
                                            };
                                            request.post(options,function(err,res,body){
                                                next(err,res);
                                            })
                                            
                                        }
                                    ],function(err,res){
                                        if(err){
                                            logger.error("Unable to connect remote server")
                                        }
                                    });
                              }
                            });
                        });
                    }
                });
            }else{
                var err = new Error('Invalid Git-Hub Credentials Details');
                err.status = 400;
                err.msg = 'Invalid Git-Hub Details';
                callback(err, null);
            }
        });
    }else {
        execCmd(cmd, function (err, out, code) {
            destPath = destPath + '.temp';
            if (code === 0) {
                if(fs.existsSync(destPath)){
                    fse.removeSync(destPath)
                }
                targz.decompress({
                    src: filePath,
                    dest: destPath
                }, function (err) {
                    if (err) {
                        logger.error("Error in Extracting Files ", err);
                        callback(err, null);
                    } else {
                        logger.debug("GIT Repository comparing");
                        dircompare.compare(botCurrentFactoryDirPath, glob.sync(destPath + '/*')[0], options).then(function(res){
                            var result = [];
                            res.diffSet.forEach(function (entry) {
                                if(entry.type1 === 'file' || entry.type2 ==='file'){
                                    var state = '',fileName = '',path ='',botName = '';
                                    switch (entry.state) {
                                        case 'left':
                                            state = 'deleted';
                                            fileName = entry.name1;
                                            path = entry.relativePath;
                                        break;
                                        case 'right':
                                            state = 'added';
                                            fileName = entry.name2;
                                            path = entry.relativePath;
                                        break;
                                        case 'distinct':
                                            state = 'updated';
                                            fileName = entry.name2;
                                            path = entry.relativePath;
                                        break;
                                        default:
                                            state = 'equal';
                                            fileName = entry.name2;
                                            path = entry.relativePath;
                                        break;
                                    }
                                    if(state === 'equal'){
                                        return;
                                    }
                                    if(fileName.split(".").slice(-1)[0] === 'yaml'){
                                        botName = fileName.split(".")[0]
                                    }else {
                                        botName = entry.relativePath.split("/")[3]
                                    }
                                    var botdata = result.filter(function(value){ return value.botName == botName;})
                                    if(result.length &&  botdata.length){
                                        botdata[0].files.push({fileName:fileName,state:state,path:path})
                                    }else {
                                        result.push({botName:botName,gitHubId:gitHubDetails._id,files:[{fileName:fileName,state:state,path:path}]})
                                    }
                                    
                                }
                            });
                            var botsDetails = [];
                            if(result.length){
                                gitHubTempModel.gitFilesdelete(gitHubDetails._id, function(err){
                                    if(err){
                                        callback(err,null)
                                        logger.error("Error in clearing GIT-Hub data.", err);
                                    }
                                });
                                gitHubTempModel.gitFilesInsert(result,function(err,data) {
                                if(err){
                                    callback(err, null);
                                    logger.error("Error in Creating data in database.", err);  
                                }
                                for(var i=0;i<data.length;i++){
                                    botsDetails.push(data[i]);
                                }
                                callback(null, {gitHub:{Id:gitHubDetails._id,repoName:gitHubDetails.repositoryName}, result:botsDetails});
                            });
                            }else{
                                callback(null, {gitHub:{Id:gitHubDetails._id,repoName:gitHubDetails.repositoryName}, result:botsDetails});
                            }
                            fs.unlinkSync(filePath)
                        }).catch(function(error){
                            var err = new Error('Invalid Files');
                            err.status = 500;
                            err.msg = 'Unable to compare';
                            callback(err, null);
                        })
                    }
                });
            }else{
                var err = new Error('Invalid Git-Hub Credentials Details');
                err.status = 400;
                err.msg = 'Invalid Git-Hub Details';
                callback(err, null);
            }
        });
    }
}
function gitHubSingleSync(gitHubDetails,cmdFull,cmd,callback) {
    var filepath = appConfig.botCurrentFactoryDir;
    var upload = appConfig.botFactoryDir+'upload/';
    if(fs.existsSync(upload))
        fse.removeSync(upload);
    execCmd(cmdFull, function (err, out, code) {
        if(code === 0 && out.trim() !== '404: Not Found'){
            var response = JSON.parse(out);
            if(response.length){
                for (var index = 0; index < response.length; index++) {
                    if(response[index].type === 'dir'){
                        gitHubSingleSync(gitHubDetails,cmd+response[index].url,cmd,function(err,data){
                            if(err) {
                                callback(err,null)
                            } else{
                                callback(null,data)
                            }
                        });
                    }else{
                        writeFile(cmd+response[index].url,function(err,res){
                            if(err) {
                                callback(err,null)
                            } else{
                                callback(null,res)
                            }
                        })
                    }
                }
            }else {
                writeFile(cmd+response.url,function(err,res){
                    if(err) {
                        callback(err,null)
                    } else{
                        callback(null,res)
                    }
                })
            }
        }else{
            var err = new Error('Invalid Git-Hub Credentials Details');
            err.status = 400;
            err.msg = 'Invalid Git-Hub Details';
            callback(err, null);
            return;
        }
    });
    function writeFile(cmd,callback){
        execCmd(cmd,function(err,out,code) {
            if(code === 0 && out.trim() !== '404: Not Found'){
                var fileres = JSON.parse(out);
                var destFile = filepath+fileres.path;
                var uploadFile = upload+fileres.path;
                async.parallel([
                    function(callback) {
                        if(!fs.existsSync(destFile)) {
                            mkdirp(getDirName(destFile), function (err) {
                                if(err){
                                    logger.error(err);
                                } else{
                                    fs.writeFile(destFile,new Buffer(fileres.content, fileres.encoding).toString(),callback);
                                }
                            });
                        } else {
                            fs.writeFile(destFile,new Buffer(fileres.content, fileres.encoding).toString(),callback);
                        }
                    },
                    function(callback) {
                        if(!fs.existsSync(uploadFile)) {
                            mkdirp(getDirName(uploadFile), function (err) {
                                if(err){
                                    logger.error(err);
                                } else{
                                    fs.writeFile(uploadFile,new Buffer(fileres.content, fileres.encoding).toString(),callback);
                                }
                            });
                        } else {
                            fs.writeFile(uploadFile,new Buffer(fileres.content, fileres.encoding).toString(),callback);
                        }
                    }
                ],function(err){
                    if(err){
                        callback(err,null);
                        return;
                    }else{
                        callback(null,gitHubDetails);
                        return;
                    }
                });
            }else{
                logger.debug("Individual Sync is going on");
            }
        });
    }
}
