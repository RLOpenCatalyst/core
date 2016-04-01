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
var TagSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true
    },
    providerId: {
        type: String,
        trim: true,
        required: false
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    values: {
        type: [String],
        trim: true,
        required: true
    },
    catalystEntityType: {
        type: String,
        trim: true,
        required: false
    },
    description: {
        type: String,
        trim: true,
        required: false
    },
    mapping: [{
        catalystEntityId: {
            type: String,
            trim: true,
            required: false
        },
        catalystEntity: {
            type: String,
            trim: true,
            required: false
        },
        tagValue: {
            type: String,
            trim: true,
            required: false
        }
    }],
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
});


TagSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var tags = new self(data);
    tags.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, tags);
        }
    });
}

TagSchema.statics.getTagsByOrgIdAndProviderId = function getTagsByOrgIdAndProviderId(parameters, callback) {
    // @TODO filters to be used

    this.find(
        {
            'orgId': parameters.orgId,
            'providerId': parameters.providerId,
            'isDeleted': false
        },
        {
            '_id': 0,
            'isDeleted': 0
        },
        function(err, tag) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, tag);
            }
        }
    );
};

TagSchema.statics.getTagsByProviderId = function getTagsByProviderId(providerId, callback) {
    this.find(
        {
            'providerId': providerId,
            'isDeleted': false
        },
        {
            '_id': 0,
            'isDeleted': 0
        },
        function(err, tags) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, tags);
            }
        }
    );
};

TagSchema.statics.getTagByNameAndProviderId = function getTagByNameAndProviderId(parameters,  callback) {
    this.find(
        {
            'providerId': parameters.providerId,
            'name': parameters.tagName,
            'isDeleted': false
        },
        {
            '_id': 0,
            'isDeleted': 0
        },
        function(err, tag) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else if(tag.length > 0) {
                return callback(null, tag[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

TagSchema.statics.updateTag = function updateTag(opts,data,callBack) {
    this.update({"orgId": opts.orgId,
        "providerId": opts.providerId
    }, {
        $set: {tagsInfo:data}
    }, function(err, data) {
        if (err) {
            logger.error(err);
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

TagSchema.statics.updateTagForProvider = function updateTag(providerId,data,callBack) {
    this.update({
        "providerId": providerId
    }, {
        $set: {tagsInfo:data}
    }, function(err, data) {
        if (err) {
            logger.error(err);
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

var Tags = mongoose.model('Tags',TagSchema);
module.exports = Tags;
