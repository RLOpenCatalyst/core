var jwt = require('jsonwebtoken');
var authUtil = require('_pr/lib/utils/authUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var config = require('_pr/config');
var logger = require('_pr/logger')(module);

var JWTToken = require('_pr/model/v2.0/jwt_token')

var router = require('express').Router();


router.post('/signIn', function(req, res, next) {
    var password = req.body.password;
    var username = req.body.username;
    d4dModelNew.d4dModelMastersUsers.find({
        loginname: username,
        id: 7
    }, function(err, usersData) {
        if (err) {
            return next(err);
        }
        if (usersData && usersData.length) {
            user = usersData[0];
            authUtil.checkPassword(password, user.password, function(err, isMatched) {
                if (err) {
                    next(err);
                    return;
                }
                if (!isMatched) {
                    return res.status(400).send({
                        message: "Invalid username or password"
                    });
                }
                // creating new token 
                jwt.sign({
                    username: username
                }, config.jwt.secret, {
                    expiresIn: config.jwt.expiresInSec
                }, function(err, token) {
                    if (err) {
                        logger.error(err);
                        return next(err);
                    }
                    // saving token in db 
                    JWTToken.createNew({
                        token: token,
                        expiry: config.jwt.expiresInSec
                    }, function(err, jwtToken) {
                        if (err) {
                            return next(err);
                        }

                        res.status(200).send({
                            token: token
                        });

                    });
                });

            });
        }
    });

});

router.get('/signOut', function(req, res, next) {

    var token = req.headers[config.catalystAuthHeaderName];
    if (token) {
        JWTToken.removeToken(token, function(err, count) {
            if (err) {
                return next(err);
            }
            res.status(200).send({
                message: 'token removed'
            });
            return;
        });
    } else {
        res.status(400).send({
            message: 'token not available in request'
        });
    }

});

function verifyToken(req, res, next) {
    var token = req.headers[config.catalystAuthHeaderName];
    if (token) {
        jwt.verify(token, config.jwt.secret, function(err, deocdedPayload) {
            if (err) {
                logger.debug('invalid token. removing for database if any');
                JWTToken.removeToken(token, function(err, count) {
                    if (err) {
                        return next(err);
                    }
                    res.status(403).send({
                        message: "Unauthorized"
                    });
                    return;
                });

                return;
            }
            // checking in db 
            JWTToken.findByToken(token, function(err, jwtToken) {
                if (err) {
                    return next(err);
                }
                if (jwtToken) {
                    req.user = deocdedPayload;
                    next();
                } else {
                    res.status(403).send({
                        message: "Unauthorized"
                    });
                }
            });
        });
    } else {
        res.status(403).send({
            message: "Unauthorized"
        });
    }
}


module.exports.pattern = '/auth';
module.exports.router = router;
module.exports.sessionVerifier = verifyToken;