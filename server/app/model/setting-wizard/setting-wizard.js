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
var ObjectId = require('mongoose').Types.ObjectId;


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
    nextStep:Schema.Types.Mixed
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
        callback(null, settingWizardDetails);
        return;
    });
};

SettingWizardSchema.statics.updateSettingWizard = function updateSettingWizard(settingWizard, callback) {
    this.update({
        _id: new ObjectId(settingWizard._id)
    }, {
        $set: settingWizard
    }, {
        upsert: false
    },function(err, data) {
        if (err) {
            logger.debug("Got error while updating setting-Wizard: ", err);
            callback(err, null);
            return;
        }
        callback(null, data);
        return;
    });
};


SettingWizardSchema.statics.getSettingWizardByOrgId = function getSettingWizardByOrgId(orgId, callback) {
    this.findOne({
        orgId:orgId
    }, function(err, settingWizardDetails) {
        if (err) {
            logger.debug("Got error while fetching getSettingWizardByOrgId: ", err);
            callback(err, null);
        }
        callback(null, settingWizardDetails);
    });
};

SettingWizardSchema.statics.removeSettingWizardByOrgId = function removeSettingWizardByOrgId(orgId, callback) {
    this.remove({
        orgId:orgId
    }, function(err, data) {
        if (err) {
            logger.debug("Got error while deleting removeSettingWizardByOrgId: ", err);
            callback(err, null);
        }
        callback(null, data);
    });
};

var settingWizard = mongoose.model("settingWizard", SettingWizardSchema);
module.exports = settingWizard;