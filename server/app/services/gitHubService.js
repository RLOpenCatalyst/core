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
var execCmd = require('child_process').exec;
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
var botService = require("_pr/services/botService.js");
var fs = require('fs');
var dircompare = require('dir-compare');
var botDao = require('_pr/model/bots/1.1/bot.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var glob = require("glob");
var mkdirp = require('mkdirp');
var request = require('request');
var getDirName = require('path').dirname;
var gitGubService = module.exports = {};
var settingService = require('_pr/services/settingsService');
var yamljs = require('yamljs');
var globalData = require('_pr/config/global-data.js');
var copy = require('copy-dir');
var noticeService = require('_pr/services/noticeService.js');


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
    if (gitHubObj.repositoryType === 'Private' && gitHubObj.authenticationType === 'userName') {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        gitHubObj.repositoryPassword = cryptography.encryptText(gitHubObj.repositoryPassword, cryptoConfig.encryptionEncoding,
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
    if (gitHubObj.repositoryType === 'Private' && gitHubObj.authenticationType === 'userName') {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        gitHubObj.repositoryPassword = cryptography.encryptText(gitHubObj.repositoryPassword, cryptoConfig.encryptionEncoding,
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

gitGubService.getGitHubSync = function getGitHubSync(gitHubId, query, callback) {
    if (globalData.getGit(gitHubId) && query.action === 'list') {
        getSyncedBots(gitHubId, query, callback)
    } else if (globalData.getGit(gitHubId) && query.action === 'sync') {
        var err = new Error('Sync is in progess');
        err.status = 400;
        return callback(err, true);
    } else if (globalData.getGit(gitHubId) && query.action === 'cancel') {
        globalData.unSetGit(gitHubId);
        callback(null, true);
    } else if (!globalData.getGit(gitHubId) && query.action === 'sync') {
        gitHubModel.getGitHubById(gitHubId, function (err, gitHub) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                return callback(err);
            } else if (!gitHub) {
                var err = new Error('Git-Hub not found');
                err.status = 404;
                return callback(err);
            } else {
                formatGitHubResponse(gitHub, function (formattedGitHub) {
                    var cmd;
                    if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'token') {
                        cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryToken + ' -L ';
                    } else if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'userName') {
                        cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryPassword + ' -L ';
                    } else if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'sshKey') {
                        cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryPassword + ' -L ';
                    } else {
                        cmd = 'curl -L ';
                    }
                    cmd += 'https://api.github.com/repos/' + formattedGitHub.repositoryOwner + '/' + formattedGitHub.repositoryName + '/tarball/' + formattedGitHub.repositoryBranch + ' > ' + appConfig.botFactoryDir + formattedGitHub.repositoryName + '.tgz';
                    gitHubCloning(formattedGitHub, cmd, function (err, res) {
                        if (err) {
                            logger.error("Unable to Clone the Repo " + err);
                            return callback(err, null);
                        } else {
                            globalData.setGit(gitHubId);
                            getSyncedBots(gitHubId, query, callback)
                        }
                    });
                })
            }
        });
    } else {
        return callback(null, true);
    }
};

gitGubService.getGitHubList = function getGitHubList(query, userName, callback) {
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.changeRequestForJqueryPagination(query, next);
        },
        function (filterQuery, next) {
            reqData = filterQuery;
            apiUtil.paginationRequest(filterQuery, 'gitHub', next);
        },
        function (paginationReq, next) {
            paginationReq['searchColumns'] = ['name', 'repositoryType', 'repositoryURL'];
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            settingService.getOrgUserFilter(userName, function (err, orgIds) {
                if (err) {
                    next(err, null);
                } else if (orgIds.length > 0) {
                    queryObj.queryObj['orgId'] = {
                        $in: orgIds
                    };
                    gitHubModel.getGitHubList(queryObj, next);
                } else {
                    gitHubModel.getGitHubList(queryObj, next);
                }
            });
        },
        function (gitHubList, next) {
            if (gitHubList.docs.length > 0) {
                var formattedResponseList = [];
                for (var i = 0; i < gitHubList.docs.length; i++) {
                    formatGitHubResponse(gitHubList.docs[i], function (formattedData) {
                        formattedResponseList.push(formattedData);
                        if (formattedResponseList.length === gitHubList.docs.length) {
                            gitHubList.docs = formattedResponseList;
                            next(null, gitHubList);
                        }
                    });
                }
            } else {
                next(null, gitHubList);
            }
        },
        function (formattedGitHubResponseList, next) {
            apiUtil.changeResponseForJqueryPagination(formattedGitHubResponseList, reqData, next);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, results)
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
        } else {
            formatGitHubResponse(gitHub, function (formattedData) {
                callback(null, formattedData);
            });
        }
    });
};

gitGubService.gitHubCopy = function gitHubCopy(gitHubId, reqBody, userName, callback) {
    var dest = appConfig.botFactoryDir + 'gitHub/';
    var source = glob.sync(appConfig.botFactoryDir + gitHubId + '/*')[0];
    var upload = appConfig.botFactoryDir + 'upload/';
    if (reqBody && reqBody.length !== 0) {
        async.waterfall([
            function (next) {
                fs.exists(upload, (exists) => {
                    if (!exists) {
                        mkdirp(upload, (err, made) => {
                            if (err)
                                next(err);
                            else
                                next(null);
                        })
                    } else
                        next(null);
                })
            },
            function (next) {
                gitHubTempModel.getAllBots(gitHubId, (err, botList) => {
                    if (err) {
                        next(null);
                        logger.error("Error in getting bot data from database.", err);
                    } else {
                        async.each(reqBody, function (bot, callback) {
                            var botdata = botList.filter(function (value) {
                                return value.id == bot;
                            })[0]
                            var destPath = dest + botdata.id;
                            var sourceCode = source + '/Code/' + botdata.type + '_BOTs/' + botdata.id;
                            if (botdata.status === 'new' || botdata.status === 'modified') {
                                fs.exists(destPath, (exists) => {
                                    if (!exists) {
                                        mkdirp(destPath, (err, made) => {
                                            if (err)
                                                callback(err);
                                            else {
                                                copyToCurrent(sourceCode, source, destPath, upload, 1, botdata.id, callback);
                                            }
                                        })
                                    } else {
                                        getMaxVersion(destPath, (versionNum) => {
                                            copyToCurrent(sourceCode, source, destPath, upload, versionNum, botdata.id, callback)
                                        })
                                    }
                                })
                            } else {
                                getMaxVersion(destPath, (versionNum) => {
                                    fs.exists(destPath + '/ver_' + versionNum, (isAval) => {
                                        if (!isAval) {
                                            mkdirp(destPath + '/ver_' + versionNum, (err, made) => {
                                                if (err)
                                                    callback(err);
                                                else {
                                                    if (fs.existsSync(destPath + '/current'))
                                                        fs.unlinkSync(destPath + '/current');
                                                    fs.symlink(destPath + '/ver_' + versionNum, destPath + '/current', function (err) {
                                                        if (err)
                                                            callback('Unable to create symlink to new version folder');
                                                        else {
                                                            copyUpload(upload, destPath + '/ver_' + versionNum, botdata.id);
                                                            callback(null);
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                        }, function (err) {
                            fse.remove(appConfig.botFactoryDir + gitHubId, (err) => {
                                if (err)
                                    next(err);
                                else
                                    next(null);
                            });
                        })
                    }
                })
            },
            function (next) {
                async.parallel([
                    function (callback) {
                        botService.syncBotsWithGitHub(gitHubId, function (err, data) {
                            if (err) {
                                callback(err)
                                logger.error("Error in Syncing GIT-Hub.", err);
                            } else {
                                gitHubTempModel.gitFilesdelete(gitHubId, function (err) {
                                    if (err) {
                                        callback(err)
                                        logger.error("Error in clearing GIT-Hub data.", err);
                                    }
                                });
                                logger.debug("Git Hub importing is Done.");
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        uploadToBotEngine(gitHubId, callback);
                    }
                ], next(err))
            }
        ], function (err) {
            if (err) {
                noticeService.notice(userName, {
                    title: "GitHub Sync",
                    body: "Unable to Copy Files. Please sync again"
                }, "error", function (err, data) {
                    if (err) {
                        logger.error("Error in Notification Service, ", err);
                    }
                });
            } else {
                noticeService.notice(userName, {
                    title: "GitHub Sync",
                    body: reqBody.length + " Bots Synced with github"
                }, "success", function (err, data) {
                    if (err) {
                        logger.error("Error in Notification Service, ", err);
                    }
                });
            }
            globalData.unSetGit(gitHubId);
        })
        callback(null, true);
    } else {
        var err = new Error();
        err.status = 400;
        err.msg = 'No files to copy'
        return callback(err);
    }
}

gitGubService.gitHubContentSync = function gitHubContentSync(gitHubId, botId, userName, callback) {
    async.parallel({
        gitHub: function (callback) {
            gitHubModel.getGitHubById(gitHubId, callback);
        },
        botsDetails: function (callback) {
            botDao.getBotsByBotId(botId, callback);
        }
    }, function (err, result) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!result.gitHub || !result.botsDetails) {
            var err = new Error('Data not found');
            err.status = 404;
            return callback(err);
        } else {
            callback(null);
            formatGitHubResponse(result.gitHub, function (formattedGitHub) {
                var cmd;
                if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'token') {
                    cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryToken + ' -L ';
                } else if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'userName') {
                    cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryPassword + ' -L ';
                } else if (formattedGitHub.repositoryType === 'Private' && formattedGitHub.authenticationType === 'sshKey') {
                    cmd = 'curl -u ' + formattedGitHub.repositoryUserName + ':' + formattedGitHub.repositoryPassword + ' -L ';
                } else {
                    cmd = 'curl -L '
                }
                async.parallel([
                    function (callback) {
                        if (result.botsDetails[0].type === 'script' || result.botsDetails[0].type === 'meta') {
                            var cmdFull = cmd + 'https://api.github.com/repos/' + formattedGitHub.repositoryOwner + '/' + formattedGitHub.repositoryName + '/contents/Code/' + result.botsDetails[0].type + '_BOTs/' + result.botsDetails[0].id + '?ref=' + formattedGitHub.repositoryBranch;
                            gitHubSingleSync(formattedGitHub, botId, cmdFull, cmd, function (response) { 
                                if (response != null && !("message" in response))
                                    callback(response);
                                else
                                    callback(null);    
                            });
                        } else
                            callback(null);
                    },
                    function (callback) {
                        var cmdFull = cmd + 'https://api.github.com/repos/' + formattedGitHub.repositoryOwner + '/' + formattedGitHub.repositoryName + '/contents/YAML/' + result.botsDetails[0].id + '.yaml?ref=' + formattedGitHub.repositoryBranch;
                        gitHubSingleSync(formattedGitHub, botId, cmdFull, cmd, callback);
                    }
                ], function (err) {
                    if (err) {
                        logger.error('Github single sync: ' + err);
                        message(botId + ' is sync unsuccessful', 'error');
                    } else {
                        var options = {
                            compareContent: true,
                            excludeFilter: '*.md',
                            skipSymlinks: true,
                            compareDate: false,
                            compareSize: false
                        };
                        var temp = appConfig.botFactoryDir + 'gitHub/' + botId + '/temp';
                        var botPath = appConfig.botFactoryDir + 'gitHub/' + botId;
                        fs.readlink(botPath + '/current', (err, curretDir) => {
                            if (err) {
                                logger.error('Github single sync: ' + err);
                                message(botId + ' is sync unsuccessful', 'error');
                            } else {
                                compare(curretDir, temp, options, (err, status) => {
                                    if (status === 'modified') {
                                        getMaxVersion(botPath, (maxNum) => {
                                            copy(temp, botPath + '/ver_' + maxNum, (err) => {
                                                if (err)
                                                    message(botId + ' is sync unsuccessful', 'error');
                                                else {
                                                    if (fs.existsSync(botPath + '/current'))
                                                        fs.unlinkSync(botPath + '/current');
                                                    fs.symlink(botPath + '/ver_' + maxNum, botPath + '/current', function (err) {
                                                        if (err)
                                                            message(botId + ' is sync unsuccessful', 'error');
                                                    });
                                                    copy(botPath + '/ver_' + maxNum, appConfig.botFactoryDir + '/upload/' + botId, (err) => {
                                                        if (err) {
                                                            logger.error('Github single sync: ' + err);
                                                            message(botId + ' is sync unsuccessful', 'error');
                                                        } else {
                                                            async.parallel([
                                                                function (parallelCallback) {
                                                                    botService.syncSingleBotsWithGitHub(botId, function (err, data) {
                                                                        if (err) {
                                                                            logger.error("Error in Syncing GIT-Hub.", err);
                                                                            parallelCallback(err);
                                                                        } else {
                                                                            logger.debug("Git Hub importing is Done.");
                                                                            parallelCallback(null);
                                                                        }
                                                                    });
                                                                },
                                                                function (parallelCallback) {
                                                                    uploadToBotEngine(gitHubId, parallelCallback);
                                                                }
                                                            ], function (err) {
                                                                fse.remove(temp)
                                                                if (err) {
                                                                    logger.error('Github single sync: ' + err);
                                                                    message(botId + ' is sync unsuccessful', 'error');
                                                                } else {
                                                                    message(botId + ' is sync successful', 'success');
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        })
                                    } else {
                                        message(botId + ' has no changes', 'success');
                                        fse.remove(temp)
                                    }
                                })
                            }
                        });
                    }
                });
            })
        }
    })

    function message(body, type) {
        noticeService.notice(userName, {
            title: 'Bot sync',
            body: body
        }, type, function (err, data) {
            if (err) {
                logger.error("Error in Notification Service, ", err);
            }
        });
    }
}

gitGubService.getYamlList = function getYamlList(srcPath, callback) {
    fs.readdir(srcPath, (err, botList) => {
        if (err)
            return callback(err, null);
        if (botList.length > 0) {
            var yamlList = [];
            async.each(botList, function (bot, callbackChild) {
                var currentPath = srcPath + bot + '/current';
                fs.readlink(currentPath, (err, link) => {
                    if (err)
                        callbackChild(err);
                    else {
                        fs.exists(link + '/' + bot + '.yaml', (exists) => {
                            if (exists)
                                yamlList.push(link + '/' + bot + '.yaml');
                            callbackChild(null);
                        })
                    }
                })
            }, function (err) {
                if (err)
                    return callback(err, null);
                else
                    return callback(null, yamlList)
            })
        } else
            return callback('no data', null);
    })
}

gitGubService.getSingleYaml = function getSingleYaml(srcPath, botId, callback) {
    fs.readlink(srcPath + botId + '/current', (err, link) => {
        if (err)
            return callback(err, null);
        else {
            fs.exists(link + '/' + botId + '.yaml', (exists) => {
                if (exists)
                    callback(null, link + '/' + botId + '.yaml');
                else
                    callback(null, null);
            })
        }
    })
}

gitGubService.deleteBot = function deleteBot(botId, callback) {
    var destPath = appConfig.botFactoryDir + 'gitHub/' + botId;
    getMaxVersion(destPath, (versionNum) => {
        fs.exists(destPath + '/ver_' + versionNum, (isAval) => {
            if (!isAval) {
                mkdirp(destPath + '/ver_' + versionNum, (err, made) => {
                    if (err)
                        callback(err);
                    else {
                        if (fs.existsSync(destPath + '/current'))
                            fs.unlinkSync(destPath + '/current');
                        fs.symlink(destPath + '/ver_' + versionNum, destPath + '/current', function (err) {
                            if (err)
                                callback('Unable to create symlink to new version folder');
                            else {
                                callback(null);
                            }
                        })
                    }
                })
            }
        })
    })
}

function formatGitHubResponse(gitHub, callback) {
    var formatted = {
        _id: gitHub._id,
        repositoryName: gitHub.repositoryName,
        repositoryDesc: gitHub.repositoryDesc,
        repositoryOwner: gitHub.repositoryOwner,
        repositoryType: gitHub.repositoryType,
        repositoryBranch: gitHub.repositoryBranch
    };
    if (gitHub.organization.length) {
        formatted.orgId = gitHub.organization[0].rowid;
        formatted.orgName = gitHub.organization[0].orgname;
    }
    if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'userName') {
        formatted.repositoryUserName = gitHub.repositoryUserName;
        formatted.authenticationType = gitHub.authenticationType;
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        formatted.repositoryPassword = cryptography.decryptText(gitHub.repositoryPassword, cryptoConfig.decryptionEncoding,
            cryptoConfig.encryptionEncoding);
        callback(formatted);
    } else if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'sshKey') {
        formatted.authenticationType = gitHub.authenticationType;
        fileUpload.getReadStreamFileByFileId(gitHub.repositorySSHPublicKeyFileId, function (err, publicKeyFile) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                logger.error(err);
            }
            formatted.repositorySSHPublicKeyFileId = gitHub.repositorySSHPublicKeyFileId;
            formatted.repositorySSHPublicKeyFileName = publicKeyFile.fileName;
            formatted.repositorySSHPublicKeyFileData = publicKeyFile.fileData;
            fileUpload.getReadStreamFileByFileId(gitHub.repositorySSHPrivateKeyFileId, function (err, privateKeyFile) {
                if (err) {
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
    } else if (gitHub.repositoryType === 'Private' && gitHub.authenticationType === 'token') {
        formatted.repositoryUserName = gitHub.repositoryUserName;
        formatted.authenticationType = gitHub.authenticationType;
        formatted.repositoryToken = gitHub.repositoryToken;
        callback(formatted);
    } else {
        formatted.authenticationType = gitHub.authenticationType;
        callback(formatted);
    }
}

function gitHubCloning(gitHubDetails, cmd, callback) {
    var filePath = appConfig.botFactoryDir + gitHubDetails.repositoryName + '.tgz';
    var destPath = appConfig.botFactoryDir + gitHubDetails._id;
    var botFactoryDirPath = appConfig.botFactoryDir + 'gitHub/';
    async.waterfall([
        function (next) {
            fs.exists(botFactoryDirPath, (exists) => {
                if (!exists) {
                    mkdirp(botFactoryDirPath, (err, made) => {
                        if (err)
                            next(err);
                        else
                            next(null);
                    })
                } else
                    next(null);
            })
        },
        function (next) {
            fs.exists(filePath, (exists) => {
                if (exists) {
                    fs.unlink(filePath, (err) => {
                        if (err)
                            next(err);
                        else
                            next(null);
                    })
                } else {
                    next(null);
                }
            })
        },
        function (next) {
            fs.exists(destPath, (exists) => {
                if (exists) {
                    fse.remove(destPath, (err) => {
                        if (err)
                            next(err);
                        else
                            next(null);
                    })
                } else {
                    next(null);
                }
            })
        },
        function (next) {
            execCmd(cmd, function (err, out, code) {
                if (err === null) {
                    targz.decompress({
                        src: filePath,
                        dest: destPath
                    }, function (err) {
                        if (err) {
                            logger.error("Error in Extracting Files ", err);
                            next(err, null);
                        } else {
                            logger.debug("GIT Repository Clone is Done.");
                            fs.unlinkSync(filePath);
                            getDiff(gitHubDetails._id, destPath, botFactoryDirPath, (err, diff) => {
                                if (err)
                                    next(err, null);
                                else
                                    next(null, diff);
                            })
                        }
                    })
                } else {
                    var err = new Error('Invalid Git-Hub Credentials Details');
                    err.status = 400;
                    err.msg = 'Invalid Git-Hub Details';
                    next(err, null);
                }
            })
        },
        function (diff, next) {
            gitHubTempModel.gitFilesdelete(gitHubDetails._id, function (err) {
                if (err) {
                    next(err)
                    logger.error("Error in clearing GIT-Hub data.", err);
                }
            });
            botDao.getAllBots({
                gitHubId: gitHubDetails._id
            }, {
                _id: 0,
                id: 1,
                executionCount: 1,
                isScheduled: 1,
                name: 1,
                type: 1,
                category: 1
            }, (err, bots) => {
                if (err)
                    next(err, null);
                else {
                    for (var index in diff.bots) {
                        var botData = bots.filter(function (value) {
                            return value.id == diff.bots[index].id
                        });
                        if (botData.length) {
                            diff.bots[index].executionCount = botData[0].executionCount;
                            diff.bots[index].isScheduled = botData[0].isScheduled;
                            if (diff.bots[index].name === null) {
                                diff.bots[index].name = botData[0].name;
                                diff.bots[index].type = botData[0].type;
                                diff.bots[index].category = botData[0].category;
                            }
                        }
                        if (Number(index) + 1 === diff.bots.length) {
                            next(null, diff);
                        }
                    }
                }
            })
        },
        function (diff, next) {
            async.parallel([
                function (callback) {
                    gitHubModel.updateGitHub(gitHubDetails._id, {
                        'count.new': diff.new,
                        'count.modified': diff.modified,
                        'count.deleted': diff.deleted
                    }, (err, data) => {
                        if (err)
                            callback(err, null)
                        else
                            callback(null, true);
                    })
                },
                function (callback) {
                    gitHubTempModel.gitFilesInsert(diff.bots, callback);
                }
            ], function (err, result) {
                next(err, result)
            })
        }
    ], function (err, data) {
        callback(err, data);
    })
}

function gitHubSingleSync(gitHubDetails, botId, cmdFull, cmd, callback) {
    var filepath = appConfig.botFactoryDir + 'gitHub/';
    execCmd(cmdFull, function (err, out, code) {
        if (err === null && out.trim() !== '404: Not Found') {
            var response = JSON.parse(out);
            if (response.length && !("message" in response)) {
                async.each(response, function (fileMeta, callbackChild) {
                    if (fileMeta.type === 'dir')
                        gitHubSingleSync(gitHubDetails, botId, cmd + fileMeta.url, cmd, callbackChild);
                    else {
                        execCmd(cmd + fileMeta.url, function (err, out, code) {
                            if (err === null && out.trim() !== '404: Not Found') {
                                var fileres = JSON.parse(out);
                                writeFile(fileres, botId, callbackChild);
                            } else {
                                callbackChild(err);
                            }
                        });
                    }
                }, callback);
            } else if (!("message" in response)) {
                writeFile(response, botId, callback);
            } else {
                callback(response)
            }
        } else {
            var err = new Error('Invalid Git-Hub Credentials Details');
            err.status = 400;
            err.msg = 'Invalid Git-Hub Details';
            return callback(err);
        }
    });

    function writeFile(fileres, botId, callback) {
        var destFile = filepath + botId + '/temp/' + fileres.name;
        if (!fs.existsSync(destFile)) {
            mkdirp(getDirName(destFile), function (err) {
                if (err) {
                    logger.error(err);
                    callback(err)
                } else {
                    fs.writeFile(destFile, new Buffer(fileres.content, fileres.encoding).toString(), callback);
                }
            });
        } else {
            fs.writeFile(destFile, new Buffer(fileres.content, fileres.encoding).toString(), callback);
        }
    }
}

function getDiff(gitHubId, srcPath, botsPath, callback) {
    var result = {
        'new': 0,
        'modified': 0,
        'deleted': 0,
        'bots': []
    };
    srcPath = glob.sync(srcPath + '/*')[0];
    fs.readdir(botsPath, (err, dirList) => {
        if (err)
            callback(err, null);
        else {
            if (dirList.length === 0) {
                readYaml(srcPath + '/YAML', (err, data) => {
                    if (err)
                        callback(err, null)
                    if (data.length) {
                        for (var index in data) {
                            data[index].status = 'new';
                            data[index].isScheduled = false;
                            data[index].gitHubId = gitHubId;
                            result.bots.push(data[index]);
                            result.new += 1;
                            if (Number(index) + 1 == data.length)
                                callback(null, result);
                        }
                    } else
                        callback('No Yaml to read', null);
                });
            } else {
                readYaml(srcPath + '/YAML', (err, data) => {
                    if (err)
                        callback(err);
                    if (data.length) {
                        async.each(data, function (botDetails, callback) {
                            botDetails.isScheduled = false;
                            botDetails.gitHubId = gitHubId;
                            var options = {
                                compareContent: true,
                                excludeFilter: '*.md',
                                skipSymlinks: true,
                                compareDate: false,
                                compareSize: false
                            };
                            if (dirList.indexOf(botDetails.id) === -1) {
                                botDetails.status = 'new';
                                result.bots.push(botDetails);
                                result.new += 1;
                                callback(null);
                            } else {
                                dirList.splice(dirList.indexOf(botDetails.id), 1);
                                fs.readlink(botsPath + botDetails.id + '/current', (err, curretDir) => {
                                    if (err)
                                        callback(err);
                                    else {
                                        fs.readdir(curretDir, (err, botsFiles) => {
                                            if (botsFiles.length === 0) {
                                                botDetails.status = 'new';
                                                result.bots.push(botDetails);
                                                result.new += 1;
                                                callback(null);
                                            } else {
                                                async.parallel([
                                                    function (callbackChild) {
                                                        compare(curretDir + '/' + botDetails.id + '.yaml', srcPath + '/YAML/' + botDetails.id + '.yaml', options, callbackChild);
                                                    },
                                                    function (callbackChild) {
                                                        options.excludeFilter = '*.md,*.yaml';
                                                        var codePath = srcPath + '/Code/' + botDetails.type + '_BOTs/' + botDetails.id;
                                                        if (fs.existsSync(codePath)) {
                                                            compare(curretDir, codePath, options, callbackChild);
                                                        } else
                                                            callbackChild(null, null);
                                                    }
                                                ], function (err, status) {
                                                    if (err)
                                                        callback(err);
                                                    else {
                                                        callback(null);
                                                        if (status[0] === 'modified' || status[1] === 'modified') {
                                                            botDetails.status = 'modified';
                                                            result.bots.push(botDetails);
                                                            result.modified += 1;
                                                        }
                                                    }
                                                })
                                            }
                                        })
                                    }
                                });
                            }
                        }, function (err) {
                            if (dirList.length > 0) {
                                var count = 0;
                                dirList.forEach(function (bots) {
                                    var botDetails = {};
                                    botDetails.id = bots;
                                    botDetails.name = null;
                                    botDetails.type = null;
                                    botDetails.category = null;
                                    botDetails.status = 'deleted';
                                    botDetails.isScheduled = false;
                                    botDetails.gitHubId = gitHubId;
                                    result.bots.push(botDetails);
                                    result.deleted += 1;
                                    count++;
                                    if (count === dirList.length) {
                                        callback(err, result);
                                    }
                                })
                            } else
                                callback(err, result);
                        })
                    } else {
                        callback('No Yaml to read', null);
                    }
                });
            }
        }
    })
}

function readYaml(srcPath, callback) {
    var botsData = [];
    var count = 0;
    fs.readdir(srcPath, (err, yamlList) => {
        if (err)
            callback(err, null);
        else {
            for (var yaml in yamlList) {
                yamljs.load(srcPath + '/' + yamlList[yaml], (result) => {
                    if (result) {
                        botsData.push({
                            "id": result.id,
                            "name": result.name,
                            "type": result.type,
                            "category": result.botCategory ? result.botCategory : result.functionality
                        });
                    }
                    count++;
                    if (count === yamlList.length) {
                        callback(null, botsData);
                    }
                })
            }
        }
    });
}

function compare(oldPath, newPath, option, callback) {
    var status = 'equal';
    var count = 0;
    dircompare.compare(oldPath, newPath, option).then(function (res) {
        res.diffSet.forEach(function (entry) {
            if (entry.type1 === 'file' || entry.type2 === 'file') {
                var state = '',
                    fileName = '',
                    path = '',
                    botName = '';
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
                if (state !== 'equal')
                    status = 'modified';
            }
            count++;
            if (count === res.diffSet.length) {
                callback(null, status);
            }
        })

    }).catch(function (error) {
        callback(error, null);
    });
}

function getSyncedBots(gitHubId, query, callback) {
    var reqData = {};
    async.parallel([
        function (callback) {
            async.waterfall([
                function (next) {
                    apiUtil.paginationRequest(query, 'githubsync', next);
                },
                function (paginationReq, next) {
                    paginationReq['searchColumns'] = ['id', 'type', 'category', 'status'];
                    reqData = paginationReq;
                    apiUtil.databaseUtil(paginationReq, next);
                },
                function (queryObj, next) {
                    gitHubTempModel.gitFilesList(queryObj, next);
                },
                function (botsList, next) {
                    apiUtil.paginationResponse(botsList, reqData, next);
                }
            ], callback);
        },
        function (callback) {
            gitHubModel.getById(gitHubId, callback);
        }
    ], function (err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (data) {
            data[0].metaData.new = data[1].count.new;
            data[0].metaData.modified = data[1].count.modified;
            data[0].metaData.deleted = data[1].count.deleted;
            callback(null, data[0]);
        }
    })
}

function getMaxVersion(botDirPath, callback) {
    var dirList = fs.readdirSync(botDirPath);
    if (dirList.length > 1)
        callback((Number(dirList.slice(-1)[0].split("_")[1]) + 1) % 10);
    else
        callback(0);
}

function copyToCurrent(sourceCode, source, destPath, uploadPath, versionNum, botId, callback) {
    fs.exists(sourceCode, (isAval) => {
        if (isAval) {
            copy(sourceCode, destPath + '/ver_' + versionNum, (err) => {
                copyUpload(uploadPath, destPath + '/ver_' + versionNum, botId);
                if (err)
                    return callback('Unable to copy')
            })
        }
    })
    fs.exists(destPath + '/ver_' + versionNum, (isAval) => {
        if (fs.existsSync(destPath + '/current'))
            fs.unlinkSync(destPath + '/current');
        if (!isAval) {
            mkdirp(destPath + '/ver_' + versionNum, (err, made) => {
                if (err)
                    return callback(err);
                else {
                    fs.createReadStream(source + '/YAML/' + botId + '.yaml').pipe(fs.createWriteStream(destPath + '/ver_' + versionNum + '/' + botId + '.yaml'));
                    fs.symlink(destPath + '/ver_' + versionNum, destPath + '/current', function (err) {
                        if (err)
                            return callback('Unable to create symlink to new version folder');
                        else {
                            copyUpload(uploadPath, destPath + '/ver_' + versionNum, botId);
                            return callback(null);
                        }
                    });
                }
            })
        } else {
            fs.createReadStream(source + '/YAML/' + botId + '.yaml').pipe(fs.createWriteStream(destPath + '/ver_' + versionNum + '/' + botId + '.yaml'));
            fs.symlink(destPath + '/ver_' + versionNum, destPath + '/current', function (err) {
                if (err)
                    return callback('Unable to create symlink to new version folder');
                else {
                    copyUpload(uploadPath, destPath + '/ver_' + versionNum, botId);
                    return callback(null);
                }
            });
        }
    })
}

function copyUpload(upload, srcPath, botid) {
    var uploadPath = upload + botid;
    copy(srcPath, uploadPath, (err) => {
        return;
    })
}

function uploadToBotEngine(gitHubId, callback) {
    var upload = appConfig.botFactoryDir + 'upload';
    var uploadCompress = appConfig.botFactoryDir + 'upload_compress.tar.gz'
    gitHubModel.getById(gitHubId, (err, gitDetails) => {
        if (err) {
            logger.error("Error while fetching github Details");
            callback(err);
        } else {
            masterUtil.getBotRemoteServerDetailByOrgId(gitDetails.orgId, (err, botServerDetails) => {
                if (err) {
                    logger.error("Error while fetching BOTs Server Details");
                    callback(err);
                    return;
                } else if (botServerDetails !== null && botServerDetails.active !== false) {
                    if (fs.existsSync(uploadCompress))
                        fs.unlinkSync(uploadCompress)
                    fs.exists(uploadCompress, (exists) => {
                        if (exists)
                            fs.unlinkSync(uploadCompress)
                        targz.compress({
                            src: upload,
                            dest: uploadCompress
                        }, function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                var options = {
                                    url: "http://" + botServerDetails.hostIP + ":" + botServerDetails.hostPort + "/bot/factory/upload",
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
                                    if (!err) {
                                        if (res.statusCode === 200) {
                                            callback(null)
                                        } else {
                                            callback("Bot Engine is not responding");
                                        }
                                    } else {
                                        logger.error("Bot Engine is not responding");
                                        callback(err);
                                    }
                                    fs.unlinkSync(uploadCompress);
                                    fse.removeSync(upload);
                                });
                            }
                        });
                    })
                } else {
                    logger.error("Error BOTs Server not configured");
                    callback("Error BOTs Server not configured");
                }
            });
        }
    })
}