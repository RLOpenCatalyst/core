"use strict"
var fs = require('fs');
var logger = require('_pr/logger')(module);


// reading sync-job dir for provider sync jobs
var syncJobDirPath = __dirname+'/sync-jobs';
var jobFiles = fs.readdirSync(syncJobDirPath);

var jobs = [];

for (let i = 0; i < jobFiles.length; i++) {
	let job = require(syncJobDirPath + '/' + jobFiles[i]);
	if (typeof job === 'function') {
		jobs.push(job);
	}
}



module.exports = function() {
	for (let i = 0; i < jobs.length; i++) {
		jobs[i]();
	}
}