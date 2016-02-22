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



var d4dModel = require('./d4dmastersmodel.js');
var logger = require('_pr/logger')(module);

var MasterJson = function() {

    this.getMasterJson = function(id, callback) {
        d4dModel.findOne({
            id: id
        }, function(err, d4dMasterJson) {
            if (err) {
                callback(err, null);
                logger.debug("Hit and error:" + err);
                return;
            }
            if (d4dMasterJson) {
                callback(null, d4dMasterJson);

            } else {
                callback(err, null);
            }
        });
    }
}

module.exports = new MasterJson();
