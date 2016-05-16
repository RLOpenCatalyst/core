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
var gcpNetworkProfileService = require('_pr/services/networkProfileService.js');
var validate = require('express-validation');
var gcpNetworkProfileValidator = require('_pr/validators/gcpNetworkProfileValidator');


router.get('/', function(req, res, next) {
    res.status(200).send('hello world v2.0');
});


/**
	 * @api {post} /network-profile  Save NetworkProfile
	 * @apiName saveNetworkProfile
	 * @apiGroup NetworkProfiles
	 *
	 * @apiParam {String} name				    Mandatory Resource name
	 * @apiParam {String} type				    Mandatory network profile type
	 * @apiParam {String} providerId 			Mandatory Provider ID
	 * @apiParam {String} network				Mandatory Network resource for this instance
	 * @apiParam [String] accessConfigs		    Config list
	 * @apiParam {String} accessConfigName	    Config name
	 * @apiParam {String} accessConfigType		Config type
	 * @apiParamExample {json} Request-Example:
	 	{
	 * 		"profile":{
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		}
	 	}
	 *
	 * @apiSuccess {Object} profile					NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 		{
	 * 			"id": "12345",
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		}
	 */

// Save gcp network profile
router.post('/', function(req, res) {
	logger.debug("nProfile called...");
    var nProfile = req.body.profile;
    async.waterfall(
        [

            function(next) {
            	//validate req
            	validate(gcpNetworkProfileValidator.save,next);
            },
            gcpNetworkProfileService.save(nProfile, next)
        ],
        function(err, resData) {
            if (err) {
                next(err);
            } else {
                return res.send(resData);
            }
        }
    );
});


/**
	 * @api {put} /network-profile/:networkProfileId  Update NetworkProfile
	 * @apiName updateNetworkProfile
	 * @apiGroup NetworkProfiles
	 *
	 * @apiParam {String} npId				    Mandatory NetworkProfile ID.
	 * @apiParam {String} name				    Mandatory Resource name
	 * @apiParam {String} type				    Mandatory network profile type
	 * @apiParam {String} providerId 			Mandatory Provider ID
	 * @apiParam {String} network				Mandatory Network resource for this instance
	 * @apiParam [String] accessConfigs		    Config list
	 * @apiParam {String} accessConfigName	    Config name
	 * @apiParam {String} accessConfigType		Config type
	 * @apiParamExample {json} Request-Example:
	 	{
	 * 		"profile":{
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		}
	 	}
	 *
	 * @apiSuccess {Object} profile					NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 		{
	 			"id": "12345",
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		}
	 */

// Update  network profile
router.put('/:networkProfileId', function(req, res) {
});


/**
	 * @api {get} /network-profile/:networkProfileId  Return NetworkProfile by Id
	 * @apiName getNetworkProfile
	 * @apiGroup NetworkProfiles
	 *
	 *
	 * @apiSuccess {Object} profile					Specific NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 		{
	 			"id": "12345",
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		}
	 */

// get network profile by Id
router.get('/:networkProfileId', function(req, res){

});



/**
	 * @api {delete} /network-profile/:networkProfileId  Delete NetworkProfile by Id
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
router.delete('/:networkProfileId', function(req, res){

});



/**
	 * @api {get} /network-profile  List all NetworkProfiles
	 * @apiName listNetworkProfiles
	 * @apiGroup NetworkProfiles
	 *
	 *
	 * @apiSuccess {Object} profile					All NetworkProfile details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 		[{
	 			"id": "12345",
	 * 			"providerId": "56456",
	 * 			"name": "Instance-1",
	 *			"type": "gcp",
	 *			"network": "Network resource",
	 * 			"accessConfigs": [{}],
	 *			"accessConfigName": "Config name",
	 *			"accessConfigType": "Config type"
	 * 		},
	 		{......}]
	 */

// List all network profiles
router.get('/', function(req, res){

});



module.exports.pattern = '/network-profiles';
module.exports.router = router;