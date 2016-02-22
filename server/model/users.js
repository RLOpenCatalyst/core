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


var mongoose = require('mongoose');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var permissionsetDao = require('../model/dao/permissionsetsdao');
var Schema = mongoose.Schema;
var logger = require('_pr/logger')(module);

var UserSchema = new Schema({
  username: String,
  fname: String,
  lname: String,
  groupId: Number,
  roleId: Number
});

var Users = mongoose.model('users', UserSchema);

module.exports.createUser = function(username, fname, lname, groupId, roleId, callback) {
  var user = new Users({
    username: username,
    fname: fname,
    lname: lname,
    groupId: groupId,
    roleId: roleId
  });
  user.save(function(err, data) {
    if (err) {
      callback(err, null);
      return;
    }
    logger.debug("User Document Created");
    callback(null, data);
  });

};



var getpermissionforcategory = function(category,permissionto, permissionset) {
    var perms = [];
    if (permissionset) {
        for(var i = 0; i< permissionset.length; i++){
          var obj = permissionset[i].permissions;
          for(var j = 0; j < obj.length;j++){
            if(obj[j].category == category){
              var acc = obj[j].access.toString().split(',');
              for(var ac in acc){
                if(perms.indexOf(acc[ac]) < 0)
                  perms.push(acc[ac]);
              }
             
            }
          }
        }
        logger.debug('getobjects query returns:' + perms.join());
        if(perms.indexOf(permissionto) >=0){
          return(true);
        }
        else
          return(false);
    } else {
        return (false);
    }

};

module.exports.haspermission = function(username,category,permissionto,req,permissionset,callback){
  logger.debug('Entering haspermission');
  if(req == null && permissionset == null){ //there is no request object check if the json has been provided
      this.getUser(username,req,function(err,data){
          if(!err){
            logger.debug('Entering getpermissionforcategory category:' + category + ' permissionto: ' + permissionto );
            var permissionfound = getpermissionforcategory(category,permissionto,data);
            callback(null,permissionfound);
          }
          else{
              logger.debug('Exiting  users haspermission on err ' + err);
              callback(err,null);
          }
      });
  }
  else if(permissionset != null){
      logger.debug('Has permissionset category:' + category + ' permissionto: ' + permissionto );
            var permissionfound = getpermissionforcategory(category,permissionto,permissionset);
            callback(null,permissionfound);
  }
  else{ //req != null
    if(req.session.user.permissionset){
        logger.debug('Found permissionset in req category:' + category + ' permissionto: ' + permissionto );
            var permissionfound = getpermissionforcategory(category,permissionto,req.session.user.permissionset);
            callback(null,permissionfound);
    }
    else{
       this.getUser(username,null,function(err,data){
          if(!err){
            logger.debug('Entering getpermissionforcategory with no req category:' + category + ' permissionto: ' + permissionto );
            var permissionfound = getpermissionforcategory(category,permissionto,data);
            callback(null,permissionfound);
          }
          else{
              logger.debug('Exiting  users haspermission on err ' + err);
              callback(err,null);
          }
      });
    }
  }
};

module.exports.getUser = function(username, req, callback) {
    logger.debug('Entering getUser');
    d4dModelNew.d4dModelMastersUsers.find({
        loginname: username,
        id: 7
    }, function(err, d4dMasterJson) {
        logger.debug('Completed query on masters users.');
        if (err) {
            logger.debug("Hit and error:" + err);
        }
        if (d4dMasterJson && d4dMasterJson.length) {
            //Fetching the permission set for the role defined for the user
            d4dMasterJson = JSON.parse(JSON.stringify(d4dMasterJson));
            logger.debug('Entering  permissionsetDao.getPermissionSet. d4dMasterJson : ' + JSON.stringify(d4dMasterJson));
            
            permissionsetDao.getPermissionSet(d4dMasterJson[0].userrolename, function(err, data) {
                if (!err) {
                    if (req != null) {
                        logger.debug('Setting req object with permission set');
                        req.session.user.permissionset = data;
                        logger.debug("sent response" + JSON.stringify(d4dMasterJson) + " Permissionset : " + JSON.stringify(req.session.user.permissionset));
                        logger.debug('Exiting  permissionsetDao.getPermissionSet.');
                        callback(null, d4dMasterJson);
                    }
                    else{ //internal call return the permissionset json.
                        logger.debug('Exiting  permissionsetDao.getPermissionSet. Sending the permissionset json.');
                        callback(null, data);
                    }
                } else {
                    logger.debug('Exiting  permissionsetDao.getPermissionSet on err ' + err);
                    callback(err, null);
                }
            });
        } else {
            logger.debug("none found");
            callback(err, null);
        }


    });
};

module.exports.getUser__ = function(username, callback) {
  Users.find({
    username: username,
  }, function(err, data) {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, data)
  });
}

module.exports.getUsersInGroup = function(groupId, roleId, callback) {
  Users.find({
    groupId: groupId,
  }, function(err, data) {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, data)
  });
}