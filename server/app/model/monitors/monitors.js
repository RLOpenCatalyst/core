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
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var MonitorsSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        trim: true,
        required: true
    },
    parameters: {
        type: Schema.Types.Mixed
    },
    isDefault: {
        type: Boolean,
        required: false,
        default: false
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
});

var hiddenFields = {'isDeleted': 0};

MonitorsSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var monitors = new self(data);
    monitors.save(function (err, data) {
        if (err) {
            logger.error(err);
            if (typeof callback === 'function') {
                return callback(err, null);
            }
        } else {
            if (typeof callback === 'function') {
                return callback(null, monitors);
            }
        }
    });
};

MonitorsSchema.statics.getMonitors = function (params, callback) {
    params.isDeleted = false;
    this.aggregate([{
            $match: params
        }, {
            $lookup: {
                from: "d4dmastersnew",
                localField: "orgId",
                foreignField: "rowid",
                as: "organization"
            }
        }], function (err, monitors) {
        if (err) {
            callback(err, null);
            return;
        } else if (monitors.length === 0) {
            callback(null, monitors);
            return;
        } else {
            return callback(null, monitors);
        }
    });

};

MonitorsSchema.statics.getById = function (monitorId, callback) {
    logger.debug('monitorId-------->',monitorId);
    if (monitorId) {
        this.find({'_id': monitorId, 'isDeleted': false},
            hiddenFields,
            function (err, monitors) {
                if (err) {
                    logger.error(err);
                    return callback(err, null);
                } else if (monitors.length === 0) {
                    callback(null, null);
                    return;
                } else {
                    return callback(null, monitors[0]);
                }
            }
        );
    } else {
        callback(null, null);
        return;
    }
};

MonitorsSchema.statics.getMonitor = function (monitorId, callback) {
    this.aggregate([{
            $match: {'_id': ObjectId(monitorId), 'isDeleted': false}
        }, {
            $lookup: {
                from: "d4dmastersnew",
                localField: "orgId",
                foreignField: "rowid",
                as: "organization"
            }
        }], function (err, monitors) {
        if (err) {
            callback(err, null);
            return;
        } else if (monitors.length === 0) {
            callback(null, null);
            return;
        } else {
            return callback(null, monitors[0]);
        }
    });
};

MonitorsSchema.statics.updateMonitors = function (monitorId, fields, callback) {
    this.update({'_id': monitorId}, {$set: fields},
        function (err, result) {
            if (err) {
                logger.error(err);
                if (typeof callback === 'function') {
                    return callback(err, null);
                }
            } else if ((result.ok === 1 && result.n == 1) && (typeof callback == 'function')) {
                return callback(null, true);
            } else if (typeof callback === 'function') {
                return callback(null, null);
            }
        }
    );
};

MonitorsSchema.statics.removeDefaultMonitor = function (orgId, callback) {
    this.update({'orgId': orgId}, {$set: {isDefault: false}}, { multi: true },
        function (err, monitors) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    );
};

MonitorsSchema.statics.setDefaultMonitor = function (monitorId, orgId, callback) {
    this.update({'_id': monitorId, 'orgId': orgId}, {$set: {isDefault: true}},
        function (err, monitors) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    );
};

MonitorsSchema.statics.deleteMonitors = function (monitorId, callback) {
    this.update({'_id': monitorId}, {$set: {isDeleted: true}},
        function (err, monitors) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    );
};
var Monitors = mongoose.model('Monitors', MonitorsSchema);
module.exports = Monitors;