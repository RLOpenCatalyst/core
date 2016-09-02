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


var aws = require('aws-sdk');
var logger = require('_pr/logger')(module);


if (process.env.http_proxy) {
    aws.config.update({
        httpOptions: {
            proxy: process.env.http_proxy
        }
    });
}

// var cloudwatch = new AWS.CloudWatch();
// cloudwatch.deleteAlarms(params, function (err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
// });

var CW = function(awsSettings) {

    var params = new Object();

    if (typeof awsSettings.region !== undefined) {
        params.region = awsSettings.region;
    }

    if (typeof awsSettings.isDefault !== undefined && awsSettings.isDefault === true) {
        params.credentials = new aws.EC2MetadataCredentials({httpOptions: {timeout: 5000}});
    } else if (typeof awsSettings.access_key !== undefined && typeof awsSettings.secret_key !== undefined) {
        params.accessKeyId = awsSettings.access_key;
        params.secretAccessKey = awsSettings.secret_key;
    }

    var cloudwatch = new aws.CloudWatch(params);

    var date = new Date();
    //var last = new Date(date.getHours());
    var last = new Date(date.getTime() -(1000*60*60*6+(1000*60*30)));
    //var date1 = new Date(date.getTime() -(1000*60*60*24));
    var last1 = new Date(date.getTime() -(1000*60*60*24));
    var params = {
      EndTime: date,
      /* required */
      MetricName: 'EstimatedCharges',
      /* required */
      Namespace: 'AWS/Billing',
      /* required */
      Period: 86400,
      /* required */
      StartTime: last,
      /* required */
      Statistics: [ /* required */
          'Maximum'
          /* more items */
      ],
      Dimensions: [
          /**    {
                   Name: 'ServiceName', 
                   Value: 'AmazonEC2'
                 },**/
          {
              Name: 'LinkedAccount',
              Value: '549974527830'
          }, {
              Name: 'Currency',
              Value: 'USD'
          }
      ],
    };
    var params1 = {
      EndTime: date,
      /* required */
      MetricName: 'EstimatedCharges',
      /* required */
      Namespace: 'AWS/Billing',
      /* required */
      Period: 86400,
      /* required */
      StartTime: last1,
      /* required */
      Statistics: [ /* required */
          'Minimum'
          /* more items */
      ],
      Dimensions: [
          /**    {
                   Name: 'ServiceName', 
                   Value: 'AmazonEC2'
                 },**/
          {
              Name: 'LinkedAccount',
              Value: '549974527830'
          }, {
              Name: 'Currency',
              Value: 'USD'
          }
      ],
    };

    this.getTotalCostMaximum = function getTotalCostMaximum(callback) {
        cloudwatch.getMetricStatistics(params,function(err,data){
            if(err){
                logger.debug("Error occurred for listing aws instances: ",err);
                callback(err,null);
            }else{
                logger.debug("Able to list all aws maximum instances: ");
                //logger.debug(JSON.stringify(data));
                callback(null,data.Datapoints[0].Maximum);
            }
        });
    };

    this.getTotalCostMinimum = function getTotalCostMinimum(nodes,callback) {
        cloudwatch.getMetricStatistics(params1,function(err,data1){
            if(err){
                logger.debug("Error occurred for listing aws instances: ",err);
                callback(err,null);
            }else{
                logger.debug("Able to list all aws minimum instances: ");
                //logger.debug(JSON.stringify(data1));
                var uptoTodayTotalCost = nodes;
                var uptoYesterdayTotalCost = data1.Datapoints[0].Minimum;
                var todayTotalCost = uptoTodayTotalCost - uptoYesterdayTotalCost;
                //callback(null,data1.Datapoints[0].Minimum);
                callback(null,todayTotalCost);
            }
        });
    };

    // @TODO Try to reduce number of parameters
    this.getUsageMetrics = function getUsageMetrics(metric, unit,nameSpace, dimensions, startTime, endTime, period, callback) {
    	var params = {
            EndTime: endTime,
            MetricName: metric,
            Namespace: nameSpace,
            Period: period,
            StartTime: startTime,
            Statistics: ['Average', 'Minimum', 'Maximum'],
            Dimensions: dimensions,
            Unit: unit
        };
        cloudwatch.getMetricStatistics(params,function(err, data) {
            if(err) {
            	callback(err,null);
            }else if(data.Datapoints.length > 0) {
            	var result = {
                        average: data.Datapoints[0].Average,
                        minimum: data.Datapoints[0].Minimum,
                        maximum: data.Datapoints[0].Maximum
                    };
                	callback(null, result);
            } else if(data.Datapoints.length == 0) {
                	var result = {
                        average: 0,
                        minimum: 0,
                        maximum: 0
                    };
                    callback(null, result);
            }
            //TODO: Need to every point
            /*else{
            	callback(null, data.Datapoints);
            }*/
        });
    };
    
    this.getTotalCost =function getTotalCost(startTime,endTime,statistics,dimensions,callback){
        var params =
        {
            EndTime: endTime,
            MetricName: 'EstimatedCharges',
            Namespace: 'AWS/Billing',
            Period: 86400,
            StartTime: startTime,
            Statistics: [statistics],
            Dimensions:dimensions ,
        };
        cloudwatch.getMetricStatistics(params,function(err,data){
            if(err){
                logger.debug("Error occurred for cost metrics: ",err);
                callback(err,null);
            }else{
                callback(null,data.Datapoints[0]);
            }
        });
    };

}

module.exports = CW;