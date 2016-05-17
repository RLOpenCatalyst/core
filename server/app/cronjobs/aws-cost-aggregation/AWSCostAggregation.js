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
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');

var AggregateAWSCost = Object.create(CatalystCronJob);
AggregateAWSCost.interval = '* * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    async.waterfall([
        function(next){
            MasterUtils.getAllActiveOrg(next);
        },
        function(orgs,next){
            async.forEach(orgs,function(organization,next){
                async.waterfall([
                    function(next){
                        AWSProvider.getAWSProvidersByOrgId(organization._id,next)
                    },
                    function(providers,next){
                        if(providers.length > 0){
                            async.forEach(providers,function(provider,next){
                                
                            })
                        }else{
                            callBackReturn(providers,next);
                        }
                    }],
                    function (err, results) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                    });
            });
        }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }
            console.log(results);
        });
}

function callBackReturn(data,callback){
    callback(null,data);
};









