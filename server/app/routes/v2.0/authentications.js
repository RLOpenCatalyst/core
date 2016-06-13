var jwt = require('jsonwebtoken');
var authUtil = require('_pr/lib/utils/authUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var config = require('_pr/config');
var logger = require('_pr/logger')(module);

var JWTToken = require('_pr/model/v2.0/jwt_token')

var userService = require('_pr/services/userService.js');
var AuthToken = require('_pr/model/auth-token');
var async = require('async');
var MasterUtils = require('_pr/lib/utils/masterUtil');

var router = require('express').Router();

/**
	 * @api {put} /api/v2.0/auth/signin SignIn Request
	 * @apiName signIn
	 * @apiGroup Authentication
	 *
	 * @apiParam {String} userName				Mandatory User Name.
	 * @apiParam {String} password				Mandatory Password
	 * @apiParamExample {json} Request-Example:
	 	{
	 * 		"userName":	"superadmin",
	 * 		"password": "pass@123"
	 * 	}
	 *
	 * @apiSuccess {Object} SignIn					SignIn details
	 *
	 * @apiSuccessExample {json} Success-Response:
	 * 		HTTP/1.1 200 OK
	 * 			 	 {
	 * 			 	    "token": "nhjkfdhskjsjkldksLSKDsnf"
	 * 				 }
	 */


router.post('/signin', function(req, res, next) {
    var password = req.body.password;
    var username = req.body.username;

    async.waterfall(
        [

            function(next) {
                userService.getUser(username, next)
            },
            function(user, next) {
                userService.checkPassword(user, password, next);
            },
            function(user, isMatched, next) {
                userService.generateToken(user, next);
            }

        ],
        function(err, token) {
            if (err) {
                next(err);
            } else {
                 res.status(200).send(token);
            }
        }
    );

});


/**
 * @api {post} /api/v2.0/auth/signout  
 * @apiName signOut
 * @apiGroup Authentication
 *
 *
 * @apiSuccess {Object} Token					SignOut
 * @apiHeaderExample {string} Header-Authentication:
 *     {
 *       "authentication": "Bearer askjldkasjld"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 * 		HTTP/1.1 200 OK
 * 			 	 {
                message: 'token removed'
            }
 */

router.post('/signout', function(req, res, next) {

    var bearerToken = req.headers['authorization'];
    var token;
    if (bearerToken) {
        token = bearerToken.split(' ')[1];
    }
    userService.signOut(token, function(err, message) {
        if (err) {
            return next(err);
        }
        res.status(200).send(message)
    });


});

function verifyToken(req, res, next) {
    var token = req.headers[config.catalystAuthHeaderName];
    var jwtToken;
    var bearerToken = req.headers['authorization'];
    if (bearerToken) {
        jwtToken = bearerToken.split(' ')[1];
        jwtToken = new Buffer(jwtToken, 'base64').toString('ascii');
    }

    if (jwtToken) {

        jwt.verify(jwtToken, config.jwt.secret, function(err, deocdedPayload) {
            if (err) {
                logger.debug('invalid token. removing from database if any');
                JWTToken.removeToken(jwtToken, function(err, count) {
                    if (err) {
                        err.status = 500;
                        return next(err);
                    }
                    var err = new Error("Unauthorized");
                    err.status = 403;
                    next(err);
                    return;
                });

                return;
            }
            // checking in db 
            JWTToken.findByToken(jwtToken, function(err, jwt) {
                if (err) {
                    err.status = 500;
                    return next(err);
                }
                if (jwt) {
                    req.user = deocdedPayload;
                    return next();
                } else {
                    var err = new Error("Unauthorized");
                    err.status = 403;
                    next(err);
                }
            });
        });
    } else if (token) {

        AuthToken.findByToken(token, function(err, authToken) {
            if (err) {
                var err = new Error("Unauthorized");
                err.status = 403;
                return next(err);

            }
            if (authToken) {
                req.session.user = authToken.sessionData;
                req.user = authToken.sessionData;
                return next();
            } else {
                var err = new Error("Unauthorized");
                err.status = 403;
                return next(err);
            }
        });
    } else {
        var err = new Error("Unauthorized");
        err.status = 403;
        return next(err);
    }
}


module.exports.pattern = '/auth';
module.exports.router = router;
module.exports.sessionVerifier = verifyToken;