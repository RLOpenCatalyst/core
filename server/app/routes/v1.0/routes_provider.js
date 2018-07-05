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
// This file act as a Controller which contains provider related all end points.
/* TODO AWS EC2 client creation code replication to be reduced */
var logger = require('_pr/logger')(module);
var EC2 = require('_pr/lib/ec2.js');
var cost = require('_pr/lib/dashboard.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var azurecloudProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var blueprintModel = require('_pr/model/blueprint/blueprint.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var blueprints = require('_pr/model/dao/blueprints');
var instances = require('_pr/model/classes/instance/instance');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var usersDao = require('_pr/model/users.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var rc = require('node-rest-client').Client;
var appConfig = require('_pr/config');
var instanceService = require('_pr/services/instanceService');
var settingWizard = require('_pr/model/setting-wizard');
var settingsService = require('_pr/services/settingsService');

module.exports.setRoutes = function (app, sessionVerificationFunc) {

    app.all('/aws/*', sessionVerificationFunc);
    app.all('/vmware/*', sessionVerificationFunc);
    app.all('/azure/*', sessionVerificationFunc);
    app.all('/openstack/*', sessionVerificationFunc);



    // Return AWS Provider respect to id.
    app.get('/aws/providers/list', function (req, res) {

        AWSProvider.getAWSProviders(function (err, providers) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            logger.debug("Provider list: ", JSON.stringify(providers));
            if (providers) {
                var providerList = [];
                var count = 0;
                for (var i = 0; i < providers.length; i++) {
                    (function (i) {

                        AWSKeyPair.getAWSKeyPairByProviderId(providers[i]._id, function (err, keyPair) {
                            count++;

                            if (keyPair) {
                                var dommyProvider = {
                                    _id: providers[i]._id,
                                    id: 9,
                                    providerName: providers[i].providerName,
                                    providerType: providers[i].providerType,
                                    orgId: providers[i].orgId,
                                    __v: providers[i].__v,
                                    keyPairs: keyPair,
                                    isDefault: providers[i].isDefault
                                };

                                var cryptoConfig = appConfig.cryptoSettings;
                                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

                                if (!providers[i].isDefault) {
                                    var cryptoConfig = appConfig.cryptoSettings;
                                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                                        cryptoConfig.password);

                                    dommyProvider.accessKey = cryptography.decryptText(providers[i].accessKey,
                                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                                    dommyProvider.secretKey = cryptography.decryptText(providers[i].secretKey,
                                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                                }
                                providerList.push(dommyProvider);
                                logger.debug("count: ", count);
                                if (providers.length === providerList.length) {
                                    res.send(providerList);
                                    return;
                                }
                            }

                        });
                    })(i);
                }
            } else {
                res.send(404);
            }
        });
    });

    // Return AWS Provider respect to id.
    app.get('/aws/providers/:providerId', function (req, res) {
        logger.debug("Enter get() for /providers/%s", req.params.providerId);
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }
        AWSProvider.getAWSProviderById(providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (aProvider) {
                AWSKeyPair.getAWSKeyPairByProviderId(aProvider._id, function (err, keyPair) {
                    masterUtil.getOrgByRowId(aProvider.orgId[0], function (err, orgs) {
                        if (err) {
                            res.status(500).send("Not able to fetch org.");
                            return;
                        }
                        if (orgs.length > 0) {
                            if (keyPair.length > 0) {
                                var results = [];
                                var dummyProvider = {
                                    _id: aProvider._id,
                                    id: 9,
                                    providerName: aProvider.providerName,
                                    providerType: aProvider.providerType,
                                    s3BucketName: aProvider.s3BucketName,
                                    orgId: aProvider.orgId,
                                    plannedCost: aProvider.plannedCost,
                                    orgName: orgs[0].orgname,
                                    __v: aProvider.__v,
                                    keyPairs: keyPair,
                                    isDefault: aProvider.isDefault
                                };
                                for (var i = 0; i < keyPair.length; i++) {
                                    var regionList = appConfig.aws.regions;
                                    results.push(keyPair[i]);
                                    for (var j = 0; j < regionList.length; j++) {
                                        if (regionList[j].region === keyPair[i].region) {
                                            dummyProvider.providerRegion = regionList[j];
                                        }
                                    }
                                }
                                if (keyPair.length === results.length) {
                                    res.send(dummyProvider);
                                }
                            } else {
                                var dummyProvider = {
                                    _id: aProvider._id,
                                    id: 9,
                                    providerName: aProvider.providerName,
                                    providerType: aProvider.providerType,
                                    s3BucketName: aProvider.s3BucketName,
                                    orgId: aProvider.orgId,
                                    plannedCost: aProvider.plannedCost,
                                    orgName: orgs[0].orgname,
                                    __v: aProvider.__v,
                                    isDefault: aProvider.isDefault
                                };
                                res.send(dummyProvider);
                            }

                        }
                    });
                });
            } else {
                res.send(404);
            }
        });
    });

    app.all("/aws/providers/*", sessionVerificationFunc);
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

    //Create VMWare Provider
    app.post('/vmware/providers', function (req, res) {
        logger.debug("Enter post() for /vmware.providers.", typeof req.body.fileName);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var vmwareusername = req.body.vmwareusername;
        var vmwarepassword = req.body.vmwarepassword;
        var vmwarehost = req.body.vmwarehost;
        var vmwaredc = req.body.vmwaredc;
        var providerName = req.body.providerName;
        var providerType = req.body.providerType;
        var pemFileName = null;
        if (req.files && req.files.azurepem)
            pemFileName = req.files.azurepem.originalFilename;
        var keyFileName = null;
        if (req.files && req.files.azurekey)
            keyFileName = req.files.azurekey.originalFilename;
        var orgId = req.body.orgId;

        if (typeof vmwareusername === 'undefined' || vmwareusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        if (typeof vmwarepassword === 'undefined' || vmwarepassword.length === 0) {
            res.status(400).send("Please Enter Password.");
            return;
        }
        if (typeof vmwarehost === 'undefined' || vmwarehost.length === 0) {
            res.status(400).send("Please Enter a Host.");
            return;
        }
        if (typeof vmwaredc === 'undefined' || vmwaredc.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400).send("Please Select Any Organization.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.status(400).send("You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {

                    var providerData = {
                        id: 9,
                        username: vmwareusername,
                        password: vmwarepassword,
                        host: vmwarehost,
                        providerName: providerName,
                        providerType: providerType,
                        dc: vmwaredc,
                        orgId: orgId
                    };
                    vmwareProvider.getvmwareProviderByName(providerData.providerName, providerData.orgId, function (err, prov) {
                        if (err) {
                            logger.error("Error while fetching vmware: ", err);
                            res.status(500).send("Error while fetching vmware");
                            return;
                        }
                        if (prov) {
                            logger.error("Provider name already exist: ");
                            res.status(409).send("Provider name already exist.");
                            return;
                        }
                        vmwareProvider.createNew(providerData, function (err, provider) {
                            if (err) {
                                logger.error("Failed to create Provider: ", err);
                                res.status(500).send("Failed to create Provider.");
                                return;
                            }
                            masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                                if (err) {
                                    res.status(500).send("Not able to fetch org.");
                                    return;
                                }
                                trackSettingWizard(providerData.orgId, function (err, data) {
                                    if (err) {
                                        res.status(500).send("Not able to update wizards.");
                                        return;
                                    }
                                    if (orgs.length > 0) {
                                        var dommyProvider = {
                                            _id: provider._id,
                                            id: 9,
                                            username: vmwareusername,
                                            //password: vmwarepassword,
                                            host: vmwarehost,
                                            dc: vmwaredc,
                                            providerName: provider.providerName,
                                            providerType: provider.providerType,
                                            orgId: orgs[0].rowid,
                                            orgName: orgs[0].orgname,
                                            __v: provider.__v,
                                        };
                                        res.send(dommyProvider);
                                        return;
                                    }
                                });
                            });

                            logger.debug("Exit post() for /providers");
                        });
                    });

                } //end anuser
            });
        });

    });

    //get vmware providers
    app.get('/vmware/providers', function (req, res) {
        logger.debug("Enter get() for vmware/providers");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        vmwareProvider.getvmwareProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (providers != null) {
                                if (providers.length > 0) {
                                    for (var i = 0; i < providers.length; i++) {
                                        providers[i].password = undefined;
                                    }
                                    res.send(providers);
                                    return;
                                }
                            } else {
                                res.send(200, []);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        vmwareProvider.getvmwareProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers === null) {
                                res.send(providersList);
                                return;
                            }
                            if (providers.length > 0) {
                                for (var i = 0; i < providers.length; i++) {
                                    providers[i].password = undefined;
                                }
                                res.send(providers);
                                return;
                            } else {
                                res.send(providersList);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            }
        });
    });

    //start: get azure provider by id
    app.get('/vmware/providers/:providerId', function (req, res) {

        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }
        vmwareProvider.getvmwareProviderById(providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (aProvider) {
                masterUtil.getOrgByRowId(aProvider.orgId[0], function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    aProvider.orgname = orgs[0].orgname;
                    if (orgs.length > 0) {
                        aProvider.password = undefined;
                        res.send(aProvider);
                        return;
                    }
                });

            } else {
                res.send(404);
                return;
            }
        });
    }); //end: get azure provider by id

    //start: removes azure provider
    app.delete('/vmware/providers/:providerId', function (req, res) {
        logger.debug("Enter delete for vmware/providers/%s", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    vmwareProvider.getvmwareProviderById(providerId, function (err, aProvider) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (aProvider) {
                            VMImage.getImageByProviderId(providerId, function (err, anImage) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                if (anImage.length > 0) {
                                    res.send(403, "Provider already used by Some Images.To delete provider please delete respective Images first.");
                                    return;
                                }
                                logger.debug('Providerid: ', providerId);
                                blueprintModel.getBlueprintsByProviderId(providerId, function (err, providers) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (providers.length > 0) {
                                        res.send(403, "Provider already used by Some Blueprints.To delete provider please delete respective Blueprints first.");
                                        return;
                                    }
                                    vmwareProvider.removevmwareProviderById(providerId, function (err, deleteCount) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (deleteCount) {
                                            instanceService.removeInstancesByProviderId(providerId, function (err, data) {
                                                if (err) {
                                                    logger.error(err);
                                                    res.status(500).send(errorResponses.db.error);
                                                    return;
                                                } else {
                                                    settingsService.trackSettingWizard('provider', aProvider.orgId[0], function (err, results) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        } else {
                                                            logger.debug("Enter delete() for vmware/providers/%s", req.params.providerId);
                                                            res.send({
                                                                deleteCount: deleteCount
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.send(400);
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }); //
    });


    app.post('/vmware/providers/:providerId/update', function (req, res) {
        logger.debug("Enter post() for /providers/vmware/%s/update", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var vmwareusername = req.body.vmwareusername;
        var vmwarepassword = req.body.vmwarepassword;
        var vmwarehost = req.body.vmwarehost;
        var vmwaredc = req.body.vmwaredc;
        var providerName = req.body.providerName;
        var orgId = req.body.orgId;

        if (typeof vmwareusername === 'undefined' || vmwareusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        // if (typeof vmwarepassword === 'undefined' || vmwarepassword.length === 0) {
        // 	res.status(400).send("Please Enter Password.");
        // 	return;
        // }
        if (typeof vmwarehost === 'undefined' || vmwarehost.length === 0) {
            res.status(400).send("Please Enter a Host.");
            return;
        }
        if (typeof vmwaredc === 'undefined' || vmwaredc.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please Select Any Organization.");
            return;
        }


        function updateDb(providerData) {
            vmwareProvider.updatevmwareProviderById(req.params.providerId, providerData, function (err, updateCount) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    if (orgs.length > 0) {
                        var dommyProvider = {
                            _id: req.params.providerId,
                            id: 9,
                            username: vmwareusername,
                            //password: vmwarepassword,
                            host: vmwarehost,
                            providerName: providerName,
                            dc: vmwaredc,
                            orgId: orgs[0].rowid,
                            orgName: orgs[0].orgname
                        };
                        res.send(dommyProvider);
                        return;
                    }
                });
            });
        }



        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    if (vmwarepassword) {
                        var providerData = {
                            id: 9,
                            username: vmwareusername,
                            password: vmwarepassword,
                            host: vmwarehost,
                            providerName: providerName,
                            tenantid: vmwaredc,
                            orgId: orgId
                        };
                        logger.debug("provider data %s", JSON.stringify(providerData));
                        updateDb(providerData);
                    } else {
                        vmwareProvider.getvmwareProviderById(req.params.providerId, function (err, aProvider) {
                            if (err) {
                                res.status(500).send("Not able to fetch org.");
                                return;
                            }
                            var providerData = {
                                id: 9,
                                username: vmwareusername,
                                password: aProvider.password,
                                host: vmwarehost,
                                providerName: providerName,
                                tenantid: vmwaredc,
                                orgId: orgId
                            };
                            logger.debug("provider data %s", JSON.stringify(providerData));
                            updateDb(providerData);
                        });

                    }
                }
            });
        });
    });


    app.post('/hppubliccloud/providers', function (req, res) {
        logger.debug("Enter post() for /hppubliccloud.", typeof req.files.hppubliccloudinstancepem);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var hppubliccloudusername = req.body.openstackusername;
        var hppubliccloudpassword = req.body.openstackpassword;
        var hppubliccloudhost = req.body.openstackhost;
        var hppubliccloudtenantid = req.body.openstacktenantid;
        var hppubliccloudtenantname = req.body.openstacktenantname;
        var hppubliccloudprojectname = req.body.openstackprojectname;
        var providerName = req.body.providerName;
        var providerType = req.body.providerType.toLowerCase();
        var hppubliccloudkeyname = req.body.hppubliccloudkeyname;
        var hppubliccloudregion = req.body.hppubliccloudregion;
        var hpFileName = req.files.hpFileName.originalFilename;
        var orgId = req.body.orgId;

        var serviceendpoints = {
            compute: req.body.openstackendpointcompute,
            network: req.body.openstackendpointnetwork,
            image: req.body.openstackendpointimage,
            ec2: req.body.openstackendpointec2,
            identity: req.body.openstackendpointidentity,
        };

        if (typeof hppubliccloudusername === 'undefined' || hppubliccloudusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        if (typeof hppubliccloudpassword === 'undefined' || hppubliccloudpassword.length === 0) {
            res.status(400).send("Please Enter Password.");
            return;
        }
        if (typeof hppubliccloudhost === 'undefined' || hppubliccloudhost.length === 0) {
            res.status(400).send("Please Enter a Host.");
            return;
        }
        if (typeof hppubliccloudtenantid === 'undefined' || hppubliccloudtenantid.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof hppubliccloudregion === 'undefined' || hppubliccloudregion.length === 0) {
            res.status(400).send("Please Enter Region.");
            return;
        }
        if (typeof hppubliccloudkeyname === 'undefined' || hppubliccloudkeyname.length === 0) {
            res.status(400).send("Please Enter a Key name.");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please Select Any Organization.");
            return;
        }
        if (typeof hppubliccloudtenantname === 'undefined' || hppubliccloudtenantname.length === 0) {
            res.status(400).send("Please Enter Tenant Name.");
            return;
        }
        if (typeof hppubliccloudprojectname === 'undefined' || hppubliccloudprojectname.length === 0) {
            res.status(400).send("Please Enter Project Name.");
            return;
        }
        if (typeof serviceendpoints.compute === 'undefined' || serviceendpoints.compute.length === 0) {
            res.status(400).send("Please Enter Compute Endpoint Name.");
            return;
        }
        if (typeof serviceendpoints.identity === 'undefined' || serviceendpoints.identity.length === 0) {
            res.status(400).send("Please Enter Identity Endpoint Name.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                if (anUser) {
                    var providerData = {
                        id: 9,
                        username: hppubliccloudusername,
                        password: hppubliccloudpassword,
                        host: hppubliccloudhost,
                        providerName: providerName,
                        providerType: providerType,
                        tenantid: hppubliccloudtenantid,
                        tenantname: hppubliccloudtenantname,
                        projectname: hppubliccloudprojectname,
                        serviceendpoints: serviceendpoints,
                        region: hppubliccloudregion,
                        keyname: hppubliccloudkeyname,
                        hpFileName: hpFileName,
                        orgId: orgId
                    };
                    hppubliccloudProvider.gethppubliccloudProviderByName(providerData.providerName, providerData.orgId, function (err, prov) {
                        if (err) {
                            logger.error("err. ", err);
                            res.status(500).send("Error to fetch Provider: ", err);
                        }
                        if (prov) {
                            logger.debug("Provider name already exist");
                            res.status(409).send("Provider name already exist.");
                            return;
                        }
                        hppubliccloudProvider.createNew(req, providerData, function (err, provider) {
                            if (err) {
                                logger.error("Failed to create Provider: ", err);
                                res.status(500).send("Failed to create Provider.");
                                return;
                            }

                            masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                                if (err) {
                                    res.status(500).send("Not able to fetch org.");
                                    return;
                                }
                                if (orgs.length > 0) {

                                    var dommyProvider = {
                                        _id: provider._id,
                                        id: 9,
                                        username: hppubliccloudusername,
                                        password: hppubliccloudpassword,
                                        host: hppubliccloudhost,
                                        providerName: provider.providerName,
                                        providerType: provider.providerType,
                                        hpFileName: provider.hpFileName,
                                        orgId: orgs[0].rowid,
                                        orgName: orgs[0].orgname,
                                        tenantid: hppubliccloudtenantid,
                                        __v: provider.__v,

                                    };
                                    res.send(dommyProvider);
                                    return;

                                }
                            });

                            logger.debug("Exit post() for /providers");
                        });
                    });

                } //end anuser
            });
        });

    });

    app.get('/hppubliccloud/providers', function (req, res) {
        logger.debug("Enter get() for /hppubliccloud/providers");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        hppubliccloudProvider.gethppubliccloudProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (providers != null) {
                                for (var i = 0; i < providers.length; i++) {
                                    providers[i]['providerType'] = providers[i]['providerType'].toUpperCase();
                                }
                                logger.debug("providers>>> ", JSON.stringify(providers));
                                if (providers.length > 0) {
                                    res.send(providers);
                                    return;
                                }
                            } else {
                                res.send(200, []);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        hppubliccloudProvider.gethppubliccloudProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers === null) {
                                res.send(providersList);
                                return;
                            }
                            if (providers.length > 0) {
                                res.send(providers);
                                return;
                            } else {
                                res.send(providersList);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            }
        });
    });

    app.get('/hppubliccloud/providers/:providerId', function (req, res) {
        logger.debug("Enter get() for /hppubliccloud/providers//%s", req.params.providerId);
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }
        hppubliccloudProvider.gethppubliccloudProviderById(providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (aProvider) {

                masterUtil.getOrgByRowId(aProvider.orgId[0], function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    aProvider.orgname = orgs[0].orgname;

                    if (orgs.length > 0) {
                        res.send(aProvider);
                        return;
                    }
                });

            } else {
                res.status(404).send("Provider not found.");
                return;
            }
        });
    });


    app.post('/hppubliccloud/providers/:providerId/update', function (req, res) {
        logger.debug("Enter post() for /providers/hppubliccloud/%s/update", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var hppubliccloudusername = req.body.openstackusername;
        var hppubliccloudpassword = req.body.openstackpassword;
        var hppubliccloudhost = req.body.openstackhost;
        var hppubliccloudtenantid = req.body.openstacktenantid;
        var hppubliccloudtenantname = req.body.openstacktenantname;
        var hppubliccloudprojectname = req.body.openstackprojectname;
        var providerName = req.body.providerName;
        var providerType = req.body.providerType.toLowerCase();
        var hppubliccloudkeyname = req.body.hppubliccloudkeyname;
        var hpFileName = req.files.hpFileName.originalFilename;
        var hppubliccloudregion = req.body.hppubliccloudregion;
        var providerId = req.params.providerId;

        var serviceendpoints = {
            compute: req.body.openstackendpointcompute,
            network: req.body.openstackendpointnetwork,
            image: req.body.openstackendpointimage,
            ec2: req.body.openstackendpointec2,
            identity: req.body.openstackendpointidentity,

        };

        var orgId = req.body.orgId;
        if (typeof hppubliccloudusername === 'undefined' || hppubliccloudusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        if (typeof hppubliccloudpassword === 'undefined' || hppubliccloudpassword.length === 0) {
            res.status(400).send("Please Enter Password.");
            return;
        }
        if (typeof hppubliccloudhost === 'undefined' || hppubliccloudhost.length === 0) {
            res.status(400).send("Please Enter a Host.");
            return;
        }
        if (typeof hppubliccloudtenantid === 'undefined' || hppubliccloudtenantid.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof hppubliccloudregion === 'undefined' || hppubliccloudregion.length === 0) {
            res.status(400).send("Please Enter Region.");
            return;
        }
        if (typeof hppubliccloudkeyname === 'undefined' || hppubliccloudkeyname.length === 0) {
            res.status(400).send("Please Enter a Key name.");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof hppubliccloudtenantname === 'undefined' || hppubliccloudtenantname.length === 0) {
            res.status(400).send("Please Enter Tenant Name.");
            return;
        }
        if (typeof hppubliccloudprojectname === 'undefined' || hppubliccloudprojectname.length === 0) {
            res.status(400).send("Please Enter Project Name.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please Select Any Organization.");
            return;
        }
        if (typeof serviceendpoints.compute === 'undefined' || serviceendpoints.compute.length === 0) {
            res.status(400).send("Please Enter Compute Endpoint Name.");
            return;
        }
        if (typeof serviceendpoints.identity === 'undefined' || serviceendpoints.identity.length === 0) {
            res.status(400).send("Please Enter Identity Endpoint Name.");
            return;
        }


        var providerData = {
            id: 9,
            username: hppubliccloudusername,
            password: hppubliccloudpassword,
            host: hppubliccloudhost,
            providerName: providerName,
            providerType: providerType,
            tenantid: hppubliccloudtenantid,
            tenantname: hppubliccloudtenantname,
            projectname: hppubliccloudprojectname,
            serviceendpoints: serviceendpoints,
            region: hppubliccloudregion,
            hpFileName: hpFileName,
            keyname: hppubliccloudkeyname,
            orgId: orgId
        };

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {
                    hppubliccloudProvider.updatehppubliccloudProviderById(providerId, providerData, function (err, updateCount) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                            if (err) {
                                res.status(500).send("Not able to fetch org.");
                                return;
                            }
                            if (orgs.length > 0) {
                                var dommyProvider = {
                                    _id: providerId,
                                    id: 9,
                                    username: hppubliccloudusername,
                                    password: hppubliccloudpassword,
                                    host: hppubliccloudhost,
                                    providerName: providerData.providerName,
                                    providerType: providerData.providerType,
                                    orgId: orgs[0].rowid,
                                    orgName: orgs[0].orgname
                                };
                                res.send(dommyProvider);
                                return;
                            }
                        });
                    });

                }
            });
        });
    });

    //start: removes azure provider
    app.delete('/hppubliccloud/providers/:providerId', function (req, res) {
        logger.debug("Enter delete() for hppubliccloud/providers/%s", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var providerId = req.params.providerId.trim();

        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                if (anUser) {
                    hppubliccloudProvider.gethppubliccloudProviderById(providerId, function (err, aProvider) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (aProvider) {
                            VMImage.getImageByProviderId(providerId, function (err, anImage) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                if (anImage) {
                                    res.send(403, "Provider already used by Some Images.To delete provider please delete respective Images first.");
                                    return;
                                }
                                blueprintModel.getBlueprintsByProviderId(providerId, function (err, providers) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (providers.length > 0) {
                                        res.send(403, "Provider already used by Some Blueprints.To delete provider please delete respective Blueprints first.");
                                        return;
                                    }
                                    hppubliccloudProvider.removehppubliccloudProviderById(providerId, function (err, deleteCount) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (deleteCount) {
                                            instanceService.removeInstancesByProviderId(providerId, function (err, data) {
                                                if (err) {
                                                    logger.error(err);
                                                    res.status(500).send(errorResponses.db.error);
                                                    return;
                                                } else {
                                                    settingsService.trackSettingWizard('provider', aProvider.orgId[0], function (err, results) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        } else {
                                                            logger.debug("Enter delete() for hppubliccloud/providers/%s", req.params.providerId);
                                                            res.send({
                                                                deleteCount: deleteCount
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.send(400);
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });


    //Creates Azure Provider
    app.post('/azure/providers', function (req, res) {

        logger.debug("Enter post() for Azure.");
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var azureSubscriptionId = req.body.azureSubscriptionId;
        var azureClientId = req.body.azureClientId;
        var azureClientSecret = req.body.azureClientSecret;
        var azureTenantId = req.body.azureTenantId;

        var providerName = req.body.providerName;
        var providerType = req.body.providerType;
        var pemFileName = null;
        if (req.files && req.files.azurepem)
            pemFileName = req.files.azurepem.originalFilename;
        var keyFileName = null;
        if (req.files && req.files.azurekey)
            keyFileName = req.files.azurekey.originalFilename;
        var orgId = req.body.orgId;

        if (typeof azureSubscriptionId === 'undefined' || azureSubscriptionId.length === 0) {
            res.status(400).send("Please Enter SubscriptionId.");
            return;
        }

        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof pemFileName === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please upload azure subscription pem file");
            return;
        }
        if (typeof keyFileName === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please upload azure subscription key file");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please Select Any Organization.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {

                    var providerData = {
                        id: 9,
                        subscriptionId: azureSubscriptionId,
                        providerName: providerName,
                        providerType: providerType,
                        pemFileName: pemFileName,
                        keyFileName: keyFileName,
                        orgId: orgId,
                        clientId: azureClientId,
                        clientSecret: azureClientSecret,
                        tenant: azureTenantId
                    };
                    azurecloudProvider.getAzureCloudProviderByName(providerData.providerName, providerData.orgId, function (err, prov) {
                        if (err) {
                            logger.debug("Failed to fetch Azure provider. ", err);
                            res.status(500).send("Failed to fetch Azure provider.");
                            return;
                        }
                        if (prov) {
                            res.status(409).send("Provider name already exist.");
                            return;
                        }
                        azurecloudProvider.createNew(req, providerData, function (err, provider) {
                            if (err) {
                                logger.debug("Failed to create Provider.", err);
                                res.status(500).send("Failed to create Provider.");
                                return;
                            }

                            masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                                if (err) {
                                    res.status(500).send("Not able to fetch org.");
                                    return;
                                }
                                trackSettingWizard(providerData.orgId, function (err, data) {
                                    if (err) {
                                        res.status(500).send("Not able to update wizards.");
                                        return;
                                    }
                                    if (orgs.length > 0) {
                                        var dommyProvider = {
                                            _id: provider._id,
                                            id: 9,
                                            subscriptionId: azureSubscriptionId,
                                            providerName: provider.providerName,
                                            providerType: provider.providerType,
                                            pemFileName: pemFileName,
                                            keyFileName: keyFileName,
                                            orgId: orgs[0].rowid,
                                            orgName: orgs[0].orgname,
                                            __v: provider.__v,

                                        };
                                        res.send(dommyProvider);
                                        return;
                                    }
                                });
                            });

                            logger.debug("Exit post() for /providers");
                        });
                    });

                } //end anuser
            });
        });

    }); //ends :create Azure provider

    //starts: get azure providers
    app.get('/azure/providers', function (req, res) {
        logger.debug("Enter get() for /azure/providers");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        azurecloudProvider.getAzureCloudProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (providers != null) {
                                for (var i = 0; i < providers.length; i++) {
                                    providers[i]['providerType'] = providers[i]['providerType'].toUpperCase();
                                }
                                if (providers.length > 0) {
                                    for (var i = 0; i < providers.length; i++) {
                                        providers[i].clientId = undefined;
                                        providers[i].clientSecret = undefined;
                                        providers[i].tenant = undefined;
                                        providers[i].subscriptionId = undefined;
                                    }
                                    res.send(providers);
                                    return;
                                }
                            } else {
                                res.status(200).send([]);
                                return;
                            }
                        });
                    } else {
                        res.status(200).send([]);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        azurecloudProvider.getAzureCloudProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers === null) {
                                res.send(providersList);
                                return;
                            }
                            if (providers.length > 0) {
                                for (var i = 0; i < providers.length; i++) {
                                    providers[i].clientId = undefined;
                                    providers[i].clientSecret = undefined;
                                    providers[i].tenant = undefined;
                                    providers[i].subscriptionId = undefined;
                                }
                                res.send(providers);
                                return;
                            } else {
                                res.send(providersList);
                                return;
                            }
                        });
                    } else {
                        res.status(200).send([]);
                        return;
                    }
                });
            }
        });
    }); //end: get azure providers

    //start: get azure provider by id
    app.get('/azure/providers/:providerId', function (req, res) {
        logger.debug("Enter get() for /azure/providers//%s", req.params.providerId);
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }
        azurecloudProvider.getAzureCloudProviderById(providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (aProvider) {
                logger.debug(aProvider);
                aProvider = JSON.parse(aProvider)
                logger.debug(aProvider.orgId);
                masterUtil.getOrgByRowId(aProvider.orgId[0], function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    aProvider.orgname = orgs[0].orgname;

                    if (orgs.length > 0) {
                        aProvider.subscriptionId = undefined;
                        aProvider.clientId = undefined;
                        aProvider.clientSecret = undefined;
                        aProvider.tenant = undefined;
                        res.send(aProvider);
                        return;
                    }
                });

            } else {
                res.status(500).send("Not Found Provider.");
            }
        });
    }); //end: get azure provider by id

    //start: update azure provider
    app.post('/azure/providers/:providerId/update', function (req, res) {
        logger.debug("Enter post() for /providers/azure/%s/update", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';

        var azureSubscriptionId = req.body.azureSubscriptionId;
        var azureClientId = req.body.azureClientId;
        var azureClientSecret = req.body.azureClientSecret;
        var azureTenantId = req.body.azureTenantId;
        var providerName = req.body.providerName;
        var providerId = req.params.providerId;
        var orgId = req.body.orgId;

        /*if (typeof azureSubscriptionId === 'undefined' || azureSubscriptionId.length === 0) {
            res.status(400).send("Please Enter Subscription Id.");
            return;
        }*/

        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }

        function updateDb(providerData) {
            azurecloudProvider.updateAzureCloudProviderById(providerId, providerData, function (err, updateCount) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    if (orgs.length > 0) {
                        var dommyProvider = {
                            _id: providerId,
                            id: 9,
                            subscriptionId: azureSubscriptionId,
                            providerName: providerData.providerName,
                            orgId: orgs[0].rowid,
                            orgName: orgs[0].orgname
                        };
                        res.send(dommyProvider);
                        return;
                    }
                });
            });
        }



        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {

                    if (azureClientId && azureClientSecret && azureTenantId) {
                        var providerData = {
                            id: 9,
                            azureSubscriptionId: azureSubscriptionId,
                            providerName: providerName,
                            orgId: orgId,
                            clientId: azureClientId,
                            clientSecret: azureClientSecret,
                            tenant: azureTenantId
                        };
                        updateDb(providerData);
                    } else {
                        azurecloudProvider.getAzureCloudProviderById(providerId, function (err, aProvider) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            aProvider = JSON.parse(aProvider);

                            var providerData = {
                                id: 9,
                                azureSubscriptionId: azureSubscriptionId,
                                providerName: providerName,
                                orgId: orgId,
                                clientId: azureClientId || aProvider.clientId,
                                clientSecret: azureClientSecret || aProvider.clientSecret,
                                tenant: azureTenantId || aProvider.tenant
                            };
                            updateDb(providerData);

                        });

                    }
                } else {
                    res.status(403).send('User does not exist');
                }
            });
        });
    }); //end: update azure provider

    //start: removes azure provider
    app.delete('/azure/providers/:providerId', function (req, res) {
        logger.debug("Enter delete() for /providers/%s", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.status(401).send("You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {
                    azurecloudProvider.getAzureCloudProviderById(providerId, function (err, aProvider) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        aProvider = JSON.parse(aProvider);
                        if (aProvider !== null) {
                            VMImage.getImageByProviderId(providerId, function (err, anImage) {
                                if (err) {
                                    logger.error(errorResponses.db.error);
                                    res.status(500).send("Failed to get Image.");
                                    return;
                                }
                                if (anImage.length > 0) {
                                    res.status(403).send("Provider already used by Some Images.To delete provider please delete respective Images first.");
                                    return;
                                }
                                blueprintModel.getBlueprintsByProviderId(providerId, function (err, providers) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (providers.length > 0) {
                                        res.send(403, "Provider already used by Some Blueprints.To delete provider please delete respective Blueprints first.");
                                        return;
                                    }
                                    azurecloudProvider.removeAzureCloudProviderById(providerId, function (err, deleteCount) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send("Failed to get Provider.");
                                            return;
                                        }
                                        if (deleteCount) {
                                            instanceService.removeInstancesByProviderId(providerId, function (err, data) {
                                                if (err) {
                                                    logger.error(err);
                                                    res.status(500).send(errorResponses.db.error);
                                                    return;
                                                } else {
                                                    settingsService.trackSettingWizard('provider', aProvider.orgId[0], function (err, results) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        } else {
                                                            logger.debug("Enter delete() for azure/providers/%s", req.params.providerId);
                                                            res.send({
                                                                deleteCount: deleteCount
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.send(400);
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        }); //
    });

    //Create Openstack provider
    app.post('/openstack/providers', function (req, res) {
        logger.debug("Enter post() for /providers.", typeof req.body.fileName);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var openstackusername = req.body.openstackusername;
        var openstackpassword = req.body.openstackpassword;
        var openstackhost = req.body.openstackhost;
        var openstacktenantid = req.body.openstacktenantid;
        var openstacktenantname = req.body.openstacktenantname;
        var openstackprojectname = req.body.openstackprojectname;
        var providerName = req.body.providerName;
        var providerType = req.body.providerType;
        var openstackkeyname = req.body.openstackkeyname;
        var pemFileName = req.files.openstackinstancepem.originalFilename;
        var orgId = req.body.orgId;

        var serviceendpoints = {
            compute: req.body.openstackendpointcompute,
            network: req.body.openstackendpointnetwork,
            image: req.body.openstackendpointimage,
            ec2: req.body.openstackendpointec2,
            identity: req.body.openstackendpointidentity,
        };

        if (typeof openstackusername === 'undefined' || openstackusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        if (typeof openstackpassword === 'undefined' || openstackpassword.length === 0) {
            res.status(400).send("Please Enter Password.");
            return;
        }
        if (typeof openstackhost === 'undefined' || openstackhost.length === 0) {
            res.status(400).send("Please Enter a Host.");
            return;
        }
        if (typeof openstacktenantid === 'undefined' || openstacktenantid.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof pemFileName === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please upload openstack subscription pem file");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400).send("Please Select Any Organization.");
            return;
        }
        if (typeof openstacktenantname === 'undefined' || openstacktenantname.length === 0) {
            res.status(400).send("Please Enter Tenant Name.");
            return;
        }
        if (typeof openstackprojectname === 'undefined' || openstackprojectname.length === 0) {
            res.status(400).send("Please Enter Project Name.");
            return;
        }
        if (typeof serviceendpoints.compute === 'undefined' || serviceendpoints.compute.length === 0) {
            res.status(400).send("Please Enter Compute Endpoint Name.");
            return;
        }
        if (typeof serviceendpoints.identity === 'undefined' || serviceendpoints.identity.length === 0) {
            res.status(400).send("Please Enter Identity Endpoint Name.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.status(400).send("You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                    return;
                }
                logger.debug("LoggedIn User: ", JSON.stringify(anUser));
                if (anUser) {

                    var providerData = {
                        id: 9,
                        username: openstackusername,
                        password: openstackpassword,
                        host: openstackhost,
                        providerName: providerName,
                        providerType: providerType,
                        tenantid: openstacktenantid,
                        tenantname: openstacktenantname,
                        projectname: openstackprojectname,
                        serviceendpoints: serviceendpoints,
                        keyname: openstackkeyname,
                        pemFileName: pemFileName,
                        orgId: orgId
                    };
                    openstackProvider.getopenstackProviderByName(providerData.providerName, providerData.orgId, function (err, prov) {
                        if (err) {
                            logger.debug("err.....", err);
                        }
                        if (prov) {
                            logger.debug("err.....", err);
                            res.status(409).send("Provider name already exist.");
                            return;
                        }
                        openstackProvider.createNew(req, providerData, function (err, provider) {
                            if (err) {
                                logger.debug("err.....", err);
                                res.status(500).send("Failed to create Provider.");
                                return;
                            }

                            masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                                if (err) {
                                    res.status(500).send("Not able to fetch org.");
                                    return;
                                }
                                trackSettingWizard(providerData.orgId, function (err, data) {
                                    if (err) {
                                        res.status(500).send("Not able to update wizards.");
                                        return;
                                    }
                                    if (orgs.length > 0) {
                                        var dommyProvider = {
                                            _id: provider._id,
                                            id: 9,
                                            username: openstackusername,
                                            //password: openstackpassword,
                                            host: openstackhost,
                                            providerName: provider.providerName,
                                            providerType: provider.providerType,
                                            orgId: orgs[0].rowid,
                                            orgName: orgs[0].orgname,
                                            pemFileName: pemFileName,
                                            tenantid: openstacktenantid,
                                            __v: provider.__v,

                                        };
                                        res.send(dommyProvider);
                                        return;
                                    }
                                });
                            });
                            logger.debug("Exit post() for /providers");
                        });
                    });

                } //end anuser
            });
        });

    });

    // Return list of all available AWS Providers.
    app.get('/openstack/providers', function (req, res) {
        logger.debug("Enter get() for /providers");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        openstackProvider.getopenstackProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (providers != null) {
                                if (providers.length > 0) {
                                    for (var i = 0; i < providers.length; i++) {
                                        providers[i].password = undefined;
                                    }
                                    res.send(providers);
                                    return;
                                }
                            } else {
                                res.status(200).send([]);
                                return;
                            }
                        });
                    } else {
                        res.status(500).send([]);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        openstackProvider.getopenstackProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers === null) {
                                res.send(providersList);
                                return;
                            }
                            if (providers.length > 0) {
                                for (var i = 0; i < providers.length; i++) {
                                    providers[i].password = undefined;
                                }
                                res.send(providers);
                                return;
                            } else {
                                res.send(providersList);
                                return;
                            }
                        });
                    } else {
                        res.status(200).send([]);
                        return;
                    }
                });
            }
        });
    });

    // Return AWS Provider respect to id.
    app.get('/openstack/providers/:providerId', function (req, res) {
        logger.debug("Enter get() for /providers/%s", req.params.providerId);
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }
        openstackProvider.getopenstackProviderById(providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (aProvider) {

                masterUtil.getOrgByRowId(aProvider.orgId[0], function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    aProvider.orgname = orgs[0].orgname;

                    if (orgs.length > 0) {
                        aProvider.password = undefined;
                        res.send(aProvider);
                        return;
                    }
                });

            } else {
                res.status(404).send("Provider not found.");
            }
        });
    });

    // Update a particular AWS Provider
    app.post('/openstack/providers/:providerId/update', function (req, res) {
        logger.debug("Enter post() for /providers/%s/update", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'modify';
        var openstackusername = req.body.openstackusername;
        var openstackpassword = req.body.openstackpassword;
        var openstackhost = req.body.openstackhost;
        var openstacktenantid = req.body.openstacktenantid;
        var openstacktenantname = req.body.openstacktenantname;
        var openstackprojectname = req.body.openstackprojectname;
        var providerName = req.body.providerName.trim();
        var providerId = req.params.providerId.trim();
        var openstackkeyname = req.body.openstackkeyname;
        var orgId = req.body.orgId;
        var providerId = req.params.providerId;

        var serviceendpoints = {
            compute: req.body.openstackendpointcompute,
            network: req.body.openstackendpointnetwork,
            image: req.body.openstackendpointimage,
            ec2: req.body.openstackendpointec2,
            identity: req.body.openstackendpointidentity

        };

        if (typeof openstackusername === 'undefined' || openstackusername.length === 0) {
            res.status(400).send("Please Enter Username.");
            return;
        }
        // if (typeof openstackpassword === 'undefined' || openstackpassword.length === 0) {
        // 	res.status(400).send("Please Enter Password.");
        // 	return;
        // }
        if (typeof openstackhost === 'undefined' || openstackhost.length === 0) {
            res.status(400).send("Please Enter a Host");
            return;
        }
        if (typeof openstacktenantid === 'undefined' || openstacktenantid.length === 0) {
            res.status(400).send("Please Enter a Tenant ID");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof openstacktenantname === 'undefined' || openstacktenantname.length === 0) {
            res.status(400).send("Please Enter Tenant Name.");
            return;
        }
        if (typeof openstackprojectname === 'undefined' || openstackprojectname.length === 0) {
            res.status(400).send("Please Enter Project Name.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400).send("Please Select Any Organization.");
            return;
        }
        if (typeof serviceendpoints.compute === 'undefined' || serviceendpoints.compute.length === 0) {
            res.status(400).send("Please Enter Compute Endpoint Name.");
            return;
        }
        if (typeof serviceendpoints.identity === 'undefined' || serviceendpoints.identity.length === 0) {
            res.status(400).send("Please Enter Identity Endpoint Name.");
            return;
        }

        function updateDB(providerData) {
            openstackProvider.updateopenstackProviderById(providerId, providerData, function (err, updateCount) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                    if (err) {
                        res.status(500).send("Not able to fetch org.");
                        return;
                    }
                    if (orgs.length > 0) {
                        var dommyProvider = {
                            _id: providerId,
                            id: 9,
                            username: openstackusername,
                            //password: openstackpassword,
                            host: openstackhost,
                            providerName: providerData.providerName,
                            orgId: orgs[0].rowid,
                            orgName: orgs[0].orgname
                        };
                        res.send(dommyProvider);
                        return;
                    }
                });
            });
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.status(401).send("You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {

                    logger.debug("Able to get AWS Keypairs. %s", JSON.stringify(data));

                    if (openstackpassword) {
                        var providerData = {
                            id: 9,
                            username: openstackusername,
                            password: openstackpassword,
                            host: openstackhost,
                            tenantid: openstacktenantid,
                            tenantname: openstacktenantname,
                            projectname: openstackprojectname,
                            providerName: providerName,
                            serviceendpoints: serviceendpoints,
                            keyname: openstackkeyname,
                            orgId: orgId
                        };
                        updateDB(providerData);
                    } else {

                        openstackProvider.getopenstackProviderById(providerId, function (err, aProvider) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (aProvider) {
                                var providerData = {
                                    id: 9,
                                    username: openstackusername,
                                    password: aProvider.password,
                                    host: openstackhost,
                                    tenantid: openstacktenantid,
                                    tenantname: openstacktenantname,
                                    projectname: openstackprojectname,
                                    providerName: providerName,
                                    serviceendpoints: serviceendpoints,
                                    keyname: openstackkeyname,
                                    orgId: orgId
                                };
                                updateDB(providerData);

                            } else {
                                res.status(404).send("Provider not found");
                            }
                        });


                    }
                } else {
                    res.status(403).send("Forbidden");
                }
            });
        });
    });

    // Delete a particular AWS Provider.
    app.delete('/openstack/providers/:providerId', function (req, res) {
        logger.debug("Enter delete() for /openstack/providers/%s", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var providerId = req.params.providerId.trim();

        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    openstackProvider.getopenstackProviderById(providerId, function (err, aProvider) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (aProvider) {
                            VMImage.getImageByProviderId(providerId, function (err, anImage) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                if (anImage.length) {
                                    res.send(403, "Provider already used by Some Images.To delete provider please delete respective Images first.");
                                    return;
                                }
                                blueprintModel.getBlueprintsByProviderId(providerId, function (err, providers) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (providers.length > 0) {
                                        res.send(403, "Provider already used by Some Blueprints.To delete provider please delete respective Blueprints first.");
                                        return;
                                    }
                                    openstackProvider.removeopenstackProviderById(providerId, function (err, deleteCount) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (deleteCount) {
                                            instanceService.removeInstancesByProviderId(providerId, function (err, data) {
                                                if (err) {
                                                    logger.error(err);
                                                    res.status(500).send(errorResponses.db.error);
                                                    return;
                                                } else {
                                                    settingsService.trackSettingWizard('provider', aProvider.orgId[0], function (err, results) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        } else {
                                                            logger.debug("Enter delete() for openStack/providers/%s", req.params.providerId);
                                                            res.send({
                                                                deleteCount: deleteCount
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.send(400);
                                            return;
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });


    // Create AWS Provider.
    // TODO Use async to reduce callbacks
    app.post('/aws/providers', function (req, res) {
        logger.debug("Enter post() for /providers.", typeof req.body.fileName);
        logger.debug("Req Body for providers ", JSON.stringify(req.body));
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'create';
        var accessKey = req.body.accessKey;
        var secretKey = req.body.secretKey;
        var providerName = req.body.providerName;
        var providerType = req.body.providerType;
        var orgId = req.body.orgId;
        var s3BucketName = req.body.s3BucketName;
        var plannedCost = req.body.plannedCost;
        if (plannedCost === null || plannedCost === '') {
            plannedCost = 0.0;
        }
        var isDefault = (req.body.isDefault === 'true') ? true : false;
        var hasDefaultProvider = false;

        if ((typeof accessKey === 'undefined' || accessKey.length === 0) && !isDefault) {
            res.status(400).send("Please Enter AccessKey.");
            return;
        }
        if ((typeof secretKey === 'undefined' || secretKey.length === 0) && !isDefault) {
            res.status(400).send("Please Enter SecretKey.");
            return;
        }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("Please Enter Name.");
            return;
        }
        if (typeof providerType === 'undefined' || providerType.length === 0) {
            res.status(400).send("Please Enter ProviderType.");
            return;
        }
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(400);
            res.send("Please Select Any Organization.");
            return;
        }
        AWSProvider.hasDefault(orgId, function (err, result) {
            if (err) {
                logger.debug("Error trying to get default user");
                res.status(500).send("Internal error.");
                return;
            } else if (result && isDefault) {
                logger.debug("Default user already exists");
                res.status(400).send("Cannot add multiple providers without access credentials for the same organization");
                return;
            } else {
                logger.debug("Adding provider");

                var region;
                if (typeof req.body.region === 'string') {
                    logger.debug("inside single region: ", req.body.region);
                    region = req.body.region;
                } else {
                    region = req.body.region[0];
                }
                logger.debug("Final Region:  ", region);

                var providerData = {
                    id: 9,
                    providerName: providerName,
                    providerType: providerType,
                    orgId: orgId,
                    isDefault: isDefault,
                    s3BucketName: s3BucketName,
                    plannedCost: plannedCost
                };
                var ec2;
                if (isDefault == true) {
                    ec2 = new EC2({
                        "isDefault": true,
                        "region": region
                    });
                } else {
                    ec2 = new EC2({
                        "access_key": accessKey,
                        "secret_key": secretKey,
                        "region": region
                    });

                    providerData.accessKey = cryptography.encryptText(accessKey, cryptoConfig.encryptionEncoding,
                        cryptoConfig.decryptionEncoding);
                    providerData.secretKey = cryptography.encryptText(secretKey, cryptoConfig.encryptionEncoding,
                        cryptoConfig.decryptionEncoding);
                }

                usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset,
                    function (err, data) {
                        if (!err) {
                            if (data == false) {
                                logger.debug('No permission to ' + permissionto + ' on ' + category);
                                res.send(401, "You don't have permission to perform this operation.");
                                return;
                            }
                        } else {
                            logger.error("Hit and error in haspermission:", err);
                            res.send(500);
                            return;
                        }

                        masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                            if (err) {
                                res.status(500).send("Failed to fetch User.");
                                return;
                            }
                            if (anUser) {
                                ec2.describeKeyPairs(function (err, data) {
                                    if (err && isDefault) {
                                        logger.debug("Unable to get AWS Keypairs");
                                        res.status(500).send("Not able to get catalyst instance metadata.");
                                        return;
                                    } else if (err) {
                                        logger.debug("Unable to get AWS Keypairs");
                                        res.status(500).send("Invalid AccessKey or SecretKey.");
                                        return;
                                    } else {
                                        logger.debug("Able to get AWS Keypairs. %s", JSON.stringify(data));
                                        AWSProvider.getAWSProviderByName(providerData.providerName, providerData.orgId,
                                            function (err, prov) {
                                                if (err) {
                                                    logger.error("err. ", err);
                                                }
                                                if (prov) {
                                                    logger.debug("getAWSProviderByName: ", JSON.stringify(prov));
                                                    res.status(409).send("Provider name already exist.");
                                                    return;
                                                }
                                                AWSProvider.createNew(providerData, function (err, provider) {
                                                    if (err) {
                                                        logger.error("err. ", err);
                                                        res.status(500).send("Failed to create Provider.");
                                                        return;
                                                    }
                                                    AWSKeyPair.createNew(req, provider._id, function (err, keyPair) {
                                                        masterUtil.getOrgByRowId(providerData.orgId, function (err, orgs) {
                                                            if (err) {
                                                                res.status(500).send("Not able to fetch org.");
                                                                return;
                                                            }
                                                            trackSettingWizard(providerData.orgId, function (err, data) {
                                                                if (err) {
                                                                    res.status(500).send("Not able to update wizards.");
                                                                    return;
                                                                }
                                                                if (orgs.length > 0) {
                                                                    if (keyPair) {
                                                                        var dommyProvider = {
                                                                            _id: provider._id,
                                                                            id: 9,
                                                                            //accessKey: provider.accessKey,
                                                                            //secretKey: provider.secretKey,
                                                                            providerName: provider.providerName,
                                                                            providerType: provider.providerType,
                                                                            s3BucketName: provider.s3BucketName,
                                                                            orgId: orgs[0].rowid,
                                                                            orgName: orgs[0].orgname,
                                                                            plannedCost: provider.plannedCost,
                                                                            __v: provider.__v,
                                                                            keyPairs: keyPair
                                                                        };
                                                                        res.send(dommyProvider);
                                                                        return;
                                                                    }
                                                                }
                                                            });
                                                        })
                                                    });
                                                    logger.debug("Exit post() for /providers");
                                                });
                                            });
                                    }
                                });
                            }
                        });
                    });
            }
        });
    });

    // Return list of all available AWS Providers.
    app.get('/aws/providers', function (req, res) {
        logger.debug("Enter get() for /providers");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        AWSProvider.getAWSProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers && providers.length > 0) {
                                res.send(providers);
                                return;
                            } else {
                                res.send(200, []);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        AWSProvider.getAWSProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = [];
                            if (providers === null) {
                                res.send(providersList);
                                return;
                            }
                            if (providers.length > 0) {
                                res.send(providers);
                                return;
                            } else {
                                res.send(providersList);
                                return;
                            }
                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            }
        });
    });

    // Update a particular AWS Provider
    app.post('/aws/providers/:providerId/update', function (req, res) {
        logger.debug("Enter post() for /providers/%s/update", req.params.providerId);
        logger.debug("Req Body for providers ", JSON.stringify(req.body));
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'modify';
        if (req.body.accessKey != undefined)
            var accessKey = req.body.accessKey.trim();

        if (req.body.secretKey != undefined)
            var secretKey = req.body.secretKey.trim();
        var providerName = req.body.providerName.trim();
        var providerId = req.params.providerId.trim();
        var orgId = req.body.orgId;
        var s3BucketName = req.body.s3BucketName;
        var plannedCost = req.body.plannedCost;
        if (plannedCost === null || plannedCost === '') {
            plannedCost = 0.0;
        }
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(400).send("{Please Enter ProviderId.}");
            return;
        }

        // if (typeof accessKey === 'undefined' || accessKey.length === 0) {
        // 	res.status(400).send("{Please Enter AccessKey.}");
        // 	return;
        // }
        // if (typeof secretKey === 'undefined' || secretKey.length === 0) {
        // 	res.status(400).send("{Please Enter SecretKey.}");
        // 	return;
        // }
        if (typeof providerName === 'undefined' || providerName.length === 0) {
            res.status(400).send("{Please Enter Name.}");
            return;
        }

        function encryptKeys(keys) {
            cryptography.encryptMultipleText(keys, cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding, function (err, encryptedKeys) {
                if (err) {
                    res.status(500).send("Failed to encrypt accessKey or secretKey");
                    return;
                }
                var providerData = {
                    id: 9,
                    accessKey: encryptedKeys[0],
                    secretKey: encryptedKeys[1],
                    providerName: providerName,
                    orgId: orgId,
                    s3BucketName: s3BucketName,
                    plannedCost: plannedCost
                };
                updateInDb(providerData);
            });
        }

        function updateInDb(providerData) {
            AWSProvider.updateAWSProviderById(providerId, providerData, function (err, updateCount) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                if (typeof req.body.keyPairName === 'undefined') {
                    res.send({
                        updateCount: updateCount
                    });
                    return;
                } else {
                    AWSKeyPair.createNew(req, providerId, function (err, keyPair) {
                        if (updateCount) {
                            res.send({
                                updateCount: updateCount
                            });
                        } else {
                            res.send(400);
                        }
                    });
                }
            });
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {

                    if (accessKey && secretKey) {
                        var keys = [];
                        keys.push(accessKey);
                        keys.push(secretKey);
                        encryptKeys(keys)
                    } else {
                        AWSProvider.getAWSProviderById(providerId, function (err, aProvider) {
                            if (err) {
                                res.status(500).send("Failed to fetch Keypairs.");
                                return;
                            }
                            var providerData = {
                                id: 9,
                                accessKey: aProvider.accessKey,
                                secretKey: aProvider.secretKey,
                                s3BucketName: s3BucketName,
                                providerName: providerName,
                                plannedCost: plannedCost,
                                orgId: orgId
                            };

                            updateInDb(providerData);
                        });

                    }
                }
            });
        });


    });

    // Delete a particular AWS Provider.
    app.delete('/aws/providers/:providerId', function (req, res) {
        logger.debug("Enter delete() for /providers/%s", req.params.providerId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var providerId = req.params.providerId.trim();
        if (typeof providerId === 'undefined' || providerId.length === 0) {
            res.status(500).send("Please Enter ProviderId.");
            return;
        }

        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    AWSProvider.getAWSProviderById(providerId, function (err, aProvider) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (aProvider) {
                            VMImage.getImageByProviderId(providerId, function (err, anImage) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                if (anImage.length > 0) {
                                    res.send(403, "Provider already used by Some Images.To delete provider please delete respective Images first.");
                                    return;
                                }
                                blueprintModel.getBlueprintsByProviderId(providerId, function (err, providers) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (providers.length > 0) {
                                        res.send(403, "Provider already used by Some Blueprints.To delete provider please delete respective Blueprints first.");
                                        return;
                                    }
                                    AWSProvider.removeAWSProviderById(providerId, function (err, deleteCount) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (deleteCount) {
                                            instanceService.removeInstancesByProviderId(providerId, function (err, data) {
                                                if (err) {
                                                    logger.error(err);
                                                    res.status(500).send(errorResponses.db.error);
                                                    return;
                                                } else {
                                                    settingsService.trackSettingWizard('provider', aProvider.orgId[0], function (err, results) {
                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        } else {
                                                            logger.debug("Enter delete() for aws/providers/%s", req.params.providerId);
                                                            res.send({
                                                                deleteCount: deleteCount
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.send(400);
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });

    // Delete a particular AWS Provider.
    app.delete('/aws/providers/keypairs/:keyPairId', function (req, res) {
        logger.debug("Enter delete() for /aws/providers/keypairs/%s", req.params.keyPairId);
        var user = req.session.user;
        var category = configmgmtDao.getCategoryFromID("9");
        var permissionto = 'delete';
        var keyPairId = req.params.keyPairId.trim();
        if (typeof keyPairId === 'undefined' || keyPairId.length === 0) {
            res.status(500).send("Please Enter keyPairId.");
            return;
        }
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401, "You don't have permission to perform this operation.");
                    return;
                }
            } else {
                logger.error("Hit and error in haspermission:", err);
                res.send(500);
                return;
            }

            masterUtil.getLoggedInUser(user.cn, function (err, anUser) {
                if (err) {
                    res.status(500).send("Failed to fetch User.");
                }
                if (anUser) {
                    if (data && anUser.orgname_rowid[0] !== "") {
                        logger.debug("Inside check not authorized.");
                        res.send(401, "You don't have permission to perform this operation.");
                        return;
                    }
                    blueprints.getBlueprintByKeyPairId(keyPairId, function (err, aBluePrint) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (aBluePrint.length) {
                            res.send(403, "KeyPair already used by Some BluePrints.To delete KeyPair please delete respective BluePrints First.");
                            return;
                        } else {
                            instances.getInstanceByKeyPairId(keyPairId, function (err, anInstance) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                if (anInstance.length) {
                                    res.status(403).send("KeyPair is already used by Instance.");
                                } else {
                                    AWSKeyPair.removeAWSKeyPairById(keyPairId, function (err, deleteCount) {
                                        if (deleteCount) {
                                            logger.debug("KeyPair deleted", keyPairId);
                                            res.send({
                                                deleteCount: deleteCount
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });
    // Return all available security groups from AWS.
    app.post('/aws/providers/securitygroups', function (req, res) {
        logger.debug("Get security groups");

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.getSecurityGroups(function (err, data) {
                if (err) {
                    logger.error("Unable to get securitygroups Keypairs: ", err);
                    res.status(500).send("Invalid AccessKey or SecretKey.");
                    return;
                }
                res.send(data);
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }
    });

    // Return all available keypairs from AWS.
    app.post('/aws/providers/keypairs/list', function (req, res) {
        logger.debug("Get provider keypairs for a region");

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.describeKeyPairs(function (err, data) {
                if (err && isDefault) {
                    logger.error("Unable to get AWS Keypairs: ", err);
                    // res.status(500).send('Invalid credentials \n' + 'ERROR: ' + err.message);
                    res.status(500).send(err.message);
                    return;
                } else if (err) {
                    logger.error("Unable to get AWS Keypairs: ", err);
                    // res.status(500).send('Invalid credentials \n' + ' ERROR: ' + err.message);
                    res.status(500).send(err.message);
                    return;
                } else {
                    res.send(data);
                }
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }
    });

    // Return all available security groups from AWS for VPC.
    app.post('/aws/providers/vpc/:vpcId/securitygroups', function (req, res) {

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.getSecurityGroupsForVPC(req.params.vpcId, function (err, data) {
                if (err) {
                    logger.error("Unable to get AWS Security Groups for VPC.");
                    // res.status(500).send("Unable to get AWS Security Groups for VPC.");
                    res.status(500).send(err.message);
                    return;
                }
                res.send(data);
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }

    });

    // Return all VPCs w.r.t. region
    app.post('/aws/providers/describe/vpcs', function (req, res) {
        logger.debug("Enter describeVpcs ");

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.describeVpcs(function (err, data) {
                if (err) {
                    logger.error("Unable to describe Vpcs from AWS.", err);
                    // res.status(500).send("Unable to Describe Vpcs from AWS.");
                    res.status(500).send(err.message);
                    return;
                }
                res.send(data);
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }
    });

    // Return all Subnets w.r.t. vpc
    app.post('/aws/providers/vpc/:vpcId/subnets', function (req, res) {
        logger.debug("Enter describeSubnets ");

        var defaultProvider = (req.body.isDefault === 'true') ? true : false

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.describeSubnets(req.params.vpcId, function (err, data) {
                if (err) {
                    logger.error("Unable to describeSubnets from AWS.", err);
                    // res.status(500).send("Unable to describeSubnets from AWS.");
                    res.status(500).send(err.message);
                    return;
                }
                res.send(data);
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }
    });

    app.get('/aws/providers/permission/set', function (req, res) {
        masterUtil.checkPermission(req.session.user.cn, function (err, permissionSet) {
            if (err) {
                res.status(500).send("Error for permissionSet.");
            }
            if (permissionSet) {
                res.send(permissionSet);
            } else {
                res.send([]);
            }
        });
    });

    // Return AWS Providers respect to orgid.
    app.get('/aws/providers/org/:orgId', function (req, res) {
        logger.debug("Enter get() for /providers/org/%s", req.params.orgId);
        var orgId = req.params.orgId.trim();
        if (typeof orgId === 'undefined' || orgId.length === 0) {
            res.status(500).send("Please Enter orgId.");
            return;
        }
        AWSProvider.getAWSProvidersByOrgId(orgId, function (err, providers) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (providers) {
                for (var i = 0; i < providers.length; i++) {
                    delete providers[i].accessKey;
                    delete providers[i].secretKey;
                }
                res.send(providers);
                return;
            } else {
                res.send([]);
                return;
            }
        });
    });


    // Return list of all types of available providers.
    app.get('/allproviders/list', function (req, res) {
        logger.debug("Enter get() for /allproviders/list");
        var loggedInUser = req.session.user.cn;
        masterUtil.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                res.status(500).send("Failed to fetch User.");
                return;
            }
            if (!anUser) {
                res.status(500).send("Invalid User.");
                return;
            }
            if (anUser.orgname_rowid[0] === "") {
                masterUtil.getAllActiveOrg(function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        AWSProvider.getAWSProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = {};
                            if (providers && providers.length > 0) {
                                var awsProviderList = [];
                                for (var i = 0; i < providers.length; i++) {
                                    awsProviderList.push(providers[i]);
                                }
                                providersList.awsProviders = awsProviderList;
                            } else {
                                providersList.awsProviders = [];
                            }

                            openstackProvider.getopenstackProvidersForOrg(orgList, function (err, openstackProviders) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }

                                if (openstackProviders != null) {
                                    if (openstackProviders.length > 0) {
                                        for (var i = 0; i < openstackProviders.length; i++) {
                                            openstackProviders[i].password = undefined;
                                        }
                                        providersList.openstackProviders = openstackProviders;
                                    }
                                } else {
                                    providersList.openstackProviders = [];
                                }

                                vmwareProvider.getvmwareProvidersForOrg(orgList, function (err, vmwareProviders) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (vmwareProviders != null) {
                                        if (vmwareProviders.length > 0) {
                                            for (var i = 0; i < vmwareProviders.length; i++) {
                                                vmwareProviders[i].password = undefined;
                                            }
                                            providersList.vmwareProviders = vmwareProviders;
                                        }
                                    } else {
                                        providersList.vmwareProviders = [];
                                    }

                                    hppubliccloudProvider.gethppubliccloudProvidersForOrg(orgList, function (err, hpCloudProviders) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (hpCloudProviders != null) {
                                            for (var i = 0; i < hpCloudProviders.length; i++) {
                                                hpCloudProviders[i]['providerType'] = hpCloudProviders[i]['providerType'].toUpperCase();
                                            }
                                            if (hpCloudProviders.length > 0) {
                                                providersList.hpPlublicCloudProviders = hpCloudProviders;
                                            }
                                        } else {
                                            providersList.hpPlublicCloudProviders = [];
                                        }

                                        azurecloudProvider.getAzureCloudProvidersForOrg(orgList, function (err, azureProviders) {

                                            if (err) {
                                                logger.error(err);
                                                res.status(500).send(errorResponses.db.error);
                                                return;
                                            }
                                            if (azureProviders != null) {

                                                for (var i = 0; i < azureProviders.length; i++) {
                                                    azureProviders[i].clientId = undefined;
                                                    azureProviders[i].clientSecret = undefined;
                                                    azureProviders[i].tenant = undefined;
                                                    azureProviders[i]['providerType'] = azureProviders[i]['providerType'].toUpperCase();
                                                }
                                                if (azureProviders.length > 0) {
                                                    providersList.azureProviders = azureProviders;
                                                    res.send(providersList);
                                                    return;
                                                }
                                            } else {
                                                providersList.azureProviders = [];
                                                res.send(200, providersList);
                                                return;
                                            }
                                        });

                                    });

                                });

                            });

                        });
                    } else {
                        res.status(200).send([]);
                        return;
                    }
                });
            } else {
                masterUtil.getOrgs(loggedInUser, function (err, orgList) {
                    if (err) {
                        res.status(500).send('Not able to fetch Orgs.');
                        return;
                    }
                    if (orgList) {
                        AWSProvider.getAWSProvidersForOrg(orgList, function (err, providers) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            var providersList = {};
                            if (providers.length > 0) {
                                var awsProviderList = [];
                                for (var i = 0; i < providers.length; i++) {
                                    awsProviderList.push(providers[i]);
                                }
                                providersList.awsProviders = awsProviderList;
                            } else {
                                providersList.awsProviders = [];
                            }

                            openstackProvider.getopenstackProvidersForOrg(orgList, function (err, openstackProviders) {
                                if (err) {
                                    logger.error(err);
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }

                                if (openstackProviders != null) {
                                    if (openstackProviders.length > 0) {
                                        for (var i = 0; i < openstackProviders.length; i++) {
                                            openstackProviders[i].password = undefined;
                                        }
                                        providersList.openstackProviders = openstackProviders;
                                    }
                                } else {
                                    providersList.openstackProviders = [];
                                }

                                vmwareProvider.getvmwareProvidersForOrg(orgList, function (err, vmwareProviders) {
                                    if (err) {
                                        logger.error(err);
                                        res.status(500).send(errorResponses.db.error);
                                        return;
                                    }
                                    if (vmwareProviders != null) {
                                        if (vmwareProviders.length > 0) {
                                            for (var i = 0; i < vmwareProviders.length; i++) {
                                                vmwareProviders[i].password = undefined;
                                            }
                                            providersList.vmwareProviders = vmwareProviders;
                                        }
                                    } else {
                                        providersList.vmwareProviders = [];
                                    }

                                    hppubliccloudProvider.gethppubliccloudProvidersForOrg(orgList, function (err, hpCloudProviders) {
                                        if (err) {
                                            logger.error(err);
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        if (hpCloudProviders != null) {
                                            for (var i = 0; i < hpCloudProviders.length; i++) {
                                                hpCloudProviders[i]['providerType'] = hpCloudProviders[i]['providerType'].toUpperCase();
                                            }
                                            if (hpCloudProviders.length > 0) {
                                                providersList.hpPlublicCloudProviders = hpCloudProviders;
                                            }
                                        } else {
                                            providersList.hpPlublicCloudProviders = [];
                                        }

                                        azurecloudProvider.getAzureCloudProvidersForOrg(orgList, function (err, azureProviders) {
                                            if (err) {
                                                logger.error(err);
                                                res.status(500).send(errorResponses.db.error);
                                                return;
                                            }
                                            if (azureProviders != null) {
                                                for (var i = 0; i < azureProviders.length; i++) {
                                                    azureProviders[i].clientId = undefined;
                                                    azureProviders[i].clientSecret = undefined;
                                                    azureProviders[i].tenant = undefined;
                                                    azureProviders[i]['providerType'] = azureProviders[i]['providerType'].toUpperCase();
                                                }
                                                if (azureProviders.length > 0) {
                                                    providersList.azureProviders = azureProviders;
                                                    res.send(providersList);
                                                    return;
                                                }
                                            } else {
                                                providersList.azureProviders = [];
                                                res.send(200, providersList);
                                                return;
                                            }
                                        });

                                    });

                                });

                            });

                        });
                    } else {
                        res.send(200, []);
                        return;
                    }
                });
            }
        });
    });


    // List out all aws nodes.
    app.post('/aws/providers/node/list', function (req, res) {
        logger.debug("Enter List AWS Nodes: ");

        var isDefault = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey, isDefault) {
            if (isDefault) {
                var ec2 = new EC2({
                    "isDefault": true,
                    "region": req.body.region
                });
            } else {
                var ec2 = new EC2({
                    "access_key": accessKey,
                    "secret_key": secretKey,
                    "region": req.body.region
                });
            }

            ec2.listInstances(function (err, nodes) {
                if (err) {
                    logger.error("Unable to list nodes from AWS.", err);
                    // res.status(500).send("Unable to list nodes from AWS.");
                    res.status(500).send(err.message);
                    return;
                }
                logger.debug("Success to list nodes from AWS.");
                var nodeList = [];
                for (var i = 0; i < nodes.Reservations.length; i++) {
                    var instance = {
                        "instance": nodes.Reservations[i].Instances[0].InstanceId,
                        "privateIp": nodes.Reservations[i].Instances[0].PrivateIpAddress,
                        "publicIp": nodes.Reservations[i].Instances[0].PublicIpAddress,
                        "privateDnsName": nodes.Reservations[i].Instances[0].PrivateDnsName
                    };
                    nodeList.push(instance);
                }
                var nodeListLength = nodeList.length;
                logger.debug("I am in count of Total Instances", nodeListLength);
                res.send(nodeList);
            });
        }

        if (isDefault) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }


    });
    // List out all Active AWS nodes.
    app.post('/aws/providers/activenode/list', function (req, res) {
        logger.debug("Enter List Active AWS Nodes: ");

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey) {
            var ec2 = new EC2({
                "access_key": accessKey,
                "secret_key": secretKey,
                "region": req.body.region
            });

            ec2.listActiveInstances(function (err, nodes) {
                if (err) {
                    logger.debug("Unable to list nodes from AWS.", err);
                    // res.send("Unable to list nodes from AWS.", 500);
                    res.status(500).send(err.message);
                    return;
                }
                logger.debug("Success to list nodes from AWS.");
                var nodeList = [];
                for (var i = 0; i < nodes.Reservations.length; i++) {
                    var instance = {
                        "instance": nodes.Reservations[i].Instances[0].InstanceId,
                        "privateIp": nodes.Reservations[i].Instances[0].PrivateIpAddress,
                        "publicIp": nodes.Reservations[i].Instances[0].PublicIpAddress,
                        "privateDnsName": nodes.Reservations[i].Instances[0].PrivateDnsName
                    };
                    nodeList.push(instance);
                }
                var nodeListLength = nodeList.length;
                logger.debug("I am in count of Active Instances", nodeListLength);
                res.send(nodeList);
            });
        }

        if (defaultProvider) {
            makeRequest(null, null, true);
        } else if (req.body.providerId) {
            AWSProvider.getAWSProviderById(req.body.providerId, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else if (aProvider && aProvider.isDefault) {
                    makeRequest(null, null, true);
                } else if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding,
                        function (err, decryptedKeys) {
                            if (err) {
                                logger.error("Failed to decrypt accessKey or secretKey: ", err);
                                res.status(500).send("Failed to decrypt accessKey or secretKey");
                                return;
                            }
                            makeRequest(decryptedKeys[0], decryptedKeys[1], false);
                        });
                } else {
                    res.status(404).send("Provider not found");
                }
            });
        } else {
            makeRequest(req.body.accessKey, req.body.secretKey, false);
        }
    });

    app.get('/aws/dashboard/providers/:id', function (req, res) {
        var client = new rc();
        var id = req.params.id;

        var defaultProvider = (req.body.isDefault === 'true') ? true : false;

        function makeRequest(accessKey, secretKey) {
            cost.getcost(accessKey, secretKey, function (err, cost) {
                res.status(200).send(cost);
            });
        }

        if (id) {
            AWSProvider.getAWSProviderById(id, function (err, aProvider) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                if (aProvider) {
                    var keys = [];
                    keys.push(aProvider.accessKey);
                    keys.push(aProvider.secretKey);
                    cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding, function (err, decryptedKeys) {
                        if (err) {
                            logger.error("Failed to decrypt accessKey or secretKey: ", err);
                            res.status(500).send("Failed to decrypt accessKey or secretKey");
                            return;
                        }
                        makeRequest(decryptedKeys[0], decryptedKeys[1]);
                    });
                } else {
                    res.status(404).send("Provider not found");
                }
            });

        } else {
            makeRequest(req.body.accessKey, req.body.secretKey);
        }
    });
}

function trackSettingWizard(orgId, callback) {
    if (orgId.length > 0) {
        settingWizard.getSettingWizardByOrgId(orgId, function (err, settingWizards) {
            if (err) {
                logger.error('Hit getting setting wizard error', err);
                callback(err, null);
                return;
            }
            if (settingWizards.currentStep.name === 'Provider Configuration') {
                settingWizards.currentStep.nestedSteps[0].isCompleted = true;
                settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                    if (err) {
                        logger.error('Hit updating setting wizard error', err);
                        callback(err, null);
                        return;
                    }
                    callback(null, data);
                    return;
                });
            } else {
                callback(null, null);
                return;
            }
        })
    } else {
        callback(null, null);
        return;
    }
}
