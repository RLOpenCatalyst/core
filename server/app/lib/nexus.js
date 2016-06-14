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

// This file act as a interface between catalyst and nexus.


var Client = require('node-rest-client').Client;
var logger = require('_pr/logger')(module);
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var parser = require('xml2json');
var masterUtil = require('./utils/masterUtil.js');
var fs = require('fs');

var Nexus = function() {
    this.authenticateNexus = function(requestBody, callback) {
        logger.debug("Got req for nexus authentication: ", JSON.stringify(requestBody));
        var options_auth = {
            user: requestBody['username'],
            password: requestBody['nexuspassword']
        };
        client = new Client(options_auth);
        var nexusUrl = requestBody['hostname'] + '/service/local/users';
        logger.debug('nexusUrl', nexusUrl);
        client.registerMethod("jsonMethod", nexusUrl, "GET");
        var reqSubmit = client.methods.jsonMethod(function(data, response) {
            logger.debug("response: ", response);
            logger.debug("data: ", JSON.stringify(data));
            callback(data);
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function(err) {
            logger.debug('Something went wrong on req!!', err.request.options);
            callback([]);
        });
    }

    this.getNexusRepositories = function(anId, callback) {
        d4dModelNew.d4dModelMastersNexusServer.find({
            rowid: anId,
            id: "26"
        }, function(err, nexus) {
            if (err) {
                logger.debug(500, "Failed to fetch Nexus Server from DB.", err);
                callback(err, null);
            }
            if (nexus.length) {
                var options_auth = {
                    user: nexus[0].username,
                    password: nexus[0].nexuspassword
                };
                client = new Client(options_auth);
                var nexusUrl = nexus[0].hostname + '/service/local/repositories';
                client.registerMethod("jsonMethod", nexusUrl, "GET");
                var reqSubmit = client.methods.jsonMethod(function(data, response) {
                    try {
                        var json = parser.toJson(data);
                        logger.debug("data: ", JSON.stringify(json));
                        callback(null, json);
                    } catch (err) {
                        callback(err, null);
                    }
                });
            } else {
                callback(null, null);
            }
        });
    }

    this.getNexusArtifact = function(anId, repoName, groupId, callback) {
        d4dModelNew.d4dModelMastersNexusServer.find({
            rowid: anId,
            id: "26"
        }, function(err, nexus) {
            if (err) {
                logger.debug(500, "Failed to fetch Nexus Server from DB.", err);
                callback(err, null);
            }
            if (nexus.length) {
                var options_auth = {
                    user: nexus[0].username,
                    password: nexus[0].nexuspassword
                };
                client = new Client(options_auth);
                var nexusUrl = nexus[0].hostname + '/service/local/data_index?q=' + groupId;
                client.registerMethod("jsonMethod", nexusUrl, "GET");
                client.methods.jsonMethod(function(data, response) {
                    var json = parser.toJson(data);
                    json = JSON.parse(json);
                    var artifactList = [];
                    if (json) {
                        var artifacts = json['search-results'].data.artifact;
                        if (artifacts.length) {
                            for (var i = 0; i < artifacts.length; i++) {
                                if (repoName === artifacts[i].repoId) {
                                    var resourceURI = artifacts[i].resourceURI.replace(/\s/g, '');
                                    artifacts[i]['resourceURI'] = resourceURI;
                                    artifactList.push(artifacts[i]);
                                }
                            }
                        }
                    }
                    callback(null, artifactList);
                });
            } else {
                callback(null, null);
            }
        });
    }

    this.getNexusArtifactVersions = function(anId, repoName, groupId, artifactId, callback) {
        d4dModelNew.d4dModelMastersNexusServer.find({
            rowid: anId,
            id: "26"
        }, function(err, nexus) {
            if (err) {
                logger.debug(500, "Failed to fetch Nexus Server from DB.", err);
                callback(err, null);
                return;
            }
            if (nexus.length) {
                var options_auth = {
                    user: nexus[0].username,
                    password: nexus[0].nexuspassword
                };
                client = new Client(options_auth);
                var gId = groupId.replace(/\./g, '/');
                var nexusUrl = nexus[0].hostname + '/service/local/repositories/' + repoName + '/content/' + gId + '/' + artifactId + '/maven-metadata.xml';
                client.registerMethod("jsonMethod", nexusUrl, "GET");
                var reqSubmit = client.methods.jsonMethod(function(data, response) {
                    logger.debug("nexusUrl: ", nexusUrl);
                    callback(null, data);
                });
            } else {
                callback(null, null);
            }
        });
    }

    this.updateNexusRepoUrl = function(orgId, reqBody, callback) {
        masterUtil.getAllCongifMgmtsForOrg(orgId, function(err, configMgmt) {
            if (err) {
                callback(err, null);
            }
            if (configMgmt.length) {
                for (var i = 0; i < configMgmt.length; i++) {
                    if (configMgmt[i].configType === 'chef') {
                        masterUtil.getCongifMgmtsById(configMgmt[0].rowid, function(err, chefServer) {
                            if (err) {
                                callback(err, null);
                            }
                            if (chefServer) {
                                logger.debug("Chef location: ", chefServer.chefRepoLocation);
                                fs.readFile(chefServer.chefRepoLocation + '.chef/knife.rb', 'utf8', function(err, fileData) {
                                    if (err) {
                                        logger.debug("Failed to read knife.rb file: ", err);
                                        callback(err, null);
                                    }
                                    var lines = fileData.trim().split('\n');
                                    var lastLine = lines.splice(-1)[0];
                                    if (lastLine.indexOf("url    ") === -1) {
                                        fileData = fileData + '\r\n' + reqBody.url;
                                    } else {
                                        lines.push(reqBody.url);
                                        fileData = lines.join('\n');
                                    }
                                    logger.debug("File Data: ", fileData);
                                    fs.writeFile(chefServer.chefRepoLocation + '.chef/knife.rb', fileData, function(err) {
                                        if (err) {
                                            logger.debug("Failed to update kinfe.rb: ", err);
                                            callback(err, null);
                                        }
                                        callback(null, fileData);
                                    });
                                });
                            } else {
                                callback(null, null);
                            }

                        });
                    } else {
                        callback(null, null);
                    }
                }
            } else {
                callback(null, null);
            }
        });
    }
}

module.exports = new Nexus();
