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
var https = require("https");
var errorResponses = require('./error_responses');
var appConfig = require('_pr/config');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/serviceAction*', sessionVerificationFunc);

    // Check for Service stop
    app.post('/serviceAction', function(req, res) {
        var post_data = {
            "cmd": req.body.cmd,
            "type": req.body.type,
            "hosts": req.body.hosts
        };

        post_data = JSON.stringify(post_data);


        var post_options = {
            host: appConfig.serverControllerUrl,
            port: 443,
            path: '/api/v1/webhooks/remotecmd?st2-api-key='+appConfig.serviceControllerKey,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };


        var post_req = https.request(post_options, function(httpsRes) {
            httpsRes.setEncoding('utf8');
            var data = '';
            httpsRes.on('data', function(chunk) {
                data = data + chunk
            });
            httpsRes.on('end', function(chunk) {
                res.status(200).send(data);
            });
            httpsRes.on('error', function(err) {
                res.status(500).send(err);
            });
        });

        post_req.write(post_data);
        post_req.end();

    });
};