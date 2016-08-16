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
var appConfig = require('_pr/config');
var analyticsService = module.exports = {};

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