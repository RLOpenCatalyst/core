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
var resourceMapService = require('_pr/services/resourceMapService.js');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/resourceMap*', sessionVerificationFunc);

    app.get('/resourceMap', function(req, res) {
        resourceMapService.getAllResourcesByFilter(req.query,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });
};