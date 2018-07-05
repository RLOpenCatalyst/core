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


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
var schemaValidator = require('./schema-validator');
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema;

var BlueprintSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.orgIdValidator
    },
    bgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.bgIdValidator
    },
    projectId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.projIdValidator
    },
    imageId: {
        type: String,
        required: true,
        trim: true
    },
    providerId: {
        type: String,
        required: true,
        trim: true
    },
    keyPairId: {
        type: String,
        required: true,
        trim: true
    },
    subnetId: {
        type: String,
        required: true,
        trim: true
    },
    vpcId: {
        type: String,
        required: true,
        trim: true
    },
    securityGroupIds: {
        type: [String],
        required: true,
        trim: true
    },
    iconpath: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.blueprintNameValidator
    },
    appUrls: [{
        name: String,
        url: String
    }],
    templateId: {
        type: String,
        required: true,
        trim: true
    },
    templateType: {
        type: String,
        required: true,
        trim: true
    },
    dockercompose: [{
        dockercontainerpathstitle: String,
        dockercontainerpaths: String,
        dockerrepotags: String,
        dockerreponame: String,
        dockerimagename: String,
        dockerlaunchparameters: String
    }],
    dockercontainerpathstitle: {
        type: String,
        trim: true
    },
    dockercontainerpaths: {
        type: String,
        trim: true
    },
    dockerrepotags: {
        type: String,
        trim: true
    },
    dockerreponame: {
        type: String,
        trim: true
    },
    dockerlaunchparameters: {
        type: String,
        trim: true
    },
    dockerimagename: {
        type: String,
        trim: true
    },
    templateComponents: [{
        type: String,
        required: true
    }],
    instanceType: {
        type: String,
    },
    instanceOS: {
        type: String,
    },
    instanceAmiid: {
        type: String,
    },
    instanceUsername: {
        type: String,
        required: true
    },
    importInstance: {
        type: Boolean
    },
    chefServerId: {
        type: String,
        required: true
    },
    users: [{
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.catalystUsernameValidator
    }],
    versionsList: [{
        ver: {
            type: String,
            required: true
        },
        runlist: [{
            type: String,
            required: true
        }],
        expirationDays: {
            type: Number
        },
    }],
    latestVersion: {
        type: String,
        trim: true
    },
    cloudFormationStackName: {
        type: String,
        trim: true
    },
    cloudFormationStackParameters: [{
        ParameterKey: {
            type: String,
            trim: true
        },
        ParameterValue: {
            type: String,
            trim: true
        }
    }]

});

BlueprintSchema.plugin(mongoosePaginate);
var Blueprint = mongoose.model('blueprints_old', BlueprintSchema);

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

var BlueprintsDao = function() {

    this.getBlueprintById = function(blueprintId, callback) {
        logger.debug("Enter getBlueprintById(%s)", blueprintId);
        Blueprint.find({
            "_id": new ObjectId(blueprintId)
        }, function(err, data) {
            if (err) {
                logger.error("Failed getting Blueprint >> %s", blueprintId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintById (ID = %s)", blueprintId);
            callback(null, data);

        });
    };

    this.getBlueprintsByProjectAndEnvId = function(projectId, envId, blueprintType, userName, callback) {
        logger.debug("Enter getBlueprintsByProjectAndEnvId (%s, %s, %s, %s)", projectId, envId, blueprintType, userName);

        var queryObj = {
            projectId: projectId,
            envId: envId
        }
        if (blueprintType) {
            queryObj.templateType = blueprintType;
        }
        if (userName) {
            queryObj.users = userName;
        }
        Blueprint.find(queryObj, function(err, data) {
            if (err) {
                logger.error("Error in getBlueprintsByProjectAndEnvId ", err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintsByProjectAndEnvId");
            callback(null, data);
        });
    };

    this.getBlueprintsByOrgProjectAndEnvId = function(orgId, projectId, envId, blueprintType, userName, callback) {
        logger.debug("Enter getBlueprintsByOrgProjectAndEnvId(%s,%s, %s, %s, %s)", orgId, projectId, envId, blueprintType, userName);
        var queryObj = {
            orgId: orgId,
            projectId: projectId,
            envId: envId
        }
        if (blueprintType) {
            queryObj.templateType = blueprintType;
        }
        if (userName) {
            queryObj.users = userName;
        }

        Blueprint.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintsByOrgProjectAndEnvId(%s,%s, %s, %s, %s)", orgId, projectId, envId, blueprintType, userName);
            callback(null, data);
        });
    };
    this.getBlueprintsByProjectId = function(projectId, callback) {
        logger.debug("Enter getBlueprintsByProjectId(%s)", projectId);
        var queryObj = {
            $or: [{
                projectId: projectId
            }, {
                chefServerId: projectId
            }]
        }
        Blueprint.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintsByProjectId(%s)", projectId);
            callback(null, data);
        });
    };

    this.getBlueprintsByOrgBgProjectAndEnvId = function(orgId, bgId, projectId, envId, blueprintType, userName, callback) {
        logger.debug("Enter getBlueprintsByOrgBgProjectAndEnvId(%s,%s,%s, %s, %s, %s)", orgId, bgId, projectId, envId, blueprintType, userName);
        var queryObj = {
            orgId: orgId,
            bgId: bgId,
            projectId: projectId,
            envId: envId
        }
        if (blueprintType) {
            queryObj.templateType = blueprintType;
        }

        Blueprint.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintsByOrgBgProjectAndEnvId(%s,%s,%s, %s, %s, %s)", orgId, bgId, projectId, envId, blueprintType, userName);
            callback(null, data);
        });

    };

    
    this.getBlueprintsByOrgBgProject = function(orgId, bgId, projectId, blueprintType, userName, callback) {
        logger.debug("Enter getBlueprintsByOrgBgProject(%s,%s, %s, %s, %s)", orgId, bgId, projectId, blueprintType, userName);
        var queryObj = {
            orgId: orgId,
            bgId: bgId,
            projectId: projectId,
        }
        if (blueprintType) {
            queryObj.templateType = blueprintType;
        }

        Blueprint.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintsByOrgBgProject(%s,%s, %s, %s, %s)", orgId, bgId, projectId, blueprintType, userName);
            callback(null, data);
        });

    };
    
    this.createBlueprint = function(blueprintData, callback) {
        logger.debug("Enter createBlueprint >> " + JSON.stringify(blueprintData));
        var blueprint = new Blueprint({
            orgId: blueprintData.orgId,
            bgId: blueprintData.bgId,
            projectId: blueprintData.projectId,
            imageId: blueprintData.imageId,
            keyPairId: blueprintData.keyPairId,
            subnetId: blueprintData.subnetId,
            vpcId: blueprintData.vpcId,
            providerId: blueprintData.providerId,
            securityGroupIds: blueprintData.securityGroupIds,
            name: blueprintData.name,
            appUrls: blueprintData.appUrls,
            iconpath: blueprintData.iconpath,
            templateId: blueprintData.templateId,
            templateType: blueprintData.templateType,
            dockercontainerpathstitle: blueprintData.dockercontainerpathstitle,
            dockercontainerpaths: blueprintData.dockercontainerpaths,
            dockerrepotags: blueprintData.dockerrepotags,
            dockerreponame: blueprintData.dockerreponame,
            dockerimagename: blueprintData.dockerimagename,
            dockerlaunchparameters: blueprintData.dockerlaunchparameters,
            dockercompose: blueprintData.dockercompose,
            templateComponents: blueprintData.templateComponents,
            chefServerId: blueprintData.chefServerId,
            instanceType: blueprintData.instanceType,
            instanceOS: blueprintData.instanceOS,
            instanceAmiid: blueprintData.instanceAmiid,
            instanceUsername: blueprintData.instanceUsername,
            importInstance: blueprintData.importInstance,
            users: blueprintData.users,
            versionsList: [{
                ver: generateBlueprintVersionNumber(null),
                runlist: blueprintData.runlist,
                expirationDays: blueprintData.expirationDays,
            }],
            latestVersion: generateBlueprintVersionNumber(null),
            cloudFormationStackName: blueprintData.cloudFormationStackName,
            cloudFormationStackParameters: blueprintData.cloudFormationStackParameters
        });

        blueprint.save(function(err, data) {
            if (err) {
                logger.error(" !!! Failed to create Blueprint !!!", err);

                callback(err, null);
                return;
            }
            logger.debug("Blueprint Created " + JSON.stringify(blueprint));
            callback(null, data);
        });
    };

    this.updateBlueprint = function(blueprintId, updateData, callback) {
        logger.debug("Enter updateBlueprint(%s, %s)", blueprintId, JSON.stringify(updateData));
        this.getBlueprintById(blueprintId, function(err, data) {
            if (err) {
                logger.error("Exit updateBlueprint because getBlueprintById failed ", err);
                callback(err, null);
                return;
            }
            if (data.length) {
                logger.debug("updateBlueprint: Beginning Update ");
                var latestVersion = data[0].latestVersion;
                var newVersion = generateBlueprintVersionNumber(latestVersion);
                Blueprint.update({
                    "_id": new ObjectId(blueprintId)
                }, {
                    $set: {
                        latestVersion: newVersion
                    },
                    $push: {
                        versionsList: {
                            ver: newVersion,
                            runlist: updateData.runlist,
                            expirationDays: updateData.expirationDays,
                        }
                    }
                }, {
                    upsert: false
                }, function(err, updatedData) {
                    if (err) {
                        logger.error(" updateBlueprint Failed - ", err);
                        callback(err, null);
                        return;
                    }

                    logger.debug("Exit updateBlueprint");
                    callback(null, {
                        version: newVersion,
                        cout: updatedData
                    });
                });
            } else {
                callback(null, 0);
            }
        });
    };

    this.removeBlueprintbyId = function(blueprintId, callback) {
        logger.debug("Enter removeBlueprintbyId(%s)", blueprintId);
        Blueprint.remove({
            "_id": ObjectId(blueprintId)
        }, function(err, data) {
            if (err) {
                logger.error("removeBlueprintbyId Failed - ", err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeBlueprintbyId(%s)", blueprintId);
            callback(null, data);
        });
    }

    this.getBlueprintVersionData = function(blueprintId, version, callback) {
        logger.debug("Enter getBlueprintVersionData(%s, %s)", blueprintId, version);
        var queryObj = {
            "_id": new ObjectId(blueprintId)
        };

        var projectionObj = {};
        if (version) {
            projectionObj = {
                versionsList: {
                    $elemMatch: {
                        ver: version
                    }
                }
            }

            queryObj["versionsList.ver"] = version;
        }

        Blueprint.find(queryObj, projectionObj, function(err, data) {
            if (err) {
                logger.error("getBlueprintVersionData Failed - ", err);
                callback(err, null);
                return;
            }

            if (data.length) {
                logger.debug("Exit getBlueprintVersionData");
                callback(null, data[0].versionsList);
            } else {
                logger.debug("Exit getBlueprintVersionData [] ");
                callback(null, []);
            }
        });
    }


    this.getBlueprintByImageId = function(imageId, callback) {
        logger.debug("Enter getBlueprintByImageId(%s)", imageId);
        Blueprint.find({
            "imageId": imageId
        }, function(err, bluePrints) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
            if (bluePrints.length) {
                logger.debug("Exit getBlueprintByImageId (ID = %s)", imageId);
                callback(null, bluePrints[0]);
            } else {
                callback(null, null);
            }

        });
    };

    this.getBlueprintByKeyPairId = function(keyPairId, callback) {
        logger.debug("Enter getBlueprintByKeyPairId(%s)", keyPairId);
        Blueprint.find({
            "keyPairId": keyPairId
        }, function(err, data) {
            if (err) {
                logger.error("Failed getting Blueprint >> %s", keyPairId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintByKeyPairId (ID = %s)", keyPairId);
            if (data) {
                callback(null, data);
            } else {
                callback(null, null);
            }

        });
    };

    this.getBlueprintByTemplateType = function(templateType, callback) {
        logger.debug("Enter getBlueprintByTemplateType(%s)", templateType);
        Blueprint.find({
            "templateType": templateType
        }, function(err, data) {
            if (err) {
                logger.error("Failed getting Blueprint >> %s", templateType, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getBlueprintByTemplateType (templateType = %s)", templateType);
            callback(null, data);

        });
    };

    this.getBlueprintByOrgBgProjectProviderType = function(query, callback) {
        Blueprint.paginate(query.queryObj, query.options, function(err, blueprints) {
            if (err) {
                logger.error("Failed to getBlueprintByOrgBgProjectProviderType", err);
                callback(err, null);
                return;
            }
            callback(null, blueprints);
        });
    };
}

module.exports = new BlueprintsDao();
