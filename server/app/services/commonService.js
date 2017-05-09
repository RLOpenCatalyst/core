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
var json2yml = require('json2yaml');

const errorType = 'commonService';

var commonService = module.exports = {};

commonService.convertJson2Yml = function convertJson2Yml(reqBody,callback){
    var commonJson = {
        id:reqBody.name,
        name:reqBody.name,
        desc:reqBody.desc,
        action:reqBody.action,
        type:reqBody.type,
        functionality:reqBody.category,
        subType:reqBody.subType,
        input:reqBody.input,
        execution:reqBody.execution,
        output:reqBody.output
    }
}



