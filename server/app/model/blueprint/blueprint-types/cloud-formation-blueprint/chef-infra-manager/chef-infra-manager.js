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
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var Schema = mongoose.Schema;

var CloundFormationBlueprintChefInfraManagerSchema = new Schema({
    versionsList: [{
        ver: {
            type: String,
            required: true
        },
        runlist: [{
            type: String,
            required: true
        }]
    }],
    latestVersion: {
        type: String,
        trim: true
    }
});


function generateBlueprintVersionNumber(prevVersion) {
    logger.debug("Enter generateBlueprintVersionNumber()", prevVersion);
    if (!prevVersion) {
        logger.warn("No prevVersion provided. Returning 0.1");
        return "0.1";
    }

    var parts = prevVersion.split('.');
    var major = parseInt(parts[0]);
    var minor = parseInt(parts[1]);
    minor++;

    if (minor === 10) {
        major++;
        minor = 0;
    }
    logger.debug("Exit generateBlueprintVersionNumber(%s) = %s.%s", prevVersion, major, minor);
    return major + '.' + minor;
}
// instance method 

CloundFormationBlueprintChefInfraManagerSchema.methods.update = function(updateData) {
    var ver = generateBlueprintVersionNumber(this.latestVersion);
    this.versionsList.push({
        ver: ver,
        runlist: updateData.runlist
    });
    this.latestVersion = ver;
};

CloundFormationBlueprintChefInfraManagerSchema.methods.getVersionData = function(ver) {
    for (var i = 0; i < this.versionsList.length; i++) {
        if (this.versionsList[i].ver === ver) {
            return this.versionsList[i];
        }
    }
};

CloundFormationBlueprintChefInfraManagerSchema.methods.getLatestVersion = function() {
    if (!this.versionsList.length) {
        return null;
    }
    return this.versionsList[this.versionsList.length - 1];
};

CloundFormationBlueprintChefInfraManagerSchema.statics.createNew = function(chefData) {
    var self = this;

    var chefInfraManager = new self({
        versionsList: [{
            ver: generateBlueprintVersionNumber(null),
            runlist: chefData.runlist
        }],
        latestVersion: generateBlueprintVersionNumber(null)
    });
    return chefInfraManager;
};

var CloundFormationBlueprintChefInfraManager = mongoose.model('CloundFormationBlueprintChefInfraManager', CloundFormationBlueprintChefInfraManagerSchema);

module.exports = CloundFormationBlueprintChefInfraManager;
