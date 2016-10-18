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

const logger = require('_pr/logger')(module);
const dateUtil = require('_pr/lib/utils/dateUtil');
const monitorsModel = require('_pr/model/monitors');
const appConfig = require('_pr/config');

var monitorsService = module.exports = {};

monitorsService.createMonitor = function(monitor, callback) {

    switch (monitor.serverType) {
        case 'sensu':
        case 'Sensu':
            monitorsModel.createNew(monitor, function(err, monitor) {
                //@TODO To be generalized
                if (err && err.name === 'ValidationError') {
                    var err = new Error('Bad Request');
                    err.status = 400;
                    callback(err);
                } else if (err) {
                    var err = new Error('Internal Server Error');
                    err.status = 500;
                    callback(err);
                } else {
                    callback(null, monitor);
                }
            });
            break;
        default:
            var err = new Error('Bad request');
            err.status = 400;
            return callback(err);
            break;
    }

};

monitorsService.updateMonitor = function updateMonitor(monitor, updateFields, callback) {
    var fields = {};
    if ('name' in updateFields) {
        fields.name = updateFields.name;
        monitor.name = updateFields.name;
    }

    switch (monitor.type) {
        case 'gcp':
            if ('monitorDetails' in updateFields) {
                if ('projectId' in updateFields.monitorDetails) {
                    fields['monitorDetails.projectId'] = updateFields.monitorDetails.projectId;
                    monitor.monitorDetails.projectId = updateFields.monitorDetails.projectId;
                }

                if ('keyFile' in updateFields.monitorDetails)
                    fields['monitorDetails.keyFile'] = updateFields.monitorDetails.keyFile;

                if ('sshPrivateKey' in updateFields.monitorDetails)
                    fields['monitorDetails.sshPrivateKey'] = updateFields.monitorDetails.sshPrivateKey;

                if ('sshPublicKey' in updateFields.monitorDetails)
                    fields['monitorDetails.sshPrivateKey'] = updateFields.monitorDetails.sshPublicKey;
            }
            gcpMonitorModel.updateById(monitor._id, fields, function(err, result) {
                if (err || !result) {
                    var err = new Error('Internal Server Error');
                    err.status = 500;
                    callback(err);
                } else if (result) {
                    callback(null, monitor);
                }
            });
            break;
        default:
            var err = new Error('Bad request');
            err.status = 400;
            return callback(err);
            break;
    }
};

monitorsService.deleteMonitors = function(monitorId, callback) {
    monitorsModel.deleteMonitors(monitorId, function(err, monitor) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!monitor) {
            var err = new Error('Monitor not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

monitorsService.getMonitors = function(query, callback) {
    var params = {};
    logger.debug('get monitors');
    if ('filterBy' in query) {
        params = monitorsService.parseFilterBy(query.filterBy);
        logger.debug(JSON.stringify(params));
    }
    monitorsModel.getMonitors(params, function(err, monitors) {
        if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, monitors);
        }
    });
};

monitorsService.getMonitor = function(monitorId, callback) {
    monitorsModel.getById(monitorId, function(err, monitor) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!monitor) {
            var err = new Error('Monitor not found');
            err.status = 404;
            return callback(err);
        } else if (monitor) {
            callback(null, monitor);
        }
    });
};

// @TODO Query builder to be made generic and reused in analytics after schema changes
monitorsService.parseFilterBy = function parseFilterBy(filterByString) {
    var filterQuery = {};

    var filters = filterByString.split('+')
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i].split(':')
        var filterQueryValues = filter[1].split(",")

        filterQuery[filter[0]] = { '$in': filterQueryValues }
    }

    return filterQuery;
}
