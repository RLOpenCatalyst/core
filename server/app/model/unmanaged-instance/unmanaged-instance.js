var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
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
	bgId: String,
	bgName: String,
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
	cost: Schema.Types.Mixed,
	network:{
		subnet:{
			type: String,
			required: false,
			trim: true
		},
		vpc:{
			type: String,
			required: false,
			trim: true
		}
	},
	isDeleted:{
		type:Boolean,
		default:false,
		required:false
	},
	subnetId: {
		type: String,
		required: false,
		trim: true
	},
	vpcId: {
		type: String,
		required: false,
		trim: true
	},
	privateIpAddress: {
		type: String,
		required: false,
		trim: true
	},
	hostName: {
		type: String,
		required: false,
		trim: true
	}
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

UnmanagedInstanceSchema.statics.updateInstanceMasterDetails = function updateInstanceMasterDetails(instanceId,masterDetails,callBack) {
	this.update({
		_id: new ObjectId(instanceId)
	}, {
		$set: masterDetails
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

UnmanagedInstanceSchema.statics.getAll = function getAll(query, callback) {
	//query.queryObj.isDeleted =  false;
	this.paginate(query.queryObj, query.options,
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
	this.find(opts, function(err, instances) {
		if (err) {
			logger.error("Failed getByOrgProviderId (%s)", opts, err);
			callback(err, null);
			return;
		}
		callback(null, instances);
	});
};

UnmanagedInstanceSchema.statics.removeInstancesByProviderId = function(providerId,callback) {
	var queryObj={};
	queryObj['providerId'] =providerId;
	this.remove(queryObj, function(err, data) {
		if (err) {
			return callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

UnmanagedInstanceSchema.statics.removeInstanceByInstanceId = function(instanceId,callback) {
	this.remove({"_id": ObjectId(instanceId)}, function(err, data) {
		if (err) {
			return callback(err, null);
		} else {
			callback(null, data);
		}
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
	//jsonData.queryObj.isDeleted = false;
	this.paginate(jsonData.queryObj, jsonData.options, function(err, instances) {
			if (err) {
				logger.error("Failed getByProviderId (%s)", err);
				callback(err, null);
				return;
			}
			callback(null, instances);
		});
};


UnmanagedInstanceSchema.statics.getInstanceByProviderId = function(providerId, callback) {
	logger.debug("Enter getInstanceByProviderId (%s)", providerId);
	this.find({
		providerId: providerId,
		isDeleted:false
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


UnmanagedInstanceSchema.statics.removeInstanceById = function(instanceId, callback) {
	UnmanagedInstance.update({
			"_id": ObjectId(instanceId)
		}, {
			$set: {
				isDeleted: true,
				state: 'terminated'
			}
		}, {
			upsert: false
		}, function(err, data) {
		if (err) {
			logger.error("Failed to removeInstanceById (%s)", instanceId, err);
			callback(err, null);
			return;
		}
		callback(null, data);
	});
};

UnmanagedInstanceSchema.statics.getInstancesByProviderIdOrgIdAndPlatformId = function getInstancesByProviderIdOrgIdAndPlatformId(orgId,providerId, platformId, callback) {
	var params = {
		'orgId': orgId,
		'providerId': providerId,
		'platformId': platformId
	};
	this.find(params,
		function(err, instances) {
			if (err) {
				logger.error("Could not get instance for ",orgId, providerId, platformId, err);
				return callback(err, null);
			} else if(instances.length > 0) {
				return callback(null, instances);
			} else {
				return callback(null, []);
			}
		}
	);
};

UnmanagedInstanceSchema.statics.updateInstanceStatus = function updateInstanceStatus(instanceId,instance,callback) {
	var updateObj={};
	updateObj['state'] = instance.state;
	if(instance.state === 'terminated' || instance.state === 'shutting-down'){
		updateObj['isDeleted'] = true;
	}else{
		updateObj['isDeleted'] = false;
		updateObj['subnetId']= instance.subnetId;
		updateObj['ip'] = instance.ip;
		updateObj['vpcId'] = instance.vpcId;
		updateObj['hostName'] = instance.hostName;
		updateObj['privateIpAddress'] = instance.privateIpAddress;
		updateObj['tags'] = instance.tags;
	}
	UnmanagedInstance.update({
			"_id": ObjectId(instanceId)
	},{
		$set: updateObj
	}, function(err, data) {
		if (err) {
			logger.error("Failed to update assigned Instance status data", err);
			callback(err,null);
			return;
		}
		callback(null, data);
	});
}
UnmanagedInstanceSchema.statics.getAllTerminatedInstances = function(orgId,callback) {
	this.find({"orgId":orgId,"state":"terminated"}, function(err, data) {
		if (err) {
			return callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

var UnmanagedInstance = mongoose.model('unmanagedinstances', UnmanagedInstanceSchema);
module.exports = UnmanagedInstance;