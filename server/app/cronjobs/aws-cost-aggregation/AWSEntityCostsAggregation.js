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

var logger = require('_pr/logger')(module)
var async = require('async')
var appConfig = require('_pr/config')
var mongoose = require('mongoose')

var AWSResourceCostsAggregation = {}

AWSResourceCostsAggregation.aggregateEntityCosts = aggregateEntityCosts

module.exports = AWSResourceCostsAggregation

/* NOTE: Only monthly costs are aggregated for now */

// function aggregateEntityCosts(organizaitonId, toTimeStamp, period)
function aggregateEntityCosts(org, callback) {
    var catalystEntityHierarchy = appConfig.catalystEntityHierarchy

    async.forEach(Object.keys(catalystEntityHierarchy), function(entity, next) {
        console.log(catalystEntityHierarchy[entity])
        next()
    },
    function() {
        console.log('All entities printed')
        // callback(null, org._id)
    })
}