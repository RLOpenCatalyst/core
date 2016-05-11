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

var Chef = require('_pr/lib/chef.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var appConfig = require('_pr/config');

var schemaValidator = require('_pr/model/utils/schema-validator');

var uniqueValidator = require('mongoose-unique-validator');

var DockerBlueprint = require('./blueprint-types/docker-blueprint/docker-blueprint');
var InstanceBlueprint = require('./blueprint-types/instance-blueprint/instance-blueprint');
var OpenstackBlueprint = require('./blueprint-types/instance-blueprint/openstack-blueprint/openstack-blueprint');
var AzureBlueprint = require('./blueprint-types/instance-blueprint/azure-blueprint/azure-blueprint');
var VmwareBlueprint = require('./blueprint-types/instance-blueprint/vmware-blueprint/vmware-blueprint');

var CloudFormationBlueprint = require('./blueprint-types/cloud-formation-blueprint/cloud-formation-blueprint');
var ARMTemplateBlueprint = require('./blueprint-types/arm-template-blueprint/arm-template-blueprint');
var utils = require('../classes/utils/utils.js');
var nexus = require('_pr/lib/nexus.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var uuid = require('node-uuid');
var AppData = require('_pr/model/app-deploy/app-data');

var BLUEPRINT_TYPE = {
    DOCKER: 'docker',
    AWS_CLOUDFORMATION: 'aws_cf',
    INSTANCE_LAUNCH: "instance_launch",
    OPENSTACK_LAUNCH: "openstack_launch",
    HPPUBLICCLOUD_LAUNCH: "hppubliccloud_launch",
    AZURE_LAUNCH: "azure_launch",
    VMWARE_LAUNCH: "vmware_launch",
    AZURE_ARM_TEMPLATE: "azure_arm"
};

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
    name: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.blueprintNameValidator
    },
    blueprintType: {
        type: String,
        required: true,
        trim: true
    },
    iconpath: {
        type: String,
        trim: true
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
    users: [{
        type: String,
        //required: true,
        trim: true,
        validate: schemaValidator.catalystUsernameValidator
    }],
    templateType: {
        type: String,
        required: true,
        trim: true
    },
    nexus: {
        repoId: String,
        url: String,
        version: String,
        repoName: String,
        groupId: String,
        artifactId: String
    },
    docker: {
        repoId: String,
        image: String,
        containerId: String,
        containerPort: String,
        hostPort: String,
        dockerUser: String,
        dockerPassword: String,
        dockerEmailId: String,
        imageTag: String
    },
    blueprintConfig: Schema.Types.Mixed,
    version: {
        type: String,
        required: true,
        trim: true,
    },
    parentId: {
        type: String,
        required: false
    }

});

function getBlueprintConfigType(blueprint) {
    var BlueprintConfigType;
    if ((blueprint.blueprintType === BLUEPRINT_TYPE.INSTANCE_LAUNCH) && blueprint.blueprintConfig) {
        BlueprintConfigType = InstanceBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.DOCKER) && blueprint.blueprintConfig) {
        BlueprintConfigType = DockerBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.AWS_CLOUDFORMATION) && blueprint.blueprintConfig) {
        BlueprintConfigType = CloudFormationBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.AZURE_ARM_TEMPLATE) && blueprint.blueprintConfig) {
        BlueprintConfigType = ARMTemplateBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.OPENSTACK_LAUNCH || blueprint.blueprintType === BLUEPRINT_TYPE.HPPUBLICCLOUD_LAUNCH) && blueprint.blueprintConfig) {
        BlueprintConfigType = OpenstackBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.AZURE_LAUNCH) && blueprint.blueprintConfig) {
        BlueprintConfigType = AzureBlueprint;
    } else if ((blueprint.blueprintType === BLUEPRINT_TYPE.VMWARE_LAUNCH) && blueprint.blueprintConfig) {
        logger.debug('this is test');
        BlueprintConfigType = VmwareBlueprint;
    } else {
        return;
    }
    var blueprintConfigType = new BlueprintConfigType(blueprint.blueprintConfig);
    return blueprintConfigType;
}

// instance methods
BlueprintSchema.methods.update = function(updateData, callback) {
    var blueprintConfigType = getBlueprintConfigType(this);
    if (!blueprintConfigType) {
        process.nextTick(function() {
            callback({
                message: "Invalid Blueprint Type"
            }, null);
        });
    }
    blueprintConfigType.update(updateData);
    this.blueprintConfig = blueprintConfigType;
    this.save(function(err, updatedBlueprint) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, updatedBlueprint);
    });
};

BlueprintSchema.methods.getVersionData = function(ver) {
    var blueprintConfigType = getBlueprintConfigType(this);
    if (!blueprintConfigType) {
        return null;
    }

    return blueprintConfigType.getVersionData(ver);
};

BlueprintSchema.methods.getLatestVersion = function() {
    var blueprintConfigType = getBlueprintConfigType(this);
    if (!blueprintConfigType) {
        return null;
    }

    return blueprintConfigType.getLatestVersion();
};

BlueprintSchema.methods.getInfraManagerData = function() {
    var blueprintConfigType = getBlueprintConfigType(this);
    if (!blueprintConfigType) {
        return null;
    }

    return blueprintConfigType.getInfraManagerData();
}

BlueprintSchema.methods.getCloudProviderData = function() {
    var blueprintConfigType = getBlueprintConfigType(this);
    if (!blueprintConfigType) {
        return null;
    }

    return blueprintConfigType.getCloudProviderData();
}

BlueprintSchema.methods.launch = function(opts, callback) {
    var infraManager = this.getInfraManagerData();
    var self = this;
    configmgmtDao.getEnvNameFromEnvId(opts.envId, function(err, envName) {
        if (err) {
            callback({
                message: "Failed to get env name from env id"
            }, null);
            return;
        }
        if (!envName) {
            callback({
                "message": "Unable to find environment name from environment id"
            });
            return;
        }

        configmgmtDao.getChefServerDetails(infraManager.infraManagerId, function(err, chefDetails) {
            if (err) {
                logger.error("Failed to getChefServerDetails", err);
                callback({
                    message: "Failed to getChefServerDetails"
                }, null);
                return;
            }
            if (!chefDetails) {
                logger.error("No CHef Server Detailed available.", err);
                callback({
                    message: "No Chef Server Detailed available"
                }, null);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url
            });
            logger.debug('Chef Repo Location = ', chefDetails.chefRepoLocation);

            var blueprintConfigType = getBlueprintConfigType(self);

            if (!self.appUrls) {
                self.appUrls = [];
            }
            var appUrls = self.appUrls;
            if (appConfig.appUrls && appConfig.appUrls.length) {
                appUrls = appUrls.concat(appConfig.appUrls);
            }

            chef.getEnvironment(envName, function(err, env) {
                if (err) {
                    logger.error("Failed chef.getEnvironment", err);
                    res.send(500);
                    return;
                }

                if (!env) {
                    chef.createEnvironment(envName, function(err) {
                        if (err) {
                            logger.error("Failed chef.createEnvironment", err);
                            res.send(500);
                            return;
                        }
                        blueprintConfigType.launch({
                            infraManager: chef,
                            ver: opts.ver,
                            envName: envName,
                            envId: opts.envId,
                            stackName: opts.stackName,
                            blueprintName: self.name,
                            orgId: self.orgId,
                            bgId: self.bgId,
                            projectId: self.projectId,
                            appUrls: appUrls,
                            sessionUser: opts.sessionUser,
                            users: self.users,
                            blueprintData: self,
                        }, function(err, launchData) {
                            callback(err, launchData);
                        });

                    });
                } else {
                    blueprintConfigType.launch({
                        infraManager: chef,
                        ver: opts.ver,
                        envName: envName,
                        envId: opts.envId,
                        stackName: opts.stackName,
                        blueprintName: self.name,
                        orgId: self.orgId,
                        bgId: self.bgId,
                        projectId: self.projectId,
                        appUrls: appUrls,
                        sessionUser: opts.sessionUser,
                        users: self.users,
                        blueprintData: self,
                    }, function(err, launchData) {
                        callback(err, launchData);
                    });
                }

            });

        });
    });
};

// static methods
BlueprintSchema.statics.createNew = function(blueprintData, callback) {
    logger.debug('blueprintData.cloudFormationData ==>', blueprintData.cloudFormationData);

    var blueprintConfig, blueprintType;
    if ((blueprintData.blueprintType === BLUEPRINT_TYPE.INSTANCE_LAUNCH) && blueprintData.instanceData) {
        blueprintType = BLUEPRINT_TYPE.INSTANCE_LAUNCH;
        blueprintConfig = InstanceBlueprint.createNew(blueprintData.instanceData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.DOCKER) && blueprintData.dockerData) {
        blueprintType = BLUEPRINT_TYPE.DOCKER;
        blueprintConfig = DockerBlueprint.createNew(blueprintData.dockerData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.AWS_CLOUDFORMATION) && blueprintData.cloudFormationData) {
        blueprintType = BLUEPRINT_TYPE.AWS_CLOUDFORMATION;
        blueprintConfig = CloudFormationBlueprint.createNew(blueprintData.cloudFormationData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.AZURE_ARM_TEMPLATE) && blueprintData.armTemplateData) {
        blueprintType = BLUEPRINT_TYPE.AZURE_ARM_TEMPLATE;
        blueprintConfig = ARMTemplateBlueprint.createNew(blueprintData.armTemplateData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.OPENSTACK_LAUNCH) && blueprintData.instanceData) {
        blueprintType = BLUEPRINT_TYPE.OPENSTACK_LAUNCH;
        logger.debug('blueprintData openstack instacedata ==>', blueprintData.instanceData);
        blueprintConfig = OpenstackBlueprint.createNew(blueprintData.instanceData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.HPPUBLICCLOUD_LAUNCH) && blueprintData.instanceData) {
        blueprintType = BLUEPRINT_TYPE.HPPUBLICCLOUD_LAUNCH;
        logger.debug('blueprintData openstack instacedata ==>', blueprintData.instanceData);
        blueprintConfig = OpenstackBlueprint.createNew(blueprintData.instanceData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.AZURE_LAUNCH) && blueprintData.instanceData) {
        blueprintType = BLUEPRINT_TYPE.AZURE_LAUNCH;
        logger.debug('blueprintData azure instacedata ==>', blueprintData.instanceData);
        blueprintConfig = AzureBlueprint.createNew(blueprintData.instanceData);
        blueprintConfig.cloudProviderData = AzureBlueprint.createNew(blueprintData.instanceData);
    } else if ((blueprintData.blueprintType === BLUEPRINT_TYPE.VMWARE_LAUNCH) && blueprintData.instanceData) {
        blueprintType = BLUEPRINT_TYPE.VMWARE_LAUNCH;
        logger.debug('blueprintData vmware instacedata ==>', blueprintData.instanceData);
        blueprintConfig = VmwareBlueprint.createNew(blueprintData.instanceData);

    } else {
        process.nextTick(function() {
            callback({
                message: "Invalid Blueprint Type sdds"
            }, null);
        });
        return;
    }
    logger.debug('blueprint type ', blueprintData);
    //Set the version if blueprint id is null
    logger.debug('blueprint id ..... ', blueprintData.id);
    this.getCountByParentId(blueprintData.id, function(err, count) {
        if (count <= 0) {
            count = 1;
        } else {
            count++;
        }
        var blueprintObj = {
            orgId: blueprintData.orgId,
            bgId: blueprintData.bgId,
            projectId: blueprintData.projectId,
            name: blueprintData.name,
            appUrls: blueprintData.appUrls,
            iconpath: blueprintData.iconpath,
            templateId: blueprintData.templateId,
            templateType: blueprintData.templateType,
            users: blueprintData.users,
            blueprintConfig: blueprintConfig,
            blueprintType: blueprintType,
            nexus: blueprintData.nexus,
            docker: blueprintData.docker,
            version: count,
            parentId: blueprintData.id
        };
        var blueprint = new Blueprints(blueprintObj);
        logger.debug(blueprint);
        logger.debug('saving');
        blueprint.save(function(err, blueprint) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
            logger.debug('save Complete');
            callback(null, blueprint);
        });
    });

};


BlueprintSchema.statics.getById = function(id, callback) {
    logger.debug('finding blueprint by id ===>' + id);
    this.findById(id, function(err, blueprint) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, blueprint);
    });
};

BlueprintSchema.statics.getCountByParentId = function(parentid, callback) {
    if (parentid) {
        logger.debug('finding blueprint by parentid or id ===>' + parentid);
        this.find({
            $or: [{
                parentId: parentid
            }, {
                _id: ObjectId(parentid)
            }]
        }, function(err, blueprint) {
            if (err) {
                callback(err, 0);
                return;
            } else {
                logger.debug('Found bp.[', blueprint.length, ']');
                callback(null, blueprint.length);
            }
        });
    } else {
        callback(null, 0);
        return;
    }
};

BlueprintSchema.statics.getByIds = function(ids, callback) {
    logger.debug('finding blueprint by id ===>' + ids);
    if (ids && ids.length) {
        this.find({
            "_id": {
                $in: ids
            }
        }, function(err, blueprints) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, blueprints);
        });
    }
};

BlueprintSchema.statics.removeById = function(id, callback) {
    this.remove({
        $or: [{
            "_id": ObjectId(id)
        }, {
            "parentId": id
        }]
    }, function(err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, data);
    });

};

BlueprintSchema.statics.removeByIds = function(ids, callback) {

    var objids = [];
    ids.forEach(function(v) {

        objids.push(ObjectId(v));
    });
    this.remove({
        $or: [{
            "_id": {
                $in: objids
            }
        }, {
            "parentId": ids
        }]
    }, function(err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, data);
    });

};


BlueprintSchema.statics.copyByIds = function(ids, orgid, bgid, projid, callback) {

    var copiedBlueprints = [];
    var objids = [];
    ids.forEach(function(v) {
        objids.push(ObjectId(v));
    });
    var self = this;
    logger.debug(objids);
    logger.debug(ids);

    self.find({
        $and: [{
            "orgId": orgid
        }, {
            "bgId": bgid
        }, {
            "projectId": projid
        }]
    }, function(err, dupbp) {
        if (err) {
            logger.debug("Error in find", err);
            return callback({
                message: "Blueprint not found"
            }, null);
        }
        //$or:[{"_id": {$in:objids}},{"parentId":{$in:ids}}]
        self.find({
            $or: [{
                "_id": {
                    $in: objids
                }
            }]
        }, function(err, data) {

            logger.debug('Found:', data.length);
            var count = 0;
            var oldProjId;
            for (var bpi = 0; bpi < data.length; bpi++) {
                //Generate a new ID
                var newBPID = new ObjectId();
                //set new orgid, buid and projid
                data[bpi].orgId = orgid;
                data[bpi].bgId = bgid;
                oldProjId = data[bpi].projectId;
                data[bpi].projectId = projid;
                logger.debug('Name:', data[bpi]["name"]);
                // for(var _bpi = 0; _bpi < data.length;_bpi++){
                //     if(data[bpi]["_id"] == data[_bpi]["parentId"]){
                //         var oldpid = data[_bpi]["parentId"];
                //         data[_bpi]["parentId"] = newBPID;
                //         logger.debug("Updated parent for " + data[_bpi]["name"] + ":",data[_bpi]["_id"], "from " , oldpid ," to ", data[_bpi]["parentId"]);
                //     }
                // }
                //UPdate current objects ID
                logger.debug("Old ID:", data[bpi]["_id"]);
                data[bpi]["_id"] = newBPID;
                logger.debug("New ID:", data[bpi]["_id"]);
                //Including the version field if not present - backward compatibility
                //if(!data[bpi]["version"])
                data[bpi]["version"] = "1";
                data[bpi].parentId = undefined;


                logger.debug('About to write', bpi);
                //finding any duplicates and renaming before save
                for (var dbpi = 0; dbpi < dupbp.length; dbpi++) {
                    if (dupbp[dbpi]["name"] == data[bpi]["name"]) {
                        data[bpi]["name"] = data[bpi]["name"] + '_copy_' + uuid.v4().split('-')[0];
                        logger.debug('Found a duplicate. Renaming', data[bpi]["name"]);
                        logger.debug(JSON.stringify([{
                            "orgId": orgid
                        }, {
                            "bgId": bgid
                        }, {
                            "projectId": projid
                        }]));
                    }
                }



                var blueprint = new Blueprints(data[bpi]);
                if (oldProjId !== blueprint.projectId) {
                    // checking for nexus and docker
                    if (blueprint.nexus) {
                        blueprint.nexus = undefined;
                    }

                    if (blueprint.docker) {
                        blueprint.docker = undefined;
                    }
                }


                blueprint.save(function(err, docs) {
                    logger.debug(' docs ==> ', JSON.stringify(docs));
                    count++;
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    } else {
                        copiedBlueprints.push(docs);
                        logger.debug('Count:', count, 'Data len', data.length);
                        if (count >= data.length) {
                            logger.debug('Count:', count, 'Data len', data.length);
                            logger.debug('Inserted all documents');
                            callback(null, copiedBlueprints);
                        }
                    }
                });

                return;






            }

            //logger.debug(data);
        });
    }); //find all blueprints
};




var findBlueprintVersionObject = function(blueprints, parentId) {
    var versions = [];
    logger.debug('Entering getBlueprintVersionObject', parentId);
    for (var bpi = 0; bpi < blueprints.length; bpi++) {
        if (blueprints[bpi]["parentId"] == parentId) {
            logger.debug('Hit a parentID');
            versions.push({
                id: blueprints[bpi]["_id"].toString(),
                version: blueprints[bpi]["version"],
                name: blueprints[bpi]["name"]
            });
            // delete blueprints[bpi];
        }
    }
    for (var bpi = 0; bpi < blueprints.length; bpi++) {
        blueprints[bpi] = JSON.parse(JSON.stringify(blueprints[bpi]));
        if (blueprints[bpi]["_id"] == parentId) {
            //  versions.push({id:blueprints[bpi]["_id"].toString(),version:"1"});
            blueprints[bpi].versions = versions;
            logger.debug('Found a parentID: for ', parentId, blueprints[bpi].versions);
            break;
        }
    }
    logger.debug('Exiting getBlueprintVersionObject');

    return (blueprints);
}

var consolidateVersionOnBlueprint = function(blueprints) {
    logger.debug('About to scan: ', blueprints.length);
    //logger.debug(blueprints);
    for (var bpi = 0; bpi < blueprints.length; bpi++) {

        if (blueprints[bpi].parentId) {
            blueprints = findBlueprintVersionObject(blueprints, blueprints[bpi].parentId);
        }

    }
    logger.debug('About to return:');
    //logger.debug(blueprints);
    for (var bpi = 0; bpi < blueprints.length; bpi++) {
        if (blueprints[bpi].parentId) {
            logger.debug('Found with parent id splising', blueprints[bpi].parentId);
            blueprints.splice(bpi, 1)
            bpi = 0; //resetting to avoid skips
        }
    }
    return (blueprints);
}


BlueprintSchema.statics.getBlueprintsByOrgBgProject = function(orgId, bgId, projId, filterBlueprintType, callback) {
    logger.debug("Enter getBlueprintsByOrgBgProject(%s,%s, %s, %s)", orgId, bgId, projId, filterBlueprintType);
    var queryObj = {
        orgId: orgId,
        bgId: bgId,
        projectId: projId,
    }
    if (filterBlueprintType) {
        queryObj.templateType = filterBlueprintType;
    }

    this.find(queryObj, function(err, blueprints) {
        if (err) {
            callback(err, null);
            return;
        }

        //function will cleanup the blueprint array and inject version object.
        var blueprints1 = consolidateVersionOnBlueprint(blueprints);

        logger.debug("Exit getBlueprintsByOrgBgProject(%s,%s, %s, %s, %s)", orgId, bgId, projId, filterBlueprintType);
        callback(null, blueprints1);



    });

};

BlueprintSchema.statics.getBlueprintsByOrgBgProjectProvider = function(orgId, bgId, projId, filterBlueprintType, provider, callback) {
    logger.debug("Enter getBlueprintsByOrgBgProjectProvider(%s,%s, %s, %s,%s)", orgId, bgId, projId, filterBlueprintType, provider);
    var options = [];
    options.push({
        "blueprintConfig.cloudProviderType": provider
    });


    //Handle cft, arm 

    if (provider == 'aws') {
        options.push({
            "templateType": "cft"
        });
    } else if (provider == 'azure') {
        options.push({
            "templateType": "arm"
        });
    }
    //handking docker
    options.push({
        "templateType": "docker"
    });

    var queryObj = {
        orgId: orgId,
        bgId: bgId,
        projectId: projId,
        $or: options
    }

    logger.debug("Query Obj ", JSON.stringify(queryObj));
    // if (filterBlueprintType) {
    //     queryObj.templateType = filterBlueprintType;
    // }

    this.find(queryObj, function(err, blueprints) {
        if (err) {
            callback(err, null);
            return;
        }

        //function will cleanup the blueprint array and inject version object.
        var blueprints1 = consolidateVersionOnBlueprint(blueprints);

        logger.debug("Exit getBlueprintsByOrgBgProject(%s,%s, %s, %s, %s,%s)", orgId, bgId, projId, filterBlueprintType, provider);
        callback(null, blueprints1);



    });
};

BlueprintSchema.methods.getCookBookAttributes = function(instance, repoData, callback) {
    var blueprint = this;
    //merging attributes Objects
    var attributeObj = {};
    var objectArray = [];
    if (blueprint.blueprintConfig.infraManagerData && blueprint.blueprintConfig.infraManagerData.versionsList && blueprint.blueprintConfig.infraManagerData.versionsList.length) {
        // Attributes which are configures in blueprint.
        var attr = blueprint.blueprintConfig.infraManagerData.versionsList[0].attributes;
        if (attr && attr.length) {
            for (var i = 0; i < attr.length; i++) {
                objectArray.push(attr[i].jsonObj);
            }
        }
    }

    // While passing extra attribute to chef cookbook "rlcatalyst" is used as attribute.
    //var temp = new Date().getTime();
    if (blueprint.nexus.url) {
        masterUtil.updateProject(repoData.projectId, repoData.repoName, function(err, data) {
            if (err) {
                logger.debug("Failed to updateProject: ", err);
            }
            if (data) {
                logger.debug("updateProject successful.");
            }
        });
        var url = blueprint.nexus.url;
        var repoName = blueprint.nexus.repoName;
        var groupId = blueprint.nexus.groupId;
        var artifactId = blueprint.nexus.artifactId;
        var version = blueprint.nexus.version;
        objectArray.push({
            "rlcatalyst": {
                "upgrade": false
            }
        });
        objectArray.push({
            "rlcatalyst": {
                "applicationNodeIP": instance.instanceIP
            }
        });

        nexus.getNexusArtifactVersions(blueprint.nexus.repoId, repoName, groupId, artifactId, function(err, data) {
            if (err) {
                logger.debug("Failed to fetch Repository from Mongo: ", err);
                objectArray.push({
                    "rlcatalyst": {
                        "nexusUrl": url
                    }
                });
                objectArray.push({
                    "rlcatalyst": {
                        "version": version
                    }
                });
            }

            if (data) {
                var flag = false;
                var versions = data.metadata.versioning[0].versions[0].version;
                var latestVersionIndex = versions.length;
                var latestVersion = versions[latestVersionIndex - 1];
                //logger.debug("Got latest catalyst version from nexus: ", latestVersion);

                nexus.getNexusArtifact(blueprint.nexus.repoId, repoName, groupId, function(err, artifacts) {
                    if (err) {
                        logger.debug("Failed to get artifacts.");
                        objectArray.push({
                            "rlcatalyst": {
                                "nexusUrl": url
                            }
                        });
                        objectArray.push({
                            "rlcatalyst": {
                                "version": version
                            }
                        });
                    } else {
                        if (artifacts.length) {
                            for (var i = 0; i < artifacts.length; i++) {
                                if (latestVersion === artifacts[i].version && artifactId === artifacts[i].artifactId) {
                                    url = artifacts[i].resourceURI;

                                    objectArray.push({
                                        "rlcatalyst": {
                                            "nexusUrl": url
                                        }
                                    });
                                    objectArray.push({
                                        "rlcatalyst": {
                                            "version": latestVersion
                                        }
                                    });
                                    flag = true;
                                    //logger.debug("latest objectArray::: ", JSON.stringify(objectArray));
                                    break;
                                }

                            }
                            if (!flag) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "nexusUrl": url
                                    }
                                });
                                objectArray.push({
                                    "rlcatalyst": {
                                        "version": version
                                    }
                                });
                            }
                        } else {
                            objectArray.push({
                                "rlcatalyst": {
                                    "nexusUrl": url
                                }
                            });
                            objectArray.push({
                                "rlcatalyst": {
                                    "version": latestVersion
                                }
                            });
                        }
                    }

                    var actualVersion = "";
                    if (latestVersion) {
                        actualVersion = latestVersion;
                    } else {
                        actualVersion = version;
                    }

                    // Update app-data for promote
                    var nodeIp = [];
                    nodeIp.push(instance.instanceIP);
                    configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
                        if (err) {
                            callback({
                                message: "Failed to get env name from env id"
                            }, null);
                            return;
                        }
                        if (!envName) {
                            callback({
                                "message": "Unable to find environment name from environment id"
                            });
                            return;
                        }
                        var appData = {
                            "projectId": instance.projectId,
                            "envId": envName,
                            "appName": artifactId,
                            "version": actualVersion,
                            "nexus": {
                                "repoURL": url,
                                "nodeIps": nodeIp
                            }
                        };
                        AppData.createNewOrUpdate(appData, function(err, data) {
                            if (err) {
                                logger.debug("Failed to create or update app-data: ", err);
                            }
                            if (data) {
                                logger.debug("Created or Updated app-data successfully: ", data);
                            }
                        });
                    });

                    var attributeObj = utils.mergeObjects(objectArray);
                    callback(null, attributeObj);
                    return;
                });
            } else {
                logger.debug("No artifact version found.");
            }

        });
    } else if (blueprint.docker.image) {
        if (blueprint.docker.containerId) {
            objectArray.push({
                "rlcatalyst": {
                    "containerId": blueprint.docker.containerId
                }
            });
        }

        if (blueprint.docker.containerPort) {
            objectArray.push({
                "rlcatalyst": {
                    "containerPort": blueprint.docker.containerPort
                }
            });
        }

        if (blueprint.docker.image) {
            objectArray.push({
                "rlcatalyst": {
                    "dockerImage": blueprint.docker.image
                }
            });
        }

        if (blueprint.docker.hostPort) {
            objectArray.push({
                "rlcatalyst": {
                    "hostPort": blueprint.docker.hostPort
                }
            });
        }

        if (blueprint.docker.dockerUser) {
            objectArray.push({
                "rlcatalyst": {
                    "dockerUser": blueprint.docker.dockerUser
                }
            });
        }

        if (blueprint.docker.dockerPassword) {
            objectArray.push({
                "rlcatalyst": {
                    "dockerPassword": blueprint.docker.dockerPassword
                }
            });
        }

        if (blueprint.docker.dockerEmailId) {
            objectArray.push({
                "rlcatalyst": {
                    "dockerEmailId": blueprint.docker.dockerEmailId
                }
            });
        }

        if (blueprint.docker.imageTag) {
            objectArray.push({
                "rlcatalyst": {
                    "imageTag": blueprint.docker.imageTag
                }
            });
        }
        objectArray.push({
            "rlcatalyst": {
                "upgrade": false
            }
        });

        objectArray.push({
            "rlcatalyst": {
                "applicationNodeIP": instance.instanceIP
            }
        });
        var attrs = utils.mergeObjects(objectArray);
        // Update app-data for promote
        var nodeIp = [];
        nodeIp.push(instance.instanceIP);
        configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
            if (err) {
                callback({
                    message: "Failed to get env name from env id"
                }, null);
                return;
            }
            if (!envName) {
                callback({
                    "message": "Unable to find environment name from environment id"
                });
                return;
            }
            var actualDocker = [];
            var docker = {
                "image": blueprint.docker.image,
                "containerId": blueprint.docker.containerId,
                "containerPort": blueprint.docker.containerPort,
                "hostPort": blueprint.docker.hostPort,
                "dockerUser": blueprint.docker.dockerUser,
                "dockerPassword": blueprint.docker.dockerPassword,
                "dockerEmailId": blueprint.docker.dockerEmailId,
                "imageTag": blueprint.docker.imageTag,
                "nodeIp": instance.instanceIP
            };
            actualDocker.push(docker);
            var appData = {
                "projectId": instance.projectId,
                "envId": envName,
                "appName": artifactId,
                "version": blueprint.docker.imageTag,
                "docker": actualDocker
            };
            AppData.createNewOrUpdate(appData, function(err, data) {
                if (err) {
                    logger.debug("Failed to create or update app-data: ", err);
                }
                if (data) {
                    logger.debug("Created or Updated app-data successfully: ", data);
                }
            })
        });

        callback(null, attrs);
        return;
    } else {
        var attributeObj = utils.mergeObjects(objectArray);
        callback(null, attributeObj);
        return;
        /*process.nextTick(function() {
            callback(null, {});
        });*/
    }
};
var Blueprints = mongoose.model('blueprints', BlueprintSchema);

module.exports = Blueprints;