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

var userService = module.exports = {};

//@TODO to be modified to work with tokens as well
userService.getUserOrgs = function getUserOrgs(user, callback) {
    // @TODO Constant to be moved to config
    if(user.roleId == 'Admin') {
        MasterUtil.getAllActiveOrg(function(err, orgs) {
            if(err) {
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
            if(err) {
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

userService.getOrgById = function getOrgById(orgId, callback) {
    d4dMastersNewModel.d4dModelMastersOrg.find({
        rowid: orgId
    }, function(err, orgDetails) {
        if(err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else if(orgDetails.length > 0) {
            callback(null, orgDetails[0]);
        } else {
            callback(null, null);
        }
    });
};