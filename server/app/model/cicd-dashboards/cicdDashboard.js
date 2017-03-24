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
var mongoosePaginate = require('mongoose-paginate');
var CICDDashboardSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true
    },
    dashboardName: {
        type: String,
        required: true,
        trim: true
    },
    dashboardDesc: {
        type: String,
        required: false,
        trim: true
    },
    dashboardServer: {
        type: String,
        trim: true,
        required: true
    },
    jiraServerId: {
        type: String,
        trim: true,
        required: true
    },
    jenkinsServerId: {
        type: String,
        trim: true,
        required: true
    },
    sonarServerId: {
        type: String,
        trim: true,
        required: true
    },
    dashboardServerUserName: {
        type: String,
        trim: true,
        required: false
    },
    dashboardServerPassword: {
        type: String,
        trim: true,
        required: false
    },
    dashboardDbHostName: {
        type: String,
        required: true,
        default: false
    },
    createdOn:{
        type: Number,
        required: false,
        default:Date.now()
    }
});

CICDDashboardSchema.plugin(mongoosePaginate);

CICDDashboardSchema.statics.createNew = function createNew(dashboardObj, callback) {
    var self = this;
    var dashboard = new self(dashboardObj);
    dashboard.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

CICDDashboardSchema.statics.getCICDDashboardList = function (params, callback) {
    CICDDashboard.paginate(params.queryObj, params.options, function(err, cicdDashboadList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        CICDDashboard.aggregate([
            {$match: params.queryObj},
            {
                $lookup: {
                    from: "d4dmastersnew",
                    localField: "orgId",
                    foreignField: "rowid",
                    as: "organization"
                }
            },
            {$skip: (params.options.page - 1) * params.options.limit},
            {$limit: params.options.limit},
            {$sort: params.options.sort}
        ], function (err, dashboardList) {
            if (err) {
                callback(err, null);
                return;
            } else {
                cicdDashboadList.docs = dashboardList;
                callback(null, cicdDashboadList);
                return;
            }
        });
    });
};

CICDDashboardSchema.statics.getById = function (cicdDashboadId, callback) {
    logger.debug('cicdDashboadId-------->',cicdDashboadId);
    this.findById({'_id': cicdDashboadId},
        function (err, CICDDashboard) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, CICDDashboard);
            }
        });
};

CICDDashboardSchema.statics.getcicdDashboardId = function (cicdDashboadId, callback) {
    this.aggregate([{
        $match: {'_id': ObjectId(cicdDashboadId)}
    }, {
        $lookup: {
            from: "d4dmastersnew",
            localField: "orgId",
            foreignField: "rowid",
            as: "organization"
        }
    }], function (err, cicdDashboad) {
        if (err) {
            callback(err, null);
            return;
        } else if (cicdDashboad.length === 0) {
            callback(null, null);
            return;
        } else {
            return callback(null, cicdDashboad[0]);
        }
    });
};

CICDDashboardSchema.statics.getcicdDashboardServerByHost = function (hostname, callback) {
    this.aggregate([{
        $match: {'dashboardServer': hostname}
    }, {
        $lookup: {
            from: "d4dmastersnew",
            localField: "orgId",
            foreignField: "rowid",
            as: "organization"
        }
    }], function (err, cicdDashboad) {
        if (err) {
            callback(err, null);
            return;
        } else if (cicdDashboad.length === 0) {
            callback(null, null);
            return;
        } else {
            return callback(null, cicdDashboad[0]);
        }
    });
};

CICDDashboardSchema.statics.getcicdDashboardServerByOrgId = function (orgId, callback) {
    this.aggregate([{
        $match: {'orgId': orgId}
    }, {
        $lookup: {
            from: "d4dmastersnew",
            localField: "orgId",
            foreignField: "rowid",
            as: "organization"
        }
    }], function (err, cicdDashboad) {
        if (err) {
            callback(err, null);
            return;
        } else if (cicdDashboad.length === 0) {
            callback(null, null);
            return;
        } else {
            return callback(null, cicdDashboad);
        }
    });
};

CICDDashboardSchema.statics.updatecicdDashboad = function (cicdDashboadId, fields, callback) {
    this.update({'_id': cicdDashboadId}, {$set: fields},
        function (err, result) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else if ((result.ok === 1 && result.n == 1)) {
                return callback(null, true);
            } else {
                return callback(null, null);
            }
        }
    );
};

CICDDashboardSchema.statics.deletecicdDashboad = function (cicdDashboadId, callback) {
    this.remove({'_id': cicdDashboadId},
        function (err, data) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    );
};
var CICDDashboard = mongoose.model('CicdDashboardServer', CICDDashboardSchema);
module.exports = CICDDashboard;
