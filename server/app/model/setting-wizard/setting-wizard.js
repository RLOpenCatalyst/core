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
var mongoose = require('mongoose');


var Schema = mongoose.Schema;

var SettingWizardSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true
    },
    orgName: {
        type: String,
        required: true,
        trim: true
    },
    previousStep: Schema.Types.Mixed,
    currentStep: Schema.Types.Mixed,
    nextStep:Schema.Types.Mixed,
    isCompleted: {
        type: String,
        required: true,
        trim: true
    }
});


SettingWizardSchema.statics.createSettingWizard = function createSettingWizard(settingWizard, callback) {
    var that = this;
    var settingWizardObj = new that(settingWizard);
    settingWizardObj.save(function(err, settingWizardDetails) {
        if (err) {
            logger.debug("Got error while creating setting-Wizard: ", err);
            callback(err, null);
            return;
        }
        logger.debug("Creating setting-Wizard: ", JSON.stringify(settingWizardDetails));
        callback(null, settingWizardDetails);
        return;
    });
};


SettingWizardSchema.statics.getSettingWizardByOrgId = function getSettingWizardByOrgId(orgId, callback) {
    this.find({
      orgId:orgId
    }, function(err, settingWizardDetails) {
        if (err) {
            logger.debug("Got error while fetching getSettingWizardByOrgId: ", err);
            callback(err, null);
        }
        logger.debug("Got setting-Wizard: ", JSON.stringify(settingWizardDetails));
        callback(null, settingWizardDetails);
    });
};

var settingWizard = mongoose.model("settingWizard", SettingWizardSchema);
module.exports = settingWizard;
