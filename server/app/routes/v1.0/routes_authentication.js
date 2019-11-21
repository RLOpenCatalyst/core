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

// This file act as a Controller which contains Authentication logics.


var LdapClient = require('_pr/lib/ldap-client');
var usersDao = require('_pr/model/users.js');
var usersGroups = require('_pr/model/user-groups.js');
var usersRoles = require('_pr/model/user-roles.js');
var cusers = require('_pr/model/d4dmasters/users.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var ldapSettings = appConfig.ldap;
var passport = require('passport');
var bcrypt = require('bcryptjs');
var authUtil = require('_pr/lib/utils/authUtil.js');
var GlobalSettings = require('_pr/model/global-settings/global-settings');
var AuthToken = require('_pr/model/auth-token');
var LDAPUser = require('_pr/model/ldap-user/ldap-user.js');
var aws = require('aws-sdk');
var tempAuthToken = require('_pr/model/temp-auth-token');
var Cryptography = require('_pr/lib/utils/cryptography');

module.exports.setRoutes = function(app) {
    app.post('/auth/createldapUser', function(req, res) {
        if (req.body) {
            LDAPUser.getLdapUser(function(err, ldapData) {
                if (err) {
                    logger.error("Failed to get ldap-user: ", err);
                    return;
                }
                if (ldapData.length) {
                    if (ldapData[0].host != "") {
                        var ldapUser = ldapData[0];
                        var ldapClient = new LdapClient({
                            host: ldapUser.host,
                            port: ldapUser.port,
                            baseDn: ldapUser.baseDn,
                            ou: ldapUser.ou,
                            adminUser: ldapUser.adminUser,
                            adminPass: ldapUser.adminPass
                        });
                        logger.debug('Create User request received:', req.body.username, req.body.password.length, req.body.fname, req.body.lname);
                        ldapClient.createUser(req.body.username, req.body.password, req.body.fname, req.body.lname, function(err, user) {
                            if (err) {
                                logger.debug('In Error', err);
                                res.send(err);
                            } else {

                                res.send(200);
                                return;
                            }
                        });
                    } else {
                        res.send(200);
                        return;
                    }

                } else {
                    logger.debug("No Ldap User found.");
                    res.status(404).send("No Ldap User found.");
                    return;
                }
            });
        } else {
            res.send(req.body);
        }
    });
    app.post('/auth/signin', function(req, res, next) {
        if (req.body && req.body.username && req.body.pass) {
            if (req.body.username === 'ec2-user') {
                var awsMetaData = new aws.MetadataService();
                awsMetaData.request('/latest/meta-data/instance-id', function(err, data) {
                    if (err) {
                        logger.error(err, err.stack);
                        next(err);
                    } else {
                        logger.debug("Instance Id is " + data);
                        var instanceId = data;
                        var user = {
                            "cn": req.body.username,
                            "password": req.body.pass
                        };
                        req.session.user = user;
                        if (req.body.username === 'ec2-user' && req.body.pass === instanceId) {
                            user.roleName = "Admin";
                            user.authorizedfiles = 'Track,Workspace,blueprints,Settings';

                            if (req.body.authType === 'token') {
                                AuthToken.createNew(req.session.user, function(err, authToken) {
                                    req.session.destroy();
                                    if (err) {
                                        return next(err);
                                    }

                                    res.send(200, {
                                        token: authToken.token
                                    });
                                    return;
                                });
                            } else {
                                req.logIn(user, function(err) {
                                    if (err) {
                                        return next(err);
                                    }

                                    return res.redirect('/private/index.html');
                                });
                            }
                        } else {
                            req.session.destroy();
                            if (req.body.authType === 'token') {
                                return res.status(400).send({
                                    message: "Invalid username or password"
                                });
                            }
                            res.redirect('/public/login.html?o=try');
                        }
                    }
                });

            } else if (appConfig.authStrategy.externals) {
                logger.debug("LDAP Authentication>>>>>");
                passport.authenticate('ldap-custom-auth', function(err, user, info) {
                    logger.debug('passport error ==>', err);
                    logger.debug('passport user ==>', user);
                    logger.debug('passport info ==>', info);

                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        if (req.body.authType === 'token') {
                            return res.status(400).send({
                                message: "Invalid username or password"
                            });
                        }
                        return res.redirect('/public/login.html?o=try');
                    }
                    req.session.user = user;
                    usersDao.getUser(user.cn, req, function(err, data) {
                        logger.debug("User is not a Admin.");
                        if (err) {
                            req.session.destroy();
                            next(err);
                            return;
                        }
                        if (data && data.length) {
                            user.roleId = data[0].userrolename;

                            logger.debug('Just before role:', data[0].userrolename);
                            user.roleName = "Admin";
                            user.authorizedfiles = 'Track,Workspace,blueprints,Settings';
                            if (req.body.authType === 'token') {

                                AuthToken.createNew(req.session.user, function(err, authToken) {
                                    req.session.destroy();
                                    if (err) {
                                        return next(err);
                                    }
                                    res.send(200, {
                                        token: authToken.token
                                    });
                                    return;
                                });
                            } else {
                                req.logIn(user, function(err) {
                                    if (err) {
                                        return next(err);
                                    }
                                    return res.redirect('/private/index.html');
                                });
                            }
                        } else {
                            req.session.destroy();
                            if (req.body.authType === 'token') {
                                return res.status(400).send({
                                    message: "Invalid username or password"
                                });
                            }
                            res.redirect('/public/login.html?o=try');
                        }
                    });
                })(req, res, next);
            } else { // Local Authentication

                logger.debug("Local Authentication");
                var password = req.body.pass;
                var userName = req.body.username;
                var user = {
                    "cn": userName,
                    "password": password
                };
                req.session.user = user;
                usersDao.getUser(userName, req, function(err, data) {
                    logger.debug("User is not a Admin.");
                    if (err) {
                        req.session.destroy();
                        next(err);
                        return;
                    }
                    if (data && data.length) {
                        user.roleId = data[0].userrolename;
                        if (typeof data[0].password != 'undefined') {
                            // check for password
                            authUtil.checkPassword(password, data[0].password, function(err, isMatched) {
                                if (err) {
                                    req.session.destroy();
                                    next(err);
                                    return;
                                }
                                if (!isMatched) {
                                    req.session.destroy();
                                    if (req.body.authType === 'token') {
                                        return res.status(400).send({
                                            message: "Invalid username or password"
                                        });
                                    }
                                    res.redirect('/public/login.html?o=try');
                                } else {
                                    logger.debug('Just before role:', data[0].userrolename);
                                    user.roleName = "Admin";
                                    user.authorizedfiles = 'Track,Workspace,blueprints,Settings';

                                    if (req.body.authType === 'token') {
                                        AuthToken.createNew(req.session.user, function(err, authToken) {
                                            req.session.destroy();
                                            if (err) {
                                                return next(err);
                                            }

                                            res.send(200, {
                                                token: authToken.token
                                            });
                                            return;
                                        });
                                    } else {
                                        req.logIn(user, function(err) {
                                            if (err) {
                                                return next(err);
                                            }

                                            return res.redirect('/private/index.html');
                                        });
                                    }
                                }
                            });
                        } else {
                            req.session.destroy();
                            if (req.body.authType === 'token') {
                                return res.status(400).send({
                                    message: "Invalid username or password"
                                });
                            }
                            res.redirect('/public/login.html?o=try');
                        }
                    } else {
                        req.session.destroy();
                        if (req.body.authType === 'token') {
                            return res.status(400).send({
                                message: "Invalid username or password"
                            });
                        }
                        res.redirect('/public/login.html?o=try');
                    }
                });
            }
        } else {
            req.session.destroy();
            if (req.body.authType === 'token') {
                return res.status(400).send({
                    message: "Invalid username or password"
                });
            }
            res.redirect('/public/login.html?o=try');
        }
    });

    app.get('/auth/signout', function(req, res) {
        logger.debug("/auth/signout. Signing out user")
        req.logout(); //passport logout
        req.session.destroy();
        //checking for any auth token in header
        if (req.headers[appConfig.catalystAuthHeaderName]) {
            var token = req.headers[appConfig.catalystAuthHeaderName];
            AuthToken.removeByToken(token, function(err, removeCount) {
                if (err) {
                    logger.error("Unable to remove token");
                    res.status(500).send({
                        message: 'unable to remove auth token'
                    });
                    return;
                }
                logger.debug('token removed', JSON.stringify(removeCount));
                res.send(200, {
                    message: 'token removed'
                });
            });
        } else {
            res.redirect('/');
        }

    });

    app.get('/login', function(req, res) {
        res.redirect('/public/login.html');

    });

    app.get('/auth/userexists/:username', function(req, res) {
        logger.debug('Enter /auth/userexists/:username. for Username ::' + req.params.username);
        LDAPUser.getLdapUser(function(err, ldapData) {
            if (err) {
                logger.error("Failed to get ldap-user: ", err);
                return;
            }
            if (ldapData.length) {
                if (ldapData[0].host != "") {
                    var ldapUser = ldapData[0];
                    var ldapClient = new LdapClient({
                        host: ldapUser.host,
                        port: ldapUser.port,
                        baseDn: ldapUser.baseDn,
                        ou: ldapUser.ou,
                        adminUser: ldapUser.adminUser,
                        adminPass: ldapUser.adminPass
                    });

                    ldapClient.compare(req.params.username, function(err, status) {
                        res.send(status)
                    });
                } else {
                    res.send(200);
                }

            } else {
                logger.debug("No Ldap User found.");
                res.status(404).send("No Ldap User found.");
                return;
            }
        });
    });

    app.get('/auth/userrole', function(req, res) {
        res.send(req.session.cuserrole);
    });



    var verifySession = function verifySession(req, res, next) {
        if (req.session && req.session.user) {
            next();
        } else {
            var token = req.headers[appConfig.catalystAuthHeaderName];
            var tempToken = req.query.ttok; // getting temp token
            if (token) {
                AuthToken.findByToken(token, function(err, authToken) {
                    if (err) {
                        logger.error('Unable to fetch token from db', err);
                        res.send(403);
                        return;
                    }
                    if (authToken) {
                        req.session.user = authToken.sessionData;
                        next();
                       // req.session.destroy();
                    } else {
                        logger.debug("No Valid Session for User - 403");
                        res.send(403);
                    }
                });
            } else if (tempToken) { //checking for temp token
                tempAuthToken.findByToken(tempToken, function(err, tempTokenData) {
                    if (err) {
                        logger.error('Unable to fetch token from db', err);
                        res.send(403);
                        return;
                    }
                    if (tempTokenData) {
                        req.session.user = tempTokenData.sessionData;
                        next();
                        //req.session.destroy();
                    } else {
                        logger.debug("No Valid Session for User - 403");
                        res.send(403);
                        // req.session.destroy();
                    }
                });
            } else {
                logger.debug("No Valid Session for User - 403");
                res.send(403);
            }
        }
    };

    var adminVerificationFunc = function(req, res, next) {
        logger.debug('here ==>', req.session);
        if (req.session && req.session.user) {
            if (req.session.user.cn == 'admin') {
                next();
            } else {
                logger.debug("Has Session && Session Has User But User is not Admin");
                res.send(403);
            }
        } else {
            logger.debug("No Valid Session for User - 403");
            res.send(403);
        }
    }

    app.get('/auth/getpermissionset', verifySession, function(req, res) {
        logger.debug('hit permissionset ');
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);
        if (req && req.session && req.session.user && req.session.user.password)
            delete req.session.user.password;
        if (req && req.session && req.session.user) {
            //Adding navbar items to be displayed
            var topMenu = [];
            if(appConfig.licenseKey){
                var licenseKey = cryptography.decryptText(appConfig.licenseKey,cryptoConfig.decryptionEncoding,cryptoConfig.encryptionEncoding);

                if(licenseKey){
                    var _topMenu = licenseKey.split("-");

                    if(_topMenu[0] == "navbar"){
                        if(_topMenu.indexOf("b") >= 0){
                            topMenu.push("bots")
                        }
                        if(_topMenu.indexOf("wz") >= 0){
                            topMenu.push("workzone")
                        }
                        if(_topMenu.indexOf("wf") >= 0){
                            topMenu.push("workflow")
                        }
                        if(_topMenu.indexOf("t") >= 0){
                            topMenu.push("track")
                        }
                        if(_topMenu.indexOf("c") >= 0){
                            topMenu.push("cloud")
                        }


                    }
                }

            }
            req.session.user.topMenu = topMenu;
            if(process.env.CATALYST_VERSION){
                req.session.user.catalystversion = process.env.CATALYST_VERSION
            }

            if(process.env.CATALYST_ENV){
                req.session.user.catalystenv = process.env.CATALYST_ENV
            }

            res.send(JSON.stringify(req.session.user));
            return;
        } else {
            res.send({});
        }
    });

    return {
        sessionVerificationFunc: verifySession,
        adminSessionVerificationFunc: adminVerificationFunc
    };

}