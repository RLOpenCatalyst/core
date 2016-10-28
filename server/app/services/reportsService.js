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

const logger = require('_pr/logger')(module)
const dateUtil = require('_pr/lib/utils/dateUtil')
const resourceMetricsModel = require('_pr/model/resource-metrics')
const resourceCostsModel = require('_pr/model/resource-costs')
const appConfig = require('_pr/config')

var reportsService = module.exports = {}

// @TODO Query builder to be made generic and reused in analytics after schema changes
reportsService.parseFilterBy = function parseFilterBy(filterByString) {
    var filterQuery = {}

    var filters = filterByString.split('+')
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i].split(':')
        var filterQueryValues = filter[1].split(",")

        filterQuery[filter[0]] = {'$in': filterQueryValues}
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
    } else {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'To time stamp is mandatory'}]
        return callback(err)
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
                var err = new Error('Invalid request')
                err.status = 400
                err.errors = [{messages: 'Query not supported'}]
                return callback(err)
                break
        }
    }

    if('interval' in query && query.interval != 86400) {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'Query not supported'}]
        return callback(err)
    }

    // defaults to day
    /*if('interval' in query) {
     }*/
    if ('type' in query) {
        switch (query.type) {
            case 'aggregate':
                dbAndCriteria.push({resourceType: 'csv', resourceId: 'RLBilling'})
                resourceCostsModel.getLatestCost(dbAndCriteria, function(err, aggregateCostData) {
                    if(err) {
                        var err = new Error('Internal Server Error')
                        err.status = 500
                        err.errors = [{messages: err.message}]
                        return callback(err)
                    } else {
                        reportsService.formatCostAggregateReport(aggregateCostData, callback)
                    }
                })
                break
            case 'trend':
                dbAndCriteria.push({resourceType: 'serviceCost'})
                resourceCostsModel.getCostsList(dbAndCriteria, function(err, costTrendsData) {
                    if(err) {
                        var err = new Error('Internal Server Error')
                        err.status = 500
                        err.errors = [{messages: err.message}]
                        return callback(err)
                    } else {
                        reportsService.formatCostTrendsReport(costTrendsData, callback)
                    }
                })
                break
        }
    }
}

/**
 *
 * @param query
 * @param callback
 * @returns {*}
 */
reportsService.getUsageTrends = function getUsageTrends(query, callback) {
    var dbAndCriteria = []

    dbAndCriteria.push({resourceType: 'EC2'})

    if(('fromTimeStamp' in query) && ('toTimeStamp' in query)) {
        dbAndCriteria.push({startTime: {$gte: new Date(query.fromTimeStamp)}})
        dbAndCriteria.push({endTime: {$lte: new Date(query.toTimeStamp)}})
    } else {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'mandatory parameters not specified'}]
        return callback(err)
    }

    if(dateUtil.getDateDifferenceInDays(query.toTimeStamp, query.fromTimeStamp) > 10) {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'Query range too big'}]
        return callback(err)
    }

    if ('filterBy' in query) {
        dbAndCriteria.push(reportsService.parseFilterBy(query.filterBy))
    }

    if('interval' in query && query.interval != 3600) {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'Query not supported'}]
        return callback(err)
    } else {
        dbAndCriteria.push({interval: 3600})
    }

    resourceMetricsModel.getList(dbAndCriteria, function(err, usageMetricsTrends) {
        if(err) {
            var err = new Error('Internal Server Error')
            err.status = 500
            err.errors = [{messages: err.message}]
            return callback(err)
        } else {
            reportsService.formatUsageTrendsReport(usageMetricsTrends, callback)
        }
    })
}

/**
 *
 * @param aggregateCostData
 * @param callback
 */
reportsService.formatCostAggregateReport = function formatCostAggregateReport(aggregateCostData, callback) {
    var formattedAggregateData = []

    if(aggregateCostData == null || typeof aggregateCostData === undefined) {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'No data available for this request'}]
        return callback(err)
    }

    formattedAggregateData.push({
        Service: 'EC2',
        Cost: Math.round(aggregateCostData.costMetrics.serviceCost.ec2Cost * 100) / 100
    })
    formattedAggregateData.push({
        Service: 'S3',
        Cost: Math.round(aggregateCostData.costMetrics.serviceCost.s3Cost * 100) / 100
    })
    formattedAggregateData.push({
        Service: 'RDS',
        Cost: Math.round(aggregateCostData.costMetrics.serviceCost.rdCost * 100) / 100
    })
    formattedAggregateData.push({
        Service: 'VPC',
        Cost: Math.round(aggregateCostData.costMetrics.serviceCost.vpcCost * 100) / 100
    })
    formattedAggregateData.push({
        Service: 'Route 53',
        Cost: Math.round(aggregateCostData.costMetrics.serviceCost.r53Cost * 100) / 100
    })

    formattedAggregateData.push({})
    formattedAggregateData.push({
        Service: 'Total montly running cost',
        Cost: Math.round(aggregateCostData.aggregateResourceCost * 100) / 100
    })

    callback(null, {
        fileName: 'reports-cost-aggregate',
        fields: ['Service', 'Cost'],
        data: formattedAggregateData
    })
}

/**
 *
 * @param costTrendsData
 * @param callback
 * @returns {*}
 */
reportsService.formatCostTrendsReport = function formatCostTrendsReport(costTrendsData, callback) {
    var formattedTrendsData = []
    var ec2TotalCost = 0
    var rdsTotalCost = 0
    var totalCost   = 0

    // @TODO Get rid of blocking for loop
    for(var i = 0; i < costTrendsData.length; i++) {
        var endDate = new Date(costTrendsData[i].endTime)
        var endDateString = dateUtil.getDateInUTC(endDate).toString().substring(0, 10)

        if(endDate.getHours() == 00 && endDate.getMinutes() == 00) {
            ec2TotalCost += costTrendsData[i].costMetrics.ec2Cost
            rdsTotalCost += costTrendsData[i].costMetrics.rdsCost
            // @TODO Type of aggregatedResourceCost should be changed to number in model
            totalCost += parseFloat(costTrendsData[i].aggregateResourceCost)

            formattedTrendsData.push({
                'Date': endDateString,
                'EC2 Cost': Math.round(costTrendsData[i].costMetrics.ec2Cost * 100) / 100,
                'RDS Cost': Math.round(costTrendsData[i].costMetrics.rdsCost * 100) / 100,
                'Total Cost': Math.round(costTrendsData[i].aggregateResourceCost * 100) / 100
            })
        }
    }

    if(formattedTrendsData.length == 0) {
        var err = new Error('Invalid request')
        err.status = 400
        err.errors = [{messages: 'No data available for this request'}]
        return callback(err)
    } else {
        formattedTrendsData.push({})
        formattedTrendsData.push({
            'Date': 'Monthly running cost',
            'EC2 Cost': Math.round(ec2TotalCost * 100) / 100,
            'RDS Cost': Math.round(rdsTotalCost * 100) / 100,
            'Total Cost': Math.round(totalCost * 100) / 100
        })

        callback(null, {
            fileName: 'reports-cost-trends',
            fields: ['Date', 'EC2 Cost', 'RDS Cost', 'Total Cost'],
            data: formattedTrendsData
        })
    }
}

/**
 *
 * @param usageTrendsData
 * @param callback
 */
reportsService.formatUsageTrendsReport = function formatUsageTrendsReport(usageTrendsData, callback) {
    var formattedUsageTrends = []

    for(var i = 0; i < usageTrendsData.length; i++) {
        var startTimeString = dateUtil.getDateInUTC(usageTrendsData[i].startTime).toString()
        var endTimeString = dateUtil.getDateInUTC(usageTrendsData[i].endTime).toString()

        formattedUsageTrends.push({
            'Start time': startTimeString.substring(0, 10) + ' ' + startTimeString.substring(11, 19),
            'End time': endTimeString.substring(0, 10) + ' ' + endTimeString.substring(11, 19),
            'Instance ID': usageTrendsData[i].platformId,
            'Min. CPU Utilization': usageTrendsData[i].metrics.CPUUtilization.minimum,
            'Avg. CPU Utilization': usageTrendsData[i].metrics.CPUUtilization.average,
            'Max. CPU Utilization': usageTrendsData[i].metrics.CPUUtilization.maximum
        })
    }

    callback(null, {
        fileName: 'reports-usage-trends',
        fields: ['Start time', 'End time', 'Instance ID', 'Min. CPU Utilization',
            'Avg. CPU Utilization', 'Max. CPU Utilization'],
        data: formattedUsageTrends
    })
}