
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var TagSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
    },
    providerId: {
        type: String,
        required: true,
        trim: true
    },
    tagsInfo: Schema.Types.Mixed
});


TagSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var tags = new self(data);
    tags.save(function (err, data) {
        if (err) {
            logger.error('unable to save Tags ', err);
            if (typeof callback == 'function') {
                callback(err, null);
            }
            return;
        }
        if (typeof callback == 'function') {
            callback(null, tags)
        }
    });
}

TagSchema.statics.getTagByOrgProviderId = function(opts,callback) {
    this.find({"orgId": opts.orgId,
        "providerId": opts.providerId
    }, function(err, tag) {
        if (err) {
            logger.error("Failed getTagByOrgProviderId (%s)", opts, err);
            callback(err, null);
            return;
        }
        callback(null, tag);

    });
};

TagSchema.statics.getTagByProviderId = function(providerId,callback) {
    this.find({
        "providerId": providerId
    },{tagsInfo:1, _id:0}, function(err, tag) {
        if (err) {
            logger.error("Failed getTagByOrgProviderId (%s)", opts, err);
            callback(err, null);
            return;
        }
        callback(null, tag);

    });
};

//Added By Durgesh
TagSchema.statics.updateTag = function updateTag(opts,data,callBack) {
    this.update({"orgId": opts.orgId,
        "providerId": opts.providerId
    }, {
        $set: {tagsInfo:data}
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update Tags data", err);
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

//Added By Durgesh
TagSchema.statics.updateTagForProvider = function updateTag(providerId,data,callBack) {
    this.update({
        "providerId": providerId
    }, {
        $set: {tagsInfo:data}
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update Tags data", err);
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
var Tags = mongoose.model('Tags',TagSchema);
module.exports = Tags;
