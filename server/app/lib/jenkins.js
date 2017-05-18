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


var jenkinsApi = require('jenkins-api');
var logger = require('_pr/logger')(module);
var url = require('url');
var fs = require('fs');
var Client = require('node-rest-client').Client;

var Jenkins = function(options) {
	var parsedUrl = url.parse(options.url);
	var jenkinsUrl = parsedUrl.protocol + '//';
	if (options.username) {
		jenkinsUrl += options.username;
		var pass = options.password ? options.password : options.token;
		jenkinsUrl += ':' + pass + '@';
	}
	jenkinsUrl += parsedUrl.host + parsedUrl.path;
	var jenkins = jenkinsApi.init(jenkinsUrl);

	this.getJobs = function(callback) {
		jenkins.all_jobs(function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	};

	this.getJobInfo = function(jobName, callback) {
		jenkins.job_info(jobName, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		})
	}

	this.buildJob = function(jobName, callback) {
		jenkins.build(jobName, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	};


	this.buildJobWithParams = function(jobName, params, callback) {
		jenkins.build(jobName, params, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			if (data.statusCode && data.statusCode === 500 || data.statusCode === 404) {
				callback({
					statusCode: data.statusCode
				}, null);
			} else {
				callback(null, data);
			}

		});

	};

	this.getBuildInfo = function(jobName, buildNumber, callback) {
		jenkins.build_info(jobName, buildNumber, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	};

	this.getLastBuildInfo = function(jobName, callback) {
		jenkins.last_build_info(jobName, function(err, data) {
			if (err) {
				logger.error(err, data);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	};


	this.getJobLastBuildReport = function(jobName, callback) {
		jenkins.last_build_report(jobName, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	}

	this.getJobOutput = function(jobName, buildName, callback) {
		jenkins.job_output(jobName, buildName, function(err, data) {
			if (err) {
				logger.error(err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});
	};

	this.getJobsBuildNumber = function(jobName, callback) {
		jenkins.last_build_info(jobName, function(err, data) {
			if (err) {
				logger.error(err);
				callback(null, {});
				return;
			}
			callback(null, data);
		});
	};

	this.updateJob = function(jobName, callback) {
		jenkins.update_job(jobName, function(config) {}, function(err, data) {
			if (err) {
				logger.debug("Error while updating job in jenkins: ", err);
				callback(err, null);
			}
			logger.debug("Update success jenkins job: ", JSON.stringify(data));
			callback(null, data);
		});

	};
	this.getDepthJobInfo = function(jobName, callback) {
		var options_auth = {
			user: options.username,
			password: options.password
		};
		client = new Client(options_auth);
		var jenkinsUrl1 = parsedUrl.href + 'job/' + jobName + '/api/json?depth=1';
		client.registerMethod("jsonMethod", jenkinsUrl1, "GET");
		client.methods.jsonMethod(function(data, response) {
			callback(null, data);
		});
	}
}

module.exports = Jenkins;