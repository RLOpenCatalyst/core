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

// This script will clean up appdeploy related all data from DB.

var logger = require('_pr/logger')(module);
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var AppDeploy = require('_pr/model/app-deploy/app-deploy');
var AppData = require('_pr/model/app-deploy/app-data');

var dboptions = {
    host: appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});

AppDeploy.removeAll(function(err,appdeploys){
	if(err){
		logger.debug("Error while cleanup appdeploy: ",err);
		process.exit();
	}
	logger.debug("AppDeploy cleaned successfully..");
	AppData.removeAll(function(err,appDatas){
		if(err){
			logger.debug("Error while cleanup appdata: ",err);
			process.exit();
		}
		logger.debug("AppData cleaned successfully..");
		process.exit();
	});
});