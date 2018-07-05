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

var ResourceMetricsSchema = new Schema({
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: {
        type: String,
        required: false,
        trim: true
    },
    orgId: {
        type: String,
        required: false,
        trim: true
    },
    projectId: {
        type: String,
        required: false,
        trim: true
    },
    resourceType: {
        type: String,
        required: false,
        trim: true
    },
    platform: {
        type: String,
        required: false,
        trim: true
    },
    platformId: {
        type: String,
        required: false,
        trim: true
    },
    resourceId: {
        type: String,
        required: false,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    interval: {
        type: Number,
        required: true
    },
    metrics: Schema.Types.Mixed
});

ResourceMetricsSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var resuourceMetrics = new self(data);

    resuourceMetrics.save(function (err, data) {
        if (err && typeof callback == 'function') {
            return callback(err, null);
        } else if(typeof callback == 'function') {
            return callback(null, resuourceMetrics);
        }
    });
};

ResourceMetricsSchema.statics.removeResourceUsageByProviderId = function(providerId, callback) {
    ResourceMetrics.remove({
        providerId: providerId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to removeResourceUsageByProviderId (%s)", providerId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceMetricsSchema.statics.getByParams = function(resourceId, interval, startTime, endTime, callback) {
	var query = ResourceMetrics.find();
	query.where('resourceId', resourceId);
	query.where('interval', interval);
	query.where('startTime').gte(startTime);
	query.where('endTime').lte(endTime);
	query.select('startTime endTime metrics');
	/*query.select('metrics.NetworkIn metrics.NetworkOut');*/
	/*query.select('metrics.NetworkIn.average metrics.NetworkIn.minimum metrics.NetworkOut.maximum');*/
	query.exec(function (err, docs) {
		if(err){
			callback(err, null);
		}else{
			callback(null, docs);
		}
	});
};

ResourceMetricsSchema.statics.getList = function getList(query, callback) {
    ResourceMetrics.aggregate(
        [
            { $match: {$and: query }},
            {
                $sort: {
                    startTime: 1
                }
            }
        ],
        function(err, usageMetricsEntries) {
            if (err) {
                logger.error(err)
                callback(err, null)
            } else {
                callback(null,usageMetricsEntries)
            }
        }
    )
};

var ResourceMetrics = mongoose.model('ResourceMetrics', ResourceMetricsSchema);
module.exports = ResourceMetrics;