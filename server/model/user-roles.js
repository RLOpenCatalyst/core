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
var logger = require('_pr/logger')(module);

var Schema = mongoose.Schema;

var RoleSchema = new Schema({
	id: Number,
	name: String,
	permissions: {
		read: Boolean,
		write: Boolean,
		execute: Boolean
	}
});

var Role = mongoose.model('roles', RoleSchema);

module.exports.createRole = function(roleName, permissionsObj, callback) {
	var roles = new Role({
		id: new Date().getTime(),
		name: roleName,
		permissions: permissionsObj
	});
	roles.save(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});

};

module.exports.createNew = function(roleData, callback) {
	var roles = new Role(roleData);
	roles.save(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});

};

module.exports.getRoleById = function(roleId, callback) {
	logger.debug('RoleID' + roleId);
	Role.find({
		id: roleId
	}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

module.exports.getRoleByName = function(roleName, callback) {
	Role.find({
		name: roleName
	}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

module.exports.getAllRoles = function(callback) {
	Role.find({}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};