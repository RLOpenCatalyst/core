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
    description: {
        type: String,
        trim: true,
        required: false
    },
    catalystEntityType: {
        type: String,
        enum: ['project', 'environment', 'businessGroup'],
        trim: true,
        required: false
    },
    catalystEntityMapping: Schema.Types.Mixed,
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
});
TagSchema.index({name: 1, providerId: 1}, {unique: true});

var hiddenFields = {'_id': 0, 'isDeleted': 0 };

TagSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var tags = new self(data);
    tags.save(function (err, data) {
        if (err) {
            logger.error(err);
            if(typeof callback == 'function') {
                return callback(err, null);
            }
        } else {
            if(typeof callback == 'function') {
                return callback(null, tags);
            }
        }
    });
};

TagSchema.statics.getTagsByProviderId = function getTagsByProviderId(providerId, callback) {
    this.find(
        {'providerId': providerId, 'isDeleted': false },
        hiddenFields,
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

TagSchema.statics.getTag = function getTag(params, callback) {
    params.isDeleted = false;

    this.find(
        params,
        hiddenFields,
        function(err, tags) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else if(tags.length > 0) {
                return callback(null, tags[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

TagSchema.statics.getTagsByProviderIdAndNames
    = function getTagsByProviderIdAndNames(providerId, tagNames, callback) {
    var params = {
            "isDeleted": false,
            "providerId": providerId,
            "name": {$in : tagNames }
    }
    this.find(
        params,
        hiddenFields,
        function(err, tags) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else if(tags.length > 0) {
                return callback(null, tags);
            } else {
                return callback(null, []);
            }
        }
    );
};

TagSchema.statics.getTagsWithMappingByProviderId
    = function getTagsWithMappingByProviderId(providerId, callback) {
    var params = {
        isDeleted: false,
        providerId: providerId,
        catalystEntityType: {$exists : true}
    }
    this.find(
        params,
        hiddenFields,
        function(err, tags) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else if(tags.length > 0) {
                return callback(null, tags);
            } else {
                return callback(null, []);
            }
        }
    )
};

TagSchema.statics.updateTag = function updateTag(params, fields, callback) {
    this.update(
        params,
        { $set: fields },
        function(err, result) {
            if (err) {
                logger.error(err);
                if(typeof callback == 'function') {
                    return callback(err, null);
                }
            } else if((result.ok == 1 && result.n == 1) && (typeof callback == 'function'))  {
                return callback(null, true);
            } else if(typeof callback == 'function') {
               return callback(null, null);
            }
        }
    );
};

TagSchema.statics.deleteTag = function deleteTag(params, callback) {
   this.update(
       params,
       { $set: {isDeleted: true} },
       function(err, tags) {
           if(err) {
               logger.error(err);
               return callback(err, null);
           } else {
               return callback(null, true);
           }
       }
   )
};

TagSchema.statics.updateTagValues = function updateTagValues(params, values, callback) {
    this.update(
        params,
        {$push: {values: values}},
        function(err, tags) {
            if(err) {
                logger.error(err);
                if(typeof callback == 'function') {
                    return callback(err, null);
                }
            } else {
                if(typeof callback == 'function') {
                    return callback(null, true);
                }
            }
        }
    )
}

TagSchema.statics.removeTagsByProviderId = function(providerId, callback) {
    Tags.remove({
        providerId: providerId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to removeTagsByProviderId (%s)", providerId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

var Tags = mongoose.model('Tags',TagSchema);
module.exports = Tags;
