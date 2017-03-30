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
var glob = require("glob");
var mkdirp = require('mkdirp');
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
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryToken + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.gitHubDir+formattedGitHub.repositoryName+'.tgz';
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'userName') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.gitHubDir+formattedGitHub.repositoryName+'.tgz';
                }else if(formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'sshKey') {
                    cmd = 'curl -u '+formattedGitHub.repositoryUserName+':'+formattedGitHub.repositoryPassword + ' -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.gitHubDir+formattedGitHub.repositoryName+'.tgz';
                }else{
                    cmd = 'curl -L https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/tarball/'+formattedGitHub.repositoryBranch + ' > '+appConfig.gitHubDir+formattedGitHub.repositoryName+'.tgz';
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
    var dest = glob.sync(appConfig.gitHubDir + gitHubId +'/*')[0]+'/Bots';
    var source = glob.sync(appConfig.gitHubDir + gitHubId +'.temp/*')[0]+'/Bots';
    var bots = [];
    if(reqBody && reqBody.length !== 0) {
        gitHubTempModel.gitFilesList(function(err,data) {
            if(err){
                callback(err, null);
                logger.error("Error in getting bot data from database.", err);  
            }else {
                for(var index = 0;index < reqBody.length;index++){
                    var botdata = data.filter(function(value){ return value.botName == reqBody[index].botName;})
                    if(botdata[0].gitHubId == gitHubId)
                    botdata[0].files.forEach(function(fileData){
                        if(reqBody[index].status){
                            var sourceFile = source+fileData.path+'/'+fileData.fileName;
                            var destFile = dest+fileData.path+'/'+fileData.fileName;
                            switch(fileData.state){
                                case 'added':
                                    if(!fs.existsSync(destFile)) {
                                        mkdirp(getDirName(destFile), function (err) {
                                            if(err){
                                                var err = new Error();
                                                err.status = 500;
                                                err.msg = 'path does not exists'
                                                return callback(err)
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
                                        return callback(err)
                                    }
                                break;
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
            }
        });
        botsNewService.syncBotsWithGitHub(gitHubId, function (err, data) {
            if (err) {
                callback(err, null);
                logger.error("Error in Syncing GIT-Hub.", err);
            } else {
                fse.removeSync(appConfig.gitHubDir + gitHubId +'.temp')
                callback(null, {gitHubDetails:gitHubId,botsDetails:bots});
                logger.debug("Git Hub importing is Done.");
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
                var cmdFull = cmd  +'https://api.github.com/repos/'+formattedGitHub.repositoryOwner+'/'+formattedGitHub.repositoryName+'/contents/Bots/'+result.botsDetails[0].type+'/'+result.botsDetails[0].id+'?ref='+formattedGitHub.repositoryBranch;
                gitHubSingleSync(formattedGitHub,cmdFull,cmd,function(err,res){
                    if(err){
                        callback(err,null);
                        return;
                    }else{
                        botsNewService.syncBotsWithGitHub(gitHubId, function (err, data) {
                            if (err) {
                                callback(err, null);
                                logger.error("Error in Syncing GIT-Hub.", err);
                            } else {
                                
                                callback(null, {gitHubDetails:gitHubId,botsDetails:botId});
                                logger.debug("Git Hub importing is Done.");
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
    var filePath = appConfig.gitHubDir +gitHubDetails.repositoryName+'.tgz';
    var destPath = appConfig.gitHubDir + gitHubDetails._id;
    var botpath = glob.sync(appConfig.gitHubDir + gitHubDetails._id+'/*')[0]+'/Bots';
    var options = {compareContent: true,excludeFilter:'*.md',skipSymlinks:true};
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath)
    }
    if(task && task === 'sync'){
        if(fs.existsSync(destPath)){
            fse.removeSync(destPath)
        }
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
                            botsNewService.syncBotsWithGitHub(gitHubDetails._id, function (err, data) {
                                if (err) {
                                    callback(err, null);
                                    logger.error("Error in Syncing GIT-Hub.", err);
                                } else {
                                    var botsDetails = [];
                                    for(var i=1;i<data.length;i++){
                                        botsDetails.push(data[i].id);
                                    }
                                    callback(null, {botsDetails:botsDetails});
                                    logger.debug("Git Hub Sync is Done.");
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
                        dircompare.compare(botpath, glob.sync(destPath + '/*')[0]+'/Bots', options).then(function(res){
                            var result = [],fileName =null,path =null;
                            res.diffSet.forEach(function (entry) {
                                if(entry.type1 === 'file' || entry.type2 ==='file'){
                                    var botName = entry.relativePath.split("/").slice(-1)[0]
                                    var state = '',fileName = '',path ='';
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
                                gitHubTempModel.gitFilesInsert(result,function(err,data) {
                                if(err){
                                    callback(err, null);
                                    logger.error("Error in Creating data in database.", err);  
                                }
                                for(var i=0;i<data.length;i++){
                                    botsDetails.push(data[i].botName);
                                }
                                callback(null, {result:botsDetails});
                            });
                            }else{
                                callback(null, {result:[]});
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
    execCmd(cmdFull, function (err, out, code) {
        var filepath = glob.sync(appConfig.gitHubDir + gitHubDetails._id+'/*')[0]+'/';
        if(code === 0 && out.trim() !== '404: Not Found'){
            var response = JSON.parse(out);
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
                    execCmd(cmd+response[index].url,function(err,out,code) {
                        if(code === 0 && out.trim() !== '404: Not Found'){
                            var fileres = JSON.parse(out);
                            var destFile = filepath+fileres.path;
                            if(!fs.existsSync(destFile)) {
                                mkdirp(getDirName(destFile), function (err) {
                                    if(err){
                                        var err = new Error();
                                        err.status = 500;
                                        err.msg = 'path does not exists'
                                        return callback(err)
                                    } else{
                                        fs.writeFileSync(destFile,new Buffer(fileres.content, fileres.encoding).toString())
                                    }
                                });
                            } else {
                                fs.writeFileSync(destFile,new Buffer(fileres.content, fileres.encoding).toString());
                            }
                        }else{
                            var err = new Error();
                            err.status = 400;
                            err.msg = 'File not found';
                            callback(err, null);
                        }
                    });
                }
            }
            callback(null,gitHubDetails)
        }else{
            var err = new Error('Invalid Git-Hub Credentials Details');
            err.status = 400;
            err.msg = 'Invalid Git-Hub Details';
            callback(err, null);
        }
    });
}
