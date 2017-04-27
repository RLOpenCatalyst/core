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


// This file act as a Model which contains vmImage related all dao methods.

var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/dao/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var imageSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    providerId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.idValidator
    },
    providerType: {
        type: String,
        required: false,
        trim: true
    },
    imageIdentifier: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    osType: {
        type: String,
        required: true,
        trim: true
    },
    vType: {
        type: String,
        required: true,
        trim: true
    },
    osName: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    orgId: {
        type: [String],
        required: true,
        trim: true
    },
    instancePassword: {
        type: String,
        required: false,
        trim: true
    }
});

imageSchema.statics.createNew = function(imageData, callback) {
    logger.debug("Enter createNew");
    var that = this;
    var vmimage = new that(imageData);
    logger.debug(imageData);
    vmimage.save(function(err, imageData) {
        if (err) {
            logger.error(err);
            logger.debug("Exit createNew with error");
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with Image present");
        callback(null, imageData);
    });
};

imageSchema.statics.getImages = function(callback) {
    logger.debug("Enter getImages");
    this.find({
        "id": 22
    }, function(err, images) {
        if (err) {
            logger.error(err);
            logger.debug("Exit getImages with error");
            callback(err, null);
            return;
        }
        if (images.length) {
            logger.debug("Exit getImages with Images present");
            callback(null, images);
        } else {
            logger.debug("Exit getImages with no Images present");
            callback(null, null);
        }

    });
};

imageSchema.statics.getImagesForOrg = function(orgList, callback) {
    logger.debug("Enter getImagesForOrg");
    var orgIds = [];
    for (var x = 0; x < orgList.length; x++) {
        orgIds.push(orgList[x].rowid);
    }
    logger.debug("org id: ", orgIds);
    this.find({
        orgId: {
            $in: orgIds
        }
    }, function(err, images) {
        if (err) {
            logger.error(err);
            logger.debug("Exit getImagesForOrg with error");
            callback(err, null);
            return;
        }
        if (images.length) {
            logger.debug("Exit getImagesForOrg with Images present");
            callback(null, images);
        } else {
            logger.debug("Exit getImagesForOrg with no Images present");
            callback(null, null);
        }

    });
};

imageSchema.statics.getImageById = function(imageId, callback) {
    logger.debug("Enter getImageById");
    this.find({
        "_id": new ObjectId(imageId)
    }, function(err, anImage) {
        if (err) {
            logger.error(err);
            logger.debug("Exit getImageById with error");
            callback(err, null);
            return;
        }
        if (anImage.length) {
            logger.debug("Exit getImageById with Image present");
            callback(null, anImage[0]);
        } else {
            logger.debug("Exit getImageById with no Image present");
            callback(null, null);
        }

    });
};

imageSchema.statics.updateImageById = function(imageId, imageData, callback) {
    logger.debug("Enter updateImageById");
    this.update({
        "_id": new ObjectId(imageId)
    }, {
        $set: {
            id: 22,
            providerId: imageData.providerId,
            imageIdentifier: imageData.imageIdentifier,
            name: imageData.name,
            vType: imageData.vType,
            osType: imageData.osType,
            userName: imageData.userName,
            orgId: imageData.orgId,
            osName: imageData.osName,
            instancePassword: imageData.instancePassword
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Exit updateImageById with error");
            callback(err, null);
            return;
        }
        logger.debug("Exit updateImageById with success");
        callback(null, updateCount);

    });

};

imageSchema.statics.removeImageById = function(imageId, callback) {
    logger.debug("Enter removeImageById");
    this.remove({
        "_id": new ObjectId(imageId)
    }, function(err, deleteCount) {
        if (err) {
            logger.debug("Exit removeImageById with error");
            callback(err, null);
            return;
        }
        logger.debug("Exit removeImageById with success");
        callback(null, deleteCount);

    });
};

imageSchema.statics.getImageByProviderId = function(providerId, callback) {
    logger.debug("Enter getImageByProviderId");
    this.find({
        "providerId": providerId
    }, function(err, images) {
        if (err) {
            logger.error(err);
            logger.debug("Exit getImageByProviderId with error");
            callback(err, null);
            return;
        }
        if (images.length) {
            logger.debug("Exit getImageByProviderId with Image present");
            callback(null, images);
        } else {
            logger.debug("Exit getImageByProviderId with no Image present");
            callback(null, []);
        }

    });
};

imageSchema.statics.getImageNameById = function(imageId, callback) {
    logger.debug("Enter getImageNameById");
    this.find({
        "_id": new ObjectId(imageId)},{name:1, _id:0}, function(err, imageName) {
        if (err) {
            logger.error(err);
            logger.debug("Exit getImageNameById with error");
            callback(err, null);
            return;
        }
        if (imageName.length) {
            logger.debug("Exit getImageNameById with Image present");
            callback(null, imageName[0].name);
        } else {
            logger.debug("Exit getImageNameById with no Image present");
            callback(null, null);
        }

    });
};

var VMImage = mongoose.model('VMImage', imageSchema);

module.exports = VMImage;
