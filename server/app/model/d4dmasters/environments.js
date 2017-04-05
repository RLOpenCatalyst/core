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

var uuid = require('node-uuid');
var d4dModelNew = require('./d4dmastersmodelnew.js');
var logger = require('_pr/logger')(module);

function Env() {
    this.createEnv = function(envObj, callback) {
        envObj.rowid = uuid.v4();
        d4dModelNew.d4dModelMastersEnvironments.findOne({
            environmentname: envObj.environmentname,
            orgname_rowid: envObj.orgname_rowid,
            id: '3'
        }, function (err, envdata) {
            if (err) {
                callback(err, null);
                return;
            } else if (!envdata) {
                var masterDb = new d4dModelNew.d4dModelMastersEnvironments(envObj);
                masterDb.save(function (err, data) {
                    if (err) {
                        callback(err, null);
                        return;
                    } else {
                        d4dModelNew.d4dModelMastersProjects.findOne({
                            orgname_rowid: envObj.orgname_rowid,
                            rowid: envObj.projectname_rowid,
                            id: '4'
                        }, function (err, projectData) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                var newEnvId = '', newEnvName = '';
                                if (projectData.environmentname_rowid !== '' && projectData.environmentname !== '') {
                                    var envIds = projectData.environmentname_rowid.split(',');
                                    var envNames = projectData.environmentname.split(',');
                                    if (envIds.indexOf(envObj.rowid) >= 0 && envNames.indexOf(envObj.environmentname) >= 0) {
                                        logger.debug("In Callback Env found in list");
                                        callback(null, envObj.rowid);
                                        return;
                                    }
                                    newEnvId = projectData.environmentname_rowid + ',';
                                    newEnvName = projectData.environmentname + ',';
                                }
                                newEnvId += envObj.rowid;
                                newEnvName += envObj.environmentname;
                                d4dModelNew.d4dModelMastersProjects.update({
                                    orgname_rowid: envObj.orgname_rowid,
                                    rowid: envObj.projectname_rowid,
                                    id: '4'
                                }, {
                                    environmentname_rowid: newEnvId,
                                    environmentname: newEnvName
                                }, function (err, projectUpdateStatus) {
                                    if (err) {
                                        callback(err, null);
                                        return;
                                    } else {
                                        callback(null, envObj.rowid);
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            }else if (envdata.projectname_rowid !== '' && envdata.projectname !== '') {
               
                var newProjectId = '', newProjectName = '';
                var projectIds = envdata.projectname_rowid.split(',');
                var projectNames = envdata.projectname.split(',');
                if (projectIds.indexOf(envObj.projectname_rowid) === -1 && projectNames.indexOf(envObj.projectname) === -1) {
                    newProjectId = envdata.projectname_rowid + ',' + envObj.projectname_rowid;
                    newProjectName = envdata.projectname + ',' + envObj.projectname;
                    d4dModelNew.d4dModelMastersEnvironments.update({
                        environmentname: envObj.environmentname,
                        orgname_rowid: envObj.orgname_rowid,
                        id: '3'
                    }, {
                        projectname_rowid: newProjectId,
                        projectname: newProjectName
                    }, function (err, envUpdateStatus) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else {
                            d4dModelNew.d4dModelMastersProjects.findOne({
                                orgname_rowid: envObj.orgname_rowid,
                                rowid: envObj.projectname_rowid,
                                id: '4'
                            }, function (err, projectData) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                } else {
                                    var newEnvId = '', newEnvName = '';
                                    if (projectData.environmentname_rowid !== '' && projectData.environmentname !== '') {
                                        var envIds = projectData.environmentname_rowid.split(',');
                                        var envNames = projectData.environmentname.split(',');
                                        if (envIds.indexOf(envdata.rowid) >= 0 && envNames.indexOf(envdata.environmentname) >= 0) {
                                            logger.debug("In Callback Env found in list");
                                            callback(null, envdata.rowid);
                                            return;
                                        }
                                        newEnvId = projectData.environmentname_rowid + ',';
                                        newEnvName = projectData.environmentname + ',';
                                    }
                                    newEnvId += envdata.rowid;
                                    newEnvName += envdata.environmentname;
                                    d4dModelNew.d4dModelMastersProjects.update({
                                        orgname_rowid: envObj.orgname_rowid,
                                        rowid: envObj.projectname_rowid,
                                        id: '4'
                                    }, {
                                        environmentname_rowid: newEnvId,
                                        environmentname: newEnvName
                                    }, function (err, projectUpdateStatus) {
                                        if (err) {
                                            callback(err, null);
                                            return;
                                        } else {
                                            callback(null, envdata.rowid);
                                            return;
                                        }
                                    });
                                }
                            });
                        };
                    })
                } else {
                    d4dModelNew.d4dModelMastersProjects.findOne({
                        orgname_rowid: envObj.orgname_rowid,
                        rowid: envObj.projectname_rowid,
                        id: '4'
                    }, function (err, projectData) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else {
                            var newEnvId = '', newEnvName = '';
                            if (projectData.environmentname_rowid !== '' && projectData.environmentname !== '') {
                                var envIds = projectData.environmentname_rowid.split(',');
                                var envNames = projectData.environmentname.split(',');
                                if (envIds.indexOf(envdata.rowid) >= 0 && envNames.indexOf(envdata.environmentname) >= 0) {
                                    logger.debug("In Callback Env found in list");
                                    callback(null, envdata.rowid);
                                    return;
                                }
                                newEnvId = projectData.environmentname_rowid + ',';
                                newEnvName = projectData.environmentname + ',';
                            }
                            newEnvId += envdata.rowid;
                            newEnvName += envdata.environmentname;
                            d4dModelNew.d4dModelMastersProjects.update({
                                orgname_rowid: envObj.orgname_rowid,
                                rowid: envObj.projectname_rowid,
                                id: '4'
                            }, {
                                environmentname_rowid: newEnvId,
                                environmentname: newEnvName
                            }, function (err, projectUpdateStatus) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                } else {
                                    callback(null, envdata.rowid);
                                    return;
                                }
                            });
                        }
                    })
                }
            } else {
                d4dModelNew.d4dModelMastersEnvironments.update({
                    environmentname: envObj.environmentname,
                    orgname_rowid: envObj.orgname_rowid,
                    id: '3'
                }, {
                    projectname_rowid: envObj.projectname_rowid,
                    projectname: envObj.projectname
                }, function (err, envUpdateStatus) {
                    if (err) {
                        callback(err, null);
                        return;
                    } else {
                        d4dModelNew.d4dModelMastersProjects.findOne({
                            orgname_rowid: envObj.orgname_rowid,
                            rowid: envObj.projectname_rowid,
                            id: '4'
                        }, function (err, projectData) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                var newEnvId = '', newEnvName = '';
                                if (projectData.environmentname_rowid !== '' && projectData.environmentname !== '') {
                                    var envIds = projectData.environmentname_rowid.split(',');
                                    var envNames = projectData.environmentname.split(',');
                                    if (envIds.indexOf(envdata.rowid) >= 0 && envNames.indexOf(envdata.environmentname) >= 0) {
                                        logger.debug("In Callback Env found in list");
                                        callback(null, envdata.rowid);
                                        return;
                                    }
                                    newEnvId = projectData.environmentname_rowid + ',';
                                    newEnvName = projectData.environmentname + ',';
                                }
                                newEnvId += envdata.rowid;
                                newEnvName += envdata.environmentname;
                                d4dModelNew.d4dModelMastersProjects.update({
                                    orgname_rowid: envObj.orgname_rowid,
                                    rowid: envObj.projectname_rowid,
                                    id: '4'
                                }, {
                                    environmentname_rowid: newEnvId,
                                    environmentname: newEnvName
                                }, function (err, projectUpdateStatus) {
                                    if (err) {
                                        callback(err, null);
                                        return;
                                    } else {
                                        callback(null, envdata.rowid);
                                        return;
                                    }
                                });
                            }
                        });
                    };
                })
            }
        });
    }

}
module.exports = new Env();
