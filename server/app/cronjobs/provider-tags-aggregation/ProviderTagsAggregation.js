var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var tagsModel = require('_pr/model/tags');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');

var ProviderTagsAggregation = Object.create(CatalystCronJob);
ProviderTagsAggregation.execute = aggregation;

module.exports = ProviderTagsAggregation;

//  @TODO To be refactored (High priority)
function aggregation() {
    logger.info('Tags aggregation started');
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
                                tagsModel.getTagsByProviderId(provider._id, function(err, tags) {

                                    if(err) {
                                        logger.error("Unable to get tags for provider");
                                        return;
                                    } else {
                                        var tagDetails = {};
                                        for(var l = 0; l < tags.length; l++) {
                                            tagDetails[tags[l].name] = tags[l];
                                        }

                                        unassignedInstancesModel.getByProviderId(provider._id, function(err, instances) {
                                            for(var m = 0; m < instances.length; m++) {
                                                for(var tagName in instances[m].tags) {

                                                    var tagValue = instances[m].tags[tagName];
                                                    if(tagName in tagDetails) {
                                                        if (tagDetails[tagName].values.indexOf(tagValue) < 0) {
                                                            tagDetails[tagName].values.push(tagValue);
                                                        }
                                                    } else {
                                                        tagDetails[tagName] = {
                                                            'providerId': provider._id,
                                                            'orgId': org.rowid,
                                                            'name': tagName,
                                                            'values': [tagValue],
                                                            'new': true
                                                        }
                                                    }

                                                }
                                            }

                                            for(var tagName in tagDetails) {
                                                if(tagDetails[tagName].new) {
                                                    var tagObject = tagDetails[tagName];
                                                    delete tagObject.new;
                                                    tagsModel.createNew(tagObject);
                                                } else {
                                                    var params = {
                                                        'providerId': provider._id,
                                                        'name': tagName
                                                    }
                                                    var fields = {
                                                        'values': tagDetails[tagName].values
                                                    }
                                                    tagsModel.updateTag(params, fields);
                                                }
                                            }
                                        });
                                    }

                                })
                                logger.info('Tags aggregation for provider ', provider._id);
                            })(providers[j]);
                            logger.info('Tags aggregation ended');
                        }
                    }
                });
            })(orgs[i]);
        }
    });
}