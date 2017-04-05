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
var uuid = require('node-uuid');
var scriptValidator =require('_pr/validators/scriptValidator.js');
var validate = require('express-validation');
var settingWizard = require('_pr/model/setting-wizard');
var appConfig = require('_pr/config');
var settingsService = require('_pr/services/settingsService');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/scripts*', sessionVerificationFunc);


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
                settingWizard.getSettingWizardByOrgId(req.body.orgDetails.id,function(err,settingWizards){
                    if(err){
                        logger.error('Hit getting setting wizard error', err);
                        res.send(500);
                        return;
                    }
                    var settingWizardSteps = appConfig.settingWizardSteps;
                    if(settingWizards.currentStep.name === 'Gallery Setup') {
                        settingWizards.currentStep.nestedSteps[2].isCompleted = true;
                        settingWizards.currentStep.isCompleted = true;
                        settingWizards.previousStep = settingWizards.currentStep;
                        settingWizards.currentStep = settingWizards.nextStep;
                        settingWizards.nextStep = {name:'Wizard Status',isCompleted:true};
                        settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                            if (err) {
                                logger.error('Hit updating setting wizard error', err);
                                res.send(500);
                                return;
                            }
                            logger.debug("Exit post() for /script Gallery");
                            res.send(scripts);
                            return;
                        });
                    }else{
                        logger.debug("Exit post() for /script Gallery");
                        res.send(scripts);
                        return;
                    }
                })
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

    app.delete('/scripts/:scriptId',validate(scriptValidator.get), function(req, res) {
        scriptService.getScriptById(req.params.scriptId, function(err, scripts) {
            logger.debug(JSON.stringify(scripts));
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            scriptService.removeScriptById(req.params.scriptId, function (err, script) {
                if (err) {
                    if (err.code === 403) {
                        res.send(err.code, err.message);
                        return;
                    } else {
                        res.send("Error while removing script:");
                        return;
                    }
                } else {
                    settingsService.trackSettingWizard('scriptGallery', scripts.orgDetails.id, function (err, data) {
                        if (err) {
                             logger.error("Failed to update setting wizard item (%s)", err);
                             res.status(500).send(err);
                             return;
                        }
                        res.send("Successfully Removed script From the Database");
                        return;
                    })
                }
            });
        });
    });
};
