var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var tagsModel = require('_pr/model/tags');
var async = require('async');
var resources = require('_pr/model/resources/resources');

var ProviderTagsAggregation = Object.create(CatalystCronJob);
ProviderTagsAggregation.execute = providerTagAggregation;

module.exports = ProviderTagsAggregation;

function providerTagAggregation() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        }else if(orgs.length > 0){
            for(var i = 0; i < orgs.length; i++){
                (function(org){
                    AWSProvider.getAWSProvidersByOrgId(org.rowid, function(err, providers) {
                        if(err) {
                            logger.error(err);
                            return;
                        } else if(providers.length > 0){
                            var count = 0;
                            for(var j = 0; j < providers.length; j++){
                                (function(provider){
                                    count++;
                                    aggregateTagForProvider(provider);
                                })(providers[j]);
                            }
                            if(count ===providers.length){
                                return;
                            }

                        }else{
                            logger.info("Please configure Provider in Organization " +org.orgname+" for  Tag Aggregation");
                            return;
                        }
                    });

                })(orgs[i]);
            }

        }else{
            logger.info("Please configure Organization for Tag Aggregation");
            return;
        }
    });
};

function aggregateTagForProvider(provider) {
    var tags={};
    logger.info('Tags aggregation started for provider '+provider._id);
    async.waterfall([
        function (next) {
            tagsModel.getTagsByProviderId(provider._id, next);
        },
        function (tags, next) {
            var tagDetails = {};
            if (tags.length === 0) {
                next(null, tags);
            } else {
                for (var i = 0; i < tags.length; i++) {
                    tagDetails[tags[i].name] = tags[i];
                    if (i === tags.length - 1) {
                        next(null, tagDetails);
                    }
                }
            }
        },
        function (tagDetails, next) {
            tags = tagDetails;
            getResourcesForTagAggregation(provider,next);
        },
        function (resourceDetails, next) {
            getResourceTags(tags,resourceDetails,provider, next);
        },
        function (tagsDetails, next) {
            saveAndUpdateResourceTags(tagsDetails,provider, next);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            return;
        }else {
            logger.info('Tags aggregation ended for Provider'+provider._id);
            return;
        }
    });
};

function getResourcesForTagAggregation(provider,next){
    var resourcesList=[];
    async.waterfall([
        function(next){
            resources.getResourcesByProviderId(provider._id, next);
        }
    ],function(err,results){
        if(err){
            next(err);
        }else{
            next(null,results);
        }

    });
};

function getResourceTags(tagDetails,resourceDetails,provider,next){
    if(resourceDetails.length > 0) {
        var count = 0;
        for (var m = 0; m < resourceDetails.length; m++) {
            count++;
            for (var tagName in resourceDetails[m].tags) {
                var tagValue = resourceDetails[m].tags[tagName];
                if (tagName in tagDetails) {
                    if (tagValue &&  tagValue != '' && tagDetails[tagName].values.indexOf(tagValue) < 0) {
                        tagDetails[tagName].values.push(tagValue);
                    }
                } else if((typeof tagName != undefined) && (tagName != null)) {
                    tagDetails[tagName] = {
                        'providerId': provider._id,
                        'orgId': provider.orgId[0],
                        'name': tagName,
                        'values': (tagValue &&  tagValue != '')?[tagValue]:[],
                        'new': true
                    };
                }
            }
        }
        if (resourceDetails.length === count) {
            next(null, tagDetails);
        }
    }else{
        next(null,{});
    }
};

function saveAndUpdateResourceTags(tags,provider,next){
    if(tags) {
        var count = 0;
        for (var tagName in tags) {
            if (tags[tagName].new) {
                count++;
                var tagObject = tags[tagName];
                delete tagObject.new;
                tagsModel.createNew(tagObject);
            } else {
                count++;
                var params = {
                    'providerId': provider._id,
                    'name': tagName
                };
                var fields = {
                    'values': tags[tagName].values
                };
                tagsModel.updateTag(params, fields);
            }
        }
        if(count ===Object.keys(tags).length){
            next(null,tags);
        }
    }else{
        next(null,{});
    }
};