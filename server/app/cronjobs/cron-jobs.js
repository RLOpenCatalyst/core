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

"use strict"
var fs = require('fs')
var crontab = require('node-crontab');
var logger = require('_pr/logger')(module);
var costAggregation = require('_pr/cronjobs/aws-cost-aggregation');
var capacityAggregation = require('_pr/cronjobs/aws-capacity-aggregation');
var usageAggregation = require('_pr/cronjobs/aws-usage-aggregation');
var providerSync = require('_pr/cronjobs/provider-sync');
var providerTagsAggregation = require('_pr/cronjobs/provider-tags-aggregation');
var dockerContainerSync = require('_pr/cronjobs/docker-container-sync');
var awsRDSS3ProviderSync = require('_pr/cronjobs/provider-rds-s3-sync');
var chefSync = require('_pr/cronjobs/chef-sync');
var taskSync = require('_pr/cronjobs/task-sync');

module.exports.start = function start() {

	/*logger.info('Cost aggregation started with interval ==> '+ costAggregation.getInterval());
	var costAggregationJobId
		= crontab.scheduleJob(costAggregation.getInterval(), costAggregation.execute);

	logger.info('Capacity aggregation started with interval ==> '+ capacityAggregation.getInterval());
	var capacityAggregationJobId
		= crontab.scheduleJob(capacityAggregation.getInterval(), capacityAggregation.execute);

	logger.info('Usage aggregation started with interval ==> '+ usageAggregation.getInterval());
	var usageAggregationJobId
		= crontab.scheduleJob(usageAggregation.getInterval(), usageAggregation.execute);

	logger.info('Provider Sync started with interval ==> '+ providerSync.getInterval());
	var providerSyncJobId = crontab.scheduleJob(providerSync.getInterval(), providerSync.execute);

	logger.info('Tags aggregation started with interval ==> '+ providerTagsAggregation.getInterval());
	var providerTagsAggregationJobId
		= crontab.scheduleJob(providerTagsAggregation.getInterval(), providerTagsAggregation.execute);

	logger.info('Docker Container Sync started with interval ==> '+ dockerContainerSync.getInterval());
	var dockerContainerSyncJobId
		= crontab.scheduleJob(dockerContainerSync.getInterval(), dockerContainerSync.execute);

	 logger.info('AWS S3 and RDS Provider Sync started with interval ==> '+ awsRDSS3ProviderSync.getInterval());
	var awsRDSS3ProviderSyncJobId
		= crontab.scheduleJob(awsRDSS3ProviderSync.getInterval(), awsRDSS3ProviderSync.execute);

	logger.info('Chef Sync started with interval ==> '+ chefSync.getInterval());
	var chefSyncJobId
		= crontab.scheduleJob(chefSync.getInterval(), chefSync.execute);*/

	logger.info('Task Sync started with interval ==> '+ taskSync.getInterval());
	var taskSyncJobId
		= crontab.scheduleJob(taskSync.getInterval(), taskSync.execute);

}