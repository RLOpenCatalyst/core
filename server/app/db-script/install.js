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


// This file is like a installer which will install global settings into DB.

var logger = require('_pr/logger')(module);
var GlobalSettings = require('_pr/model/global-settings/global-settings');
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var d4dModel = require('../model/d4dmasters/d4dmastersmodel.js');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var permissionsetsdao = require('_pr/model/dao/permissionsetsdao.js');
var userRole = require('_pr/model/user-roles.js');
var LDAPUser = require('../model/ldap-user/ldap-user.js');

var dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        throw new Error(err);
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});

// to modify ldap values.
    var modifyLdap = false;

    LDAPUser.getLdapUser(function(err, data) {
        if (err) {
            logger.error("Failed to get ldapUser: ", err);
            return;
        }
        if (!data.length) {
            // Create Ldap User
            // provide ldap information here.
            var ldapUser = {
                host: '',
                port: 0,
                adminUser: '',
                adminPass: '',
                baseDn: '',
                ou: ''
            };
            LDAPUser.createNew(ldapUser, function(err, data) {
                if (err) {
                    logger.error("Failed to save ldapUser: ", err);
                    return;
                }
                logger.debug("Ldap User saved successfully.");
            });
            // End Create Ldap User
        } else if (modifyLdap) {
            
            // Update Ldap User

            // provide ldap information here.
            var ldapUser = {
                host: '',
                port: 0,
                adminUser: '',
                adminPass: '',
                baseDn: '',
                ou: ''
            };
            LDAPUser.getLdapUser(function(err, data) {
                if (err) {
                    logger.error("Failed to get ldapUser: ", err);
                    return;
                }
                if (data.length) {
                    LDAPUser.updateLdapUser(data[0]._id,ldapUser, function(err, data) {
                        if (err) {
                            logger.error("Failed to update ldapUser: ", err);
                            return;
                        }
                        logger.debug("Ldap User updated successfully.");
                    });
                }else{
                    logger.info("No ldap user found to update.");
                }
            });

            // End Update Ldap User
        } else {
            logger.info("LDAP User already exist.If you want to modify then please change the modifyLdap flag value to true and try.");
        }
    });