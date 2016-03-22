var logger = require('_pr/logger')(module);
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var tagsDao = require('_pr/model/tags');
function aggregation() {
    var orgs = MasterUtils.getAllActiveOrg(function(err, orgs) {
        if (err) {
            logger.error('Unable to fetch orgs ==>', err);
            return;
        }
        if (!(orgs && orgs.length)) {
            logger.warn('No org found');
            return;
        }
        for (var i = 0; i < orgs.length; i++) {
            (function (org) {
                AWSProvider.getAWSProvidersByOrgId(org._id, function (err, providers) {
                    if (err) {
                        logger.error("Unable to get aws providers :", err);
                        return;
                    }
                    else {
                        for (var j = 0; j < providers.length; j++) {
                            (function (provider) {
                                unManagedInstancesDao.getInstanceTagByOrgProviderId({
                                    orgId: org.rowid,
                                    providerId: provider._id,
                                }, function (err, unManagedInstancesTag) {
                                    if (err) {
                                        logger.error('Unable to fetch Unmanaged Instances Tag by org,provider', err);
                                        return;
                                    }
                                    else{
                                               var tagInfo = [];
                                                var objTag = {};
                                                for (var k = 0; k < unManagedInstancesTag.length; k++) {
                                                    var jsonObj = unManagedInstancesTag[k].tags;
                                                    var jsonArray = Object.keys(jsonObj);
                                                    if (jsonArray.length > 0) {
                                                        for (var l = 0; l < jsonArray.length; l++) {
                                                            if (tagInfo.indexOf(jsonArray[l]) == -1) {
                                                                tagInfo.push(jsonArray[l]);
                                                            }
                                                        }
                                                    }
                                                }
                                                for(var m = 0; m < tagInfo.length; m++){
                                                        objTag[tagInfo[m]]='';
                                                }
                                                 tagsDao.getTagByOrgProviderId({
                                                 orgId: org.rowid,
                                                 providerId: provider._id,
                                                 }, function (err, tags) {
                                                   if (err) {
                                                       logger.error('Unable to fetch Unmanaged Instances Tag by org,provider', err);
                                                       return;
                                                     }
                                                     else{
                                                       if(tags.length >0){
                                                           for(var a = 0; a < tags.length; a++){

                                                               if(tags[a].orgId == org.rowid && tags[a].providerId == provider._id){
                                                                   var objTagInfo=tags[a].tagsInfo;
                                                                   var jsonKeys = Object.keys(objTagInfo);
                                                                   for(var b = 0; b<jsonKeys.length; b++){
                                                                       if((tagInfo.indexOf(jsonKeys[b])) > 0){

                                                                           objTag[jsonKeys[b]]=objTagInfo[jsonKeys[b]];
                                                                       }
                                                                   }
                                                                   tagsDao.updateTag({
                                                                       orgId: org.rowid,
                                                                       providerId: provider._id,
                                                                   },objTag);
                                                               }
                                                               else{
                                                                   tagsDao.createNew({
                                                                       orgId: org.rowid,
                                                                       providerId: provider._id,
                                                                       tagsInfo:objTag
                                                                   });
                                                               }

                                                           }
                                                       }
                                                       else{
                                                           tagsDao.createNew({
                                                               orgId: org.rowid,
                                                               providerId: provider._id,
                                                               tagsInfo:objTag
                                                           });
                                                       }

                                                   }
                                                 });



                                    }
                                });
                            })(providers[j]);
                        }
                    }
                });
            })(orgs[i]);
        }
    });
}
module.exports = aggregation;