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



// This file act as a Model which contains provider schema and dao methods.

var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('../dao/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;


var dashboardvmwareinstancesSchema = new Schema({
    totalvmwareinstancescount: {
        type: Number,
        required: true
    },
    timestamp:{
        type: Number,
        required: true
    }
});

// creates a new Provider
dashboardvmwareinstancesSchema.statics.createNew = function(dashboardvmwareInstancesData, callback) {
    logger.debug("Enter createNew dashboard");
    //var dashboardProviderObj = dashboardProviderData;
    var that = this;
    var dashboardvmwareinstancesSchema = new that({
        totalvmwareinstancescount: dashboardvmwareInstancesData,
        timestamp: new Date().getTime(),
    });
    dashboardvmwareinstancesSchema.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with getLatestvmwareInstancesInfo present");
        callback(null, aProvider);
        return;
    });
};

dashboardvmwareinstancesSchema.statics.getLatestvmwareInstancesInfo = function(callback) {
    logger.debug("Enter getLatestvmwareInstancesInfo");
      
    this.find(function(err, vmwareInstancesData) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (vmwareInstancesData.length) {
            logger.debug("Exit getLatestvmwareInstancesInfo with providers present");
            callback(null, vmwareInstancesData);
            return;
        } else {
            logger.debug("Exit getLatestvmwareInstancesInfo with no providers present");
            callback(null, null);
            return;
        }
    }).sort({_id:-1}).limit(1);
};

var dashboardvmwareinstances = mongoose.model('dashboardvmwareinstances', dashboardvmwareinstancesSchema);

module.exports = dashboardvmwareinstances;