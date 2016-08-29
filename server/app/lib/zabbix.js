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

var zabbix = require('zabbix-node');
var Zabbix = function(zabbixSettings) {

//var jira = new JiraApi('https', jiraSettings.url, 443, jiraSettings.username, jiraSettings.password, '2.0.alpha1');
//var client = new zabbix('https://Admin:zabbix@zabbix.rlcatalyst.com/zabbix/api_jsonrpc.php', 'admin', 'zabbix');
    var client = new zabbix('https://Admin:zabbix@zabbix.rlcatalyst.com/zabbix/api_jsonrpc.php', 'admin', 'zabbix');
    this.getHost = function(callback) {
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
            client.call('service.get', { "auth": token }, function(error1, resp1, body1) {
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
    }
}
module.exports = Zabbix;
