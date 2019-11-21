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
var appConfig = require('_pr/config');
var validate = require('express-validation');
var compositeBlueprintValidator = require('_pr/validators/compositeBlueprintValidator');
var compositeBlueprintService = require('_pr/services/compositeBlueprintService');
var userService = require('_pr/services/userService');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/composite-blueprints*", sessionVerificationFunc);

    /**
     * @api {get} /composite-blueprints 	                        Get composite blueprints
     * @apiName getCompositeBlueprints
     * @apiGroup composite-blueprints
     *
     * @apiSuccess {Object[]} compositeBlueprints                   List of composite blueprints
     * @apiSuccess {String} compositeBlueprints.id		            Composite blueprint id
     * @apiSuccess {String} compositeBlueprints.name		        Composite blueprint name
     * @apiSuccess {String} compositeBlueprints.organization		Organization
     * @apiSuccess {String} compositeBlueprints.businessGroup		Business group
     * @apiSuccess {String} compositeBlueprints.project			    Project
     * @apiSuccess {Object[]} compositeBlueprints.blueprints		Blueprints
     * @apiSuccess {Object} compositeBlueprints.metadata		    Pagination metadata
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
     * 		{
	 * 			"compositeBlueprints": [
	 * 				{
     *                  "id": "<MongoID>",
     *                  "name": "Blueprint1",
     *                  "organization": {
     *                      "id": "<MongoID>",
     *                      "name": "Organization1"
     *                  },
     *                  "businessGroup": {
     *                      "id": "<MongoID>",
     *                      "name": "BusinessGroup1"
     *                  },
     *                  "project": {
     *                      "id": "<MongoID>",
     *                      "name": "Project1"
     *                  },
     *                  "blueprints": [
     *                      {
     *                         "_id": "5756881cee06745903a776cc",
     *                         "name": "test-blueprint",
     *                         "templateId": "test-template",
     *                         "templateType": "chef",
     *                         "blueprintConfig": {
     *                           "_id": "5756881cee06745903a776cb",
     *                           "infraManagerData": {
     *                             "versionsList": [
     *                               {
     *                                 "runlist": [
     *                                   "recipe[apache2]"
     *                                 ],
     *                                 "attributes": [
     *                                      {
     *                                          "_id": "57720e75171e21a0128035df",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "nexusUrl": "url"
     *                                              }
     *                                          },
     *                                          "name": "Nexus Repo Url for Petclinic"
     *                                      },
     *                                      {
     *                                          "_id": "57720e75171e21a0128035de",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "version": "version"
     *                                              }
     *                                          },
     *                                          "name": "Version"
     *                                      }
     *                                 ]
     *                                 "ver": "0.1"
     *                               }
     *                             ],
     *                             "latestVersion": "0.1"
     *                           },
     *                           "infraManagerId": "3b7701be-2134-45fd-8b34-2b4fabf4420c",
     *                           "infraMangerType": "chef",
     *                           "cloudProviderData": {
     *                             "securityGroupIds": [
     *                               "sg-e18e6085"
     *                             ],
     *                             "instanceCount": "1",
     *                             "instanceOS": "linux",
     *                             "imageId": "575687a7ee06745903a776a7",
     *                             "subnetId": "subnet-12b4ea54",
     *                             "region": "us-west-1",
     *                             "vpcId": "vpc-52110130",
     *                             "instanceUsername": "root",
     *                             "instanceAmiid": "ami-ff89fb9f",
     *                             "instanceType": "t2.micro",
     *                             "keyPairId": "57568337ee06745903a773c6"
     *                           },
     *                           "cloudProviderId": "57568337ee06745903a773c5",
     *                           "cloudProviderType": "aws"
     *                         },
     *                         "blueprintType": "instance_launch",
     *                         "version": "1",
     *                         "users": [],
     *                         "appUrls": []
     *                       }
     *                  ]
     *              }
	 * 			],
	 * 		    "metadata": {
	 * 		    }
	 * 		}
     *
     */
    app.get('/composite-blueprints/', getCompositeBlueprintsList);

    function getCompositeBlueprintsList(req, res, next) {
        var reqObject = {};
        var dbReqData = {};
        async.waterfall([
            // @TODO Check if user has access to the specified organization
            function(next) {
                apiUtil.paginationRequest(req.query, 'compositeBlueprints', next);
            },
            function(paginationRequest, next) {
                reqObject = paginationRequest;
                apiUtil.databaseUtil(paginationRequest, next);
            },
            function(paginationRequest, next) {
                dbReqData = paginationRequest;
                if('user' in req.session) {
                    userService.getUserOrgIds(req.session.user, next);
                } else {
                    next(null, req.user.orgIds);
                }
            },
            function(organizationIds, next) {
                compositeBlueprintService.getCompositeBlueprintsList(organizationIds, dbReqData, next);
            },
            function(results, next) {
                apiUtil.paginationResponse(results, reqObject, next);
            },
            function(results, next) {
                userService.updateOwnerDetailsOfList(results.compositeBlueprints, function (err, ownerUpdatedList) {
                    compositeBlueprintService.formatCompositeBlueprintsList(ownerUpdatedList, results, next);
                })
            }
        ], function(err, compositeBlueprints) {
            if(err) {
                next(err);
            } else {
                res.status(200).send(compositeBlueprints);
            }
        });
    }

    /**
     * @api {get} /composite-blueprints/:compositeBlueprintId       Get composite blueprint
     * @apiName getCompositeBlueprint
     * @apiGroup composite-blueprints
     *
     * @apiSuccess {Object[]} compositeBlueprints                   List of composite blueprints
     * @apiSuccess {String} compositeBlueprints.id		            Composite blueprint id
     * @apiSuccess {String} compositeBlueprints.type 	            softwarestack/docker...
     * @apiSuccess {String} compositeBlueprints.organization		Organization
     * @apiSuccess {String} compositeBlueprints.businessGroup		Business group
     * @apiSuccess {String} compositeBlueprints.project			    Project
     * @apiSuccess {Object[]} compositeBlueprints.blueprints		Blueprints
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
	 * 	    {
     *          "id": "<MongoID>",
     *          "name": "Blueprint1",
     *          "organization": {
     *              "id": "<MongoID>",
     *              "name": "Organization1"
     *          },
     *          "businessGroup": {
     *              "id": "<MongoID>",
     *              "name": "BusinessGroup1"
     *          },
     *          "project": {
     *              "id": "<MongoID>",
     *              "name": "Project1"
     *          },
     *          "blueprints": [
     *              {
     *                  "_id": "5756881cee06745903a776cc",
     *                  "name": "test-blueprint",
     *                  "templateId": "test-template",
     *                  "templateType": "chef",
     *                  "blueprintConfig": {
     *                      "_id": "5756881cee06745903a776cb",
     *                      "infraManagerData": {
     *                          "versionsList": [
     *                              {
     *                                  "runlist": [
     *                                      "recipe[apache2]"
     *                                  ],
     *                                  "attributes": [
     *                                      {
     *                                          "_id": "57720e75171e21a0128035df",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "nexusUrl": "url"
     *                                              }
     *                                          },
     *                                          "name": "Nexus Repo Url for Petclinic"
     *                                      },
     *                                      {
     *                                          "_id": "57720e75171e21a0128035de",
     *                                          "jsonObj": {
     *                                          "rlcatalyst": {
     *                                                  "version": "version"
     *                                              }
     *                                          },
     *                                          "name": "Version"
     *                                      }
     *                                  ]
     *                                      "ver": "0.1"
     *                                  }
     *                             ],
     *                              "latestVersion": "0.1"
     *                      },
     *                      "infraManagerId": "3b7701be-2134-45fd-8b34-2b4fabf4420c",
     *                      "infraMangerType": "chef",
     *                      "cloudProviderData": {
     *                          "securityGroupIds": [
     *                              "sg-e18e6085"
     *                          ],
     *                          "instanceCount": "1",
     *                          "instanceOS": "linux",
     *                          "imageId": "575687a7ee06745903a776a7",
     *                          "subnetId": "subnet-12b4ea54",
     *                          "region": "us-west-1",
     *                          "vpcId": "vpc-52110130",
     *                          "instanceUsername": "root",
     *                          "instanceAmiid": "ami-ff89fb9f",
     *                          "instanceType": "t2.micro",
     *                              "keyPairId": "57568337ee06745903a773c6"
     *                       },
     *                       "cloudProviderId": "57568337ee06745903a773c5",
     *                       "cloudProviderType": "aws"
     *                  },
     *                  "blueprintType": "instance_launch",
     *                  "version": "1",
     *                  "users": [],
     *                  "appUrls": []
     *              }
     *          ]
     *      }
     */
    app.get('/composite-blueprints/:compositeBlueprintId', getCompositeBlueprint);

    function getCompositeBlueprint(req, res, next) {
        async.waterfall([
            // @TODO Check if user has access to the specified organization
            function(next) {
                compositeBlueprintService.getCompositeBlueprint(req.params.compositeBlueprintId, next);
            },
            userService.updateOwnerDetails,
            compositeBlueprintService.formatCompositeBlueprint
        ], function(err, compositeBlueprint) {
            if(err) {
                next(err);
            } else {
                res.status(200).send(compositeBlueprint);
            }
        });
    }

    /**
     * @api {post} /composite-blueprints                                 Create composite blueprint
     * @apiName createCompositeBlueprint
     * @apiGroup composite-blueprints
     *
     * @apiParam {Object} compositeBlueprint                              Composite Blueprint
     * @apiParam {String} compositeBlueprint.name                         Blueprint organization
     * @apiParam {String} compositeBlueprint.organizationId               Organization id
     * @apiParam {String} compositeBlueprint.businessGroupId              BG id
     * @apiParam {String} compositeBlueprint.projectId                    Project id
     * @apiParam {Object[]} compositeBlueprint.blueprints                 List of nested blueprints in launch order.
     * Blueprints should be of the same type and should be created by the same provider.
     * @apiParam {Object} compositeBlueprint.blueprints.id                Nested blueprint ID
     * @apiParam {String[]} compositeBlueprint.blueprints.attributes      Nested blueprint cookbook/role attributes
     * @apiParamExample {json} Request-Example:
     *      {
     *          "name": "blueprintName",
     *          "organizationId": "<ID>",
     *          "businessGroupId": "<ID>",
     *          "projectId": "<ID>",
     *          "blueprints": [
     *              {
     *                  "id": "<MongoID>",
     *                  "attributes": [
     *                  ]
     *              },
     *              {
     *                  "id": "<MongoID>",
     *                  "attributes": [
     *                  ]
     *              }
     *          ]
     *      }
     *
     * @apiSuccess {Object[]} compositeBlueprints                   List of composite blueprints
     * @apiSuccess {String} compositeBlueprints.id		            Composite blueprint id
     * @apiSuccess {String} compositeBlueprints.type 	            chef
     * @apiSuccess {String} compositeBlueprints.organization		Organization
     * @apiSuccess {String} compositeBlueprints.businessGroup		Business group
     * @apiSuccess {String} compositeBlueprints.project			    Project
     * @apiSuccess {Object[]} compositeBlueprints.blueprints		Blueprints
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
     * 	    {
     *          "id": "<MongoID>",
     *          "name": "Blueprint1",
     *          "organization": {
     *              "id": "<MongoID>",
     *              "name": "Organization1"
     *          },
     *          "businessGroup": {
     *              "id": "<MongoID>",
     *              "name": "BusinessGroup1"
     *          },
     *          "project": {
     *              "id": "<MongoID>",
     *              "name": "Project1"
     *          },
     *          "blueprints": [
     *              {
     *                         "_id": "5756881cee06745903a776cc",
     *                         "name": "test-blueprint",
     *                         "templateId": "test-template",
     *                         "templateType": "chef",
     *                         "blueprintConfig": {
     *                           "_id": "5756881cee06745903a776cb",
     *                           "infraManagerData": {
     *                             "versionsList": [
     *                               {
     *                                 "runlist": [
     *                                   "recipe[apache2]"
     *                                 ],
     *                                 "attributes": [
     *                                      {
     *                                          "_id": "57720e75171e21a0128035df",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "nexusUrl": "url"
     *                                              }
     *                                          },
     *                                          "name": "Nexus Repo Url for Petclinic"
     *                                      },
     *                                      {
     *                                          "_id": "57720e75171e21a0128035de",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "version": "version"
     *                                              }
     *                                          },
     *                                          "name": "Version"
     *                                      }
     *                                 ]
     *                                 "ver": "0.1"
     *                               }
     *                             ],
     *                             "latestVersion": "0.1"
     *                           },
     *                           "infraManagerId": "3b7701be-2134-45fd-8b34-2b4fabf4420c",
     *                           "infraMangerType": "chef",
     *                           "cloudProviderData": {
     *                             "securityGroupIds": [
     *                               "sg-e18e6085"
     *                             ],
     *                             "instanceCount": "1",
     *                             "instanceOS": "linux",
     *                             "imageId": "575687a7ee06745903a776a7",
     *                             "subnetId": "subnet-12b4ea54",
     *                             "region": "us-west-1",
     *                             "vpcId": "vpc-52110130",
     *                             "instanceUsername": "root",
     *                             "instanceAmiid": "ami-ff89fb9f",
     *                             "instanceType": "t2.micro",
     *                             "keyPairId": "57568337ee06745903a773c6"
     *                           },
     *                           "cloudProviderId": "57568337ee06745903a773c5",
     *                           "cloudProviderType": "aws"
     *                         },
     *                         "blueprintType": "instance_launch",
     *                         "version": "1",
     *                         "users": [],
     *                         "appUrls": []
     *                       }
     *                  ]
     *              }
     *          ]
     *      }
     */
    app.post('/composite-blueprints/', validate(compositeBlueprintValidator.create), createCompositeBlueprint);

    function createCompositeBlueprint(req, res, next) {
        async.waterfall([
            // @TODO Check if user has access to the specified organization
            // @TODO Authorization checks to be addded
            function(next) {
                compositeBlueprintService.populateComposedBlueprints(req.body, next);
            },
            compositeBlueprintService.validateCompositeBlueprintCreateRequest,
            compositeBlueprintService.createCompositeBlueprint,
            compositeBlueprintService.formatCompositeBlueprint,
            userService.updateOwnerDetails
        ], function(err, compositeBlueprint) {
            if(err) {
                next(err);
            } else {
                res.status(200).send(compositeBlueprint);
            }
        });
    }

    /**
     * @api {patch} /composite-blueprints/:compositeBlueprintId          Update composite blueprint
     * @apiName updateCompositeBlueprint
     * @apiGroup composite-blueprints
     *
     * @apiParam {String} compositeBlueprintId                            Blueprint ID
     * @apiParam {Object} compositeBlueprint                              Composite Blueprint
     * @apiParam {String} compositeBlueprint.name                         Blueprint organization
     * @apiParam {Object[]} compositeBlueprint.blueprints                 List of nested blueprints in launch order
     * @apiParam {Object} compositeBlueprint.blueprints.id                Nested blueprint ID
     * @apiParam {Object} compositeBlueprint.blueprints.type              Nested blueprint type
     * @apiParam {String[]} compositeBlueprint.blueprints.attributes      Nested blueprint cookbook/role attributes
     * @apiParamExample {json} Request-Example:
     *      {
     *          "name": "blueprintName",
     *          "blueprints": [
     *              {
     *                  "id": "<MongoID>",
     *                  "attributes": [
     *                  ]
     *              },
     *              {
     *                  "id": "<MongoID>",
     *                  "attributes": [
     *                  ]
     *              }
     *          ]
     *      }
     *
     * @apiSuccess {Object[]} compositeBlueprints                   List of composite blueprints
     * @apiSuccess {String} compositeBlueprints.id		            Composite blueprint id
     * @apiSuccess {String} compositeBlueprints.type 	            chef
     * @apiSuccess {String} compositeBlueprints.organization		Organization
     * @apiSuccess {String} compositeBlueprints.businessGroup		Business group
     * @apiSuccess {String} compositeBlueprints.project			    Project
     * @apiSuccess {Object[]} compositeBlueprints.blueprints		Blueprints
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
     * 	    {
     *          "id": "<MongoID>",
     *          "name": "Blueprint1",
     *          "organization": {
     *              "id": "<MongoID>",
     *              "name": "Organization1"
     *          },
     *          "businessGroup": {
     *              "id": "<MongoID>",
     *              "name": "BusinessGroup1"
     *          },
     *          "project": {
     *              "id": "<MongoID>",
     *              "name": "Project1"
     *          },
     *          "blueprints": [
     *                  {
     *                         "_id": "5756881cee06745903a776cc",
     *                         "name": "test-blueprint",
     *                         "templateId": "test-template",
     *                         "templateType": "chef",
     *                         "blueprintConfig": {
     *                           "_id": "5756881cee06745903a776cb",
     *                           "infraManagerData": {
     *                             "versionsList": [
     *                               {
     *                                 "runlist": [
     *                                   "recipe[apache2]"
     *                                 ],
     *                                 "attributes": [
     *                                      {
     *                                          "_id": "57720e75171e21a0128035df",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "nexusUrl": "url"
     *                                              }
     *                                          },
     *                                          "name": "Nexus Repo Url for Petclinic"
     *                                      },
     *                                      {
     *                                          "_id": "57720e75171e21a0128035de",
     *                                          "jsonObj": {
     *                                              "rlcatalyst": {
     *                                                  "version": "version"
     *                                              }
     *                                          },
     *                                          "name": "Version"
     *                                      }
     *                                 ]
     *                                 "ver": "0.1"
     *                               }
     *                             ],
     *                             "latestVersion": "0.1"
     *                           },
     *                           "infraManagerId": "3b7701be-2134-45fd-8b34-2b4fabf4420c",
     *                           "infraMangerType": "chef",
     *                           "cloudProviderData": {
     *                             "securityGroupIds": [
     *                               "sg-e18e6085"
     *                             ],
     *                             "instanceCount": "1",
     *                             "instanceOS": "linux",
     *                             "imageId": "575687a7ee06745903a776a7",
     *                             "subnetId": "subnet-12b4ea54",
     *                             "region": "us-west-1",
     *                             "vpcId": "vpc-52110130",
     *                             "instanceUsername": "root",
     *                             "instanceAmiid": "ami-ff89fb9f",
     *                             "instanceType": "t2.micro",
     *                             "keyPairId": "57568337ee06745903a773c6"
     *                           },
     *                           "cloudProviderId": "57568337ee06745903a773c5",
     *                           "cloudProviderType": "aws"
     *                         },
     *                         "blueprintType": "instance_launch",
     *                         "version": "1",
     *                         "users": [],
     *                         "appUrls": []
     *                       }
     *                  ]
     *              }
     *          ]
     *      }
     */
    app.patch('/composite-blueprints/:compositeBlueprintId', updateCompositeBlueprint);

    // @TODO Access check pending
    function updateCompositeBlueprint(req, res, next) {
        async.waterfall([
            function(next) {
                compositeBlueprintService.populateComposedBlueprints(req.body, next);
            },
            function (updateFields, next) {
                compositeBlueprintService.getCompositeBlueprint(req.params.compositeBlueprintId,
                    function(err, compositeBlueprint) {
                        if(err) {
                            next(err);
                        } else {
                            next(null, compositeBlueprint, updateFields);
                        }
                });
            },
            compositeBlueprintService.updateCompositeBlueprint,
            userService.updateOwnerDetails,
            compositeBlueprintService.formatCompositeBlueprint
        ], function(err, compositeBlueprint) {
            if(err) {
                next(err);
            } else {
                res.status(200).send(compositeBlueprint);
            }
        });
    }

    /**
     * @api {delete} /composite-blueprints/:compositeBlueprintId    Delete blueprint
     * @apiName deleteBlueprint
     * @apiGroup composite-blueprints
     *
     * @apiParam {String} compositeBlueprintId                       Blueprint ID
     *
     * @apiSuccess {Object} Empty response object
     *
     */
    app.delete('/composite-blueprints/:compositeBlueprintId', deleteCompositeBlueprint);

    function deleteCompositeBlueprint(req, res, next) {
        async.waterfall([
            // @TODO Authorization checks to be addded
            function(next) {
                if('user' in req.session) {
                    userService.getUserOrgIds(req.session.user, next);
                } else {
                    next(null, req.user.orgIds);
                }
            },
            function(orgs, next) {
                compositeBlueprintService.checkCompositeBlueprintAccess(orgs,
                    req.params.compositeBlueprintId, next);
            },
            function(compositeBlueprint, next) {
                compositeBlueprintService.deleteCompositeBlueprint(compositeBlueprint._id, next);
            },
        ], function(err, compositeBlueprint) {
            if(err) {
                next(err);
            } else {
                res.status(200).send({});
            }
        });
    }

    /**
     * @api {post} /composite-blueprints/delete             Delete composite blueprints
     * @apiName deleteBlueprints
     * @apiGroup composite-blueprints
     *
     * @apiParam {Object} deleteRequest
     * @apiParam {String[]} deleteRequest. compositeBlueprint             Composite blueprint list
     * @apiParamExample {json} Request-Example:
     *      {
     *          "composite-blueprints": [
     *              "<MongoID>",
     *              "<MongoID>"
     *          ]
     *      }
     *
     * @apiSuccess {Object} Empty response object
     *
     */
    app.post('/composite-blueprints/delete',
        validate(compositeBlueprintValidator.multiDelete), deleteCompositeBlueprints);

    function deleteCompositeBlueprints(req, res, next) {
        async.waterfall([
            // @TODO Authorization checks to be addded
            function(next) {
                if('user' in req.session) {
                    userService.getUserOrgIds(req.session.user, next);
                } else {
                    next(null, req.user.orgIds);
                }
            },
            function(orgs, next) {
                compositeBlueprintService.checkCompositeBlueprintsAccess(orgs,
                    req.body.compositeBlueprints, next);
            },
            function(compositeBlueprintsList, next) {
                compositeBlueprintService.deleteCompositeBlueprints(compositeBlueprintsList, next);
            }
        ], function(err, compositeBlueprint) {
            if(err) {
                next(err);
            } else {
                res.status(200).send({});
            }
        });
    }
};