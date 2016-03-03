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


var DockerBlueprintSchema = new Schema({
    dockerCompose: [{
        dockercontainerpathstitle: String,
        dockercontainerpaths: String,
        dockerrepotags: String,
        dockerreponame: String,
        dockerimagename: String,
        dockerlaunchparameters: String
    }],
    dockerContainerPathsTitle: {
        type: String,
        trim: true
    },
    dockerContainerPaths: {
        type: String,
        trim: true
    },
    dockerRepoTags: {
        type: String,
        trim: true
    },
    dockerRepoName: {
        type: String,
        trim: true
    },
    dockerLaunchParameters: {
        type: String,
        trim: true
    },
    dockerImageName: {
        type: String,
        trim: true
    }
});

DockerBlueprintSchema.statics.createNew = function(dockerData) {
    var self = this;
    dockerBlueprint = new self(dockerData);
    return dockerBlueprint;
};

var DockerBlueprint = mongoose.model('DockerBlueprint', DockerBlueprintSchema);

module.exports = DockerBlueprint;
