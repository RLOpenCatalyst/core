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

var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);


module.exports.setRoutes = function(app, sessionVerification) {

    app.all('/config-data/*', sessionVerification);

    // Tagging Server List
    app.get('/config-data/tagging-server', function(req, res) {
        var serverList = appConfig.taggingServerList;
        res.send(serverList);
    });

    // Bot Type List
    app.get('/config-data/bots-type', function(req, res) {
        var botTypeList = appConfig.botTypeList;
        res.send(botTypeList);
    });

    // Category List
    app.get('/config-data/category-type', function(req, res) {
        var categoryList = appConfig.categoryList;
        res.send(categoryList);
    });
}