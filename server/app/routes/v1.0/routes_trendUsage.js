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
var async = require('async');
var analyticsService = require('_pr/services/analyticsService');
module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/analytics/*', sessionVerificationFunc);


    /**
     * @api {get} /analytics/trend/usage?resource=<resourceId>&fromTimeStamp=<startDate>&toTimeStamp=<endDate>&interval=<INTERVAL>&metric=<METRIC>
     * 										                    									Get usage trend.
     * @apiName getTrendUsage
     * @apiGroup analytics
     * @apiVersion 1.0.0
     * @apiDescription  The api returns only 500 data points. If your query exceeds the limit, you will get an error response. Try resubmitting the query with smaller range
     * 
     * @apiParam {String} resource																	ResourceId
     * @apiParam {Date} fromTimeStamp																Start Time Stamp, inclusive. Format YYYY-MM-DDTHH:MM:SS. For Ex: 2016-07-29T00:00:00
     * @apiParam {Date} toTimeStamp																	End Time Stamp, exclusive. Format YYYY-MM-DDTHH:MM:SS.  For Ex: 2016-07-29T00:05:00																
     * @apiParam {String} interval																	Frequency in seconds. For Ex: 3600
     * @apiParam {String} [metric="All Metrics"]													Filter particular metrics. For Ex: CPUUtilization,DiskReadBytes
     * @apiParam {String} [statistics="All Statistics"]												Filter particular statistics. For Ex: Average,Minimum
     *
     * @apiExample Sample_Request_1
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&interval=1_MINUTE 
     * 
     * @apiExample Sample_Request_2
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&interval=1_MINUTE&metric=CPUUtilization
     * 
     * @apiExample Sample_Request_3
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T00:05:00&interval=1_MINUTE&metric=CPUUtilization&statistics=Average,Minimum
     * 
     * @apiExample Sample_Request_4
     * 		/analytics/trend/usage?resource=5790c31edff2c49223fd6efa&fromTimeStamp=2016-07-29T00:00:00&toTimeStamp=2016-07-29T24:00:00&interval=1_HOUR&metric=CPUUtilization
     * 
     * @apiSuccess {Object}   trend 	                 		  Trend
     * @apiSuccess {Object}   trend.METRIC	    				  Usage Metric Name
     * @apiSuccess {String}   trend.METRIC.unit	    		      Usage Metric Unit
     * @apiSuccess {String}   trend.METRIC.symbol	    		  Usage Metric Symbol
     * @apiSuccess {Object[]} trend.METRIC.datePoints  		      Usage Metric DataPoints
     * @apiSuccess {Date}     trend.METRIC.datePoints.fromTime    Usage Metric Start Time
     * @apiSuccess {Date}     trend.METRIC.datePoints.toTime      Usage Metric End Time
     * @apiSuccess {Number}   trend.METRIC.datePoints.minimum     Usage Metric Minimum
     * @apiSuccess {Number}   trend.METRIC.datePoints.maximum     Usage Metric Maximum
     * @apiSuccess {Number}   trend.METRIC.datePoints.average     Usage Metric Average
     * 
     * @apiSuccessExample {json} Sample_Response_1:
     * 	HTTP/1.1 200 OK
     * 
     *  {
		  "CPUUtilization": {
		    "unit": "Percentage",
		    "symbol": "%",
		    "dataPoints": [
		      {
		        "fromTime": "2016-07-29T00:00:01",
		        "toTime": "2016-07-29T00:01:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T00:01:01",
		        "toTime": "2016-07-29T00:02:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T00:02:01",
		        "toTime": "2016-07-29T00:03:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T00:03:01",
		        "toTime": "2016-07-29T00:04:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T00:04:01",
		        "toTime": "2016-07-29T00:05:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      }
		    ]
		  },
		  "DiskReadBytes": {
		    "unit": "Bytes",
		    "symbol": "Bytes",
		    "dataPoints": [
		      {
		        "fromTime": "2016-07-29T00:00:01",
		        "toTime": "2016-07-29T00:01:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T00:01:01",
		        "toTime": "2016-07-29T00:02:00",
		        "maximum": 200,
		        "minimum": 200,
		        "average": 200
		      },
		      {
		        "fromTime": "2016-07-29T00:02:01",
		        "toTime": "2016-07-29T00:03:00",
		        "maximum": 1000,
		        "minimum": 500,
		        "average": 750
		      },
		      {
		        "fromTime": "2016-07-29T00:03:01",
		        "toTime": "2016-07-29T00:04:00",
		        "maximum": 400,
		        "minimum": 400,
		        "average": 400
		      },
		      {
		        "fromTime": "2016-07-29T00:04:01",
		        "toTime": "2016-07-29T00:05:00",
		        "maximum": 625,
		        "minimum": 620,
		        "average": 623
		      }
		    ]
		  }
		}
	 *
	 *@apiSuccessExample {json} Sample_Response_2:
     * 	HTTP/1.1 200 OK
     * 
     * {
		  "CPUUtilization": {
		    "unit": "Percentage",
		    "symbol": "%",
		    "dataPoints": [
		      {
		        "fromTime": "2016-07-29T00:00:01",
		        "toTime": "2016-07-29T00:01:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T00:01:01",
		        "toTime": "2016-07-29T00:02:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T00:02:01",
		        "toTime": "2016-07-29T00:03:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T00:03:01",
		        "toTime": "2016-07-29T00:04:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T00:04:01",
		        "toTime": "2016-07-29T00:05:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      }
		    ]
		  }
		}
	 *
	 *@apiSuccessExample {json} Sample_Response_3:
     * 	HTTP/1.1 200 OK
     * 
     * {
		  "CPUUtilization": {
		    "unit": "Percentage",
		    "symbol": "%",
		    "dataPoints": [
		      {
		        "fromTime": "2016-07-29T00:00:01",
		        "toTime": "2016-07-29T00:01:00",
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T00:01:01",
		        "toTime": "2016-07-29T00:02:00",
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T00:02:01",
		        "toTime": "2016-07-29T00:03:00",
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T00:03:01",
		        "toTime": "2016-07-29T00:04:00",
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T00:04:01",
		        "toTime": "2016-07-29T00:05:00",
		        "minimum": 0.12,
		        "average": 0.12
		      }
		    ]
		  }
		}
	 *
	 *@apiSuccessExample {json} Sample_Response_4:
     * 	HTTP/1.1 200 OK
     * 
     * {
		  "CPUUtilization": {
		    "unit": "Percentage",
		    "symbol": "%",
		    "dataPoints": [
		      {
		        "fromTime": "2016-07-29T00:00:01",
		        "toTime": "2016-07-29T01:00:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T01:00:01",
		        "toTime": "2016-07-29T02:00:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T02:00:01",
		        "toTime": "2016-07-29T03:00:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T03:00:01",
		        "toTime": "2016-07-29T04:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T04:00:01",
		        "toTime": "2016-07-29T05:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      },
		      {
		        "fromTime": "2016-07-29T05:00:01",
		        "toTime": "2016-07-29T06:00:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T06:00:01",
		        "toTime": "2016-07-29T07:00:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T07:00:01",
		        "toTime": "2016-07-29T08:00:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T08:00:01",
		        "toTime": "2016-07-29T09:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T09:00:01",
		        "toTime": "2016-07-29T10:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      },
		      {
		        "fromTime": "2016-07-29T10:00:01",
		        "toTime": "2016-07-29T11:00:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T11:00:01",
		        "toTime": "2016-07-29T12:00:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T12:00:01",
		        "toTime": "2016-07-29T13:00:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T13:00:01",
		        "toTime": "2016-07-29T14:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T14:00:01",
		        "toTime": "2016-07-29T15:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      },
		      {
		        "fromTime": "2016-07-29T15:00:01",
		        "toTime": "2016-07-29T16:00:00",
		        "maximum": 0.83,
		        "minimum": 0,
		        "average": 0.035
		      },
		      {
		        "fromTime": "2016-07-29T16:00:01",
		        "toTime": "2016-07-29T17:00:00",
		        "maximum": 0.82,
		        "minimum": 0.81,
		        "average": 0.81
		      },
		      {
		        "fromTime": "2016-07-29T17:00:01",
		        "toTime": "2016-07-29T18:00:00",
		        "maximum": 0.35,
		        "minimum": 0.33,
		        "average": 0.34
		      },
		      {
		        "fromTime": "2016-07-29T18:00:01",
		        "toTime": "2016-07-29T19:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T19:00:01",
		        "toTime": "2016-07-29T20:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      },
		      {
		        "fromTime": "2016-07-29T20:00:01",
		        "toTime": "2016-07-29T21:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T21:00:01",
		        "toTime": "2016-07-29T22:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      },
		      {
		        "fromTime": "2016-07-29T22:00:01",
		        "toTime": "2016-07-29T23:00:00",
		        "maximum": 0,
		        "minimum": 0,
		        "average": 0
		      },
		      {
		        "fromTime": "2016-07-29T23:00:01",
		        "toTime": "2016-07-29T24:00:00",
		        "maximum": 0.12,
		        "minimum": 0.12,
		        "average": 0.12
		      }
		    ]
		  }
		}
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
		/*res.status(200).send(req.query);*/
		async.waterfall([
            /* @TODO Check if user has access to the specified organization
             * 1. Check for validation of query parameters
             * 2. Get the organizational details for the resource
             * 3. Check if the user is authorized to access the resource details
             * 4. Make a query to get the usage metrics details
             * 
             */
            function(callback) {
            	analyticsService.getTrendUsage(req.query.resource, req.query.interval, req.query.fromTimeStamp, req.query.toTimeStamp, callback);
            }
        ], function(err, usageMetrics) {
            if(err) {
            	next(err);
            } else {
                res.status(200).send(usageMetrics);
            }
        });
	}
}