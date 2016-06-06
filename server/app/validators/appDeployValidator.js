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
var Joi = require('joi');

var appDeployValidator = module.exports = {};

appDeployValidator.get = {
    options : { flatten : true },
    params: {
        projectId: Joi.string().max(40).required()
    }
};
appDeployValidator.serverList = {
    options : { flatten : true },
    params: {
        nexusId: Joi.string().max(40).required(),
        projectId: Joi.string().max(40).required()
    }
};
appDeployValidator.artifactList = {
    options : { flatten : true },
    params: {
        nexusId: Joi.string().max(40).required(),
        repoName: Joi.string().max(20).required(),
        groupId: Joi.string().max(30).required()
    }
};

appDeployValidator.versionList = {
    options : { flatten : true },
    params: {
        nexusId: Joi.string().max(40).required(),
        repoName: Joi.string().max(20).required(),
        groupId: Joi.string().max(30).required(),
        artifactId: Joi.string().max(40).required()
    }
};

appDeployValidator.appDeploy = {
    options : { flatten : true },
    params: {
        projectId: Joi.string().max(40).required(),
        envName: Joi.string().max(20).required()
    }
};

appDeployValidator.post={
    options : { flatten : true },
    body: {
        projectId: Joi.string().min(1).max(40).required(),
        envId:     Joi.array().max(20).required(),
        envSequence:  Joi.array().max(20).required()
    }
};

appDeployValidator.getDeployPermission={
    options : { flatten : true },
    params: {
            projectId: Joi.string().min(1).max(40).required(),
            envName:     Joi.string().max(10).required()
    },
    query: {
        appName:  Joi.string().max(40).required(),
        version:  Joi.string().max(40).required()
    }
};

appDeployValidator.deployPermission={
    options : { flatten : true },
    body: {
        projectId: Joi.string().min(1).max(40).required(),
        envName:   Joi.string().max(10).required(),
        appName:  Joi.string().max(40).required(),
        version:  Joi.string().max(40).required(),
        isApproved: Joi.boolean().required()
    }
};







