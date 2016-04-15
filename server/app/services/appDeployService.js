
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
var nexus = require('../lib/nexus.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');

const errorType = 'appDeploy';

var appDeployService = module.exports = {};

appDeployService.getNexusRepositoryList = function getNexusRepositoryList(nexusId,projectId, callback) {
    nexus.getNexusRepositories(nexusId,function(err,repositories){
        if(err){
            logger.debug("Failed to fetch  Nexus Repository");
            callback(err,null);
            return;
        }
        if(!repositories){
            callback(null,[]);
            return;
        }
        else{
            repositories = JSON.parse(repositories);
            var repoData=repositories.repositories.data['repositories-item'];
            masterUtil.getParticularProject(projectId, function(err, aProject) {
                if (err) {
                    logger.debug("Failed to fetch  Project");
                    callback(err,null);
                    return;
                }
                if (!aProject) {
                    callback(null,[]);
                    return;
                }
                else{
                    var nexusRepositories = [];
                    var aNexusRepo={};
                    if (aProject[0].repositories) {
                        var repositories = aProject[0].repositories.nexus;
                        if (repositories.length) {
                            for (var x = 0; x < repositories.length; x++) {
                                for (var i = 0; i < repoData.length; i++) {
                                    if (repositories[x] === repoData[i].name) {
                                        aNexusRepo['name'] = repoData[i].name;
                                        aNexusRepo['resourceURI'] = repoData[i].resourceURI;
                                        aNexusRepo['id'] = repoData[i].id;
                                    }
                                }
                                nexusRepositories.push(aNexusRepo);
                                aNexusRepo={};
                            }
                        }
                        callback(null, nexusRepositories);
                        return;
                    }
                }

            });
        }
    });
}
appDeployService.getNexusArtifactList=function getNexusArtifactList(nexusId,repoName,groupId,callback){
    nexus.getNexusArtifact(nexusId,repoName,groupId,function(err,artifacts){
        if(err){
            logger.debug("Error while fetching nexus artifact.");
            callback(err,null);
            return;
        }
        if(!artifacts){
            callback(null,[]);
            return;
        }
        else{
            var repoList = [];
            var uniqueArtifacts = [];
            var checker;
            for (var i = 0; i < artifacts.length; i++) {
                (function(aArtifact) {
                    var repoObj = {};
                    repoObj['resourceURI'] = artifacts[i].resourceURI;
                    repoObj['version'] = artifacts[i].version;
                    repoObj['artifactId'] = artifacts[i].artifactId;
                    repoList.push(repoObj);
                    if (!checker || compareObject(checker, aArtifact) != 0) {
                        checker = aArtifact;
                        uniqueArtifacts.push(checker);
                    }
                })(artifacts[i]);
            }
            callback(null,uniqueArtifacts);
        }
    });
}

function compareObject(a, b) {
    if (a.artifactId === b.artifactId) {
        return 0;
    } else {
        return 1;
    }
}
appDeployService.getAppDeployListByProjectId=function getAppDeployListByProjectId(projectId,callback){
    
}





