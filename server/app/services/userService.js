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
var MasterUtil = require('_pr/lib/utils/masterUtil.js');
// @TODO to be replaced on deprecation
var d4dMastersNewModel = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var jwt = require('jsonwebtoken');
var authUtil = require('_pr/lib/utils/authUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var config = require('_pr/config');
var JWTToken = require('_pr/model/v2.0/jwt_token');
var async = require('async');

var userService = module.exports = {};

//@TODO to be modified to work with tokens as well
userService.getUserOrgs = function getUserOrgs(user, callback) {
    // @TODO Constant to be moved to config

    if (user.roleId == 'Admin') {
        MasterUtil.getAllActiveOrg(function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a[b.orgname] = b;
                    return a;
                }, {});
                callback(null, orgsResult);
            }
        });
    } else {
        MasterUtil.getOrgs(user.cn, function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a[b.orgname] = b;
                    return a;
                }, {});
                callback(null, orgsResult);
            }
        });
    }
};

userService.getUserOrgIds = function getUserOrgIds(user, callback) {
    // @TODO Constant to be moved to config
    if (user.roleId == 'Admin') {
        MasterUtil.getAllActiveOrg(function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a.push(b.rowid);
                    return a;
                }, []);
                callback(null, orgsResult);
            }
        });
    } else {
        MasterUtil.getOrgs(user.cn, function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgsResult = orgs.reduce(function(a, b) {
                    a.push(b.rowid);
                    return a;
                }, []);
                callback(null, orgsResult);
            }
        });
    }
};

userService.getOrg = function getOrg(orgId, callback) {
    d4dMastersNewModel.d4dModelMastersOrg.find({
        rowid: orgId
    }, function(err, orgDetails) {
        if (err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else if (orgDetails.length > 0) {
            callback(null, orgDetails[0]);
        } else {
            var err = new Error('Invalid organization id');
            err.status = 404;
            callback(err);
        }
    });
};

userService.signOut = function signOut(base64Token, callback) {
    if (base64Token) {
        var token = new Buffer(base64Token, 'base64').toString('ascii');
        JWTToken.removeToken(token, function(err, count) {
            if (err) {
                err.status = 500;
                return callback(err);
            }

            callback(null, {
                message: 'token removed'
            });
            return;
        });
    } else {
        var err = new Error('token not available in request');
        err.status = 400;
        callback(err);
    }
};

userService.getUser = function getUser(username, callback) {
    d4dModelNew.d4dModelMastersUsers.find({
        loginname: username,
        id: 7
    }, function(err, usersData) {
        if (err) {
            err.status = 500;
            return callback(err);
        }
        if (usersData && usersData.length) {
            user = usersData[0];
            callback(null, user);
        } else {
            var err = new Error("User does not exist");
            err.status = 400;
        }

    });

};

userService.checkPassword = function checkPassword(user, password, callback) {
    authUtil.checkPassword(password, user.password, function(err, isMatched) {
        if (err) {
            err.status = 500;
            return allback(err)
        }
        if (isMatched) {
            callback(null, user, true);
        } else {
            var err = new Error("password does not match");
            err.status = 400;
            callback(err);
        }
    });
};

userService.generateToken = function generateToken(user, callback) {
    if (user.orgname_rowid && user.orgname_rowid.length && user.orgname_rowid[0]) {
        sign(user.orgname_rowid);
    } else {
        MasterUtil.getAllActiveOrg(function(err, orgs) {
            if (err) {
                var err = new Error('Internal Server Error');
                err.status = 500;
                callback(err);
            } else {
                var orgIds = [];
                for (var i = 0; i < orgs.length; i++) {
                    orgIds.push(orgs[i].rowid);
                }

                sign(orgIds);
            }
        });
    }

    function sign(orgIdsList) {

        jwt.sign({
            username: user.loginname,
            orgIds: orgIdsList
        }, config.jwt.secret, {
            expiresIn: config.jwt.expiresInSec
        }, function(err, token) {
            if (err) {
                err.status = 500;
                logger.error(err);
                return callback(err);
            }
            // saving token in db 
            JWTToken.createNew({
                token: token,
                expiry: config.jwt.expiresInSec
            }, function(err, jwtToken) {
                if (err) {
                    err.status = 500;
                    return callback(err);
                }

                var base64Token = new Buffer(token).toString('base64');
                callback(null, {
                    token: base64Token
                });
            });
        });
    }
};

userService.updateOwnerDetails = function updateOwnerDetails(entity, next) {
    async.parallel({
        organization: function(callback) {
            if('organizationId' in entity)
                // @TODO Improve call to self
                userService.getOrg(entity.organizationId, callback);
            else
                callback(null);
        },
        businessGroup: function(callback) {
            if ('businessGroupId' in entity) {
                d4dModelNew.d4dModelMastersProductGroup.find({
                    rowid: entity.businessGroupId
                }, callback);
            } else {
                callback(null, null);
            }
        },
        project: function(callback) {
            if('projectId' in entity) {
                d4dModelNew.d4dModelMastersProjects.find({
                    rowid: entity.projectId
                }, callback);
            } else {
                callback(null, null);
            }
        }
    }, function(err, results) {
        if(err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            next(err);
        } else {
            if(results.organization) {
                delete entity.organizationId;
                entity.organization = {
                    id: results.organization.rowid,
                    name: results.organization.orgname
                }
            }

            if(results.businessGroup) {
                delete entity.businessGroupId;
                entity.businessGroup = {
                    id: results.businessGroup[0].rowid,
                    name: results.businessGroup[0].productgroupname
                }
            }

            if(results.project) {
                delete entity.projectId;
                entity.project = {
                    id: results.project[0].rowid,
                    name: results.project[0].projectname
                }
            }

            next(null, entity);
        }
    });
};

// @TODO Optimize to avoid multiple db calls
userService.updateOwnerDetailsOfList = function updateOwnerDetailsOfList(entities, callback) {
    var entitiesList = [];

    if(entities.length == 0)
        return callback(null, entitiesList);

    for(var i = 0; i < entities.length; i++) {
        (function(entity) {
            // @TODO Improve call to self
            userService.updateOwnerDetails(entity, function(err, updatedEntity) {
                if(err) {
                    return callback(err);
                } else {
                    entitiesList.push(updatedEntity);
                }

                if(entitiesList.length == entities.length) {
                    return callback(null, entitiesList);
                }
            });
        })(entities[i]);
    }
}