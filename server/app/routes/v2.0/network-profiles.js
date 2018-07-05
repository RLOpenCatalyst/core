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
var networkProfileService = require('_pr/services/networkProfileService.js');
var validate = require('express-validation');
var gcpNetworkProfileValidator = require('_pr/validators/gcpNetworkProfileValidator');
var logger = require('_pr/logger')(module);



/**
	 * @api {post} /api/v2.0/network-profiles  Save NetworkProfile
	 * @apiName saveNetworkProfile
	 * @apiGroup NetworkProfiles
	 *
	 * @apiParam {String} name				    Mandatory Resource name
	 * @apiParam {String} type				    Mandatory network profile type
	 * @apiParam {String} providerId 			Mandatory Provider ID
	 * @apiParam {String} zone				    Mandatory NetworkProfile zone.
	 * @apiParam {String} network				Mandatory Network resource for this instance
	 * @apiParam {String} subNetwork			Mandatory subNetwork resource for this instance
	 * @apiParam [String] accessConfigs		    Config list
	 * @apiParamExample {json} Request-Example:
	 	{
	 * 		"name":	"networkProfileName",
	 * 		"type": "gcp",
	 *		"providerId": "<ID>",
	 * 		"networkDetails": {
	 *			"zone": "us-east1-c",
	 *			"network": "global/networks/default",
	 *			"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
	 * 			"accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
	 * 		}
	 * 	}
	 *
	 * @apiSuccess {Object} profile					NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 			 	 {
	 * 			 	    "id": "<ID>",
	 * 					"name":	"networkProfileName",
	 * 					"type": "gcp",
	 *					"providerId": "<ID>",
	 * 				     "networkDetails": {
	 *						"zone": "us-east1-c",
	 *						"network": "global/networks/default",
	 *						"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
	 * 						"accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
	 * 				     }
	 * 				 }
	 */

// Save gcp network profile
router.post('/', validate(gcpNetworkProfileValidator.save), saveNetworkProfile);

function saveNetworkProfile(req, res, next) {
    var networkProfile = req.body;
    async.waterfall(
        [
            function(next) {
                networkProfileService.saveNetworkProfile(networkProfile, next)
            }
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send(resData);
            }
        }
    );
};


/**
	 * @api {put} /api/v2.0/network-profiles/:networkProfileId  Update NetworkProfile
	 * @apiName updateNetworkProfile
	 * @apiGroup NetworkProfiles
	 *
	 * @apiParam {String} networkProfileId				    Mandatory NetworkProfile ID.
	 * @apiParam {String} name				    Mandatory Resource name
	 * @apiParam {String} type				    Mandatory network profile type
	 * @apiParam {String} providerId 			Mandatory Provider ID
	 * @apiParam {String} zone				    Mandatory NetworkProfile zone.
	 * @apiParam {String} network				Mandatory Network resource for this instance
	 * @apiParam {String} subNetwork			Mandatory subNetwork resource for this instance
	 * @apiParam [String] accessConfigs		    Config list
	 * @apiParamExample {json} Request-Example:
	 	{
	 * 		"name":	"networkProfileName",
	 * 		"type": "gcp",
	 *		"providerId": "<ID>",
	 * 		"networkDetails": {
	 *			"zone": "us-east1-c",
	 *			"network": "global/networks/default",
	 *			"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
	 * 			"accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
	 * 		}
	 * 	}
	 *
	 * @apiSuccess {Object} profile					NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 			 	 {
	 * 			 	    "id": "<ID>",
	 * 					"name":	"networkProfileName",
	 * 					"type": "gcp",
	 *					"providerId": "<ID>",
	 * 				     "networkDetails": {
	 *						"zone": "us-east1-c",
	 *						"network": "global/networks/default",
	 *						"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
	 * 						"accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
	 * 				     }
	 * 				 }
	 */

// Update  network profile
router.put('/:networkProfileId', validate(gcpNetworkProfileValidator.update), updateNetworkProfile);

function updateNetworkProfile(req, res, next) {
    var networkProfiles = req.body;
    var networkProfileId = req.params.networkProfileId;
    async.waterfall(
        [
            function(next) {
                networkProfileService.checkIfNetworkProfileExists(networkProfileId, next)
            },
            function(networkProfile, next) {
                networkProfileService.updateNetworkProfile(networkProfileId, networkProfiles, next)
            }
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send(resData);
            }
        }
    )
};


/**
 * @api {get} /api/v2.0/network-profiles/:networkProfileId  Return NetworkProfile by Id
 * @apiName getNetworkProfile
 * @apiGroup NetworkProfiles
 *
 *
 * @apiSuccess {Object} profile					Specific NetworkProfile details
 *
 * @apiSuccessExample {json} Success-Response:
 * 		HTTP/1.1 200 OK
 * 			 	 {
 * 			 	    "id": "<ID>",
 * 					"name":	"networkProfileName",
 * 					"type": "gcp",
 *					"providerId": "<ID>",
 * 				     "networkDetails": {
 *						"zone": "us-east1-c",
 *						"network": "global/networks/default",
 *						"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
 * 					    "accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
 * 				     }
 * 				 }
 */

// get network profile by Id
router.get('/:networkProfileId', validate(gcpNetworkProfileValidator.get), getNetworkProfileById);

function getNetworkProfileById(req, res, next) {
    async.waterfall(
        [
            function(next) {
                networkProfileService.getNetworkProfileById(req.params.networkProfileId, next)
            }
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else if (resData) {
                return res.status(200).send(resData);
            } else {
                return res.status(404).send("Not Found.");
            }
        }
    )
};



/**
 * @api {delete} /api/v2.0/network-profiles/:networkProfileId  Delete NetworkProfile by Id
 * @apiName deleteNetworkProfile
 * @apiGroup NetworkProfiles
 *
 *
 * @apiSuccess {Object} profile					Success to Delete NetworkProfile
 *
 * @apiSuccessExample {json} Success-Response:
 * 		HTTP/1.1 200 OK
 */

// delete network profile by Id
router.delete('/:networkProfileId', validate(gcpNetworkProfileValidator.remove), removeNetworkProfile);

function removeNetworkProfile(req, res, next) {
    async.waterfall(
        [
            function(next) {
                networkProfileService.checkIfNetworkProfileExists(req.params.networkProfileId, next)
            },
            function(networkProfile, next) {
                networkProfileService.removeNetworkProfile(req.params.networkProfileId, next)
            }
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send("Delete Success.");
            }
        }
    )
}



/**
	 * @api {get} /api/v2.0/network-profiles  List all NetworkProfiles
	 * @apiName listNetworkProfiles
	 * @apiGroup NetworkProfiles
	 *
	 *
	 * @apiSuccess {Object} profile					All NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	        {
	 * 			"networkProfiles": [
	 * 			 	 {
	 * 			 	    "id": "<ID>",
	 * 					"name":	"networkProfileName",
	 * 					"type": "gcp",
	 *					"providerId": "<ID>",
	 * 				    "networkDetails": {
	 *						"zone": "us-east1-c",
	 *						"network": "global/networks/default",
	 *						"subNetwork": "projects/eastern-clock-129807/regions/us-central1/subnetworks/default-3582ec0a991fc614",
	 * 						"accessConfigs": [{"name":"External NAT","type:"ONE_TO_ONE_NAT"}]
	 * 				     }
	 * 				 },
	 * 				 {
	 * 			 	    "id": "<ID>",
	 * 					"name":	"networkProfileName",
	 * 					"type": "AWS",
	 *					"providerId": "<ID>",
	 * 				     "networkDetails": {
	 * 				         "region": "us-west-1",
	 * 						 "vpc": "vpc-1234",
	 *						 "subnet": "subnet-y88900",
	 *						 "securityGroup": "sg-jhf889",
	 *						 "keyPair": "goldendemo"
	 * 				     }
	 * 				 }
	 * 			],
	 *			"count": 2,
	 *			"pageSize": 10,
	 *			"pageIndex": 1
	 * 		}
	 * 
	 */

// List all network profiles
router.get('/', getAllNetworkProfiles);

function getAllNetworkProfiles(req, res, next) {
    async.waterfall(
        [
            function(next) {
                networkProfileService.getAllNetworkProfiles(next);
            }
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else {
                return res.status(200).send(resData);
            }
        }
    )
};



module.exports.pattern = '/network-profiles';
module.exports.router = router;
