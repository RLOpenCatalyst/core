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
                        d4dModelNew.d4dModelMastersTeams.findOne({
                            orgname_rowid: envObj.orgname_rowid,
                            rowid: envObj.teamname_rowid,
                            id: '21'
                        }, function (err, teamData) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                var newEnvId = '', newEnvName = '';
                                if (teamData.environmentname_rowid && teamData.environmentname && teamData.environmentname_rowid !== '' && teamData.environmentname !== '') {
                                    var envIds = teamData.environmentname_rowid.split(',');
                                    var envNames = teamData.environmentname.split(',');
                                    if (envIds.indexOf(envObj.rowid) === -1 && envNames.indexOf(envObj.environmentname) === -1) {
                                        newEnvId = teamData.environmentname_rowid + ',';
                                        newEnvName = teamData.environmentname + ',';
                                    }else{
                                        logger.debug("In Callback Env found in Team");
                                        callback(null, envObj.rowid);
                                        return;
                                    }
                                }
                                newEnvId += envObj.rowid;
                                newEnvName += envObj.environmentname;
                                d4dModelNew.d4dModelMastersTeams.update({
                                    orgname_rowid: envObj.orgname_rowid,
                                    rowid: envObj.teamname_rowid,
                                    id: '21'
                                }, {
                                    environmentname_rowid: newEnvId,
                                    environmentname: newEnvName
                                }, function (err, data) {
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
            }else if (envdata.teamname_rowid && envdata.teamname && envdata.teamname_rowid !== '' && envdata.teamname !== '') {
                var newTeamId = '', newTeamName = '';
                var teamIds = envdata.teamname_rowid.split(',');
                var teamNames = envdata.teamname.split(',');
                if (teamIds.indexOf(envObj.teamname_rowid) === -1 && teamNames.indexOf(envObj.teamname) === -1) {
                    newTeamId = envdata.teamname_rowid + ',' + envObj.teamname_rowid;
                    newTeamName = envdata.teamname + ',' + envObj.teamname;
                    d4dModelNew.d4dModelMastersEnvironments.update({
                        environmentname: envObj.environmentname,
                        orgname_rowid: envObj.orgname_rowid,
                        id: '3'
                    }, {
                        teamname_rowid: newTeamId,
                        teamname: newTeamName
                    }, function (err, data) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else {
                            d4dModelNew.d4dModelMastersTeams.findOne({
                                orgname_rowid: envObj.orgname_rowid,
                                rowid: envObj.teamname_rowid,
                                id: '21'
                            }, function (err, team) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                } else {
                                    var newEnvId = '', newEnvName = '';
                                    if (team.environmentname_rowid && team.environmentname && team.environmentname_rowid !== '' && team.environmentname !== '') {
                                        var envIds = team.environmentname_rowid.split(',');
                                        var envNames = team.environmentname.split(',');
                                        if (envIds.indexOf(envdata.rowid) === -1 && envNames.indexOf(envdata.environmentname) === -1) {
                                            newEnvId = team.environmentname_rowid + ',';
                                            newEnvName = team.environmentname + ',';
                                        }else{
                                            logger.debug("In Callback Env found in list");
                                            callback(null, envdata.rowid);
                                            return;
                                        }
                                    }
                                    newEnvId += envdata.rowid;
                                    newEnvName += envdata.environmentname;
                                    d4dModelNew.d4dModelMastersTeams.update({
                                        orgname_rowid: envObj.orgname_rowid,
                                        rowid: envObj.teamname_rowid,
                                        id: '21'
                                    }, {
                                        environmentname_rowid: newEnvId,
                                        environmentname: newEnvName
                                    }, function (err, teamUpdateStatus) {
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
                    d4dModelNew.d4dModelMastersTeams.findOne({
                        orgname_rowid: envObj.orgname_rowid,
                        rowid: envObj.teamname_rowid,
                        id: '4'
                    }, function (err, team) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else {
                            var newEnvId = '', newEnvName = '';
                            if (team.environmentname_rowid !== '' && team.environmentname !== '') {
                                var envIds = team.environmentname_rowid.split(',');
                                var envNames = team.environmentname.split(',');
                                if (envIds.indexOf(envdata.rowid) === -1 && envNames.indexOf(envdata.environmentname) === -1) {
                                    newEnvId = team.environmentname_rowid + ',';
                                    newEnvName = team.environmentname + ',';
                                }else{
                                    logger.debug("In Callback Env found in list");
                                    callback(null, envdata.rowid);
                                    return;
                                }
                            }
                            newEnvId += envdata.rowid;
                            newEnvName += envdata.environmentname;
                            d4dModelNew.d4dModelMastersTeams.update({
                                orgname_rowid: envObj.orgname_rowid,
                                rowid: envObj.teamname_rowid,
                                id: '21'
                            }, {
                                environmentname_rowid: newEnvId,
                                environmentname: newEnvName
                            }, function (err, data) {
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
                    teamname_rowid: envObj.teamname_rowid,
                    teamname: envObj.teamname
                }, function (err, data) {
                    if (err) {
                        callback(err, null);
                        return;
                    } else {
                        d4dModelNew.d4dModelMastersTeams.findOne({
                            orgname_rowid: envObj.orgname_rowid,
                            rowid: envObj.teamname_rowid,
                            id: '21'
                        }, function (err, team) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                var newEnvId = '', newEnvName = '';
                                if (team.environmentname_rowid !== '' && team.environmentname !== '') {
                                    var envIds = team.environmentname_rowid.split(',');
                                    var envNames = team.environmentname.split(',');
                                    if (envIds.indexOf(envdata.rowid) === -1 && envNames.indexOf(envdata.environmentname) === -1) {
                                        newEnvId = team.environmentname_rowid + ',';
                                        newEnvName = team.environmentname + ',';
                                    }else{
                                        logger.debug("In Callback Env found in list");
                                        callback(null, envdata.rowid);
                                        return;
                                    }
                                }
                                newEnvId += envdata.rowid;
                                newEnvName += envdata.environmentname;
                                d4dModelNew.d4dModelMastersTeams.update({
                                    orgname_rowid: envObj.orgname_rowid,
                                    rowid: envObj.teamname_rowid,
                                    id: '21'
                                }, {
                                    environmentname_rowid: newEnvId,
                                    environmentname: newEnvName
                                }, function (err, data) {
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
