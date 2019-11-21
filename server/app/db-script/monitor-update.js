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

// This script will update the monitor details for some instances

var logger = require('_pr/logger')(module);
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var instancesDao = require('_pr/model/classes/instance/instance');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var monitorsModel = require('_pr/model/monitors/monitors.js');

var instaces = ['i-5c03de9f','i-7bc992b9','i-ca1f6d01', 'i-ce4c3105', 'i-d3411313'];

monitorsModel.getMonitors({}, function(err, monitors) {
    if (err) {
        logger.error("Failed to fetch tasks: ", err);
        process.exit();
    }
    if (monitors && monitors.length) {
        var monitorDetails = monitors[0];
        var countr = 1;
        for (var i = 0; i < instaces.length; i++) {
            (function(instacesId) {
                instancesDao.updateInstanceMonitor(instacesId,monitorDetails, function(err,data) {
                    countr++;
                    if (err) {
                        logger.error("Failed to update instance: "+instacesId, err);
                    }else{
                        logger.debug("updated instance: "+instacesId);
                        logger.debug("log---->> ",JSON.stringify(data));
                    }
                    if(countr ===instaces.length){
                        logger.debug("All instance updated.");
                        process.exit();
                    }
                });
            })(instaces[i]);
        }
    } else {
        logger.debug("No Task to update.");
        process.exit();
    }
});
