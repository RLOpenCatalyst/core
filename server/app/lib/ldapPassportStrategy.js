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
var util = require('util'),
    Strategy = require('passport-strategy'),
    LdapClient = require('./ldap-client.js');

var LDAPUser = require('../model/ldap-user/ldap-user.js');

var setDefaults = function(options) {
    options.usernameField || (options.usernameField = 'username');
    options.passwordField || (options.passwordField = 'password');
    options.host || (options.host = 'localhost');
    options.port || (options.port = '389');
    options.baseDn || (options.baseDn = '');
    options.ou || (options.ou = '');
    return options;
};


function LDAPPassportstrategy(opts) {
    Strategy.call(this);
    this.name = 'ldap-custom-auth';
    opts = setDefaults(opts);
    this.getOptions = function() { // need to find a better way
        return opts;
    };
}

util.inherits(LDAPPassportstrategy, Strategy);

LDAPPassportstrategy.prototype.authenticate = function(req, options) {
    var self = this;
    var opts = this.getOptions();
    logger.debug(opts);
    var ldapClient = new LdapClient({
        host: opts.host,
        port: opts.port,
        baseDn: opts.baseDn,
        ou: opts.ou
    });
    logger.debug(req.body);
    var username = req.body[opts.usernameField];
    var password = req.body[opts.passwordField];

    if (!(username && password)) {
        return self.fail({
            message: 'Missing credentials'
        }, 400);
    };

    ldapClient.authenticate(username, password, function(err, userObj) {
        if (err) {
            return self.fail({
                message: 'Invalid username/password'
            }, 401);
        }
        ldapClient.close();
        return self.success(userObj);
    });

};

module.exports = LDAPPassportstrategy;
