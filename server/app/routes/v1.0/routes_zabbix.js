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


// This file act as a Controller which contains Jira related all end points.

var logger = require('_pr/logger')(module);
var Zabbix = require('_pr/lib/zabbix');
module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/zabbix/*', sessionVerificationFunc);

    app.get('/zabbix/instance/:instanceId/host', function(req, res) {
        var zabbix = new Zabbix({
            "instanceId": req.params.instanceId
        });
        zabbix.getHost(function(error, data) {
            logger.debug("method called...");
            if (error) {
                logger.debug("Zabbix Authentication failed..");
                res.send("Unable to connect Zabbix.", 500);
                return;
            }
            logger.debug("Zabbix Authentication Success..");
            res.send(data);
            return;
        });

    });

}
