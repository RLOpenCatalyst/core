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


var Client = require('node-rest-client').Client;
var SSHExec = require('./utils/sshexec');
var logger = require('_pr/logger')(module);

function getAuthToken(host, username, password, tenantName, callback) {
    logger.debug("START:: getAuthToken");
    var args = {
        data: {
            "auth": {
                "tenantName": tenantName,
                "passwordCredentials": {
                    "username": username,
                    "password": password
                }
            }
        },
        headers: {
            "Content-Type": "application/json"
        }
    };

    client = new Client();
    var authUrl = host + 'tokens';
    logger.debug('authUrl', authUrl);
    client.registerMethod("postMethod", authUrl, "POST");
    client.methods.postMethod(args, function(data, response) {
        if (data.access) {
            logger.debug("Auth Token: " + data.access.token.id);
            logger.debug("END:: getAuthToken");
            callback(null, data.access.token.id);
            return;
        } else {
            logger.debug("Error in getAuthToken");
            callback(data, null);
        }
    });

}

var Hppubliccloud = function(options) {
    this.getProjects = function(callback) {
        logger.debug("START:: getProjects");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    headers: {
                        "X-Auth-Token": token
                    }
                };
                client = new Client();
                var projectsUrl = 'http://' + options.host + ':5000/v3/projects';
                client.registerMethod("jsonMethod", projectsUrl, "GET");
                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("get Projects response::" + data);
                    if (data.projects) {
                        logger.debug("END:: getProjects");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("Error in getProjects");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        })

    }

    this.getTenants = function(callback) {
        logger.debug("START:: getTenants");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    headers: {
                        "X-Auth-Token": token
                    }
                };
                client = new Client();
                var tenantsUrl = 'http://' + options.host + ':5000/v2.0/tenants';
                client.registerMethod("jsonMethod", tenantsUrl, "GET");
                client.methods.jsonMethod(args, function(data, response) {
                    if (data.tenants) {
                        var tenants = data.tenants;
                        logger.debug("END:: getTenants");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("Error in getTenants");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });
    }

    this.getImages = function(tenantId, callback) {
        logger.debug("START:: getImages");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("Token Id::" + token);
                logger.debug("Tenant Id::" + tenantId);

                var args = {
                    headers: {
                        "X-Auth-Token": token
                    }
                };

                client = new Client();

                var imagesUrl = options.serviceendpoints.compute + '/' + tenantId + '/images';

                logger.debug("imagesUrl:" + imagesUrl);
                client.registerMethod("jsonMethod", imagesUrl, "GET");

                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("get Images Response::" + data);
                    if (data.images) {
                        logger.debug("END:: getImages");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("Error in getImages");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });
    }

    this.getServers = function(tenantId, callback) {

        logger.debug("START:: getServers");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("Token Id::" + token);
                logger.debug("Tenant Id::" + tenantId);

                var args = {
                    headers: {
                        "X-Auth-Token": token
                    }
                };

                client = new Client();

                var serversUrl = options.serviceendpoints.compute + '/' + tenantId + '/servers';

                logger.debug("serversUrl:" + serversUrl);
                client.registerMethod("jsonMethod", serversUrl, "GET");

                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("get Servers Response::" + data);
                    if (data.servers) {
                        logger.debug("END:: getServers");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("Error in getServers");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug("error:" + err);
                callback(err, null);
                return;
            }

        });

    }

    this.getFlavors = function(tenantId, callback) {
        logger.debug("START:: getFlavors");
        logger.debug(JSON.stringify(options));

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("Token Id::" + token);
                logger.debug("Tenant Id::" + tenantId);

                var args = {
                    headers: {
                        "X-Auth-Token": token
                    }
                };

                client = new Client();
                var flavorsUrl = options.serviceendpoints.compute + '/' + tenantId + '/flavors';

                logger.debug("flavorsUrl:" + flavorsUrl);
                client.registerMethod("jsonMethod", flavorsUrl, "GET");

                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("getFlavors Response::" + data);
                    if (data.flavors) {
                        logger.debug("END:: getFlavors");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("Error in getFlavors");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });
    }

    this.getNetworks = function(callback) {
        logger.debug("START:: getNetworks");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };
                client = new Client();
                var networksUrl = options.serviceendpoints.network + '/networks'; //9696
                logger.debug('networksUrl: ' + networksUrl);
                client.registerMethod("jsonMethod", networksUrl, "GET");
                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("getNetworks response:: " + JSON.stringify(JSON.parse(data)));
                    var json = JSON.parse(data);
                    if (json.networks) {
                        logger.debug("END:: getNetworks");
                        callback(null, json);
                        return;
                    } else {
                        logger.debug("Error in getNetworks");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        })

    }

    this.getSecurityGroups = function(callback) {
        logger.debug("START:: getSecurityGroups");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };
                client = new Client();
                var securityGroupsUrl = options.serviceendpoints.network + '/security-groups';
                logger.debug('securityGroupsUrl: ' + securityGroupsUrl);
                client.registerMethod("jsonMethod", securityGroupsUrl, "GET");
                client.methods.jsonMethod(args, function(data, response) {
                    var json = JSON.parse(data);
                    if (json.security_groups) {
                        logger.debug("END:: getSecurityGroups");
                        callback(null, json);
                        return;
                    } else {
                        logger.debug("Error in getSecurityGroups");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });
    }
    this.getEndpoints = function(callback) {
        logger.debug("START:: getEndpoints");

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };
                client = new Client();
                var securityGroupsUrl = options.serviceendpoints.network + '/' + '/security-groups';
                logger.debug('securityGroupsUrl: ' + securityGroupsUrl);
                client.registerMethod("jsonMethod", securityGroupsUrl, "GET");
                client.methods.jsonMethod(args, function(data, response) {
                    var json = JSON.parse(data);
                    if (json.security_groups) {
                        logger.debug("END:: getSecurityGroups");
                        callback(null, json);
                        return;
                    } else {
                        logger.debug("Error in getSecurityGroups");
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });
    }
    this.updatefloatingip = function(tenantId, floatingip, serverid, callback) {
        logger.debug("START:: updatefloatingip");
        logger.debug(JSON.stringify(options));
        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                var fip = {
                    "addFloatingIp": {

                        "address": floatingip
                    }
                }
                var args = {
                    data: fip,
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };
                var updatefloatip = options.serviceendpoints.compute + '/' + tenantId + '/servers/' + serverid + '/action';
                logger.debug('updatefloatingip:' + updatefloatip);
                logger.debug('args:' + JSON.stringify(args));
                client = new Client();
                client.registerMethod("jsonMethod", updatefloatip, "POST");
                client.methods.jsonMethod(args, function(data, response) {
                    logger.debug("updatefloatingip response:: " + data);
                    if (data) {
                        logger.debug("END:: updatefloatingip");
                        callback(null, data);
                        return;
                    } else {
                        logger.debug("END:: updatefloatingip with error", data);
                        callback(null, null);
                    }

                });
            }
        });
    };


    this.createfloatingip = function(tenantId, networkid, callback) {
        logger.debug("START:: createfloatingip");
        logger.debug(JSON.stringify(options));
        this.getNetworks(function(err, data) {
            if (data) {
                for (var i = 0; i < data.networks.length; i++) {
                    if (data.networks[i]['router:external']) {
                        var networkid = data.networks[i]['id'];
                        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
                            if (token) {
                                var fip = {
                                    "floatingip": {
                                        "floating_network_id": networkid

                                    }
                                }
                                var args = {
                                    data: fip,
                                    headers: {
                                        "X-Auth-Token": token,
                                        "Content-Type": "application/json"
                                    }
                                };
                                var createfloatip = options.serviceendpoints.network + '/floatingips';
                                logger.debug('createfloatip:' + createfloatip);
                                logger.debug('args:' + JSON.stringify(args));
                                client = new Client();
                                client.registerMethod("jsonMethod", createfloatip, "POST");
                                client.methods.jsonMethod(args, function(data, response) {
                                    logger.debug("createfloatingip response:: " + data);
                                    if (data) {
                                        logger.debug("END:: createfloatingip");
                                        callback(null, data);
                                        return;
                                    } else {
                                        callback(null, null);
                                    }

                                });
                            }
                        });
                    }
                }
            }
        });
    }

    this.createServer = function(tenantId, createServerJson, callback) {
        logger.debug("START:: createServer");
        var that = this;
        logger.debug(JSON.stringify(options));
        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token::" + token);
                var args = {
                    data: createServerJson,
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };
                client = new Client();
                logger.debug("createServerJson before");
                logger.debug(JSON.stringify(createServerJson));
                //Removing network and security group if not present - assuming nova will take care
                if (!createServerJson.server.networks[0]["uuid"]) {
                    delete createServerJson.server.networks;
                    delete createServerJson.server.security_groups;
                }
                //Testing floating ip create
                that.createfloatingip(tenantId, createServerJson.server.networks[0]["uuid"], function(err, floatingipdata) {
                    if (!err) {
                        logger.debug('Added an ip', JSON.stringify(JSON.parse(floatingipdata)));

                        //create an instance and wait for server ready state
                        logger.debug("createServerJson after");
                        logger.debug(JSON.stringify(createServerJson));
                        var createServerUrl = options.serviceendpoints.compute + '/' + tenantId + '/servers';
                        logger.debug('CreateServerURL:' + createServerUrl);
                        client.registerMethod("jsonMethod", createServerUrl, "POST");
                        client.methods.jsonMethod(args, function(data, response) {
                            logger.debug("createServer response:: " + data);
                            data['floatingipdata'] = JSON.parse(floatingipdata);
                            if (data.server) {
                                logger.debug("END:: createServer");
                                logger.debug(JSON.stringify(data));
                                callback(null, data);
                                return;
                            } else {
                                callback(data, null);
                            }

                        });
                    }
                });

            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        })
    }

    this.getServerById = function(tenantId, serverId, callback) {
        logger.debug("START:: Getting server details by id", serverId);

        getAuthToken(options.serviceendpoints.identity, options.username, options.password, options.tenantName, function(err, token) {
            if (token) {
                logger.debug("token:" + token);

                var args = {
                    headers: {
                        "X-Auth-Token": token,
                        "Content-Type": "application/json"
                    }
                };

                var serverDetailUrl = options.serviceendpoints.compute + '/' + tenantId + '/servers/' + serverId;
                client = new Client();
                client.registerMethod("getServerDetails", serverDetailUrl, "GET");
                client.methods.getServerDetails(args, function(data, response) {
                    logger.debug("getServerDetails response:" + data);
                    if (data.server) {
                        logger.debug("END:: Getting server details by id");
                        callback(null, data);
                        return;
                    } else {
                        callback(data, null);
                    }
                });
            } else {
                logger.debug(err);
                callback(err, null);
                return;
            }
        });

    }
    this.updatedfloatingip = false;

    this.trysshoninstance = function(instanceData, callback) {
        var opts = {
            privateKey: instanceData.credentials.pemFilePath,
            username: instanceData.credentials.username,
            host: instanceData.floatingipdata.floatingip.floating_ip_address,
            instanceOS: 'linux',
            port: 22,
            cmds: ["ls -al"],
            cmdswin: ["del "]
        }
        var cmdString = opts.cmds.join(' && ');
        logger.debug(JSON.stringify(opts));
        var sshExec = new SSHExec(opts);
        sshExec.exec(cmdString, function(err, stdout) {
            logger.debug(stdout);
            callback(stdout);
            return;
        }, function(err, stdout) {
            logger.debug('Out:', stdout); //assuming that receiving something out would be a goog sign :)
            callback('ok');
            return;
        }, function(err, stdout) {
            logger.debug('Error Out:', stdout);
        });

    }
    this.timeouts = [];
    this.callbackdone = false;

    this.waitforserverready = function(tenantId, instanceData, callback) {
        var self = this;
        logger.debug('instanceData received:', JSON.stringify(instanceData));
        var wfsr = function() {
            self.getServerById(tenantId, instanceData.server.id, function(err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (!err) {
                    logger.debug('Quried server:', JSON.stringify(data));
                    if (data.server.status == 'ACTIVE') {
                        //set the floating ip to instance
                        if (instanceData.floatingipdata.floatingip.floating_ip_address && !self.updatedfloatingip)
                            self.updatefloatingip(tenantId, instanceData.floatingipdata.floatingip.floating_ip_address, instanceData.server.id, function(err, data) {
                                if (!err) {
                                    self.updatedfloatingip = true;
                                    logger.debug('Updated with floating ip');
                                }
                            });
                    }
                    if (self.updatedfloatingip) {
                        self.trysshoninstance(instanceData, function(cdata) {
                            logger.debug('End trysshoninstance:', cdata);
                            if (cdata == 'ok') {
                                //Clearing all timeouts
                                logger.debug('Time outs found :', self.timeouts.length);
                                for (var i = 0; i < self.timeouts.length; i++) {
                                    logger.debug('Clearing timeout : ', self.timeouts[i]);
                                    clearTimeout(self.timeouts[i]);
                                }
                                self.timeouts = [];
                                if (!self.callbackdone) {
                                    self.callbackdone = true;
                                    callback(null, instanceData);
                                }

                                return;
                            } else {
                                logger.debug('Timeout 1 set');
                                if (!self.callbackdone)
                                    self.timeouts.push(setTimeout(wfsr, 30000));
                            }
                        });
                    } else {
                        logger.debug('Timeout 2 set');
                        if (!self.callbackdone)
                            self.timeouts.push(setTimeout(wfsr, 30000));
                    }

                }
            });
        };
        logger.debug('Timeout 3 set');
        self.timeouts.push(setTimeout(wfsr, 15000));
    }
}

module.exports = Hppubliccloud;