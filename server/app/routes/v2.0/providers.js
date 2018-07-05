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
var providerService = require('_pr/services/providerService');
var userService = require('_pr/services/userService');
var providersValidator = require('_pr/validators/providersValidator');
var validate = require('express-validation');
var logger = require('_pr/logger')(module);

/**
 * @api {get} /api/v2.0/providers 	                     Get providers list
 * @apiName getAllProviders
 * @apiGroup providers
 *
 * @apiSuccess {Object[]} providers			             List of providers
 * @apiSuccess {String} providers.type		             Provider type (AWS/GCP/Azure)
 * @apiSuccess {String} providers.organization 	         Provider organization
 * @apiSuccess {String} providers.organization.id        Provider organization id
 * @apiSuccess {String} providers.organization.name      Provider organization name
 * @apiSuccess {String} providers.providerDetails        Provider details based on type
 * @apiSuccess {Number} count				             Number of providers in the result set
 * @apiSuccess {pageSize} pageSize			             Page size
 * @apiSuccess {pageIndex} pageIndex		             Page index
 *
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 * 		{
 * 			"providers": [
 * 			 	 {
 *                  "id": "<ID>",
 * 					"name":	"providerName",
 * 					"type": "AWS",
 * 				    "organization": {
 * 				        "id": "<ID>",
 * 				        "name": "Organization name"
 * 				     },
 * 				     "providerDetails": {
 * 				         "keyPairs": []
 * 				         "isDefault": true
 * 				     }
 * 				 },
 * 				 {
 * 				    "id": "<ID>",
 * 					"name":	"providerName",
 * 					"type": "gcp",
 * 				    "organization": {
 * 				        "id": "<ID>",
 * 				        "name": "Organization name"
 * 				     },
 * 				     "providerDetails": {
 * 				        "projectId": "GCP project Id"
 * 				     }
 * 				 }
 * 			],
 *			"count": 2,
 *			"pageSize": 10,
 *			"pageIndex": 1
 * 		}
 */
router.get('/', getProviders);

/**
 * @api {get} /api/v2.0/providers/:providerId 	        Get provider
 * @apiName getProvider
 * @apiGroup providers
 *
 * @apiParam {String} providerId                         Provider ID
 *
 * @apiSuccess {Object[]} providers			             List of providers
 * @apiSuccess {String} providers.type		             Provider type (AWS/GCP/Azure)
 * @apiSuccess {String} providers.organization 	         Provider organization
 * @apiSuccess {String} providers.organization.id        Provider organization id
 * @apiSuccess {String} providers.organization.name      Provider organization name
 * @apiSuccess {String} providers.providerDetails        Provider details based on type
 * @apiSuccessExample {json} GCP-Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "id": "<ID>",
 *          "name":	"providerName",
 *          "type": "AWS",
 *          "organization": {
 *              "id": "<ID>",
 *              "name": "Organization name"
 *          },
 *          "providerDetails": {
 *              "projectId": "GCP project Id"
 *          }
 *      }
 */
router.get('/:providerId', validate(providersValidator.accessIndividualResource), getProvider);


/**
 * @api {post} /api/v2.0/providers 	                     Create provider
 * @apiName createProvider
 * @apiGroup providers
 *
 * @apiParam {Object} provider			                  Provider
 * @apiParam {String} provider.type		                  Provider type (AWS/GCP/Azure)
 * @apiParam {String} provider.organization 	          Provider organization
 * @apiParam {String} provider.organizationId             Provider organization id
 * @apiParam {Object} provider.providerDetails            Provider details based on type
 * @apiParam {String} provider.providerDetails.accesskey  AWS provider access key
 * @apiParam {String} provider.providerDetails.secretkey  AWS provider access key
 * @apiParam {Object[]} provider.providerDetails.keyPairs AWS provider key pairs
 * @apiParam {Boolean} provider.providerDetails.isDefault Is default IAM user
 * @apiParamExample {json} AWS-Request-Example:
 * 		{
 * 			"name":	"Provider Name",
 * 			"type": "AWS",
 * 			"organizationId": "<Organization ID>",
 * 			"providerDetails": {
 * 				"accessKey": "<AccessKey>",
 * 				"secretKey": "<SecretKey>",
 * 				"keyPairs": [],
 * 				"isDefault": true
 * 			}
 * 		}
 *
 * @apiParam {Object} provider                              Provider
 * @apiParam {String} provider.type		                    Provider type (AWS/GCP/Azure)
 * @apiParam {String} provider.organization 	            Provider organization
 * @apiParam {String} provider.organizationId               Provider organization id
 * @apiParam {Object} provider.providerDetails              Provider details based on type
 * @apiParam {String} provider.providerDetails.projectId    GCP Project ID
 * @apiParam {String} provider.providerDetails.keyFile      Base 64 encoded key file
 * @apiParam {String} provider.providerDetails.sshKey       Base 64 encoded ssh key
 * @apiParamExample {json} GCP-Request-Example:
 * 		{
 * 			"name":	"Provider Name",
 * 			"type": "gcp",
 * 			"organizationId": "<Organization ID>",
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>",
 * 				"keyFile": "<GCP Key File>",
 * 			    "sshKey": "<GCP instance ssh key>"
 * 			}
 * 		}
 *
 * @apiSuccess {Object} provider			             Provider
 * @apiSuccess {String} provider.type		             Provider type (AWS/GCP/Azure)
 * @apiSuccess {String} provider.organization 	         Provider organization
 * @apiSuccess {String} provider.organization.id         Provider organization id
 * @apiSuccess {String} provider.organization.name       Provider organization name
 * @apiSuccess {Object} provider.providerDetails         Provider details based on type
 * @apiParam {String} provider.providerDetails.projectId GCP Project ID
 * @apiSuccessExample {json} GCP-Success-Response:
 * 		HTTP/1.1 200 OK
 * 		{
 * 	        "id": "<ID>",
 * 			"name":	"providerName",
 * 			"type": "gcp",
 * 			"organization": {
 *             "id": "<ID>",
 * 				"name": "Organization name"
 * 			},
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>"
 * 			}
 * 		}
 */
router.post('/', validate(providersValidator.create), createProvider);

/**
 * @api {delete} /api/v2.0/providers/:providerId 	    Delete provider
 * @apiName deleteProvider
 * @apiGroup providers
 *
 * @apiParam {String} providerId 	                    Provider ID
 *
 * @apiSuccess {Object} response			            Empty response object
 *
 */
router.delete('/:providerId', validate(providersValidator.accessIndividualResource), deleteProvider);

/**
 * @api {patch} /api/v2.0/providers/:providerId 	        Update provider
 * @apiName updateProvider
 * @apiGroup providers
 *
 * @apiParam {String} providerId                            Provider ID
 *
 * @apiParam {Object} provider                              Provider
 * @apiParam {String} provider.type		                    Provider type (AWS/GCP/Azure)
 * @apiParam {String} provider.organization 	            Provider organization
 * @apiParam {String} provider.organizationId               Provider organization id
 * @apiParam {Object} provider.providerDetails              Provider details based on type
 * @apiParam {String} provider.providerDetails.projectId    GCP Project ID
 * @apiParam {String} provider.providerDetails.keyFile      Base 64 encoded key file
 * @apiParam {String} provider.providerDetails.sshKey       Base 64 encoded ssh key
 * @apiParamExample {json} GCP-Request-Example:
 * 		{
 * 			"name":	"Provider Name",
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>",
 * 				"keyFile": "<GCP Key File>",
 * 			    "sshKey": "<GCP instance SSH Key>"
 * 			}
 * 		}
 *
 * @apiSuccess {Object[]} providers			                       List of providers
 * @apiSuccess {String} providers.type		                       Provider type (AWS/GCP/Azure)
 * @apiSuccess {String} providers.organization 	                   Provider organization
 * @apiSuccess {String} providers.organization.id                  Provider organization id
 * @apiSuccess {String} providers.organization.name                Provider organization name
 * @apiSuccess {String} providers.providerDetails                  Provider details based on type
 * @apiSuccess {String} providers.providerDetails.projectId        GCP project id
 * @apiSuccessExample {json} GCP-Success-Response:
 *      HTTP/1.1 200 OK
 *      {
 *          "id": "<Provider ID>
 *          "type": "gcp",
 *          "name":	"providerName",
 *          "organization": {
 *              "id": "<ID>",
 *              "name": "Organization name"
 *          },
 *          "providerDetails": {
 *              "projectId": "<Project ID>"
 *          }
 *      }
 */
router.patch('/:providerId', validate(providersValidator.accessIndividualResource), updateProvider);

function createProvider(req, res, next) {
    async.waterfall([
        // @TODO Check if user has access to the specified organization
        // @TODO Authorization checks to be addded
        function(next) {
            providerService.createProvider(req.body, next);
        },
        providerService.createProviderResponseObject
    ], function(err, provider) {
        if(err) {
            next(err);
        } else {
            res.status(200).send(provider);
        }
    });
}

function updateProvider(req, res, next) {
    async.waterfall([
        function (next) {
            providerService.getProvider(req.params.providerId, next);
        },
        function(provider, next) {
            providerService.updateProvider(provider, req.body, next);
        },
        userService.updateOwnerDetails,
        providerService.createProviderResponseObject
    ], function(err, provider) {
        if(err) {
            next(err);
        } else {
            res.status(200).send(provider);
        }
    });
}

function getProvider(req, res, next) {
    async.waterfall([
        // @TODO check access to provider
        function (next) {
            providerService.getProvider(req.params.providerId, next);
        },
        userService.updateOwnerDetails,
        providerService.createProviderResponseObject
    ], function(err, provider) {
        if(err) {
            next(err);
        } else {
            res.status(200).send(provider);
        }
    });
}

function getProviders(req, res, next) {
    async.waterfall([
        function(next) {
            if('user' in req.session) {
                userService.getUserOrgIds(req.session.user, next);
            } else {
                next(null, req.user.orgIds);
            }
        },
        function (orgIds, next) {
            providerService.getAllProviders(orgIds, next);
        },
        userService.updateOwnerDetailsOfList,
        providerService.createProviderResponseList
    ], function(err, providers) {
        if(err) {
            next(err);
        } else {
            res.status(200).send(providers);
        }
    });
}

function deleteProvider(req, res, next) {
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
            providerService.checkProviderAccess(orgs, req.params.providerId, next);
        },
        function(provider, next) {
            providerService.deleteProvider(provider._id, next);
        },
    ], function(err, provider) {
        if(err) {
            next(err);
        } else {
            res.status(200).send({});
        }
    });
}

module.exports.pattern = '/providers';
module.exports.router = router;