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
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var intanceDao = require('../instance/instance');
var instancesDao = require('../instance/instance');
var logsDao = require('../../dao/logsdao.js');
var credentialCryptography = require('../../../lib/credentialcryptography')
var fileIo = require('../../../lib/utils/fileio');
var configmgmtDao = require('../../d4dmasters/configmgmt.js');

var Chef = require('../../../lib/chef');

var taskTypeSchema = require('./taskTypeSchema');

var utils = require('../utils/utils.js');
var SCP = require('_pr/lib/utils/scp');
var SSHExec = require('_pr/lib/utils/sshexec');
var appConfig = require('_pr/config');



var scriptTaskSchema = taskTypeSchema.extend({
	nodeIds: [String],
	scriptFileName: String
});

//Instance Methods :- getNodes
scriptTaskSchema.methods.getNodes = function() {
	return this.nodeIds;

};

// Instance Method :- run task
scriptTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
	var self = this;
	logger.debug("self: ", JSON.stringify(self));
	//merging attributes Objects


	var instanceIds = this.nodeIds;
	if (!(instanceIds && instanceIds.length)) {
		if (typeof onExecute === 'function') {
			onExecute({
				message: "Empty Node List"
			}, null);
		}
		return;
	}

	instancesDao.getInstances(instanceIds, function(err, instances) {
		if (err) {
			logger.error(err);
			if (typeof onExecute === 'function') {
				onExecute(err, null);
			}
			return;
		}


		var count = 0;
		var overallStatus = 0;
		var instanceResultList = [];
		var executionIds = [];

		function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
			logger.debug('Instance onComplete fired', count, instances.length);
			count++;
			var result = {
				instanceId: instanceId,
				status: 'success'
			}
			if (actionId) {
				result.actionId = actionId;
			}
			if (executionId) {
				result.executionId = executionId;
			}
			if (err) {
				result.status = 'failed';
				overallStatus = 1;
			} else {
				if (status === 0) {
					result.status = 'success';
				} else {
					result.status = 'failed';
					overallStatus = 1;
				}
			}
			instanceResultList.push(result);
			if (!(count < instances.length)) {
				logger.debug('Type of onComplete: ' + typeof onComplete);
				if (typeof onComplete === 'function') {
					onComplete(null, overallStatus, {
						instancesResults: instanceResultList
					});
				}
			}
		}
		for (var i = 0; i < instances.length; i++) {
			(function(instance) {
				var timestampStarted = new Date().getTime();

				var actionLog = instancesDao.insertOrchestrationActionLog(instance._id, null, userName, timestampStarted);
				instance.tempActionLogId = actionLog._id;


				var logsReferenceIds = [instance._id, actionLog._id];
				if (!instance.instanceIP) {
					var timestampEnded = new Date().getTime();
					logsDao.insertLog({
						referenceId: logsReferenceIds,
						err: true,
						log: "Instance IP is not defined. Chef Client run failed",
						timestamp: timestampEnded
					});
					instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
					instanceOnCompleteHandler({
						message: "Instance IP is not defined. Chef Client run failed"
					}, 1, instance._id, null, actionLog._id);
					return;
				}

				credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
					var sshOptions = {
						username: decryptedCredentials.username,
						host: instance.instanceIP,
						port: 22,
					}
					if (decryptedCredentials.pemFileLocation) {
						sshOptions.privateKey = decryptedCredentials.pemFileLocation;
					} else {
						sshOptions.password = decryptedCredentials.password;
					}
					logger.debug('uploading script file');
					var scp = new SCP(sshOptions);
					scp.upload(appConfig.scriptDir + self.scriptFileName, '/tmp', function(err) {
						if (err) {
							var timestampEnded = new Date().getTime();
							logsDao.insertLog({
								referenceId: logsReferenceIds,
								err: true,
								log: "Unable to upload script file",
								timestamp: timestampEnded
							});
							instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
							instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
							return;
						}

						var sshExec = new SSHExec(sshOptions);
						var cmdString = '';

						sshExec.exec('bash /tmp/' + self.scriptFileName, function(err, retCode) {
							if (err) {
								var timestampEnded = new Date().getTime();
								logsDao.insertLog({
									referenceId: logsReferenceIds,
									err: true,
									log: 'Unable to run script',
									timestamp: timestampEnded
								});
								instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
								instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
								return;
							}
							if (retCode == 0) {
								var timestampEnded = new Date().getTime();
								logsDao.insertLog({
									referenceId: logsReferenceIds,
									err: false,
									log: 'Task execution success',
									timestamp: timestampEnded
								});
								instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
								instanceOnCompleteHandler(null, 0, instance._id, null, actionLog._id);
							} else {
								instanceOnCompleteHandler(null, retCode, instance._id, null, actionLog._id);
								if (retCode === -5000) {
									logsDao.insertLog({
										referenceId: logsReferenceIds,
										err: true,
										log: 'Host Unreachable',
										timestamp: new Date().getTime()
									});
								} else if (retCode === -5001) {
									logsDao.insertLog({
										referenceId: logsReferenceIds,
										err: true,
										log: 'Invalid credentials',
										timestamp: new Date().getTime()
									});
								} else {
									logsDao.insertLog({
										referenceId: logsReferenceIds,
										err: true,
										log: 'Unknown error occured. ret code = ' + retCode,
										timestamp: new Date().getTime()
									});
								}
								var timestampEnded = new Date().getTime();
								logsDao.insertLog({
									referenceId: logsReferenceIds,
									err: true,
									log: 'Error in running script',
									timestamp: timestampEnded
								});
								instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
							}

						}, function(stdOut) {
							logsDao.insertLog({
								referenceId: logsReferenceIds,
								err: false,
								log: stdOut.toString('ascii'),
								timestamp: new Date().getTime()
							});

						}, function(stdErr) {
							logsDao.insertLog({
								referenceId: logsReferenceIds,
								err: true,
								log: stdErr.toString('ascii'),
								timestamp: new Date().getTime()
							});

						});

					});
				});

			})(instances[i]);
		}

		if (typeof onExecute === 'function') {
			onExecute(null, {
				instances: instances,
			});
		}
	});

};

var ScriptTask = mongoose.model('scriptTask', scriptTaskSchema);

module.exports = ScriptTask;