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


var dashboarddailytrendsSchema = new Schema({
    totaldailytrendcount: {
        type: Number,
        required: true
    },
    timestamp:{
        type: Number,
        required: true
    }
});

// creates a new Provider
dashboarddailytrendsSchema.statics.createNew = function(dashboarddailytrendsData, callback) {
    logger.debug("Enter createNew dashboard");
    //var dashboardProviderObj = dashboardProviderData;
    var that = this;
    var dashboarddailytrends = new that({
        totaldailytrendcount: dashboarddailytrendsData,
        timestamp: new Date().getTime(),
    });
    dashboarddailytrends.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with getLatestdailytrendDataInfo present");
        callback(null, aProvider);
        return;
    });
};

dashboarddailytrendsSchema.statics.getLatestdailytrendInfo = function(callback) {
    logger.debug("Enter getLatestdailytrendDataInfo");
      
    this.find(function(err, dailytrendData) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (dailytrendData.length) {
            logger.debug("Exit getLatestdailytrendDataInfo with providers present");
            callback(null, dailytrendData);
            return;
        } else {
            logger.debug("Exit getLatestdailytrendDataInfo with no providers present");
            callback(null, null);
            return;
        }
    }).sort({_id:-1}).limit(1);
};

var dashboarddailytrends = mongoose.model('dashboarddailytrends', dashboarddailytrendsSchema);

module.exports = dashboarddailytrends;