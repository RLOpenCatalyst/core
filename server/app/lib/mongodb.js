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


var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

var canAuthConnect = true
var canSSLConnect=true
module.exports = function(options, callback) {
    logger.info(JSON.stringify(options));
    var connectionString = 'mongodb://';
    connectionString += options.host;
    connectionString += ':' + options.port;
    connectionString += '/' + options.dbName;
    connectionString += '?ssl=' + options.ssl;
    logger.info(connectionString);
    var mongooseOptions = {};
    // Enable/Disable Basic Authenti, err, errcation for DB
    if (options.enable_auth && (!options.auth_config.username || !options.auth_config.password || !options.auth_config.authenticated)) {
        logger.error(`DB Athentication is enabled with invalid credentials`);
        canAuthConnect = false
    } else if (options.enable_auth && options.auth_config.username && options.auth_config.password && options.auth_config.authenticated) {
        mongooseOptions.user = options.auth_config.username;
        mongooseOptions.pass = options.auth_config.password;
        mongooseOptions.useMongoClient = true;
        mongooseOptions.auth = {
            authSource: options.auth_config.authenticated
        };
        logger.info('MongoDB connecting with user ' + mongooseOptions.user);
        canAuthConnect = true
    }

    // Enable/Disable SSL Authentication for DB
    if (options.enable_ssl && (!options.ssl_config.CAFile || !options.ssl_config.PEMFile)) {
        logger.error(`ssl encryption is enabled with invalid keys`);
        canSSLConnect = false
    } else if (options.enable_ssl && options.ssl_config.CAFile && options.ssl_config.PEMFile) {
        var sslCa = [fs.readFileSync(path.join(options.ssl_config.CAFile))];
        var sslKey = fs.readFileSync(path.join(options.ssl_config.PEMFile));
        mongooseOptions.server = {
            ssl: true,
            sslCA: sslCa,
            sslKey: sslKey,
            sslCert:sslKey
        }
        canSSLConnect = true;
        logger.info('MongoDB connecting with ssl encryption');
    }

    var connectWithRetry = function() {
        return mongoose.connect(connectionString,mongooseOptions, function(err, res) {
          if (err) {
             console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
             setTimeout(connectWithRetry, 5000);
          }
        });
    };
    connectWithRetry();
    mongoose.Promise = require('bluebird');
    mongoose.connection.on('connected', function() {
        callback(null);
    });

};
