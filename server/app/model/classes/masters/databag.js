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


// This file act as a Model which contains Data Bag related all dao methods.

// Now persistance of Data Bag not required.So disabling it.

var logger = require('_pr/lib/logger')(module);
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/dao/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var datBagSchema = new Schema({
	dataBagName:{
		type: String,
		required: true
	},
	dataBagItemId:{
		type: String,
		required: true
	},
	encryptionKey:{
		type: String,
		required: true
	},
	isEncrypted:{
		type: Boolean,
		required: true
	}

});

datBagSchema.statics.saveDataBag = function(aDataBag,callback){
	logger.debug("Enter saveDataBag().");
	var that = this;
	var dataBagModel = new that(aDataBag);
	dataBagModel.save(function(err,aDataBag){
		if(err){
			callback(err,null);
			return;
		}
		callback(null,aDataBag);
		return;
	});
};

datBagSchema.statics.getDataBagEncryptionInfo = function(dataBagName,dataBagItemId,callback){
	logger.debug("Enter getDataBagEncryptionInfo().");
	this.find({
		"dataBagName" : dataBagName,
		"dataBagItemId" : dataBagItemId
	},function(err,aDataBag){
		if(err){
			callback(err,null);
			return;
		}
		callback(null,aDataBag[0]);
		return;
	});
};

datBagSchema.statics.removeDataBagById = function(dataBagId, callback) {
    logger.debug("Enter removeDataBagById");
    this.remove({
        "_id": new ObjectId(dataBagId)
    }, function(err, deleteCount) {
        if (err) {
            logger.debug("Exit removeDataBagById with error");
            callback(err, null);
            return;
        }
        logger.debug("Exit removeDataBagById with success");
        callback(null, deleteCount);

    });
};

var DataBagModel = mongoose.model('DataBagModel', datBagSchema);
module.exports = DataBagModel;
