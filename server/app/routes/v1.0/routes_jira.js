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
var Jira = require('_pr/lib/jira');
module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/jira/*', sessionVerificationFunc);

    app.post('/jira/test', function(req, res) {
        logger.debug("Jira Authentication..");
        var jira = new Jira({
            "username": req.body.jirausername,
            "password": req.body.jirapassword,
            "url": req.body.jiraurl
        });

        jira.getCurrentUser(function(error, data) {
            logger.debug("method called...");
            if (error) {
                logger.debug("Jira Authentication failed..");
                res.send("Unable to connect Jira.", 500);
                return;
            }
            logger.debug("Jira Authentication Success..");
            res.send(data);
            return;
        });

    });

}
