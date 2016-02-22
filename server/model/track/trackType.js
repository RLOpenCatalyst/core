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


var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');

// File which contains Track DB schema and DAO methods. 

var Schema = mongoose.Schema;

var TrackTypeSchema = new Schema({
    subType: [{
        name:String,
    }],
    type:String,
    description: String
});

// Get all Track informations.
TrackTypeSchema.statics.getTrackType = function(callback) {
    this.find(function(err, trackType) {
        if (err) {
            logger.debug("Got error while fetching Track: ", err);
            callback(err, null);
        }
        if (trackType) {
            logger.debug("Got Tracks: ", JSON.stringify(trackType));
            callback(null, trackType);
        }
    });
};

// Save all Track informations.
TrackTypeSchema.statics.createNew = function(trackTypeData, callback) {
    var track = new this(trackTypeData);
    track.save(function(err, trackType) {
        if (err) {
            logger.debug("Got error while creating Track: ", err);
            callback(err, null);
        }
        if (trackType) {
            logger.debug("trackTypeData", JSON.stringify(trackTypeData));
            logger.debug("Creating Track: ", JSON.stringify(trackType));
            callback(null, trackType);
        }
    });
};

// Update all Track informations.
TrackTypeSchema.statics.updateTrack = function(trackTypeId, trackTypeData, callback) {
    logger.debug("Update Track Id", trackTypeId);
    logger.debug(trackTypeData.description);
    this.update({
        "_id": new ObjectId(trackTypeId)
    }, {
        $set: {
            "name": trackTypeData.type,
            "subType.$.name": trackTypeData.subType,
            "description": trackTypeData.description
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Got error while creating trackType: ", err);
            callback(err, null);
        }
        callback(null, updateCount);

    });
};

// Get all Track informations.
TrackTypeSchema.statics.getTrackTypeById = function(trackTypeId, callback) {
    this.find({
        "_id": new ObjectId(trackTypeId)
    }, function(err, trackType) {
        if (err) {
            logger.debug("Got error while fetching TrackType: ", err);
            callback(err, null);
            return;
        }
        if (trackType) {
            logger.debug("Got Track: ", JSON.stringify(trackType[0]));
            callback(null, trackType[0]);
        }
    });
};

// Remove Track informations.
TrackTypeSchema.statics.removeTracks = function(trackTypeId, callback) {
    logger.debug("trackTypeId", trackTypeId);
    this.remove({
        "_id": trackTypeId
    }, function(err, trackType) {
        if (err) {
            logger.debug("Got error while removing Tracks: ", err);
            callback(err, null);
        }
        if (trackType) {
            logger.debug("Remove Success....");
            callback(null, trackType);
        }
    });
};

var Track = mongoose.model("trackType", TrackTypeSchema);
module.exports = Track;
