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


var dashboardlandingsSchema = new Schema({
    jenkinsReferenceValue: {
        type: String,
        required: true
    },
    jobsListValue:{
        type: String,
        required: true
    }
});

// creates a new Dashboard Landing Page.
dashboardlandingsSchema.statics.createNew = function(dashboardlandingsData, callback) {
    logger.debug("Enter createNew landing dashboard");
    //logger.debug("Landing monog data:==========>"+JSON.stringify(dashboardlandingsData));
    var that = this;
    var dashboardlandings = new that({
        jenkinsReferenceValue: dashboardlandingsData.jenkinsReferenceValue,
        jobsListValue: dashboardlandingsData.jobsListValue,
    });
    dashboardlandings.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with new save");
        callback(null, aProvider);
        return;
    });
};
dashboardlandingsSchema.statics.getLandingDataInfo = function(callback) {
    logger.debug("Enter getting landingdata function");
      
    this.find(function(err, landingData) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
            logger.debug("Exit getallLandingDataInfo");
            callback(null, landingData);
            return;
    });
};

var dashboardlandings = mongoose.model('dashboardlandings', dashboardlandingsSchema);

module.exports = dashboardlandings;