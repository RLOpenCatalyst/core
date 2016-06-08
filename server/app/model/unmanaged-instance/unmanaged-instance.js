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
	orgName: String,
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
	usage: Schema.Types.Mixed,
	cost: Schema.Types.Mixed
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

UnmanagedInstanceSchema.statics.getAll = function getAll(query, callback) {
	this.find(query,
		function(err, instances) {
			if (err) {
				return callback(err);
			} else {
				return callback(null, instances);
			}
		}
	);
};

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
	jsonData['searchColumns']=['ip','platformId'];
	ApiUtils.databaseUtil(jsonData,function(err,databaseCall){
		if(err){
			process.nextTick(function() {
				callback(null, []);
			});
			return;
		}
		else {
			UnmanagedInstance.paginate(databaseCall.queryObj, databaseCall.options, function (err, instances) {
				if (err) {
					logger.error("Failed getByOrgProviderId (%s)", err);
					callback(err, null);
					return;
				}
				callback(null, instances);
			});
		}
	});
};

UnmanagedInstanceSchema.statics.getInstanceByProviderId = function(providerId, callback) {
	logger.debug("Enter getInstanceByProviderId (%s)", providerId);
	this.find({
		providerId: providerId
	}, function(err, data) {
		if (err) {
			logger.error("Failed getInstanceByProviderId (%s)", providerId, err);
			callback(err, null);
			return;
		}
		logger.debug("Exit getInstanceByProviderId (%s)", providerId);
		callback(null, data);

	});
};

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

UnmanagedInstanceSchema.statics.updateUsage = function updateUsage(instanceId, usage, callBack) {
	this.update({
		_id: new ObjectId(instanceId)
	}, {
		$set: {usage: usage}
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

UnmanagedInstanceSchema.statics.updateInstanceCost = function(instanceCostData, callback) {
	this.update({
		platformId: instanceCostData.resourceId
	}, {
		$set: {
			cost: instanceCostData.cost
		}
	}, {
		upsert: false
	}, function(err, data) {
		if (err) {
			return callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

this.removeInstancebyId = function(instanceId, callback) {
	logger.debug("Enter removeInstancebyId (%s)", instanceId);
	UnmanagedInstance.remove({
		"_id": ObjectId(instanceId)
	}, function(err, data) {
		if (err) {
			logger.error("Failed to removeInstancebyId (%s)", instanceId, err);
			callback(err, null);
			return;
		}
		logger.debug("Exit removeInstancebyId (%s)", instanceId);
		callback(null, data);
	});
};

var UnmanagedInstance = mongoose.model('unmanagedinstances', UnmanagedInstanceSchema);
module.exports = UnmanagedInstance;