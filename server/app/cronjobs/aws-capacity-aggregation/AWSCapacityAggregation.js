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
var analyticsService = require('_pr/services/analyticsService')
var dateUtil = require('_pr/lib/utils/dateUtil')
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob')
var MasterUtils = require('_pr/lib/utils/masterUtil.js')

var AWSCapacityAggregation = Object.create(CatalystCronJob)
AWSCapacityAggregation.interval = '0 * * * *'
AWSCapacityAggregation.execute = aggregateAWSCapacity

var date = new Date()
AWSCapacityAggregation.currentCronRunTime = dateUtil.getDateInUTC(date)

// AWSCapacityAggregation.execute()

module.exports = AWSCapacityAggregation

AWSCapacityAggregation.aggregateEntityCapacityByOrg = aggregateEntityCapacityByOrg

function aggregateAWSCapacity() {
    async.waterfall([
        function(next) {
            MasterUtils.getAllActiveOrg(next)
        },
        function(orgs, next) {
            AWSCapacityAggregation.aggregateEntityCapacityByOrg(orgs, next)
        }
    ], function(err) {
        if (err) {
            logger.error(err)
        } else {
            logger.info('Resource capacity aggregation for all organizations complete')
        }
    })
}

function aggregateEntityCapacityByOrg(orgs, callback) {
    async.forEach(orgs, function(org, next) {
        analyticsService.aggregateEntityCapacity('organization', org.rowid,
            AWSCapacityAggregation.currentCronRunTime, next)
    }, function(err) {
        if(err) {
            callback(err)
        } else {
            callback()
        }
    })
}