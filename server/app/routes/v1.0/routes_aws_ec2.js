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

// This file act as a Controller which contains aws related end points.

var EC2 = require('_pr/lib/ec2.js');
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);

module.exports.setRoutes = function(app, verifySession) {
    app.get('/aws/ec2/amiids', function(req, res) {
        logger.debug("Enter /aws/ec2/amiids");
        res.send(appConfig.aws.operatingSystems);
    });

}
