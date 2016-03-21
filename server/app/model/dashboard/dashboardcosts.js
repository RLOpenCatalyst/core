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


var dashboardcostsSchema = new Schema({
    totalcostcount: {
        type: Number,
        required: true
    },
    timestamp:{
        type: Number,
        required: true
    }
});

// creates a new Provider
dashboardcostsSchema.statics.createNew = function(dashboardCostsData, callback) {
    logger.debug("Enter createNew cost dashboard");
    //var dashboardProviderObj = dashboardProviderData;
    var that = this;
    var dashboardCosts = new that({
        totalcostcount: dashboardCostsData,
        timestamp: new Date().getTime(),
    });
    dashboardCosts.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with getLatestcostDataInfo present");
        callback(null, aProvider);
        return;
    });
};

dashboardcostsSchema.statics.getLatestCostInfo = function(callback) {
    logger.debug("Enter getLatestcostDataInfo");
      
    this.find(function(err, costData) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
            logger.debug("Exit getLatestcostDataInfo with providers present");
            callback(null, costData);
            return;
    }).sort({_id:-1}).limit(1);
};

var dashboardcosts = mongoose.model('dashboardcosts', dashboardcostsSchema);

module.exports = dashboardcosts;