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


// This file act as a Controller which contains job tracker related all end points.

var taskStatusModule = require('_pr/model/long-job-tracker');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/taskstatus/*', sessionVerificationFunc);


    app.get('/taskstatus/:taskId/status', sessionVerificationFunc, function(req, res) {
        taskStatusModule.getTaskStatus(req.params.taskId, function(err, taskStatus) {
            if (err) {
                res.send(500);
                return;
            }
            taskStatus.getStatusByTimestamp(req.query.timestamp, function(err, data) {
                if (err) {
                    res.send(500);
                    return;
                }
                if (!data) {
                    res.send(404);
                    return;
                }
                res.send(data);
            });
        });
    });

};
