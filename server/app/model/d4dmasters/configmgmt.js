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


var d4dModel = require('./d4dmastersmodel.js');
var d4dModelNew = require('./d4dmastersmodelnew.js');
var codelist = require('../../codelist.json');
var appConfig = require('_pr/config');
var chefSettings = appConfig.chef;
var puppetSettings = appConfig.puppet;
var logger = require('_pr/logger')(module);
var instanceModel = require('../classes/instance/instance.js');
var async = require('async');

function Configmgmt() {
    this.getDBModelFromID = function(id, callback) {
        logger.log('Entering getDBModelFromID');
        switch (id.toString()) {
            case "1":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersOrg');
                break;
            case "2":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersProductGroup');
                break;
            case "3":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersEnvironments');
                break;
            case "4":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersProjects');
                break;
            case "5":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersProjects');
                break;
            case "6":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersUserroles');
                break;
            case "7":
                logger.log('Exting getDBModelFromID  ' + id.toString());
                callback(null, 'd4dModelMastersUsers');
                break;
            case "8":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersglobalaccess');
                break;
            case "9":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersProviders');
                break;
            case "10":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersConfigManagement');
                break;
            case "16":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersDesignTemplateTypes');
                break;
            case "17":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersTemplatesList');
                break;
            case "18":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersDockerConfig');
                break;
            case "19":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersServicecommands');
                break;
            case "20":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelJenkinsConfig');
                break;
            case "21":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersTeams');
                break;
            case "22":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersImages');
                break;
            case "23":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersJira');
                break;
            case "25":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersPuppetServer');
                break;
            case "26":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersNexusServer');
                break;
            case "27":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelBitbucketConfig');
                break;
            case "28":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelOctopusConfig');
                break;
            case "29":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelFunctionalTestConfig');
                break;
            case "30":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersCICDDashboard');
                break;
            case "31":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelSonarqubeConfig');
                break;
            case "32":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersBOTsRemoteServer');
                break;
            case "33":
                logger.log('Exting getDBModelFromID ' + id.toString());
                callback(null, 'd4dModelMastersAnsibleServer');
                break;
                
        }
    };

    this.getCategoryFromID = function(id) {
        logger.log('Entering getDBModelFromID');
        switch (id.toString()) {
            case "1":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('organization');
                break;
            case "2":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('businessgroups');
                break;
            case "3":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('environment');
                break;
            case "4":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('projects');
                break;
            case "5":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('organization');
                break;
            case "7":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('users');
                break;
            case "9":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('provider');
                break;
            case "10":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('chefserver');
                break;
            case "17":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('templates');
                break;
            case "18":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('dockerrepository');
                break;
            case "19":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('services');
                break;
            case "20":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('buildservers');
                break;
            case "21":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('teams');
                break;
            case "22":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('imagegallery');
                break;
            case "23":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('jiraserver');
                break;
            case "25":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('puppetserver');
                break;
            case "26":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('nexusserver');
                break;
            case "27":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('bitbucketserver');
                break;
            case "28":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('octopusserver');
                break;
            case "29":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('fuctionaltestserver');
                break;
            case "30":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('cicddashboard');
                break;
            case "31":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('sonarqubeserver');
                break;
            case "32":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('botremoteserver');
                break;
            case "33":
                logger.log('Exting getDBModelFromID ' + id.toString());
                return ('ansibleserver');
                break;

        };
    };
    this.getChefServerDetails_old = function(rowid, callback) {
        d4dModel.findOne({
            id: '10'
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var chefRepoPath = '';
                var configmgmt = '';
                var settings = chefSettings;
                chefRepoPath = settings.chefReposLocation;
                logger.debug("Repopath:" + chefRepoPath);

                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
                    logger.debug("found" + itm.field.length);
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'rowid') {
                            if (itm.field[j]["values"].value == rowid) {
                                logger.debug("found: " + i + " -- " + itm.field[j]["values"].value);
                                hasOrg = true;
                                //Re-construct the json with the item found

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

                                    } else {
                                        if (configmgmt == '')
                                            configmgmt += "\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                        else
                                            configmgmt += ",\"" + itm.field[k]["name"] + "\":\"" + itm.field[k]["values"].value + "\"";
                                    }
                                }
                                configmgmt += ",\"chefRepoLocation\":\"" + chefRepoPath + orgname + loginname + "\"";

                                configmgmt = "{" + configmgmt + "}";
                                configmgmt = JSON.parse(configmgmt);
                                logger.debug(JSON.stringify(configmgmt));
                            }
                        }

                        // logger.debug();
                    }
                }); // rows loop
                callback(null, configmgmt);

            } else {
                callback(true, null);
            }
        });
    };

    this.getChefServerDetails = function(rowid, callback) {
        var $this = this;
        this.getDBModelFromID("10", function(err, dbtype) {
            if (err) {
                logger.debug("Hit and error getChefServerDetails.getDBModelFromID:" + err);
                callback(true, err);
            }
            if (dbtype) {
                logger.debug("Master Type: " + dbtype + ' rowid : ' + rowid);
                $this.getRowids(function(err, rowidlist) {
                    eval('d4dModelNew.' + dbtype).findOne({
                        rowid: rowid
                    }, function(err, d4dMasterJson) {
                        if (err) {
                            logger.debug("Hit and error @ getChefServerDetails:" + err);
                        }
                        var chefRepoPath = '';
                        var configmgmt = '';
                        var settings = chefSettings;

                        chefRepoPath = settings.chefReposLocation;
                        logger.debug("Repopath:" + chefRepoPath);

                        var outJson = JSON.parse(JSON.stringify(d4dMasterJson));
                        logger.debug('outJson:' + JSON.stringify(d4dMasterJson));
                        if (outJson) {
                            var keys = Object.keys(outJson);
                            var orgname = '';
                            var liveorgname = '';
                            var loginname = '';
                            for (i = 0; i < keys.length; i++) {
                                var k = keys[i];
                                if (keys[i].indexOf("login") >= 0)
                                    loginname = outJson[k] + "/";
                                if (keys[i].indexOf("orgname_rowid") >= 0) {
                                    liveorgname = $this.convertRowIDToValue(outJson[k], rowidlist);
                                    orgname = outJson[k] + "/";
                                }
                            }
                            if (loginname != '' && orgname != '') {
                                for (i = 0; i < keys.length; i++) {
                                    var k = keys[i];
                                    if (keys[i].indexOf('_filename') > 0) {
                                        keys[i] = keys[i].replace('_filename', '');
                                        outJson[k] = chefRepoPath + orgname + loginname + '.chef/' + outJson[k];
                                    }
                                    if (configmgmt == '')
                                        configmgmt = '\"' + keys[i] + '\":\"' + outJson[k] + '\"';
                                    else
                                        configmgmt += ',\"' + keys[i] + '\":\"' + outJson[k] + '\"';

                                }
                                if (configmgmt != '') {
                                    configmgmt += ',\"chefRepoLocation\":\"' + chefRepoPath + orgname + loginname + '\"';
                                    if (liveorgname != '') {
                                        configmgmt += ',\"orgname_new\":\"' + liveorgname + '\"';
                                    }
                                }
                            }
                            configmgmt = JSON.parse('{' + configmgmt + '}');
                            logger.debug("configmgmt---------->>>" + JSON.stringify(configmgmt));
                            callback(null, configmgmt);
                            return;
                        } else {
                            callback(err, null);
                            return;
                        }
                    });
                }); //end getRowids
            }
        });
    };

    this.getPuppetServerDetails = function(rowid, callback) {
        var $this = this;
        this.getDBModelFromID("25", function(err, dbtype) {
            if (err) {
                logger.debug("Hit and error getChefServerDetails.getDBModelFromID:" + err);
                callback(true, err);
            }
            if (dbtype) {
                logger.debug("Master Type: " + dbtype + ' rowid : ' + rowid);
                $this.getRowids(function(err, rowidlist) {
                    eval('d4dModelNew.' + dbtype).findOne({
                        rowid: rowid
                    }, function(err, d4dMasterJson) {
                        if (err) {
                            logger.debug("Hit and error @ getChefServerDetails:" + err);
                        }
                        var chefRepoPath = '';
                        var configmgmt = '';
                        var settings = puppetSettings;

                        chefRepoPath = settings.puppetReposLocation;
                        logger.debug("Repopath:" + chefRepoPath);

                        var outJson = JSON.parse(JSON.stringify(d4dMasterJson));
                        logger.debug('outJson:' + JSON.stringify(d4dMasterJson));
                        if (outJson) {
                            var keys = Object.keys(outJson);
                            var orgname = '';
                            var liveorgname = '';
                            var loginname = '';
                            for (i = 0; i < keys.length; i++) {
                                var k = keys[i];
                                if (keys[i].indexOf("login") >= 0)
                                    loginname = outJson[k] + "/";
                                if (keys[i].indexOf("orgname_rowid") >= 0) {
                                    liveorgname = $this.convertRowIDToValue(outJson[k], rowidlist);
                                    orgname = outJson[k] + "/";
                                }
                            }
                            if (loginname != '' && orgname != '') {
                                for (i = 0; i < keys.length; i++) {
                                    var k = keys[i];
                                    if (keys[i].indexOf('_filename') > 0) {
                                        keys[i] = keys[i].replace('_filename', '');
                                        outJson[k] = chefRepoPath + orgname + loginname + '.chef/' + outJson[k];
                                    }
                                    if (configmgmt == '')
                                        configmgmt = '\"' + keys[i] + '\":\"' + outJson[k] + '\"';
                                    else
                                        configmgmt += ',\"' + keys[i] + '\":\"' + outJson[k] + '\"';

                                }
                                if (configmgmt != '') {
                                    configmgmt += ',\"chefRepoLocation\":\"' + chefRepoPath + orgname + loginname + '\"';
                                    if (liveorgname != '') {
                                        configmgmt += ',\"orgname_new\":\"' + liveorgname + '\"';
                                    }
                                }
                            }
                            callback(null, JSON.parse('{' + configmgmt + '}'));
                            return;
                        } else {
                            callback(err, null);
                            return;
                        }
                    });
                }); //end getRowids
            }
        });
    };

    this.getAccessFilesForRole__ = function(loginname, user, req, res, callback) {

    };

    this.getAccessFilesForRole = function(loginname, user, req, res, callback) {
        logger.debug("Received Role name: " + loginname);
        var accessibleFiles = [];
        var mainRef = this;
        var countOuter = 0;
        var countInner = 0;
        var countInnerInner = 0;
        var roleslist = this.getListFilteredNew(7, "userrolename", "loginname", loginname, function(err, rolenames) {
            if (rolenames) {
                logger.debug("Rolenames for User:" + rolenames);
                var rn = rolenames.replace(/\"/g, '').split(':')[0].split(',');

                rn.forEach(function(rn1) {
                    if (user.rolename == null || user.rolename == '')
                        user.rolename = rn1;
                    else
                        user.rolename += ",&nbsp;" + rn1;

                    logger.debug("Role " + countOuter + ":" + rn1);
                    var permissionlist = mainRef.getListFilteredNew(6, "globalaccessname", "userrolename", rn1, function(err, globalaccessname) {

                        logger.debug("inside globalaccessname : " + (globalaccessname == null));
                        logger.debug("globalaccessname : " + globalaccessname.toString());
                        var ga = globalaccessname.replace(/\"/g, '').split(':')[0].split(',');
                        if (ga) {
                            ga.forEach(function(ga1) {
                                logger.debug('Access Type : ' + ga1);
                                mainRef.getListFilteredNew(8, "files", "globalaccessname", ga1, function(err, jlt) {
                                    countInner++;
                                    logger.debug('inner loop ' + jlt);
                                    //count++;
                                    if (accessibleFiles.indexOf(jlt) < 0) {
                                        jlt = jlt.split(':')[0];
                                        accessibleFiles.push(jlt);
                                    }
                                    logger.debug(countOuter, rn.length, countInner, ga.length);
                                    if (countOuter < rn.length) {

                                    }
                                    if (countInner == ga.length && countOuter < rn.length) {
                                        countOuter++;
                                        if (countOuter < rn.length) {
                                            countInner = 0;
                                        }

                                    }
                                    logger.debug(countOuter, rn.length, countInner, ga.length);
                                    if (countOuter == rn.length && countInner == ga.length) {
                                        callback(null, accessibleFiles.toString());

                                    }
                                });
                            });
                        }
                    });

                }); //end of foreach rn

            } //end if(rolename)

        }); //filter1
        // callback(null,accessibleFiles.toString());
    };

    this.getAccessFilesForRole2 = function(loginname, req, res, callback) {
        logger.debug("Received Role name: " + loginname);
        var accessibleFiles = [];
        var mainRef = this;
        var countOuter = 0;
        var roleslist = this.getListFilteredNew(7, "userrolename", "loginname", loginname, function(err, rolenames) {
            if (rolenames) {
                logger.debug("Rolenames for User:" + rolenames);
                var rn = rolenames.replace(/\"/g, '').split(':')[0].split(',');
                if (rn) {

                    rn.forEach(function(rn1) {
                        logger.debug("Role " + countOuter + ":" + rn1);
                        countOuter++;
                        var permissionlist = mainRef.getListFilteredNew(5, "globalaccessname", "userrolename", rn1, function(err, globalaccessname) {
                            logger.debug("inside" + (globalaccessname == null));
                            if (err) {
                                logger.debug("Hit and error:" + err);
                            }
                            if (globalaccessname) {

                                var ga = globalaccessname.replace(/\"/g, '').split(':')[0].split(',');
                                if (ga) {
                                    var count = 0;
                                    ga.forEach(function(ga1) {
                                        mainRef.getListFilteredNew(8, "files", "globalaccessname", ga1, function(err, jlt) {
                                            logger.debug('inner loop ' + jlt);
                                            count++;
                                            if (accessibleFiles.indexOf(jlt) < 0) {
                                                accessibleFiles.push(jlt);
                                            }
                                            if (count == ga.length) {
                                                //callback(null,accessibleFiles.toString());
                                            }
                                        });
                                    });

                                }
                            }
                            if (countOuter == rn.length) {

                            }
                        });
                    });

                } else
                    callback("err", null);
                /* */

            }
        });
        // callback(null,"HIT");
    };
    //Receiving the permission level for Role
    this.getAccessFilesForRole1 = function(rolename, req, res, callback) {
        logger.debug("Received Role name: " + rolename);
        var accessibleFiles = [];
        var mainRef = this;
        var roleslist = this.getListFilteredNew(6, "globalaccessname", "userrolename", rolename, function(err, globalaccessname) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (globalaccessname) {
                var ga = globalaccessname.replace(/\"/g, '').split(':')[0].split(',');
                if (ga) {
                    var testing = function(ga, callback) {
                        for (var k = 0; k < ga.length; k++) {
                            logger.debug('Set Global Access : ' + ga[k]);


                            var justlikethat = mainRef.getListFilteredNew(8, "files", "globalaccessname", ga[k], function(err, gafiles) {
                                if (gafiles) {

                                    var gaf = gafiles.split(',');
                                    for (var l = 0; l < gaf.length; l++) {
                                        if (accessibleFiles.indexOf(gaf[l]) < 0) {
                                            accessibleFiles.push(gaf[l]);
                                            logger.debug('File List for Global ' + accessibleFiles);

                                        }
                                    }
                                }
                            });

                        }

                    }

                }
            }
        }); //end call back getlistfiltereed
        logger.debug('Final :' + accessibleFiles);
    };

    this.getChefServerDetailsByChefServer = function(paramconfigname, callback) {

        d4dModelNew.d4dModelMastersConfigManagement.findOne({
            configname: paramconfigname,
            id: 10
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var chefRepoPath = '';
                var configmgmt = '';
                var settings = chefSettings;
                chefRepoPath = settings.chefReposLocation;
                logger.debug("Repopath:" + chefRepoPath);
                logger.debug("paramorgname :" + paramorgname);
                var hasOrg = false;
                var outJson = JSON.parse(JSON.stringify(d4dMasterJson));
                logger.debug('outJson:' + JSON.stringify(d4dMasterJson));
                var keys = Object.keys(outJson);
                var orgname = outJson['orgname'];
                var loginname = outJson['loginname'];
                for (i = 0; i < keys.length; i++) {
                    var k = keys[i];


                    if (keys[i].indexOf("_filename") >= 0) {
                        if (configmgmt == '')
                            configmgmt += "\"" + keys[i].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + '/' + loginname + '/.chef/' + outJson[k] + "\"";
                        else
                            configmgmt += ",\"" + keys[i].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + '/' + loginname + '/.chef/' + outJson[k] + "\"";
                    } else {
                        if (configmgmt == '')
                            configmgmt += "\"" + keys[i] + "\":\"" + outJson[k] + "\"";
                        else
                            configmgmt += ",\"" + keys[i] + "\":\"" + outJson[k] + "\"";
                    }

                }
                configmgmt += ",\"chefRepoLocation\":\"" + chefRepoPath + orgname + '/' + loginname + "/\"";

                configmgmt = "{" + configmgmt + "}";
                logger.debug('Read Config:' + configmgmt);
                callback(null, configmgmt);
                return;


            } else {
                callback(true, null);
            }
        });
    }

    this.getChefServerDetailsByOrgname = function(paramorgname, callback) {



        d4dModelNew.d4dModelMastersConfigManagement.findOne({
            orgname_rowid: paramorgname,
            id: 10
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var chefRepoPath = '';
                var configmgmt = '';
                var settings = chefSettings;
                chefRepoPath = settings.chefReposLocation;
                logger.debug("Repopath:" + chefRepoPath);
                logger.debug("paramorgname :" + paramorgname);
                var hasOrg = false;
                var outJson = JSON.parse(JSON.stringify(d4dMasterJson));
                logger.debug('outJson:' + JSON.stringify(d4dMasterJson));
                var keys = Object.keys(outJson);
                var orgname = outJson['orgname_rowid'];
                var loginname = outJson['loginname'];
                for (i = 0; i < keys.length; i++) {
                    var k = keys[i];


                    if (keys[i].indexOf("_filename") >= 0) {
                        if (configmgmt == '')
                            configmgmt += "\"" + keys[i].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + '/' + loginname + '/.chef/' + outJson[k] + "\"";
                        else
                            configmgmt += ",\"" + keys[i].replace('_filename', '') + "\":\"" + chefRepoPath + orgname + '/' + loginname + '/.chef/' + outJson[k] + "\"";
                    } else {
                        if (configmgmt == '')
                            configmgmt += "\"" + keys[i] + "\":\"" + outJson[k] + "\"";
                        else
                            configmgmt += ",\"" + keys[i] + "\":\"" + outJson[k] + "\"";
                    }

                }
                configmgmt += ",\"chefRepoLocation\":\"" + chefRepoPath + orgname + '/' + loginname + "/\"";

                configmgmt = "{" + configmgmt + "}";
                logger.debug('Read Config:' + configmgmt);
                callback(null, JSON.parse(configmgmt));
                return;
            } else {
                callback(true, null);
            }
        });
    }

    this.getProvider = function(rowid, callback) {

        d4dModel.findOne({
            id: '9'
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var configmgmt = '';
                var chefRepoPath = '';
                var hasOrg = false;
                d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
                    logger.debug("found" + itm.field.length);
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == 'rowid') {
                            if (itm.field[j]["values"].value == rowid) {
                                logger.debug("found: " + i + " -- " + itm.field[j]["values"].value);
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
                callback(null, configmgmt);
            }
        });

    };

    this.getMasterRow = function(masterid, fieldname, fieldvalue, callback) {
        logger.debug('In getMasterRow __ : ' + masterid + ' ' + fieldname + ' ' + fieldvalue);
        if(fieldvalue == 'null' || fieldvalue == null)
        {
            logger.debug('hit..null');
            callback(null, '');
            return;
        }
        this.getDBModelFromID(masterid, function(err, dbtype) {
            if (err) {
                logger.debug("Hit and error getChefServerDetails.getDBModelFromID:" + err);
                callback(true, err);
            }
            if (dbtype) {
                logger.debug("Master Type: " + dbtype);
                var query = {};
                query[fieldname] = fieldvalue; //building the query 
                query['id'] = masterid;
                logger.debug('d4dModelNew.' + dbtype + '.findOne(' + JSON.stringify(query) + ')');
                eval('d4dModelNew.' + dbtype).findOne(query, function(err, d4dMasterJson) {
                    if (err) {
                        logger.debug("Hit and error @ getChefServerDetails:" + err);
                    }
                    if (d4dMasterJson) {
                        logger.debug('Before callback' + JSON.stringify(d4dMasterJson));
                        callback(null, JSON.stringify(d4dMasterJson));
                    } else
                        callback(null, '');

                });
            } //end dbtype
        }); //end get dbmodel
    };

    this.getList = function(masterid, fieldname, callback) {
        var configmgmt = '';
        d4dModel.findOne({
            id: masterid
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
                callback(err, null);
                return;
            }
            if (d4dMasterJson) {
                var jsonlist = '';
                d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
                    logger.debug("found" + itm.field.length);
                    var rowid = '';
                    var fieldvalue = '';
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == fieldname) {
                            fieldvalue = itm.field[j]["values"].value;
                        }
                        if (itm.field[j]["name"] == "rowid") {
                            rowid = itm.field[j]["values"].value;
                        }
                    }
                    if (jsonlist == '')
                        jsonlist += "{\"" + fieldvalue + "\":\"" + rowid + "\"}";
                    else
                        jsonlist += ",{\"" + fieldvalue + "\":\"" + rowid + "\"}";

                });
                configmgmt = "[" + jsonlist + "]";
                logger.debug(JSON.stringify(configmgmt));
                callback(null, JSON.parse(configmgmt));;
            }
        });
    };
    this.getProjectsForTeams = function(teamids, callback) {
        logger.debug('rcvd teamids: ' + teamids);
        var query = {};
        teamids = teamids.split(',');
        query['rowid'] = {
            '$in': teamids
        }
        query['id'] = '21';
        var projects = [];
        d4dModelNew.d4dModelMastersTeams.find(query, function(err, teamjson) {
            if (err) {
                logger.error('d4dModelMastersTeams' + err);
                callback(err, null);
                return;
            }
            teamjson.forEach(function(k, v) {
                if (k['projectname_rowid'].indexOf(',') > 0) {
                    var projs = k['projectname_rowid'].split(',');
                    for (var prj in projs) {
                        if (projects.indexOf(projs) < 0)
                            projects.push(projs);
                    }
                } else {
                    if (projects.indexOf(k['projectname_rowid']) < 0)
                        projects.push(k['projectname_rowid']);
                }
                if (v >= teamjson.length - 1) {
                    logger.debug('teamjson', JSON.stringify(projects));
                    callback(null, projects);
                }
            });

        });
    };

    this.getProjectsForOrgs = function(orgId, callback) {
        d4dModelNew.d4dModelMastersProjects.find({
            orgname_rowid: orgId,
            id: "4"
        }, function(err, data) {
            if (err) {
                callback(err, null);
            }
            callback(null, data);
        });
    };
    this.convertRowIDToValue = function(rowid, rowidcont) {
        var toreturn = '';
        var jobj = JSON.parse(JSON.stringify(rowidcont));
        for (var k1 in jobj) {
            //if any key has _rowid then update corresponding field
            for (var k2 in jobj[k1]) {
                if (k2 == rowid)
                    toreturn = jobj[k1][k2];
            }

        }
        logger.debug('returned convertRowIDToValue', toreturn, rowid);
        return (toreturn);
    };

    this.getRowids = function(callback) {
        var rowidval = [];
        logger.debug('getRowids in');
        d4dModelNew.d4dModelMastersOrg.find({
            id: "1"
        }, function(err, orgdata) {
            if (orgdata) {
                var orgdata_ = JSON.parse(JSON.stringify(orgdata));
                orgdata_.forEach(function(k, v) {
                    var rid = {};
                    rid[k['rowid']] = k['orgname'];
                    rowidval.push(rid);
                });

            }
            logger.debug('finised orgdata' + JSON.stringify(rowidval));
            d4dModelNew.d4dModelMastersProductGroup.find({
                id: "2"
            }, function(err, bgdata) {
                if (bgdata) {
                    var bgdata_ = JSON.parse(JSON.stringify(bgdata));
                    bgdata_.forEach(function(k, v) {
                        var rid = {};
                        rid[k['rowid']] = k['productgroupname'];
                        rowidval.push(rid);
                    });

                }
                d4dModelNew.d4dModelMastersProjects.find({
                    id: "4"
                }, function(err, prjdata) {
                    if (prjdata) {
                        var prjdata_ = JSON.parse(JSON.stringify(prjdata));
                        prjdata_.forEach(function(k, v) {
                            var rid = {};
                            rid[k['rowid']] = k['projectname'];
                            rowidval.push(rid);
                        });

                    }
                    d4dModelNew.d4dModelMastersConfigManagement.find({
                        id: "10"
                    }, function(err, cfgdata) {
                        if (cfgdata) {
                            var cfgdata_ = JSON.parse(JSON.stringify(cfgdata));
                            cfgdata_.forEach(function(k, v) {
                                var rid = {};
                                rid[k['rowid']] = k['configname'];
                                rowidval.push(rid);
                            });

                        }
                        d4dModelNew.d4dModelMastersEnvironments.find({
                            id: "3"
                        }, function(err, envdata) {
                            if (envdata) {

                                var envdata_ = JSON.parse(JSON.stringify(envdata));
                                if (envdata_.length <= 0) {
                                    logger.debug('rowidval' + JSON.stringify(rowidval));
                                    callback(null, rowidval);
                                    return;
                                }

                                envdata_.forEach(function(k, v) {
                                    var rid = {};
                                    rid[k['rowid']] = k['environmentname'];
                                    rowidval.push(rid);
                                });
                            }

                            d4dModelNew.d4dModelMastersUsers.find({
                                id: "7"
                            }, function(err, userdata) {
                                if (userdata) {
                                    var userdata_ = JSON.parse(JSON.stringify(userdata));
                                    if (userdata_.length <= 0) {
                                        logger.debug('rowidval' + JSON.stringify(rowidval));
                                        callback(null, rowidval);
                                        return;
                                    }

                                    userdata_.forEach(function(k, v) {
                                        var rid = {};
                                        rid[k['rowid']] = k['loginname'];
                                        rowidval.push(rid);
                                    });
                                }

                                d4dModelNew.d4dModelMastersTeams.find({
                                    id: "21"
                                }, function(err, teamdata) {
                                    if (teamdata) {
                                        var teamdata_ = JSON.parse(JSON.stringify(teamdata));
                                        if (teamdata_.length <= 0) {
                                            logger.debug('rowidval' + JSON.stringify(rowidval));
                                            callback(null, rowidval);
                                            return;
                                        }
                                        var i = 0;
                                        teamdata_.forEach(function(k, v) {
                                            var rid = {};
                                            rid[k['rowid']] = k['teamname'];
                                            rowidval.push(rid);
                                        });

                                        logger.debug("End of Team.");
                                        callback(null, rowidval);
                                        return;
                                    } else {
                                        logger.debug("Else in Team.");
                                        callback(null, rowidval);
                                        return;
                                    }
                                }); //teams

                            }); //userdata 
                        }); //env
                    }); //config management
                }); // proj
            }); //bg
        }); //org
    };


    this.getListNew = function(mastername, fieldname, callback) {
        logger.debug(mastername);
        this.getDBModelFromID(mastername, function(err, dbtype) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (dbtype) {
                var query = {};
                query['id'] = mastername;

                logger.debug("Master Type: " + dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function(err, d4dMasterJson) {
                    if (err) {
                        logger.debug("Hit and error:" + err);
                    }
                    var d4d = JSON.parse(JSON.stringify(d4dMasterJson));
                    var jsonlist = '';
                    d4d.forEach(function(k, v) {
                        var ke = Object.keys(k);
                        logger.debug(k[fieldname], k['rowid'], v);
                        if (jsonlist == '')
                            jsonlist += "{\"" + k[fieldname] + "\":\"" + k['rowid'] + "\"}";
                        else
                            jsonlist += ",{\"" + k[fieldname] + "\":\"" + k['rowid'] + "\"}";

                    });
                    configmgmt = "[" + jsonlist + "]";
                    logger.debug("sent response" + JSON.stringify(configmgmt));
                    callback(null, configmgmt);

                });
            }
        });
    };

    this.getListFiltered = function(masterid, fieldname, comparedfieldname, comparedfieldvalue, callback) {
        d4dModel.findOne({
            id: masterid
        }, function(err, d4dMasterJson) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (d4dMasterJson) {
                var jsonlist = '';
                d4dMasterJson.masterjson.rows.row.forEach(function(itm, i) {
                    var rowid = '';
                    var fieldvalue = '';
                    var isFilteredRow = false;
                    //filtering for the correct rows
                    for (var j = 0; j < itm.field.length; j++) {
                        if (itm.field[j]["name"] == comparedfieldname) {
                            if (itm.field[j]["values"].value == comparedfieldvalue) {
                                logger.debug("In Field [ " + itm.field[j]["name"] + "]" + itm.field[j]["values"].value);
                                isFilteredRow = true;

                            }
                        }
                    }
                    if (isFilteredRow) {
                        for (var j = 0; j < itm.field.length; j++) {
                            if (itm.field[j]["name"] == fieldname) {
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
                    }

                });
                configmgmt = "{" + jsonlist + "}";
                logger.debug(JSON.stringify(jsonlist));
                callback(null, jsonlist);
                return (jsonlist);
            }
        });
    };

    this.getListFilteredNew = function(mastername, fieldname, comparedfieldname, comparedfieldvalue, callback) {
        logger.debug(mastername);
        this.getDBModelFromID(mastername, function(err, dbtype) {
            if (err) {
                logger.debug("Hit and error:" + err);
            }
            if (dbtype) {
                var query = {};
                query[comparedfieldname] = comparedfieldvalue; //building the query 
                query['id'] = mastername;

                logger.debug("Master Type: " + dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function(err, d4dMasterJson) {
                    if (err) {
                        logger.debug("Hit and error:" + err);
                    }
                    var d4d = JSON.parse(JSON.stringify(d4dMasterJson));
                    var jsonlist = '';
                    d4d.forEach(function(k, v) {
                        var ke = Object.keys(k);
                        logger.debug(ke.length + ' ' + k[fieldname]);
                        if (jsonlist == '')
                            jsonlist += "\"" + k[fieldname] + "\":\"" + k['rowid'] + "\"";
                        else
                            jsonlist += ",\"" + k[fieldname] + "\":\"" + k['rowid'] + "\"";
                    });
                    configmgmt = "{" + jsonlist + "}";
                    logger.debug("sent response" + JSON.stringify(configmgmt));
                    callback(null, jsonlist);

                });
            }
        });
    };

    this.getCodeList = function(name, callback) {
        if (codelist) {
            var count = 0;
            var list = '';
            logger.debug('Code List Items length: ' + codelist.length);
            codelist.forEach(function(k, v) {
                logger.debug("Code items: ", k.name, "Values", k.values.length);
                if (k.name == name) {
                    for (var i = 0; i < k.values.length; i++) {
                        if (list == '') {
                            list = k.values[i];
                        } else
                            list += ',' + k.values[i];

                        logger.debug(k.values[i]);
                    }
                }
                count++;
                if (count >= codelist.length) {
                    logger.debug('reached callback');
                    callback(null, list);
                }
            });
        }
    };

    this.deactivateOrg = function(orgid, action, callback) {
        logger.debug("Orgid:" + orgid + ' action: ' + action);
        d4dModelNew.d4dModelMastersGeneric.update({
            $or: [{
                orgname_rowid: orgid
            }, {
                rowid: orgid
            }]
        }, {
            $set: {
                active: action
            }
        }, {
            upsert: false,
            multi: true
        }, function(err, data) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }
            logger.debug('Deactivated ' + orgid + ' in masters. Count: ' + data);
            callback(null, "done");
            return;
        });
    };

    this.deactivateBotEngine = function(orgid, action, callback) {
        logger.debug("Orgid:" + orgid + ' action: ' + action);
        d4dModelNew.d4dModelMastersGeneric.update({
            $or: [{
                orgname_rowid: orgid
            }, {
                rowid: orgid
            }]
        }, {
            $set: {
                active: action
            }
        }, {
            upsert: false,
            multi: true
        }, function(err, data) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }
            logger.debug('Deactivated ' + orgid + ' in masters. Count: ' + data);
            callback(null, "done");
            return;
        });
    };

    this.deleteCheck = function(rowId,checkDependency, callback) {
        if(checkDependency.length > 0) {
            var results = [];
            async.waterfall([
                function(next){
                    for (var i = 0; i < checkDependency.length; i++) {
                        if (checkDependency[i].id === 'instances') {
                            checkInstancesDependency(rowId, checkDependency[i], function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    next({errCode:500,
                                        errMsg:"Error in Instance Dependency Check"}, null);
                                }
                                if (data !== 'none') {
                                    next({errCode:412,
                                        errMsg:data}, null);
                                }else{
                                    results.push(data);
                                    if(results.length === checkDependency.length){
                                        next(null, 'none');
                                    }
                                }
                            });
                        } else if (checkDependency[i].id === 'blueprints') {
                            checkBPDependency(rowId, checkDependency[i], function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    next({errCode:500,
                                        errMsg:"Error in Blueprint Dependency Check"}, null);
                                }
                                if (data !== 'none') {
                                    next({errCode:412,
                                        errMsg:data}, null);
                                }else{
                                    results.push(data);
                                    if(results.length === checkDependency.length){
                                        next(null, data);
                                    }
                                }
                            });
                        } else {
                            checkMastersDependency(rowId, checkDependency[i], function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    next({errCode:500,
                                        errMsg:"Error in Master Dependency Check"}, null);
                                    return;
                                }
                                if (data !== 'none') {
                                    next({errCode:412,
                                        errMsg:data}, null);
                                }else{
                                    results.push(data);
                                    if(results.length === checkDependency.length){
                                        next(null, data);
                                    }
                                }
                            });
                        }
                    }
                }
            ],function(err,results){
                if(err){
                    callback(err,null);
                    return;
                }
                callback(null,results);
            })
        }else{
            callback(null,'none');
        }
    };

    this.getServiceFromId = function(serviceId, callback) {
        this.getDBModelFromID('19', function(err, dbtype) {
            if (err) {
                callback(err, null);
                return;
            }
            if (dbtype) {
                var query = {};
                query['rowid'] = {
                    '$in': [serviceId]
                }
                query['id'] = '19';

                logger.debug("Master Type: " + dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function(err, d4dMasterJson) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    callback(null, d4dMasterJson);
                });
            } else {
                callback({
                    "msg": "Invalid DBTYPE"
                }, null);
            }
        });
    };

    this.getJenkinsDataFromId = function(serverId, callback) {
        this.getDBModelFromID('20', function(err, dbtype) {
            if (err) {
                callback(err, null);
                return;
            }
            if (dbtype) {
                var query = {};
                query['rowid'] = {
                    '$in': [serverId]
                }
                query['id'] = '20';

                logger.debug("Master Type: " + dbtype);
                eval('d4dModelNew.' + dbtype).find(query, function(err, d4dMasterJson) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    callback(null, d4dMasterJson);
                });
            } else {
                callback({
                    "msg": "Invalid DBTYPE"
                }, null);
            }
        });
    };


    this.getEnvNameFromEnvId = function(envId, callback) {
        var self = this;
        this.getRowids(function(err, rowidlist) {
            if (err) {
                callback(err, null);
                return;
            } else {
                var envName = self.convertRowIDToValue(envId, rowidlist)
                logger.debug(envName);
                callback(null, envName);
            }
        });
    };

    this.getOrgBgProjEnvNameFromIds = function(orgId, bgId, projId, envId, callback) {
        var self = this;
        this.getRowids(function(err, rowidlist) {
            if (err) {
                callback(err, null);
                return;
            } else {
                var names = {};

                names.envName = self.convertRowIDToValue(envId, rowidlist);
                names.orgName = self.convertRowIDToValue(orgId, rowidlist);
                names.bgName = self.convertRowIDToValue(bgId, rowidlist);
                names.projName = self.convertRowIDToValue(projId, rowidlist);

                logger.debug(names);
                callback(null, names);
            }
        });
    };

    this.getTeamsOrgBuProjForUser = function(username, callback) {
        logger.debug('Entering getTeamsOrgBuProjForUser');
        var outJ = [];
        var query = {};
        query['loginname'] = username;
        query['id'] = '7';
        d4dModelNew.d4dModelMastersUsers.find(query, function(err, userd) {
            if (err) {
                logger.debug('Exiting with err 1336 getTeamsOrgBuProjForUser');
                callback(err, null);
                return;
            }
            if (userd) {
                //Get teams for user
                logger.debug('In getTeamsOrgBuProjForUser userd :' + JSON.stringify(userd[0]));
                outJ.push({
                    userid: userd[0]['rowid'],
                    teams: [],
                    orgs: [],
                    projects: [],
                    bunits: [],
                });
                var qry = {};
                qry['id'] = '21';
                qry['loginname_rowid'] = userd[0]['rowid'];
                d4dModelNew.d4dModelMastersTeams.find({
                    id: "21",
                    loginname_rowid: {
                        $regex: userd[0]['rowid']
                    }
                }, function(err, teamd) {
                    if (err) {
                        logger.debug('Exiting with err 1359 getTeamsOrgBuProjForUser');
                        callback(err, null);
                        return;
                    }
                    if (teamd.length > 0) {
                        teamd.forEach(function(k, v) {
                            if (typeof k['projectname_rowid'] != "undefined") {
                                outJ[0].teams.push(k['rowid']);
                                var projs = k['projectname_rowid'].split(',');
                                for (var i = 0; i < projs.length; i++) {

                                    if (outJ[0].projects.indexOf(projs[i]) < 0) {
                                        outJ[0].projects.push(projs[i]);

                                    }
                                    if (v >= teamd.length - 1 && i >= (projs.length - 1)) {
                                        //All projects added.
                                        var qry1 = {};
                                        qry1['id'] = '4';
                                        if (userd[0]['userrolename'] != 'Admin')
                                            qry1['rowid'] = {
                                                $in: outJ[0].projects
                                            };

                                        d4dModelNew.d4dModelMastersProjects.find(qry1, function(err, projd) {
                                            if (err) {
                                                logger.debug('Exiting with err 1386 getTeamsOrgBuProjForUser');
                                                callback(err, null);
                                                return;
                                            }
                                            logger.debug("No Projects..... ", JSON.stringify(projd));
                                            if (projd.length > 0) {
                                                for (var j = 0; j < projd.length; j++) {
                                                    var orglist = projd[j]['orgname_rowid'];
                                                    var bulist = projd[j]['productgroupname_rowid'].split(',');
                                                    for (var k = 0; k < orglist.length; k++) {
                                                        if (outJ[0]['orgs'].indexOf(orglist[k]) < 0)
                                                            outJ[0]['orgs'].push(orglist[k]);
                                                    }
                                                    for (var k = 0; k < bulist.length; k++) {
                                                        if (outJ[0]['bunits'].indexOf(bulist[k]) < 0)
                                                            outJ[0]['bunits'].push(bulist[k]);
                                                    }
                                                    if (j >= projd.length - 1) {
                                                        logger.debug('Came to the last project');
                                                        logger.debug('Exiting getTeamsOrgBuProjForUser');
                                                        callback(null, outJ);
                                                    }
                                                }

                                            } else {
                                                logger.debug('Exiting with err 1411 getTeamsOrgBuProjForUser');
                                                callback(null, outJ);
                                                return;
                                            }
                                        });
                                    }
                                }
                            } else {
                                logger.debug("Return proj value: ", outJ);
                                callback(null, outJ);
                                return;
                            }
                        });
                    } else {
                        callback(null, outJ);
                        return;
                    }
                });
            } else {
                callback(null, outJ);
            }
        }); //d4dModelMastersUsers
    };

}

function checkBPDependency(rowid, bpCheckDetails,callback) {
    var blueprintModel = require('../blueprint/blueprint.js');
    blueprintModel.checkBPDependencyByFieldName(bpCheckDetails.fieldName,rowid, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else if (data.length > 0) {
            logger.debug('Blueprint Found in ' + data['name'] + ' returning : ');
            callback(null, bpCheckDetails.errMsg);
            return;
        } else {
            callback(null, 'none');
            return;
        }
    });
}

function checkInstancesDependency(rowid, instanceCheckDetails,callback) {
    instanceModel.checkInstancesDependencyByFieldName(instanceCheckDetails.fieldName,rowid, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else if (data.length > 0) {
            logger.debug('Instance Found in ' + data['name'] + ' returning : ');
            callback(null, instanceCheckDetails.errMsg);
            return;
        } else {
            callback(null, 'none');
            return;
        }
    });
}

function checkMastersDependency(rowid, masterCheckDetails,callback) {
    var checkDependentQuery = {};
    checkDependentQuery.id = masterCheckDetails.id;
    if (masterCheckDetails.fieldName.indexOf(',') > 0) {
        var fieldNames = masterCheckDetails.fieldName.split(',');
        for (i in fieldNames) {
            checkDependentQuery[i] = {
                $regex: rowid
            };
        }
    }else{
        checkDependentQuery[masterCheckDetails.fieldName] = {
            $regex: rowid
        };
    }
    d4dModelNew.d4dModelMastersGeneric.find(checkDependentQuery, function(err, d4dMasterJson) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        } else if (d4dMasterJson.length > 0) {
            logger.debug('Master data Found in returning : ');
            callback(null, masterCheckDetails.errMsg);
            return;
        } else {
            callback(null,'none');
            return;
        }
    });
}

module.exports = new Configmgmt();
