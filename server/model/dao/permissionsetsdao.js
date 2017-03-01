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


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var schemaValidator = require('./schema-validator');



var Schema = mongoose.Schema;

var permissionsetsschema = new Schema({
    roleid: {
        type: String
    },
    rolename: {
        type: String
    },
    permissions: [{
        category: {
            type: String
        },
        type: {
            type: String
        },
        access: [{
            type: String
        }]
    }]
});

var Permissionsets = mongoose.model('permissionsets', permissionsetsschema);

var PermissionsetsDao = function() {
    this.getPermissionSet = function(roles, callback) {
        logger.debug('Entering getPermissionSet. roles rcvd:' + roles);
        roles = roles.split(',');
        Permissionsets.find({
            rolename: {
                $in: roles
            }
        }, function(err, data) {
            if (!err) {
                logger.debug('Exiting getPermissionSet');
                callback(null, data);
            } else {
                logger.debug('Permissionsets Err : ' + err);
                logger.debug('Exiting on error getPermissionSet');
                callback(err, null);
                return;
            }
        });
    };

    // Save all permission informations.
    this.createNew = function(permissionData, callback) {
        var permission = new Permissionsets(permissionData);
        permission.save(function(err, permissionData) {
            if (err) {
                logger.debug("Got error while creating permission: ", err);
                callback(err, null);
            }
            if (permissionData) {
                logger.debug("Created permission: ");
                callback(null, permissionData);
            }
        });
    };

    // Get all permission informations.
    this.listPermissionSets = function(callback) {
        var that = this;
        Permissionsets.find(function(err, permissionData) {
            if (err) {
                logger.debug("Got error while getting permission: ", err);
                callback(err, null);
            }
            logger.debug("get permission: ");
            callback(null, permissionData);
        });
    };

};

module.exports = new PermissionsetsDao();
