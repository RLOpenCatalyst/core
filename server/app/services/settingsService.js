
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
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");

const errorType = 'settingsService';

var settingsService = module.exports = {};


settingsService.updateTeamDataByEnv = function updateTeamDataByEnv(enviornment,callback){
    async.waterfall([
        function(next){
            masterUtil.getTeamByEnvId(enviornment.rowid,next);
        },
        function(masterTeamData,next){
            if(masterTeamData.length > 0){
                var count = 0;
                for(var i = 0; i < masterTeamData.length; i++){
                    (function(team){
                        var envNames=team.environmentname.split(",");
                        var envIds=team.environmentname_rowid.split(",");
                        if(envNames.indexOf(enviornment.environmentname) === -1 && envIds.indexOf(enviornment.rowid) === -1){
                            count++;
                            if(count === masterTeamData.length){
                                next(null,masterTeamData)
                            }
                        }else{
                            var teamObj={
                                teamId:team.rowid,
                                envNames:changeArrayToString(envNames,enviornment.environmentname),
                                envIds:changeArrayToString(envIds,enviornment.rowid),
                                action:'env'
                            }
                            masterUtil.updateParticularTeam(teamObj,function(err,data){
                                if(err){
                                    next(err,null);
                                }
                                count++;
                                teamObj = {};
                                if(count === masterTeamData.length){
                                    next(null,masterTeamData)
                                }
                            });
                        }
                    })(masterTeamData[i]);
                }
            }else{
                next(null,masterTeamData);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while updating Environments in Master Data Team "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

settingsService.updateTeamDataByUser = function updateTeamDataByUser(user,callback){
    async.waterfall([
        function(next){
            masterUtil.getTeamByUserId(user.rowid,next);
        },
        function(masterTeamData,next){
            if(masterTeamData.length > 0){
                var count = 0;
                for(var i = 0; i < masterTeamData.length; i++){
                    (function(team){
                        var userNames=team.loginname.split(",");
                        var userIds=team.loginname_rowid.split(",");
                        if(userNames.indexOf(user.loginname) === -1 && userIds.indexOf(user.rowid) === -1){
                            count++;
                            if(count === masterTeamData.length){
                                next(null,masterTeamData)
                            }
                        }else{
                            var teamObj={
                                teamId:team.rowid,
                                userNames:changeArrayToString(userNames,user.loginname),
                                userIds:changeArrayToString(userIds,user.rowid),
                                action:'user'
                            }
                            masterUtil.updateParticularTeam(teamObj,function(err,data){
                                if(err){
                                    next(err,null);
                                }
                                count++;
                                teamObj = {};
                                if(count === masterTeamData.length){
                                    next(null,masterTeamData)
                                }
                            });
                        }
                    })(masterTeamData[i]);
                }
            }else{
                next(null,masterTeamData);
            }
        }
    ],function(err,results){
        if (err) {
            logger.error("Error while updating User in Master Data Team "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }

    })
};

settingsService.updateTeamDataByProject = function updateTeamDataByProject(project,callback){
    async.waterfall([
        function(next){
            masterUtil.getTeamByProjectId(project.rowid,next);
        },
        function(masterTeamData,next){
            if(masterTeamData.length > 0){
                var count = 0;
                for(var i = 0; i < masterTeamData.length; i++){
                    (function(team){
                        var projectNames=team.projectname.split(",");
                        var projectIds=team.projectname_rowid.split(",");
                        if(projectNames.indexOf(project.projectname) === -1 && projectIds.indexOf(project.rowid) === -1){
                            count++;
                            if(count === masterTeamData.length){
                                next(null,masterTeamData)
                            }
                        }else{
                            var teamObj={
                                teamId:team.rowid,
                                projectNames:changeArrayToString(projectNames,project.projectname),
                                projectIds:changeArrayToString(projectIds,project.rowid),
                                action:'project'
                            }
                            masterUtil.updateParticularTeam(teamObj,function(err,data){
                                if(err){
                                    next(err,null);
                                }
                                count++;
                                teamObj = {};
                                if(count === masterTeamData.length){
                                    next(null,masterTeamData)
                                }
                            });
                        }
                    })(masterTeamData[i]);
                }
            }else{
                next(null,masterTeamData);
            }
        }
    ],function(err,results) {
        if (err) {
            logger.error("Error while updating Project in Master Data Team " + err);
            callback(err, null);
            return;
        } else {
            callback(null, results);
            return;
        }
    });
}

settingsService.updateMasterDataByTeam = function updateMasterDataByTeam(team,callback){
    async.parallel({
        envData: function (callback) {
            async.waterfall([
                function(next){
                    masterUtil.getEnvironmentByTeam(team.rowid,next);
                },
                function(envs,next){
                    if(envs.length > 0){
                        var count = 0;
                        for(var i = 0; i < envs.length; i++){
                            (function(env){
                                var teamNames=env.teamname.split(",");
                                var teamIds=env.teamname_rowid.split(",");
                                if(teamNames.indexOf(team.teamname) === -1 && teamIds.indexOf(team.rowid) === -1){
                                    count++;
                                    if(count === envs.length){
                                        next(null,envs)
                                    }
                                }else{
                                    var envObj={
                                        envId:env.rowid,
                                        teamNames:changeArrayToString(teamNames,team.teamname),
                                        teamIds:changeArrayToString(teamIds,team.rowid)
                                    }
                                    masterUtil.updateEnvByTeam(envObj,function(err,data){
                                        if(err){
                                            next(err,null);
                                        }
                                        count++;
                                        envObj = {};
                                        if(count === envs.length){
                                            next(null,envs)
                                        }
                                    });
                                }
                            })(envs[i]);
                        }
                    }else{
                        next(null,envs);
                    }
                }
            ],function(err,results){
                if(err){
                    callback(err,null);
                }
                callback(null,results)
            })
        },
        projectData: function (callback) {
            async.waterfall([
                function(next){
                    masterUtil.getProjectByTeam(team.rowid,next);
                },
                function(projects,next){
                    if(projects.length > 0){
                        var count = 0;
                        for(var i = 0; i < projects.length; i++){
                            (function(project){
                                var teamNames=project.teamname.split(",");
                                var teamIds=project.teamname_rowid.split(",");
                                if(teamNames.indexOf(team.teamname) === -1 && teamIds.indexOf(team.rowid) === -1){
                                    count++;
                                    if(count === projects.length){
                                        next(null,projects)
                                    }
                                }else{
                                    var projectObj={
                                        projectId:project.rowid,
                                        teamNames:changeArrayToString(teamNames,team.teamname),
                                        teamIds:changeArrayToString(teamIds,team.rowid)
                                    }
                                    masterUtil.updateProjectByTeam(projectObj,function(err,data){
                                        if(err){
                                            next(err,null);
                                        }
                                        count++;
                                        projectObj = {};
                                        if(count === projects.length){
                                            next(null,projects)
                                        }
                                    });
                                }
                            })(projects[i]);
                        }
                    }else{
                        next(null,projects);
                    }
                }

            ],function(err,results){
                if(err){
                    callback(err,null);
                }
                callback(null,results)
            })
        },
        userData: function (callback) {
            async.waterfall([
                function(next){
                    masterUtil.getUserByTeam(team.rowid,next);
                },
                function(users,next){
                    if(users.length > 0){
                        var count = 0;
                        for(var i = 0; i < users.length; i++){
                            (function(user){
                                var teamNames=user.teamname.split(",");
                                var teamIds=user.teamname_rowid.split(",");
                                if(teamNames.indexOf(team.teamname) === -1 && teamIds.indexOf(team.rowid) === -1){
                                    count++;
                                    if(count === users.length){
                                        next(null,users)
                                    }
                                }else{
                                    var userObj={
                                        userId:user.rowid,
                                        teamNames:changeArrayToString(teamNames,team.teamname),
                                        teamIds:changeArrayToString(teamIds,team.rowid)
                                    }
                                    masterUtil.updateUserByTeam(userObj,function(err,data){
                                        if(err){
                                            next(err,null);
                                        }
                                        count++;
                                        userObj = {};
                                        if(count === users.length){
                                            next(null,users)
                                        }
                                    });
                                }
                            })(users[i]);
                        }
                    }else{
                        next(null,users);
                    }
                }

            ],function(err,results){
                if(err){
                    callback(err,null);
                }
                callback(null,results)
            })
        }
    },function(err,results){
        if (err) {
            logger.error("Error while updating Master Data By Team "+err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
};


function changeArrayToString(list,str){
    var resultStr='';
    for(var i = 0; i < list.length; i++){
        if (i === list.length - 1) {
            if(str !== list[i]) {
                resultStr = resultStr + list[i];
            }
        } else {
            if(str !== list[i]) {
                resultStr = resultStr + list[i] + ',';
            }
        }
    }
    if(resultStr.slice(-1) === ','){
        var res = resultStr.slice(0,-1);
        return res;
    }else{
        return resultStr;
    }
}

