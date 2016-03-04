var mongoose = require('mongoose');
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
});


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

UnmanagedInstanceSchema.statics.getByProviderId = function(providerId, callback) {
	if (!providerId) {
		process.nextTick(function() {
			callback({
				message: "Invalid providerId"
			});
		});
		return;
	}

	this.find({
		"providerId": providerId
	}, function(err, instances) {
		if (err) {
			logger.error("Failed getByOrgProviderId (%s)", opts, err);
			callback(err, null);
			return;
		}

		callback(null, instances);

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



var UnmanagedInstance = mongoose.model('unmanagedinstances', UnmanagedInstanceSchema);



module.exports = UnmanagedInstance;