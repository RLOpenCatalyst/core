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
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var schemaValidator = require('_pr/model/utils/schema-validator');

// File which contains ldap DB schema and DAO methods. 

var Schema = mongoose.Schema;

var LDAPUserSchema = new Schema({
    host: String,
    port: String,
    adminUser: String,
    adminPass: String,
    baseDn: String,
    ou: String
});

// Get all ldap user informations.
LDAPUserSchema.statics.getLdapUser = function(callback) {
    this.find(function(err, users) {
        if (err) {
            logger.debug("Got error while fetching userData: ", err);
            callback(err, null);
        }
        callback(null, users);
    });
};

// Save all ldap user informations.
LDAPUserSchema.statics.createNew = function(userData, callback) {
    var anUser = new this(userData);
    anUser.save(function(err, user) {
        if (err) {
            logger.debug("Got error while creating user: ", err);
            callback(err, null);
        }
        logger.debug("Creating user: ", JSON.stringify(user));
        callback(null, user);
    });
};

// Update ldap user informations.
LDAPUserSchema.statics.updateLdapUser = function(anId, userData, callback) {
    this.update({
        "_id": new ObjectId(anId),
    }, {
        $set: userData
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update user data", err);
            callback(err, null);
            return;
        }

        logger.debug("ldap user updated successfully.");
        callback(null, data);
    });
};

var LDAPUser = mongoose.model("ldapUser", LDAPUserSchema);
module.exports = LDAPUser;