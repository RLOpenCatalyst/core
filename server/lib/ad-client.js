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


var ActiveDirectory = require('activedirectory');
var logger = require('_pr/logger')(module);

var setDefaults = function(options) {
    options.host || (options.host = 'localhost');
    options.port || (options.port = '389');
    options.baseDn || (options.baseDn = 'dc=d4d-ldap,dc=relevancelab,dc=com');
    options.ou || (options.ou = '');

    return options;
};

function createDnObject(dnString) {
    var parts = dnString.split(',');
    var obj = {};
    for (var i = 0; i < parts.length; i++) {
        var keyValue = parts[i].split('=');
        logger.debug(keyValue);
        if (obj[keyValue[0]]) {
            obj[keyValue[0]] = [].concat(obj[keyValue[0]]);
            obj[keyValue[0]].push(keyValue[1]);
        } else {
            obj[keyValue[0]] = keyValue[1];
        }
    }
    return obj;
}

function createDnString(username, baseDn, ou) {
    var str = 'cn=' + username + ',';
    if (ou) {
        str += 'ou=' + ou + ',';
    }
    str += baseDn;
    return str;
}

var ADClient = function(options) {
    logger.debug('options ==>', options);
    if (!options) {
        options = {};
    }
    options = setDefaults(options);

    var client = new ActiveDirectory({
        url: 'ldap://' + options.host + ':' + options.port,
        baseDN: options.baseDn,
    });


    this.authenticate = function(username, password, callback) {
        client.authenticate(username, password, function(err, auth) {
            if (err) {
                logger.error("err ==> ", err);
                callback(err, null);
            } else {
                logger.debug("User String:{" + dnString + '}');
                var dnString = createDnString(username, options.baseDn, options.ou);
                callback(null, createDnObject(dnString));
            }
        });

    };
}

module.exports = ADClient;
