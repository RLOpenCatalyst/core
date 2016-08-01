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

// The file contains all the end points for Tracks

var logger = require('_pr/logger')(module);
var request = require("request");
var errorResponses = require('./error_responses');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/serviceAction/*', sessionVerificationFunc);

    // Check for Service stop
    app.post('/serviceAction', function(req, res) {

        console.log(req.body);
        var post_data = {
            "cmd": req.body.cmd,
            "type": req.body.type,
            "hosts": req.body.hosts
        };

        request({
            url: 'https://52.8.208.191/api/v1/webhooks/remotecmd?st2-api-key=YTU0M2RlNmMwMjdhMzFlNzVmMTExZDA4YWExMWY5MmFjOTUyYzc2Nzk5YjMzYmM4ZjAwNWJiYjc2NjFmZjY1MA',
            body: post_data,
            method: 'post',
            json: true,
        }, function(err, httpResponse, body) {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.status(200).send(body);
        });

    });
};