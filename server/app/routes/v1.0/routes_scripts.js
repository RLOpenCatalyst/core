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

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/scripts/*', sessionVerificationFunc);


    app.get('/scripts', function(req, res) {
        scriptService.getScripts(req.query,function(err, scripts) {
            if (err) {
                res.send(errorResponses.db.error);
                return;
            }else{
                res.send(scripts);
                return;
            }
        });
    });

    app.post('/scripts/save/scriptData',saveAndUpdateScript);
    app.put('/scripts/update/scriptData',saveAndUpdateScript);

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

    app.get('/scripts/:scriptId', function(req, res) {
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

    app.post('/scripts/uploadScript', function(req, res) {
        var fileName = uuid.v4();
        if (!appConfig.scriptDir) {
            res.send({
                message: "Unable to upload to scriptDir"
            });
            return;
        }else if (req.files && req.files.file) {
            fileName = fileName + '_' + req.files.file.originalFilename;
            var desPath = appConfig.scriptDir + fileName;
            fileIo.copyFile(req.files.file.path, desPath, function(err) {
                if (err) {
                    res.send({message: "Unable to save file"});
                    return;
                }else{
                    res.send({fileName: fileName, filePath: appConfig.scriptDir});
                }
            });
        } else {
            res.send({message: "Bad Request"});
        }
    });

    app.delete('/scripts/:scriptId', function(req, res) {
        scriptService.removeScriptById(req.params.scriptId, function(err, script) {
            if (err) {
                res.send("Error while removing script:");
                return;
            }else{
                res.send("Successfully Removed script From the Database");
                return;
            }
        });
    });

};
