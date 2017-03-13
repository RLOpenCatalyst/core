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
var cicdDashboardModel = require('_pr/model/cicd-dashboards/cicdDashboard.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');

var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));


var cicdDashboardService = module.exports = {};



cicdDashboardService.checkIfcicdDashboardExists = function checkIfcicdDashboardExists(cicdDashboardId, callback) {
    cicdDashboardModel.getById(cicdDashboardId, function (err, cicdDashboard) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!cicdDashboard) {
            var err = new Error('CICD Dashboard not found');
            err.status = 404;
            return callback(err);
        } else {
            return callback(null, cicdDashboard);
        }
    });
};

cicdDashboardService.createcicdDashboard = function createcicdDashboard(cicdDashboardObj, callback) {
    
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    cicdDashboardObj.dashboardServerPassword =  cryptography.encryptText(cicdDashboardObj.dashboardServerPassword, cryptoConfig.encryptionEncoding,
        cryptoConfig.decryptionEncoding);

    cicdDashboardModel.createNew(cicdDashboardObj, function (err, cicdDashboard) {
        if (err && err.name === 'ValidationError') {
            var err = new Error('Bad Request');
            err.status = 400;
            callback(err);
        } else if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, cicdDashboard);
        }
    });
};

cicdDashboardService.updatecicdDashboard = function updatecicdDashboard(cicdDashboardId, cicdDashboardObj, callback) {
    
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    cicdDashboardObj.dashboardServerPassword =  cryptography.encryptText(cicdDashboardObj.dashboardServerPassword, cryptoConfig.encryptionEncoding,
        cryptoConfig.decryptionEncoding);

    cicdDashboardModel.updatecicdDashboad(cicdDashboardId, cicdDashboardObj, function (err, cicdDashboard) {
        if (err && err.name === 'ValidationError') {
            var err = new Error('Bad Request');
            err.status = 400;
            callback(err);
        } else if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, cicdDashboard);
        }
    });
};

cicdDashboardService.deletecicdDashboard = function deletecicdDashboard(cicdDashboardId, callback) {
    cicdDashboardModel.deleteGitHub(cicdDashboardId, function (err, cicdDashboard) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else {
            return callback(null, cicdDashboard);
        }
    });
};


cicdDashboardService.getcicdDashboardList = function getcicdDashboardList(query, callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.changeRequestForJqueryPagination(query, next);
        },
        function(filterQuery,next) {
            reqData = filterQuery;
            apiUtil.paginationRequest(filterQuery, 'CicdDashboardServer', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['dashboardName', 'dashboardServer', 'orgId'];
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            cicdDashboardModel.getCICDDashboardList(queryObj, next);
        },
        function(cicdDashboardList, next) {
            if (cicdDashboardList.docs.length > 0) {
                var formattedResponseList = [];
                for (var i = 0; i < cicdDashboardList.docs.length; i++) {
                    formatcicdDashboardResponse(cicdDashboardList.docs[i],function(formattedData){
                        formattedResponseList.push(formattedData);
                        if (formattedResponseList.length === cicdDashboardList.docs.length) {
                            cicdDashboardList.docs = formattedResponseList;
                            next(null,cicdDashboardList);
                        }
                    });
                }
            } else {
                next(null,cicdDashboardList);
            }
        },
        function(formattedResponseList, next) {
            apiUtil.changeResponseForJqueryPagination(formattedResponseList, reqData, next);
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results)
        return;
    });
};

function formatcicdDashboardResponse(cicdDashboard,callback) {
	var formatted = {
        _id:gitHub._id,
       };
    if (cicdDashboard.organization.length) {
        formatted.orgId = cicdDashboard.organization[0].rowid;
        formatted.orgName=cicdDashboard.organization[0].orgname;
    }
     var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        formatted.dashboardServerPassword =  cryptography.decryptText(gitHub.dashboardServerPassword, cryptoConfig.decryptionEncoding,
            cryptoConfig.encryptionEncoding);
        callback(formatted);
};


