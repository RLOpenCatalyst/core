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
var extend = require('extend');
var defaults = {
    host: 'localhost',
    port: '27017',
    dbName: 'test'
};
module.exports = function(options, callback) {
    var def = extend({}, defaults);
    options = extend(def, options);
    logger.debug(options);
    logger.debug(defaults);
    var connectionString = 'mongodb://';
    connectionString += options.host;
    connectionString += ':' + options.port;
    connectionString += '/' + options.dbName;
    connectionString += '/?ssl=' + options.ssl;
    logger.debug(connectionString);
    var connectWithRetry = function() {
        return mongoose.connect(connectionString, function(err) {
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
