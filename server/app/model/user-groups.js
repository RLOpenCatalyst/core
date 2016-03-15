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

var Schema = mongoose.Schema;

var GroupSchema = new Schema({
	id: Number,
	name: String
});

var Group = mongoose.model('groups', GroupSchema);

module.exports.createGroup = function(groupName, callback) {
	var group = new Group({
		id: new Date().getTime(),
		name: groupName
	});
	group.save(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});

};

module.exports.getGroupById = function(groupId, callback) {
	Group.find({
		id: groupId
	}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

module.exports.getGroupByName = function(groupName, callback) {
	Group.find({
		name: groupName
	}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

module.exports.getAllGroups = function(callback) {
	Group.find({}, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};