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

var logger = require('_pr/logger')(module);
var resourceMetricsModel = require('_pr/model/resource-metrics');
var resourceCostsModel = require('_pr/model/resource-costs')
var entityCostsModel = require('_pr/model/entity-costs')
var entityCapacityModel = require('_pr/model/entity-capacity')
const dateUtil = require('_pr/lib/utils/dateUtil')
var appConfig = require('_pr/config');
var async = require('async')
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js')
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js')
var instancesModel = require('_pr/model/classes/instance/instance')
var assignedInstancesModel = require('_pr/model/unmanaged-instance')
var unassignedInstancesModel = require('_pr/model/unassigned-instances')
var resourcesModel = require('_pr/model/resources/resources')

var analyticsService = module.exports = {}

// @TODO To be re-factored
analyticsService.aggregateEntityCosts
    = function aggregateEntityCosts(parentEntity, parentEntityId, parentEntityQuery, endTime, period, callback) {
        var catalystEntityHierarchy = appConfig.catalystEntityHierarchy
        var costAggregationPeriods = appConfig.costAggregationPeriods
        var platformServices = Object.keys(appConfig.aws.services).map(function (key) {
            return appConfig.aws.services[key]
        })

        var offset = (new Date()).getTimezoneOffset() * 60000
        var interval = costAggregationPeriods[period].intervalInSeconds
        var startTime = dateUtil.getStartOfPeriod(period, endTime)

        async.forEach(catalystEntityHierarchy[parentEntity].children, function (childEntity, next0) {
            var query = parentEntityQuery
            query.startTime = {$gte: Date.parse(startTime) + offset}
            query.endTime = {$lte: Date.parse(endTime) + offset}

            async.waterfall([
                function (next1) {
                    resourceCostsModel.aggregate([
                        {$match: query},
                        {$group: {_id: "$" + catalystEntityHierarchy[childEntity].key,
                                totalCost: {$sum: "$cost"}}}
                    ], next1)
                },
                function (totalCosts, next1) {
                    resourceCostsModel.aggregate([
                        {$match: query},
                        {
                            $group: {
                                _id: {
                                    "entityId": "$" + catalystEntityHierarchy[childEntity].key,
                                    "service": "$platformDetails.serviceId"
                                },
                                totalCost: {$sum: "$cost"},
                                service: {$first: "$platformDetails.serviceId"}
                            }
                        }
                    ], function (err, serviceCosts) {
                        if (err) {
                            return next1(err)
                        } else {
                            var aggregatedCosts = {totalCosts: totalCosts}
                            aggregatedCosts.serviceCosts = serviceCosts

                            next1(null, aggregatedCosts)
                        }
                    })
                }
            ],
                function (err, aggregateCosts) {
                    if (err) {
                        next0(err)
                    } else {
                        // @TODO To be improved
                        var entityCosts = {}
                        for (var i = 0; i < aggregateCosts.totalCosts.length; i++) {
                            entityCosts[aggregateCosts.totalCosts[i]._id] = {
                                entity: {id: aggregateCosts.totalCosts[i]._id, type: childEntity},
                                parentEntity: {id: parentEntityId, type: parentEntity},
                                costs: {
                                    totalCost: Math.round(aggregateCosts.totalCosts[i].totalCost * 100) / 100,
                                    AWS: {
                                        totalCost: Math.round(aggregateCosts.totalCosts[i].totalCost * 100) / 100,
                                        serviceCosts: {}
                                    }
                                },
                                startTime: Date.parse(startTime),
                                endTime: Date.parse(endTime),
                                period: period,
                                interval: interval
                            }
                        }

                        // @TODO To be improved
                        for (var i = 0; i < aggregateCosts.serviceCosts.length; i++) {
                            if (aggregateCosts.serviceCosts[i]._id.entityId in entityCosts) {
                                entityCosts[aggregateCosts.serviceCosts[i]._id.entityId]
                                    .costs.AWS.serviceCosts[aggregateCosts.serviceCosts[i]._id.service]
                                    = Math.round(aggregateCosts.serviceCosts[i].totalCost * 100) / 100
                            }
                        }

                        if (Object.keys(entityCosts).length > 0)
                            analyticsService.updateEntityCosts(entityCosts, next0)
                        else
                            next0()
                    }
                })

        }, function (err) {
            if (err) {
                callback(err)
            } else {
                callback()
            }
        })
    }

analyticsService.deleteAggregateEntityCosts = function deleteAggregateEntityCosts(parentEntityId, endTime, period, callback) {
    var startTime = dateUtil.getStartOfPeriod(period, endTime);
    entityCostsModel.deleteEntityCost(parentEntityId, Date.parse(startTime), period, function (err) {
        if (err) {
            return callback(err);
        }
        return callback();
    });
};

analyticsService.updateEntityCosts = function updateEntityCosts(entityCosts, callback) {
    async.forEach(entityCosts,
        function (entityCost, next) {
            entityCostsModel.upsertEntityCost(entityCost, next)
        },
        function (err) {
            if (err)
                return callback(err)

            return callback()
        }
    );
}

// @TODO To be reviewed and improved
analyticsService.validateAndParseCostQuery
    = function validateAndParseCostQuery(queryType, requestQuery, callback) {
        var costAggregationPeriods = appConfig.costAggregationPeriods

        if ((!('parentEntityId' in requestQuery)) || (!('entityId' in requestQuery))
            || (!('toTimeStamp' in requestQuery)) || (!('period' in requestQuery))) {
            var err = new Error('Invalid request')
            err.errors = [{messages: 'Mandatory fields missing'}]
            err.status = 400
            return callback(err)
        }

        var startTime = dateUtil.getStartOfPeriod(requestQuery.period, requestQuery.toTimeStamp)
        if (startTime == null) {
            var err = new Error('Invalid request')
            err.errors = [{messages: 'Period is invalid'}]
            err.status = 400
            return callback(err)
        }

        //@TODO Query object format to be changed
        var costQuery = {
            totalCostQuery: [
                {'parentEntity.id': requestQuery.parentEntityId},
                {'entity.id': requestQuery.entityId},
                {'startTime': Date.parse(startTime)},
                {'period': requestQuery.period}
            ]
        }

        if (queryType == 'aggregate') {
            costQuery.splitUpCostQuery = [
                {'parentEntity.id': requestQuery.entityId},
                {'startTime': Date.parse(startTime)},
                {'period': requestQuery.period}
            ]
        }

        if (queryType == 'trend') {
            costQuery.costTrendQuery = [
                {'parentEntity.id': requestQuery.parentEntityId},
                {'entity.id': requestQuery.entityId},
                {'startTime': {$gte: Date.parse(startTime)}},
                {'endTime': {$lte: Date.parse(requestQuery.toTimeStamp)}},
                {'interval': costAggregationPeriods[requestQuery.period].childInterval.intervalInSeconds}
            ]
        }

        return callback(null, costQuery)
    }

analyticsService.getEntityAggregateCosts = function getEntityAggregateCosts(costQuery, callback) {
    async.parallel({
        totalCost: function (next) {
            entityCostsModel.getEntityCost(costQuery.totalCostQuery, next)
        },
        splitUpCosts: function (next) {
            entityCostsModel.getEntityCost(costQuery.splitUpCostQuery, next)
        }
    }, function (err, entityCosts) {
        if (err) {
            logger.error(err)
            var err = new Error('Internal Server Error')
            err.status = 500
            return callback(err)
        } else if (entityCosts.totalCost == null) {
            var err = new Error('Data not available')
            err.status = 400
            return callback(err)
        } else {
            return callback(null, entityCosts)
        }
    })
}

analyticsService.getEntityCostTrend = function getEntityCostTrend(costQuery, callback) {
    async.parallel({
        totalCost: function (next) {
            entityCostsModel.getEntityCost(costQuery.totalCostQuery, next)
        },
        costTrend: function (next) {
            entityCostsModel.getEntityCost(costQuery.costTrendQuery, next)
        }
    }, function (err, entityCosts) {
        if (err) {
            logger.error(err)
            var err = new Error('Internal Server Error')
            err.status = 500
            return callback(err)
        } else if (entityCosts.totalCost == null) {
            var err = new Error('Data not available')
            err.status = 400
            return callback(err)
        } else {
            return callback(null, entityCosts)
        }
    })
}

// @TODO Try to opitmize
analyticsService.formatAggregateCost = function formatAggregateCost(entityCosts, callback) {
    var catalystEntityHierarchy = appConfig.catalystEntityHierarchy

    async.waterfall([
        function (next) {
            var formattedAggregateCost = {
                period: entityCosts.totalCost[0].period,
                fromTime: entityCosts.totalCost[0].startTime,
                toTime: entityCosts.totalCost[0].endTime,
                entity: {
                    type: entityCosts.totalCost[0].entity.type,
                    id: entityCosts.totalCost[0].entity.id,
                    name: entityCosts.totalCost[0].entity.name
                },
                cost: entityCosts.totalCost[0].costs,
                splitUpCosts: {}
            }

            if (formattedAggregateCost.entity.id != 'Unassigned'
                && formattedAggregateCost.entity.id != 'Other'
                && formattedAggregateCost.entity.id != 'Global'
                && formattedAggregateCost.entity.id != 'Unknown') {
                analyticsService.getEntityDetails(formattedAggregateCost.entity.type,
                    formattedAggregateCost.entity.id,
                    function (err, entityDetails) {
                        if (err) {
                            next(err)
                        } else {
                            formattedAggregateCost.entity.name = entityDetails.name
                            next(null, formattedAggregateCost)
                        }
                    }
                )
            } else {
                formattedAggregateCost.entity.name = formattedAggregateCost.entity.id
                next(null, formattedAggregateCost)
            }
        },
        function (formattedAggregateCost, next) {
            async.forEach(entityCosts.splitUpCosts,
                function (costEntry, next0) {
                    if (costEntry.entity.type == entityCosts.totalCost[0].entity.type) {
                        return next0()
                    }

                    if (!(costEntry.entity.type in formattedAggregateCost.splitUpCosts)) {
                        formattedAggregateCost.splitUpCosts[costEntry.entity.type] = []
                    }

                    var splitUpCost = {
                        id: costEntry.entity.id,
                        // name: costEntry.entity.name,
                        cost: costEntry.costs
                    }

                    if (costEntry.entity.id != 'Unassigned' && costEntry.entity.id != 'Other'
                        && costEntry.entity.id != 'Unknown' && costEntry.entity.id != 'Global') {
                        analyticsService.getEntityDetails(costEntry.entity.type, costEntry.entity.id,
                            function (err, entityDetails) {
                                if (err) {
                                    next0(err)
                                } else {
                                    splitUpCost.name = entityDetails.name
                                    formattedAggregateCost.splitUpCosts[costEntry.entity.type].push(splitUpCost)
                                    next0()
                                }
                            }
                        )
                    } else {
                        splitUpCost.name = costEntry.entity.id
                        formattedAggregateCost.splitUpCosts[costEntry.entity.type].push(splitUpCost)
                        next0()
                    }
                },
                function (err) {
                    if (err) {
                        return next(err)
                    } else {
                        return next(null, formattedAggregateCost)
                    }
                }
            )
        }
    ], function (err, formattedAggregateCost) {
        if (err) {
            logger.error(err)
            var err = new Error('Internal Server Error')
            err.status = 500
            callback(err)
        } else {
            return callback(null, formattedAggregateCost)
        }
    })
}

// @TODO Try to opitmize
analyticsService.formatCostTrend = function formatCostTrend(entityCosts, callback) {
    var catalystEntityHierarchy = appConfig.catalystEntityHierarchy

    async.waterfall(
        [
            function (next) {
                var formattedCostTrend = {
                    costTrends: []
                }
                if (entityCosts.totalCost != null) {
                    formattedCostTrend = {
                        period: entityCosts.totalCost[0].period,
                        fromTime: entityCosts.totalCost[0].startTime,
                        toTime: entityCosts.totalCost[0].endTime,
                        entity: {
                            type: entityCosts.totalCost[0].entity.type,
                            id: entityCosts.totalCost[0].entity.id,
                            name: entityCosts.totalCost[0].entity.name
                        },
                        cost: entityCosts.totalCost[0].costs,
                        costTrends: []
                    }
                }

                analyticsService.getEntityDetails(formattedCostTrend.entity.type,
                    formattedCostTrend.entity.id,
                    function (err, entityDetails) {
                        if (err) {
                            next(err)
                        } else {
                            formattedCostTrend.entity.name = entityDetails.name
                            next(null, formattedCostTrend)
                        }
                    }
                )
            },
            function (formattedCostTrend, next) {
                async.forEach(entityCosts.costTrend,
                    function (costEntry, next0) {
                        var trend = {
                            fromTime: costEntry.startTime,
                            toTime: costEntry.endTime,
                            cost: costEntry.costs
                        }

                        formattedCostTrend.costTrends.push(trend)
                        next0()
                    },
                    function (err) {
                        if (err) {
                            logger.error(err)
                            var err = new Error('Internal Server Error')
                            err.status = 500
                            return next(err)
                        } else {
                            return next(null, formattedCostTrend)
                        }
                    }
                )
            }
        ],
        function (err, formattedCostTrend) {
            if (err) {
                callback(err)
            } else {
                callback(null, formattedCostTrend)
            }
        }
    )
}

//@TODO To be optimized. Better abstractions and attribute naming conventions will guarantee less code duplication
//@TODO Centralized error handling to reduce code duplication
analyticsService.getEntityDetails = function getEntityDetails(entityType, entityId, callback) {
    var internalServerError = new Error('Internal Server Error')
    internalServerError.status = 500

    switch (entityType) {
        case 'organization':
            d4dModelNew.d4dModelMastersOrg.find(
                {rowid: entityId},
                function (err, organizations) {
                    if (err) {
                        logger.error(err)
                        callback(internalServerError)
                    } else if (organizations.length > 0) {
                        callback(null, {'name': organizations[0].orgname})
                    } else {
                        callback(null, {'name': 'Unknown'})
                    }
                }
            )
            break
            // NOTE: Currently works only for AWS providers
        case 'provider':
            AWSProvider.getAWSProviderById(entityId,
                function (err, provider) {
                    if (err) {
                        logger.error(err)
                        callback(internalServerError)
                    } else if (provider == null) {
                        callback(null, {'name': 'Unknown'})
                    } else {
                        callback(null, {'name': provider.providerName})
                    }
                }
            )
            break
        case 'businessGroup':
            d4dModelNew.d4dModelMastersProductGroup.find(
                {rowid: entityId},
                function (err, businessGroups) {
                    if (err) {
                        logger.error(err)
                        callback(internalServerError)
                    } else if (businessGroups.length > 0) {
                        callback(null, {'name': businessGroups[0].productgroupname})
                    } else {
                        callback(null, {'name': 'Unknown'})
                    }
                }
            )
            break
        case 'project':
            d4dModelNew.d4dModelMastersProjects.find(
                {rowid: entityId},
                function (err, projects) {
                    if (err) {
                        logger.error(err)
                        callback(internalServerError)
                    } else if (projects.length > 0) {
                        callback(null, {'name': projects[0].projectname})
                    } else {
                        callback(null, {'name': 'Unknown'})
                    }
                }
            )
            break
        case 'environment':
            d4dModelNew.d4dModelMastersEnvironments.find(
                {rowid: entityId},
                function (err, environments) {
                    if (err) {
                        logger.error(err)
                        callback(internalServerError)
                    } else if (environments.length > 0) {
                        callback(null, {'name': environments[0].environmentname})
                    } else {
                        callback(null, {'name': 'Unknown'})
                    }
                }
            )
            break
            // NOTE: Works only for AWS regions as of now
        case 'region':
            if (entityId in appConfig.aws.regionMappings) {
                callback(null, {'name': appConfig.aws.regionMappings[entityId].name})
            } else {
                callback(null, {'name': 'Global'})
            }
            break
    }
}

/*analyticsService.getTrendUsage = function getTrendUsage(resourceId, interval, startTime, endTime, callback) {*/
analyticsService.getTrendUsage = function getTrendUsage(resourceId, interval, startTime, endTime, callback) {
    resourceMetricsModel.getByParams(resourceId, interval, startTime, endTime, function (err, datapoints) {
        if (err) {
            callback(err, null);
        } else {
            /* Format the data */
            var metric = formatData(datapoints);
            callback(null, metric);
        }
    });
}

formatData(null);

function formatData(datapoints) {
    var metric = {};

    if (datapoints != null && datapoints != undefined && datapoints.length > 0) {
        var metricNames = [];
        for (var key in datapoints[0].metrics) {
            if (datapoints[0].metrics.hasOwnProperty(key)) {
                metricNames.push(key);
            }
        }

        for (i = 0; i < metricNames.length; i++) {
            var metricName = metricNames[i];
            var metricObject = {};
            metricObject.unit = appConfig.aws.cwMetricsUnits[metricName];
            metricObject.symbol = appConfig.aws.cwMetricsDisplayUnits[metricName];

            var dataPoints = [];
            for (j = 0; j < datapoints.length; j++) {
                var datapointEntry = {};
                datapointEntry.fromTime = datapoints[j].startTime;
                datapointEntry.toTime = datapoints[j].endTime;
                for (statisticsKey in datapoints[j].metrics[metricName]) {
                    datapointEntry[statisticsKey] = datapoints[j].metrics[metricName][statisticsKey]
                }
                dataPoints.push(datapointEntry);
            }
            metricObject.dataPoints = dataPoints;
            metric[metricName] = metricObject;
        }
    }
    return metric;
}

// Only current capacity is aggregated
// @TODO Remove hard coding
// @TODO Refactor and reduce function size by redefining resource abstraction
analyticsService.aggregateEntityCapacity
    = function aggregateEntityCapacity(parentEntity, parentEntityId, endTime, callback) {

        var catalystEntityHierarchy = appConfig.catalystEntityHierarchy
        var platformServices = Object.keys(appConfig.aws.services).map(function (key) {
            return appConfig.aws.services[key]
        })

        var offset = (new Date()).getTimezoneOffset() * 60000
        // All start dates defaulted to beginning of month
        startTime = dateUtil.getStartOfAMonthInUTC(endTime)
        interval = 2592000

        var instanceParamsMapping = {
            'organizationId': 'orgId',
            'businessGroupId': 'bgId',
            'projectId': 'projectId',
            'environmentId': 'envId',
            'providerId': 'providerId'
        }

        var query, resourceQuery
        if (parentEntity == 'organization') {
            var query = {'orgId': parentEntityId}
            var resourceQuery = {'masterDetails.orgId': parentEntityId}
        }

        async.forEach(catalystEntityHierarchy[parentEntity].children, function (childEntity, next1) {
            var countParams = {
                $group: {
                    _id: "$" + instanceParamsMapping[catalystEntityHierarchy[childEntity].key],
                    count: {$sum: 1}
                }
            }

            var resourceCountParams
            if (childEntity == 'provider') {
                resourceCountParams = {
                    $group: {
                        _id: "$providerDetails."
                            + instanceParamsMapping[catalystEntityHierarchy[childEntity].key],
                        count: {$sum: 1}
                    }
                }
            } else {
                resourceCountParams = {
                    $group: {
                        _id: "$masterDetails."
                            + instanceParamsMapping[catalystEntityHierarchy[childEntity].key],
                        count: {$sum: 1}
                    }
                }
            }

            async.parallel({
                'managed': function (next0) {
                    instancesModel.aggregate([
                        {$match: query},
                        countParams], next0)
                },
                'assigned': function (next0) {
                    if (childEntity == 'environment') {
                        assignedInstancesModel.aggregate([
                            {$match: query},
                            {
                                $group: {
                                    _id: "$" + catalystEntityHierarchy[childEntity].key,
                                    count: {$sum: 1}
                                }
                            }], next0)
                    } else {
                        assignedInstancesModel.aggregate([
                            {$match: query},
                            countParams], next0)
                    }
                },
                'unassigned': function (next0) {
                    unassignedInstancesModel.aggregate([
                        {$match: query},
                        countParams], next0)
                },
                'S3': function (next0) {
                    var s3Query = resourceQuery
                    s3Query.resourceType = 's3'

                    resourcesModel.aggregate([
                        {$match: s3Query},
                        resourceCountParams], next0)
                },
                'RDS': function (next0) {
                    var rdsQuery = resourceQuery
                    rdsQuery.resourceType = 'rds'

                    resourcesModel.aggregate([
                        {$match: rdsQuery},
                        resourceCountParams], next0)
                }
            }, function (err, instanceCounts) {
                if (err) {
                    next1(err)
                } else {
                    var entityCapacities = {}

                    for (var key in instanceCounts) {
                        for (var i = 0; i < instanceCounts[key].length; i++) {
                            var entityId = (instanceCounts[key][i]._id == null)
                                ? 'Unassigned' : instanceCounts[key][i]._id
                            var count = (instanceCounts[key][i].count == null) ? 0 : instanceCounts[key][i].count

                            if (!(entityId in entityCapacities)) {
                                entityCapacities[entityId] = {
                                    entity: {
                                        id: entityId,
                                        type: childEntity
                                    },
                                    parentEntity: {
                                        id: parentEntityId,
                                        type: parentEntity
                                    },
                                    capacity: {
                                        'totalCapacity': 0,
                                        'AWS': {
                                            'totalCapacity': 0,
                                            'services': {
                                                'EC2': 0,
                                                'RDS': 0,
                                                'S3': 0
                                            }
                                        }
                                    },
                                    startTime: Date.parse(startTime),
                                    endTime: Date.parse(endTime),
                                    period: 'month',
                                    interval: interval
                                }
                            }

                            entityCapacities[entityId].capacity.totalCapacity += count
                            entityCapacities[entityId].capacity.AWS.totalCapacity += count
                            if (['managed', 'unassigned', 'assigned'].indexOf(key) > -1) {
                                entityCapacities[entityId].capacity.AWS.services['EC2'] += count
                            } else {
                                entityCapacities[entityId].capacity.AWS.services[key] += count
                            }
                        }
                    }

                    if (Object.keys(entityCapacities).length > 0)
                        analyticsService.updateEntityCapacity(entityCapacities, next1)
                    else
                        next1()

                }
            })
        },
            function (err) {
                if (err) {
                    callback(err)
                } else {
                    callback()
                }
            });
    }

analyticsService.updateEntityCapacity = function updateEntityCapacity(entityCapacities, callback) {
    async.forEach(entityCapacities,
        function (entityCapacity, next) {
            entityCapacityModel.upsertEntityCapacity(entityCapacity, next)
        },
        function (err) {
            if (err)
                return callback(err)

            return callback()
        }
    )
}

// @TODO To be reviewed and improved
analyticsService.validateAndParseCapacityQuery
    = function validateAndParseCapacityQuery(requestQuery, callback) {

        if ((!('parentEntityId' in requestQuery)) || (!('entityId' in requestQuery))
            || (!('toTimeStamp' in requestQuery)) || (!('period' in requestQuery))) {
            var err = new Error('Invalid request')
            err.errors = [{messages: 'Mandatory fields missing'}]
            err.status = 400
            callback(err)
        }

        var startTime
        switch (requestQuery.period) {
            case 'month':
                // startTime = dateUtil.getStartOfADayInUTC(requestQuery.toTimeStamp)
                // All start dates defaulted to beginning of month
                startTime = dateUtil.getStartOfAMonthInUTC(requestQuery.toTimeStamp)
                break
            default:
                var err = new Error('Invalid request')
                err.errors = [{messages: 'Period is invalid'}]
                err.status = 400
                return callback(err)
                break
        }

        //@TODO Query object format to be changed
        var capacityQuery = {
            totalCapacityQuery: [
                {'parentEntity.id': requestQuery.parentEntityId},
                {'entity.id': requestQuery.entityId},
                {'startTime': Date.parse(startTime)},
                {'period': requestQuery.period}
            ],
            splitUpCapacityQuery: [
                {'parentEntity.id': requestQuery.entityId},
                {'startTime': Date.parse(startTime)},
                {'period': requestQuery.period}
            ]
        }

        return callback(null, capacityQuery)
    }

analyticsService.getEntityCapacity = function getEntityCapacity(capacityQuery, callback) {
    async.parallel({
        totalCapacity: function (next) {
            entityCapacityModel.getEntityCapacity(capacityQuery.totalCapacityQuery, next)
        },
        splitUpCapacities: function (next) {
            entityCapacityModel.getEntityCapacity(capacityQuery.splitUpCapacityQuery, next)
        }
    }, function (err, entityCapacity) {
        if (err) {
            logger.error(err)
            var err = new Error('Internal Server Error')
            err.status = 500
            return callback(err)
        } else if (entityCapacity.totalCapacity == null) {
            var err = new Error('Data not available')
            err.status = 400
            return callback(err)
        } else {
            return callback(null, entityCapacity)
        }
    })
}

// @TODO Try to opitmize
analyticsService.formatEntityCapacity = function formatEntityCapacity(entityCapacities, callback) {
    async.waterfall([
        function (next) {
            var formattedCapacity = {
                period: entityCapacities.totalCapacity[0].period,
                fromTime: entityCapacities.totalCapacity[0].startTime,
                toTime: entityCapacities.totalCapacity[0].endTime,
                entity: {
                    type: entityCapacities.totalCapacity[0].entity.type,
                    id: entityCapacities.totalCapacity[0].entity.id
                },
                capacity: entityCapacities.totalCapacity[0].capacity,
                splitUpCapacities: {}
            }

            if (formattedCapacity.entity.id != 'Unassigned') {
                analyticsService.getEntityDetails(formattedCapacity.entity.type,
                    formattedCapacity.entity.id,
                    function (err, entityDetails) {
                        if (err) {
                            next(err)
                        } else {
                            formattedCapacity.entity.name = entityDetails.name
                            next(null, formattedCapacity)
                        }
                    }
                )
            } else {
                formattedCapacity.entity.name = formattedCapacity.entity.id
                next(null, formattedCapacity)
            }
        },
        function (formattedCapacity, next) {
            async.forEach(entityCapacities.splitUpCapacities,
                function (capacityEntry, next0) {
                    if (capacityEntry.entity.type == entityCapacities.totalCapacity[0].entity.type) {
                        return next0()
                    }

                    if (!(capacityEntry.entity.type in formattedCapacity.splitUpCapacities)) {
                        formattedCapacity.splitUpCapacities[capacityEntry.entity.type] = []
                    }

                    var splitUpCapacity = {
                        id: capacityEntry.entity.id,
                        // name: costEntry.entity.name,
                        capacity: capacityEntry.capacity
                    }

                    if (capacityEntry.entity.id != 'Unassigned') {
                        analyticsService.getEntityDetails(capacityEntry.entity.type, capacityEntry.entity.id,
                            function (err, entityDetails) {
                                if (err) {
                                    next0(err)
                                } else {
                                    splitUpCapacity.name = entityDetails.name
                                    formattedCapacity.splitUpCapacities[capacityEntry
                                        .entity.type].push(splitUpCapacity)
                                    next0()
                                }
                            }
                        )
                    } else {
                        splitUpCapacity.name = capacityEntry.entity.id
                        formattedCapacity.splitUpCapacities[capacityEntry
                            .entity.type].push(splitUpCapacity)
                        next0()
                    }
                },
                function (err) {
                    if (err) {
                        return next(err)
                    } else {
                        return next(null, formattedCapacity)
                    }
                }
            )
        }
    ], function (err, formattedCapacity) {
        if (err) {
            logger.error(err)
            var err = new Error('Internal Server Error')
            err.status = 500
            callback(err)
        } else {
            return callback(null, formattedCapacity)
        }
    })
}