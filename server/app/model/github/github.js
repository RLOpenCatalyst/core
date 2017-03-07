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
var GitHubSchema = new Schema({
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
    description: {
        type: String,
        required: false,
        trim: true
    },
    repositoryName: {
        type: String,
        trim: true,
        required: true
    },
    repositoryUserName: {
        type: String,
        trim: true,
        required: false
    },
    repositoryPassword: {
        type: String,
        trim: true,
        required: false
    },
    isAuthenticated: {
        type: Boolean,
        required: false,
        default: false
    },
    authenticationType: {
        type: String,
        required: false,
        default: false
    },
    repositorySSHPublicKeyFileId: {
        type: String,
        trim: true,
        required: false
    },
    repositorySSHPrivateKeyFileId: {
        type: String,
        trim: true,
        required: false
    }
});

GitHubSchema.statics.createNew = function createNew(gitHubObj, callback) {
    var self = this;
    var gitHub = new self(gitHubObj);
    gitHub.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

GitHubSchema.statics.getGitHubList = function (params, callback) {
    this.aggregate([{
        $lookup: {
            from: "d4dmastersnew",
            localField: "orgId",
            foreignField: "rowid",
            as: "organization"
        }
    }], function (err, gitHubList) {
        if (err) {
            callback(err, null);
            return;
        } else if (gitHubList.length === 0) {
            callback(null, gitHubList);
            return;
        } else {
            return callback(null, gitHubList);
        }
    });
};

GitHubSchema.statics.getById = function (gitHubId, callback) {
    logger.debug('gitHubId-------->',gitHubId);
    this.findById({'_id': gitHubId},
        function (err, gitHub) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, gitHub);
            }
        });
};

GitHubSchema.statics.getGitHubById = function (gitHubId, callback) {
    this.aggregate([{
        $match: {'_id': ObjectId(gitHubId)}
    }, {
        $lookup: {
            from: "d4dmastersnew",
            localField: "orgId",
            foreignField: "rowid",
            as: "organization"
        }
    }], function (err, gitHub) {
        if (err) {
            callback(err, null);
            return;
        } else if (gitHub.length === 0) {
            callback(null, null);
            return;
        } else {
            return callback(null, gitHub[0]);
        }
    });
};

GitHubSchema.statics.updateGitHub = function (gitHubId, fields, callback) {
    this.update({'_id': gitHubId}, {$set: fields},
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

GitHubSchema.statics.deleteGitHub = function (gitHubId, callback) {
    this.remove({'_id': gitHubId},
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
var GitHub = mongoose.model('github', GitHubSchema);
module.exports = GitHub;
