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

/**
 * @api {get} /api/v2.0/blueprints 	                        Get blueprints list
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
 * @apiSuccess {Number} count				                Number of providers in the result set
 * @apiSuccess {pageSize} pageSize			                Page size
 * @apiSuccess {pageIndex} pageIndex		                Page index
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 * 		{
 * 			"blueprints": [
 * 			 	 {
 *                  "id": "<ID>",
 * 					"name":	"blueprintName",
 *                  "version": "2",
 * 				    "organization": {
 * 				        "id": "<ID>",
 * 				        "name": "Organization name"
 * 				     },
 * 				     "businessGroup": {
 * 				        "id": "<ID>",
 * 				        "name": "Business group name"
 * 				     },
 * 				     "project": {
 * 				        "id": "<ID>",
 * 				        "name": "Project name"
 * 				     }
 *                  "networkProfile": {
 *                      "id": "<Network profile id>",
 * 		                "name":	"networkProfileName",
 *                      "type": "GCP",
 *                      "providerId": "<ID>",
 *                      "networkDetails": {
 *                      "zone": "us-east1-c",
 *                      "network": "global/networks/default",
 *                          "accessConfigs": ["ONE_TO_ONE_NAT"],
 *                          "accessConfigName": "Name of the access configuration.",
 *                          "accessConfigType": "ONE_TO_ONE_NAT"
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
 *                  "buleprints": []
 * 				 },
 * 				 {
 *                  "id": "<ID>",
 * 					"name":	"blueprintName",
 *                  "version": "1",
 * 				    "organization": {
 * 				        "id": "<ID>",
 * 				        "name": "Organization name"
 * 				     },
 * 				     "businessGroup": {
 * 				        "id": "<ID>",
 * 				        "name": "Business group name"
 * 				     },
 * 				     "project": {
 * 				        "id": "<ID>",
 * 				        "name": "Project name"
 * 				     }
 *                  "networkProfile": {
 *                      "id": "<Network profile id>",
 * 		                "name":	"networkProfileName",
 *                      "type": "GCP",
 *                      "providerId": "<ID>",
 *                      "networkDetails": {
 *                      "zone": "us-east1-c",
 *                      "network": "global/networks/default",
 *                          "accessConfigs": ["ONE_TO_ONE_NAT"],
 *                          "accessConfigName": "Name of the access configuration.",
 *                          "accessConfigType": "ONE_TO_ONE_NAT"
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
 *                  "applications": [],
 *                  "applicationURL": "application url",
 *                  "runList": [],
 *                  "attributes": [],
 *                  "buleprints": [
 *                      "<Blueprint ID 0>",
 *                      "<Blueprint ID 1>"
 *                  ]
 * 				 }
 * 			],
 *			"count": 2,
 *			"pageSize": 10,
 *			"pageIndex": 1
 * 		}
 *
 */
router.get('/', getBlueprints);

/**
 * @api {get} /api/v2.0/blueprints/:blueprintId 	        Get blueprint
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
 *          "name":	"blueprintName",
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
 *              "name":	"networkProfileName",
 *              "type": "GCP",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *                  "accessConfigs": ["ONE_TO_ONE_NAT"],
 *                  "accessConfigName": "Name of the access configuration.",
 *                  "accessConfigType": "ONE_TO_ONE_NAT"
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
router.patch('/:blueprintId', getBlueprint);

/**
 * @api {post} /api/v2.0/blueprints 	                  Create blueprint
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
 *          "name":	"blueprintName",
 *          "organizationId": "<ID>",
 *          "businessGroupId": "<ID>",
 *          "projectId": "<ID>",
 *          "networkProfileId": "<ID>",
 *          "softwareTemplateId": "<ID>",
 *          "vmImageId": "<ID>",
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "buleprints": []
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
 *          "name":	"blueprintName",
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
 *              "name":	"networkProfileName",
 *              "type": "GCP",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *                  "accessConfigs": ["ONE_TO_ONE_NAT"],
 *                  "accessConfigName": "Name of the access configuration.",
 *                  "accessConfigType": "ONE_TO_ONE_NAT"
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
router.post('/', createBlueprint);

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
 *          "version": "1"
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
router.post('/:blueprintId/launch', launchBlueprint);

/**
 * @api {patch} /api/v2.0/blueprints 	                  Update blueprint
 * @apiName updateBlueprint
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
 *          "name":	"blueprintName",
 *          "organizationId": "<ID>",
 *          "businessGroupId": "<ID>",
 *          "projectId": "<ID>",
 *          "networkProfileId": "<ID>",
 *          "softwareTemplateId": "<ID>",
 *          "vmImageId": "<ID>",
 *          "machineType": "m1.small",
 *          "applications": [],
 *          "applicationURL": "application url",
 *          "runList": [],
 *          "attributes": [],
 *          "buleprints": []
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
 *          "name":	"blueprintName",
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
 *              "name":	"networkProfileName",
 *              "type": "GCP",
 *              "providerId": "<ID>",
 *              "networkDetails": {
 *              "zone": "us-east1-c",
 *              "network": "global/networks/default",
 *                  "accessConfigs": ["ONE_TO_ONE_NAT"],
 *                  "accessConfigName": "Name of the access configuration.",
 *                  "accessConfigType": "ONE_TO_ONE_NAT"
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
router.patch('/:blueprintId', updateBlueprint);

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

module.exports.pattern = '/blueprints';
module.exports.router = router;
