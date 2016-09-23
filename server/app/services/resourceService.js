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
var resourceService = module.exports = {};
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var aws = require('aws-sdk');
var resources = require('_pr/model/resources/resources');
var CW = require('_pr/lib/cloudwatch.js');
var S3 = require('_pr/lib/s3.js');
var EC2 = require('_pr/lib/ec2.js');
var RDS = require('_pr/lib/rds.js');
var resourceCost = require('_pr/model/resource-costs');
var csv = require("fast-csv");
var fs = require('fs');
var async = require('async');
var dateUtil = require('_pr/lib/utils/dateUtil');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var instancesModel = require('_pr/model/classes/instance/instance');
var entityCosts = require('_pr/model/entity-costs');
var mongoDbClient = require('mongodb').MongoClient;

resourceService.getCostForResources = getCostForResources_deprecated;
resourceService.getTotalCost = getTotalCost_deprecated;
resourceService.getCostForServices = getCostForServices_deprecated;
resourceService.getEC2InstanceUsageMetrics=getEC2InstanceUsageMetrics;
resourceService.getS3BucketsMetrics=getS3BucketsMetrics;
resourceService.getBucketsInfo=getBucketsInfo;
resourceService.getResources=getResources;
resourceService.getRDSInstancesInfo=getRDSInstancesInfo;
resourceService.getRDSDBInstanceMetrics=getRDSDBInstanceMetrics;
resourceService.bulkUpdateResourceProviderTags=bulkUpdateResourceProviderTags;
resourceService.bulkUpdateUnassignedResourceTags=bulkUpdateUnassignedResourceTags;
resourceService.bulkUpdateAWSResourcesTags=bulkUpdateAWSResourcesTags;
resourceService.getEC2InstancesInfo=getEC2InstancesInfo;
resourceService.getAllResourcesForProvider =  getAllResourcesForProvider;
resourceService.updateAWSResourceCostsFromCSV = updateAWSResourceCostsFromCSV
resourceService.aggregateEntityCosts = aggregateEntityCosts

// @TODO To be cached if needed. In memory data will not exceed 200MB for upto 2000 instances.
function getAllResourcesForProvider(provider, next) {
    async.parallel([
            function(callback) {
                instancesModel.getInstanceByProviderId(provider._id, callback);
            },
            function(callback) {
                //@TODO Duplicate function of  getByProviderId, to be cleaned up
                unManagedInstancesModel.getInstanceByProviderId(provider._id, callback);
            },
            function(callback) {
                unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id, callback);
            }
            /*function(callback) {
                resources.getResourcesByProviderId(provider._id, callback);
            }*/
        ],
        function(err, results) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                var resultsArray = [].concat.apply([], results);
                var resultsObject = resultsArray.reduce(function(temp, current) {
                    if('platformId' in current) {
                        temp[current.platformId] = current;
                    }
                    return temp;
                }, {})

                next(null, resultsObject);
            }
        }
    );
}

function updateAWSResourceCostsFromCSV(provider, resources, downlaodedCSVPath, updateTime, callback) {
    var awsBillIndexes = appConfig.aws.billIndexes
    var awsServices = appConfig.aws.services
    var awsZones = appConfig.aws.zones

    var stream = fs.createReadStream(downlaodedCSVPath);
    csv.fromStream(stream, {headers: false}).on('data', function(data) {
        if(data[awsBillIndexes.totalCost] != 'StatementTotal'
            && data[awsBillIndexes.totalCost] != 'InvoiceTotal'
            && data[awsBillIndexes.totalCost] != 'Rounding'
            && ((provider.lastUpdateTime == null)
                || (Date.parse(data[awsBillIndexes.endDate]) > provider.lastUpdateTime))) {
            var resourceCostEntry = {platformDetails: {}}

            resourceCostEntry.organizationId = provider.orgId
            resourceCostEntry.providerId = provider._id
            resourceCostEntry.providerType = provider.providerType
            resourceCostEntry.cost = data[awsBillIndexes.cost]
            resourceCostEntry.startTime = Date.parse(data[awsBillIndexes.startDate])
            resourceCostEntry.endTime = Date.parse(data[awsBillIndexes.endDate])
            resourceCostEntry.lastUpdateTime = Date.parse(updateTime)
            resourceCostEntry.interval = 3600
            resourceCostEntry.platformDetails.serviceName = data[awsBillIndexes.prod]

            if (data[awsBillIndexes.prod] in awsServices) {
                resourceCostEntry.platformDetails.serviceId = awsServices[data[awsBillIndexes.prod]]
            }

            resourceCostEntry.platformDetails.zone = (data[awsBillIndexes.zone] == null)
                ? 'Unknown' : data[awsBillIndexes.zone]

            resourceCostEntry.platformDetails.region = (data[awsBillIndexes.zone] in awsZones)
                ? awsZones[data[awsBillIndexes.zone]] : 'Unknown'

            if (data[awsBillIndexes.instanceId] != null) {
                resourceCostEntry.platformDetails.instanceId = data[awsBillIndexes.instanceId]
            }

            if(data[awsBillIndexes.usageType] != null) {
                resourceCostEntry.platformDetails.usageType = data[awsBillIndexes.usageType]
            }

            if (data[awsBillIndexes.instanceId] in resources) {
                var resource = resources[data[awsBillIndexes.instanceId]]

                resourceCostEntry.resourceId = resource._id

                if ('bgId' in resource) {
                    resourceCostEntry.businessGroupId = resource['bgId']
                }

                if ('projectId' in resource) {
                    resourceCostEntry.projectId = resource['projectId']
                }

                if ('environmentId' in resource) {
                    resourceCostEntry.environmentId = resource['environmentId']
                }

                if ('masterDetails.bgId' in resource) {
                    resourceCostEntry.businessGroupId = resource['bgId']
                }

                if ('masterDetails.projectId' in resource) {
                    resourceCostEntry.projectId = resource['projectId']
                }

                if ('masterDetails.environmentId' in resource) {
                    resourceCostEntry.environmentId = resource['environmentId']
                }

                resourceCost.saveResourceCost(resourceCostEntry, function (err, costEntry) {
                    if (err) {
                        logger.error(err)
                        return callback(new Error('Database Error'))
                    }
                })
            }
        }
    }).on('end', function() {
        callback(null)
    })
}

// NOTE: Only monthly costs aggregated.
function aggregateEntityCosts(parentEntity, parentEntityId, parentEntityQuery, endTime, period, callback) {
    var mongoConnectionString = 'mongodb://' + appConfig.db.host + ':' + appConfig.db.port + '/' + appConfig.db.dbName
    var catalystEntityHierarchy = appConfig.catalystEntityHierarchy

    var startTime
    switch (period) {
        case 'month':
            startTime = dateUtil.getStartOfAMonthInUTC(endTime)
            break
    }

    mongoDbClient.connect(mongoConnectionString, function(err, db) {
        if(err) {
            return callback(err)
        }

        async.forEach(catalystEntityHierarchy[parentEntity].children, function (childEntity, next) {
            //@TODO Consider replacing with Mongo aggregate $sum
            var map = function() {
                emit(this.childEntityKey, {cost: this.cost})
            }

            var reduce = function (key, values) {
                var reducedObject = { cost: 0 }

                values.forEach(function(value) {
                    reducedObject.cost += value.cost
                })

                return reducedObject
            }

            var query = parentEntityQuery
            query.startTime = {$gte: Date.parse(startTime)}
            query.endTime = {$lte: Date.parse(endTime)}

            var command = {
                mapreduce: 'resourcecosts',
                map: map.toString().replace(/childEntityKey/, catalystEntityHierarchy[childEntity].key),
                reduce: reduce.toString(),
                // finalize: finalize.toString(),
                query: query,
                out: {inline: 1}
            }

            db.command(command, function (err, result) {
                if(err) {
                    logger.error(err)
                    next(err)
                } else if(result.ok == 1){
                    //@TODO To be handled outside
                    async.forEach(result.results, function(entry, next) {
                        var entityCost = {
                            entity: {
                                id: entry._id,
                                type: childEntity
                            },
                            parentEntity: {
                                id: parentEntityId,
                                type: parentEntity
                            },
                            costs: {
                                totalCost: entry.value.cost
                            },
                            startTime: Date.parse(startTime),
                            endTime: Date.parse(endTime),
                            period: period
                        }

                        entityCosts.saveEntityCost(entityCost, next)
                    },
                    function(err) {
                        if(err) {
                            return next(err)
                        }

                        return next()
                    })
                }
            })
        }, function (err) {
            if(err) {
                callback(err)
            } else {
                callback()
            }
        })
    })
}

function getCostForResources_deprecated(updatedTime,provider,bucketNames,instanceIds,dbInstanceNames,fileName, callback) {
    var temp = String(updatedTime).split(',');
    var ec2Cost = 0, totalCost = 0, rdCost = 0, rstCost = 0, elcCost = 0, cdfCost = 0, r53Cost = 0, s3Cost = 0 , vpcCost = 0;
    var regionOne = 0, regionTwo = 0, regionThree = 0, regionFour = 0, regionFive = 0, regionSix = 0, regionSeven = 0, regionEight = 0, regionNine = 0, regionTen = 0, catTagCost = 0, jjTagCost = 0, accentureTagCost=0;
    var stream = fs.createReadStream(fileName);
    var costIndex = 18,zoneIndex = 11,usageIndex= 9,prodIndex=5,tagIndex =22,totalCostIndex=3;
    var instanceCostMetrics = [],bucketCostMetrics=[],dbInstanceCostMetrics=[];
    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 1000*60*60*24);
    csv.fromStream(stream, {headers : false}).on("data", function(data){
        if(data[totalCostIndex] === 'StatementTotal'){
            totalCost = Number(data[costIndex]);
        }
        if(data[prodIndex] === "Amazon Elastic Compute Cloud")
        {
            ec2Cost += Number(data[costIndex]);
            if (instanceIds.indexOf(data[21]) >=0) {
                var instanceCostMetricsObj = {};
                instanceCostMetricsObj['usageCost'] = Number(data[costIndex]);
                instanceCostMetricsObj['resourceId'] = data[21];
                instanceCostMetrics.push(instanceCostMetricsObj);
                instanceCostMetricsObj = {};
            }
            /*Virginia*/
            if(data[zoneIndex] === "us-east-1a" || data[zoneIndex] === "us-east-1b" || data[zoneIndex] === "us-east-1c" || data[zoneIndex] === "us-east-1d" || data[zoneIndex] == "us-east-1e" || data[usageIndex] == "EBS:VolumeUsage" || data[usageIndex] == "EBS:VolumeUsage.gp2" || data[usageIndex] == "EBS:SnapshotUsage" || data[usageIndex] == "EBS:SnapshotUsag.gp2" || data[usageIndex] == "LoadBalancerUsage" || data[usageIndex] == "DataTransfer-Out-Bytes" || data[usageIndex] == "DataTransfer-In-Bytes" || data[usageIndex] == "ElasticIP:IdleAddress") {
                regionOne += Number(data[costIndex]);
            }/*California*/else if(data[zoneIndex] == "us-west-1a" || data[zoneIndex] == "us-west-1b" || data[zoneIndex] == "us-west-1c" || data[zoneIndex] == "us-west-1d" || data[zoneIndex] == "us-west-1e" || data[usageIndex] == "USW1-EBS:VolumeUsage" || data[usageIndex] == "USW1-EBS:VolumeUsage.gp2" || data[usageIndex] == "USW1-EBS:SnapshotUsage" || data[usageIndex] == "USW1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "USW1-LoadBalancerUsage" || data[usageIndex] == "USW1-DataTransfer-Out-Bytes" || data[usageIndex] == "USW1-DataTransfer-In-Bytes" || data[usageIndex] == "USW1-ElasticIP:IdleAddress") {
                regionTwo += Number(data[costIndex]);
            }/*Oregon*/else if(data[zoneIndex] == "us-west-2a" || data[zoneIndex] == "us-west-2b" || data[zoneIndex] == "us-west-2c" || data[zoneIndex] == "us-west-2d" || data[zoneIndex] == "us-west-2e" || data[usageIndex] == "USW2-EBS:VolumeUsage" || data[usageIndex] == "USW2-EBS:VolumeUsage.gp2" || data[usageIndex] == "USW2-EBS:SnapshotUsage" || data[usageIndex] == "USW2-EBS:SnapshotUsag.gp2" || data[usageIndex] == "USW2-LoadBalancerUsage" || data[usageIndex] == "USW2-DataTransfer-Out-Bytes" || data[usageIndex] == "USW2-DataTransfer-In-Bytes" || data[usageIndex] == "USW2-ElasticIP:IdleAddress") {
                regionThree += Number(data[costIndex]);
            }/*Ireland*/else if(data[zoneIndex] == "eu-west-1a" || data[zoneIndex] == "eu-west-1b" || data[zoneIndex] == "eu-west-1c" ||data[zoneIndex] == "eu-west-1d" || data[zoneIndex] == "eu-west-1e" || data[usageIndex] == "EUW1-EBS:VolumeUsage" || data[usageIndex] == "EUW1-EBS:VolumeUsage.gp2" || data[usageIndex] == "EUW1-EBS:SnapshotUsage" || data[usageIndex] == "EUW1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "EUW1-LoadBalancerUsage" || data[usageIndex] == "EUW1-DataTransfer-Out-Bytes" || data[usageIndex] == "EUW1-DataTransfer-In-Bytes" || data[usageIndex] == "EUW1-ElasticIP:IdleAddress") {
                regionFour += Number(data[costIndex]);
            }/*Frankfurt*/else if(data[zoneIndex] == "eu-central-1a" || data[zoneIndex] == "eu-central-1b" || data[zoneIndex] == "eu-central-1c" || data[zoneIndex] == "eu-central-1d" || data[zoneIndex] == "eu-central-1e" || data[usageIndex] == "EUC1-EBS:VolumeUsage" || data[usageIndex] == "EUC1-EBS:VolumeUsage.gp2" || data[usageIndex] == "EUC1-EBS:SnapshotUsage" || data[usageIndex] == "EUC1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "EUC1-LoadBalancerUsage" || data[usageIndex] == "EUC1-DataTransfer-Out-Bytes" || data[usageIndex] == "EUC1-DataTransfer-In-Bytes" || data[usageIndex] == "EUC1-ElasticIP:IdleAddress") {
                regionFive += Number(data[costIndex]);
            }/*Tokyo*/else if(data[zoneIndex] == "ap-northeast-1a" || data[zoneIndex] == "ap-northeast-1b" || data[zoneIndex] == "ap-northeast-1c" || data[zoneIndex] == "ap-northeast-1d" || data[zoneIndex] == "ap-northeast-1e" || data[usageIndex] == "APN1-EBS:VolumeUsage" || data[usageIndex] == "APN1-EBS:VolumeUsage.gp2" || data[usageIndex] == "APN1-EBS:SnapshotUsage" || data[usageIndex] == "APN1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "APN1-LoadBalancerUsage" || data[usageIndex] == "APN1-DataTransfer-Out-Bytes" || data[usageIndex] == "APN1-DataTransfer-In-Bytes" || data[usageIndex] == "APN1-ElasticIP:IdleAddress") {
                regionSix += Number(data[costIndex]);
            }/*Seoul*/ else if(data[zoneIndex] == "ap-northeast-2a" || data[zoneIndex] == "ap-northeast-2b" || data[zoneIndex] == "ap-northeast-2c" || data[zoneIndex] == "ap-northeast-2d" || data[zoneIndex] == "ap-northeast-2e" || data[usageIndex] == "APN2-EBS:VolumeUsage" || data[usageIndex] == "APN2-EBS:VolumeUsage.gp2" || data[usageIndex] == "APN2-EBS:SnapshotUsage" || data[usageIndex] == "APN2-EBS:SnapshotUsag.gp2" || data[usageIndex] == "APN2-LoadBalancerUsage" || data[usageIndex] == "APN2-DataTransfer-Out-Bytes" || data[usageIndex] == "APN2-DataTransfer-In-Bytes" || data[usageIndex] == "APN2-ElasticIP:IdleAddress") {
                regionSeven += Number(data[costIndex]);
            }/*Singapore*/else if(data[zoneIndex] == "ap-southeast-1a" || data[zoneIndex] == "ap-southeast-1b" || data[zoneIndex] == "ap-southeast-1c" || data[zoneIndex] == "ap-southeast-1d" || data[zoneIndex] == "ap-southeast-1e" || data[usageIndex] == "APS1-EBS:VolumeUsage" || data[usageIndex] == "APS1-EBS:VolumeUsage.gp2" || data[usageIndex] == "APS1-EBS:SnapshotUsage" || data[usageIndex] == "APS1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "APS1-LoadBalancerUsage" || data[usageIndex] == "APS1-DataTransfer-Out-Bytes" || data[usageIndex] == "APS1-DataTransfer-In-Bytes" || data[usageIndex] == "APS1-ElasticIP:IdleAddress") {
                regionEight += Number(data[costIndex]);
            }/*Sydney*/else if(data[zoneIndex] == "ap-southeast-2a" || data[zoneIndex] == "ap-southeast-2b" || data[zoneIndex] == "ap-southeast-2c" || data[zoneIndex] == "ap-southeast-2d" || data[zoneIndex] == "ap-southeast-2e" || data[usageIndex] == "APN2-EBS:VolumeUsage" || data[usageIndex] == "APN2-EBS:VolumeUsage.gp2" || data[usageIndex] == "APN2-EBS:SnapshotUsage" || data[usageIndex] == "APN2-EBS:SnapshotUsag.gp2" || data[usageIndex] == "APN2-LoadBalancerUsage" || data[usageIndex] == "APN2-DataTransfer-Out-Bytes" || data[usageIndex] == "APN2-DataTransfer-In-Bytes" || data[usageIndex] == "APN2-ElasticIP:IdleAddress") {
                regionNine += Number(data[costIndex]);
            }/*São Paulo*/else if(data[zoneIndex] == "sa-east-1a" || data[zoneIndex] == "sa-east-1b" || data[zoneIndex] == "sa-east-1c" || data[zoneIndex] == "sa-east-1d" || data[zoneIndex] == "sa-east-1e" || data[usageIndex] == "SAE1-EBS:VolumeUsage" || data[usageIndex] == "SAE1-EBS:VolumeUsage.gp2" || data[usageIndex] == "SAE1-EBS:SnapshotUsage" || data[usageIndex] == "SAE1-EBS:SnapshotUsag.gp2" || data[usageIndex] == "SAE1-LoadBalancerUsage" || data[usageIndex] == "SAE1-DataTransfer-Out-Bytes" || data[usageIndex] == "SAE1-DataTransfer-In-Bytes" || data[usageIndex] == "SAE1-ElasticIP:IdleAddress") {
                regionTen += Number(data[costIndex]);
            }
        }else if(data[prodIndex] === "Amazon RDS Service") {
            rdCost += Number(data[costIndex]);
            if (dbInstanceNames.indexOf(data[21]) >=0) {
                var dbInstanceCostMetricsObj = {};
                dbInstanceCostMetricsObj['usageCost'] = Number(data[costIndex]);
                dbInstanceCostMetricsObj['resourceId'] = data[21];
                dbInstanceCostMetrics.push(dbInstanceCostMetricsObj);
                dbInstanceCostMetricsObj = {};
            }
            /*Virginia*/
            if(data[zoneIndex] === "us-east-1") {
                regionOne += Number(data[costIndex]);
            }/*California*/else if(data[zoneIndex] == "us-west-1") {
                regionTwo += Number(data[costIndex]);
            }/*Oregon*/else if(data[zoneIndex] == "us-west-2") {
                regionThree += Number(data[costIndex]);
            }/*Ireland*/else if(data[zoneIndex] == "eu-west-1") {
                regionFour += Number(data[costIndex]);
            }/*Frankfurt*/else if(data[zoneIndex] == "eu-central-1") {
                regionFive += Number(data[costIndex]);
            }/*Tokyo*/ else if(data[zoneIndex] == "ap-northeast-1") {
                regionSix += Number(data[costIndex]);
            }/*Seoul*/ else if(data[zoneIndex] == "ap-northeast-2") {
                regionSeven += Number(data[costIndex]);
            }/*Singapore*/ else if(data[zoneIndex] == "ap-southeast-1") {
                regionEight += Number(data[costIndex]);
            }/*Sydney*/else if(data[zoneIndex] == "ap-southeast-2") {
                regionNine += Number(data[costIndex]);
            }/*São Paulo*/else if(data[zoneIndex] == "sa-east-1") {
                regionTen += Number(data[costIndex]);
            }
        }else if(data[prodIndex] === "Amazon Redshift") {
            rstCost += Number(data[costIndex]);
            /*Virginia*/
            if(data[zoneIndex] == "us-east-1") {
                regionOne += Number(data[costIndex]);
            }/*California*/else if(data[zoneIndex] == "us-west-1") {
                regionTwo += Number(data[costIndex]);
            }/*Oregon*/else if(data[zoneIndex] == "us-west-2") {
                regionThree += Number(data[costIndex]);
            }/*Ireland*/else if(data[zoneIndex] == "eu-west-1") {
                regionFour += Number(data[costIndex]);
            }/*Frankfurt*/else if(data[zoneIndex] == "eu-central-1") {
                regionFive += Number(data[costIndex]);
            }/*Tokyo*/ else if(data[zoneIndex] == "ap-northeast-1") {
                regionSix += Number(data[costIndex]);
            }/*Seoul*/ else if(data[zoneIndex] == "ap-northeast-2") {
                regionSeven += Number(data[costIndex]);
            }/*Singapore*/ else if(data[zoneIndex] == "ap-southeast-1") {
                regionEight += Number(data[costIndex]);
            }/*Sydney*/else if(data[zoneIndex] == "ap-southeast-2") {
                regionNine += Number(data[costIndex]);
            }/*São Paulo*/else if(data[zoneIndex] == "sa-east-1") {
                regionTen += Number(data[costIndex]);
            }
        }else if(data[prodIndex] === "Amazon ElastiCache") {
            elcCost += Number(data[costIndex]);
            /*Virginia*/
            if(data[zoneIndex] == "us-east-1") {
                regionOne += Number(data[costIndex]);
            }/*California*/else if(data[zoneIndex] == "us-west-1") {
                regionTwo += Number(data[costIndex]);
            }/*Oregon*/else if(data[zoneIndex] == "us-west-2") {
                regionThree += Number(data[costIndex]);
            }/*Ireland*/else if(data[zoneIndex] == "eu-west-1") {
                regionFour += Number(data[costIndex]);
            }/*Frankfurt*/else if(data[zoneIndex] == "eu-central-1") {
                regionFive += Number(data[costIndex]);
            }/*Tokyo*/ else if(data[zoneIndex] == "ap-northeast-1") {
                regionSix += Number(data[costIndex]);
            }/*Seoul*/ else if(data[zoneIndex] == "ap-northeast-2") {
                regionSeven += Number(data[costIndex]);
            }/*Singapore*/ else if(data[zoneIndex] == "ap-southeast-1") {
                regionEight += Number(data[costIndex]);
            }/*Sydney*/else if(data[zoneIndex] == "ap-southeast-2") {
                regionNine += Number(data[costIndex]);
            }/*São Paulo*/else if(data[zoneIndex] == "sa-east-1") {
                regionTen += Number(data[costIndex]);
            }
        }else if(data[prodIndex] === "Amazon CloudFront") {
            cdfCost += Number(data[costIndex]);
        }else if(data[prodIndex] === "Amazon Route 53") {
            r53Cost += Number(data[costIndex]);
        }else if(data[prodIndex] === "Amazon Simple Storage Service") {
            s3Cost += Number(data[costIndex]);
            if (bucketNames.indexOf(data[21]) >=0) {
                var bucketCostMetricsObj = {};
                bucketCostMetricsObj['usageCost'] = Number(data[costIndex]);
                bucketCostMetricsObj['resourceId'] = data[21];
                bucketCostMetrics.push(bucketCostMetricsObj);
                bucketCostMetricsObj = {};
            }
        }else if(data[prodIndex] === "Amazon Virtual Private Cloud") {
            vpcCost += Number(data[costIndex]);
        }
        //Calculate Cost of Tags
        if(data[tagIndex] === "Catalyst"){
            catTagCost += Number(data[costIndex]);
        }else if(data[tagIndex] === "J&J") {
            jjTagCost += Number(data[costIndex]);
        }else if(data[tagIndex] === "Accenture") {
            accentureTagCost += Number(data[costIndex]);
        }
    }).on("end", function(){
        var awsResourceCostObject = {
            organisationId: provider.orgId,
            providerId: provider._id,
            providerType: provider.providerType,
            providerName: provider.providerName,
            resourceType: "csv",
            resourceId: "RLBilling",
            aggregateResourceCost:totalCost,
            costMetrics : {
                serviceCost: {
                    "ec2Cost": ec2Cost,
                    "rdCost": rdCost,
                    "rstCost": rstCost,
                    "elcCost": elcCost,
                    "cdfCost": cdfCost,
                    "r53Cost": r53Cost,
                    "s3Cost": s3Cost,
                    "vpcCost": vpcCost,
                    "otherService": (totalCost - ec2Cost - vpcCost - s3Cost - r53Cost - elcCost - cdfCost - rdCost - rstCost)
                },
                regionCost: {
                    "Virginia": regionOne,
                    "California": regionTwo,
                    "Oregon": regionThree,
                    "Ireland": regionFour,
                    "Frankfurt": regionFive,
                    "Tokyo": regionSix,
                    "Seoul": regionSeven,
                    "Singapore": regionEight,
                    "Sydney": regionNine,
                    "Paulo": regionTen,
                    "GlServices": (totalCost - regionOne - regionTwo - regionThree - regionFour - regionFive - regionSix - regionSeven - regionEight - regionNine - regionTen)
                },
                tagCost: {
                    "Catalyst": catTagCost,
                    "J&J": jjTagCost,
                    "Accenture":accentureTagCost
                },
                currency:'USD',
                symbol:"$"
            },
            updatedTime : updatedTime,
            startTime: Date.parse(startTime),
            endTime: Date.parse(endTime)
        };
        if(totalCost > 0) {
            resourceCost.saveResourceCost(awsResourceCostObject, function (err, resourceCostData) {
                if (err) {
                    callback(err, null);
                } else {
                    var resultCostMetrics={
                        instanceCostMetrics:instanceCostMetrics,
                        bucketCostMetrics:bucketCostMetrics,
                        dbInstanceCostMetrics:dbInstanceCostMetrics
                    };
                    callback(null, resultCostMetrics);
                }
            })
        }else{
            callback(null,[]);
        }
    });
};

function getTotalCost_deprecated(provider,callback)
{
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var cwConfig = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region:"us-east-1"
    };
    cw = new CW(cwConfig);
    var endDate= new Date();
    var startDate = new Date(endDate.getTime() - (1000*60*60*6));
    var startDateOne = new Date(endDate.getTime() - (1000*60*60*24));
    var startDateTwo = new Date(endDate.getTime() - (1000*60*60*24*2));
    var accDim = [ { Name: 'Currency', Value: 'USD'} ];
    var costOfMonth = 0, costOfDay = 0, costOfYesterday = 0, tempCost = 0;
    var resultCostObj={};
    cw.getTotalCost(startDate,endDate,'Maximum',accDim,function(err,cost)
    {
        if(err){
            callback(err,null);
        }
        costOfMonth = cost['Maximum'];
        /*For getting the cost of current day by subtracting the Maximum cost with Minimum of the day*/
        cw.getTotalCost(startDateOne,endDate,'Minimum',accDim,function(err,cost)
        {
            if(err){
                callback(err,null);
            }
            if(costOfMonth != 0) {
                costOfDay = costOfMonth - cost['Minimum'];
                tempCost = cost['Minimum'];
            } else {
                costOfDay = 0;
                tempCost = 0;
            }
            /*For getting the previous day cost using the above logic*/
            cw.getTotalCost(startDateTwo,startDateOne,'Minimum',accDim,function(err,cost){
                if(err){
                    callback(err,null);
                }
                if(tempCost >= 0 && tempCost >= cost['Minimum']) {
                    costOfYesterday =  tempCost - cost['Minimum'];
                    var awsResourceCostObject = {
                        organisationId: provider.orgId,
                        providerId: provider._id,
                        providerType: provider.providerType,
                        providerName: provider.providerName,
                        resourceType: "totalCost",
                        resourceId: "totalCost",
                        aggregateResourceCost:costOfMonth,
                        costMetrics : {
                            monthCost:costOfMonth,
                            dayCost:costOfDay,
                            yesterdayCost:costOfYesterday,
                            currency:'USD',
                            symbol:"$"
                        },
                        updatedTime : Date.parse(endDate),
                        startTime: Date.parse(endDate),
                        endTime: Date.parse(startDateOne),
                    };
                    resourceCost.saveResourceCost(awsResourceCostObject,function(err,resourceCostData){
                        if(err){
                            callback(err,null);
                        } else{
                            callback(null,resourceCostData);
                        }
                    })
                } else {
                    costOfYesterday = 0;
                    var awsResourceCostObject = {
                        organisationId: provider.orgId,
                        providerId: provider._id,
                        providerType: provider.providerType,
                        providerName: provider.providerName,
                        resourceType: "totalCost",
                        resourceId: "totalCost",
                        aggregateResourceCost:costOfMonth,
                        costMetrics : {
                            monthCost:costOfMonth,
                            dayCost:costOfDay,
                            yesterdayCost:costOfYesterday,
                            currency:'USD',
                            symbol:"$"
                        },
                        updatedTime : Date.parse(endDate),
                        startTime: Date.parse(endDate),
                        endTime: Date.parse(startDateOne),
                    };
                    resourceCost.saveResourceCost(awsResourceCostObject,function(err,resourceCostData){
                        if(err){
                            callback(err,null);
                        } else{
                            callback(null,resourceCostData);
                        }
                    })
                }
            });
        });
    });
}


function getCostForServices_deprecated(provider,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var cwConfig = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region:"us-east-1"
    };
    cw = new CW(cwConfig);
    var endDate= new Date();
    var startDate = new Date(endDate.getTime() - (1000*60*60*6));
    var startDateOne = new Date(endDate.getTime() - (1000*60*60*24));
    /*This the Dimension that is required to passed for different services*/
    var ec2Dim = [ { Name: 'ServiceName',Value: 'AmazonEC2'},{ Name: 'Currency', Value: 'USD'} ];
    var rdsDim = [ { Name: 'ServiceName',Value: 'AmazonRDS'},{ Name: 'Currency', Value: 'USD'} ];
    /*Getting the cost of EC2 & RDS for the current day*/
    async.parallel({
        ec2Cost:function(callback){
            var ec2Cost = 0;
            cw.getTotalCost(startDate,endDate,'Maximum',ec2Dim,function(err,presentEC2Cost) {
                if (err) {
                    callback(err, null);
                }
                cw.getTotalCost(startDateOne, endDate, 'Minimum', ec2Dim, function (err, yesterdayEC2Cost) {
                    if (err) {
                        callback(err, null);
                    }else if (typeof presentEC2Cost === "undefined" && typeof yesterdayEC2Cost === "undefined"){
                        callback(null,ec2Cost);
                    }else if(presentEC2Cost.Maximum && yesterdayEC2Cost.Minimum) {
                        ec2Cost = presentEC2Cost['Maximum'] - yesterdayEC2Cost['Minimum'];
                        callback(null, ec2Cost);
                    }else {
                        callback(null, ec2Cost);
                    }
                });
            });
        },
        rdsCost:function(callback){
            var rdsCost = 0;
            cw.getTotalCost(startDate,endDate,'Maximum',rdsDim,function(err,presentRDSCost) {
                if (err) {
                    callback(err, null);
                }
                cw.getTotalCost(startDateOne, endDate, 'Minimum', rdsDim, function (err, yesterdayRDSCost) {
                    if (err) {
                        callback(err, null);
                    }else if (typeof presentRDSCost === "undefined" && typeof yesterdayRDSCost === "undefined"){
                        callback(null,rdsCost);
                    }else if(presentRDSCost.Maximum && yesterdayRDSCost.Minimum) {
                        rdsCost = presentRDSCost['Maximum'] - yesterdayRDSCost['Minimum'];
                        callback(null, rdsCost);
                    }else {
                        callback(null, rdsCost);
                    }
                });
            });
        }

    },function(err,results){
        if(err){
            callback(err,null);
            return;
        }else {
            var awsResourceCostObject = {
                organisationId: provider.orgId,
                providerId: provider._id,
                providerType: provider.providerType,
                providerName: provider.providerName,
                resourceType: "serviceCost",
                resourceId: "serviceCost",
                aggregateResourceCost: results.ec2Cost + results.rdsCost,
                costMetrics: {
                    ec2Cost: results.ec2Cost,
                    rdsCost: results.rdsCost,
                    currency: 'USD',
                    symbol: "$"
                },
                updatedTime: Date.parse(endDate),
                startTime: Date.parse(endDate),
                endTime: Date.parse(startDateOne)
            };
            resourceCost.saveResourceCost(awsResourceCostObject, function (err, resourceCostData) {
                if (err) {
                    callback(err, null);
                    return;
                } else {
                    callback(null, resourceCostData);
                    return;
                }
            })
        }
    });
}

function getEC2InstanceUsageMetrics(provider, instances, startTime, endTime, period, callback) {
    var metricsUnits = appConfig.aws.cwMetricsUnits;
    var instanceUsageMetrics = [];
    var instnacesWithMetrics = instances.length;

    if(instances.length == 0)
        callback(null, instanceUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey
        };
    }

    /*var endTime = new Date();
     var startTime = new Date(endTime.getTime() - 1000*60*60*24);*/
    for(var i = 0; i < instances.length; i++) {
        (function(j) {
            if(('providerData' in instances[j]) && (typeof instances[j].providerData !== undefined)
                && instances[j].providerData) {
                amazonConfig.region = instances[j].providerData.region;
                cw = new CW(amazonConfig);

                async.parallel({
                        CPUUtilization: function (callback) {
                            cw.getUsageMetrics('CPUUtilization', metricsUnits.CPUUtilization,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        NetworkOut: function (callback) {
                            cw.getUsageMetrics('NetworkOut', metricsUnits.NetworkOut,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        NetworkIn: function (callback) {
                            cw.getUsageMetrics('NetworkIn', metricsUnits.NetworkIn,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        DiskReadBytes: function (callback) {
                            cw.getUsageMetrics('DiskReadBytes', metricsUnits.DiskReadBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        DiskWriteBytes: function (callback) {
                            cw.getUsageMetrics('DiskWriteBytes', metricsUnits.DiskWriteBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        }
                    },
                    function (err, results) {
                        if(err) {
                            logger.error(err)
                        } else {
                            /* TODO: To split up into different entries.*/
                            /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                            /* Currently modifying the start time and end time with the period.
                             * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                             * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                             * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                             * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                             */
                            var dbEndTime = startTime;
                            var dbStartTime = getStartTime(dbEndTime, period);

                            instanceUsageMetrics.push({
                                providerId: provider._id,
                                providerType: provider.providerType,
                                orgId: provider.orgId[0],
                                projectId: instances[j].projectId,
                                resourceId: instances[j]._id,
                                platform: 'AWS',
                                platformId: instances[j].platformId,
                                resourceType: 'EC2',
                                startTime: dbStartTime,
                                endTime: dbEndTime,
                                interval: period,
                                metrics: results
                            });
                        }

                        if(instanceUsageMetrics.length == instnacesWithMetrics) {
                            callback(null, instanceUsageMetrics);
                        }
                    });
            } else {
                instnacesWithMetrics -= 1;

                if(instanceUsageMetrics.length == instnacesWithMetrics)
                    callback(null, instanceUsageMetrics);
            }
        })(i);
    }
};

function getS3BucketsMetrics(provider, buckets, startTime, endTime, period, callback) {
    var bucketUsageMetrics = [];
    var bucketWithMetrics = buckets.length;
    if(bucketWithMetrics == 0)
        callback(null, bucketUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey,
            "region":"us-east-1"
        };
    }
    /*var endTime= new Date();
     var startTime = new Date(endTime.getTime() - (1000*60*60*24));*/
    for(var i = 0; i < buckets.length; i++) {
        (function(bucket) {
            cw = new CW(amazonConfig);
            async.parallel({
                    BucketSizeBytes: function (callback) {
                        cw.getUsageMetrics('BucketSizeBytes','Bytes','AWS/S3',
                            [{Name:'BucketName',Value:bucket.resourceDetails.bucketName},
                                {Name:'StorageType',Value:'StandardStorage'}],startTime, endTime, period, callback);
                    },
                    NumberOfObjects: function (callback) {
                        cw.getUsageMetrics('NumberOfObjects','Count','AWS/S3',[{Name:'BucketName',
                            Value:bucket.resourceDetails.bucketName},{Name:'StorageType',Value:'AllStorageTypes'}],
                            startTime, endTime, period, callback);
                    }
                },
                function (err, results) {
                    if(err) {
                        logger.error(err)
                    } else {
                        /* TODO: To split up into different entries.*/
                        /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                        /* Currently modifying the start time and end time with the period.
                         * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                         * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                         * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                         * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                         */
                        var dbEndTime = startTime;
                        var dbStartTime = getStartTime(dbEndTime, period);

                        bucketUsageMetrics.push({
                            providerId: provider._id,
                            providerType: provider.providerType,
                            orgId: provider.orgId[0],
                            resourceId: bucket._id,
                            platform: 'AWS',
                            platformId: bucket.resourceDetails.bucketName,
                            resourceType: 'S3',
                            startTime: dbStartTime,
                            endTime: dbEndTime,
                            interval: period,
                            metrics: results
                        });
                    }
                    if(bucketUsageMetrics.length == bucketWithMetrics) {
                        callback(null, bucketUsageMetrics);
                    }
                });
        })(buckets[i]);
    }
};

function getRDSDBInstanceMetrics(provider, dbInstances, startTime, endTime, period, callback) {
    var rdsUsageMetrics = [];
    var rdsWithMetrics = dbInstances.length;
    if(rdsWithMetrics == 0)
        callback(null, rdsUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey,
            "region":"us-east-1"
        };
    }
    /*var endTime= new Date();
     var startTime = new Date(endTime.getTime() - (1000*60*60*24));*/
    for(var i = 0; i < dbInstances.length; i++) {
        (function(rds) {
            cw = new CW(amazonConfig);
            async.parallel({
                    CPUUtilization: function (callback) {
                        cw.getUsageMetrics('CPUUtilization','Percent','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    BinLogDiskUsage: function (callback) {
                        cw.getUsageMetrics('BinLogDiskUsage','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    CPUCreditUsage: function (callback) {
                        cw.getUsageMetrics('CPUCreditUsage','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    CPUCreditBalance: function (callback) {
                        cw.getUsageMetrics('CPUCreditBalance','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    DatabaseConnections: function (callback) {
                        cw.getUsageMetrics('DatabaseConnections','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    DiskQueueDepth: function (callback) {
                        cw.getUsageMetrics('DiskQueueDepth','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    FreeableMemory: function (callback) {
                        cw.getUsageMetrics('FreeableMemory','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    FreeStorageSpace: function (callback) {
                        cw.getUsageMetrics('FreeStorageSpace','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    ReplicaLag: function (callback) {
                        cw.getUsageMetrics('ReplicaLag','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    SwapUsage: function (callback) {
                        cw.getUsageMetrics('SwapUsage','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    ReadIOPS: function (callback) {
                        cw.getUsageMetrics('ReadIOPS','Count/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    WriteIOPS: function (callback) {
                        cw.getUsageMetrics('WriteIOPS','Count/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    ReadLatency: function (callback) {
                        cw.getUsageMetrics('ReadLatency','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    WriteLatency: function (callback) {
                        cw.getUsageMetrics('WriteLatency','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    ReadThroughput: function (callback) {
                        cw.getUsageMetrics('ReadThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    WriteThroughput: function (callback) {
                        cw.getUsageMetrics('WriteThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    NetworkReceiveThroughput: function (callback) {
                        cw.getUsageMetrics('NetworkReceiveThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    },
                    NetworkTransmitThroughput: function (callback) {
                        cw.getUsageMetrics('NetworkTransmitThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbName}],startTime, endTime, period, callback);
                    }
                },
                function (err, results) {
                    if(err) {
                        logger.error(err)
                    } else {

                        /* TODO: To split up into different entries.*/
                        /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                        /* Currently modifying the start time and end time with the period.
                         * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                         * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                         * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                         * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                         */
                        var dbEndTime = startTime;
                        var dbStartTime = getStartTime(dbEndTime, period);

                        rdsUsageMetrics.push({
                            providerId: provider._id,
                            providerType: provider.providerType,
                            orgId: provider.orgId[0],
                            resourceId: rds._id,
                            platform: 'AWS',
                            platformId: rds.resourceDetails.dbName,
                            resourceType: 'RDS',
                            startTime: dbStartTime,
                            endTime: dbEndTime,
                            interval: period,
                            metrics: results
                        });
                    }
                    if(rdsUsageMetrics.length == rdsWithMetrics) {
                        callback(null, rdsUsageMetrics);
                    }
                });
        })(dbInstances[i]);
    }
};

function getBucketsInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var s3Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region: "us-east-1"
    };
    var s3 = new S3(s3Config);
    s3.getBucketList(function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
        }else{
            var results=[];
            if(data.Buckets.length === 0){
                callback(null,results);
            }else{
                for(var i = 0; i < data.Buckets.length; i++){
                    (function(bucket) {
                        var bucketObj = {
                            masterDetails:{
                                orgId:provider.orgId[0],
                                orgName:orgName
                            },
                            providerDetails:{
                                id: provider._id,
                                type: provider.providerType,
                            },
                            resourceType:"S3",
                            category:"unassigned",
                            resourceDetails:{
                                bucketName: bucket.Name,
                                bucketCreatedOn: Date.parse(bucket.CreationDate),
                                bucketOwnerName: data.Owner.DisplayName,
                                bucketOwnerID: data.Owner.ID,
                                bucketSize:0,
                                bucketSizeUnit:'MegaBytes'
                            }
                        };
                        s3.getBucketSize(bucket.Name, function (err, bucketSize) {
                            if (err) {
                                logger.error(err);
                                callback(err, null);
                            } else {
                                bucketObj.resourceDetails.bucketSize = Math.round(bucketSize);
                                s3.getBucketTag(bucket.Name, function(err,bucketTag){
                                    if (err) {
                                        logger.error(err);
                                        callback(err, null);
                                    } else {
                                        bucketObj.tags = bucketTag;
                                        bucketObj.projectTag = bucketTag['Owner'];
                                        bucketObj.environmentTag = bucketTag['Environment'];
                                        results.push(bucketObj);
                                        bucketObj={};
                                        if (results.length === data.Buckets.length) {
                                            callback(null, results);
                                        }
                                    }
                                })
                            }
                        })
                    })(data.Buckets[i]);
                }
            }
        }
    })
};

function getEC2InstancesInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var ec2Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey
    };
    var regionCount = 0;
    var regions = appConfig.aws.regions;
    var awsInstanceList=[];
    for (var i = 0; i < regions.length; i++) {
        (function (region) {
            ec2Config.region = region.region;
            var ec2 = new EC2(ec2Config);
            ec2.describeInstances(null, function(err, awsRes) {
                if (err) {
                    logger.error("Unable to fetch instances from aws", err);
                    return;
                }
                var reservations = awsRes.Reservations;
                if(reservations.length >0) {
                    regionCount++;
                    for (var j = 0; j < reservations.length; j++) {
                        if (reservations[j].Instances && reservations[j].Instances.length) {
                            var awsInstances = reservations[j].Instances;
                            for (var k = 0; k < awsInstances.length; k++) {
                                (function (instance) {
                                    var tags = instance.Tags;
                                    var tagInfo = {};
                                    for (var l = 0; l < tags.length; l++) {
                                        var jsonData = tags[l];
                                        tagInfo[jsonData.Key] = jsonData.Value;
                                    }
                                    var instanceObj = {
                                        orgId: provider.orgId[0],
                                        orgName:orgName,
                                        providerId: provider._id,
                                        providerType: 'aws',
                                        providerData: region,
                                        platformId: instance.InstanceId,
                                        ip: instance.PublicIpAddress || null,
                                        os: (instance.Platform && instance.Platform === 'windows') ? 'windows' : 'linux',
                                        state: instance.State.Name,
                                        subnetId: instance.SubnetId,
                                        vpcId: instance.VpcId,
                                        privateIpAddress: instance.PrivateIpAddress,
                                        tags:tagInfo,
                                        environmentTag:tagInfo.Environment,
                                        projectTag:tagInfo.Owner
                                    }
                                    awsInstanceList.push(instanceObj);
                                    instanceObj = {};
                                })(awsInstances[k]);
                            }
                        }
                    }
                }else{
                    regionCount++;
                }
                if (regionCount === regions.length) {
                    callback(null, awsInstanceList);
                }
            });
        })(regions[i]);
    }
};

function getRDSInstancesInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var s3Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region: "us-west-1"
    };
    var rds = new RDS(s3Config);
    rds.getRDSDBInstances(function(err,dbInstances){
        if(err){
            logger.error(err);
            callback(err,null);
        }else{
            var results=[];
            if(dbInstances.length === 0){
                callback(null,results);
            }else{
                var sysDate=new Date();
                for(var i = 0; i < dbInstances.length; i++){
                    (function(dbInstance) {
                        var rdsDbInstanceObj = {
                            masterDetails:{
                                orgId:provider.orgId[0],
                                orgName:orgName
                            },
                            providerDetails:{
                                id: provider._id,
                                type: provider.providerType
                            },
                            resourceType:"RDS",
                            category:"unassigned",
                            isDeleted:false,
                            resourceDetails: {
                                dbName: dbInstance.DBName,
                                dbInstanceClass: dbInstance.DBInstanceClass,
                                dbEngine: dbInstance.Engine,
                                dbInstanceStatus: dbInstance.DBInstanceStatus,
                                dbMasterUserName: dbInstance.MasterUsername,
                                dbEndpoint: dbInstance.Endpoint,
                                dbAllocatedStorage: dbInstance.AllocatedStorage,
                                dbInstanceCreatedOn: dbInstance.InstanceCreateTime ? Date.parse(dbInstance.InstanceCreateTime) : Date.parse(sysDate),
                                preferredBackupWindow: dbInstance.PreferredBackupWindow,
                                backupRetentionPeriod: dbInstance.BackupRetentionPeriod,
                                vpcSecurityGroups: dbInstance.VpcSecurityGroups,
                                dbParameterGroups: dbInstance.DBParameterGroups,
                                preferredMaintenanceWindow: dbInstance.PreferredMaintenanceWindow,
                                region: dbInstance.AvailabilityZone,
                                dbSubnetGroup: dbInstance.DBSubnetGroup,
                                latestRestorableTime: dbInstance.LatestRestorableTime ? Date.parse(dbInstance.LatestRestorableTime) : Date.parse(sysDate),
                                multiAZ: dbInstance.MultiAZ,
                                engineVersion: dbInstance.EngineVersion,
                                autoMinorVersionUpgrade: dbInstance.AutoMinorVersionUpgrade,
                                licenseModel: dbInstance.LicenseModel,
                                optionGroupMemberships: dbInstance.OptionGroupMemberships,
                                publiclyAccessible: dbInstance.PubliclyAccessible,
                                storageType: dbInstance.StorageType,
                                storageEncrypted: dbInstance.StorageEncrypted,
                                dbiResourceId: dbInstance.DbiResourceId,
                                accountNumber: 549974527830,
                                caCertificateIdentifier: dbInstance.CACertificateIdentifier
                            }
                        };
                        var params ={
                            ResourceName:'arn:aws:rds:us-west-1:'+appConfig.aws.s3AccountNumber+':db:'+dbInstance.DBName
                        };
                        rds.getRDSDBInstanceTag(params,function(err,rdsTags){
                            if(err){
                                logger.error(err);
                                callback(err,null);
                            }else{
                                rdsDbInstanceObj.tags = rdsTags;
                                rdsDbInstanceObj.projectTag = rdsTags['Owner'];
                                rdsDbInstanceObj.environmentTag = rdsTags['Environment'];
                                results.push(rdsDbInstanceObj);
                                rdsDbInstanceObj={};
                                if(dbInstances.length === results.length){
                                    callback(null,results);
                                }
                            }
                        })

                    })(dbInstances[i]);
                }
            }
        }
    })
};

function getResources(query, next) {
    async.parallel([
            function (callback) {
                resources.getResources(query, callback);
            }
        ],
        function(err, results) {
            if(err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                next(null, results);
            }
        }
    );
}

function bulkUpdateResourceProviderTags(provider, bulkResources, callback){
    var providerTypes = appConfig.providerTypes;
    if (bulkResources.length > 10) {
        var err = new Error("Invalid request");
        err.status = 400;
        return callback(err);
    } else {
        var unassignedResources = [];
        for (var i = 0; i < bulkResources.length; i++) {
            (function(j) {
                resources.getResourceById(bulkResources[j].id, function(err, unassignedResource) {
                    if (err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (unassignedResource.length === 0) {
                        var err = new Error('Resource not found');
                        err.status = 404;
                        return callback(err);
                    } else if (unassignedResource) {
                        logger.debug('Update tags for resource ', unassignedResource._id);
                        for (tagName in bulkResources[j].tags) {
                            unassignedResource.tags[tagName] = bulkResources[j].tags[tagName];
                        }
                        unassignedResources.push(unassignedResource);
                    }

                    if (j == bulkResources.length - 1) {
                        switch (provider.providerType) {
                            case providerTypes.AWS:
                                logger.debug('Update aws resource tags ', unassignedResources.length);
                                bulkUpdateAWSResourcesTags(provider, unassignedResources, callback);
                                break;
                            default:
                                var err = new Error('Invalid request');
                                err.status = 400;
                                return callback(err);
                                break;
                        }
                    }
                })
            })(i);
        }
    }
}

function bulkUpdateUnassignedResourceTags(bulkResources, callback){
    for (var i = 0; i < bulkResources.length; i++) {
        (function(j) {
            var params = {
                '_id': bulkResources[j].id
            }
            var fields = {
                'tags': bulkResources[j].tags,
                'projectTag' : bulkResources[j].tags['Owner'],
                'environmentTag' :  bulkResources[j].tags['Environment']
            }
            resources.updateResourceTag(params, fields,
                function(err, resourceUpdated) {
                    if (err) {
                        logger.error(err);
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (j == bulkResources.length - 1) {
                        return callback(null, bulkResources);
                    }
                }
            );
        })(i);
    }
};

function bulkUpdateAWSResourcesTags(provider, resources, callback) {
    if(resources.length > 0) {
        if(resources[0].resourceType === 'S3') {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var s3Config = {
                access_key: decryptedAccessKey,
                secret_key: decryptedSecretKey,
                region: "us-east-1"
            };
            var s3 = new S3(s3Config);
            for (var i = 0; i < resources.length; i++) {
                (function (j) {
                    logger.debug('Updating tags for resource ', resources[j]._id);
                    s3.addBucketTag(resources[j].resourceDetails.bucketName, resources[j].tags,
                        function (err, data) {
                            if (err) {
                                logger.error(err);
                                if(err.code === 'AccessDenied'){
                                    var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                                    err.status = 500;
                                    return callback(err);
                                }else {
                                    var err = new Error('Internal server error');
                                    err.status = 500;
                                    return callback(err);
                                }
                            } else if (j == resources.length - 1) {
                                return callback(null, resources);
                            }
                        });
                })(i);
            }
        }else if(resources[0].resourceType === 'RDS') {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var s3Config = {
                access_key: decryptedAccessKey,
                secret_key: decryptedSecretKey,
                region: "us-west-1"
            };
            var rds = new RDS(s3Config);
            for (var i = 0; i < resources.length; i++) {
                (function (j) {
                    logger.debug('Updating tags for resource ', resources[j]._id);
                    rds.addRDSDBInstanceTag(resources[j].resourceDetails.dbName, resources[j].tags,
                        function (err, data) {
                            if (err) {
                                logger.error(err);
                                if(err.code === 'AccessDenied'){
                                    var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                                    err.status = 500;
                                    return callback(err);
                                }else {
                                    var err = new Error('Internal server error');
                                    err.status = 500;
                                    return callback(err);
                                }
                            } else if (j == resources.length - 1) {
                                return callback(null, resources);
                            }
                        });
                })(i);
            }
        }else{
            return callback(null, resources);
        }
    }else{
        return callback(null, resources);
    }
}

function getStartTime(endTime, period){
    var startTime = new Date(endTime);
    var subtractedDateInMilliSeconds = startTime.getTime() - (period*1000);
    var subtractedDate = new Date(subtractedDateInMilliSeconds);
    return dateUtil.getDateInUTC(subtractedDate);
}