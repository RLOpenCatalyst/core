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
var instancesModel = require('_pr/model/classes/instance/instance');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');

var zabbix = require('zabbix-node');
var Zabbix = function(zabbixSettings) {
    this.getHost = function(callback) {
        d4dModelNew.d4dModelMastersZabbixServer.find({
            id: "30"
        }, function(err, zabbixServer) {
            if (err) {
                logger.debug("failed to fetch zabbix: ", err);
                return callback(err, null);
            }
            if (zabbixServer && zabbixServer.length) {
                instancesModel.getInstanceById(zabbixSettings.instanceId, function(err, instance) {
                    if (err) {
                        logger.debug("failed to get Instance ", err);
                        return callback(err, null);
                    }
                    if (instance && instance.length) {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm,
                            cryptoConfig.password);

                        var decryptedPassword = cryptography.decryptText(zabbixServer[0].zabbixpassword,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var zabbixUrl = 'http://' + instance[0].instanceIP + '/zabbix/api_jsonrpc.php';
                        logger.debug("zabbixUrl: ", zabbixUrl);
                        var client = new zabbix(zabbixUrl, zabbixServer[0].zabbixusername, decryptedPassword);

                        var token = "";
                        // Should be call login at the first time
                        client.login(function(error, resp, body) {
                            if (error) {
                                logger.debug("Got error: ", error);
                                return callback(error, null);
                            }
                            logger.debug("resp: ", JSON.stringify(resp));
                            logger.debug("Body: ", body);
                            token = body;

                            // Then the client has had the token
                            client.call('application.get', { "auth": token }, function(error1, resp1, body1) {
                                if (error1) {
                                    logger.debug("Got error1: ", error1);
                                    return callback(error1, null);
                                }
                                logger.debug("resp1: ", JSON.stringify(resp1));
                                logger.debug("Body1: ", body1);
                                return callback(null, body1);
                            });
                        });

                        /*var obj = [{
                            "name": "x",
                            "version": "1.0",
                            "status": "success"
                        },{
                            "name": "y",
                            "version": "1.1",
                            "status": "failed"
                        }];
                        return callback(null, obj);*/

                    } else {
                        return callback(null, []);
                    }
                });
            }
        });
    }
}

module.exports = Zabbix;
