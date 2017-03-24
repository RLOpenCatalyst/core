/*
Copyright [2016] [Relevance Labs]

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


// The file contains all the end points for GlobalSettings

var logger = require('_pr/logger')(module);
var GlobalSettings = require('_pr/model/global-settings/global-settings');
var errorResponses = require('./error_responses');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/globalsettings*', sessionVerificationFunc);

    // Get all GlobalSettings
    app.get('/globalsettings', function(req, res) {
        GlobalSettings.getGolbalSettings(function(err, globalSettings) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (globalSettings) {
                res.send(200, globalSettings);
                return;
            }
        });
    });

    // Create GlobalSettings
    app.post('/globalsettings', function(req, res) {
        logger.debug("Got GlobalSettings data: ", JSON.stringify(req.body.aGlobalSettings));
        GlobalSettings.createNew(req.body.aGlobalSettings, function(err, globalSettings) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (globalSettings) {
                res.send(200, globalSettings);
                return;
            }
        });
    });

    // Update GlobalSettings
    app.post('/globalsettings/:gSettingsId/update', function(req, res) {
        logger.debug("Got GlobalSettings data: ", JSON.stringify(req.body.aGlobalSettings));
        GlobalSettings.getGolbalSettingsById(req.params.gSettingsId, function(err, globalSettings) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!globalSettings) {
                res.send(404, "GlobalSettings not found!");
                return;
            }
            GlobalSettings.updateSettings(req.params.gSettingsId, req.body.aGlobalSettings, function(err, globalSettings) {
                if (err) {
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                res.send(200, "Success");
            });
        });
    });

    // Get GlobalSettings w.r.t. Id
    app.get('/globalsettings/:gSettingsId', function(req, res) {
        GlobalSettings.getGolbalSettingsById(req.params.gSettingsId, function(err, globalSettings) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (globalSettings) {
                res.send(200, globalSettings);
                return;
            } else {
                res.send(404, "GlobalSettings not found!");
                return;
            }
        });
    });

    // Delete GlobalSettings w.r.t. Id
    app.delete('/globalsettings/:gSettingsId', function(req, res) {
        GlobalSettings.getGolbalSettingsById(req.params.gSettingsId, function(err, globalSettings) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (globalSettings) {
                GlobalSettings.removeGolbalSettings(req.params.gSettingsId, function(err, gSettings) {
                    if (err) {
                        logger.debug("Error while removing GlobalSettings: ", JSON.stringify(gSettings));
                        res(500, "Error while removing GlobalSettings:");
                        return;
                    }
                    if (gSettings) {
                        logger.debug("Successfully Removed GlobalSettings.");
                        res.send(200, "Successfully Removed GlobalSettings.");
                        return;
                    }
                });
            } else {
                res.send(404, "GlobalSettings not found!");
                return;
            }
        });
    });
};
