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
//var util = require('util');
const SamlStrategy = require('passport-saml').Strategy;

// var SAMLPassportStrategy = function(passport, config){
//     this.init = function(){
//         logger.debug("initializing SAML strategy........"+JSON.stringify(config));
//         passport.use(new SamlStrategy(
//         {
//           path: config.path,
//           entryPoint: config.entryPoint,
//           issuer: config.issuer,
//           cert: config.cert
//         },
//         function (profile, done) {
//           var retObj = {};
//           config.saml.profilemap.forEach(ele => {
//               retObj[ele.name] = profile[ele.samlname];
//           });
//           logger.debug("About to return profile.."+JSON.stringify(retObj));
//           return done(null,retObj);
//         })
//       );
//     }
// }

module.exports = function(passport,config){
  logger.debug("About to set new SAML Strategy");
  passport.use(new SamlStrategy(
    {
          path: config.path,
          entryPoint: config.entryPoint,
          issuer: config.issuer,
          cert: config.cert
    },
    function (profile, done) {
                var retObj = {};
               // logger.debug("Entering Profile Mapping-----"+JSON.stringify(profile));
          config.profilemap.forEach(ele => {
              //logger.debug("Mapping: "+ele.name+":"+ele.samlname);
              retObj[ele.name] = profile[ele.samlname];
          });
          //cleaning up the userid
          if(retObj["userid"]){
            retObj["userid"] = retObj["userid"].split('@')[0];
          }
          if(retObj["cn"]){
            //retObj["cn"] = retObj["cn"].split('@')[0].toLowerCase();
            //Need to bypass cn, with user object not in db. TO DO: JIT user creation
            retObj["cn"] = "superadmin";
          }
          //logger.debug("About to return profile.."+JSON.stringify(retObj));
          return done(null,retObj);
            // {
            //   id: profile.nameID,
            //   email: profile.useremail,
            //   displayName: profile.userlogin,
            //   firstName: profile.userfirstname,
            //   lastName: profile.userlastname
            // });
    })
  );
};