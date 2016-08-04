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

module.exports.setRoutes = function(app, sessionVerificationFunc) {
	
	/**
     * @api {get} /analytics/trend/usage?resource=<resourceId>&fromTimeStamp=<startDate>&toTimeStamp=<endDate>&seggregateBy=<INTERVAL>&metric=<METRIC>
     * 										                    									Get usage trend
     * @apiName getTrendUsage
     * @apiGroup analytics
     * @apiVersion 1.0.0
     * 
     * @apiParam {String} resource																	ResourceId
     * @apiParam {Date} fromTimeStamp																Start Time Stamp. Format YYYY-MM-DDTHH:MM:SS. For Ex: 2016-07-29T00:00:00
     * @apiParam {Date} toTimeStamp																	End Time Stamp. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-07-29T00:05:00																
     * @apiParam {String} [seggregateBy="All Intervals"]											Filter only particular interval. For Ex: 1_MINUTE, 5_MINUTES, 1_HOUR, 6_HOURS, 1_MONTH, 6_MONTHS, 1_YEAR
     * @apiParam {String} [metric="All Metrics"]													Filter only particular metric. For Ex: CPUUtilization
     * @apiParam {Number} [page=1] 																	Page
     * @apiParam {Number} [pageSize=500]															Records per metric 
     *
     * @apiExample Sample_Request_1
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00 
     * 
     * @apiExample Sample_Request_2
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&seggregateBy=1_MINUTE
     * 
     * @apiExample Sample_Request_3
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&seggregateBy=1_MINUTE&metric=CPUUtilization
     * 
     * @apiSuccess {Object}   trend 	                 				   Trend
     * @apiSuccess {Object}   trend.INTERVAL		    				   Interval, For Ex: 1_MINUTE, 5_MINUTES, 1_HOUR, 6_HOURS, 1_MONTH, 6_MONTHS, 1_YEAR 
     * @apiSuccess {Object}   trend.INTERVAL.METRIC	    				   Usage Metric Name
     * @apiSuccess {String}   trend.INTERVAL.METRIC.unit	    		   Usage Metric Unit
     * @apiSuccess {Object[]} trend.INTERVAL.METRIC.datePoints  		   Usage Metric DataPoints
     * @apiSuccess {Date}     trend.INTERVAL.METRIC.datePoints.fromTime    Usage Metric Start Time
     * @apiSuccess {Date}     trend.INTERVAL.METRIC.datePoints.toTime      Usage Metric End Time
     * @apiSuccess {Number}   trend.INTERVAL.METRIC.datePoints.minimum     Usage Metric Minimum
     * @apiSuccess {Number}   trend.INTERVAL.METRIC.datePoints.maximum     Usage Metric Maximum
     * @apiSuccess {Number}   trend.INTERVAL.METRIC.datePoints.average     Usage Metric Average
     * 
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     * 
     *  {
		  "1_MINUTE": {
		    "CPUUtilization": {
		      "unit": "Percentage",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:00:59",
		          "maximum": 0.83,
		          "minimum": 0,
		          "average": 0.03549128919860638
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    },
		    "DiskReadBytes": {
		      "unit": "Bytes",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:00:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:02:00",
		          "toTime": "2016-07-29T00:02:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:03:00",
		          "toTime": "2016-07-29T00:03:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:04:00",
		          "toTime": "2016-07-29T00:04:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    }
		  },
		  "5_MINUTES": {
		    "CPUUtilization": {
		      "unit": "Percentage",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:04:59",
		          "maximum": 0.83,
		          "minimum": 0,
		          "average": 0.03549128919860638
		        }
		      ]
		    },
		    "DiskReadBytes": {
		      "unit": "Bytes",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:04:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    }
		  }
		}
	 *
	 *@apiSuccessExample {json} Sample_Response_2:
     * 	HTTP/1.1 200 OK
     * 
     * {
		  "1_MINUTE": {
		    "CPUUtilization": {
		      "unit": "Percentage",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:00:59",
		          "maximum": 0.83,
		          "minimum": 0,
		          "average": 0.03549128919860638
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    },
		    "DiskReadBytes": {
		      "unit": "Bytes",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:00:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:02:00",
		          "toTime": "2016-07-29T00:02:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:03:00",
		          "toTime": "2016-07-29T00:03:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:04:00",
		          "toTime": "2016-07-29T00:04:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    }
		  }
		}
	 *
	 *@apiSuccessExample {json} Sample_Response_3:
     * 	HTTP/1.1 200 OK
     * 
     * {
		  "1_MINUTE": {
		    "CPUUtilization": {
		      "unit": "Percentage",
		      "dataPoints": [
		        {
		          "fromTime": "2016-07-29T00:00:00",
		          "toTime": "2016-07-29T00:00:59",
		          "maximum": 0.83,
		          "minimum": 0,
		          "average": 0.03549128919860638
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        },
		        {
		          "fromTime": "2016-07-29T00:01:00",
		          "toTime": "2016-07-29T00:01:59",
		          "maximum": 0,
		          "minimum": 0,
		          "average": 0
		        }
		      ]
		    }
		  }
		}
	 *
	 *
	 * @apiErrorExample {json} Error-Response:
	 *     HTTP/1.1 404 Not Found
	 *     {
	 *       "errorCode": "ResourceNotFound"
	 *       "errorMessage": "The resource for which you are trying to obtain usage metrics does not exist in the records"
	 *     }
	 * 		
     */
	app.get("/analytics/trend/usage", getTrendUsage);
	function getTrendUsage(req, res, next) {
		
	}
}