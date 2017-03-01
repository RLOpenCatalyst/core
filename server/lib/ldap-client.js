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
var ldap = require('ldapjs');
var setDefaults = function(options) {
    options.host || (options.host = 'localhost');
    options.port || (options.port = '389');
    options.baseDn || (options.baseDn = 'dc=d4d-ldap,dc=relevancelab,dc=com');
    options.ou || (options.ou = '');
    options.adminUser || (options.adminUser = 'admin');
    options.adminPass || (options.adminPass = 'SomePass');
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
var Ldap = function(options) {
    logger.debug('options ==>', options);
    if (!options) {
        options = {};
    }
    options = setDefaults(options);
    var client = ldap.createClient({
        url: 'ldap://' + options.host + ':' + options.port
    });
    this.authenticate = function(username, password, callback) {
        var dnString = createDnString(username, options.baseDn, options.ou);
        client.bind(dnString, password, function(err, user) {
            if (err) {
                logger.debug("err ==> ", err);
                callback(err, null);
            } else {
                logger.debug("User String:{" + dnString + '}');
                callback(null, createDnObject(dnString));
            }
        });
    };
    this.compare = function(username, callback) {
        var dnString = createDnString(username, options.baseDn, options.ou);
        client.compare(dnString, 'sn', username, function(err, matched) {
            if (err) {
                callback(null, "false");
            } else {
                logger.debug('matched: ' + matched);
                callback(null, "true");
            }
        });
    };
    this.close = function(callback) {
        client.unbind(function(err) {
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    };
    this.createUser = function(username, password, fname, lname, callback) {
        logger.debug('Entered Create User in Ldap', username, password, fname, lname);
        var entry = {
            cn: username,
            gn: fname,
            sn: lname,
            userPassword: password,
            uid: username,
            objectclass: ['inetOrgPerson'],
        };
        var dnString = createDnString(options.adminUser, options.baseDn, options.ou);
        var self = this;
        client.bind(dnString, options.adminPass, function(err) {
            if (err) {
                self.close();
                logger.debug('Error in binding for createuser' + err);
                return;
            }
            var userDnsString = createDnString(username, options.baseDn, options.ou);
            client.add(userDnsString, entry, function(err, user) {
                self.close();
                if (err) {
                    logger.debug('err in creating user');
                    logger.debug('dn == >', err.dn);
                    logger.debug('code == >', err.code);
                    logger.debug('name == >', err.name);
                    logger.debug('message == >', err.message);
                    callback(err.message, null);
                } else {
                    logger.debug('created');
                    callback(null, 200);
                }
            });
        });
    };
}
module.exports = Ldap;
