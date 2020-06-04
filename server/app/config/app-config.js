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

var pathExtra = require('path-extra');
var mkdirp = require('mkdirp');
var fs = require('fs');
var currentDirectory = __dirname;
var path = require('path');
var logger = require('_pr/logger')(module);


var configJson;
try {
    configJson = fs.readFileSync(currentDirectory + '/catalyst-config.json', {
        'encoding': 'utf8'
    });
} catch (err) {
    logger.error(err);
    configJson = null;
    throw err;
}

var appUrlsConfig;
try {
    appUrlsConfig = fs.readFileSync(currentDirectory + '/appurls-config.json', {
        'encoding': 'utf8'
    });

} catch (err) {
    logger.error(err);
    appUrlsConfig = null;
}

var catalystConstants;
try {
    catalystConstants = fs.readFileSync(currentDirectory + '/catalyst-constants.json', {
        'encoding': 'utf8'
    });

} catch (err) {
    logger.error(err);
    catalystConstants = null;
}

if (configJson) {
    var config = JSON.parse(configJson);
    //logger.debug(config);
}

if (appUrlsConfig) {
    appUrlsConfig = JSON.parse(appUrlsConfig);
}

if(catalystConstants) {
    catalystConstants = JSON.parse(catalystConstants);
}

config.appUrls = appUrlsConfig.appUrls;
config.providerTypes = catalystConstants.providerTypes;
config.catalystEntityTypes = catalystConstants.catalystEntityTypes;

//creating path
mkdirp.sync(config.catalystHome);
mkdirp.sync(config.instancePemFilesDir);
mkdirp.sync(config.tempDir);
mkdirp.sync(config.chef.cookbooksDir);
mkdirp.sync(config.scriptDir);

var chefRepoLocation = mkdirp.sync(config.chef.chefReposLocation);
logger.debug('chef repo location ==>', config.chef.chefReposLocation);
config.user = "superadmin"


module.exports = config;