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

// This file act as a Controller which contains azure related all end points.


var AzureCloud = require('_pr/lib/azure');
var logger = require('_pr/logger')(module);
var xml2json = require('xml2json');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var fs = require('fs');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var uuid = require('node-uuid');
var async = require('async');

module.exports.setRoutes = function(app, verificationFunc) {
    app.all('/azure/*', verificationFunc);
    app.get('/azure/:id/networks', function(req, res) {
        if(req.params.id === null || req.params.id === 'null'){
            logger.debug("Provider Id is pass as Null in params");
            res.status(500).send(req.params.id);
            return;
        }
        var location = req.query.location;
        async.waterfall([
            function(next){
                azureProvider.getAzureCloudProviderById(req.params.id,next);
            },
            function(azureProviderDetails,next){
                if(azureProviderDetails !== null) {
                    azureProviderDetails = JSON.parse(azureProviderDetails);
                    var pemFile = appConfig.instancePemFilesDir + azureProviderDetails._id +'_' + azureProviderDetails.pemFileName;
                    var keyFile = appConfig.instancePemFilesDir + azureProviderDetails._id +'_' + azureProviderDetails.keyFileName;
                    var cryptConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptConfig.algorithm, cryptConfig.password);
                    var uniqueVal = uuid.v4().split('-')[0];
                    var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
                    var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
                    cryptography.decryptFile(pemFile, cryptConfig.decryptionEncoding, decryptedPemFile, cryptConfig.encryptionEncoding, function (err) {
                        if (err) {
                            next(err);
                        }
                        cryptography.decryptFile(keyFile, cryptConfig.decryptionEncoding, decryptedKeyFile, cryptConfig.encryptionEncoding, function (err) {
                            if (err) {
                                next(err);
                            }
                            var options = {
                                subscriptionId: azureProviderDetails.subscriptionId,
                                certLocation: decryptedPemFile,
                                keyLocation: decryptedKeyFile
                            };
                            next(null, options);
                        });
                    });
                }else{
                    next('No Azure Provider is configure',null);
                }
            },
            function(azureOptions,next) {
                var azureCloud = new AzureCloud(azureOptions);
                azureCloud.getNetworks(function (err, networks) {
                    if (err) {
                        next(err);
                    }
                    var netWorkJsonObj = JSON.parse(xml2json.toJson(networks));
                    var vpcList = [], subnetList = [], count = 0;
                    for (var i = 0; i < netWorkJsonObj.VirtualNetworkSites.VirtualNetworkSite.length; i++) {
                        (function (VirtualNetworkSite) {
                            if (VirtualNetworkSite.Location === location) {
                                var networkName = VirtualNetworkSite.Name
                                vpcList.push(networkName);
                                var subNets = {};
                                if (VirtualNetworkSite.Subnets.Subnet.length > 0) {
                                    subNets[networkName] = VirtualNetworkSite.Subnets.Subnet;
                                } else {
                                    subNets[networkName] = [VirtualNetworkSite.Subnets.Subnet];
                                }
                                subnetList.push(subNets);
                                count++;
                            } else {
                                count++;
                            }
                        })(netWorkJsonObj.VirtualNetworkSites.VirtualNetworkSite[i]);
                    }
                    if (count === netWorkJsonObj.VirtualNetworkSites.VirtualNetworkSite.length) {
                        fs.unlink(azureOptions.certLocation, function(err) {
                            logger.debug("Deleting decryptedPemFile..");
                            if (err) {
                                logger.error("Error in deleting decryptedPemFile..");
                            }
                            fs.unlink(azureOptions.keyLocation, function(err) {
                                logger.debug("Deleting decryptedKeyFile ..");
                                if (err) {
                                    logger.error("Error in deleting decryptedKeyFile..");
                                }
                                var results = {
                                    vpcList: vpcList,
                                    subnetList: subnetList
                                }
                                next(null,results);
                            });
                        });
                    }
                });
            }

        ],function(err,results){
            if(err){
                logger.error(err);
                res.status(500).send(err);
                return;
            }else{
                res.status(200).send(results);
                return;
            }
        });
    });

    app.get('/azure/:id/locations', function(req, res) {
        if(req.params.id === null || req.params.id === 'null'){
            logger.debug("Provider Id is pass as Null in params");
            res.status(500).send(req.params.id);
            return;
        }
        async.waterfall([
            function(next){
                azureProvider.getAzureCloudProviderById(req.params.id,next);
            },
            function(azureProviderDetails,next){
                if(azureProviderDetails !== null) {
                    azureProviderDetails = JSON.parse(azureProviderDetails);
                    var pemFile = appConfig.instancePemFilesDir + azureProviderDetails._id +'_' + azureProviderDetails.pemFileName;
                    var keyFile = appConfig.instancePemFilesDir + azureProviderDetails._id +'_' + azureProviderDetails.keyFileName;
                    var cryptConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptConfig.algorithm, cryptConfig.password);
                    var uniqueVal = uuid.v4().split('-')[0];
                    var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
                    var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
                    cryptography.decryptFile(pemFile, cryptConfig.decryptionEncoding, decryptedPemFile, cryptConfig.encryptionEncoding, function (err) {
                        if (err) {
                            next(err);
                        }
                        cryptography.decryptFile(keyFile, cryptConfig.decryptionEncoding, decryptedKeyFile, cryptConfig.encryptionEncoding, function (err) {
                            if (err) {
                                next(err);
                            }
                            var options = {
                                subscriptionId: azureProviderDetails.subscriptionId,
                                certLocation: decryptedPemFile,
                                keyLocation: decryptedKeyFile
                            };
                            next(null, options);
                        });
                    });
                }else{
                    next('No Azure Provider is configure',null);
                }
            },
            function(azureOptions,next) {
                var azureCloud = new AzureCloud(azureOptions);
                azureCloud.getLocations(function(err, locations) {
                    if (err) {
                        next(err);
                    }
                    var locationObj = JSON.parse(xml2json.toJson(locations));
                    var locationList =[],instanceSizeList =[],count = 0;
                    for(var i = 0; i < locationObj.Locations.Location.length; i++){
                        (function(location){
                            locationList.push(location.Name);
                            var instanceSize = {};
                            instanceSize[location.Name] =location.ComputeCapabilities.VirtualMachinesRoleSizes.RoleSize;
                            instanceSizeList.push(instanceSize);
                            count++;
                        })(locationObj.Locations.Location[i]);
                    }
                    if(count === locationObj.Locations.Location.length){
                        fs.unlink(azureOptions.certLocation, function(err) {
                            if (err) {
                                logger.error("Error in deleting decryptedPemFile..");
                            }
                            fs.unlink(azureOptions.keyLocation, function(err) {
                                if (err) {
                                    logger.error("Error in deleting decryptedKeyFile..");
                                }
                                var results = {
                                    locationList:locationList,
                                    instanceSizeList:instanceSizeList
                                }
                                next(null,results);
                            });
                        });
                    }
                });
            }

        ],function(err,results){
            if(err){
                logger.error(err);
                res.status(500).send(err);
                return;
            }else{
                res.status(200).send(results);
                return;
            }
        });
    });
}
