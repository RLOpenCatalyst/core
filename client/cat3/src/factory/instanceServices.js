/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('instanceServices', [
	]).service('instanceLogs', ['$modal', '$q', 'workzoneServices', '$timeout', 'instanceSetting', function($modal, $q, workzoneServices, $timeout, instanceSetting) {
		var instanceId;
		var serviceInterface = {};
		var logList,isFullLogs=true;
		var timerObject;
		var deferred = "";
		var helper = {
			lastTimeStamp: '',
			getlastTimeStamp: function(logObj) {
				if (logObj instanceof Array && logObj.length) {
					var lastTime = logObj[logObj.length - 1].timestamp;
					return lastTime;
				}
			},
			logsPolling: function() {
				timerObject = $timeout(function() {
					workzoneServices.getInstanceLogs(instanceId, '?timestamp=' + helper.lastTimeStamp)
					.then(function(resp) {
						if (resp.data.length) {
							helper.lastTimeStamp = helper.getlastTimeStamp(resp.data);
							var logData = {
								logs : resp.data,
								fullLogs : false
							};
							deferred.notify(logData);
						}
						helper.logsPolling();
					});
				}, instanceSetting.logCheckTimer);
			},
			stopPolling: function() {
				$timeout.cancel(timerObject);
			}
		};
		serviceInterface.showInstanceLogs = function(instId) {
			instanceId = instId;
			//initialise new promise object for every new log flow.
			deferred = $q.defer();
			workzoneServices.getInstanceLogs(instanceId).then(function(response) {
				helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
				logList = response.data;
				helper.logsPolling();
				var logData = {
					logs : logList,
					fullLogs : isFullLogs
				};
				deferred.notify(logData);
			},function(error) {
				deferred.reject(error);
			});
			return deferred.promise;
		};
		serviceInterface.stopLogsPolling = function() {
			helper.stopPolling();
			deferred.resolve("Resolved Logs notifier will stop now");
		};
		serviceInterface.scrollBottom = function (selector) {
			selector = selector ? selector : ".logsArea";
			$timeout(function () {
				var elm = angular.element(selector);
				elm.scrollTop(elm[0].scrollHeight);
			}, 100);
		};
		return serviceInterface;
	}]).service('instanceActions', [function() {
		//condition check for SSH
		var isSSHSupportedOS = function(inst) {
			if ((inst.hardware.os === 'linux' || inst.hardware.os === 'centos')) {
				return true;
			}
		},
		isRunning = function(inst) {
			return inst.instanceState === 'running';
		};
		//condition check for RDP
		var isRDPSupportOS = function(inst) {
			if ((inst.hardware.os === 'windows')) {
				return true;
			}
		};
		//condition check for chef
		var isChefSupported = function(inst) {
			if ((inst.chef)) {
				return true;
			}
		};
		//condition check for puppet
		var isPuppetSupported = function(inst) {
			if ((inst.puppet)) {
				return true;
			}
		};
		var serviceInterface = {};
		/*This is for show/hide different buttons in instance page*/
		serviceInterface.isChefEnabled = function(inst) {
			if ((isChefSupported(inst) && isRunning(inst))) {
				return true;
			}
		};
		serviceInterface.isChefDisabled = function(inst) {
			if ((isChefSupported(inst) && !isRunning(inst))) {
				return true;
			}
		};
		serviceInterface.isPuppetEnabled = function(inst) {
			if ((isPuppetSupported(inst) && isRunning(inst))) {
				return true;
			}
		};
		serviceInterface.isPuppetDisabled = function(inst) {
			if ((isPuppetSupported(inst) && !isRunning(inst))) {
				return true;
			}
		};
		serviceInterface.isSSHEnabled = function(inst) {
			if (isSSHSupportedOS(inst) && isRunning(inst)) {
				return true;
			}
		};
		serviceInterface.isSSHDisabled = function(inst) {
			if (isSSHSupportedOS(inst) && !isRunning(inst)) {
				return true;
			}
		};
		serviceInterface.isRDPEnabled = function(inst) {
			if (isRDPSupportOS(inst) && isRunning(inst)) {
				return true;
			}
		};
		serviceInterface.isRDPDisabled = function(inst) {
			if (isRDPSupportOS(inst) && !isRunning(inst)) {
				return true;
			}
		};
		return serviceInterface;
	}]).service('instanceOperations', ['$modal', '$q', function($modal, $q) {
		var serviceInterface = {};
		/*This is for open modal calls*/
		serviceInterface.deleteInstance = function(instanceObj) {
			var _deleteHandler = function(resolve, reject) {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/deleteInstance.html',
					controller: 'deleteInstanceCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return instanceObj;
						}
					}
				}).result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_deleteHandler);
		};

		serviceInterface.editInstanceName = function(instanceObj) {
			var _editNameHandler = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceNameEdit.html',
					controller: 'editNameCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return instanceObj;
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_editNameHandler);
		};

		serviceInterface.instanceSSH = function(instanceObj) {
			var _instanceSSHHandler = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceSSH.html',
					controller: 'instanceSSHCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						sshInstance: function() {
							return instanceObj;
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_instanceSSHHandler);
		};

		serviceInterface.viewLogs = function(instanceObj) {
			var _viewLogs = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceLogs.html',
					controller: 'instanceLogsCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return instanceObj;
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_viewLogs);
		};

		serviceInterface.viewRunList = function(instanceObj) {
			var _viewRunList = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/viewRunList.html',
					controller: 'viewRunListCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return instanceObj;
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_viewRunList);
		};

		serviceInterface.updateCookbook = function(instance) {
			console.log("instance service");
			var _viewChefRunList = function() {
				var modalInstance = $modal.open({
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceUpdateChefRunlist.html',
					controller: 'instanceUpdateChefRunlistCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						instanceChefAttribute: function() {
							return{
								instanceId:instance._id,
								chefrunlist:instance.runlist,
								attributes:instance.attributes
							}; 
						}
					}
				});
				modalInstance.result.then(function() {   
				 //returning viewLogs to show Logs after success
				 return serviceInterface.viewLogs(instance);
				}, function() {
					console.log('Dismiss time is ' + new Date());
				});
			};
			return $q(_viewChefRunList);
		};

		serviceInterface.puppetRunClient = function(instance) {
			var _puppetRunClient = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceRunPuppetClient.html',
					controller: 'instanceRunPuppetClientCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						instanceId: function() {
							return instance._id;
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					console.log('Modal closed at ' + new Date());
					resolve(modalClose);
				}, function(modalCancel) {
					console.log('Modal dismissed at ' + new Date());
					reject(modalCancel);
				});
			};
			return $q(_puppetRunClient);
		};

		serviceInterface.stopInstanceHandler = function(_inst, _hasPerm) {
			var _stopInst = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: "src/partials/sections/dashboard/workzone/instance/popups/stopInstance.html",
					controller: "startStopInstanceCtrl",
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								inst: _inst,
								hasPerm: _hasPerm
							};
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_stopInst);
		};

		serviceInterface.startInstanceHandler = function(_inst, _hasPerm) {
			var _startInst = function(resolve, reject) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: "src/partials/sections/dashboard/workzone/instance/popups/startInstance.html",
					controller: "startStopInstanceCtrl",
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								inst: _inst,
								hasPerm: _hasPerm
							};
						}
					}
				});
				modalInstance.result.then(function(modalClose) {
					resolve(modalClose);
				}, function(modalCancel) {
					reject(modalCancel);
				});
			};
			return $q(_startInst);
		};
		return serviceInterface;
	}]).factory('instanceSetting', [function() {
		return {
			logCheckTimer:5000
		};
	}]);
})(angular);