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
 * @api {get} /api/v2.0/providers 	                     Get providers list
 * @apiName getAllProviders
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
 * @apiSuccess {Number} count				             Number of providers in the result set
 * @apiSuccess {pageSize} pageSize			             Page size
 * @apiSuccess {pageIndex} pageIndex		             Page index
 *
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 200 OK
 * 		{
 * 			"providers": [
 * 			 	 {
 * 			 	    "id": "<ID>",
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
 * 					"type": "GCP",
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
 *
 */
router.get('/', getProviders);

/**
 * @api {get} /api/v2.0/providers 	                    Get provider
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
 *
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
router.get('/:providerId', getProvider);


/**
 * @api {post} /api/v2.0/providers 	                        Create provider
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
 * @apiParamExample {json} GCP-Request-Example:
 * 		{
 * 			"name":	"Provider Name",
 * 			"type": "GCP",
 * 			"organization": "<Organization ID>",
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>",
 * 				"keyFile": "<GCP Key File>"
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
 * 			"type": "GCP",
 * 			"organization": {
 *             "id": "<ID>",
 * 				"name": "Organization name"
 * 			},
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>"
 * 			}
 * 		}
 */
router.post('/', createProvider);

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
router.delete('/:providerId', deleteProvider);

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
 * @apiParamExample {json} GCP-Request-Example:
 * 		{
 * 			"name":	"Provider Name",
 * 			"organization": "<Organization ID>",
 * 			"providerDetails": {
 * 				"projectId": "<GCP Project ID>",
 * 				"keyFile": "<GCP Key File>"
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
 *          "type": "GCP",
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
router.patch('/:providerId', updateProvider);

function createProvider(req, res, next) {
}

function updateProvider(req, res, next) {
}

function deleteProvider(req, res, next) {
}

function getProviders(req, res, next) {
}

function getProvider(req, res, next) {s
}

module.exports.pattern = '/providers';
module.exports.router = router;