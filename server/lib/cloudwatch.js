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
    var cloudwatch = new aws.CloudWatch({
        "accessKeyId": awsSettings.access_key,
        "secretAccessKey": awsSettings.secret_key,
        "region": awsSettings.region
    });
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
    this.getTotalCostMaximum = function(callback){
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
    this.getTotalCostMinimum = function(nodes,callback){
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
}

module.exports = CW;