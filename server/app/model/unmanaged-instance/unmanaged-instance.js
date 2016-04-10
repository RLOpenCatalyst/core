var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
var ApiUtils = require('_pr/lib/utils/apiUtil.js');
var Schema = mongoose.Schema;

var UnmanagedInstanceSchema = new Schema({
	orgId: {
		type: String,
		required: true,
		trim: true,
	},
	providerId: {
		type: String,
		required: false,
		trim: true
	},
	projectId: String,
	projectName: String,
	environmentId: String,
	environmentName: String,
	providerType: String,
	providerData: Schema.Types.Mixed,
	platformId: String,
	ip: {
		type: String,
		index: true,
		trim: true
	},
	os: String,
	state: String,
	tags: Schema.Types.Mixed,
});
UnmanagedInstanceSchema.plugin(mongoosePaginate);

UnmanagedInstanceSchema.statics.createNew = function createNew(data, callback) {
	var self = this;
	var unmanagedInstance = new self(data);
	unmanagedInstance.save(function(err, data) {
		if (err) {
			logger.error('unable to save unmanaged instance', err);
			if (typeof callback == 'function') {
				callback(err, null);
			}
			return;
		}
		if (typeof callback == 'function') {
			callback(null, unmanagedInstance)
		}

	});
};
//Added By Durgesh
UnmanagedInstanceSchema.statics.updateInstance = function updateInstance(instanceId,data,callBack) {
	this.update({
		"platformId": instanceId,
	}, {
		$set: {tags:data}
	}, function(err, data) {
		if (err) {
			logger.error("Failed to update Unmanaged Instance data", err);
			if (typeof callBack == 'function') {
				callBack(err, null);
			}
			return;
		}
		if (typeof callBack == 'function') {
			callBack(null, data);
		}
	});
};
//End By Durgesh

UnmanagedInstanceSchema.statics.getByOrgProviderId = function(opts, callback) {

	this.find({
		"orgId": opts.orgId,
		"providerId": opts.providerId
	}, function(err, instances) {
		if (err) {
			logger.error("Failed getByOrgProviderId (%s)", opts, err);
			callback(err, null);
			return;
		}

		callback(null, instances);

	});
};

UnmanagedInstanceSchema.statics.getInstanceTagByOrgProviderId = function(opts,callback) {
	this.find({"orgId": opts.orgId,
		"providerId": opts.providerId
	},{tags:1, _id:0}, function(err, instancesTag) {
		if (err) {
			logger.error("Failed getInstanceTagByOrgProviderId (%s)", opts, err);
			callback(err, null);
			return;
		}
		callback(null, instancesTag);

	});
};


UnmanagedInstanceSchema.statics.getByProviderId = function(jsonData, callback) {
	var databaseReq={};
	jsonData['searchColumns']=['ip','platformId'];
	ApiUtils.databaseUtil(jsonData,function(err,databaseCall){
		if(err){
			process.nextTick(function() {
				callback(null, []);
			});
			return;
		}
		databaseReq=databaseCall;
	});
		this.paginate(databaseReq.queryObj, databaseReq.options, function(err, instances) {
			if (err) {
				logger.error("Failed getByOrgProviderId (%s)", err);
				callback(err, null);
				return;
			}
			callback(null, instances);
		});
};
//End By Durgesh

UnmanagedInstanceSchema.statics.getInstanceTagByProviderId = function(providerIds, callback) {
	if (!(providerIds && providerIds.length)) {
		process.nextTick(function() {
			callback({
				message: "Invalid providerId"
			});
		});
		return;
	}
	var queryObj = {};
	queryObj._id = {
		$in: providerIds
	}
	this.find(queryObj, function(err, instances) {
		if (err) {
			logger.error("Failed getInstanceTagByProviderId (%s)", err);
			callback(err, null);
			return;
		}

		callback(null, instances);

	}).limit(jsonData.record_Limit).skip(jsonData.record_Skip).sort({state:1});
};









UnmanagedInstanceSchema.statics.getByIds = function(providerIds, callback) {
	if (!(providerIds && providerIds.length)) {
		process.nextTick(function() {
			callback(null, []);
		});
		return;
	}
	var queryObj = {};
	queryObj._id = {
		$in: providerIds
	}

	this.find(queryObj, function(err, instances) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		callback(null, instances);
	});
};



var UnmanagedInstance = mongoose.model('unmanagedinstances', UnmanagedInstanceSchema);



module.exports = UnmanagedInstance;