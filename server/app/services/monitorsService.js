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


monitorsService.checkIfMonitorExists = function (monitorId, callback) {
    monitorsModel.getById(monitorId, function (err, monitor) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!monitor) {
            var err = new Error('Monitor not found');
            err.status = 404;
            return callback(err);
        } else {
            return callback(null, monitor);
        }
    });
};

monitorsService.formatResponse = function (monitor) {
    var formatted = {};
    switch (monitor.type) {
        case 'sensu':
        case 'Sensu':
            formatted._id = monitor._id;
            formatted.type = monitor.type;
            if (monitor.organization.length) {
                formatted.organization = {
                    id: monitor.organization[0].rowid,
                    name: monitor.organization[0].orgname
                };
            }
            formatted.parameters = monitor.parameters;
            if (formatted.parameters.transportProtocolParameters['password']) {
                delete formatted.parameters.transportProtocolParameters['password'];
            }
            break;
    }
    return formatted;
};


monitorsService.createMonitor = function (monitor, callback) {

    switch (monitor.type) {
        case 'sensu':
        case 'Sensu':
            monitorsModel.createNew(monitor, function (err, monitor) {
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

monitorsService.updateMonitor = function updateMonitor(monitorId, updateFields, callback) {
    switch (updateFields.type) {
        case 'sensu':
        case 'Sensu':
            monitorsModel.updateMonitors(monitorId, updateFields, function (err, monitor) {
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

monitorsService.deleteMonitors = function (monitorId, callback) {
    monitorsModel.deleteMonitors(monitorId, function (err, monitor) {
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

monitorsService.getMonitors = function (query, callback) {
    var params = {};
    logger.debug('get monitors');
    if ('filterBy' in query) {
        params = monitorsService.parseFilterBy(query.filterBy);
    }
    monitorsModel.getMonitors(params, function (err, monitors) {
        if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            var res = [];
            if (monitors.length > 0) {
                for (i = 0; i < monitors.length; i++) {
                    res[i] = monitorsService.formatResponse(monitors[i]);
                }
            }
            callback(null, res);
        }
    });
};

monitorsService.getMonitor = function (monitorId, callback) {
    monitorsModel.getMonitor(monitorId, function (err, monitor) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if (!monitor) {
            var err = new Error('Monitor not found');
            err.status = 404;
            return callback(err);
        } else if (monitor) {
            monitor = monitorsService.formatResponse(monitor);
            callback(null, monitor);
        }
    });
};

// @TODO Query builder to be made generic
monitorsService.parseFilterBy = function (filterByString) {
    var filterQuery = {};

    var filters = filterByString.split('+');
    for (var i = 0; i < filters.length; i++) {
        var filter = filters[i].split(':');
        var filterQueryValues = filter[1].split(",");

        filterQuery[filter[0]] = {'$in': filterQueryValues};
    }

    return filterQuery;
};
