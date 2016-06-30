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
var blueprintModel = require('_pr/model/blueprint/blueprint');
var compositeBlueprintModel = require('_pr/model/composite-blueprints/composite-blueprints');
var appConfig = require('_pr/config');

const errorType = 'composite-blueprints';

var compositeBlueprintServices = module.exports = {};

compositeBlueprintServices.populateComposedBlueprints
    = function populateComposedBlueprints(compositeBlueprint, callback) {
    if(!('blueprints' in compositeBlueprint)) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    //@TODO allowed length should be read from config
    if(compositeBlueprint.blueprints.length <= 0 || compositeBlueprint.blueprints.length > 5) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    var blueprintsMap = {};
    for(var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function (blueprint) {
            blueprintsMap[blueprint.id] = i;
        })(compositeBlueprint.blueprints[i]);
    }

    blueprintModel.getByIds(Object.keys(blueprintsMap), function(err, blueprints) {
        if(err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else if(blueprints.length != compositeBlueprint.blueprints.length) {
            logger.error(err);
            var err = new Error('Bad Request');
            err.status = 400;
            return callback(err);
        } else {
            for(var j = 0; j < blueprints.length; j++) {
                (function (blueprintEntry) {
                    var tempBlueprint = blueprintEntry;
                    tempBlueprint.blueprintConfig.infraManagerData.versionsList[0].attributes
                        = compositeBlueprint.blueprints[blueprintsMap[blueprintEntry._id]].attributes;
                    compositeBlueprint.blueprints[blueprintsMap[blueprintEntry._id]] = tempBlueprint;
                })(blueprints[j]);
            }

            return callback(null, compositeBlueprint);
        }
    });
};

compositeBlueprintServices.validateCompositeBlueprintCreateRequest
    = function validateCompositeBlueprintCreateRequest(compositeBlueprint, callback) {
    if(!('blueprints' in compositeBlueprint)) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    //@TODO allowed length should be read from config
    if(compositeBlueprint.length <= 0 || compositeBlueprint.length > 5) {
        var err = new Error('Bad Request');
        err.status = 400;
        return callback(err);
    }

    //@TODO Check against supported blueprint types and cloud provider types
    var blueprintType = compositeBlueprint.blueprints[0].blueprintType;
    var providerId = compositeBlueprint.blueprints[0].blueprintConfig.cloudProviderId;

    for(var i = 0; i < compositeBlueprint.blueprints.length; i++) {
        (function (blueprint) {
            if((blueprint.blueprintType != blueprintType)
                || (blueprint.blueprintConfig.cloudProviderId != providerId)) {
                var err = new Error('Bad Request');
                err.status = 400;
                return callback(err);
            }
        })(compositeBlueprint.blueprints[i]);
    }

    return callback(null, compositeBlueprint);
};

compositeBlueprintServices.createCompositeBlueprint
    = function createCompositeBlueprint(compositeBlueprint, callback) {
    compositeBlueprintModel.createNew(compositeBlueprint, function (err, compositeBlueprint) {
        //@TODO To be generalized
        if (err && err.name == 'ValidationError') {
            logger.error(err);
            var err = new Error('Bad Request');
            err.status = 400;
            return callback(err);
        } else if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            return callback(err);
        } else {
            return callback(null, compositeBlueprint);
        }
    });
};

/*
compositeBlueprintService.formatCompositeBlueprint
    = function formatCompositeBlueprint(compositeBlueprint, callback) {
    var compositeBlueprintObject = compositeBlueprint;


};*/