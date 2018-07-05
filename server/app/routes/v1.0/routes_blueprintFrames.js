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
var blueprintFrameValidator = require('_pr/validators/blueprintFrameValidator');
var compositeBlueprintService = require('_pr/services/compositeBlueprintService');
var userService = require('_pr/services/userService');
var async = require('async');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/blueprint-frames/*', sessionVerificationFunc);
    /**
     * @api {post} /blueprint-launch-frames                                 Create blueprint launch frame
     * @apiName createBlueprintLaunchFrame
     * @apiGroup blueprint-launch-frame
     *
     * @apiParam {Object} createBlueprintLaunchFrameRequest                 Create blueprint launch frame request
     * @apiParam {String} createBlueprintLaunchFrameRequest.blueprintId     Blueprint ID(Supports only composite blueprints)
     * @apiParam {String} createBlueprintLaunchFrameRequest.environmentId   Environment in which blueprint is launched
     *
     * @apiParamExample {json} Request-Example:
     *      {
     *          "blueprintId": "<MongoID>",
     *          "environmentId": "<MongoID>"
     *      }
     *
     * @apiSuccess {Object[]} blueprintLaunchFrame                          Blueprint launch frame
     * @apiSuccess {String} compositeBlueprints.id                            Blueprint launch frame id
     *
     * @apiSuccessExample {json} Success-Response:
     *        HTTP/1.1 200 OK
     *        {
     *          "id": "<MongoID>",
     *          "state": "S0"
     *      }
     */
    //@TODO Enhance state details
    app.post('/blueprint-frames/', createBlueprintFrame);

    function createBlueprintFrame(req, res, next) {
        async.waterfall([
            // @TODO Check if user has access to the specified organization
            // @TODO Authorization checks to be addded
            function(next) {
                compositeBlueprintService.getCompositeBlueprint(req.body.blueprintId, next);
            },
            function(blueprint, next) {
                compositeBlueprintService.createBlueprintFrame(blueprint, req.body.environmentId,
                    req.session.user.cn, next);
            }
        ], function(err, blueprintFrame) {
            if(err) {
                next(err);
            } else {
                res.status(200).send(blueprintFrame);
            }
        });
    }
}