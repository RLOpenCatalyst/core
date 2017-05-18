
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
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");
var settingWizard = require('_pr/model/setting-wizard');
var appConfig = require('_pr/config');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');

const errorType = 'settingsService';

var settingsService = module.exports = {};

settingsService.updateProjectData = function updateProjectData(enviornment,callback){
    var projectIds = enviornment.projectname_rowid.split(",");
    var count = 0;
    for(var i = 0; i < projectIds.length; i++){
        (function(projectId){
            async.waterfall([
                function(next){
                    count++;
                    masterUtil.getParticularProject(projectId,next);
                },
                function(masterProjectData,next){
                    if(masterProjectData.length > 0){
                        var envNames=masterProjectData[0].environmentname.split(",");
                        var envIds=masterProjectData[0].environmentname_rowid.split(",");
                        if(envNames.indexOf(enviornment.environmentname) === -1 && envIds.indexOf(enviornment.environmentname_rowid) === -1){
                            next(null,null);
                        }else{
                            var projectObj={
                                projectId:projectId,
                                envNames:changeArrayToString(envNames,enviornment.environmentname),
                                envIds:changeArrayToString(envIds,enviornment.rowid)
                            }
                            next(null,projectObj);
                        }
                    }else{
                        next(null,null);
                    }
                },
                function(updatedMasterProjectObj,next){
                    if(updatedMasterProjectObj){
                        masterUtil.updateParticularProject(updatedMasterProjectObj,next);
                    }else{
                        next(null,updatedMasterProjectObj);
                    }
                }
            ],function(err,results){
                if (err) {
                    logger.error("Error while updating Environments in Master Data Project "+err);
                    callback(err,null);
                    return;
                }else{
                    if(projectIds.length ===  count) {
                        callback(null, results);
                        return;
                    }else{
                        return;
                    }
                }

            })
        })(projectIds[i]);
    }

};

settingsService.trackSettingWizard = function trackSettingWizard(id,orgId,callback){
    if(orgId === null || orgId === ''){
        callback(null,orgId);
        return;
    }else if(id === '1'){
       settingWizard.removeSettingWizardByOrgId(orgId,function(err,data){
           if(err){
               callback(err,null);
               return;
           }
           callback(null,data);
       })
    }else if(id === '2'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           logger.debug(JSON.stringify(settingWizards));
           if (settingWizards !== null &&  settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Org Configuration'
               && settingWizards.currentStep.nestedSteps[1].isCompleted === true) {
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizards.currentStep.nestedSteps[2].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
    }else if(id === '4'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Config Management' && settingWizards.currentStep.nestedSteps[0].isCompleted === false) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[2].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = settingWizardSteps[0];
               settingWizards.nextStep = settingWizardSteps[2];
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '10'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Config Management'
               && settingWizards.currentStep.nestedSteps[1].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[0].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '3'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'User Configuration'
               && settingWizards.currentStep.nestedSteps[0].isCompleted === false) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               var previousStep = settingWizardSteps[1];
               previousStep.nestedSteps[0].isCompleted = true;
               previousStep.nestedSteps[1].isCompleted = true;
               previousStep.nestedSteps[2].isCompleted = true;
               previousStep.isCompleted = true;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = previousStep;
               settingWizards.nextStep = settingWizardSteps[3];
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '21'){
        settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
            if (err) {
                callback(err, null);
                return;
            }
            if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
                && settingWizards.currentStep.name === 'User Configuration'
                && settingWizards.currentStep.nestedSteps[1].isCompleted === false) {
                settingWizards.currentStep.nestedSteps[0].isCompleted = false;
                settingWizards.currentStep.isCompleted = false;
                settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                    if (err) {
                        callback(err,null);
                        return;
                    }
                    callback(null,data);
                });
            }else{
                callback(null,settingWizards);
                return;
            }
        })
    }else if(id === '7'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Provider Configuration'
               && settingWizards.currentStep.nestedSteps[0].isCompleted === false) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               var previousStep = settingWizardSteps[2];
               previousStep.nestedSteps[0].isCompleted = true;
               previousStep.nestedSteps[1].isCompleted = true;
               previousStep.isCompleted = true;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = previousStep;
               settingWizards.nextStep = settingWizardSteps[4];
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '26'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Devops Roles'
               && settingWizards.currentStep.nestedSteps[1].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[0].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '18'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Devops Roles'
               && settingWizards.currentStep.nestedSteps[2].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '20'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Wizard Status'
               && settingWizards.currentStep.isCompleted === true) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               var previousStep = settingWizardSteps[5];
               previousStep.nestedSteps[0].isCompleted = true;
               previousStep.nestedSteps[1].isCompleted = true;
               previousStep.nestedSteps[2].isCompleted = true;
               previousStep.isCompleted = true;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[2].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = previousStep;
               settingWizards.nextStep = {name:'Wizard Status',isCompleted:true};
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '17'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Gallery Setup'
               && settingWizards.currentStep.nestedSteps[1].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[0].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === '19'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Gallery Setup'
               && settingWizards.currentStep.nestedSteps[2].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === 'provider'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Provider Configuration'
               && settingWizards.currentStep.nestedSteps[1].isCompleted === false) {
               settingWizards.currentStep.nestedSteps[0].isCompleted = false;
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === 'vmImage'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Gallery Setup'
               && settingWizards.currentStep.nestedSteps[0].isCompleted === false) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               var previousStep = settingWizardSteps[3];
               previousStep.nestedSteps[0].isCompleted = true;
               previousStep.nestedSteps[1].isCompleted = true;
               previousStep.isCompleted = true;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[1].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = previousStep;
               settingWizards.nextStep = settingWizardSteps[5];
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else if(id === 'scriptGallery'){
       settingWizard.getSettingWizardByOrgId(orgId,function(err,settingWizards) {
           if (err) {
               callback(err, null);
               return;
           }
           if (settingWizards !== null && settingWizards.currentStep && settingWizards.currentStep.nestedSteps
               && settingWizards.currentStep.name === 'Devops Roles' && settingWizards.currentStep.nestedSteps[0].isCompleted === false) {
               var settingWizardSteps = appConfig.settingWizardSteps;
               var previousStep = settingWizardSteps[4];
               previousStep.nestedSteps[0].isCompleted = true;
               previousStep.nestedSteps[1].isCompleted = true;
               previousStep.isCompleted = true;
               settingWizards.currentStep = settingWizards.previousStep;
               settingWizards.currentStep.nestedSteps[2].isCompleted = false;
               settingWizards.currentStep.isCompleted = false;
               settingWizards.previousStep = previousStep;
               settingWizards.nextStep = settingWizardSteps[6];
               settingWizard.updateSettingWizard(settingWizards, function (err, data) {
                   if (err) {
                       callback(err,null);
                       return;
                   }
                   callback(null,data);
                   return;
               });
           }else{
               callback(null,settingWizards);
               return;
           }
       })
   }else{
    callback(null,null);
    return;
   }
};

settingsService.getOrgUserFilter =  function getOrgUserFilter(userName,callback){
    async.waterfall([
        function(next){
            d4dModelNew.d4dModelMastersUsers.find({
                loginname: userName,
                id:'7'
            },next)
        },
        function(userDetails,next){
            if(userDetails.length > 0){
                var orgIds = []
                userDetails.forEach(function(user){
                    if(user.orgname_rowid && (typeof user.orgname_rowid[0] !== 'undefined' && user.orgname_rowid[0] !== '')){
                        if(orgIds.indexOf(user.orgname_rowid[0]) < 0) {
                            orgIds.push(user.orgname_rowid[0]);
                        }
                    }
                });
                next(null,orgIds);

            }else{
                next({code:400,message:"No data is found in DB against user:"+userName},null);
            }
        },
        function(orgIds,next){
            if(orgIds.length > 0){
                d4dModelNew.d4dModelMastersOrg.find({
                    id: "1",
                    active: true,
                    rowid:{$in:orgIds}
                },next)
            }else{
                d4dModelNew.d4dModelMastersOrg.find({
                    id: "1",
                    active: true
                },next)
            }
        },
        function(orgDetailList,next){
            var orgIds = [];
            orgDetailList.forEach(function(org){
                if(org.rowid && org.rowid !== null){
                    if(orgIds.indexOf(org.rowid) < 0) {
                        orgIds.push(org.rowid);
                    }
                }
            });
            next(null,orgIds);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return callback(err,null);
        }else{
            return callback(null,results);
        }

    })
}

function changeArrayToString(list,str){
    var resultStr='';
    for(var i = 0; i < list.length; i++){
        if (i === list.length - 1) {
            if(str !== list[i]) {
                resultStr = resultStr + list[i];
            }
        } else {
            if(str !== list[i]) {
                resultStr = resultStr + list[i] + ',';
            }
        }
    }
    if(resultStr.slice(-1) === ','){
        var res = resultStr.slice(0,-1);
        return res;
    }else{
        return resultStr;
    }
}
