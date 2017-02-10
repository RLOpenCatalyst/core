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
var fileUpload = require('_pr/model/file-upload/file-upload');

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

monitorsService.formatResponse = function (monitor, callback) {
    var formatted = {};
    switch (monitor.type) {
        case 'sensu':
        case 'Sensu':
            formatted._id = monitor._id;
            formatted.name = monitor.name;
            formatted.type = monitor.type;
            formatted.isDefault = monitor.isDefault;
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
            if (monitor.parameters.transportProtocol === 'rabbitmq' && monitor.parameters.transportProtocolParameters.ssl) {
                fileUpload.getReadStreamFileByFileId(monitor.parameters.transportProtocolParameters.ssl.certChainFileId, function (err, file) {
                    var certChainFileId =  monitor.parameters.transportProtocolParameters.ssl.certChainFileId;
                    delete formatted.parameters.transportProtocolParameters.ssl.certChainFileId;
                    if (err) {
                        formatted.parameters.transportProtocolParameters.ssl['certChainFile'] = null;
                    } else {
                        formatted.parameters.transportProtocolParameters.ssl['certChainFile'] = {};
                        formatted.parameters.transportProtocolParameters.ssl['certChainFile']['id'] = certChainFileId;
                        formatted.parameters.transportProtocolParameters.ssl['certChainFile']['name'] = file.fileName;
                        formatted.parameters.transportProtocolParameters.ssl['certChainFile']['file'] = file.fileData;
                    }
                    fileUpload.getReadStreamFileByFileId(monitor.parameters.transportProtocolParameters.ssl.privateKeyFileId, function (err, file) {
                        var privateKeyFileId =  monitor.parameters.transportProtocolParameters.ssl.privateKeyFileId;
                        delete formatted.parameters.transportProtocolParameters.ssl.privateKeyFileId;
                        if (err) {
                            formatted.parameters.transportProtocolParameters.ssl['privateKeyFile'] = null;
                        } else {
                            formatted.parameters.transportProtocolParameters.ssl['privateKeyFile'] = {};
                            formatted.parameters.transportProtocolParameters.ssl['privateKeyFile']['id'] = privateKeyFileId;
                            formatted.parameters.transportProtocolParameters.ssl['privateKeyFile']['name'] = file.fileName;
                            formatted.parameters.transportProtocolParameters.ssl['privateKeyFile']['file'] = file.fileData;
                        }
                        callback(formatted);
                    });
                });
            } else {
                callback(formatted);
            }
            break;
        default:
            callback(null);
    }
};


monitorsService.createMonitor = function (monitorsObj, callback) {

    switch (monitorsObj.type) {
        case 'sensu':
        case 'Sensu':
            var saveobj = {};
            saveobj['orgId'] = monitorsObj['orgId'];
            saveobj['type'] = monitorsObj['type'];
            saveobj['name'] = monitorsObj['name'];
            saveobj['isDefault'] = monitorsObj['isDefault'];
            saveobj['parameters'] = {};
            saveobj['parameters']['url'] = monitorsObj['parameters']['url'];
            saveobj['parameters']['transportProtocol'] = monitorsObj['parameters']['transportProtocol'];
            saveobj['parameters']['transportProtocolParameters'] = {};
            saveobj['parameters']['transportProtocolParameters']['host'] = monitorsObj['parameters']['transportProtocolParameters']['host'];
            saveobj['parameters']['transportProtocolParameters']['port'] = monitorsObj['parameters']['transportProtocolParameters']['port'];
            saveobj['parameters']['transportProtocolParameters']['password'] = monitorsObj['parameters']['transportProtocolParameters']['password'];
            if (monitorsObj['parameters']['transportProtocol'] === 'rabbitmq') {
                saveobj['parameters']['transportProtocolParameters']['vhost'] = monitorsObj['parameters']['transportProtocolParameters']['vhost'];
                saveobj['parameters']['transportProtocolParameters']['user'] = monitorsObj['parameters']['transportProtocolParameters']['user'];
                saveobj['parameters']['transportProtocolParameters']['heartbeat'] = monitorsObj['parameters']['transportProtocolParameters']['heartbeat'];
                saveobj['parameters']['transportProtocolParameters']['prefetch'] = monitorsObj['parameters']['transportProtocolParameters']['prefetch'];
                if (monitorsObj['parameters']['transportProtocolParameters']['ssl']) {
                    saveobj['parameters']['transportProtocolParameters']['ssl'] = {};
                    saveobj['parameters']['transportProtocolParameters']['ssl']['certChainFileId'] = monitorsObj['parameters']['transportProtocolParameters']['ssl']['certChainFileId'];
                    saveobj['parameters']['transportProtocolParameters']['ssl']['privateKeyFileId'] = monitorsObj['parameters']['transportProtocolParameters']['ssl']['privateKeyFileId'];
                }
            }
            monitorsModel.createNew(saveobj, function (err, monitor) {
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

monitorsService.updateMonitor = function updateMonitor(monitorId, monitorsObj, callback) {
    switch (monitorsObj.type) {
        case 'sensu':
        case 'Sensu':
            var updateFields = {};
            updateFields['orgId'] = monitorsObj['orgId'];
            updateFields['type'] = monitorsObj['type'];
            updateFields['name'] = monitorsObj['name'];
            updateFields['parameters.url'] = monitorsObj['parameters']['url'];
            updateFields['parameters.transportProtocol'] = monitorsObj['parameters']['transportProtocol'];
            updateFields['parameters.transportProtocolParameters.host'] = monitorsObj['parameters']['transportProtocolParameters']['host'];
            updateFields['parameters.transportProtocolParameters.port'] = monitorsObj['parameters']['transportProtocolParameters']['port'];
            if (monitorsObj['parameters']['transportProtocolParameters']['password']) {
                updateFields['parameters.transportProtocolParameters.password'] = monitorsObj['parameters']['transportProtocolParameters']['password'];
            }
            if (monitorsObj['parameters']['transportProtocol'] === 'rabbitmq') {
                updateFields['parameters.transportProtocolParameters.vhost'] = monitorsObj['parameters']['transportProtocolParameters']['vhost'];
                updateFields['parameters.transportProtocolParameters.user'] = monitorsObj['parameters']['transportProtocolParameters']['user'];
                updateFields['parameters.transportProtocolParameters.heartbeat'] = monitorsObj['parameters']['transportProtocolParameters']['heartbeat'];
                updateFields['parameters.transportProtocolParameters.prefetch'] = monitorsObj['parameters']['transportProtocolParameters']['prefetch'];
                if (monitorsObj['parameters']['transportProtocolParameters']['ssl']) {
                    if (monitorsObj['parameters']['transportProtocolParameters']['ssl']['certChainFileId']) {
                        updateFields['parameters.transportProtocolParameters.ssl.certChainFileId'] = monitorsObj['parameters']['transportProtocolParameters']['ssl']['certChainFileId'];
                    }
                    if (monitorsObj['parameters']['transportProtocolParameters']['ssl']['privateKeyFileId']) {
                        updateFields['parameters.transportProtocolParameters.ssl.privateKeyFileId'] = monitorsObj['parameters']['transportProtocolParameters']['ssl']['privateKeyFileId'];
                    }

                }
            }
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

monitorsService.removeDefaultMonitor = function (orgId,callback) {
    monitorsModel.removeDefaultMonitor(orgId, function (err, monitor) {
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

monitorsService.setDefaultMonitor = function (monitorId, orgId, callback) {
    monitorsModel.setDefaultMonitor(monitorId, orgId, function (err, monitor) {
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
                    monitorsService.formatResponse(monitors[i], function (monitor) {
                        res.push(monitor);
                        if (res.length === monitors.length) {
                            callback(null, res);
                        }
                    });
                }
            } else {
                callback(null, res);
            }
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
            monitorsService.formatResponse(monitor, function (monitor) {
                callback(null, monitor);
            });
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
        if(filterQueryValues.length > 1){
           filterQuery[filter[0]] = {'$in': filterQueryValues}; 
        }else{
            if(filterQueryValues[0] == 'true' || filterQueryValues[0] == 'false'){
                filterQueryValues[0] = (filterQueryValues[0] == 'true');
            }
            filterQuery[filter[0]] = filterQueryValues[0];
        }
    }

    return filterQuery;
};
