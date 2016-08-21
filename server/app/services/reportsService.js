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

const logger = require('_pr/logger')(module);
const dateUtil = require('_pr/lib/utils/dateUtil')
const resourceMetricsModel = require('_pr/model/resource-metrics');
const resourceCostsModel = require('_pr/model/resource-costs');
const appConfig = require('_pr/config');

var reportsService = module.exports = {}

// @TODO Query builder to be made generic and reused in analytics after schema changes
reportsService.parseFilterBy = function parseFilterBy(filterByString) {
    var filterQuery = {};

    var filters = filterByString.split('+');
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i].split(':');
        var filterQueryValues = filter[1].split(",");

        filterQuery[filter[0]] = {'$in': filterQueryValues};
    }

    return filterQuery;
}

// @TODO Nested callback functions to be removed after the introduction of query parser
reportsService.getCost = function getCost(query, callback) {
    var dbAndCriteria = []

    if ('filterBy' in query) {
        dbAndCriteria.push(reportsService.parseFilterBy(query.filterBy))
    }

    if ('toTimeStamp' in query) {
        // Calculate start and end time
        dbAndCriteria.push({endTime: {$lte: Date.parse(query.toTimeStamp)}})
    }
    // Reports generated only for AWS
    dbAndCriteria.push({providerType: 'AWS'})

    if (('period' in query) && ('toTimeStamp' in query)) {
        switch (query.period) {
            case 'month':
                dbAndCriteria.push({startTime: {$gte: Date.parse(
                    dateUtil.getStartOfAMonthInUTC(query.toTimeStamp))}})
                break
            default:
                break
        }
    }

    // defaults to day
    /*if('interval' in query) {
     }*/
    console.log(dbAndCriteria);
    if ('type' in query) {
        switch (query.type) {
            case 'aggregate':
                dbAndCriteria.push({resourceType: 'csv', resourceId: 'RLBilling'})
                resourceCostsModel.getLatestCost(dbAndCriteria, function(err, aggregateCostData) {
                    if(err) {
                        var err = new Error('Internal Server Error')
                        err.status = 500;
                        err.messages = [err.message]
                        return callback(err)
                    } else {
                        reportsService.formatCostAggregateToXlsx(aggregateCostData, callback)
                    }
                })
                break
            case 'trend':
                dbAndCriteria.push({resourceType: 'serviceCost'})
                resourceCostsModel.getCostsList(dbAndCriteria, function(err, costTrendsData) {
                    if(err) {
                        var err = new Error('Internal Server Error')
                        err.status = 500;
                        err.messages = [err.message]
                        return callback(err)
                    } else {
                        reportsService.formatCostTrendsToXlsx(costTrendsData, callback)
                    }
                })
                break
        }
    }
}

reportsService.getUsageTrends = function getUsageTrends(query, callback) {

}

reportsService.formatCostAggregateToXlsx = function formatCostAggregateToXlsx(aggregateCostData, callback) {
    callback(null, aggregateCostData)
}

reportsService.formatCostTrendsToXlsx = function formatCostTrendsToXlsx(costTrendsData, callback) {
    callback(null, costTrendsData)
}

reportsService.formatUsageTrendsToXlsx = function formatUsageTrendsToXlsx(usageTrendsData, callback) {

}