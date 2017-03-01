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
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);


// reading jobs folder

logger.info('loading cron jobs');

var jobDirPath = __dirname + '/jobs';
var jobFiles = fs.readdirSync(jobDirPath);

var jobs = [];

for (let i = 0; i < jobFiles.length; i++) {
	let job = require(jobDirPath + '/' + jobFiles[i]);
	if (job) {
		jobs.push(job);
	}
}

//logger.info('timedelay ==> '+appConfig.cronjobTimeDelay);

var timeDelay = appConfig.cronjobTimeDelay || "*/2 * * * *";



module.exports.start = function start() {
	logger.info('starting cron job with delay ==> '+timeDelay);
	for (let i = 0; i < jobs.length; i++) {
		var jobId = crontab.scheduleJob(timeDelay, jobs[i]);
	}
}