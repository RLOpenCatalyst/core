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



// This file act as a Controller which contains dashboard related all end points.
var logger = require('_pr/logger')(module);
var EC2 = require('_pr/lib/ec2.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var azurecloudProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var blueprints = require('_pr/model/dao/blueprints');
var instances = require('_pr/model/classes/instance/instance');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var usersDao = require('_pr/model/users.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');

var dashboardData = require('_pr/lib/utils/dashboardUtil.js');

var providersdashboard = require('_pr/model/dashboard/dashboardinstances.js');
//var dashboardmanagedInstances = require('../model/dashboard/dashboardmanagedinstances.js');
var dashboardcosts = require('_pr/model/dashboard/dashboardcosts.js');


/*var dashboardusages = require('../model/dashboard/dashboardusages.js');
var dashboardmanagedInstances = require('../model/dashboard/dashboardmanagedinstances.js');
var dashboardcosts = require('../model/dashboard/dashboardcosts.js');
var dashboardusages = require('../model/dashboard/dashboardusages.js');

var dashboardbuild = require('../model/dashboard/dashboardbuild.js');
var dashboardbuildpassed = require('../model/dashboard/dashboardbuildpassed.js');
var dashboardbuilddeployed = require('../model/dashboard/dashboardbuilddeployed.js');

var dashboarduptime = require('../model/dashboard/dashboarduptime.js');

var dashboardvmwareinstances = require('../model/dashboard/dashboardvmwareinstances.js');
var dashboardawsinstances = require('../model/dashboard/dashboardawsinstances.js');
var dashboardazureinstances = require('../model/dashboard/dashboardazureinstances.js');
var dashboardopenstackinstances = require('../model/dashboard/dashboardopenstackinstances.js');

var dashboarddailytrends = require('../model/dashboard/dashboarddailytrends.js');
var dashboardalerts = require('../model/dashboard/dashboardalerts.js');*/

var dashboardlandings = require('_pr/model/dashboard/dashboardlandings.js');



var instancesDao = require('_pr/model/classes/instance/instance');
var crontab = require('node-crontab');
var CW = require('_pr/lib/cloudwatch.js');
module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/dashboard/providers/*", sessionVerificationFunc);

    app.post('/dashboard/providers/dashboardlanding', function(req, res) {
        dashboardlandings.getLandingDataInfo(function(err, landingData) {
            if (err) {
                res.send(500, errorResponses.db.error);
                return;
            }

            if (landingData && landingData.length) {

                landingData[0].jenkinsReferenceValue = req.body.jenkinsReferenceValue;
                landingData[0].jobsListValue = req.body.jobsListValue;
                
                landingData[0].save(function(err, landingDashboarddata) {
                    if (err) {
                        res.send(500, "landingData Already Exist.");
                        return;
                    }
                    if (landingDashboarddata) {
                        res.send(200, landingDashboarddata);
                        return;
                    }
                });
            } else {
                dashboardlandings.createNew(req.body, function(err, landingDashboarddata) {
                    if (err) {
                        res.send(500, "Landing Data Already Exist.");
                        return;
                    }
                    if (landingDashboarddata) {
                        logger.debug("dashboarddashboarddata: ",landingDashboarddata);
                        res.send(200, landingDashboarddata);
                        return;
                    }
                });
            }
        });
    });

    app.get('/dashboard/providers/dashboardlanding', function(req, res) {
        dashboardlandings.getLandingDataInfo(function(err, dashboardLandingData) {
            if (err) {
                res.send(500, errorResponses.db.error);
                return;
            }
            if (dashboardLandingData) {
                res.send(200, dashboardLandingData);
                return;
            }
        });
    });

    app.post('/dashboard/providers/dashboardmongopush', function(req, res) {
        //logger.debug(req.body.managedinstancesCount);
        logger.debug(req.body.averageUsagesCount);
        /*dashboardmanagedInstances.createNew(req.body.managedinstancesCount, function(err, dashboardmanagedinstancesdata) {
            if (err) {
                res.send(403, "dashboard managedinstances Data Already Exist.");
                return;
            }
            if (dashboardmanagedinstancesdata) {
                logger.debug("dashboardmanagedinstances:"+dashboardmanagedinstancesdata);
                res.send(200, dashboardmanagedinstancesdata);
                return;
            }
        });*/
        dashboardusages.createNew(req.body.averageUsagesCount, function(err, dashboardusagesdata) {
            if (err) {
                res.send(403, "dashboard dashboardusagesdata Data Already Exist.");
                return;
            }
            if (dashboardusagesdata) {
                logger.debug("dashboardusagesdata:",dashboardusagesdata);
                res.send(200, dashboardusagesdata);
                return;
            }
        });
        dashboardbuild.createNew(req.body.totalbuildsCount, function(err, dashboardbuilddata) {
            if (err) {
                res.send(403, "dashboard dashboardbuild Data Already Exist.");
                return;
            }
            if (dashboardbuild) {
                logger.debug("dashboardbuild: ",dashboardbuild);
                res.send(200, dashboardbuild);
                return;
            }
        });
        dashboardbuildpassed.createNew(req.body.totalpassedbuildsCount, function(err, dashboardbuildpasseddata) {
            if (err) {
                res.send(403, "dashboard dashboardbuildpassed Data Already Exist.");
                return;
            }
            if (dashboardbuildpassed) {
                logger.debug("dashboardbuildpassed: ",dashboardbuildpassed);
                res.send(200, dashboardbuildpassed);
                return;
            }
        });
        dashboardbuilddeployed.createNew(req.body.totaldeployedbuildsCount, function(err, dashboardbuilddeployeddata) {
            if (err) {
                res.send(403, "dashboard dashboardbuilddeployed Data Already Exist.");
                return;
            }
            if (dashboardbuilddeployed) {
                logger.debug("dashboardbuilddeployed: ",dashboardbuilddeployed);
                res.send(200, dashboardbuilddeployed);
                return;
            }
        });
        dashboarduptime.createNew(req.body.totaluptimeCount, function(err, dashboarduptimedata) {
            if (err) {
                res.send(403, "dashboard dashboarduptime Data Already Exist.");
                return;
            }
            if (dashboarduptimedata) {
                logger.debug("dashboarduptime: ",dashboarduptimedata);
                res.send(200, dashboarduptimedata);
                return;
            }
        });



        dashboardvmwareinstances.createNew(req.body.vmwareinstancesCount, function(err, dashboardvmwareinstancesdata) {
            if (err) {
                res.send(403, "dashboard vmware Data Already Exist.");
                return;
            }
            if (dashboardvmwareinstancesdata) {
                logger.debug("dashboardvmware:",dashboardvmwareinstancesdata);
                res.send(200, dashboardvmwareinstancesdata);
                return;
            }
        });
        dashboardawsinstances.createNew(req.body.awsinstancesCount, function(err, dashboardawsinstancesdata) {
            if (err) {
                res.send(403, "dashboaraws Data Already Exist.");
                return;
            }
            if (dashboardawsinstancesdata) {
                logger.debug("dashboardaws:",dashboardawsinstancesdata);
                res.send(200, dashboardawsinstancesdata);
                return;
            }
        });
        dashboardazureinstances.createNew(req.body.azureinstancesCount, function(err, dashboardazureinstancesdata) {
            if (err) {
                res.send(403, "dashboardazure Data Already Exist.");
                return;
            }
            if (dashboardazureinstancesdata) {
                logger.debug("dashboardazure:",dashboardazureinstancesdata);
                res.send(200, dashboardazureinstancesdata);
                return;
            }
        });
        dashboardopenstackinstances.createNew(req.body.openstackinstancesCount, function(err, dashboardopenstackinstancesdata) {
            if (err) {
                res.send(403, "dashboard openstack Data Already Exist.");
                return;
            }
            if (dashboardopenstackinstancesdata) {
                logger.debug("dashboard openstack:",dashboardopenstackinstancesdata);
                res.send(200, dashboardopenstackinstancesdata);
                return;
            }
        });




        dashboarddailytrends.createNew(req.body.dailytrendsCount, function(err, dashboarddailytrendsdata) {
            if (err) {
                res.send(403, "dashboarddailytrends Data Already Exist.");
                return;
            }
            if (dashboarddailytrendsdata) {
                logger.debug("dashboarddailytrends: ",dashboarddailytrendsdata);
                res.send(200, dashboarddailytrendsdata);
                return;
            }
        });
        dashboardalerts.createNew(req.body.alertsCount, function(err, dashboardalertsdata) {
            if (err) {
                res.send(403, "dashboardalerts Data Already Exist.");
                return;
            }
            if (dashboardalertsdata) {
                logger.debug("dashboardalerts: ",dashboardalertsdata);
                res.send(200, dashboardalertsdata);
                return;
            }
        });

    });
    //API to get totalinstances count for dashboard.
    app.get('/dashboard/providers/totalinstances', function(req, res) {
        providersdashboard.getLatestProviderInfo(function(err, providerDataLatest) {
            if (err) {
                return;
            }
            if (providerDataLatest) {
                logger.debug("I am in latest count of totalinstances : " , providerDataLatest);
                res.send(200, providerDataLatest);
                return;
            }
        });
    });
    //API to get totalmanagedinstances count for dashboard.
    app.get('/dashboard/providers/totalmanagedinstances', function(req, res) {
        instancesDao.getAllInstances(function(err, instances) {
            if (err) {
                logger.debug("Error while getElementBytting instance!");
            }
            if(instances){
                logger.debug("I am in count of total managed instances: ",instances.length);
                res.send(200, instances.length);
            }
        });
        /*dashboardmanagedInstances.getLatestManagedInstancesInfo(function(err, managedInstancesDataLatest) {
            if (err) {
                return;
            }
            if (managedInstancesDataLatest) {
                logger.debug("I am in latest count of totalinstances : " + managedInstancesDataLatest);
                res.send(200, managedInstancesDataLatest);
                return;
            }
        });*/
    });
    //API to get totalcost count for dashboard.
    app.get('/dashboard/providers/totalcosts', function(req, res) {
        dashboardcosts.getLatestCostInfo(function(err, costsDataLatest) {
            if (err) {
                return;
            }
            if (costsDataLatest) {
                logger.debug("I am in latest count of costdata : " , costsDataLatest);
                res.send(200, costsDataLatest);
                return;
            }
        });
    });
    //API to get totalusages count for dashboard.
    app.get('/dashboard/providers/totalusages', function(req, res) {
        dashboardusages.getLatestusageInfo(function(err, usagesDataLatest) {
            if (err) {
                return;
            }
            if (usagesDataLatest) {
                logger.debug("I am in latest count of usagesData : " , usagesDataLatest);
                res.send(200, usagesDataLatest);
                return;
            }
        });
    });
    //API to get totalbuilds count for dashboard.
    app.get('/dashboard/providers/totalbuilds', function(req, res) {
        dashboardbuild.getLatesttotalbuildInfo(function(err, totalbuildsDataLatest) {
            if (err) {
                return;
            }
            if (totalbuildsDataLatest) {
                logger.debug("I am in latest count of totalbuildsData : " , totalbuildsDataLatest);
                res.send(200, totalbuildsDataLatest);
                return;
            }
        });
    });
    //API to get totalbuildspassed count for dashboard.
    app.get('/dashboard/providers/totalbuildspassed', function(req, res) {
        dashboardbuildpassed.getLatestpassedbuildInfo(function(err, totalbuildspassedDataLatest) {
            if (err) {
                return;
            }
            if (totalbuildspassedDataLatest) {
                logger.debug("I am in latest count of totalbuildspassedData : " , totalbuildspassedDataLatest);
                res.send(200, totalbuildspassedDataLatest);
                return;
            }
        });
    });
    //API to get totalbuildsdeployed count for dashboard.
    app.get('/dashboard/providers/totalbuildsdeployed', function(req, res) {
        dashboardbuilddeployed.getLatestdeployedbuildInfo(function(err, totalbuildsdeployedDataLatest) {
            if (err) {
                return;
            }
            if (totalbuildsdeployedDataLatest) {
                logger.debug("I am in latest count of totalbuildsdeployedData : " , totalbuildsdeployedDataLatest);
                res.send(200, totalbuildsdeployedDataLatest);
                return;
            }
        });
    });
    //API to get totaluptime count for dashboard.
    app.get('/dashboard/providers/totaluptime', function(req, res) {
        dashboarduptime.getLatestuptimeInfo(function(err, totaluptimeDataLatest) {
            if (err) {
                return;
            }
            if (totaluptimeDataLatest) {
                logger.debug("I am in latest count of totaluptimeData : " , totaluptimeDataLatest);
                res.send(200, totaluptimeDataLatest);
                return;
            }
        });
    });
    //API to get totalvmwareinstances count for dashboard.
    app.get('/dashboard/providers/totalvmwareinstances', function(req, res) {
        dashboardvmwareinstances.getLatestvmwareInstancesInfo(function(err, totalvmwareinstancesDataLatest) {
            if (err) {
                return;
            }
            if (totalvmwareinstancesDataLatest) {
                logger.debug("I am in latest count of totalvmwareinstancesData : " , totalvmwareinstancesDataLatest);
                res.send(200, totalvmwareinstancesDataLatest);
                return;
            }
        });
    });
    //API to get totalawsinstances count for dashboard.
    app.get('/dashboard/providers/totalawsinstances', function(req, res) {
        dashboardawsinstances.getLatestawsInstancesInfo(function(err, totalawsinstancesDataLatest) {
            if (err) {
                return;
            }
            if (totalawsinstancesDataLatest) {
                logger.debug("I am in latest count of totalawsinstancesData : " , totalawsinstancesDataLatest);
                res.send(200, totalawsinstancesDataLatest);
                return;
            }
        });
    });
    //API to get totalazureinstances count for dashboard.
    app.get('/dashboard/providers/totalazureinstances', function(req, res) {
        dashboardazureinstances.getLatestazureInstancesInfo(function(err, totalazureinstancesDataLatest) {
            if (err) {
                return;
            }
            if (totalazureinstancesDataLatest) {
                logger.debug("I am in latest count of totalazureinstancesData : " , totalazureinstancesDataLatest);
                res.send(200, totalazureinstancesDataLatest);
                return;
            }
        });
    });
    //API to get totalopenstackinstances count for dashboard.
    app.get('/dashboard/providers/totalopenstackinstances', function(req, res) {
        dashboardopenstackinstances.getLatestopenstackInstancesInfo(function(err, totalopenstackinstancesDataLatest) {
            if (err) {
                return;
            }
            if (totalopenstackinstancesDataLatest) {
                logger.debug("I am in latest count of totalopenstackinstancesData : " , totalopenstackinstancesDataLatest);
                res.send(200, totalopenstackinstancesDataLatest);
                return;
            }
        });
    });
    //API to get totaldailytrends count for dashboard.
    app.get('/dashboard/providers/totaldailytrends', function(req, res) {
        dashboarddailytrends.getLatestdailytrendInfo(function(err, totaldailytrendsDataLatest) {
            if (err) {
                return;
            }
            if (totaldailytrendsDataLatest) {
                logger.debug("I am in latest count of totaldailytrendsData : " , totaldailytrendsDataLatest);
                res.send(200, totaldailytrendsDataLatest);
                return;
            }
        });
    });
    //API to get totalAlerts count for dashboard.
    app.get('/dashboard/providers/totalalerts', function(req, res) {
        dashboardalerts.getLatestalertInfo(function(err, totalalertsDataLatest) {
            if (err) {
                return;
            }
            if (totalalertsDataLatest) {
                logger.debug("I am in latest count of totalalertsData : " , totalalertsDataLatest);
                res.send(200, totalalertsDataLatest);
                return;
            }
        });
    });
}