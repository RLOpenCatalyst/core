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


// This file act as a Controller which contains chef-client execution related all end points.


var ChefClientExecution = require('_pr/model/classes/instance/chefClientExecution/chefClientExecution.js');
var errorResponses = require('./error_responses');


module.exports.setRoutes = function(app) {
    app.post('/chefClientExecution/:executionId', function(req, res) {
        ChefClientExecution.getExecutionById(req.params.executionId, function(err, chefClientExecution) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (chefClientExecution) {
                chefClientExecution.update(req.body.message, req.body.jsonAttribute, function(err, data) {
                    if (err) {
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    res.send(200, {
                        message: "Updated"
                    });
                });
            } else {
                res.send(404, {
                    message: "Execution id does not exist"
                });
            }
        });
    });

    app.get('/chefClientExecution/:executionId', function(req, res) {

        ChefClientExecution.getExecutionById(req.params.executionId, function(err, chefClientExecution) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (chefClientExecution) {
                res.send(chefClientExecution);
            } else {
                res.send(404, {
                    message: "Execution id does not exist"
                });
            }
        });
    });
};
