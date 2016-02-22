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

var JiraApi = require('jira').JiraApi;
var Jira = function(jiraSettings) {
    var jira = new JiraApi('https', jiraSettings.url, 443, jiraSettings.username, jiraSettings.password, '2.0.alpha1');

    this.getCurrentUser = function(callback) {
        jira.getCurrentUser(function(error, data) {
            if (error) {
                logger.debug("Jira Authentication failed..");
                callback(error, null);
                return;
            }
            logger.debug("Jira Authentication Success..");
            callback(null, data);
        });
    }
}
module.exports = Jira;
