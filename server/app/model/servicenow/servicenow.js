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


var Client = require('node-rest-client').Client;
var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var request = require('request');
var ObjectId = require('mongoose').Types.ObjectId;

var CMDBConfigSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        trim: true
    },
    configname: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    servicenowusername: {
        type: String,
        required: true,
        trim: true,
    },
    servicenowpassword: {
        type: String,
        required: true,
        trim: true
    },
    orgname: {
        type: String,
        required: true,
        trim: true,
    },
    orgname_rowid: {
        type: String,
        required: true,
        trim: true
    },
    rowid: {
        type: String,
        required: true,
        trim: true
    },
    createdOn: {
        type: Number,
        required: false,
        default: Date.now()
    }
});


CMDBConfigSchema.statics.getCMDBServerById = function(serverId, callback) {
    this.findOne({
        _id: serverId
    }, function(err, data) {
        if (err) {
            logger.error("Failed getServiceNow Config by Id", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
}
CMDBConfigSchema.statics.getConfigItems = function(tableName,ticketNo, options, callback) {
    logger.debug("START :: getConfigItems");
    var basic_auth = {
        user: options.username,
        password: options.password
    };
    var tmp = options.host;
    var host = tmp.replace(/.*?:\/\//g, "");
    var serviceNowURL = null;
    if(ticketNo !== null) {
        serviceNowURL = 'https://' + options.username + ':' + options.password + '@' + tmp + '/api/now/table/' + tableName+"?number="+ticketNo;
    }else{
        serviceNowURL = 'https://' + options.username + ':' + options.password + '@' + tmp + '/api/now/table/' + tableName;
    }
    var options = {
        url: serviceNowURL,
        headers: {
            'User-Agent': 'request',
            'Accept': 'application/json'
        }
    };
    logger.debug("options", options);
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            logger.debug("success");
            var info = JSON.parse(body);
            callback(null, info);
        } else {
            logger.error("Error",error,response);
            callback("Error in getting CMDB data", null);
        }
    });
}

CMDBConfigSchema.statics.getCMDBList = function(callback) {
    this.find({
        id: "90"
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
}

CMDBConfigSchema.statics.saveConfig = function(config, callback) {
    var configObj = config;
    var that = this;
    var obj = that(configObj);
    obj.save(function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew CMDB configuration");
        callback(null, data);
        return;
    })
}

CMDBConfigSchema.statics.getCMDBServerByOrgId = function(orgId, callback) {
    this.find({
        orgname_rowid: orgId
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
}

CMDBConfigSchema.statics.removeServerById = function(serverId, callback) {
    this.remove({
        "rowid": serverId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to remove item (%s)", err);
            callback(err, null);
            return;
        }
        logger.debug("Exit removeInstancebyId (%s)", serverId);
        callback(null, data);
    });
}

CMDBConfigSchema.statics.getConfigItemByName = function(name, tableName, options, callback) {
    logger.debug("START getConfigItemByName..");
    this.getConfigItems(tableName, options, function(err, data) {
        for (var i = 0; i < data.result.length; i++) {
            if (data.result[i].name == name) {
                callback(null, data.result[i]);
                return;
            }
        }
        callback({
            erroMsg: "Selected Node not found"
        }, null);
        return;
    });
}

CMDBConfigSchema.statics.updateConfigItemById = function(configData, callback) {
    logger.debug("Enter updateConfigItemById");
    this.update({
        "_id": new ObjectId(configData._id)
    }, {
        $set: {
            configname: configData.configname,
            url: configData.url,
            servicenowusername: configData.servicenowusername,
            servicenowpassword: configData.servicenowpassword,
            orgname: configData.orgname
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Exit updateConfigItemById with no update.");
            callback(err, null);
            return;
        }
        logger.debug("Exit updateConfigItemById with update success.");
        callback(null, updateCount);
        return;
    });
}
var CMDBConfig = mongoose.model('CMDBConfig', CMDBConfigSchema);
module.exports = CMDBConfig;
