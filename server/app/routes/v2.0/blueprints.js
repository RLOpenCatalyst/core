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

var router = require('express').Router();

var async = require('async');
var userService = require('_pr/services/userService');
var blueprintService = require('_pr/services/blueprintService.js');
var validate = require('express-validation');
var blueprintValidator = require('_pr/validators/blueprintValidator');
var networkProfileService = require('_pr/services/networkProfileService.js');
var vmImageDao = require('_pr/model/classes/masters/vmImage.js');

var logger = require('_pr/logger')(module);

/**
 * @api {get} /api/v2.0/blueprints                          Get blueprints list
 * @apiName getAllBlueprints
 * @apiGroup blueprints
 *
 * @apiSuccess {Object[]} blueprintsArray                   List of blueprints
 * @apiSuccess {Object} blueprintsArray.blueprint           Blueprint
 * @apiSuccess {String} blueprint.id                        Blueprint id
 * @apiSuccess {String} blueprint.name                      Provider organization
 * @apiSuccess {String} blueprint.version                   Blueprint version maintained by catalyst
 * @apiSuccess {Object} blueprint.organization              Organization owning the blueprint
 * @apiSuccess {String} blueprint.organization.id           Organization id
 * @apiSuccess {String} blueprint.organization.name         Organization name
 * @apiSuccess {Object} blueprint.businessGroup             BG owning the blueprint
 * @apiSuccess {String} blueprint.businessGroup.id          BG id
 * @apiSuccess {String} blueprint.businessGroup.name        BG name
 * @apiSuccess {Object} blueprint.project                   Project to which the blueprint belongs
 * @apiSuccess {String} blueprint.project.id                Project id
 * @apiSuccess {String} blueprint.project.name              Project name
 * @apiSuccess {String} blueprint.networkProfile            Network profile
 * @apiSuccess {String} blueprint.softwareTemplate          Software template details
 * @apiSuccess {String} blueprint.vmImage                   VM Image details
 * @apiSuccess {String} blueprint.machineType               Machine type based on network profile
 * @apiSuccess {String} blueprint.applications              Applications list
 * @apiSuccess {String} blueprint.applicationURL            Application URL
 * @apiSuccess {String} blueprint.tasRunList                Task run list
 * @apiSuccess {String} blueprint.attributes                Check cookbook attributes
 * @apiSuccess {String} blueprint.blueprints                Nested blueprints
 * @apiSuccess {Number} count                               Number of providers in the result set
 * @apiSuccess {pageSize} pageSize                          Page size
 * @apiSuccess {pageIndex} pageIndex                        Page index
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "blueprints": [
 *               {
 *                  "id": "<ID>",
 *                  "name": "blueprintName",
 *                  "version": "2",
 *                  "organization": {
 *                      "id": "<ID>",
 *                      "name": "Organization name"
 *                   },
 *                   "businessGroup": {
 *                      "id": "<ID>",
 *                      "name": "Business group name"
 *                   },
 *                   "project": {
 *                      "id": "<ID>",
 *                      "name": "Project name"
 *                   }
 *                  "networkProfile": {
 *                      "id": "<Network profile id>",
 *                      "name": "networkProfileName",
 *                      "type": "gcp",
 *                      "providerId": "<ID>",
 *                      "networkDetails": {
 *                      "zone": "us-east1-c",
 *                      "network": "global/networks/default",
 *                      "subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 *                      "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 *                      }
 *                  },
 *                  "softwareTemplate": {
 *                  },
 *                  "vmImage": {
 *                      "imageId": "<Image ID>",
 *                  },
 *                  "machineType": "m1.small",
 *                  "applications": [],
 *                  "applicationURL": "application url",
 *                  "runList": [],
 *                  "attributes": [],
 *                  "buleprints": [],
 *                  "chefServerId": "rowid"
 *               },
 *               {
 *                  "id": "<ID>",
 *                  "name": "blueprintName",
 *                  "version": "1",
 *                  "organization": {
 *                      "id": "<ID>",
 *                      "name": "Organization name"
 *                   },
 *                   "businessGroup": {
 *                      "id": "<ID>",
 *                      "name": "Business group name"
 *                   },
 *                   "project": {
 *                      "id": "<ID>",
 *                      "name": "Project name"
 *                   }
 *                  "networkProfile": {
 *                      "id": "<Network profile id>",
 *                      "name": "networkProfileName",
 *                      "type": "gcp",
 *                      "providerId": "<ID>",
 *                      "networkDetails": {
 *                      "zone": "us-east1-c",
 *                      "network": "global/networks/default",
 *                      "subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 *                      "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 *                      }
 *                  },
 *                  "softwareTemplate": {
 *                      ...
 *                  },
 *                  "vmImage": {
 *                      "name": "Instace name",
 *                      "imageId": "<Image ID>"
 *                  },
 *                  "machineType": "m1.large",
 *                  "chefServerId": "rowid",
 *                  "applications": [],
 *                  "applicationURL": "application url",
 *                  "runList": [],
 *                  "attributes": [],
 *                  "buleprints": [
 *                      "<Blueprint ID 0>",
 *                      "<Blueprint ID 1>"
 *                  ]
 *               }
 *          ],
 *          "count": 2,
 *          "pageSize": 10,
 *          "pageIndex": 1
 *      }
 *
 */
router.get('/', getBlueprints);

/**
 * @api {get} /api/v2.0/blueprints/:blueprintId             Get blueprint
 * @apiName getBlueprint
 * @apiGroup blueprints
 *
 * @apiParam {String} blueprintId                           Blueprint ID
 *
 * @apiSuccess {Object} blueprint                           Blueprint
 * @apiSuccess {String} blueprint.id                        Blueprint id
 * @apiSuccess {String} blueprint.name                      Provider organization
 * @apiSuccess {String} blueprint.version                   Blueprint version maintained by catalyst
 * @apiSuccess {Object} blueprint.organization              Organization owning the blueprint
 * @apiSuccess {String} blueprint.organization.id           Organization id
 * @apiSuccess {String} blueprint.organization.name         Organization name
 * @apiSuccess {Object} blueprint.businessGroup             BG owning the blueprint
 * @apiSuccess {String} blueprint.businessGroup.id          BG id
 * @apiSuccess {String} blueprint.businessGroup.name        BG name
 * @apiSuccess {Object} blueprint.project                   Project to which the blueprint belongs
 * @apiSuccess {String} blueprint.project.id                Project id
 * @apiSuccess {String} blueprint.project.name              Project name
 * @apiSuccess {String} blueprint.networkProfile            Network profile
 * @apiSuccess {String} blueprint.softwareTemplate          Software template details
 * @apiSuccess {String} blueprint.vmImage                   VM Image details
 * @apiSuccess {String} blueprint.machineType               Machine type based on network profile
 * @apiSuccess {String} blueprint.applications              Applications list
 * @apiSuccess {String} blueprint.applicationURL            Application URL
 * @apiSuccess {String} blueprint.tasRunList                Task run list
 * @apiSuccess {String} blueprint.attributes                Check cookbook attributes
 * @apiSuccess {String} blueprint.blueprints                Nested blueprints
 *
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "id": "<ID>",
 *          "name": "blueprintName",
 *          "version": "1",
 *          "organization": {
 *              "id": "<ID>",
 *              "name": "Organization name"
 *          },
 *          "businessGroup": {
 *              "id": "<ID>",
 *              "name": "Business group name"
 *          },
 *          "project": {
 *              "id": "<ID>",
 *              "name": "Project name"
 *          }
 *          "networkProfile": {
 *              "id": "<Network profile id>",
 *              "name": "networkProfileName",
 *              "type": "gcp",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *              "subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 *              "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 *              }
 *          },
 *          "softwareTemplate": {
 *              ...
 *          },
 *          "vmImage": {
 *              "name": "vm image name",
 *              "imageId": "image id"
 *          },
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "buleprints": [],
 *          "chefServerId": "rowid"
 *      }
 */
router.get('/:blueprintId', getBlueprint);

/**
 * @api {post} /api/v2.0/blueprints                       Create blueprint
 * @apiName createBlueprint
 * @apiGroup blueprints
 *
 * @apiParam {Object} blueprint                           Blueprint
 * @apiParam {String} blueprint.name                      Blueprint organization
 * @apiParam {String} blueprint.organizationId            Organization id
 * @apiParam {String} blueprint.businessGroupId           BG id
 * @apiParam {String} blueprint.projectId                 Project id
 * @apiParam {String} blueprint.networkProfileId          Network profile id
 * @apiParam {String} blueprint.softwareTemplateId        Software template id
 * @apiParam {String} blueprint.vmImageId                 VM Image name
 * @apiParam {String} blueprint.machineType               Machine type based on network profile
 * @apiParam {String} blueprint.applications              Applications list
 * @apiParam {String} blueprint.applicationURL            Application URL
 * @apiParam {String[]} blueprint.taskRunList             Task run list
 * @apiParam {String[]} blueprint.attributes              Check cookbook attributes
 * @apiParam {String[]} blueprint.blueprints              List of nested blueprint ids
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": "blueprintName",
 *          "organizationId": "<ID>",
 *          "businessGroupId": "<ID>",
 *          "projectId": "<ID>",
 *          "networkProfileId": "<ID>",
 *          "softwareTemplateId": "<ID>",
 *          "vmImageId": "<ID>",
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURLs": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "blueprints": []
 *      }
 *
 * @apiSuccess {Object} blueprint                           Blueprint
 * @apiSuccess {String} blueprint.id                        Blueprint id
 * @apiSuccess {String} blueprint.name                      Blueprint organization
 * @apiSuccess {String} blueprint.version                   Blueprint version maintained by catalyst
 * @apiSuccess {Object} blueprint.organization              Organization owning the blueprint
 * @apiSuccess {String} blueprint.organization.id           Organization id
 * @apiSuccess {String} blueprint.organization.name         Organization name
 * @apiSuccess {Object} blueprint.businessGroup             BG owning the blueprint
 * @apiSuccess {String} blueprint.businessGroup.id          BG id
 * @apiSuccess {String} blueprint.businessGroup.name        BG name
 * @apiSuccess {Object} blueprint.project                   Project to which the blueprint belongs
 * @apiSuccess {String} blueprint.project.id                Project id
 * @apiSuccess {String} blueprint.project.name              Project name
 * @apiSuccess {String} blueprint.networkProfile            Network profile
 * @apiSuccess {String} blueprint.softwareTemplate          Software template details
 * @apiSuccess {String} blueprint.vmImage                   VM Image details
 * @apiSuccess {String} blueprint.machineType               Machine type based on network profile
 * @apiSuccess {String} blueprint.applications              Applications list
 * @apiSuccess {String} blueprint.applicationURL            Application URL
 * @apiSuccess {String[]} blueprint.taskRunList             Task run list
 * @apiSuccess {String[]} blueprint.attributes              Check cookbook attributes
 * @apiSuccess {String[]} blueprint.blueprints              Nested blueprints list
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "id": "<ID>",
 *          "name": "blueprintName",
 *          "version": "1",
 *          "organization": "<ID>",
 *          "businessGroup": "<ID>",
 *          "project": "<ID>",
 *          "networkProfile": {
 *              "name": "networkProfileName",
 *              "type": "gcp",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *              "subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 *              "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 *              }
 *          },
 *          "softwareTemplate": {
 *              ...
 *          },
 *          "vmImage": {
 *              "name": "vm image name",
 *              "imageId": "image id"
 *          },
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "buleprints": [],
 *          "chefServerId": "rowid"
 *      }
 */

router.post('/', validate(blueprintValidator.create), function createBlueprint(req, res, next) {


    var blueprintData = {
        "name": req.body.name,
        "version": 1,
        "organizationId": req.body.organizationId,
        "businessGroupId": req.body.businessGroupId,
        "projectId": req.body.projectId,
        "applications": req.body.applications,
        "applicationUrls": req.body.applicationUrls,
        "runList": req.body.runList,
        "blueprints": req.body.blueprints,
        "machineType": req.body.machineType,
        "chefServerId": req.body.chefServerId,
        "bootDiskType": req.body.bootDiskType,
        "bootDiskSize": req.body.bootDiskSize
    };

    var entity = {
        networkProfileId: req.body.networkProfileId,
        vmImageId: req.body.vmImageId
    };

    if (!(req.body.runList && req.body.runList.length)) {
        entity.templateId = req.body.softwareTemplateId;
    }

    blueprintService.populateBlueprintRelatedData(blueprintData, entity, function(err, blueprintData) {
        if (err) {
            return next(err);
        }
        logger.debug(blueprintData);
        blueprintService.createNew(blueprintData, function(err, blueprint) {
            if (err) {
                return next(err);
            }
            userService.updateOwnerDetails(blueprint, function(err, updatedBP) {
                if (err) {
                    return next(err);
                }

                var bpRes = blueprintService.createBlueprintResponseObject(updatedBP);
                res.status(200).send(bpRes);
            });

        });
    });
});

/**
 * @api {post} /api/v2.0/blueprints/:blueprintId/launch     Launch blueprint
 * @apiName launchBlueprint
 * @apiGroup blueprints
 *
 * @apiParam {String} blueprintId                           Blueprint ID
 * @apiParam {Object} blueprintLaunchDetails                Blueprint launch details
 * @apiParam {String} blueprintLaunchDetails.version        Version of blueprint to be launched
 * @apiParamExample {json} Request-Example:
 *      {
 *          "version": "1",
            "envName": "Dev"
 *      }
 *
 * @apiSuccess {Object} blueprintLaunchStatus               Check cookbook attributes
 * @apiSuccess {String} blueprintLaunchStatus.status        Nested blueprints list
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "status": "SUCCESS"
 *      }
 */
router.post('/:blueprintId/launch', validate(blueprintValidator.launch), launchBlueprint);

function launchBlueprint(req, res, next) {
    var reqBody = req.body;
    async.waterfall(
        [

            function(next) {
                blueprintService.getBlueprintById(req.params.blueprintId, next);

            },
            function(blueprint, next) {
                blueprintService.launchBlueprint(blueprint, reqBody, next);
            }
        ],
        function(err, results) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send(results);
            }
        }
    )
}

/**
 * @api {patch} /api/v2.0/blueprints/:blueprintId/upgrade                     Update blueprint
 * @apiName updateBlueprint
 * @apiGroup blueprints
 *
 * @apiParam {Object} blueprint                           Blueprint
 * @apiParam {String} blueprint.name                      Blueprint organization
 * @apiParam {String} blueprint.networkProfileId          Network profile id
 * @apiParam {String} blueprint.softwareTemplateId        Software template id
 * @apiParam {String} blueprint.vmImageId                 VM Image name
 * @apiParam {String} blueprint.machineType               Machine type based on network profile
 * @apiParam {String} blueprint.applications              Applications list
 * @apiParam {String} blueprint.applicationURL            Application URL
 * @apiParam {String[]} blueprint.taskRunList             Task run list
 * @apiParam {String[]} blueprint.attributes              Check cookbook attributes
 * @apiParam {String[]} blueprint.blueprints              List of nested blueprint ids
 * @apiParamExample {json} Request-Example:
 *      {
 *          "name": "blueprintName",
 *          "networkProfileId": "<ID>",
 *          "softwareTemplateId": "<ID>",
 *          "vmImageId": "<ID>",
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "blueprints": []
 *      }
 *
 * @apiSuccess {Object} blueprint                           Blueprint
 * @apiSuccess {String} blueprint.id                        Blueprint id
 * @apiSuccess {String} blueprint.name                      Blueprint organization
 * @apiSuccess {String} blueprint.version                   Blueprint version maintained by catalyst
 * @apiSuccess {Object} blueprint.organization              Organization owning the blueprint
 * @apiSuccess {String} blueprint.organization.id           Organization id
 * @apiSuccess {String} blueprint.organization.name         Organization name
 * @apiSuccess {Object} blueprint.businessGroup             BG owning the blueprint
 * @apiSuccess {String} blueprint.businessGroup.id          BG id
 * @apiSuccess {String} blueprint.businessGroup.name        BG name
 * @apiSuccess {Object} blueprint.project                   Project to which the blueprint belongs
 * @apiSuccess {String} blueprint.project.id                Project id
 * @apiSuccess {String} blueprint.project.name              Project name
 * @apiSuccess {String} blueprint.networkProfile            Network profile
 * @apiSuccess {String} blueprint.softwareTemplate          Software template details
 * @apiSuccess {String} blueprint.vmImage                   VM Image details
 * @apiSuccess {String} blueprint.machineType               Machine type based on network profile
 * @apiSuccess {String} blueprint.applications              Applications list
 * @apiSuccess {String} blueprint.applicationURL            Application URL
 * @apiSuccess {String[]} blueprint.taskRunList             Task run list
 * @apiSuccess {String[]} blueprint.attributes              Check cookbook attributes
 * @apiSuccess {String[]} blueprint.blueprints              Nested blueprints list
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "id": "<ID>",
 *          "name": "blueprintName",
 *          "version": "2",
 *          "organization": {
 *              "id": "<ID>",
 *              "name": "Organization name"
 *          },
 *          "businessGroup": {
 *              "id": "<ID>",
 *              "name": "Business group name"
 *          },
 *          "project": {
 *              "id": "<ID>",
 *              "name": "Project name"
 *          }
 *          "networkProfile": {
 *              "id": "<Network profile id>",
 *              "name": "networkProfileName",
 *              "type": "gcp",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *              "subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 *              "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 *              }
 *          },
 *          "softwareTemplate": {
 *              ...
 *          },
 *          "vmImage": {
 *              "name": "vm image name",
 *              "imageId": "image id"
 *          },
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "buleprints": []
 *      }
 */

router.post('/:blueprintId/upgrade', function updateBlueprint(req, res, next) {

    var blueprintData = {
        "name": req.body.name,
        "applications": req.body.applications,
        "applicationUrls": req.body.applicationUrls,
        "runList": req.body.runList,
        "blueprints": req.body.blueprints,
        "machineType": req.body.machineType,
        "bootDiskType": req.body.bootDiskType,
        "bootDiskSize": req.body.bootDiskSize
    };

    var entity = {
        networkProfileId: req.body.networkProfileId,
        vmImageId: req.body.vmImageId
    };

    if (!(req.body.runList && req.body.runList.length)) {
        entity.templateId = req.body.softwareTemplateId;
    }

    blueprintService.populateBlueprintRelatedData(blueprintData, entity, function(err, blueprintData) {
        if (err) {
            return next(err);
        }


        async.waterfall([

            function(next) {
                blueprintService.populateBlueprintRelatedData(blueprintData, entity, next);
            },
            function(blueprintData, next) {
                blueprintService.getBlueprintById(req.params.blueprintId, next);

            },
            function(parentBlueprint, next) {
                parentBlueprint = JSON.parse(JSON.stringify(parentBlueprint));
                blueprintService.getParentBlueprintCount(parentBlueprint._id, function(err, count) {
                    if (err) {
                        return next(err);
                    }
                    next(null, parentBlueprint, count)
                });
            },
            function(parentBlueprint, count, next) {
                logger.debug('in next');
                var version = count + 2;

                blueprintData.version = version;
                blueprintData.parentBlueprintId = parentBlueprint._id;
                blueprintData.organizationId = parentBlueprint.organizationId,
                blueprintData.businessGroupId = parentBlueprint.businessGroupId,
                blueprintData.projectId = parentBlueprint.projectId;
                blueprintData.chefServerId = parentBlueprint.chefServerId;

                Object.assign(parentBlueprint, blueprintData);
                delete parentBlueprint._id;
                delete parentBlueprint.__v;
                next(null, parentBlueprint);

            },
            function(blueprintData, next) {
                blueprintService.createNew(blueprintData, next);
            },
            userService.updateOwnerDetails,
            function(updatedBP, next) {
                var respObj = blueprintService.createBlueprintResponseObject(updatedBP);
                next(null, respObj);
            }

        ], function(err, results) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send(results);
            }
        });
    });

});

/**
 * @api {delete} /api/v2.0/blueprints/:blueprintId      Delete blueprint
 * @apiName launchBlueprint
 * @apiGroup blueprints
 *
 * @apiParam {String} blueprintId                       Blueprint ID
 *
 * @apiSuccess {Object} Empty response object
 *
 */
router.delete('/:blueprintId', deleteBlueprint);

function getBlueprint(req, res, next) {
    async.waterfall([
        // @TODO Check authorization
        function(next) {
            blueprintService.getBlueprintById(req.params.blueprintId, next);
        },
        userService.updateOwnerDetails,
        function(blueprint, next) {
            var respObj = blueprintService.createBlueprintResponseObject(blueprint);
            if(respObj && respObj.status){
                next(respObj,null);
            }
            next(null, respObj);
        }
    ], function(err, blueprint) {
        if (err) {
            next(err);
        } else {
            res.status(200).send(blueprint);
        }
    });
}

function getBlueprints(req, res, next) {
    async.waterfall([
        // @TODO Check authorization
        function(next) {
            if ('user' in req.session) {
                userService.getUserOrgIds(req.session.user, next);
            } else {
                next(null, req.user.orgIds);
            }
        },
        function(orgIds, next) {
            blueprintService.getAllBlueprints(orgIds, next);
        },
        userService.updateOwnerDetailsOfList,
        function(blueprints, next) {
            var respObj = blueprintService.createBlueprintResponseList(blueprints);
            next(null, respObj);
        },

    ], function(err, blueprints) {
        if (err) {
            next(err);
        } else {
            res.status(200).send(blueprints);
        }
    });
}

function deleteBlueprint(req, res, next) {
    async.waterfall([
        // @TODO Authorization checks to be addded
        function(next) {
            if ('user' in req.session) {
                userService.getUserOrgIds(req.session.user, next);
            } else {
                next(null, req.user.orgIds);
            }
        },
        function(orgs, next) {
            blueprintService.checkBlueprintAccess(orgs, req.params.blueprintId, next);
        },
        function(blueprint, next) {
            blueprintService.deleteBlueprint(blueprint._id, next);
        },
    ], function(err, result) {
        if (err) {
            next(err);
        } else {
            res.status(200).send({});
        }
    });
}

module.exports.pattern = '/blueprints';
module.exports.router = router;