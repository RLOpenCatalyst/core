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


var winrm = require('winrm');

module.exports.exec = function(cmd, options, callback) {
    var path = options.path | '';
    var port = options.port | 5985;
    winrm.run(command, options.host, port, path, options.username, options.password, function(err, res) {
        //do stuff with response here
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, res);
    });
};