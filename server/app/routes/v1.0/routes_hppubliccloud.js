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


// This file act as a Controller which contains hpcloud related all end points.

var Hppubliccloud = require('_pr/lib/hppubliccloud');
var logger = require('_pr/logger')(module);
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var uuid = require('node-uuid');

module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/hppubliccloud*', verificationFunc);

    var gethppubliccloudprovider = function(providerid, callback) {
        var hppubliccloudconfig = {
            host: "",
            username: "",
            password: "",
            tenantName: "",
            tenantId: "",
            serviceendpoints: {}
        };

        hppubliccloudProvider.gethppubliccloudProviderById(providerid, function(err, data) {
            logger.debug('IN gethppubliccloudProviderById: data: ');
            hppubliccloudconfig.host = data.host;
            hppubliccloudconfig.username = data.username;
            hppubliccloudconfig.password = data.password;
            hppubliccloudconfig.tenantName = data.tenantname;
            hppubliccloudconfig.tenantId = data.tenantid;
            hppubliccloudconfig.serviceendpoints = data.serviceendpoints;
            logger.debug('IN gethppubliccloudProviderById: hppubliccloudconfig: ');
            callback(null, hppubliccloudconfig);
        });

    }

    app.get('/hppubliccloud/:providerid/projects', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getProjects(function(err, projects) {
                if (err) {
                    logger.error('hppubliccloud tenants fetch error', err);
                    res.status(500).send(err.error.message);
                    return;
                }

                res.send(projects);
            });
        });
    });


    app.get('/hppubliccloud/:providerid/tenants', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getTenants(function(err, tenants) {
                if (err) {
                    logger.error('hppubliccloud tenants fetch error', err);
                    res.status(500).send(err.error.message);
                    return;
                }

                res.send(tenants);
            });
        });
    });

    app.get('/hppubliccloud/:providerid/images', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getImages(hppubliccloudconfig.tenantid, function(err, images) {
                if (err) {
                    logger.error('hppubliccloud images fetch error', err);
                    res.status(500).send(err.error.message);
                    return;
                }

                res.send(images);
            });
        });
    });

    app.get('/hppubliccloud/:providerid/:tenantId/servers', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getServers(hppubliccloudconfig.tenantid, function(err, servers) {
                if (err) {
                    logger.error('hppubliccloud servers fetch error', err);
                    res.status(500).send(err);
                    return;
                }

                res.send(servers);
            });
        });
    });

    app.get('/hppubliccloud/:providerid/networks', function(req, res) {
        logger.debug('Inside hppubliccloud get networks');
        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getNetworks(function(err, networks) {
                if (err) {
                    logger.error('hppubliccloud networks fetch error', err);
                    res.status(500).send(err);
                    return;
                }
                res.send(networks);
                logger.debug('Exit hppubliccloud get networks' + JSON.stringify(networks));
            });
        });
    });

    app.get('/hppubliccloud/:providerid/flavors', function(req, res) {
        logger.debug('Inside hppubliccloud get flavors');
        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {
            logger.debug('hppubliccloudconfig:', JSON.stringify(hppubliccloudconfig));
            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getFlavors(hppubliccloudconfig.tenantId, function(err, flavors) {
                if (err) {
                    logger.error('hppubliccloud flavors fetch error', err);
                    res.status(500).send(err);
                    return;
                }

                res.send(flavors);
                logger.debug('Exit hppubliccloud get flavors' + JSON.stringify(flavors));
            });
        });
    });

    app.get('/hppubliccloud/:providerid/securityGroups', function(req, res) {
        logger.debug('Inside hppubliccloud get securityGroups');
        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            hppubliccloud.getSecurityGroups(function(err, securityGroups) {
                if (err) {
                    logger.error('hppubliccloud securityGroups fetch error', err);
                    res.status(500).send(err);
                    return;
                }

                res.send(securityGroups);
                logger.debug('Exit hppubliccloud get securityGroups' + JSON.stringify(securityGroups));
            });
        });
    });

    app.post('/hppubliccloud/:providerid/:tenantId/createServer', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {
            logger.debug('hppubliccloudconfig', hppubliccloudconfig);
            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);

            VMImage.getImageByProviderId(providerId, function(err, images) {
                if (err) {
                    logger.error("Failed to fetch vmimages: ", err);
                    res.status(500).send("Failed to fetch vmimages.");
                    return;
                }
                if (images.length) {
                    var opnstackBody = {
                        server: {
                            name: "server-test",
                            imageRef: images[0].imageIdentifier,
                            flavorRef: 2,
                            max_count: 1,
                            min_count: 1,
                            networks: [{
                                uuid: uuid.v4()
                            }],
                            security_groups: [{
                                name: "default"
                            }]
                        }
                    };
                    hppubliccloud.createServer(hppubliccloudconfig.tenantId, JSON.stringify(opnstackBody.server), function(err, data) {
                        if (err) {
                            logger.error('hppubliccloud createServer error', err);
                            res.status(500).send(err);
                            return;
                        }

                        res.send(data);
                    });
                } else {
                    res.status(404).send("Image not found.");
                    return;
                }
            });
        });

    });

    app.get('/hppubliccloud/:providerid/tenants/:tenantId/servers/:serverId', function(req, res) {

        gethppubliccloudprovider(req.params.providerid, function(err, hppubliccloudconfig) {

            var hppubliccloud = new Hppubliccloud(hppubliccloudconfig);
            logger.debug("serverId:", req.params.serverId);

            hppubliccloud.getServerById(req.params.tenantId, req.params.serverId, function(err, data) {
                if (err) {
                    logger.error('hppubliccloud createServer error', err);
                    res.status(500).send(err);
                    return;
                }
                res.send(data);
            });

        });
    });

}
