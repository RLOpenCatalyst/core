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
var vmware = require('./routes_vmware.js');
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
/*
* @TODO
* Change app to router in internal routes files 
*/


module.exports.setRoutes = function(router) {

	
	var verificationFunctions = auth.setRoutes(router);
	var sessionVerificationFunc = verificationFunctions.sessionVerificationFunc;
	var adminSessionVerificationFunc = verificationFunctions.adminSessionVerificationFunc;

	d4dMasters.setRoutes(router, sessionVerificationFunc);

	organizations.setRoutes(router, sessionVerificationFunc);

	projects.setRoutes(router, sessionVerificationFunc);

	blueprints.setRoutes(router, sessionVerificationFunc);

	instances.setRoutes(router, sessionVerificationFunc);

	chef.setRoutes(router, sessionVerificationFunc);

	users.setRoutes(router, sessionVerificationFunc);

	tasks.setRoutes(router, sessionVerificationFunc);

	taskStatus.setRoutes(router, sessionVerificationFunc);

	ec2.setRoutes(router, sessionVerificationFunc);

	jenkins.setRoutes(router, sessionVerificationFunc);

	openstack.setRoutes(router, sessionVerificationFunc);

	hppubliccloud.setRoutes(router, sessionVerificationFunc);

	azure.setRoutes(router, sessionVerificationFunc);

	vmware.setRoutes(router, sessionVerificationFunc);

	application.setRoutes(router, sessionVerificationFunc);

	jira.setRoutes(router, sessionVerificationFunc);

	provider.setRoutes(router, sessionVerificationFunc);
	providerCommon.setRoutes(router, sessionVerificationFunc);

	vmimage.setRoutes(router, sessionVerificationFunc);

	chefClientExecution.setRoutes(router);

	cloudformation.setRoutes(router, sessionVerificationFunc);

	globalsettings.setRoutes(router, sessionVerificationFunc);

	tracks.setRoutes(router, sessionVerificationFunc);

	trackType.setRoutes(router, sessionVerificationFunc);

	puppet.setRoutes(router, sessionVerificationFunc);

	appdeploy.setRoutes(router, sessionVerificationFunc);

	nexus.setRoutes(router, sessionVerificationFunc);

	servicenow.setRoutes(router, sessionVerificationFunc);

	appdeployPipeline.setRoutes(router, sessionVerificationFunc);

	chefFactory.setRoutes(router, sessionVerificationFunc);

	dashboardProvider.setRoutes(router, sessionVerificationFunc);

	arm.setRoutes(router, sessionVerificationFunc);

	dashboardProvider.setRoutes(router, sessionVerificationFunc);

	appData.setRoutes(router, sessionVerificationFunc);

	deployPermission.setRoutes(router, sessionVerificationFunc);

	trackedInstances.setRoutes(router, sessionVerificationFunc);

	router.get('/', function(req, res) {
		res.redirect('/private/index.html');
	});

	//for public html files
	router.use('/public', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/htmls/public')));

	router.get('/public/login.html', function(req, res, next) {
		if (req.session && req.session.user) {
			res.redirect('/');
		} else {
			next();
		}
	})

	// for private html files
	router.all('/private/*', function(req, res, next) {
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
	router.use('/private', expressServeStatic(path.join(path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))), 'client/htmls/private')));


	// for upload dir
	if (appConfig.staticUploadDir) {
		router.all('/uploads/*', function(req, res, next) {
			if (req.session && req.session.user) {
				next();
			} else {
				res.send(403);

			}
		});

		router.use('/uploads', expressServeStatic(appConfig.staticUploadDir));
	}
	// for notification
	notification.setRoutes(router);

	router.use(errorHandler);

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
					if('message' in err.errors[i])
						errorResponse.errors.push(err.errors[i].messages);
				}
			}

			return res.status(err.status).send(errorResponse);
		}
	}
}
