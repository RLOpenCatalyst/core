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


module.exports.setRoutes = function(app) {

    //app.all('/d4dMasters/*', sessionVerification);



    app.get('/d4dMastersCICD/readmasterjsonnew/:id', function(req, res) {
        logger.debug("Enter get() for /d4dMastersCICD/readmasterjsonnew/%s", req.params.id);
        //        logger.debug("Logged in user: ", );
        logger.debug("incomming id: ", req.params.id);
        var loggedInUser = 'superadmin';
        masterUtil.getLoggedInUser(loggedInUser, function(err, anUser) {
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
                masterUtil.getAllActiveOrg(function(err, orgList) {
                    logger.debug("got org list ==>", JSON.stringify(orgList));
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList.length === 0 && req.params.id === '21') {
                        d4dModelNew.d4dModelMastersTeams.find({
                            id: "21"
                        }, function(err, data) {
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
                        masterUtil.getBusinessGroups(orgList, function(err, bgList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BG.');
                            }
                            res.send(bgList);
                            return;
                        });
                    } else if (req.params.id === '3') {
                        // For Environment
                        masterUtil.getEnvironments(orgList, function(err, envList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ENV.');
                            }
                            res.send(envList);
                            return;
                        });
                    } else if (req.params.id === '4') {
                        // For Projects
                        masterUtil.getProjects(orgList, function(err, projectList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Project.');
                            }
                            res.send(projectList);
                            return;
                        })
                    } else if (req.params.id === '10') {
                        // For ConfigManagement
                        masterUtil.getCongifMgmts(orgList, function(err, configMgmtList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ConfigManagement.');
                            }
                            var hygProp = '';
                            if (configMgmtList[0]) {
                                hygProp += 'chef.chefServerUrl=' + configMgmtList[0].url + '\n';
                                hygProp += 'chef.username=' + configMgmtList[0].loginname + '\n';
                                hygProp += 'chef.id=' + configMgmtList[0].rowid + '\n';
                                hygProp += 'chef.orgId=' + configMgmtList[0].orgname_rowid[0] + '\n';
                            }
                            res.send(hygProp);
                            return;
                        });

                    } else if (req.params.id === '18') {
                        // For Docker
                        logger.debug("Id for docker: ", req.params.id);
                        masterUtil.getDockers(orgList, function(err, dockerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Dockers.');
                            }
                            res.send(dockerList);
                            return;
                        });

                    } else if (req.params.id === '17') {
                        // For Template
                        logger.debug("Id for template: ", req.params.id);
                        masterUtil.getTemplates(orgList, function(err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Template.');
                            }
                            res.send(templateList);
                            return;
                        });

                    } else if (req.params.id === '16') {
                        // For Template
                        logger.debug("Id for templateType: ", req.params.id);
                        masterUtil.getTemplateTypes(orgList, function(err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch TemplateType.');
                            }
                            res.send(JSON.stringify(templateList));
                            return;
                        });
                    } else if (req.params.id === '19') {
                        // For ServiceCommand
                        masterUtil.getServiceCommands(orgList, function(err, serviceCommandList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ServiceCommand.');
                            }
                            res.send(serviceCommandList);
                            return;
                        });

                    } else if (req.params.id === '20') {

                        //Get the host name
                        logger.debug(JSON.stringify(req.headers["dashboard-host"]));
                        var hostname = req.headers["dashboard-host"];
                        //logger.debug(req.ip);
                        // For Jenkins
                        masterUtil.getDashboardServerByHost(hostname,function(err,dashboardServer){
                            logger.debug(JSON.stringify(dashboardServer));
                            var filterByServer = null;
                            if(dashboardServer)
                                filterByServer  = dashboardServer.jenkinsServerId;

                            logger.debug(filterByServer);
                            masterUtil.getJenkins(orgList, function(err, jenkinList) {
                                if (err) {
                                    res.status(500).send('Not able to fetch Jenkins.');
                                }
                                //res.send(jenkinList);
                                var hygProp = '';
                                logger.debug(JSON.stringify(jenkinList));
                                if(!filterByServer){
                                    if (jenkinList[0]) {
                                        hygProp += 'jenkins.servers[0]=' + jenkinList[0].jenkinsurl + '\n';
                                        hygProp += 'jenkins.username=' + jenkinList[0].jenkinsusername + '\n';
                                        hygProp += 'jenkins.apiKey=' + jenkinList[0].jenkinspassword + '\n';
                                    }
                                    res.send(hygProp);
                                }
                                else{
                                    for(var i = 0; i < jenkinList.length; i++){
                                        if(jenkinList[i]['rowid'] == filterByServer){
                                            logger.debug('hit filter');
                                            hygProp += 'jenkins.servers[0]=' + jenkinList[i].jenkinsurl + '\n';
                                            hygProp += 'jenkins.username=' + jenkinList[i].jenkinsusername + '\n';
                                            hygProp += 'jenkins.apiKey=' + jenkinList[i].jenkinspassword + '\n';
                                            res.send(hygProp);
                                            return;
                                        }
                                    }

                                }
                                
                                return;
                            });
                        });

                    } else if (req.params.id === '27') {
                        // For Jenkins

                        masterUtil.getBitbucket(orgList, function(err, bitbucketList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Bitbucket.');
                            }
                            //res.send("test\ntest");
                            var hygProp = '';
                            if (bitbucketList[0]) {
                                hygProp += 'git.username=' + bitbucketList[0].bitbucketusername + '\n';
                                hygProp += 'git.password=' + bitbucketList[0].bitbucketpassword + '\n';
                            }
                            res.send(hygProp);
                            //res.send(bitbucketList);
                            return;
                        });

                    } else if (req.params.id === '28') {
                        // For Octopus
                        masterUtil.getOctopus(orgList, function(err, octopusList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Octopus.');
                            }
                            var hygProp = '';
                            // if(octopusList[0]){
                            //   hygProp += 'octopus.url=' + octopusList[0].octopusurl + '\n';
                            //   hygProp += 'octopus.apiKey=' + octopusList[0].octopuskey + '\n';
                            // }
                            if (octopusList) {
                                for (var oi = 0; oi < octopusList.length; oi++) {
                                    hygProp += 'octopus.url[' + oi + ']=' + octopusList[oi].octopusurl + '\n';
                                    hygProp += 'octopus.apiKey[' + oi + ']=' + octopusList[oi].octopuskey + '\n';
                                    hygProp += 'octopus.environments[' + oi + ']=' + octopusList[oi].octopusenvs + '\n';
                                }
                            }
                            res.send(hygProp);
                            //res.send(octopusList);
                            return;
                        });

                    } else if (req.params.id === '29') {
                        // For Functional Test
                        logger.debug('Yippeee....');
                        masterUtil.getFunctionalTest(orgList, function(err, functionaltestList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Functional Test.');
                            }
                            logger.debug(functionaltestList);
                            var functionalProp = '';
                            if (functionaltestList[0]) {
                                functionalProp += 'sbux.url=' + functionaltestList[0].functionaltesturl + '\n';
                                functionalProp += 'sbux.days=' + functionaltestList[0].functionaltestdays + '\n';
                            }
                            res.send(functionalProp);
                            //res.send(octopusList);
                            return;
                        });

                    } else if (req.params.id === '23') {
                        // For Jira
                        logger.debug("Entering getJira");

                        //Get the host name
                        logger.debug(JSON.stringify(req.headers["dashboard-host"]));
                        var hostname = req.headers["dashboard-host"];
                        //logger.debug(req.ip);
                        // For Jenkins
                        masterUtil.getDashboardServerByHost(hostname,function(err,dashboardServer){
                            logger.debug(JSON.stringify(dashboardServer));
                            var filterByServer = null;
                            if(dashboardServer)
                                filterByServer  = dashboardServer.jiraServerId;

                                logger.debug(filterByServer);

                                masterUtil.getJira(orgList, function(err, jiraList) {
                                    if (err) {
                                        res.status(500).send('Not able to fetch Jira.');
                                    }
                                    var hygProp = '';
                                    if(!filterByServer){
                                        if (jiraList[0]) {
                                            jiraList = JSON.parse(JSON.stringify(jiraList));
                                            hygProp += 'feature.jiraBaseUrl=' + jiraList[0].jiraurl + '\n';
                                            hygProp += 'feature.jiraCredentials=' + jiraList[0].jirakey + '\n';
                                        }
                                        res.send(hygProp);
                                    }
                                    else{
                                        jiraList = JSON.parse(JSON.stringify(jiraList));
                                        for(var i = 0; i < jiraList.length; i++){
                                            if(jiraList[i]['rowid'] == filterByServer){
                                                logger.debug('hit filter');
                                           
                                                hygProp += 'feature.jiraBaseUrl=' + jiraList[i].jiraurl + '\n';
                                                hygProp += 'feature.jiraCredentials=' + jiraList[i].jirakey + '\n';

                                            }
                                        }
                                        res.send(hygProp);
                                    }
                                    return;
                                });
                        });

                    }else if (req.params.id === '31') {
                        // For Jira
                        logger.debug("Entering getSonar");
                        //Get the host name
                        logger.debug(JSON.stringify(req.headers["dashboard-host"]));
                        var hostname = req.headers["dashboard-host"];
                        //logger.debug(req.ip);
                        // For Jenkins
                        masterUtil.getDashboardServerByHost(hostname,function(err,dashboardServer){
                            logger.debug(JSON.stringify(dashboardServer));
                            var filterByServer = null;
                            if(dashboardServer)
                                filterByServer  = dashboardServer.sonarServerId;

                            logger.debug(filterByServer);
                            masterUtil.getSonarqube(orgList, function(err, sonarqubeList) {
                                if (err) {
                                    res.status(500).send('Not able to fetch Sonarqube.');
                                }
                                var hygProp = '';
                                // if(octopusList[0]){
                                //   hygProp += 'octopus.url=' + octopusList[0].octopusurl + '\n';
                                //   hygProp += 'octopus.apiKey=' + octopusList[0].octopuskey + '\n';
                                // }
                                if(!filterByServer){
                                    if (sonarqubeList) {

                                            for (var oi = 0; oi < sonarqubeList.length; oi++) {
                                                hygProp += 'sonar.servers[' + oi + ']=' + sonarqubeList[oi].sonarqubeurl + '\n';
                                                hygProp += 'sonar.username=' + sonarqubeList[oi].sonarqubeusername + '\n';
                                                hygProp += 'octopus.password=' + sonarqubeList[oi].sonarqubepassword + '\n';
                                            }
                                    }
                                    res.send(hygProp);
                                }else{
                                    var oi = 0;

                                    if (sonarqubeList) {
                                        for(var i = 0; i < sonarqubeList.length; i++){
                                            if(sonarqubeList[i]['rowid'] == filterByServer){
                                                logger.debug('hit filter');
                                                hygProp += 'sonar.servers[' + oi + ']=' + sonarqubeList[i].sonarqubeurl + '\n';
                                                hygProp += 'sonar.username=' + sonarqubeList[i].sonarqubeusername + '\n';
                                                hygProp += 'octopus.password=' + sonarqubeList[i].sonarqubepassword + '\n';
                                                oi++;
                                            }
                                        }
                                    }
                                    res.send(hygProp);
                                }
                                return;
                            });
                        });

                    } else if (req.params.id === '6') {
                        // For User Role
                        masterUtil.getUserRoles(function(err, userRoleList) {
                            if (err) {
                                res.status(500).send('Not able to fetch UserRole.');
                            }
                            res.send(userRoleList);
                            return;
                        });

                    } else if (req.params.id === '7') {
                        // For User
                        masterUtil.getUsersForOrgOrAll(orgList, function(err, userList) {
                            if (err) {
                                res.status(500).send('Not able to fetch User.');
                            }
                            res.send(userList);
                            return;
                        });

                    } else if (req.params.id === '21') {
                        // For Team
                        masterUtil.getTeams(orgList, function(err, teamList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Team.');
                            }
                            res.send(teamList);
                            return;
                        });
                    } else if (req.params.id === '25') {
                        // For Puppet Server
                        masterUtil.getPuppetServers(orgList, function(err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Puppet Server.');
                            }
                            res.send(pList);
                            return;
                        });

                    } else if (req.params.id === '26') {
                        // For Puppet Server
                        masterUtil.getNexusServers(orgList, function(err, pList) {
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
                masterUtil.getOrgs(loggedInUser, function(err, orgList) {
                    logger.debug("got org list: ", JSON.stringify(orgList));
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    } else if (req.params.id === '1') {
                        res.send(orgList);
                        return;
                    } else if (req.params.id === '2') {
                        // For BusinessGroup
                        masterUtil.getBusinessGroups(orgList, function(err, bgList) {
                            if (err) {
                                res.status(500).send('Not able to fetch BG.');
                            }
                            res.send(bgList);
                            return;
                        });
                    } else if (req.params.id === '3') {
                        // For Environment
                        masterUtil.getEnvironments(orgList, function(err, envList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ENV.');
                            }
                            res.send(envList);
                            return;
                        });
                    } else if (req.params.id === '4') {
                        // For Projects
                        masterUtil.getProjects(orgList, function(err, projectList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Project.');
                            }
                            res.send(projectList);
                            return;
                        })
                    } else if (req.params.id === '10') {
                        // For ConfigManagement
                        masterUtil.getCongifMgmts(orgList, function(err, configMgmtList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ConfigManagement.');
                            }
                            res.send(configMgmtList);
                            return;
                        });

                    } else if (req.params.id === '18') {
                        // For Docker
                        logger.debug("Id for docker: ", req.params.id);
                        masterUtil.getDockers(orgList, function(err, dockerList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Dockers.');
                            }
                            res.send(dockerList);
                            return;
                        });

                    } else if (req.params.id === '17') {
                        // For Template
                        logger.debug("Id for template: ", req.params.id);
                        masterUtil.getTemplates(orgList, function(err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Template.');
                            }
                            res.send(templateList);
                            return;
                        });

                    } else if (req.params.id === '16') {
                        // For Template
                        logger.debug("Id for templateType: ", req.params.id);
                        masterUtil.getTemplateTypes(orgList, function(err, templateList) {
                            if (err) {
                                res.status(500).send('Not able to fetch TemplateType.');
                            }
                            res.send(JSON.stringify(templateList));
                            return;
                        });

                    } else if (req.params.id === '19') {
                        // For ServiceCommand
                        masterUtil.getServiceCommands(orgList, function(err, serviceCommandList) {
                            if (err) {
                                res.status(500).send('Not able to fetch ServiceCommand.');
                            }
                            res.send(serviceCommandList);
                            return;
                        });

                    } else if (req.params.id === '20') {
                        // For Jenkins
                        masterUtil.getJenkins(orgList, function(err, jenkinList) {
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
                        // For Functional Test
                        masterUtil.getFunctionalTest(orgList, function(err, functionaltestList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Functional Test.');
                            }
                            var functionalProp = '';
                            if (functionaltestList[0]) {
                                functionalProp += 'sbux.url=' + functionaltestList[0].functionaltesturl + '\n';
                                functionalProp += 'sbux.days=' + functionaltestList[0].functionaltestdays + '\n';
                            }
                            res.send(functionalProp);
                            //res.send(octopusList);
                            return;
                        });

                    } else if (req.params.id === '23') {
                        // For Jira
                        masterUtil.getJira(orgList, function(err, jiraList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Jira.');
                            }
                            res.send(jiraList);
                            return;
                        });

                    } else if (req.params.id === '6') {
                        // For User Role
                        masterUtil.getUserRoles(function(err, userRoleList) {
                            if (err) {
                                res.status(500).send('Not able to fetch UserRole.');
                            }
                            res.send(userRoleList);
                            return;
                        });

                    } else if (req.params.id === '7') {
                        // For User
                        masterUtil.getUsersForOrg(orgList, function(err, userList) {
                            if (err) {
                                res.status(500).send('Not able to fetch User.');
                            }
                            res.send(userList);
                            return;
                        });

                    } else if (req.params.id === '21') {
                        // For Team
                        masterUtil.getTeams(orgList, function(err, teamList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Team.');
                            }
                            res.send(teamList);
                            return;
                        });
                    } else if (req.params.id === '25') {
                        // For Puppet Server
                        masterUtil.getPuppetServers(orgList, function(err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Puppet Server.');
                            }
                            res.send(pList);
                            return;
                        });
                    } else if (req.params.id === '26') {
                        // For Puppet Server
                        masterUtil.getNexusServers(orgList, function(err, pList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Nexus Server.');
                            }
                            res.send(pList);
                            return;
                        });
                    } else if (req.params.id === '31') {
                        // For Jira
                        logger.debug("Entering getSonar");
                        masterUtil.getSonarqube(orgList, function(err, sonarqubeList) {
                            if (err) {
                                res.status(500).send('Not able to fetch Sonarqube.');
                            }
                            var hygProp = '';
                            // if(octopusList[0]){
                            //   hygProp += 'octopus.url=' + octopusList[0].octopusurl + '\n';
                            //   hygProp += 'octopus.apiKey=' + octopusList[0].octopuskey + '\n';
                            // }
                            if (sonarqubeList) {
                                for (var oi = 0; oi < sonarqubeList.length; oi++) {
                                    hygProp += 'sonar.servers[' + oi + ']=' + sonarqubeList[oi].sonarqubeurl + '\n';
                                    hygProp += 'sonar.username=' + sonarqubeList[oi].sonarqubeusername + '\n';
                                    hygProp += 'octopus.password=' + sonarqubeList[oi].sonarqubepassword + '\n';
                                }
                            }
                            res.send(hygProp);
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

    app.get('/d4dMastersCICD/chef/pemFile/:chefServerId', function(req, res) {

        configmgmtDao.getChefServerDetails(req.params.chefServerId, function(err, data) {
            if(err) {
                return res.status(500).send("error occured");
            }

            fileIo.readFile(data.userpemfile,function(err,fileData){
               if(err) {
                 return res.status(500).send("error occured");
               }
               res.status(200).send(fileData);
            });

        });

    });


}