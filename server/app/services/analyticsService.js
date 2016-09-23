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
var resourceCostsModel =  require('_pr/model/resource-costs')
var entityCostsModel =  require('_pr/model/entity-costs')
const dateUtil = require('_pr/lib/utils/dateUtil')
var appConfig = require('_pr/config');
var async = require('async')

var analyticsService = module.exports = {};

analyticsService.validateAndParseCostQuery = function validateAndParseCostQuery(requestQuery, callback) {
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
			startTime = dateUtil.getStartOfAMonthInUTC(requestQuery.toTimeStamp)
			break
		default:
			var err = new Error('Invalid request')
			err.errors = [{messages: 'Period is invalid'}]
			err.status = 400
			callback(err)
			break
	}

	var totalQuery = {
		'parentEntity.id': requestQuery.parentEntityId,
		'entity.id': requestQuery.entityId,
		'startTime': Date.parse(startTime),
		'period': requestQuery.period
	}

	var splitUpQuery = {
		'parentEntity.id': requestQuery.entityId,
		'startTime': Date.parse(startTime),
		'period': requestQuery.period
	}

	return callback(null, totalQuery, splitUpQuery)
}

analyticsService.getEntityAggregateCosts = function getEntityAggregateCosts(totalQuery, splitUpQuery, callback) {
	async.parallel({
		totalCost: function(next) {
			entityCostsModel.getEntityCost(totalQuery, next)
		},
		splitUpCosts: function(next) {
			entityCostsModel.getEntityCost(splitUpQuery, next)
		}
	}, function(err, entityCosts) {
		if(err) {
			logger.error(err)
			var err = new Error('Internal Server Error')
			err.status = 500
			return callback(err)
		} else {
			return callback(null, entityCosts)
		}
	})
}

analyticsService.formatAggregateCost = function formatAggregateCost(entityCosts, callback) {
	var catalystEntityHierarchy = appConfig.catalystEntityHierarchy

	var formattedAggregateCost = {
		period: entityCosts.totalCost[0].period,
		fromTime: entityCosts.totalCost[0].startTime,
		toTime: entityCosts.totalCost[0].endTime,
		entity: {
			type: entityCosts.totalCost[0].entity.type,
			id: entityCosts.totalCost[0].entity.id,
			name: entityCosts.totalCost[0].entity.id
		},
		cost: {
			totalCost: entityCosts.totalCost[0].costs.totalCost,
			AWS: {
				totalCost: entityCosts.totalCost[0].costs.totalCost,
				serviceCosts: {
					Other: entityCosts.totalCost[0].costs.totalCost
				}
			}
		},
		splitUpCosts: {}
	}

	async.forEach(entityCosts.splitUpCosts,
		function(costEntry, next) {
			if(costEntry.entity.type == entityCosts.totalCost[0].entity.type) {
				return next()
			}

			if(!(costEntry.entity.type in formattedAggregateCost.splitUpCosts)) {
				formattedAggregateCost.splitUpCosts[costEntry.entity.type] = []
			}

			var splitUpCost = {
				id: costEntry.entity.id,
				name: costEntry.entity.id,
				cost: {
					totalCost: costEntry.costs.totalCost,
					AWS: {
						totalCost: costEntry.costs.totalCost,
						serviceCosts: {
							Other: costEntry.costs.totalCost
						}
					}
				}
			}

			formattedAggregateCost.splitUpCosts[costEntry.entity.type].push(splitUpCost)
			next()
		},
		function(err) {
			if(err) {
				logger.error(err)
				var err = new Error('Internal Server Error')
				err.status = 500
				return callback(err)
			} else {
				return callback(null, formattedAggregateCost)
			}
		}
	)

}


/*analyticsService.getTrendUsage = function getTrendUsage(resourceId, interval, startTime, endTime, callback) {*/
function getTrendUsage(resourceId, interval, startTime, endTime, callback) {
	resourceMetricsModel.getByParams(resourceId, interval, startTime, endTime, function(err, datapoints){
		if(err) {
			callback(err, null);
        } else {
        	/* Format the data */
        	var metric = formatData(datapoints);
        	callback(null, metric);
        }
	});	
}

formatData(null);

function formatData(datapoints){
	var metric = {};
	
	if(datapoints != null && datapoints != undefined && datapoints.length > 0){
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

analyticsService.getTrendUsage = getTrendUsage;