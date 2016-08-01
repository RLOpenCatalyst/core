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

// The file contains all the end points for Tracks

var logger = require('_pr/logger')(module);
var scriptService = require('_pr/services/scriptService');
var errorResponses = require('./error_responses');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var fileIo = require('_pr/lib/utils/fileio');
var scriptValidator =require('_pr/validators/scriptValidator.js');
var validate = require('express-validation');
var fileUpload = require('_pr/model/file-upload/file-upload');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/scripts/*', sessionVerificationFunc);


    app.get('/scripts', function(req, res) {
        if(req.query.filterBy){
            scriptService.getScriptListByType(req.query.filterBy,function(err, scripts) {
                if (err) {
                    res.send(errorResponses.db.error);
                    return;
                }else{
                    res.send(scripts);
                    return;
                }
            });
        }else {
            scriptService.getScriptListWithPagination(req.query, function (err, scripts) {
                if (err) {
                    res.send(errorResponses.db.error);
                    return;
                } else {
                    res.send(scripts);
                    return;
                }
            });
        }
    });

    app.post('/scripts/save/scriptData',validate(scriptValidator.create),saveAndUpdateScript);
    app.put('/scripts/update/scriptData',validate(scriptValidator.create),saveAndUpdateScript);

    function saveAndUpdateScript(req,res,next) {
        scriptService.saveAndUpdateScript(req.body, function (err, scripts) {
            if (err) {
                res.send(errorResponses.db.error);
                return;
            } else {
                res.send(scripts);
                return;
            }
        });
    }

    app.get('/scripts/:scriptId',validate(scriptValidator.get), function(req, res) {
        scriptService.getScriptById(req.params.scriptId, function(err, scripts) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }else if (scripts.length > 0) {
                res.send(scripts);
                return;
            }else {
                res.send("Script not found!");
                return;
            }
        });
    });
    
    app.delete('/scripts/:scriptId',validate(scriptValidator.get), function (req, res) {
        scriptService.removeScriptById(req.params.scriptId, function(err, script) {
            if (err) {
                if(err.code === 403){
                    res.send(err.code, err.message);
                    return;
                }else {
                    res.send("Error while removing script:");
                    return;
                }
            }else{
                res.send("Successfully Removed script From the Database");
                return;
            }
        });
    });

};
