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
var Script = require('_pr/model/script/scriptExecutor');
var errorResponses = require('./error_responses');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var fileIo = require('_pr/lib/utils/fileio');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/scriptExecutor/*', sessionVerificationFunc);

    // Get all track
    app.get('/scriptExecutor', function(req, res) {
        Script.getScripts(function(err, scripts) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (scripts) {
                res.send(200, scripts);
                return;
            }
        });
    });

    // Create Script
    app.post('/scriptExecutor', function(req, res) {
        logger.debug("Got Script data: ", JSON.stringify(req.body));

        //updating the record when type is present.
        Script.createNew(req.body, function(err, scripts) {
            if (err) {
                logger.debug("error ", errorResponses.db.error);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (scripts) {
                logger.debug("post scriptData");
                res.send(200, scripts);
                return;
            }
        });
    });

    // Update Script
    app.post('/scriptExecutor/:scriptId/update', function(req, res) {
        Script.getScriptById(req.params.scriptId, function(err, scripts) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!scripts) {
                res.send(404, "scripts not found!");
                return;
            }
            Script.updateScript(req.params.scriptId, req.body, function(err, updateCount) {
                if (err) {
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                res.send(200, {
                    updateCount: updateCount
                });
            });
        });
    });

    // Get Scripts w.r.t. Id
    app.get('/scriptExecutor/:scriptId', function(req, res) {
        Script.getScriptById(req.params.scriptId, function(err, scripts) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (scripts) {
                res.send(200, scripts);
                return;
            } else {
                res.send(404, "Script not found!");
                return;
            }
        });
    });

    app.post('/scriptExecutor/uploadScript', function(req, res) {

        var fileName = uuid.v4();
        if (!appConfig.scriptDir) {
            res.send(500, {
                message: "Unable to upload to scriptDir"
            });
            return;
        }
        if (req.files && req.files.file) {
            console.log(req.files.file);
            fileName = fileName + '_' + req.files.file.originalFilename;
            var destPath = appConfig.scriptDir + fileName;
            console.log(destPath);
            fileIo.copyFile(req.files.file.path, destPath, function(err) {
                if (err) {
                    res.status(500).send({
                        message: "Unable to save file"
                    });
                    return;
                }
                res.status(201).send({
                    filename: fileName
                });
            });
        } else {
            res.status(400).send({
                message: "Bad Request"
            });
        }
    });

    // Delete Script w.r.t. Id
    app.delete('/scriptExecutor/:scriptId', function(req, res) {
        Script.getScriptById(req.params.scriptId, function(err, script) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (script) {
                Script.removeScripts(req.params.scriptId, function(err, script) {
                    if (err) {
                        logger.debug("Error while removing script: ", JSON.stringify(script));
                        res(500, "Error while removing script:");
                        return;
                    }
                    if (script) {
                        res.send(200, "Successfully Removed script From the Database");
                        return;
                    }
                });
            } else {
                res.send(404, "script not found!");
                return;
            }
        });
    });

};
