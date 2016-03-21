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



// This file act as a Controller which contains dashboard related all cron jobs which saves into Monogdb.

var logger = require('_pr/logger')(module);
var EC2 = require('../ec2.js');
var d4dModelNew = require('../../model/d4dmasters/d4dmastersmodelnew.js');
var AWSProvider = require('../../model/classes/masters/cloudprovider/awsCloudProvider.js');
var openstackProvider = require('../../model/classes/masters/cloudprovider/openstackCloudProvider.js');
var hppubliccloudProvider = require('../../model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var azurecloudProvider = require('../../model/classes/masters/cloudprovider/azureCloudProvider.js');
var vmwareProvider = require('../../model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var VMImage = require('../../model/classes/masters/vmImage.js');
var AWSKeyPair = require('../../model/classes/masters/cloudprovider/keyPair.js');
var blueprints = require('../../model/dao/blueprints');
var instances = require('../../model/classes/instance/instance');
var masterUtil = require('../utils/masterUtil.js');
var usersDao = require('../../model/users.js');
var configmgmtDao = require('../../model/d4dmasters/configmgmt.js');
var Cryptography = require('../utils/cryptography');
var appConfig = require('_pr/config');

var providersdashboard = require('../../model/dashboard/dashboardinstances.js');
var dashboardcosts = require('../../model/dashboard/dashboardcosts.js');
var instancesDao = require('../../model/classes/instance/instance');
var crontab = require('node-crontab');
var CW = require('../cloudwatch.js');
var cryptoConfig = appConfig.cryptoSettings;
var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

//This will call this function for every hours and saves into monogdb.
var totalInstancesCronJob = crontab.scheduleJob("0 * * * *", function() {
    logger.debug("Cron Job run every 60 minutes for totalinstances!!!!!!!!!!!!!!+++++++++");
    AWSProvider.getAWSProviders(function(err, providers) {
        if (err) {
            logger.error(err);
            return;
        }
        //logger.debug("providers>>> ", JSON.stringify(providers));
        var providersList = [];
        if (providers.length > 0) {
            var countProvider = 0;
            var countRegion = 0;
            var totalcount = 0;
            for (var i = 0; i < providers.length; i++) {
                if(providers[i].isDefault) {
                    providersList.push(providers[i]);
                } else {
                    var keys = [];
                    keys.push(providers[i].accessKey);
                    keys.push(providers[i].secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding, function(err, decryptedKeys) {
                        countProvider++;
                        if (err) {
                            return;
                        }
                        providers[i].accessKey = decryptedKeys[0];
                        providers[i].secretKey = decryptedKeys[1];
                        providersList.push(providers[i]);
                    });
                }

                //logger.debug("providers>>> ", JSON.stringify(providers));
                if (providers.length === providersList.length) {
                    var exists = {},
                        uniqueProviderList = [],
                        elm;
                    for (var i = 0; i < providersList.length; i++) {
                        elm = providersList[i];
                        if (!exists[elm]) {
                            uniqueProviderList.push(elm);
                            exists[elm] = true;
                        }
                    }
                    //console.log("uniqueProviderList===================>" + uniqueProviderList);
                    for (var n = 0; n < uniqueProviderList.length; n++) {
                        var regions = ["us-east-1", "us-west-1", "us-west-2"];
                        for (var j = 0; j < regions.length; j++) {
                            if(uniqueProviderList[n].isDefault) {
                                var ec2 = new EC2({
                                    "isDefault": true,
                                    "region": regions[j]
                                });
                            } else {
                                var ec2 = new EC2({
                                    "access_key": uniqueProviderList[n].accessKey,
                                    "secret_key": uniqueProviderList[n].secretKey,
                                    "region": regions[j]
                                });
                            }

                            ec2.listInstances(function(err, nodes) {
                                countRegion++;
                                if (err) {
                                    logger.debug("Unable to list nodes from AWS.", err);
                                    return;
                                }
                                logger.debug("Success to list nodes from AWS.");
                                var nodeList = [];
                                for (var k = 0; k < nodes.Reservations.length; k++) {
                                    var instance = {
                                        "instance": nodes.Reservations[k].Instances[0].InstanceId
                                    };
                                    nodeList.push(instance);
                                }
                                var nodeListLength = nodeList.length;
                                logger.debug("I am in count of Total Instances", nodeListLength);
                                totalcount = totalcount + nodeListLength;
                                if (countProvider === uniqueProviderList.length && countRegion === uniqueProviderList.length * regions.length) {
                                    providersdashboard.createNew(totalcount, function(err, totalcountInstances) {
                                        if (err) {
                                            return;
                                        }
                                        if (totalcountInstances) {
                                            console.log("I am in count to save for totalinstances++++++++++++++++");
                                            //res.send(200, totalcountInstances);
                                            return;
                                        }
                                    });
                                    return;
                                }
                            });
                        }
                    }

                }
            }
        } else {
            //res.send(200, []);
            return;
        }
    });
});

//This will call this function for every day at 11.59P.M and saves into monogdb.
var totalCostsCronJob = crontab.scheduleJob("59 23 * * *", function() {
    logger.debug("Cron Job runs for Costs every 1hours!!!!!!!!!!!!!!+++++++++");
    AWSProvider.getAWSProviders(function(err, providers) {
        if (err) {
            logger.error(err);
            return;
        }
        //logger.debug("providers >>> ", JSON.stringify(providers));
        var providersList = [];
        if (providers.length > 0) {
            var countProvider = 0;
            var countRegion = 0;
            var totalcount = 0;
            for (var i = 0; i < providers.length; i++) {
                var keys = [];
                keys.push(providers[i].accessKey);
                keys.push(providers[i].secretKey);
                cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding, function(err, decryptedKeys) {
                    countProvider++;
                    if (err) {
                        return;
                    }
                    providers[i].accessKey = decryptedKeys[0];
                    providers[i].secretKey = decryptedKeys[1];
                    providersList.push(providers[i]);
                });
                //logger.debug("providers>>> ", JSON.stringify(providers));
                if (providers.length === providersList.length) {
                    var exists = {},
                        uniqueProviderList = [],
                        elm;
                    for (var i = 0; i < providersList.length; i++) {
                        elm = providersList[i];
                        if (!exists[elm]) {
                            uniqueProviderList.push(elm);
                            exists[elm] = true;
                        }
                    }
                    //console.log("uniqueProviderList cronjob===================>" + uniqueProviderList);
                    for (var n = 0; n < uniqueProviderList.length; n++) {
                        var regions = ["us-east-1"];
                        for (var j = 0; j < regions.length; j++) {
                            var cloudwatch = new CW({
                                "access_key": uniqueProviderList[n].accessKey,
                                "secret_key": uniqueProviderList[n].secretKey,
                                "region": regions[j]
                            });
                            cloudwatch.getTotalCostMaximum(function(err, nodes) {
                                if (err) {
                                    res.send(500, "Failed to fetch Total Cost.");
                                    return;
                                }
                                if (nodes) {
                                    cloudwatch.getTotalCostMinimum(nodes, function(err, costToday) {
                                        if (err) {
                                            res.send(500, "Failed to fetch Total Cost.");
                                            return;
                                        }
                                        if (costToday) {
                                            var finalCost = parseInt(costToday.toString());
                                            dashboardcosts.createNew(finalCost, function(err, totalcost) {
                                                console.log("I am in count to save for totalcost#############" + finalCost);
                                            });

                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            }
        } else {
            //res.send(200, []);
            return;
        }
    });
});