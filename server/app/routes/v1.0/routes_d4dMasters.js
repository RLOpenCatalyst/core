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
// This file act as a Controller which contains Settings related all end points.
var d4dModel = require('_pr/model/d4dmasters/d4dmastersmodel.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var usersDao = require('_pr/model/users.js');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Chef = require('_pr/lib/chef');
var Curl = require('_pr/lib/utils/curl.js');
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);
var childProcess = require('child_process');
var exec = childProcess.exec;
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var blueprintsDao = require('_pr/model/dao/blueprints');
var errorResponses = require('./error_responses.js');
var bcrypt = require('bcryptjs');
var authUtil = require('_pr/lib/utils/authUtil.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var Client = require('node-rest-client').Client;
var cryptoConfig = appConfig.cryptoSettings;
var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
var waitForPort = require('wait-for-port');
var parser = require('xml2json');
var util = require('util');
var Task = require('_pr/model/classes/tasks/tasks.js');
var async = require('async');
var appDeployPipelineService = require('_pr/services/appDeployPipelineService');
var settingsService = require('_pr/services/settingsService');
var settingWizard = require('_pr/model/setting-wizard');
var request = require('request');


module.exports.setRoutes = function (app, sessionVerification) {

    app.all('/d4dMasters/*', sessionVerification);

    // New implementation for docker authentication: Relevance Lab
    app.post('/d4dmasters/docker/validate_old', function (req, res) {
        logger.debug("Docker credentials: ", JSON.stringify(req.body));

        // dockerHubAPI.login(req.body.userName, req.body.password,function(info){
        //     logger.debug('Info:',info);
        //     res.send('200');
        // });
        // var options_auth = {
        //     user: req.body.username,
        //     password: req.body.password
        // }
        // client = new Client();
        // var dockerUrl = 'https://index.docker.io/v1/user';
        // var reqSubmit = client.get(dockerUrl,options_auth,function(info,data){
        //     console.log(info.toString());
        //     res.send('200');
        // });

        var curl = new Curl();
        curl.executecurl('curl --raw -L --user ' + req.body.username + ':' + req.body.password + ' https://index.docker.io/v1/users', function (err, resp) {
            var loggedin = false;
            if (!err) {
                if (resp.indexOf('OK') > 0) {
                    loggedin = true;
                    logger.debug('in ok' + resp);
                    res.status('200').send('{message:"success"}');
                    return;
                } else {
                    logger.debug('In else -- ' + resp);
                    res.end('403');
                    return;
                }

            } else {
                logger.debug('In 1 else -- ' + resp);
                res.end('405');
                return;
            }
        });

        // var userName = req.body.userName;
        // var password = req.body.password;

        // var options_auth = {
        //     user: userName,
        //     password: password
        // };
        // client = new Client(options_auth);
        // var dockerUrl = 'https://index.docker.io/api/v1.1/users';
        // var reqSubmit = client.get(dockerUrl,function(data, response){
        //     logger.debug("data: ", data.toString());
        // });

        //client.registerMethod("jsonMethod", dockerUrl, "GET");
        // var reqSubmit = client.methods.jsonMethod(function(data, response) {
        //   logger.debug("response: ", response.statusCode);
        //  //   logger.debug("data: ", data.toString());
        //     res.send('200');
        //     return;
        // });

        // Handling Exception for nexus req.
        // reqSubmit.on('error', function(err) {
        //     logger.debug('Something went wrong on req!!', err.request.options);
        //     res.send('402');
        // });
    });

    app.post('/d4dmasters/docker/validate', function (req, res) {
        logger.debug("Docker crudentials: ", JSON.stringify(req.body));
        var userName = req.body.userName;
        var password = req.body.password;

        var options_auth = {
            user: userName,
            password: password
        };
        client = new Client(options_auth);
        var dockerUrl = 'https://index.docker.io/v1/users';
        client.registerMethod("jsonMethod", dockerUrl, "GET");
        var reqSubmit = client.methods.jsonMethod(function (data, response) {
            logger.debug("response: ", response);
            logger.debug("data: ", JSON.stringify(data));
            res.send('200');
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!', err.request.options);
            res.send('402');
        });
    });


    // Used npm library instead of curl to check ip is alive or not: Relevance Lab
    app.get('/d4dmasters/instanceping/:ip', function (req, res) {
        logger.debug("Enter get() for /d4dmasters/instanceping/%s", req.params.ip);
        // make sure 22 port should be open for all instances.
        waitForPort(req.params.ip, 22, function (err) {
            if (err) {
                logger.error("Error to ping ip: ", err);
                res.status(500).send('Not Alive');
                return;
            }
            res.send('Alive');
        });
    });
    //d4dmasters/getdockertags/centos/null
    app.get('/d4dmasters/getdockertags', function (req, res) {
        logger.debug("Enter get() for /d4dmasters/getdockertags/%s/%s", req.query.repopath, req.query.dockerreponame);
        //fetch the username and password from
        //Need to populate dockerrowid in template card. - done
        logger.debug('hit getdockertags');
        configmgmtDao.getMasterRow(18, 'dockerreponame', req.query.dockerreponame, function (err, data) {
            if (!err) {
                logger.debug('data rcvd:' + data == '');
                logger.debug(data);
                var dockerRepo = null;
                var options_auth = null;
                if (data != '') {
                    dockerRepo = JSON.parse(data);
                    logger.debug("Docker Repo ->%s", JSON.stringify(dockerRepo));
                    var userName = dockerRepo.dockeruserid;
                    var password = dockerRepo.dockerpassword;
                    options_auth = {
                        user: userName,
                        password: password
                    };
                    client = new Client(options_auth);
                } else {
                    client = new Client();
                }
                logger.debug("Docker Repopath ->%s", req.params.repopath);

                // Tried with http rest call but api did not working from docker side, so commenting and keeping old code: Gobinda


                var dockerUrl = 'https://registry.hub.docker.com/v1/repositories/' + req.query.repopath.replace(/\$\$/g, '/') + '/tags';
                //https://index.docker.io/v1/repositories/
                logger.debug('dockerurl:' + dockerUrl);
                client.registerMethod("jsonMethod", dockerUrl, "GET");
                var reqSubmit = client.methods.jsonMethod(function (data, response) {
                    res.send(JSON.stringify(data));
                    return;
                });

                // Handling Exception for nexus req.
                reqSubmit.on('error', function (err) {
                    logger.debug('Something went wrong on req!!', err, err.request.options);
                    res.send('402');
                });

                // end rest call

            } else {
                logger.error("Error:", err);
                res.end(err);
            }
        });
    });


    app.get('/d4dMasters/mastersjson', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/mastersjson");
        res.send([{
            name: 'master'
        }, {
            name: 'master2'
        }]);
        logger.debug("Exit get() for /d4dMasters/mastersjson");
    });
    //getAccessFilesForRole
    app.get('/d4dMasters/getaccessroles/:loginname', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/getaccessroles/%s", req.params.loginname);
        var authorizedFiles = req.session.user.authorizedfiles;
        var loggedInUser = req.params.loginname;
        configmgmtDao.getAccessFilesForRole(loggedInUser, req, res, function (err, getAccessFiles) {
            if (getAccessFiles) {
                getAccessFiles = getAccessFiles.replace(/\"/g, '').replace(/\:/g, '')
                logger.debug("Rcvd in call: %s", getAccessFiles);
                authorizedFiles = getAccessFiles;
                res.end(authorizedFiles);
            }
        });
        logger.debug("Exit get() for /d4dMasters/getaccessroles/%s", req.params.loginname);
    });

    app.get('/d4dMasters/getcodelist/:name', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/getcodelist/%s", req.params.name);
        configmgmtDao.getCodeList(req.params.name, function (err, cl) {
            if (cl) {
                logger.debug("Closing");
                res.end(cl);
            }
        });
        logger.debug("Exit get() for /d4dMasters/getcodelist/%s", req.params.name);
    });

    app.get('/d4dMasters/getuser', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/getuser : " + JSON.stringify(req.session.user));
        res.send({
            "user": [{
                username: req.session.user
            }, {
                role: '[' + req.session.user.roleId + ']'
            }]
        });
        logger.debug("Exit get() for /d4dMasters/getuser");
    });

    // Get the current loggedin user details with permissionset and authorized files
    app.get('/d4dMasters/loggedin/user', function (req, res) {
        if (req.session.user) {
            var pSet = req.session.user.permissionset;
            if (pSet.length > 1) {
                var pSetList = [];
                for (var i = 0; i < pSet.length; i++) {
                    if (pSet[i].rolename === "Admin") {
                        req.session.user.permissionset = pSet[i];
                        res.send(req.session.user);
                        return;
                    } else {
                        pSetList.push(pSet[i]);
                    }
                }
                req.session.user.permissionset = pSetList;
                res.send(req.session.user);
                return;
            } else {
                res.send(req.session.user);
                return;
            }
        } else {
            res.status(404).send({
                "errorCode": 404,
                "message": "User not found in session."
            });
            return;
        }
    });


    app.get('/d4dMasters/authorizedfiles', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/authorizedfiles");
        res.send('[' + req.session.user.authorizedfiles + ']');
        logger.debug("Exit get() for /d4dMasters/authorizedfiles");
    });

    app.get('/d4dMasters/setting', function (req, res) {
        configmgmtDao.getTeamsOrgBuProjForUser(req.session.user.cn, function (err, data) {
            logger.debug('Retuened setting : ' + data);
            res.send(200);
        });
    });

    app.get('/d4dMasters/removeitem/:id/:fieldname/:fieldvalue', function (req, res) {
        logger.debug("Received request for delete chk. %s : %s : %s", req.params.fieldvalue, req.params.id, req.params.fieldname);
        // logger.debug('received request ' + req.params.id);
        logger.debug('Verifying User permission set for delete.');
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID(req.params.id);
        var permissionto = 'delete';
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (err) {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }
            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    var toCheck = [];
                    switch (req.params.id) {
                        case "1":
                            toCheck.push({id: '10',
                                errMsg: 'Organization is associated with Chef-Server.To delete organization please delete respective Chef-Server first.',
                                fieldName: 'orgname_rowid'
                            });
                            toCheck.push({id: '3',
                                errMsg: 'Organization is associated with some Environments.To delete organization please delete respective Environments first.',
                                fieldName: 'orgname_rowid'
                            });
                            toCheck.push({id: '2',
                                errMsg: 'Organization is associated with some Business Groups.To delete organization please delete respective Business Groups first.',
                                fieldName: 'orgname_rowid'
                            });
                            break;
                        case "2":
                            toCheck.push({id: '4',
                                errMsg: 'Business Group is associated with some Projects.To delete business group please delete respective Projects first.',
                                fieldName: 'productgroupname_rowid'
                            });
                            break;
                        case "3":
                            toCheck.push({id: '4',
                                errMsg: 'Environment is associated with some Projects.To delete business group please delete respective Projects first.',
                                fieldName: 'environmentname_rowid,orgname_rowid'
                            });
                            break;
                        case "4":
                            toCheck.push({id: 'instances',
                                errMsg: 'Project is associated with some Instances.To delete Project please delete respective instances first.',
                                fieldName: 'projectId'
                            });
                            toCheck.push({id: 'blueprints',
                                errMsg: 'Project is associated with some Blueprints.To delete Project please delete respective blueprints first.',
                                fieldName: 'projectId'
                            });
                            break;
                        case "10":
                            toCheck.push({id: 'instances',
                                errMsg: 'Chef-Server already used by Some Instances.To delete Chef-Server please delete respective instances first.',
                                fieldName: 'configname_rowid'
                            });
                            toCheck.push({id: '3',
                                errMsg: 'Chef-Server already used by Some Enviornments.To delete Chef-Server please delete respective enviornments first.',
                                fieldName: 'configname_rowid'
                            });

                            break;
                        case "19":
                            toCheck.push({id: 'instances',
                                errMsg: 'Project is associated with some Instances.To delete Project please delete respective instances first.',
                                fieldName: 'projectId'
                            });
                            toCheck.push({id: 'blueprints',
                                errMsg: 'Project is associated with some Blueprints.To delete Project please delete respective blueprints first.',
                                fieldName: 'projectId'
                            });
                            break;
                    }

                    masterUtil.getTemplateTypesById(req.params.fieldvalue, function (err, templateTypeData) {
                        if (err) {
                            res.status(500).send("Error from DB");
                            return;
                        }
                        if (templateTypeData.length > 0) {
                            blueprintsDao.getBlueprintByTemplateType(templateTypeData[0].templatetypename, function (err, bpData) {
                                if (err) {
                                    res.status(500).send("Error from DB.");
                                    return;
                                }
                                configmgmtDao.deleteCheck(req.params.fieldvalue, toCheck, function (err, data) {
                                    if (err) {
                                        if (err.errCode === 500) {
                                            res.status(500).send(err.errMsg);
                                            return;
                                        } else {
                                            logger.debug("There are dependent elements which are not deleted");
                                            res.send(412, err.errMsg);
                                            return;
                                        }
                                    } else {
                                        logger.debug("entering delete");
                                        configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                                            if (err) {
                                                logger.debug("Hit and error:", err);
                                            }
                                            if (dbtype) {
                                                var item = '\"' + req.params.fieldname + '\"';
                                                logger.debug("About to delete Master Type: %s : % : %", dbtype, item, req.params.fieldvalue);
                                                eval('d4dModelNew.' + dbtype).remove({
                                                    rowid: req.params.fieldvalue
                                                }, function (err) {
                                                    if (err) {
                                                        logger.debug("Hit an errror on delete : %s", err);
                                                        res.send(500);
                                                        return;
                                                    } else {
                                                        res.send(200);
                                                        logger.debug("Exit get() for /d4dMasters/removeitem/%s/%s/%s", req.params.id, req.params.fieldname, req.params.fieldvalue);
                                                        return;
                                                    }
                                                }); //end findOne
                                            }
                                        }); //end configmgmtDao
                                    }
                                });
                            });
                        } else {
                            configmgmtDao.deleteCheck(req.params.fieldvalue, toCheck, function (err, data) {
                                if (err) {
                                    if (err.errCode === 500) {
                                        res.status(500).send(err.errMsg);
                                        return;
                                    } else {
                                        logger.debug("There are dependent elements which are not deleted");
                                        res.send(412, err.errMsg);
                                        return;
                                    }
                                } else {
                                    logger.debug("entering delete");
                                    configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                                        if (err) {
                                            logger.debug("Hit and error:", err);
                                        }
                                        if (dbtype) {
                                            var item = '\"' + req.params.fieldname + '\"';
                                            logger.debug("About to delete Master Type: %s : % : %", dbtype, item, req.params.fieldvalue);
                                            if (req.params.id === '3') {
                                                masterUtil.getEnvironmentByEnvId(req.params.fieldvalue, function (err, environment) {
                                                    if (err) {
                                                        logger.debug("Hit an errror to get Environment Name : %s", err);
                                                        res.send(500);
                                                        return;
                                                    } else {
                                                        eval('d4dModelNew.' + dbtype).remove({
                                                            rowid: req.params.fieldvalue
                                                        }, function (err) {
                                                            if (err) {
                                                                logger.debug("Hit an errror on delete : %s", err);
                                                                res.send(500);
                                                                return;
                                                            } else {
                                                                settingsService.trackSettingWizard(req.params.id, environment.orgname_rowid, function (err, results) {
                                                                    if (err) {
                                                                        logger.debug("Hit an error on updating the setting wixards Data : %s", err);
                                                                        res.send(500);
                                                                        return;
                                                                    } else {
                                                                        settingsService.updateProjectData(environment, function (err, projectData) {
                                                                            if (err) {
                                                                                logger.debug("Hit an error on updating the Project Master Data : %s", err);
                                                                                res.send(500);
                                                                                return;
                                                                            } else {
                                                                                appDeployPipelineService.updateAppDeployPipeLineEnviornment(environment, function (err, data) {
                                                                                    if (err) {
                                                                                        logger.debug("Hit an error on updating the PipeLine Configuration : %s", err);
                                                                                        res.send(500);
                                                                                        return;
                                                                                    }
                                                                                    res.send(200);
                                                                                    return;
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                            }
                                                        }); //end findOne
                                                    }
                                                })
                                            } else {
                                                eval('d4dModelNew.' + dbtype).findOne({
                                                    rowid: req.params.fieldvalue
                                                }, function (err, data) {
                                                    if (err) {
                                                        logger.debug("Hit an errror on fetching data : %s", err);
                                                        res.send(500);
                                                        return;
                                                    } else {
                                                        eval('d4dModelNew.' + dbtype).remove({
                                                            rowid: req.params.fieldvalue
                                                        }, function (err) {
                                                            if (err) {
                                                                logger.debug("Hit an errror on delete : %s", err);
                                                                res.send(500);
                                                                return;
                                                            } else {
                                                                var orgId = '';
                                                                if (req.params.id === '1') {
                                                                    orgId = data.rowid;

                                                                } else if (data.orgname_rowid.length === 1) {
                                                                    orgId = data.orgname_rowid[0];
                                                                } else {
                                                                    orgId = data.orgname_rowid;
                                                                }
                                                                settingsService.trackSettingWizard(req.params.id, orgId, function (err, results) {
                                                                    if (err) {
                                                                        logger.debug("Hit an errror on delete : %s", err);
                                                                        res.send(500);
                                                                        return;
                                                                    } else {
                                                                        logger.debug("Document deleted : %s", req.params.fieldvalue);
                                                                        res.send(200);
                                                                        logger.debug("Exit get() for /d4dMasters/removeitem/%s/%s/%s", req.params.id, req.params.fieldname, req.params.fieldvalue);
                                                                        return;
                                                                    }
                                                                })
                                                            }
                                                        }); //end findOne
                                                    }
                                                });
                                            }
                                        }
                                    }); //end configmgmtDao
                                }
                            }); //deleteCheck
                        }

                    });

                }
            });
        }); //haspermission
    });

    //Reading a icon file saved
    app.get('/d4dMasters/image/:imagename', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/image/%s", req.params.imagename);
        var settings = appConfig.chef;
        var chefRepoPath = settings.chefReposLocation;
        logger.debug(chefRepoPath);
        var file = chefRepoPath + 'catalyst_files/' + req.params.imagename;
        logger.debug(file);
        fs.exists(file, function (exists) {
            if (exists) {
                fs.readFile(chefRepoPath + 'catalyst_files/' + req.params.imagename, function (err, data) {
                    if (err) {
                        res.end(404);
                        return;
                    }
                    res.writeHead(200, {
                        'Content-Type': 'image/gif'
                    });
                    res.end(data, 'binary');
                });
            } else {
                res.send(404);
            }
        });
        logger.debug("Exit get() for /d4dMasters/image/%s", req.params.imagename);
    });
    app.get('/d4dMasters/readmasterjson/:id', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjson/%s", req.params.id);
        d4dModel.findOne({
            id: req.params.id
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(d4dMasterJson));
                logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
            } else {
                res.status(400).send({
                    "error": err
                });
                logger.debug("none found");
            }
            logger.debug("Exit get() for /d4dMasters/readmasterjson/%s", req.params.id);

        });
    });

    app.get('/d4dMasters/readmasterjsonrecord/:id/:rowid', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjsonrecord/%s/%s", req.params.id, req.params.rowid);
        configmgmtDao.getRowids(function (err, rowidlist) {
            configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                if (err) {
                    logger.error("Hit and error:", err);
                }
                if (dbtype) {
                    logger.debug("Master Type: %s", dbtype)
                    eval('d4dModelNew.' + dbtype).findOne({
                        rowid: req.params.rowid
                    }, function (err, d4dMasterJson) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (d4dMasterJson) {
                            res.writeHead(200, {
                                'Content-Type': 'application/json'
                            });
                            var jobj = JSON.parse(JSON.stringify(d4dMasterJson));
                            for (var k1 in jobj) {
                                if (k1.indexOf('_rowid') > 0) {
                                    var flds = k1.split('_');
                                    var names = '';
                                    if (jobj[k1].indexOf(',') > 0) {
                                        var itms = jobj[k1].split(',');
                                        for (_itms in itms) {
                                            logger.debug("in items");
                                            if (names == '') {
                                                names = configmgmtDao.convertRowIDToValue(itms[_itms], rowidlist);
                                            } else {
                                                names += ',' + configmgmtDao.convertRowIDToValue(itms[_itms], rowidlist);
                                            }
                                            logger.debug("names: %s", names);
                                        }

                                    } else {
                                        names = configmgmtDao.convertRowIDToValue(jobj[k1], rowidlist)
                                    }
                                    d4dMasterJson[flds[0]] = names; //configmgmtDao.convertRowIDToValue(jobj[k1],rowidlist);
                                }
                            }
                            res.end(JSON.stringify(d4dMasterJson));
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            logger.debug("Exit get() for /d4dMasters/readmasterjsonrecord/%s/%s", req.params.id, req.params.rowid);
                        } else {
                            res.end(JSON.stringify([]));
                            logger.debug("none found");
                        }


                    });
                }
            });
        }); //getRowids

    });

    app.get('/d4dMasters/readmasterjsonnew__/:id', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjsonnew__/%s", req.params.id);
        d4dModelNew.d4dModelMastersOrg.find({
            id: req.params.id
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:", err);
            }
            if (d4dMasterJson) {
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(d4dMasterJson));
                logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                logger.debug("Exit get() for /d4dMasters/readmasterjsonnew__/%s", req.params.id);
            } else {
                res.status(400).send({
                    "error": err
                });
                logger.debug("none found");
            }
        });
    });

    app.get('/d4dMasters/readmasterjsonnew/:id', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjsonnew/%s", req.params.id);
        logger.debug("Logged in user: ", req.session.user.cn);
        logger.debug("incomming id: ", req.params.id);
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                // For Org
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    logger.debug("got org list ==>", JSON.stringify(orgList));
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList.length === 0 && req.params.id === '21') {
                        d4dModelNew.d4dModelMastersTeams.find({
                            id: "21"
                        }, function (err, data) {
                            if (err) {
                                logger.error("Failed to fetch Team.");
                            }
                            res.send(data);
                        });
                    } else if (req.params.id === '1') {
                        res.send(orgList);
                        return;
                    } else if (req.params.id === '2') {
                        // For BusinessGroup
                        masterUtil.getBusinessGroups(orgList, function (err, bgList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BG.');
                            }
                            res.send(bgList);
                            return;
                        });
                    } else if (req.params.id === '3') {
                        // For Environment
                        masterUtil.getEnvironments(orgList, function (err, envList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ENV.');
                            }
                            res.send(envList);
                            return;
                        });
                    } else if (req.params.id === '4') {
                        // For Projects
                        masterUtil.getProjects(orgList, function (err, projectList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Project.');
                            }
                            res.send(projectList);
                            return;
                        })
                    } else if (req.params.id === '10') {
                        // For ConfigManagement
                        masterUtil.getCongifMgmts(orgList, function (err, configMgmtList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ConfigManagement.');
                            }
                            res.send(configMgmtList);
                            return;

                        });

                    } else if (req.params.id === '18') {
                        // For Docker
                        logger.debug("Id for docker: ", req.params.id);
                        masterUtil.getDockers(orgList, function (err, dockerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Dockers.');
                            }
                            res.send(dockerList);
                            return;
                        });

                    } else if (req.params.id === '17') {
                        // For Template
                        logger.debug("Id for template: ", req.params.id);
                        masterUtil.getTemplates(orgList, function (err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Template.');
                            }
                            res.send(templateList);
                            return;
                        });

                    } else if (req.params.id === '16') {
                        // For Template
                        logger.debug("Id for templateType: ", req.params.id);
                        masterUtil.getTemplateTypes(orgList, function (err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch TemplateType.');
                            }
                            res.send(JSON.stringify(templateList));
                            return;
                        });
                    } else if (req.params.id === '19') {
                        // For ServiceCommand
                        masterUtil.getServiceCommands(orgList, function (err, serviceCommandList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ServiceCommand.');
                            }
                            res.send(serviceCommandList);
                            return;
                        });

                    } else if (req.params.id === '20') {
                        // For Jenkins
                        masterUtil.getJenkins(orgList, function (err, jenkinList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Jenkins.');
                            }
                            res.send(jenkinList);
                            return;
                        });

                    }  else if (req.params.id === '27') {
                    // For BitBucket
                    masterUtil.getBitbucket(orgList, function(err, bitbucketList) {
                        if (err) {
                            res.status(500).send('Not able to fetch Bitbucket.');
                        }
                        res.send(bitbucketList);
                        return;
                    });

                } else if (req.params.id === '28') {
                    // For Octopus
                    masterUtil.getOctopus(orgList, function(err, octopusList) {
                        if (err) {
                            res.status(500).send('Not able to fetch Octopus.');
                        }
                        res.send(octopusList);
                        return;
                    });

                } else if (req.params.id === '29') {
                    // For QA Portal
                    masterUtil.getFunctionalTest(orgList, function(err, functionaltestlist) {
                        if (err) {
                            res.status(500).send('Not able to fetch Functional Tests.');
                        }
                        res.send(functionaltestlist);
                        return;
                    });

                }
                else if (req.params.id === '30') {
                    // For QA Portal
                    masterUtil.getCICDDashboard(orgList, function(err, cicdlist) {
                        if (err) {
                            res.status(500).send('Not able to fetch cicdlist.');
                        }
                        res.send(cicdlist);
                        return;
                    });

                }else if (req.params.id === '31') {
                    // For QA Portal
                    masterUtil.getSonarqube(orgList, function(err, sonarqubelist) {
                        if (err) {
                            res.status(500).send('Not able to fetch Sonar Tests.');
                        }
                        res.send(sonarqubelist);
                        return;
                    });

                }else if (req.params.id === '32') {
                    // For BOTs Remote Server Detail
                    masterUtil.getBotRemoteServerDetails(orgList, function(err, botRemoteServerList) {
                        if (err) {
                            res.status(500).send('Not able to fetch BOTs Remote Server Details');
                        }
                        res.send(botRemoteServerList);
                        return;
                    });

                }else if (req.params.id === '23') {
                    // For Jira
                    logger.debug("Entering getJira");
                    masterUtil.getJira(orgList, function(err, jiraList) {
                        if (err) {
                            res.status(500).send('Not able to fetch Jira.');
                        }
                        res.send(jiraList);
                        return;
                    });

                } else if (req.params.id === '6') {
                        // For User Role
                        masterUtil.getUserRoles(function (err, userRoleList) {
                            if (err) {
                                res.status(500).send('Not able to fetch UserRole.');
                            }
                            res.send(userRoleList);
                            return;
                        });

                    } else if (req.params.id === '7') {
                        // For User
                        masterUtil.getUsersForOrgOrAll(orgList, function (err, userList) {
                            if (err) {
                                res.status(500).send('Not able to fetch User.');
                            }
                            res.send(userList);
                            return;
                        });

                    } else if (req.params.id === '21') {
                        // For Team
                        masterUtil.getTeams(orgList, function (err, teamList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Team.');
                            }
                            res.send(teamList);
                            return;
                        });
                    } else if (req.params.id === '32') {
                        // For BOTs Remote Server Detail
                        masterUtil.getBotRemoteServerDetails(orgList, function(err, botRemoteServerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BOTs Remote Server Details.');
                            }
                            res.send(botRemoteServerList);
                            return;
                        });

                    } else if (req.params.id === '25') {
                        // For Puppet Server
                        masterUtil.getPuppetServers(orgList, function (err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Puppet Server.');
                            }
                            res.send(pList);
                            return;
                        });

                    } else if (req.params.id === '26') {
                        // For Puppet Server
                        masterUtil.getNexusServers(orgList, function (err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Nexus Server.');
                            }
                            res.send(pList);
                            return;
                        });
                    } else {
                        logger.debug('nothin here');
                        res.send([]);
                    }
                });

                // For non-catalystadmin
            } else {
                logger.debug("incomming id: ", req.params.id);
                // For Org
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    logger.debug("got org list: ", JSON.stringify(orgList));
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    } else if (req.params.id === '1') {
                        res.send(orgList);
                        return;
                    } else if (req.params.id === '2') {
                        // For BusinessGroup
                        masterUtil.getBusinessGroups(orgList, function (err, bgList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BG.');
                            }
                            res.send(bgList);
                            return;
                        });
                    } else if (req.params.id === '3') {
                        // For Environment
                        masterUtil.getEnvironments(orgList, function (err, envList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ENV.');
                            }
                            res.send(envList);
                            return;
                        });
                    } else if (req.params.id === '4') {
                        // For Projects
                        masterUtil.getProjects(orgList, function (err, projectList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Project.');
                            }
                            res.send(projectList);
                            return;
                        })
                    } else if (req.params.id === '10') {
                        // For ConfigManagement
                        masterUtil.getCongifMgmts(orgList, function (err, configMgmtList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ConfigManagement.');
                            }
                            res.send(configMgmtList);
                            return;
                        });

                    } else if (req.params.id === '18') {
                        // For Docker
                        logger.debug("Id for docker: ", req.params.id);
                        masterUtil.getDockers(orgList, function (err, dockerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Dockers.');
                            }
                            res.send(dockerList);
                            return;
                        });

                    } else if (req.params.id === '17') {
                        // For Template
                        logger.debug("Id for template: ", req.params.id);
                        masterUtil.getTemplates(orgList, function (err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Template.');
                            }
                            res.send(templateList);
                            return;
                        });

                    } else if (req.params.id === '16') {
                        // For Template
                        logger.debug("Id for templateType: ", req.params.id);
                        masterUtil.getTemplateTypes(orgList, function (err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch TemplateType.');
                            }
                            res.send(JSON.stringify(templateList));
                            return;
                        });

                    } else if (req.params.id === '19') {
                        // For ServiceCommand
                        masterUtil.getServiceCommands(orgList, function (err, serviceCommandList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ServiceCommand.');
                            }
                            res.send(serviceCommandList);
                            return;
                        });

                    } else if (req.params.id === '20') {
                        // For Jenkins
                        masterUtil.getJenkins(orgList, function (err, jenkinList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Jenkins.');
                            }
                            res.send(jenkinList);
                            return;
                        });

                    } else if (req.params.id === '27') {
                        // For Bitbucket
                        masterUtil.getBitbucket(orgList, function(err, bitbucketList) {
                            if (err) {
                                res.status(500).send('Not able to fetch bitbucket.');
                            }
                            res.send(bitbucketList);
                            return;
                        });

                    }else if (req.params.id === '28') {
                        // For Octopus
                        masterUtil.getOctopus(orgList, function(err, octopusList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Octopus.');
                            }
                            res.send(octopusList);
                            return;
                        });

                    }else if (req.params.id === '29') {
                        // For QA Portal
                        masterUtil.getFunctionalTest(orgList, function(err, functionaltestlist) {
                            if (err) {
                                res.status(500).send('Not able to fetch Functional Tests.');
                            }
                            res.send(functionaltestlist);
                            return;
                        });

                    }else if (req.params.id === '32') {
                        // For BOTs Remote Server Detail
                        masterUtil.getBotRemoteServerDetails(orgList, function(err, botRemoteServerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BOTs Remote Server Details.');
                            }
                            res.send(botRemoteServerList);
                            return;
                        });

                    }else if (req.params.id === '23') {
                        // For Jira
                        masterUtil.getJira(orgList, function(err, jiraList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Jira.');
                            }
                            res.send(jiraList);
                            return;
                        });

                    }else if (req.params.id === '6') {
                        // For User Role
                        masterUtil.getUserRoles(function (err, userRoleList) {
                            if (err) {
                                res.status(500).send('Not able to fetch UserRole.');
                            }
                            res.send(userRoleList);
                            return;
                        });

                    } else if (req.params.id === '7') {
                        // For User
                        masterUtil.getUsersForOrg(orgList, function (err, userList) {
                            if (err) {
                                res.status(500).send('Not able to fetch User.');
                            }
                            res.send(userList);
                            return;
                        });

                    } else if (req.params.id === '21') {
                        // For Team
                        masterUtil.getTeams(orgList, function (err, teamList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Team.');
                            }
                            res.send(teamList);
                            return;
                        });
                    } else if (req.params.id === '25') {
                        // For Puppet Server
                        masterUtil.getPuppetServers(orgList, function (err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Puppet Server.');
                            }
                            res.send(pList);
                            return;
                        });
                    } else if (req.params.id === '26') {
                        // For Puppet Server
                        masterUtil.getNexusServers(orgList, function (err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Nexus Server.');
                            }
                            res.send(pList);
                            return;
                        });
                    }else if (req.params.id === '32') {
                    // For BOTs Remote Server Detail
                        masterUtil.getBotRemoteServerDetails(orgList, function(err, botRemoteServerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BOTs Remote Server Details');
                            }
                            res.send(botRemoteServerList);
                            return;
                        });

                    } else {
                        logger.debug('nothin here');
                        res.send([]);
                    }
                });
            }
        });

    });

    app.get('/d4dMasters/readmasterjsonneworglist/:id', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjsonneworglist/%s", req.params.id);
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
            }
            if (anUser.orgname_rowid[0] === "") {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (dbtype) {
                            logger.debug("Master Type: %s", dbtype);

                            var query = {};

                            query['id'] = req.params.id;
                            if (req.params.id == '2' || req.params.id == '3' || req.params.id == '4' || req.params.id == '10') {
                                query['active'] = true;
                            }


                            eval('d4dModelNew.' + dbtype).find({
                                id: req.params.id
                            }, function (err, d4dMasterJson) {
                                if (err) {
                                    logger.debug("Hit and error:", err);
                                }
                                //Need to iterate thru the json and find if there is a field with _rowid then convert it to prefix before sending.
                                var _keys = Object.keys(d4dMasterJson);
                                logger.debug("Master Length:" + _keys.length);
                                if (_keys.length <= 0) {
                                    logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                                    res.end(JSON.stringify(d4dMasterJson));
                                }
                                var counter = 0;
                                var todelete = [];
                                for (var k = 0, v = 0; k < _keys.length; k++, v++) {
                                    var jobj = JSON.parse(JSON.stringify(d4dMasterJson[k]));

                                    for (var k1 in jobj) {
                                        if (k1.indexOf('_rowid') > 0) {
                                            //check if its an array of rowid's
                                            var flds = k1.split('_');
                                            var names = '';
                                            if (jobj[k1].indexOf(',') > 0) {
                                                var itms = jobj[k1].split(',');
                                                for (_itms in itms) {
                                                    var _itmsName = configmgmtDao.convertRowIDToValue(itms[_itms], rowidlist);
                                                    if (_itmsName != '') {
                                                        if (names == '') {
                                                            names = _itmsName; //configmgmtDao.convertRowIDToValue(itms[_itms],rowidlist);
                                                        } else {
                                                            names += ',' + _itmsName; //configmgmtDao.convertRowIDToValue(itms[_itms],rowidlist);
                                                        }
                                                        logger.debug("names: %s", names);
                                                    }
                                                }

                                            } else {
                                                names = configmgmtDao.convertRowIDToValue(jobj[k1], rowidlist);
                                            }

                                            d4dMasterJson[k][flds[0]] = names;

                                            if (names == '' && k1.indexOf('orgname_rowid') >= 0)
                                                todelete.push(k);
                                            logger.debug("jobj[flds[0]] %s %s %s %s", d4dMasterJson[k][flds[0]], flds[0], k1, k);
                                        }
                                    }
                                    logger.debug("Orgname check: %s", d4dMasterJson[k]['orgname']);
                                    counter++;
                                }
                                ;
                                logger.debug("To Delete Array: %s", todelete.toString());
                                var collection = [];
                                for (var i = 0; i < d4dMasterJson.length; i++) {
                                    if (todelete.indexOf(i) === -1) {
                                        collection.push(d4dMasterJson[i]);
                                    }
                                }
                                logger.debug("sent response 686 %s", JSON.stringify(collection));
                                res.end(JSON.stringify(collection));
                                logger.debug("Exit get() for /d4dMasters/readmasterjsonneworglist/%s", req.params.id);
                            });
                        }
                    });
                }); //rowidlist
            } else {
                // For non-catalystadmin
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (orgList) {
                        logger.debug("Returned Org List: ", JSON.stringify(orgList));
                        res.send(orgList);
                    }
                });
            }
        });
    });

    app.get('/d4dMasters/readmasterjsonnewk_/:id', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/readmasterjsonnewk_/%s", req.params.id);
        configmgmtDao.getRowids(function (err, rowidlist) {
            logger.debug("Rowid List: ", rowidlist);
            d4dModelNew.d4dModelMastersOrg.find({
                id: 1
            }, function (err, docorgs) {
                var orgnames = docorgs.map(function (docorgs1) {
                    return docorgs1.rowid;
                });
                if (req.params.id == '2' || req.params.id == '3' || req.params.id == '10') {
                    configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (dbtype) {
                            logger.debug("Master Type: %s", dbtype);
                            eval('d4dModelNew.' + dbtype).find({
                                id: req.params.id,
                                orgname_rowid: {
                                    $in: orgnames
                                }
                            }, function (err, d4dMasterJson) {
                                if (err) {
                                    logger.error("Hit and error:", err);
                                }
                                //Need to iterate thru the json and find if there is a field with _rowid then convert it to prefix before sending.
                                var _keys = Object.keys(d4dMasterJson);
                                _keys.forEach(function (k, v) {
                                    var jobj = JSON.parse(JSON.stringify(d4dMasterJson[k]));
                                    for (var k1 in jobj) {
                                        if (k1.indexOf('_rowid')) {
                                            var flds = k1.split('_');
                                            jobj[flds[0]] = configmgmtDao.convertRowIDToValue(jobj[k1], rowidlist);
                                        }
                                        logger.debug("key: %s val: %s", k1, jobj[k1]);
                                    }
                                });
                                logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                                res.end(JSON.stringify(d4dMasterJson));
                                logger.debug("Exit get() for /d4dMasters/readmasterjsonnewk_/%s", req.params.id);
                            });
                        }
                    });
                } //end if (1,2,3,4)
                else if (req.params.id == '1' || req.params.id == '4') {
                    d4dModelNew.d4dModelMastersProductGroup.find({
                        id: 2,
                        rowid: {
                            $in: orgnames
                        }
                    }, function (err, docbgs) {
                        var bgnames = docbgs.map(function (docbgs1) {
                            return docbgs1.productgroupname;
                        });
                        configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                            if (err) {
                                logger.error("Hit and error:", err);
                            }
                            if (dbtype) {
                                logger.debug("Master Type: %s", dbtype);
                                eval('d4dModelNew.' + dbtype).find({
                                    id: req.params.id,
                                    productgroupname: {
                                        $in: bgnames
                                    }
                                }, function (err, d4dMasterJson) {
                                    if (err) {
                                        logger.error("Hit and error:", err);
                                    }
                                    res.end(JSON.stringify(d4dMasterJson));
                                });
                            }
                        });
                    });
                } else {
                    configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (dbtype) {
                            logger.debug("Master Type: %s", dbtype);
                            eval('d4dModelNew.' + dbtype).find({
                                id: req.params.id
                            }, function (err, d4dMasterJson) {
                                if (err) {
                                    logger.error("Hit and error:", err);
                                }
                                res.end(JSON.stringify(d4dMasterJson));
                            });
                        }
                    });
                } //end else
            });
        }); //get rowid list
    });


    app.get('/d4dMasters/readmasterjsoncounts', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/readmasterjsoncounts");
        logger.debug("Logged in User: ", req.session.user.cn);
        var ret = [];
        var masts = ['2', '3', '4'];
        var counts = [];
        masterUtil.getLoggedInUser(req.session.user.cn, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
            }
            if (anUser.orgname_rowid[0] === "") {
                for (var i = 1; i < 5; i++)
                    counts[i] = 0;
                d4dModelNew.d4dModelMastersOrg.find({
                    id: 1,
                    active: true
                }, function (err, docorgs) {
                    var orgnames = docorgs.map(function (docorgs1) {
                        return docorgs1.rowid;
                    });
                    d4dModelNew.d4dModelMastersOrg.find({
                        id: {
                            $in: masts,
                        },
                        orgname_rowid: {
                            $in: orgnames
                        }
                    }, function (err, d4dMasterJson) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (d4dMasterJson) {
                            res.writeHead(200, {
                                'Content-Type': 'application/json'
                            });
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            logger.debug(d4dMasterJson.length);
                            var i = 0;
                            for (var i = 0; i < d4dMasterJson.length; i++) {
                                counts[d4dMasterJson[i]["id"]]++;
                            }
                            for (var i = 2; i < 5; i++) {
                                ret.push('{"' + i + '":"' + counts[i] + '"}');
                            }
                            ret.push('{"1":"' + orgnames.length + '"}');
                            logger.debug("Configured json: ", '[' + ret.join(',') + ']');
                            res.end('[' + ret.join(',') + ']');
                            return;
                        } else {
                            ret.push(i + ':' + '');
                            logger.debug("none found");
                            res.send(ret);
                            return;
                        }
                    });
                });
            } else {
                // For Settings Button
                var settingsList = [];
                var loggedInUser = req.session.user.cn;
                var callCount = 0;
                masterUtil.getActiveOrgs(loggedInUser, function (err, orgs) {
                    logger.debug("got org list ==>", JSON.stringify(orgs));
                    if (err) {
                        res.status(500).send("Failed to fetch Org.");
                    }
                    if (orgs) {
                        orgCount = orgs.length;
                        logger.debug("orgCount: ", orgCount);
                        if (settingsList.length === 0) {
                            settingsList.push({
                                "1": orgCount
                            });
                        }
                        for (var s = 0; s < settingsList.length; s++) {
                            (function (s1) {
                                if (settingsList[s1].hasOwnProperty("1")) {
                                    delete settingsList[s1];
                                    settingsList.push({
                                        "1": orgCount
                                    });
                                    settingsList = settingsList.filter(Object);
                                    return;
                                }
                            })(s);
                        }
                        masterUtil.getBusinessGroups(orgs, function (err, bgs) {
                            if (err) {
                                res.status(500).send("Failed to fetch BGroups");
                                return;
                            }
                            if (bgs) {
                                bgCount = bgs.length;
                                logger.debug("bgCount: ", bgCount);
                                if (settingsList.length === 1) {
                                    settingsList.push({
                                        "2": bgCount
                                    });
                                }
                                for (var s = 0; s < settingsList.length; s++) {
                                    (function (s1) {
                                        if (settingsList[s1].hasOwnProperty("2")) {
                                            delete settingsList[s1];
                                            settingsList.push({
                                                "2": bgCount
                                            });
                                            settingsList = settingsList.filter(Object);
                                            return;
                                        }
                                    })(s);
                                }
                            }
                            masterUtil.getEnvironments(orgs, function (err, envs) {
                                if (err) {
                                    res.status(500).send("Failed to fetch ENVs.");
                                    return;
                                }
                                if (envs) {
                                    envCount = envs.length;
                                    logger.debug("envCount: ", envCount);
                                    if (settingsList.length === 2) {
                                        settingsList.push({
                                            "3": envCount
                                        });
                                    }
                                    for (var s = 0; s < settingsList.length; s++) {
                                        (function (s1) {
                                            if (settingsList[s1].hasOwnProperty("3")) {
                                                delete settingsList[s1];
                                                settingsList.push({
                                                    "3": envCount
                                                });
                                                settingsList = settingsList.filter(Object);
                                                return;
                                            }
                                        })(s);
                                    }
                                }
                                // });
                                masterUtil.getProjects(orgs, function (err, projects) {
                                    if (err) {
                                        res.status(500).send("Failed to fetch Projects.");
                                        return;
                                    }
                                    if (projects) {
                                        projectCount = projects.length;
                                        logger.debug("projectCount: ", projectCount);
                                        if (settingsList.length === 3) {
                                            settingsList.push({
                                                "4": projectCount
                                            });
                                        }
                                        for (var s = 0; s < settingsList.length; s++) {
                                            (function (s1) {
                                                if (settingsList[s1].hasOwnProperty("4")) {
                                                    logger.debug("Has project.");
                                                    delete settingsList[s1];
                                                    settingsList.push({
                                                        "4": projectCount
                                                    });
                                                    settingsList = settingsList.filter(Object);
                                                    return;
                                                }
                                            })(s);
                                        }
                                    }
                                    res.send(settingsList);
                                    return;
                                });
                            });
                        });
                    } else {
                        res.send(200, settingsList);
                        return;
                    }
                });
            } //else
        });

    });

    app.get('/d4dMasters/getdashboardvalues/:items', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getdashboardvalues/%s", req.params.items);
        var masts = [];
        masts = req.params.items.split(',');
        logger.debug("Exit get() for  /d4dMasters/getdashboardvalues/%s", req.params.items);
    });

    app.get('/d4dMasters/getprovider/:rowid', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getprovider/%s", req.params.rowid);
        d4dModel.findOne({
            id: '9'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
                return;
            }
            if (d4dMasterJson) {
                var chefRepoPath = '';
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    logger.debug("found %s", itm.field.length);
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'rowid') {
                            if (itm.field[j]["values"].value == req.params.rowid) {
                                logger.debug("found: %s  -- %s", i, itm.field[j]["values"].value);
                                hasOrg = true;
                                //Re-construct the json with the item found
                                var configmgmt = '';
                                for (var k = 0; k < itm.field.length; k++) {
                                    if (configmgmt == '')
                                        configmgmt += "\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                    else
                                        configmgmt += ",\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                }
                                configmgmt = "{" + configmgmt + "}";
                                logger.debug(JSON.stringify(configmgmt));
                            }
                        }
                    }
                }); // rows loop
            }
            logger.debug("Exit get() for  /d4dMasters/getprovider/%s", req.params.rowid);
        });

    });


    app.get('/d4dMasters/getlist/:masterid/:fieldname', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getlist/%s/%s", req.params.masterid, req.params.fieldname);
        d4dModel.findOne({
            id: req.params.masterid
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var jsonlist = '';
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    logger.debug("found %s", itm.field.length);
                    var rowid = '';
                    var fieldvalue = '';
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == req.params.fieldname) {
                            fieldvalue = itm.field[j]["values"].value;
                        }
                        if (itm.field[j]["name"] == "rowid") {
                            rowid = itm.field[j]["values"].value;
                        }
                    }
                    if (jsonlist == '')
                        jsonlist += "\"" + fieldvalue + "\":\"" + rowid + "\"";
                    else
                        jsonlist += ",\"" + fieldvalue + "\":\"" + rowid + "\"";
                });
                configmgmt = "{" + jsonlist + "}";
                logger.debug("Exit get() for  /d4dMasters/getlist/%s/%s", req.params.masterid, req.params.fieldname);
            }
        });
    });

    app.get('/d4dMasters/getlist/:masterid/:fieldname/:fieldname1', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getlist/%s/%s/%s", req.params.masterid, req.params.fieldname, req.params.fieldname);
        d4dModel.findOne({
            id: req.params.masterid
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
                res.end(null);
            }
            if (d4dMasterJson) {
                var jsonlist = '';
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    logger.debug("found %s", itm.field.length);
                    var rowid = '';
                    var fieldvalue = '';
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == req.params.fieldname) {
                            fieldvalue = itm.field[j]["values"].value;
                        }
                        if (itm.field[j]["name"] == req.params.fieldname1) {
                            rowid = itm.field[j]["values"].value;
                        }
                    }
                    if (jsonlist == '')
                        jsonlist += "{\"" + req.params.fieldname + "\":\"" + fieldvalue + "\",\"" + req.params.fieldname1 + "\":\"" + rowid + "\"}";
                    else
                        jsonlist += ",{\"" + req.params.fieldname + "\":\"" + fieldvalue + "\",\"" + req.params.fieldname1 + "\":\"" + rowid + "\"}";

                });
                configmgmt = "[" + jsonlist + "]";
                logger.debug("Exit get() for  /d4dMasters/getlist/%s/%s/%s", req.params.masterid, req.params.fieldname, req.params.fieldname);
                res.end(configmgmt);
                return;
            } else {
                res.send(404);
                return;
            }
        });
    });

    app.get('/d4dMasters/getorgnamebychefserver/:chefserver', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getorgnamebychefserver/%s", req.params.chefserver);
        configmgmtDao.getListFiltered(10, 'orgname', 'configname', req.params.chefserver, function (err, catorgname) {
            if (err) {
                res.send(500);
                return;
            }
            if (!catorgname) {
                res.send('');
                logger.debug("Exit get() for  /d4dMasters/getorgnamebychefserver/%s", req.params.chefserver);
                return;
            } else {
                res.end(catorgname);
                logger.debug("Exit get() for  /d4dMasters/getorgnamebychefserver/%s", req.params.chefserver);
                return;
            }


        });
    });
    app.post('/d4dMasters/getListFiltered/:masterid', function (req, res) {
        logger.debug("Enter post() for  /d4dMasters/getListFiltered/%s", req.params.masterid);
        if (req.params.masterid === "10" && typeof req.body.orgname != "undefined") {
            logger.debug("Request body   : ", JSON.stringify(req.body));
            var orgName = req.body.orgname;
            d4dModelNew.d4dModelMastersOrg.find({
                orgname: orgName,
                id: "1",
                active: true
            }, function (err, anOrg) {
                if (err) {
                    logger.debug("Error occored to get Org.");
                    return;
                }
                if (anOrg.length) {
                    var query = {};
                    query['id'] = req.params.masterid;
                    query['orgname_rowid'] = anOrg[0].rowid;
                    d4dModelNew.d4dModelMastersConfigManagement.find(query, function (err, d4dMasterJson) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (d4dMasterJson.length > 0) {
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            res.send("Found");
                            logger.debug("Exit post() for  /d4dMasters/getListFiltered/%s", req.params.masterid);
                        } else {
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            res.send("Not Found");
                        }
                    });
                } else {
                    res.send("Org Not Found");
                    return;
                }
            });
        } else {

            configmgmtDao.getDBModelFromID(req.params.masterid, function (err, dbtype) {
                if (err) {
                    logger.error("Hit and error:", err);
                }
                if (dbtype) {
                    var query = {};
                    query['id'] = req.params.masterid;
                    logger.debug("Req.body for glf %s", JSON.stringify(req.body));
                    var bodyJson = JSON.parse(JSON.stringify(req.body));
                    logger.debug("Query Build in getListFiltered: %s", JSON.stringify(bodyJson));
                    var _keys = Object.keys(bodyJson);
                    _keys.forEach(function (k, v) {
                        logger.debug(k, bodyJson[k]);
                        query[k] = bodyJson[k];
                    });
                    eval('d4dModelNew.' + dbtype).find(query, function (err, d4dMasterJson) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        logger.debug("getListFiltered %s", d4dMasterJson.length);
                        if (d4dMasterJson.length > 0) {
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            res.send("Found");
                            logger.debug("Exit post() for  /d4dMasters/getListFiltered/%s", req.params.masterid);
                        } else {
                            logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                            res.send("Not Found");
                        }
                    });
                } else {
                    res.send(500);
                }
            });
        }
    });

    app.get('/d4dMasters/:masterid/:filtercolumnname/:filtercolumnvalue', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/%s/%s/%s", req.params.masterid, req.params.filtercolumnname, req.params.filtercolumnvalue);
        configmgmtDao.getDBModelFromID(req.params.masterid, function (err, dbtype) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (dbtype) {
                var query = {};
                query[req.params.filtercolumnname] = req.params.filtercolumnvalue; //building the query
                query['id'] = req.params.masterid;

                logger.debug("Master Type: %s", dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function (err, d4dMasterJson) {
                    if (err) {
                        logger.error("Hit and error:", err);
                    }
                    res.end(JSON.stringify(d4dMasterJson));
                    logger.debug("Exit get() for  /d4dMasters/%s/%s/%s", req.params.masterid, req.params.filtercolumnname, req.params.filtercolumnvalue);
                });
            }
        });
    });

    app.get('/d4dMasters/configmgmt/:rowid', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/configmgmt/%s", req.params.rowid);
        d4dModel.findOne({
            id: '10'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var chefRepoPath = '';
                settingsController.getChefSettings(function (settings) {
                    chefRepoPath = settings.chefReposLocation;
                    logger.debug("Repopath: %s", chefRepoPath);

                    var hasOrg = false;
                    d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                        logger.debug("found %s", itm.field.length);
                        for (var j = 0; j < itm.field.length; j++) {
                            if (itm.field[j]["name"] == 'rowid') {
                                if (itm.field[j]["values"].value == req.params.rowid) {
                                    logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                    hasOrg = true;
                                    //Re-construct the json with the item found
                                    var configmgmt = '';
                                    var orgname = '';
                                    var loginname = '';
                                    //looping to get the orgname , loginname
                                    for (var k = 0; k < itm.field.length; k++) {
                                        if (itm.field[k]["name"].indexOf("login") >= 0)
                                            loginname = itm.field[k]["values"].value + "/";
                                        if (itm.field[k]["name"].indexOf("orgname") >= 0)
                                            orgname = itm.field[k]["values"].value + "/";
                                    }

                                    for (var k = 0; k < itm.field.length; k++) {
                                        if (itm.field[k]["name"].indexOf("filename") > 0) {
                                            if (configmgmt == '')
                                                configmgmt += "\"" + itm.field[k]["name"].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + loginname + '.chef/' + itm.field[k]["values"].value + "\"";
                                            else
                                                configmgmt += ",\"" + itm.field[k]["name"].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + loginname + '.chef/' + itm.field[k]["values"].value + "\"";

                                        }
                                    }
                                    configmgmt = "{" + configmgmt + "}";
                                    logger.debug(JSON.stringify(configmgmt));
                                    logger.debug("Exit get() for  /d4dMasters/configmgmt/%s", req.params.rowid);
                                }
                            }

                            // logger.debug();
                        }
                    }); // rows loop
                }); //setting closure
            }
        });
    });

    app.get('/d4dMasters/getuuid', function (req, res) {
        logger.debug("Enter get() for  /d4dMasters/getuuid");
        var uuid1 = uuid.v4();
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(uuid1));
        logger.debug("sent response %s", JSON.stringify('{"uuid":"' + uuid1 + '"}'));
        logger.debug("Exit get() for  /d4dMasters/getuuid");
    });


    var fs = require('fs');
    var path = require('path');

    fs.mkdirParent = function (dirPath, mode, callback) {
        //Call the standard fs.mkdir
        fs.mkdir(dirPath, mode, function (error) {
            //When it fail in this way, do the custom steps
            if (error && error.errno === 34) {
                //Create all the parents recursively
                fs.mkdirParent(path.dirname(dirPath), mode, callback);
                //And then the directory
                fs.mkdirParent(dirPath, mode, callback);
            }
            //Manually run the callback since we used our own callback to do all these
            callback && callback(error);
        });
    };

    function mkdir_p(path, mode, callback, position) {
        mode = mode || 0777;
        position = position || 0;
        parts = require('path').normalize(path).split('/');
        var directory = parts.slice(0, position + 1).join('/');
        logger.debug("stage 2 %s", directory);
        fs.mkdirSync(directory, mode);
        if (position >= parts.length) {
            return (true);
        } else
            mkdir_p(path, mode, null, position + 1);
    }
    var mkdirSync1 = function (path) {
        try {
            fs.mkdirSync(path, 0777);
        } catch (e) {
        }
    }

    function updateProjectWithEnv(project, bodyJson) {
        d4dModelNew.d4dModelMastersEnvironments.find({
            id: "3",
            rowid: bodyJson['rowid']
        }, function (err, envs) {
            if (err) {
                logger.debug("Failed to fetch Env.", err);
            } else if (envs.length > 0) {
                var newEnv = '';
                var envName = '';
                if (project.environmentname_rowid !== '' && project.environmentname !== '') {
                    var projectEnvId = project.environmentname_rowid.split(",");
                    var projectEnvName = project.environmentname.split(",");
                    if (projectEnvId.indexOf(bodyJson['rowid']) === -1 && projectEnvName.indexOf(bodyJson['environmentname']) === -1) {
                        newEnv = project.environmentname_rowid + ',' + bodyJson['rowid'];
                        envName = project.environmentname + ',' + bodyJson['environmentname'];
                    } else if (projectEnvId.indexOf(bodyJson['rowid']) !== -1) {
                        var index = projectEnvId.indexOf(bodyJson['rowid']);
                        projectEnvName[index] = bodyJson['environmentname'];
                        newEnv = project.environmentname_rowid;
                        envName = changeArrayToString(projectEnvName);
                    } else {
                        return;
                    }
                } else {
                    newEnv = bodyJson['rowid'];
                    envName = bodyJson['environmentname'];
                }
                d4dModelNew.d4dModelMastersProjects.update({
                    rowid: project.rowid,
                    id: '4'
                }, {
                    $set: {
                        environmentname_rowid: newEnv,
                        environmentname: envName
                    }
                }, {
                    upsert: false
                }, function (err, data1) {
                    if (err) {
                        logger.debug('Err while updating d4dModelMastersProjects' + err);
                        return;
                    }
                    logger.debug('Updated project ' + project.projectname + ' with env : ' + envName);
                    return;
                });
            } else {
                return;
            }
        });
    }
    ;

    function updateProjectWithServer(key, bodyJson) {
        if (key === 'nexus') {
            var projectList = bodyJson['projectname_rowid'].split(',');
            if (projectList.length > 0) {
                for (var i = 0; i < projectList.length; i++) {
                    (function (projectId) {
                        d4dModelNew.d4dModelMastersProjects.findOne({
                            id: "4",
                            rowid: projectId
                        }, function (err, project) {
                            if (err) {
                                logger.debug("Failed to fetch Project.", err);
                            } else if (project) {
                                var newNexusRepo = [];
                                if (project.repositories.nexus && project.repositories.nexus.length > 0) {
                                    newNexusRepo = project.repositories.nexus;
                                    for (var i = 0; i < bodyJson['repositories'].nexus; i++) {
                                        if (project.repositories.nexus.indexOf(bodyJson['repositories'].nexus[i]) === -1) {
                                            newNexusRepo.push(bodyJson['repositories'].nexus[i]);
                                        }
                                    }
                                    newNexusRepo.push(bodyJson['repositories'].nexus);
                                } else {
                                    newNexusRepo = bodyJson['repositories'].nexus;
                                }
                                d4dModelNew.d4dModelMastersProjects.update({
                                    rowid: projectId,
                                    id: '4'
                                }, {
                                    $set: {
                                        'repositories.nexus': newNexusRepo
                                    }
                                }, {
                                    upsert: false
                                }, function (err, data1) {
                                    if (err) {
                                        logger.debug('Err while updating d4dModelMastersProjects' + err);
                                        return;
                                    }
                                    logger.debug('Updated project ' + project.projectname);
                                    return;
                                });
                            } else {
                                return;
                            }
                        });
                    })(projectList[i]);
                }
            } else {
                return;
            }
        } else if (key === 'docker') {
            var projectList = bodyJson['projectname_rowid'].split(',');
            if (projectList.length > 0) {
                for (var i = 0; i < projectList.length; i++) {
                    (function (projectId) {
                        d4dModelNew.d4dModelMastersProjects.findOne({
                            id: "4",
                            rowid: projectId
                        }, function (err, project) {
                            if (err) {
                                logger.debug("Failed to fetch Project.", err);
                            } else if (project) {
                                var newDockerRepo = [];
                                if (project.repositories.docker && project.repositories.docker.length > 0) {
                                    newDockerRepo = project.repositories.docker;
                                    for (var i = 0; i < bodyJson['repositories'].docker; i++) {
                                        if (project.repositories.docker.indexOf(bodyJson['repositories'].docker[i]) === -1) {
                                            newDockerRepo.push(bodyJson['repositories'].docker[i]);
                                        }
                                    }
                                    newDockerRepo.push(bodyJson['repositories'].docker);
                                } else {
                                    newDockerRepo = bodyJson['repositories'].docker;
                                }
                                d4dModelNew.d4dModelMastersProjects.update({
                                    rowid: projectId,
                                    id: '4'
                                }, {
                                    $set: {
                                        'repositories.docker': newDockerRepo
                                    }
                                }, {
                                    upsert: false
                                }, function (err, data1) {
                                    if (err) {
                                        logger.debug('Err while updating d4dModelMastersProjects' + err);
                                        return;
                                    }
                                    logger.debug('Updated project ' + project.projectname);
                                    return;
                                });
                            } else {
                                return;
                            }
                        });
                    })(projectList[i]);
                }
            } else {
                return;
            }
        } else {
            return;
        }
    }
    function findDeselectedItem(CurrentArray, PreviousArray) {
        var CurrentArrSize = CurrentArray.length;
        var PreviousArrSize = PreviousArray.length;
        var missing = [];
        // loop through previous array
        for (var j = 0; j < PreviousArrSize; j++) {

            // look for same thing in new array
            if (CurrentArray.indexOf(PreviousArray[j]) == -1) {
                missing.push(PreviousArray[j]);
            }

        }
        return missing;

    }

    function changeArrayToString(list) {
        var resultStr = '';
        for (var i = 0; i < list.length; i++) {
            resultStr = resultStr + list[i] + ',';
        }
        if (resultStr.slice(-1) === ',') {
            var res = resultStr.slice(0, -1);
            return res;
        } else {
            return resultStr;
        }
    }


    function removeStringFromArray(list, str) {
        var resultStr = '';
        for (var i = 0; i < list.length; i++) {
            if (i === list.length - 1) {
                if (str !== list[i]) {
                    resultStr = resultStr + list[i];
                }
            } else {
                if (str !== list[i]) {
                    resultStr = resultStr + list[i] + ',';
                }
            }
        }
        if (resultStr.slice(-1) === ',') {
            var res = resultStr.slice(0, -1);
            return res;
        } else {
            return resultStr;
        }
    }



    function dissociateProjectWithEnv(projects, bodyJson) {
        for (var i = 0; i < projects.length; i++) {
            (function (project) {
                var projectEnvId = project.environmentname_rowid.split(",");
                var projectEnvName = project.environmentname.split(",");
                d4dModelNew.d4dModelMastersProjects.update({
                    rowid: project.rowid,
                    id: '4'
                }, {
                    $set: {
                        environmentname_rowid: removeStringFromArray(projectEnvId, bodyJson['rowid']),
                        environmentname: removeStringFromArray(projectEnvName, bodyJson['environmentname'])
                    }
                }, {
                    upsert: false
                }, function (err, data1) {
                    if (err) {
                        logger.debug('Err while updating d4dModelMastersProjects' + err);
                        return;
                    }
                    logger.debug('Updated project ' + project.projectname + ' with env : ' + envName);
                    return;
                });
            })(projects[i]);
        }
        ;
    }
    ;

    function saveuploadedfile(suffix, folderpath, req) {
        logger.debug(req.body);
        var fi;
        if (req.params.fileinputs.indexOf(',') > 0)
            fi = req.params.fileinputs.split(',');
        else {
            fi = new Array();
            fi.push(req.params.fileinputs);
        }
        var bodyItems = Object.keys(req.body);
        var saveAsfileName = '';
        for (var i = 0; i < bodyItems.length; i++) {
            if (bodyItems[i].indexOf("_filename") > 0)
                saveAsfileName = req.body[bodyItems[i]];
        }


        var filesNames = Object.keys(req.files);
        var count = filesNames.length;
        filesNames.forEach(function (item) {
            logger.debug(item);
        });

        var settings = appConfig.chef;

        var chefRepoPath = settings.chefReposLocation;

        if (req.params.id === "25") {
            settings = appConfig.puppet;
            chefRepoPath = settings.puppetReposLocation;
        }



        logger.debug("Type of org : %s", typeof req.params.orgname);
        logger.debug("Org ID: %s", req.params.orgid);
        logger.debug(chefRepoPath + req.params.orgname + folderpath.substring(0, folderpath.length - 1));
        logger.debug("Orgname : # %s # %s", req.params.orgname.toString(), (req.params.orgname == ''));

        //Handling the exception to handle uploads without orgname
        if (req.params.orgname) {
            if (req.params.orgname === '/')
                req.params.orgname = '';

            if (req.params.orgname === '' || req.params.orgname === "undefined") {
                req.params.orgname = "catalyst_files";
            }
        }
        var path = chefRepoPath + req.params.orgid + folderpath.substring(0, folderpath.length - 1);
        parts = require('path').normalize(path).split('/');
        logger.debug("Length of parts: %s", parts.length);
        for (var i = 1; i <= parts.length; i++) {
            var directory = parts.slice(0, i).join('/');
            logger.debug(directory);
            mkdirSync1(directory);
        }

        logger.debug("files: %s", fi.length);
        for (var i = 0; i < fi.length; i++) {
            var controlName = fi[i];
            var fil = eval('req.files.' + fi[i]);
            if (typeof fil != 'undefined') {

                var data = fs.readFileSync(fil.path); //, function(err, data) {
                if (folderpath == '') {
                    logger.debug("this is where file gets saved as (no folderpath): %s %s / %s %s __ %s", chefRepoPath, req.params.orgname, suffix, controlName, fil.name);
                    fs.writeFile(chefRepoPath + req.params.orgname + '/' + suffix + controlName + '__' + fil.name, data);
                    logger.debug("File saved Successfully: ");
                } else {
                    if (folderpath.indexOf('.chef') > 0) { //identifying if its a chef config file
                        logger.debug("this is where file gets saved as .chef (with folderpath):    %s %s %s %s", chefRepoPath, req.params.orgid, folderpath, fil.name);
                        fs.writeFile(chefRepoPath + req.params.orgid + folderpath + fil.name, data);
                    } else if (folderpath.indexOf('.puppet') > 0) { //identifying if its a chef config file
                        logger.debug("this is where file gets saved as .chef (with folderpath) for puppet:    %s %s %s %s", chefRepoPath, req.params.orgid, folderpath, fil.name);
                        fs.writeFile(chefRepoPath + req.params.orgid + folderpath + fil.name, data);
                    } else //not a a chef config file
                    {
                        logger.debug("Folderpath rcvd: %s", folderpath);

                        if (fil.name == saveAsfileName) {
                            logger.debug("this is where file gets saved as (with folderpath): %s %s / %s %s __ %s", chefRepoPath, req.params.orgid, suffix, controlName, fil.name);
                            fs.writeFile(chefRepoPath + req.params.orgname + '/' + suffix + controlName + '__' + fil.name, data);

                        } else {
                            logger.debug("this is where file gets saved as (with folderpath) fixed name: %s %s %s / %s", chefRepoPath, req.params.orgid, folderpath, saveAsfileName);
                            fs.writeFile(chefRepoPath + req.params.orgname + folderpath + '/' + saveAsfileName, data);
                        }

                    }
                }
            }
        }
        logger.debug("Before ssl fetch");
        if (req.params.id == '10') {
            logger.debug("In ssl fetch");
            var options = {
                cwd: chefRepoPath + req.params.orgid + folderpath,
                onError: function (err) {
                    callback(err, null);
                },
                onClose: function (code) {
                    callback(null, code);
                }
            };
            var cmdSSLFetch = 'knife ssl fetch';

            var procSSLFetch = exec(cmdSSLFetch, options, function (err, stdOut, stdErr) {
                if (err) {
                    logger.debug("Failed on procSSLFetch routes d4dMasters:", err);
                    return;
                }
            });
            procSSLFetch.on('close', function (code) {
                logger.debug("procSSLFetch done: ");
            });

            procSSLFetch.stdout.on('data', function (data) {
                logger.debug("procSSLFetch : %s", data);
            });
        }
        return ("200");
    }


    app.post('/d4dmasters/getrows/:masterid', function (req, res) {
        logger.debug("Enter post() for  /d4dmasters/getrows/%s", req.params.masterid);
        configmgmtDao.getDBModelFromID(req.params.masterid, function (err, dbtype) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (dbtype) {
                var query = {};
                query['rowid'] = {
                    '$in': req.body.serviceids
                }
                query['id'] = req.params.masterid;

                logger.debug("Master Type: %s", dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function (err, d4dMasterJson) {
                    if (err) {
                        logger.error("Hit and error:", err);
                    }
                    res.end(JSON.stringify(d4dMasterJson));
                    logger.debug("sent response %s", JSON.stringify(d4dMasterJson));
                    logger.debug("Exit post() for  /d4dmasters/getrows/%s", req.params.masterid);
                });
            } else {
                res.send(500);
            }
        });
    });

    app.post('/d4dMastersold/getrows/:masterid', function (req, res) {
        logger.debug("Enter post() for  /d4dMastersold/getrows/%s", req.params.masterid);
        d4dModel.findOne({
            id: req.params.masterid
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var bodyJson = JSON.parse(JSON.stringify(req.body));

                if (bodyJson["serviceids"] != null) {
                    var root = '';
                    bodyJson["serviceids"].forEach(function (serviceid, servicecount) {
                        logger.debug("%s :: %s", serviceid, servicecount);
                        d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                            logger.debug("found %s", itm.field.length);
                            var configmgmt = '';
                            for (var j = 0; j < itm.field.length; j++) {
                                if (itm.field[j]["name"] == 'rowid') {
                                    if (itm.field[j]["values"].value == serviceid) {
                                        logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                        hasOrg = true;
                                        //Re-construct the json with the item found
                                        for (var k = 0; k < itm.field.length; k++) {
                                            if (configmgmt == '')
                                                configmgmt += "\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                            else
                                                configmgmt += ",\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                        }
                                    }
                                }
                            }
                            if (configmgmt != '') {
                                if (root != '')
                                    root += ",{" + configmgmt + "}";
                                else
                                    root += "{" + configmgmt + "}";
                                ;
                            }

                        }); // rows loop
                    });
                    root = '[' + root + ']';
                    res.send(JSON.parse(root));
                    logger.debug("Exit post() for  /d4dMastersold/getrows/%s", req.params.masterid);

                }

            }

        });
    });

    app.post('/d4dMasters/savemasterjsonfull/:id', function (req, res) {
        logger.debug("Enter post() for  /d4dMasters/savemasterjsonfull/%s", req.params.id);
        d4dModel.findOne({
            id: req.params.id
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var bodyJson = JSON.parse(JSON.stringify(req.body));

                //pushing the rowid field
                var editMode = false; //to identify if in edit mode.
                var uuid1 = uuid.v4();
                var rowtoedit = null;
                if (bodyJson["rowid"] != null) { //for edit
                    editMode = true;
                    for (var u = 0; u < d4dMasterJson.masterjson.rows.row.length; u++) {
                        logger.debug("Value: %s", bodyJson["rowid"]);
                        if (d4dMasterJson.masterjson.rows.row[u].rowid == bodyJson["rowid"]) {
                            rowtoedit = d4dMasterJson.masterjson.rows.row[u];
                        }
                    }
                } else //for insert
                {
                    bodyJson["rowid"] = uuid1;
                }
                var frmkeys = Object.keys(bodyJson);
                var rowFLD = [];
                logger.debug(JSON.stringify(bodyJson));
                frmkeys.forEach(function (itm) {
                    if (!editMode) {
                        var thisVal = bodyJson[itm];
                        var item;

                        if (thisVal.indexOf('[') >= 0) //used to check if its an array
                            item = "{\"" + itm + "\" : " + thisVal + "}";
                        else
                            item = "{\"" + itm + "\" : \"" + thisVal.replace(/\"/g, '\\"') + "\"}";

                        rowFLD.push(JSON.parse(item));
                    } else {

                    }
                });
                var FLD = "{" + JSON.stringify(rowFLD) + "}";
                logger.debug("Exit post() for  /d4dMasters/savemasterjsonfull/%s", req.params.id);
            }

        });
    });


    app.post('/d4dMasters/savemasterjsonrow/:id/:fileinputs/:orgname', function (req, res) {
        logger.debug('Enter post() for  /d4dMasters/savemasterjsonrow/%s/%s/%s', req.params.id, req.params.fileinputs, req.params.orgname);
        d4dModel.findOne({
            id: req.params.id
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var bodyJson = JSON.parse(JSON.stringify(req.body));

                //pushing the rowid field
                var uuid1 = uuid.v4();
                var editMode = false; //to identify if in edit mode.
                var rowtoedit = null;
                if (bodyJson["rowid"] != null) {
                    editMode = true;
                    for (var u = 0; u < d4dMasterJson.masterjson.rows.row.length; u++) {
                        for (var i = 0; i < d4dMasterJson.masterjson.rows.row[u].field.length; i++) {
                            logger.debug("Value: %s", bodyJson[d4dMasterJson.masterjson.rows.row[u].field[i].name]);
                            if (d4dMasterJson.masterjson.rows.row[u].field[i].values.value == bodyJson["rowid"]) {

                                rowtoedit = d4dMasterJson.masterjson.rows.row[u];

                            }
                        }
                    }
                } else
                    bodyJson["rowid"] = uuid1;
                if (rowtoedit) //testing if the rowtoedit has a value
                    logger.debug("Edited Row: %s", JSON.stringify(rowtoedit));
                var frmkeys = Object.keys(bodyJson);
                var rowFLD = [];
                var folderpath = ''; //will hold the folderpath field to create the path in the system
                frmkeys.forEach(function (itm) {
                    if (!editMode) {
                        var thisVal = bodyJson[itm];
                        logger.debug("thisVal %s", thisVal);
                        var item;

                        if (thisVal.indexOf('[') >= 0 && itm != "templatescookbooks") { //used to check if its an array
                            item = "{\"values\" : {\"value\" : " + thisVal + "},\"name\" : \"" + itm + "\"}";
                        } else
                            item = "{\"values\" : {\"value\" : \"" + thisVal.replace(/\"/g, '\\"') + "\"},\"name\" : \"" + itm + "\"}";
                        rowFLD.push(JSON.parse(item));
                        if (itm == 'folderpath') { //special variable to hold the folder to which the files will be copied.
                            folderpath = thisVal;
                        }
                    } else { //in edit mode
                        if (rowtoedit) {
                            uuid1 = bodyJson["rowid"];
                            logger.debug("Bodyjson[folderpath]: %s", bodyJson["folderpath"]);
                            if (bodyJson["folderpath"] == undefined) //folderpath issue fix
                                folderpath = ''
                            else
                                folderpath = bodyJson["folderpath"];
                            for (var j = 0; j < rowtoedit.field.length; j++) {
                                if (bodyJson[rowtoedit.field[j].name] != null) {
                                    rowtoedit.field[j].values.value = bodyJson[rowtoedit.field[j].name];
                                    logger.debug("Entered Edit %s", rowtoedit.field[j].values.value);
                                }
                            }
                        }
                    }

                });
                logger.debug("Changed");
                var FLD = "{\"field\":" + JSON.stringify(rowFLD) + "}";
                if (!rowtoedit) { //push new values only when not in edit mode
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(FLD));
                }
                d4dModel.update({
                    "id": req.params.id
                }, {
                    $set: {
                        "masterjson": d4dMasterJson.masterjson
                    }
                }, {
                    upsert: false
                }, function (err, data) {
                    if (err) {
                        callback(err, null);
                        res.send(500);
                        return;
                    }
                    // To do save uploaded files.
                    logger.debug("folderpath: %s", folderpath);
                    //resetting the orgname when saving template
                    if (req.params.id == '17') {
                        req.params.orgname = '';
                    }
                    if (req.params.fileinputs != 'null')
                        res.send(saveuploadedfile(uuid1 + '__', folderpath, req));
                    else
                        res.send(200);

                    if (req.params.id == '10') {

                    }
                    logger.debug("Exit post() for  /d4dMasters/savemasterjsonrow/%s/%s/%s", req.params.id, req.params.fileinputs, req.params.orgname);
                });
            }
        });
    });

    app.post('/d4dMasters/deactivateorg/:action', function (req, res) {
        logger.debug("Enter post() for /d4dMasters/deactivateorg/%s", req.params.action);
        var bodyJson = JSON.parse(JSON.stringify(req.body));
        if (!req.orgid) {
            logger.debug('Org ID found %s', bodyJson.orgid);
            configmgmtDao.deactivateOrg(bodyJson.orgid, req.params.action, function (err, data) {
                if (err) {
                    logger.error('Error: ', err);
                    res.send(500);
                }
                logger.debug('=== %s', data);
                res.send(200);
                logger.debug("Exit post() for /d4dMasters/deactivateorg/%s", req.params.action);
            });
        }
    });

    app.post('/d4dMasters/deactivateBotEngine/:action', function (req, res) {
        logger.debug("Enter post() for /d4dMasters/deactivateBotEngine/%s", req.params.action);
        var bodyJson = JSON.parse(JSON.stringify(req.body));
        if (!req.orgid) {
            logger.debug('Org ID found %s', bodyJson.orgid);
            configmgmtDao.deactivateBotEngine(bodyJson.orgid, req.params.action, function (err, data) {
                if (err) {
                    logger.error('Error: ', err);
                    res.send(500);
                }
                logger.debug('=== %s', data);
                res.send(200);
                logger.debug("Exit post() for /d4dMasters/deactivateBotEngine/%s", req.params.action);
            });
        }
    });

    app.post('/d4dMasters/savemasterjsonrownew/:id/:fileinputs/:orgname', function (req, res) {
        logger.debug("Enter post() for /d4dMasters/savemasterjsonrownew/%s/%s/%s", req.params.id, req.params.fileinputs, req.params.orgname);
        var bodyJson = JSON.parse(JSON.stringify(req.body));
        //pushing the rowid field
        var editMode = false; //to identify if in edit mode.
        var rowtoedit = null;
        if (bodyJson["rowid"] != null) {
            editMode = true;
        } else {
            editMode = false;
            bodyJson["rowid"] = uuid.v4();
        }
        //Authorize user to create / modify.
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID(req.params.id);
        var permissionto = 'create';
        if (editMode == true) {
            permissionto = 'modify';
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                res.status(500).send("Server Error");
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {
                    logger.debug("All condition: data", data, " rowid: ", anUser.orgname_rowid[0], " role: ", anUser.userrolename);
                    logger.debug('EditMode: %s', editMode);
                    bodyJson["id"] = req.params.id; //storing the form id.

                    // Handled for "any" field Org for User.
                    if (req.params.id === '7' && bodyJson["orgname"] === "") {
                        logger.debug("Inside if for empty");
                        bodyJson["orgname"] = "";
                        bodyJson["orgname_rowid"] = "";
                    }

                    if (req.params.id === "10") {
                        bodyJson["configType"] = "chef";
                    }
                    if (req.params.id === "26") {
                        bodyJson["configType"] = "nexus";
                    }
                    if (req.params.id === "18") {
                        bodyJson["configType"] = "docker";
                    }
                    if (req.params.id === "17" && bodyJson.templatesicon_filename) {
                        bodyJson["templatesicon_filePath"] = bodyJson["rowid"] + '__templatesicon__' + bodyJson["templatesicon_filename"];
                    }
                    logger.debug("Full bodyJson:::: ", JSON.stringify(bodyJson));
                    if (req.params.id === "25") {
                        bodyJson["configType"] = "puppet";
                        if (bodyJson["puppetpassword"]) {
                            bodyJson["puppetpassword"] = cryptography.encryptText(bodyJson["puppetpassword"], cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
                        } else {
                            bodyJson["folderpath"] = "/" + bodyJson["username"] + "/.puppet/";
                        }
                        logger.debug("encryptText: ", bodyJson["puppetpassword"]);
                    }
                    if (req.params.id === "3") {
                        if (!bodyJson["environmentname"]) {
                            bodyJson["environmentname"] = bodyJson["puppetenvironmentname"];
                        }
                    }
                    configmgmtDao.getDBModelFromID(req.params.id, function (err, dbtype) {
                        if (err) {
                            logger.error("Hit and error:", err);
                        }
                        if (dbtype) {
                            logger.debug("Master Type: %s", dbtype);

                            eval('d4dModelNew.' + dbtype).findOne({
                                rowid: bodyJson["rowid"]
                            }, function (err, d4dMasterJson) {
                                if (err) {
                                    logger.error("Hit and error:", err);
                                }
                                if (d4dMasterJson) {
                                    rowtoedit = JSON.parse(JSON.stringify(d4dMasterJson));
                                    logger.debug('Reached here %s', (rowtoedit == null));
                                }
                                var frmkeys = Object.keys(bodyJson);
                                var orgid = '';
                                if (frmkeys.indexOf('orgname_rowid') >= 0) {
                                    req.params['orgid'] = bodyJson['orgname_rowid'];
                                }
                                var rowFLD = [];
                                var folderpath = ''; //will hold the folderpath field to create the path in the system
                                var newrowid = '';
                                frmkeys.forEach(function (itm) {
                                    logger.debug("Each item: itm %s bodyJson[itm] %s", itm, bodyJson[itm]);
                                    if (itm.trim() == 'rowid') {
                                        logger.debug('!!!! in rowid %s', bodyJson[itm]);
                                        newrowid = bodyJson[itm];
                                    }
                                    if (!editMode) {
                                        var thisVal = bodyJson[itm];
                                        logger.debug(thisVal);
                                        var item = null;
                                        if (thisVal.indexOf('[') >= 0 && itm != "templatescookbooks") { //used to check if its an array
                                            item = "\"" + itm + "\" : \"" + thisVal + "\"";
                                        } else //
                                            item = "\"" + itm + "\" : \"" + thisVal.replace(/\"/g, '\\"') + "\"";
                                        rowFLD.push(item);
                                        if (itm == 'folderpath') { //special variable to hold the folder to which the files will be copied.
                                            rowFLD.push("\"" + itm + "\" : \"" + thisVal.replace(/\"/g, '\\"') + "\"");
                                            logger.debug('Got a folderpath: %s', thisVal);
                                            folderpath = thisVal;
                                        }
                                    } else {
                                        if (d4dMasterJson != null) {
                                            uuid1 = bodyJson["rowid"];
                                            if (bodyJson["folderpath"] == undefined) //folderpath issue fix
                                                folderpath = ''
                                            else
                                                folderpath = bodyJson["folderpath"];
                                            var fldadded = false;
                                            for (var myval in rowtoedit) {
                                                if (itm == myval) {
                                                    rowtoedit[myval] = bodyJson[myval];
                                                    fldadded = true;
                                                }
                                            }
                                            if (!fldadded) {
                                                logger.debug('Not Added ---------> %s', itm);
                                                if (bodyJson[itm] != '') //found to have a value
                                                {
                                                    rowtoedit[itm] = bodyJson[itm];
                                                }
                                            }
                                        }
                                    }
                                });
                                var FLD = JSON.stringify(rowFLD);
                                if (!editMode) { //push new values only when not in edit mode
                                    // Start Auto create Team
                                    if (req.params.id === '1') {
                                        d4dModelNew.d4dModelMastersOrg.find({
                                            orgname: bodyJson["orgname"],
                                            id:'1'
                                        }, function (err, orgs) {
                                            if (err) {
                                                logger.error('Hit error while check org is exist with Org Name', err);
                                                res.send(500);
                                                return;
                                            } else if (orgs.length > 0) {
                                                logger.error('Org Name already exists. Please enter different Org Name');
                                                res.status(400).send("Org Name already exists.Please enter different Org Name");
                                                return;
                                            } else {
                                                var orgData = {
                                                    "orgname": bodyJson['orgname'],
                                                    "domainname": bodyJson['domainname'],
                                                    "rowid": bodyJson['rowid'],
                                                    "plannedCost": bodyJson['plannedCost'],
                                                    "id": "1"
                                                }
                                                var orgObj = new d4dModelNew.d4dModelMastersOrg(orgData);
                                                orgObj.save(function (err, anOrg) {
                                                    if (err) {
                                                        res.status(500).send("Failed to save Org.");
                                                        return;
                                                    }
                                                    async.parallel({
                                                        template: function (callback) {
                                                            for (var x1 = 0; x1 < 6; x1++) {
                                                                (function (x1) {
                                                                    var templatetypename;
                                                                    var designtemplateicon_filename;
                                                                    var templatetype;
                                                                    var providerType;
                                                                    if (x1 === 0) {
                                                                        templatetypename = "Docker";
                                                                        designtemplateicon_filename = "Docker.png";
                                                                        templatetype = "docker";
                                                                        providerType = ['aws', 'azure', 'openstack', 'vmware'];
                                                                    } else if (x1 === 1) {
                                                                        templatetypename = "OSImage";
                                                                        designtemplateicon_filename = "Desktop Provisining.png";
                                                                        templatetype = "ami";
                                                                        providerType = ['aws', 'azure', 'openstack', 'vmware'];
                                                                    } else if (x1 === 2) {
                                                                        templatetypename = "SoftwareStack";
                                                                        designtemplateicon_filename = "Appfactory.png";
                                                                        templatetype = "chef";
                                                                        providerType = ['aws', 'azure', 'openstack', 'vmware'];
                                                                    } else if (x1 === 3) {
                                                                        templatetypename = "CloudFormation";
                                                                        designtemplateicon_filename = "CloudFormation.png";
                                                                        templatetype = "cft";
                                                                        providerType = ['aws'];

                                                                    } else if (x1 === 4) {
                                                                        templatetypename = "ARMTemplate";
                                                                        designtemplateicon_filename = "CloudFormation.png";
                                                                        templatetype = "arm";
                                                                        providerType = ['azure'];
                                                                    } else {
                                                                        templatetypename = "Composite";
                                                                        designtemplateicon_filename = "composite.png";
                                                                        templatetype = "composite";
                                                                        providerType = ['aws'];
                                                                    }

                                                                    var templateTypeData = {
                                                                        "templatetypename": templatetypename,
                                                                        "orgname": bodyJson["orgname"],
                                                                        "orgname_rowid": bodyJson["rowid"],
                                                                        "rowid": uuid.v4(),
                                                                        "id": "16",
                                                                        "templatetype": templatetype,
                                                                        "providerType": providerType

                                                                    };

                                                                    var templateTypeModel = new d4dModelNew.d4dModelMastersDesignTemplateTypes(templateTypeData);
                                                                    templateTypeModel.save(function (err, aTemplateType) {
                                                                        if (err) {
                                                                            logger.debug("Failed to save TemplateType.");
                                                                        }
                                                                        logger.debug("Default TemplateType created.");
                                                                        if (x1 === 5) {
                                                                            callback(null, aTemplateType);
                                                                            return;
                                                                        }
                                                                    });
                                                                })(x1);
                                                            }
                                                        },
                                                        team: function (callback) {
                                                            for (var x = 0; x < 4; x++) {
                                                                (function (x) {
                                                                    var teamName;
                                                                    var descriptions;
                                                                    if (x === 0) {
                                                                        teamName = bodyJson["orgname"] + "_Admins";
                                                                        descriptions = "Team For " + teamName;
                                                                    } else if (x === 1) {
                                                                        teamName = bodyJson["orgname"] + "_DEV";
                                                                        descriptions = "Team For " + teamName;
                                                                    } else if (x === 2) {
                                                                        teamName = bodyJson["orgname"] + "_QA";
                                                                        descriptions = "Team For " + teamName;
                                                                    } else {
                                                                        teamName = bodyJson["orgname"] + "_DevOps";
                                                                        descriptions = "Team For " + teamName;
                                                                    }

                                                                    var teamData = {
                                                                        "teamname": teamName,
                                                                        "description": descriptions,
                                                                        "orgname": bodyJson["orgname"],
                                                                        "orgname_rowid": bodyJson["rowid"],
                                                                        "rowid": uuid.v4(),
                                                                        "id": "21",
                                                                        "loginname": "",
                                                                        "loginname_rowid": "",
                                                                        "projectname": "",
                                                                        "projectname_rowid": ""

                                                                    };
                                                                    var teamModel = new d4dModelNew.d4dModelMastersTeams(teamData);
                                                                    teamModel.save(function (err, aTeam) {
                                                                        if (err) {
                                                                            logger.debug("Failed to save Team.");
                                                                        }
                                                                        logger.debug("Auto created Team: ", JSON.stringify(aTeam));
                                                                        if (x === 3) {
                                                                            callback(null, aTeam);
                                                                            return;
                                                                        }
                                                                    });
                                                                })(x);

                                                            }
                                                        },
                                                        wizard: function (callback) {
                                                            var settingWizardSteps = appConfig.settingWizardSteps;
                                                            var currentStep = settingWizardSteps[1];
                                                            if (currentStep.nestedSteps) {
                                                                currentStep.nestedSteps[0].isCompleted = true;
                                                            }
                                                            var wizardBody = {
                                                                orgId: bodyJson["rowid"],
                                                                orgName: bodyJson["orgname"],
                                                                previousStep: settingWizardSteps[0],
                                                                currentStep: currentStep,
                                                                nextStep: settingWizardSteps[2]
                                                            }
                                                            settingWizard.createSettingWizard(wizardBody, function (err, data) {
                                                                if (err) {
                                                                    logger.debug("Failed to save Setting Wizard.");
                                                                }
                                                                logger.debug("Setting Wizard created.");
                                                                callback(null, data);
                                                                return;
                                                            });
                                                        }
                                                    }, function (err, results) {
                                                        if (err) {
                                                            res.status(500).send("Failed to save template/Team/Wizard.");
                                                            return;
                                                        }
                                                        res.send(200);
                                                        return;
                                                    })
                                                });
                                            }
                                        });
                                    } else if (req.params.id === '7') {
                                        authUtil.hashPassword(bodyJson["password"], function (err, hashedPassword) {
                                            if (err) {
                                                logger.error('Hit error', err);
                                                res.send(500);
                                                return;
                                            }
                                            bodyJson["password"] = hashedPassword;
                                            d4dModelNew.d4dModelMastersUsers.find({
                                                loginname: bodyJson["loginname"],
                                                id: '7'
                                            }, function (err, users) {
                                                if (err) {
                                                    logger.error('Hit error while check user is exist with Login Name', err);
                                                    res.send(500);
                                                    return;
                                                } else if (users.length > 0) {
                                                    logger.error('Login Name already exists. Please try to register with different Login Name');
                                                    res.status(400).send("Login Name already exists.Please try to register with different Login Name");
                                                    return;
                                                } else {
                                                    d4dModelNew.d4dModelMastersUsers.find({
                                                        email: bodyJson["email"],
                                                        id: '7'
                                                    },function(err,usersList){
                                                        if (err) {
                                                            logger.error('Hit error while check user is exist with email', err);
                                                            res.send(500);
                                                            return;
                                                        } else if (usersList.length > 0) {
                                                            logger.error('Email Id already associated with different Login Name. Please enter different Email Id');
                                                            res.status(400).send("Email Id already associated with different Login Name. Please enter different Email Id");
                                                            return;
                                                        }else{
                                                            var userModel = new d4dModelNew.d4dModelMastersUsers(bodyJson);
                                                            userModel.save(function (err, data) {
                                                                if (err) {
                                                                    logger.error('Hit Save error', err);
                                                                    res.send(500);
                                                                    return;

                                                                }
                                                                var teamName = bodyJson["teamname"].split(",");
                                                                var rowId = bodyJson["teamname_rowid"].split(",");
                                                                for (var x = 0; x < rowId.length; x++) {
                                                                    d4dModelNew.d4dModelMastersTeams.find({
                                                                        rowid: rowId[x]
                                                                    }, function (err, teamData) {
                                                                        if (err) {
                                                                            logger.debug("Error : ", err);
                                                                        }
                                                                        teamData[0].loginname = teamData[0].loginname + "," + bodyJson["loginname"];
                                                                        teamData[0].loginname_rowid = teamData[0].loginname_rowid + "," + bodyJson["rowid"];
                                                                        if (teamData[0].loginname.length > 0 && teamData[0].loginname_rowid.length > 0) {
                                                                            if (teamData[0].loginname.substring(0, 1) == ',') {
                                                                                teamData[0].loginname = teamData[0].loginname.substring(1);
                                                                            }
                                                                            if (teamData[0].loginname_rowid.substring(0, 1) == ',') {
                                                                                teamData[0].loginname_rowid = teamData[0].loginname_rowid.substring(1);
                                                                            }
                                                                        }
                                                                        d4dModelNew.d4dModelMastersTeams.update({
                                                                            rowid: teamData[0].rowid
                                                                        }, {
                                                                            $set: JSON.parse(JSON.stringify(teamData[0]))
                                                                        }, {
                                                                            upsert: false
                                                                        }, function (err, updatedTeam) {
                                                                            if (err) {
                                                                                logger.debug("Failed to update Team: ", errorResponses.db.error);
                                                                            }
                                                                            logger.debug("Successfully Team updated with User.");
                                                                        });

                                                                    });
                                                                    if (x === rowId.length - 1) {
                                                                        if (bodyJson['orgname_rowid'] === '' || bodyJson['orgname_rowid'] === null) {
                                                                            res.send(200);
                                                                            return;
                                                                        } else {
                                                                            settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                                                if (err) {
                                                                                    logger.error('Hit getting setting wizard error', err);
                                                                                    res.send(500);
                                                                                    return;
                                                                                } else if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.name === 'User Configuration') {
                                                                                    var settingWizardSteps = appConfig.settingWizardSteps;
                                                                                    settingWizards.currentStep.nestedSteps[1].isCompleted = true;
                                                                                    settingWizards.currentStep.isCompleted = true;
                                                                                    settingWizards.previousStep = settingWizards.currentStep;
                                                                                    settingWizards.currentStep = settingWizards.nextStep;
                                                                                    settingWizards.nextStep = settingWizardSteps[5];
                                                                                    settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                                                        if (err) {
                                                                                            logger.error('Hit getting setting wizard error', err);
                                                                                            res.send(500);
                                                                                            return;
                                                                                        }
                                                                                        res.send(200);
                                                                                        return;
                                                                                    });
                                                                                } else {
                                                                                    res.send(200);
                                                                                    return;
                                                                                }
                                                                            })
                                                                        }
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            });
                                        });
                                    } else if (req.params.id === '4') {
                                        var projectModel = new d4dModelNew.d4dModelMastersProjects(bodyJson);
                                        projectModel.save(function (err, data) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;
                                            }
                                            settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                if (err) {
                                                    logger.error('Hit getting setting wizard error', err);
                                                    res.send(500);
                                                    return;
                                                }
                                                var settingWizardSteps = appConfig.settingWizardSteps;
                                                if (settingWizards.currentStep && settingWizards.currentStep.name === 'Org Configuration') {
                                                    settingWizards.currentStep.nestedSteps[2].isCompleted = true;
                                                    settingWizards.currentStep.isCompleted = true;
                                                    settingWizards.previousStep = settingWizards.currentStep;
                                                    settingWizards.currentStep = settingWizards.nextStep;
                                                    settingWizards.nextStep = settingWizardSteps[3];
                                                    settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                        if (err) {
                                                            logger.error('Hit getting setting wizard error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        res.send(200);
                                                        return;
                                                    });
                                                } else {
                                                    res.send(200);
                                                    return;
                                                }
                                            })
                                        });
                                    }else if (req.params.id === '32') {
                                        var options = {
                                            url: "http://"+bodyJson["hostIP"]+":"+bodyJson["hostPort"],
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        };
                                        request.get(options,function(err,response,body){
                                            if(err){
                                                logger.error("Unable to connect remote server");
                                                bodyJson["active"] =false;
                                                var remoteBotServerModel = new d4dModelNew.d4dModelMastersBOTsRemoteServer(bodyJson);
                                                remoteBotServerModel.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Hit Save error', err);
                                                        res.send(500);
                                                        return;
                                                    }else{
                                                        res.send(200);
                                                        return;
                                                    }
                                                });
                                            }else{
                                                bodyJson["active"] =true;
                                                var remoteBotServerModel = new d4dModelNew.d4dModelMastersBOTsRemoteServer(bodyJson);
                                                remoteBotServerModel.save(function (err, data) {
                                                    if (err) {
                                                        logger.error('Hit Save error', err);
                                                        res.send(500);
                                                        return;
                                                    }else{
                                                        res.send(200);
                                                        return;
                                                    }
                                                });
                                            }
                                        });
                                    } else if (req.params.id === '26') {
                                        bodyJson['groupid'] = JSON.parse(bodyJson['groupid']);
                                        bodyJson['repositories'] = JSON.parse(bodyJson['repositories']);
                                        var nexusModel = new d4dModelNew.d4dModelMastersNexusServer(bodyJson);
                                        nexusModel.save(function (err, data) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;
                                            }
                                            settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                if (err) {
                                                    logger.error('Hit getting setting wizard error', err);
                                                    res.send(500);
                                                    return;
                                                }
                                                if (settingWizards.currentStep && settingWizards.currentStep.name === 'Devops Roles') {
                                                    settingWizards.currentStep.nestedSteps[0].isCompleted = true;
                                                    settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                        if (err) {
                                                            logger.error('Hit getting setting wizard error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        updateProjectWithServer('nexus', bodyJson);
                                                        res.send(200);
                                                        return;
                                                    });
                                                } else {
                                                    updateProjectWithServer('nexus', bodyJson);
                                                    res.send(200);
                                                    return;
                                                }
                                            })
                                        });
                                    } else if (req.params.id === '18') {
                                        bodyJson['repositories'] = JSON.parse(bodyJson['repositories']);
                                        var dockerModel = new d4dModelNew.d4dModelMastersDockerConfig(bodyJson);
                                        dockerModel.save(function (err, data) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;
                                            }
                                            settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                if (err) {
                                                    logger.error('Hit getting setting wizard error', err);
                                                    res.send(500);
                                                    return;
                                                }
                                                if (settingWizards.currentStep && settingWizards.currentStep.name === 'Devops Roles') {
                                                    settingWizards.currentStep.nestedSteps[1].isCompleted = true;
                                                    settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                        if (err) {
                                                            logger.error('Hit getting setting wizard error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        updateProjectWithServer('docker', bodyJson);
                                                        res.send(200);
                                                        return;
                                                    });
                                                } else {
                                                    updateProjectWithServer('docker', bodyJson);
                                                    res.send(200);
                                                    return;
                                                }
                                            })
                                        });
                                    } else {
                                        eval('var mastersrdb =  new d4dModelNew.' + dbtype + '({' + JSON.parse(FLD) + '})');
                                        mastersrdb.save(function (err, data) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;

                                            }
                                            logger.debug('New Master Saved');
                                            logger.debug(req.params.fileinputs == 'null');
                                            if (req.params.id === '21') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'User Configuration') {
                                                        settingWizards.currentStep.nestedSteps[0].isCompleted = true;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '2') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Org Configuration') {
                                                        settingWizards.currentStep.nestedSteps[1].isCompleted = true;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '10') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Config Management') {
                                                        settingWizards.currentStep.nestedSteps[0].isCompleted = true;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '19') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Gallery Setup') {
                                                        settingWizards.currentStep.nestedSteps[1].isCompleted = true;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '20') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    var settingWizardSteps = appConfig.settingWizardSteps;
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Devops Roles') {
                                                        settingWizards.currentStep.nestedSteps[2].isCompleted = true;
                                                        settingWizards.currentStep.isCompleted = true;
                                                        settingWizards.previousStep = settingWizards.currentStep;
                                                        settingWizards.currentStep = settingWizards.nextStep;
                                                        settingWizards.nextStep = settingWizards.nextStep;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '17') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Gallery Setup') {
                                                        settingWizards.currentStep.nestedSteps[0].isCompleted = true;
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            if (req.params.id === '3') {
                                                settingWizard.getSettingWizardByOrgId(bodyJson['orgname_rowid'], function (err, settingWizards) {
                                                    if (err) {
                                                        logger.error('Hit getting setting wizard error', err);
                                                        res.send(500);
                                                        return;
                                                    }
                                                    if (settingWizards.currentStep && settingWizards.currentStep.name === 'Config Management') {
                                                        var settingWizardSteps = appConfig.settingWizardSteps;
                                                        settingWizards.currentStep.nestedSteps[1].isCompleted = true;
                                                        settingWizards.currentStep.isCompleted = true;
                                                        settingWizards.previousStep = settingWizards.currentStep;
                                                        settingWizards.currentStep = settingWizards.nextStep;
                                                        settingWizards.nextStep = settingWizardSteps[4];
                                                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit getting setting wizard error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                            logger.debug('New record folderpath: % rowid %s FLD["folderpath"]:', folderpath, newrowid, folderpath);
                                            if (!folderpath) {
                                                if (FLD["folderpath"] == undefined) //folderpath issue fix
                                                    folderpath = ''
                                                else
                                                    folderpath = rowFLD["folderpath"];
                                            }
                                            //if env is saved then it should be associated with project.
                                            if (req.params.id == '3') {
                                                var projectIds = bodyJson['projectname_rowid'].split(",");
                                                for (var i = 0; i < projectIds.length; i++) {
                                                    d4dModelNew.d4dModelMastersProjects.findOne({
                                                        rowid: projectIds[i],
                                                        id: "4"
                                                    }, function (err, project) {
                                                        if (!err) {
                                                            updateProjectWithEnv(project, bodyJson);
                                                        }
                                                    });
                                                }
                                            }
                                            //resetting the orgname to empty string when a template type file is uploaded.
                                            if (req.params.id == '17') {
                                                req.params.orgname = "undefined";
                                            }
                                            if (req.params.fileinputs != 'null')
                                                res.send(saveuploadedfile(newrowid + '__', folderpath, req));
                                            else
                                                res.send(200);
                                            return;
                                        });
                                    }
                                } else {

                                    // Update settings
                                    if (req.params.id === '4') {
                                        // bodyJson['repositories'] = JSON.parse(bodyJson['repositories']);
                                        delete rowtoedit._id; //fixing the issue of
                                        //  rowtoedit["repositories"] = bodyJson['repositories'];
                                        logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                        eval('d4dModelNew.' + dbtype).update({
                                            rowid: bodyJson["rowid"],
                                            "id": "4"
                                        }, {
                                            $set: rowtoedit
                                        }, {
                                            upsert: false
                                        }, function (err, saveddata) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;
                                            }
                                            res.send(200);
                                            return;
                                        });
                                    }

                                    if (req.params.id === '26') {
                                        bodyJson['groupid'] = JSON.parse(bodyJson['groupid']);
                                        delete rowtoedit._id; //fixing the issue of
                                        rowtoedit["groupid"] = bodyJson['groupid'];
                                        logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                        eval('d4dModelNew.' + dbtype).update({
                                            rowid: bodyJson["rowid"],
                                            "id": "26"
                                        }, {
                                            $set: rowtoedit
                                        }, {
                                            upsert: false
                                        }, function (err, saveddata) {
                                            if (err) {
                                                logger.error('Hit Save error', err);
                                                res.send(500);
                                                return;
                                            }
                                            res.send(200);
                                            return;
                                        });
                                    }
                                    if (req.params.id === '32') {
                                        var options = {
                                            url: "http://"+bodyJson["hostIP"]+":"+bodyJson["hostPort"],
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        };
                                        request.get(options,function(err,response,body){
                                            if(err){
                                                logger.error("Unable to connect remote server");
                                                var remoteBotServerModel = new d4dModelNew.d4dModelMastersBOTsRemoteServer(bodyJson);
                                                var botServerObj = {
                                                    hostIP:bodyJson["hostIP"],
                                                    hostPort:bodyJson["hostPort"],
                                                    active:false,
                                                    name:bodyJson["name"]
                                                };
                                                remoteBotServerModel.find({rowid:bodyJson["rowid"],id:'32'},function(err,serverDetails){
                                                    if(err){
                                                        logger.error('Hit Save error', err);
                                                        res.send(500);
                                                        return;
                                                    }else if(serverDetails.length > 0){
                                                        remoteBotServerModel.update({rowid:bodyJson["rowid"],id:'32'},
                                                            {$set:botServerObj},
                                                            function (err, data) {
                                                            if (err) {
                                                                logger.error('Hit Save error', err);
                                                                res.send(500);
                                                                return;
                                                            }else{
                                                                res.send(200);
                                                                return;
                                                            }
                                                        });
                                                    }else{
                                                        logger.debug("No records are available for corresponding report.")
                                                        res.send(200);
                                                        return;
                                                    }
                                                });
                                            }else{
                                                var remoteBotServerModel = new d4dModelNew.d4dModelMastersBOTsRemoteServer(bodyJson);
                                                var botServerObj = {
                                                    hostIP:bodyJson["hostIP"],
                                                    hostPort:bodyJson["hostPort"],
                                                    active:true,
                                                    name:bodyJson["name"]
                                                };
                                                remoteBotServerModel.find({rowid:bodyJson["rowid"],id:'32'},function(err,serverDetails){
                                                    if(err){
                                                        logger.error('Hit Save error', err);
                                                        res.send(500);
                                                        return;
                                                    }else if(serverDetails.length > 0){
                                                        remoteBotServerModel.update({rowid:bodyJson["rowid"],id:'32'},
                                                            {$set:botServerObj},
                                                            function (err, data) {
                                                                if (err) {
                                                                    logger.error('Hit Save error', err);
                                                                    res.send(500);
                                                                    return;
                                                                }else{
                                                                    res.send(200);
                                                                    return;
                                                                }
                                                            });
                                                    }else{
                                                        logger.debug("No records are available for corresponding report.")
                                                        res.send(200);
                                                        return;
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    if (req.params.id === "7") {
                                        d4dModelNew.d4dModelMastersUsers.find({
                                            "id": req.params.id,
                                            loginname: bodyJson["loginname"]
                                        }, function (err, anUser) {
                                            if (err) {
                                                logger.debug("Error to fetch user.");
                                                res.status(500).send("Error to fetch User.");
                                                return;
                                            }
                                            logger.debug("Fetched User: ", JSON.stringify(anUser));
                                            if (anUser.length) {
                                                if (bodyJson["password"] === '') {

                                                    delete rowtoedit._id; //fixing the issue of
                                                    if (bodyJson["orgname"] === "") {
                                                        logger.debug("Inside if for empty for update..");
                                                        rowtoedit["orgname"] = [""];
                                                        rowtoedit["orgname_rowid"] = [""];
                                                    }
                                                    rowtoedit["password"] = anUser[0].password;
                                                    logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                                    eval('d4dModelNew.' + dbtype).update({
                                                        rowid: bodyJson["rowid"],
                                                        "id": "7"
                                                    }, {
                                                        $set: rowtoedit
                                                    }, {
                                                        upsert: false
                                                    }, function (err, saveddata) {
                                                        if (err) {
                                                            logger.error('Hit Save error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        res.send(200);
                                                        return;
                                                    });

                                                } else if (bodyJson["password"] != anUser[0].password) {
                                                    authUtil.hashPassword(bodyJson["password"], function (err, hashedPassword) {
                                                        if (err) {
                                                            logger.error('Hit error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        logger.debug("hashedPassword: ", hashedPassword);
                                                        delete rowtoedit._id; //fixing the issue of
                                                        if (bodyJson["orgname"] === "") {
                                                            rowtoedit["orgname"] = [""];
                                                            rowtoedit["orgname_rowid"] = [""];
                                                        }
                                                        rowtoedit["password"] = hashedPassword;
                                                        logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                                        eval('d4dModelNew.' + dbtype).update({
                                                            rowid: bodyJson["rowid"],
                                                            "id": "7"
                                                        }, {
                                                            $set: rowtoedit
                                                        }, {
                                                            upsert: false
                                                        }, function (err, saveddata) {
                                                            if (err) {
                                                                logger.error('Hit Save error', err);
                                                                res.send(500);
                                                                return;
                                                            }
                                                            res.send(200);
                                                            return;
                                                        });
                                                    });
                                                } else {
                                                    delete rowtoedit._id; //fixing the issue of
                                                    if (bodyJson["orgname"] === "") {
                                                        rowtoedit["orgname"] = [""];
                                                        rowtoedit["orgname_rowid"] = [""];
                                                    }
                                                    logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                                    eval('d4dModelNew.' + dbtype).update({
                                                        rowid: bodyJson["rowid"],
                                                        "id": "7"
                                                    }, {
                                                        $set: rowtoedit
                                                    }, {
                                                        upsert: false
                                                    }, function (err, saveddata) {
                                                        if (err) {
                                                            logger.error('Hit Save error', err);
                                                            res.send(500);
                                                            return;
                                                        }
                                                        res.send(200);
                                                        return;
                                                    });
                                                }
                                            } else {
                                                res.send(404);
                                                return;
                                            }
                                        });
                                    }
                                    if (req.params.id === "3") {
                                        d4dModelNew.d4dModelMastersProjects.find({
                                            environmentname_rowid: {
                                                $regex: bodyJson['rowid']
                                            },
                                            id: "4"
                                        }, function (err, project) {
                                            if (!err) {
                                                dissociateProjectWithEnv(project, bodyJson);
                                            }
                                        });
                                    }
                                    logger.debug("Rowid: %s", bodyJson["rowid"]);
                                    var currowid = bodyJson["rowid"];
                                    delete rowtoedit._id; //fixing the issue of
                                    logger.debug('Rowtoedit: %s', JSON.stringify(rowtoedit));
                                    eval('d4dModelNew.' + dbtype).update({
                                        rowid: bodyJson["rowid"]
                                    }, {
                                        $set: rowtoedit
                                    }, {
                                        upsert: false
                                    }, function (err, saveddata) {
                                        if (err) {
                                            logger.error('Hit Save error', err);
                                            res.send(500);
                                            return;
                                        }

                                        if (bodyJson["folderpath"] == undefined) //folderpath issue fix
                                            folderpath = ''
                                        else
                                            folderpath = bodyJson["folderpath"];

                                        //if env is saved then it should be associated with project.
                                        if (req.params.id == '3') {
                                            var projectIds = bodyJson['projectname_rowid'].split(",");
                                            for (var i = 0; i < projectIds.length; i++) {
                                                d4dModelNew.d4dModelMastersProjects.findOne({
                                                    rowid: projectIds[i],
                                                    id: "4"
                                                }, function (err, project) {
                                                    if (!err) {
                                                        updateProjectWithEnv(project, bodyJson);
                                                    }
                                                });
                                            }
                                        }
                                        if (req.params.id === '21') {
                                            var projectName = bodyJson["projectname"];
                                            d4dModelNew.d4dModelMastersTeams.update({
                                                rowid: bodyJson["rowid"],
                                                id: "21"
                                            }, {
                                                $set: {
                                                    projectname: projectName
                                                }
                                            }, {
                                                upsert: false
                                            }, function (err, updateCount) {
                                                if (err) {
                                                    logger.debug("Team update Fail..", err);
                                                }
                                            });
                                        }

                                        if (req.params.id === '1') {
                                            masterUtil.updateTeam(bodyJson['rowid'], function (err, aBody) {
                                                if (err) {
                                                    logger.debug("Error on update Org.".err);
                                                }
                                                logger.debug("Return body: ", JSON.stringify(aBody));
                                            });
                                        }

                                        logger.debug('Master Data Updated: %s', saveddata);
                                        logger.debug('folderpath: %s rowid %s', folderpath, currowid);
                                        //resetting the orgname to empty string when a template type file is uploaded.
                                        if (req.params.id == '17') {
                                            req.params.orgname = "undefined";
                                        }
                                        if (req.params.fileinputs != 'null')
                                            res.send(saveuploadedfile(currowid + '__', folderpath, req));
                                        else
                                            res.send(200);
                                        logger.debug("Exit post() for /d4dMasters/savemasterjsonrownew/%s/%s/%s", req.params.id, req.params.fileinputs, req.params.orgname);
                                        return;
                                    });
                                }

                            }); //end findone

                        }
                    }); //end getdbmodelfromid
                } // if
            }); // getSingleUser
        }); //end of haspermission

    });

    function autoCreateTeams(bodyJson) {
        for (var x = 0; x < 4; x++) {
            var teamName;
            var descriptions;
            if (x === 0) {
                teamName = bodyJson["orgname"] + "_Admins";
                descriptions = "Team For " + teamName;
            } else if (x === 1) {
                teamName = bodyJson["orgname"] + "_DEV";
                descriptions = "Team For " + teamName;
            } else if (x === 2) {
                teamName = bodyJson["orgname"] + "_QA";
                descriptions = "Team For " + teamName;
            } else {
                teamName = bodyJson["orgname"] + "_DevOps";
                descriptions = "Team For " + teamName;
            }

            var teamData = {
                "teamname": teamName,
                "description": descriptions,
                "orgname": bodyJson["orgname"],
                "orgname_rowid": bodyJson["rowid"],
                "rowid": uuid.v4(),
                "id": "21"
            };
            var teamModel = new d4dModelNew.d4dModelMastersTeams(teamData);
            teamModel.save(function (err, aTeam) {
                if (err) {
                    logger.error("Failed to save Team: ", err);
                }
                logger.debug("Auto created Team: ", JSON.stringify(aTeam));
            });

        }
    }

    app.post('/d4dMasters/testingupload/:suffix/:fileinputs', function (req, res) {
        logger.debug("Enter post() for /d4dMasters/testingupload/%s/%s", req.params.suffix, req.params.fileinputs);
        var fi;
        if (req.params.fileinputs.indexOf(',') > 0)
            fi = req.params.fileinputs.split(',');
        else {
            fi = new Array();
            fi.push(req.params.fileinputs);
        }

        var filesNames = Object.keys(req.files);
        var count = filesNames.length;
        logger.debug('in %s', count);
        filesNames.forEach(function (item) {
            logger.debug(item);
        });

        settingsController.getChefSettings(function (settings) {
            var chefRepoPath = settings.chefReposLocation;
            fs.mkdirParent(chefRepoPath + req.params.orgname); //if path is not present create it.
            for (var i = 0; i < fi.length; i++) {
                var controlName = fi[i];
                var fil = eval('req.files.' + fi[i]);
                if (typeof fil != 'undefined') {
                    logger.debug('this is where file gets saved  : %s %s', chefRepoPath, fil.name);
                    fileIo.readFile(fil.path, function (err, data) {
                        fileIo.writeFile(chefRepoPath + req.params.orgname + '/' + controlName + '__' + fil.name, data, null, function (err) {
                            logger.error("Hit error: ", err);
                            count--;
                            if (count === 0) { // all files uploaded
                                res.send("ok");
                            }
                        });
                    });
                }
            }
        });
        res.send(200);
        logger.debug("Exit post() for /d4dMasters/testingupload/%s/%s", req.params.suffix, req.params.fileinputs);
    });

    app.post('/d4dMasters/savemasterjson/:id', function (req, res) {
        //Finding the Master Json if present
        logger.debug("Enter post() for /d4dMasters/savemasterjson/%s", req.params.id);
        d4dModel.findOne({
            id: req.params.id
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (!d4dMasterJson) {
                var d4dmj = new d4dModel({
                    id: '1',
                    masterjson: req.body
                });
                d4dmj.save(function (err, d4dmj) {
                    if (err) {
                        logger.error("Hit and error:", err)
                        res.send(500);
                    }
                    ;
                    logger.debug('saved');
                });
                res.send(200);
            } else {
                d4dMasterJson.masterjson = req.body;
                d4dMasterJson.save(function (err, d4dMasterJson) {
                    if (err) {
                        logger.error("Hit and error:", err)
                    }
                    logger.debug('updated');
                });
                res.send(200);
            }
            logger.debug("Exit post() for /d4dMasters/savemasterjson/%s", req.params.id);
        });
        //mongoose.disconnect();
    });

    app.get('/createbg/:orgname/:bgname', function (req, res) {
        logger.debug("Enter get() for /createbg/%s/%s", req.params.orgname, req.params.bgname);
        var bgfield = "{\"field\":[{\"values\":{\"value\":\"" + req.params.bgname + "\"},\"name\":\"productgroupname\"},{\"values\":{\"value\":\"" + req.params.orgname + "\"},\"name\":\"orgname\"},{\"name\":\"costcode\"}] }";
        db.on('error', console.error.bind(console, 'connection error:'));
        logger.debug(JSON.stringify(bgfield));
        db.once('open', function callback() {
            logger.debug('in once');
        });
        d4dModel.findOne({
            id: '2'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'productgroupname') {
                            if (itm.field[j]["values"].value == req.params.bgname) {
                                logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                hasOrg = true;
                            }
                        }
                    }
                });
                if (hasOrg == false) {
                    //Creating org
                    logger.debug('Creating');
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(bgfield));
                    d4dModel.update({
                        "id": "2"
                    }, {
                        $set: {
                            "masterjson": d4dMasterJson.masterjson
                        }
                    }, {
                        upsert: false
                    }, function (err, data) {
                        if (err) {
                            callback(err, null);
                            res.send(500);
                            return;
                        }
                        res.send(200);
                    });
                } else {
                    res.send(200);
                }

            } else {
                res.status(500).send({
                    "error": err
                });
            }
            logger.debug("Exit get() for /createbg/%s/%s", req.params.orgname, req.params.bgname);

        });
    });


    app.get('/createproj/:orgname/:envname/:prodgroup/:projname', function (req, res) {
        logger.debug("Enter get() for /createproj/%s/%s/%s/%s", req.params.orgname, req.params.envname, req.params.prodgroup, req.params.projname);
        var projField = "{\"field\":[{\"values\":{\"value\":\"" + req.params.projname + "\"},\"name\":\"projectname\"},{\"values\":{\"value\":\"" + req.params.orgname + "\"},\"name\":\"orgname\"},{\"values\":{\"value\":\"" + req.params.prodgroup + "\"},\"name\":\"productgroupname\"},{\"values\":{\"value\":\"" + req.params.envname + "\"},\"name\":\"environmentname\"},{\"values\":{\"value\":[\"Code 1\",\"Code 2\"]},\"name\":\"costcode\"}] }";
        db.on('error', console.error.bind(console, 'connection error:'));
        logger.debug(JSON.stringify(projField));
        db.once('open', function callback() {
            logger.debug('in once');
        });
        logger.debug('received request %s', req.params.orgname);
        d4dModel.findOne({
            id: '4'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    logger.debug("found %s", itm.field.length);

                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'projectname') {
                            if (itm.field[j]["values"].value == req.params.projname) {
                                logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                hasOrg = true;
                            }
                        }
                    }
                });
                if (hasOrg == false) {
                    //Creating org
                    logger.debug('Creating');
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(projField));
                    d4dModel.update({
                        "id": "4"
                    }, {
                        $set: {
                            "masterjson": d4dMasterJson.masterjson
                        }
                    }, {
                        upsert: false
                    }, function (err, data) {
                        if (err) {
                            callback(err, null);
                            res.send(500);
                            return;
                        }
                        res.send(200);
                    });
                } else {
                    res.send(200);
                }

            } else {
                res.status(500).send({
                    "error": err
                });
            }
            logger.debug("Exit get() for /createproj/%s/%s/%s/%s", req.params.orgname, req.params.envname, req.params.prodgroup, req.params.projname);

        });
    });


    app.get('/createenv/:orgname/:envname', function (req, res) {
        logger.debug("Enter get() for /createenv/%s/%s", req.params.orgname, req.params.envname);
        var envField = "{\"field\":[{\"name\":\"environmentname\",\"values\":{\"value\":\"" + req.params.envname + "\"}},{\"name\":\"orgname\",\"values\":{\"value\":\"" + req.params.orgname + "\"}}]}";
        db.on('error', console.error.bind(console, 'connection error:'));
        logger.debug(JSON.stringify(envField));
        db.once('open', function callback() {

        });
        logger.debug('received request %s', req.params.orgname);
        d4dModel.findOne({
            id: '3'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error:", err);
            }
            if (d4dMasterJson) {
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    logger.debug("found %s", itm.field.length);

                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'environmentname') {
                            if (itm.field[j]["values"].value == req.params.envname) {
                                logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                hasOrg = true;
                            }
                        }
                    }
                });
                if (hasOrg == false) {
                    //Creating org
                    logger.debug('Creating');
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(envField));
                    d4dModel.update({
                        "id": "3"
                    }, {
                        $set: {
                            "masterjson": d4dMasterJson.masterjson
                        }
                    }, {
                        upsert: false
                    }, function (err, data) {
                        if (err) {
                            callback(err, null);
                            res.send(500);
                            return;
                        }
                        res.send(200);
                    });
                } else {
                    res.send(200);
                }

            } else {
                res.status(500).send({
                    "error": err
                });
            }
            logger.debug("Exit get() for /createenv/%s/%s", req.params.orgname, req.params.envname);
        });
    });


    app.get('/createorg/:orgname', function (req, res) {
        logger.debug("Enter get() for /createorg/%s", req.params.orgname);
        var orgField = "{\"field\":[{\"values\":{\"value\":\"" + req.params.orgname + "\"},\"name\":\"orgname\"},{\"values\":{\"value\":\"\"},\"name\":\"domainname\"},{\"values\":{\"value\":[\"Dev\",\"Test\",\"Stage\"]},\"name\":\"costcode\"}]}";
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback() {
            logger.debug('in once');
        });
        logger.debug('received request %s', req.params.orgname);
        d4dModel.findOne({
            id: '1'
        }, function (err, d4dMasterJson) {
            if (err) {
                logger.error("Hit and error: ", err);
            }
            if (d4dMasterJson) {
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function (itm, i) {
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'orgname') {
                            if (itm.field[j]["values"].value == req.params.orgname) {
                                logger.debug("found: %s -- %s", i, itm.field[j]["values"].value);
                                hasOrg = true;
                            }
                        }
                    }
                });
                if (hasOrg == false) {
                    //Creating org
                    logger.debug('Creating');
                    d4dMasterJson.masterjson.rows.row.push(JSON.parse(orgField));
                    d4dModel.update({
                        "id": "1"
                    }, {
                        $set: {
                            "masterjson": d4dMasterJson.masterjson
                        }
                    }, {
                        upsert: false
                    }, function (err, data) {
                        if (err) {
                            callback(err, null);
                            res.send(500);
                            return;
                        }
                        res.send(200);
                    });
                } else {
                    res.send(200);
                }

            } else {
                res.status(500).send({
                    "error": err
                });
            }
            logger.debug("Exit get() for /createorg/%s", req.params.orgname);

        });
    });

    app.get('/d4dMasters/:chefserver/cookbooks', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/%s/cookbooks", req.params.chefserver);
        configmgmtDao.getChefServerDetailsByChefServer(req.params.chefserver, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            logger.debug("chefdata %s", chefDetails);

            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getCookbooksList(function (err, cookbooks) {
                logger.error(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send({
                        serverId: chefDetails.rowid,
                        cookbooks: cookbooks
                    });
                    logger.debug("Exit get() for /d4dMasters/%s/cookbooks", req.params.chefserver);
                }
            });
        });
    });

    app.post('/d4dMasters/test', function (req, res) {
        var bodyJson = JSON.parse(JSON.stringify(req.body));
        configmgmtDao.getProjectsForTeams(bodyJson['teamids'], function (err, data) {
            if (!err) {
                res.send(data);
            }
        });
    });

    app.get('/d4dMasters/:chefserver/roles', function (req, res) {
        logger.debug("Enter get() for /d4dMasters/%s/roles", req.params.chefserver);
        configmgmtDao.getChefServerDetailsByChefServer(req.params.chefserver, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            logger.debug("chefdata %s", chefDetails);
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });

            chef.getRolesList(function (err, roles) {
                logger.error(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send({
                        serverId: chefDetails.rowid,
                        roles: roles
                    });
                    logger.debug("Exit get() for /d4dMasters/%s/roles", req.params.chefserver);
                }
            });
        });
    });

    app.get('/d4dMasters/loggedInUser', function (req, res) {
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
            }
            if (anUser.orgname_rowid[0] === "") {
                res.send({
                    "isSuperAdmin": true
                });
                return;
            } else {
                res.send({
                    "isSuperAdmin": false
                });
                return;
            }
        });
    });

    app.get('/d4dMasters/orgs/all/users/7', function (req, res) {
        masterUtil.getUsersForAllOrg(function (err, users) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
            }
            res.send(users);
            return;
        });
    });

    app.get('/d4dMasters/cftTemplate', function (req, res) {
        var templateFile = req.query.templateFile;
        var settings = appConfig.chef;
        var chefRepoPath = settings.chefReposLocation;
        fs.readFile(chefRepoPath + 'catalyst_files/' + templateFile, function (err, data) {
            if (err) {
                logger.error("Unable to read template file " + templateFile, err);
                res.status(500).send({
                    message: "Unable to read file"
                });
                return;
            }
            res.send(200, data);
        });

    });
    app.get('/d4dMasters/configmanagement', function (req, res) {
        masterUtil.getAllActiveOrg(function (err, orgList) {
            logger.debug("got org list ==>", JSON.stringify(orgList));
            if (err) {
                res.status(500).send('Not able to fetch Orgs.');
                return;
            }
            masterUtil.getAllCongifMgmts(orgList, function (err, list) {
                if (err) {
                    logger.debug("Failed to fetch all configmanagement", err);
                    res.status(500).send("Failed to fetch all configmanagement");
                    return;
                }
                res.send(list);
                return;
            });
        });
    });

    app.get('/d4dMasters/organization/:orgId/configmanagement/list', function (req, res) {
        masterUtil.getAllCongifMgmtsForOrg(req.params.orgId, function (err, list) {
            if (err) {
                logger.debug("Failed to fetch all configmanagement", err);
                res.status(500).send("Failed to fetch all configmanagement");
                return;
            }
            res.send(list);
            return;
        });
    });

    app.get('/d4dMasters/configmanagement/:anId', function (req, res) {
        if (!req.params.anId) {
            res.status(400).send({
                message: "Invalid Config Management Id"
            });
            return;
        }
        masterUtil.getCongifMgmtsById(req.params.anId, function (err, data) {
            if (err) {
                logger.debug("Failed to fetch all configmanagement", err);
                res.status(500).send("Failed to fetch all configmanagement");
                return;
            }
            if (!data) {
                res.send(404, "No ConfigManagement Found.");
                return;
            }
            res.send(data);
            return;
        });
    });

    app.get('/d4dMasters/env/:anId', function (req, res) {
        logger.debug("Entered to env");
        masterUtil.getEnvironmentName(req.params.anId, function (err, data) {
            if (err) {
                logger.debug("Failed to fetch  Environment", err);
                res.status(500).send("Failed to fetch  Environment");
                return;
            }
            if (!data) {
                res.send(404, "No Environment Found.");
                return;
            }
            res.send(data);
            return;
        });
    });

    app.get('/d4dMasters/project/:anId', function (req, res) {
        logger.debug("Entered to Project");
        masterUtil.getParticularProject(req.params.anId, function (err, data) {
            if (err) {
                logger.debug("Failed to fetch  Environment", err);
                res.status(500).send("Failed to fetch  Environment");
                return;
            }
            if (!data) {
                res.send(404, "No Environment Found.");
                return;
            }
            res.send(data);
            return;
        });
    });

    app.get('/d4dMasters/projectname/:anId', function (req, res) {
        logger.debug("Entered to Project");
        masterUtil.getProjectName(req.params.anId, function (err, data) {
            if (err) {
                logger.debug("Failed to fetch  Environment", err);
                res.status(500).send("Failed to fetch  Environment");
                return;
            }
            if (!data) {
                res.send(404, "No Environment Found.");
                return;
            }
            res.send(data);
            return;
        });
    });

    app.get('/d4dMasters/docker/:anId', function (req, res) {
        logger.debug("Entered to Project");
        masterUtil.getDockerById(req.params.anId, function (err, data) {
            if (err) {
                logger.debug("Failed to fetch  Docker", err);
                res.status(500).send("Failed to fetch  Docker");
                return;
            }
            if (!data.length) {
                res.send(404, "No Docker Found.");
                return;
            }
            res.send(data[0]);
            return;
        });
    });

    app.post('/d4dMasters/project/:anId/appdeploy/appName/update', function (req, res) {
        logger.debug("Updating appName in Project.");
        var appName = req.body.appName;
        var appDescription = req.body.description;
        var projectId = req.params.anId;
        masterUtil.updateProject(projectId, appName, function (err, data) {
            if (err) {
                logger.debug("Failed to update Project with repo.");
                //res.status(500).send("Failed to update Project with repo.");
            }
            if (data) {
                res.status(200).send("Updated Project with repo.");
            }
        });
    });

    app.get('/d4dMasters/org/:orgId/templateType/:templateType/templates', function (req, res) {
        masterUtil.getTemplatesByOrgAndTemplateType(req.params.orgId, req.params.templateType, function (err, templates) {
            if (err) {
                logger.debug("Error getting templates", err);
                res.status(500).send({
                    "errorCode": 500,
                    "message": "Error getting templates"
                });
                return;
            }
            res.send(templates);
            return;
        });
    });

    // List image tags w.r.t. docker repo and image
    app.get('/d4dMasters/docker/:repository/:image/tags', function (req, res) {
        logger.debug("Called docker image tags.");
        var options_auth = {};
        client = new Client(options_auth);
        var dockerUrl = "https://registry.hub.docker.com/v1/repositories/" + req.params.repository + "/" + req.params.image + "/tags";
        client.registerMethod("jsonMethod", dockerUrl, "GET");
        var reqSubmit = client.methods.jsonMethod(function (data, response) {
            //var json = parser.toJson(data);
            if (util.isArray(data)) {
                res.send(data);
                return;
            } else {
                res.status(404).send("Docker Image not found.");
                return;
            }
        });
    });

    app.get('/d4dMasters/organization/:orgId/repositoryServer/list', function (req, res) {
        var jsonData = {
            orgId: req.params.orgId,
            nexusId: '26',
            dockerId: '18'
        };
        async.parallel({
                server: function (callback) {
                    masterUtil.getServerDetails(jsonData, callback)
                }
            },
            function (err, results) {
                if (err)
                    res.status(500).send("Internal Server Error");
                else if (!results)
                    res.status(400).send("Data is not available for Organization " + req.params.orgId);
                else
                    res.status(200).send(results);
            }
        );
    });

    // List image tags w.r.t. docker repo and image
    // For community image send repository= library
    app.get('/d4dMasters/docker/:dockerId/repository/:repository/image/:image/tags', function (req, res) {
        masterUtil.getDockerById(req.params.dockerId, function (err, docker) {
            if (err) {
                logger.debug("Failed to fetch  Docker", err);
            }
            logger.debug("docker: ", JSON.stringify(docker));
            if (docker && docker.length) {
                var options_auth = {
                    user: docker[0].dockeruserid,
                    password: docker[0].dockerpassword
                };
                client = new Client(options_auth);
                var dockerUrl = "https://registry.hub.docker.com/v1/repositories/" + req.params.repository + "/" + req.params.image + "/tags";
                client.registerMethod("jsonMethod", dockerUrl, "GET");
                var reqSubmit = client.methods.jsonMethod(function (data, response) {
                    if (util.isArray(data)) {
                        res.send(data);
                        return;
                    } else {
                        res.status(404).send("Docker Image not found.");
                        return;
                    }
                });
            } else {
                var options_auth = {};
                client = new Client(options_auth);
                var dockerUrl = "https://registry.hub.docker.com/v1/repositories/" + req.params.repository + "/" + req.params.image + "/tags";
                client.registerMethod("jsonMethod", dockerUrl, "GET");
                var reqSubmit = client.methods.jsonMethod(function (data, response) {
                    if (util.isArray(data)) {
                        res.send(data);
                        return;
                    } else {
                        res.status(404).send("Docker Image not found.");
                        return;
                    }
                });
            }
        });
    });
};