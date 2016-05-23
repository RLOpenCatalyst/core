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
var costUsageAggregation = require('_pr/cronjobs/cost-usage-aggregation');
var providerSync = require('_pr/cronjobs/provider-sync');
var providerTagsAggregation = require('_pr/cronjobs/provider-tags-aggregation');
var dockerContinerSync = require('_pr/cronjobs/docker-container-sync');

module.exports.start = function start() {
	logger.info('Cost usage aggregation started with interval ==> '+ costUsageAggregation.getInterval());
	var costUsageAggregationJobId
		= crontab.scheduleJob(costUsageAggregation.getInterval(), costUsageAggregation.execute);

	logger.info('Provider Sync started with interval ==> '+ providerSync.getInterval());
	var providerSyncJobId = crontab.scheduleJob(providerSync.getInterval(), providerSync.execute);

	logger.info('Tags aggregation started with interval ==> '+ providerTagsAggregation.getInterval());
	var providerTagsAggregationJobId
		= crontab.scheduleJob(providerTagsAggregation.getInterval(), providerTagsAggregation.execute);

	logger.info('Docker container sync started with interval ==> '+ dockerContinerSync.getInterval());
	var dockerContinerSyncJobId
		= crontab.scheduleJob(dockerContinerSync.getInterval(), dockerContinerSync.execute);

}