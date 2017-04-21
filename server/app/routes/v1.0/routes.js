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


// This file act as a request mapping i.e. it will decide which request will go to which routes.


var logger = require('_pr/logger')(module);
var express = require("express");
var path = require("path");
var auth = require('./routes_authentication');
var chef = require('./routes_chef.js');
var users = require('./routes_users');
var d4dMasters = require('./routes_d4dMasters');
var organizations = require('./routes_organizations');
var projects = require('./routes_projects');
var blueprints = require('./routes_blueprints');
var instances = require('./routes_instances');
var tasks = require('./routes_tasks');
var taskStatus = require('./routes_taskstatus');
var ec2 = require('./routes_aws_ec2');
var jenkins = require('./routes_jenkins');
var openstack = require('./routes_openstack');
var hppubliccloud = require('./routes_hppubliccloud');
var azure = require('./routes_azure');
var application = require('./routes_application');
var jira = require('./routes_jira');
var provider = require('./routes_provider');
var providerCommon = require('./routes_providercommon');
var vmimage = require('./routes_vmImages');
var chefClientExecution = require('./routes_chefClientExecutionResponse');
var appConfig = require('_pr/config');
var cloudformation = require('./routes_cloudformation');
var notification = require('./routes_notification');
var globalsettings = require('./routes_globalsettings');
var tracks = require('./routes_track');
var trackType = require('./routes_trackType');
var puppet = require('./routes_puppet.js');
var appdeploy = require('./routes_appdeploy');
var nexus = require('./routes_nexus');
var vmware = require('./routes_vmware.js');
var servicenow = require('./routes_servicenow');
var appdeployPipeline = require('./routes_appdeployPipeline');
var chefFactory = require('./routes_cheffactory');
var expressServeStatic = require('serve-static');
var arm = require('./routes_arm');
var dashboardProvider = require('./routes_dashboard');
var appData = require('./routes_appdata');
var deployPermission = require('./routes_deploypermission');
var trackedInstances = require('./routes_trackedInstances');
var resources = require('./routes_resources');
var serviceStatus = require('./routes_serviceStatus');
var compositeBlueprints = require('./routes_compositeBlueprints');
var blueprintFrames = require('./routes_blueprintFrames');
var analytics = require('./routes_analytics');
var reports = require('./routes_reports')
var trendUsage = require('./routes_trendUsage');
var cors = require('cors');
var auditTrail = require('./routes_audit_trails');
var scripts = require('./routes_scripts');
var fileUpload = require('./routes_fileUpload');
var settingWizard = require('./routes_setting_wizard');
var configData = require('./routes_config_data');
var monitors = require('./routes_monitors');
var bots = require('./routes_botsOld');
var botsNew = require('./routes_botsNew');
var gitHub = require('./routes_github');
var routesCICD = require('./routes_d4dMastersCICD');
var routesDashboardCICD = require('./routes_dashboardcicd');
var routesCICDDashboardService = require('./routes_cicddashboardserver');
var notice = require('./routes_notice');
var clientAppAccess = require('./routes_clientAppAccess');
var routesResourceMap = require('./routes_resourceMap');
/*
 * @TODO
 * Change app to router in internal routes files
 */

module.exports.setRoutes = function(app) {

    app.use(cors());

    var verificationFunctions = auth.setRoutes(app);
    var sessionVerificationFunc = verificationFunctions.sessionVerificationFunc;
    var adminSessionVerificationFunc = verificationFunctions.adminSessionVerificationFunc;

    d4dMasters.setRoutes(app, sessionVerificationFunc);

    organizations.setRoutes(app, sessionVerificationFunc);

    projects.setRoutes(app, sessionVerificationFunc);

    blueprints.setRoutes(app, sessionVerificationFunc);

    instances.setRoutes(app, sessionVerificationFunc);

    chef.setRoutes(app, sessionVerificationFunc);

    users.setRoutes(app, sessionVerificationFunc);

    tasks.setRoutes(app, sessionVerificationFunc);

    taskStatus.setRoutes(app, sessionVerificationFunc);

    ec2.setRoutes(app, sessionVerificationFunc);

    jenkins.setRoutes(app, sessionVerificationFunc);

    openstack.setRoutes(app, sessionVerificationFunc);

    hppubliccloud.setRoutes(app, sessionVerificationFunc);

    azure.setRoutes(app, sessionVerificationFunc);

    vmware.setRoutes(app, sessionVerificationFunc);

    application.setRoutes(app, sessionVerificationFunc);

    jira.setRoutes(app, sessionVerificationFunc);

    provider.setRoutes(app, sessionVerificationFunc);

    providerCommon.setRoutes(app, sessionVerificationFunc);

    vmimage.setRoutes(app, sessionVerificationFunc);

    chefClientExecution.setRoutes(app);

    cloudformation.setRoutes(app, sessionVerificationFunc);

    globalsettings.setRoutes(app, sessionVerificationFunc);

    tracks.setRoutes(app, sessionVerificationFunc);

    trackType.setRoutes(app, sessionVerificationFunc);

    puppet.setRoutes(app, sessionVerificationFunc);

    appdeploy.setRoutes(app, sessionVerificationFunc);

    nexus.setRoutes(app, sessionVerificationFunc);

    servicenow.setRoutes(app, sessionVerificationFunc);

    appdeployPipeline.setRoutes(app, sessionVerificationFunc);

    chefFactory.setRoutes(app, sessionVerificationFunc);

    dashboardProvider.setRoutes(app, sessionVerificationFunc);

    arm.setRoutes(app, sessionVerificationFunc);

    dashboardProvider.setRoutes(app, sessionVerificationFunc);

    appData.setRoutes(app, sessionVerificationFunc);

    deployPermission.setRoutes(app, sessionVerificationFunc);

    trackedInstances.setRoutes(app, sessionVerificationFunc);

    resources.setRoutes(app, sessionVerificationFunc);

    serviceStatus.setRoutes(app, sessionVerificationFunc);

    auditTrail.setRoutes(app, sessionVerificationFunc);

    compositeBlueprints.setRoutes(app, sessionVerificationFunc);

    blueprintFrames.setRoutes(app, sessionVerificationFunc);
    
    trendUsage.setRoutes(app, sessionVerificationFunc);

    analytics.setRoutes(app, sessionVerificationFunc);

    reports.setRoutes(app, sessionVerificationFunc);

    scripts.setRoutes(app, sessionVerificationFunc);

    fileUpload.setRoutes(app, sessionVerificationFunc);

    settingWizard.setRoutes(app, sessionVerificationFunc);
    
    monitors.setRoutes(app, sessionVerificationFunc);

    configData.setRoutes(app, sessionVerificationFunc);

    bots.setRoutes(app, sessionVerificationFunc);

    gitHub.setRoutes(app, sessionVerificationFunc);

    routesCICD.setRoutes(app, sessionVerificationFunc);

    routesResourceMap.setRoutes(app, sessionVerificationFunc);

    botsNew.setRoutes(app, sessionVerificationFunc);

    routesDashboardCICD.setRoutes(app,sessionVerificationFunc);

    routesCICDDashboardService.setRoutes(app,sessionVerificationFunc);

    notice.setRoutes(app,sessionVerificationFunc);
    clientAppAccess.setRoutes(app,sessionVerificationFunc);

    app.get('/', function(req, res) {
        res.redirect('/cat3');
    });

    //for public html files
    app.use('/public', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/htmls/public')));
    app.use('/cat3', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/cat3')));

    app.get('/public/login.html', function(req, res, next) {
        if (req.session && req.session.user) {
            res.redirect('/');
        } else {
            next();
        }
    });

    // for private html files
    app.all('/private/*', function(req, res, next) {
        if (req.session && req.session.user) {
            if (req.session.user.authorizedfiles) {
                var authfiles = req.session.user.authorizedfiles.split(','); //To be moved to login page an hold a static variable.
                authfiles += ',index.html,settings.html,design.html,Tracker.html,noaccess.html'
                if (req.originalUrl.indexOf('.html') > 0) //its a html file.
                {
                    var urlpart = req.originalUrl.split('/');
                    if (authfiles.indexOf(urlpart[urlpart.length - 1]) < 0 && req.session.user.cn != 'sd1') {
                        logger.debug('not authorized');
                    } else {
                        logger.debug('Authorized');
                    }

                }
            }
            logger.debug('req received ' + req.originalUrl);
            next();
        } else {
            res.redirect('/public/login.html');
        }
    });
    app.use('/private', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/htmls/private')));
    app.use('/cat3', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/cat3')));


    // for upload dir
    if (appConfig.staticUploadDir) {
        app.all('/uploads/*', function(req, res, next) {
            if (req.session && req.session.user) {
                next();
            } else {
                res.send(403);

            }
        });

        app.use('/uploads', expressServeStatic(appConfig.staticUploadDir));
    }
    // for notification
    notification.setRoutes(app);

    app.use(errorHandler);

    function errorHandler(err, req, res, next) {
        if(err) {
            logger.error(err);

            var errorResponse = {
                'status': err.status,
                'message': err.message,
                'errors': []
            };
            if ('errors' in err) {
                for(var i = 0; i < err.errors.length; i++) {
                    if('messages' in err.errors[i])
                        errorResponse.errors.push(err.errors[i].messages);
                }
            }
            return res.status(err.status).send(errorResponse);
        }
    }
}
