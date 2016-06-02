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
var awsService = module.exports = {};
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var aws = require('aws-sdk');
var CW = require('_pr/lib/cloudwatch.js');
var S3 = require('_pr/lib/s3.js');
var resourceCost = require('_pr/model/resource-costs');
var csv = require("fast-csv");
var fs = require('fs');
var async = require('async');
awsService.getCostForResources = getCostForResources;
awsService.getTotalCost = getTotalCost;
awsService.getCostForServices = getCostForServices;
awsService.getEC2InstanceUsageMetrics=getEC2InstanceUsageMetrics;
awsService.getS3BucketsMetrics=getS3BucketsMetrics;
awsService.getBucketsInfo=getBucketsInfo;


function getCostForResources(updatedTime,provider,instanceIds,fileName, callback) {
    var temp = String(updatedTime).split(',');
    var ec2Cost = 0, totalCost = 0, rdCost = 0, rstCost = 0, elcCost = 0, cdfCost = 0, r53Cost = 0, s3Cost = 0 , vpcCost = 0;
    var regionOne = 0, regionTwo = 0, regionThree = 0, regionFour = 0, regionFive = 0, regionSix = 0, regionSeven = 0, regionEight = 0, regionNine = 0, regionTen = 0, catTagCost = 0, jjTagCost = 0;
    var stream = fs.createReadStream(fileName);
    var costIndex = 18;
    var zoneIndex = 11;
    var usageIndex= 9;
    var prodIndex=5;
    var tagIndex =22;
    var instanceCostMetrics = [];
    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 1000*60*60*24);
    csv.fromStream(stream, {headers : false}).on("data", function(data){
        if(data[costIndex] !== 'BlendedCost' && data[prodIndex] !== ''){
            totalCost += Number(data[costIndex]);
        }
        if(data[prodIndex] === "Amazon Elastic Compute Cloud")
        {
            ec2Cost += Number(data[costIndex]);
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
        }else if(data[prodIndex] === "Amazon Virtual Private Cloud") {
            vpcCost += Number(data[costIndex]);
        }
        //Calculate Cost of Tags
        if(data[tagIndex] === "Catalyst"){
            catTagCost += Number(data[costIndex]);
        }else if(data[tagIndex] === "J&J") {
            jjTagCost += Number(data[costIndex]);
        }
        if (instanceIds.indexOf(data[21]) >=0) {
            var instanceCostMetricsObj = {};
            instanceCostMetricsObj['usageStartDate'] = data[14];
            instanceCostMetricsObj['usageEndDate'] = data[15];
            instanceCostMetricsObj['usageQuantity'] = Number(data[16]);
            instanceCostMetricsObj['description'] = data[13];
            instanceCostMetricsObj['usageCost'] = Number(data[costIndex]);
            instanceCostMetricsObj['resourceId'] = data[21];
            instanceCostMetrics.push(instanceCostMetricsObj);
            instanceCostMetricsObj = {};
        }
    }).on("end", function(){
        var awsResourceCostObject = {
            organisationId: provider.orgId,
            providerId: provider._id,
            providerType: provider.providerType,
            providerName: provider.providerName,
            resourceType: "Service,Tag,Region",
            resourceId: "ResourceCost",
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
                    "J&J": jjTagCost
                }
            },
            updatedTime : Date.parse(updatedTime),
            startTime: Date.parse(startTime),
            endTime: Date.parse(endTime)
        };
        if(totalCost > 0) {
            resourceCost.saveResourceCost(awsResourceCostObject, function (err, resourceCostData) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, instanceCostMetrics);
                }
            })
        }else{
            callback(null, instanceCostMetrics);
        }
    });
};

function getTotalCost(provider,callback)
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
                        resourceType: "monthly,today,yesterday",
                        resourceId: "totalCost",
                        aggregateResourceCost:costOfMonth,
                        costMetrics : {
                            monthCost:costOfMonth,
                            dayCost:costOfDay,
                            yesterdayCost:costOfYesterday
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
                        resourceType: "monthly,today,yesterday",
                        resourceId: "totalCost",
                        aggregateResourceCost:costOfMonth,
                        costMetrics : {
                            monthCost:costOfMonth,
                            dayCost:costOfDay,
                            yesterdayCost:costOfYesterday
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


function getCostForServices(provider,callback) {
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
        var ec2Cost = 0, rdsCost = 0;
        /*Getting the cost of EC2 & RDS for the current day*/
        cw.getTotalCost(startDate,endDate,'Maximum',ec2Dim,function(err,presentCost)
        {
            if(err){
                callback(err,null);
            }
            cw.getTotalCost(startDateOne,endDate,'Minimum',ec2Dim,function(err,yesterdayCost)
            {
                if(err){
                    callback(err,null);
                }
                ec2Cost = presentCost['Maximum'] - yesterdayCost['Minimum'];
            });
            cw.getTotalCost(startDate,endDate,'Maximum',rdsDim,function(err,presentRdsCost)
            {
                if(err){
                    callback(err,null);
                }
                cw.getTotalCost(startDateOne,endDate,'Minimum',rdsDim,function(err,yesterdayRdsCost)
                {
                    if(err){
                        callback(err,null);
                    }
                    rdsCost = presentRdsCost['Maximum'] - yesterdayRdsCost['Minimum'];
                    var awsResourceCostObject = {
                        organisationId: provider.orgId,
                        providerId: provider._id,
                        providerType: provider.providerType,
                        providerName: provider.providerName,
                        resourceType: "ec2,rds",
                        resourceId: "serviceCost",
                        aggregateResourceCost:ec2Cost + rdsCost,
                        costMetrics : {
                            ec2Cost:ec2Cost,
                            rdsCost:rdsCost
                        },
                        updatedTime : Date.parse(endDate),
                        startTime: Date.parse(endDate),
                        endTime: Date.parse(startDateOne)
                    };
                    resourceCost.saveResourceCost(awsResourceCostObject,function(err,resourceCostData){
                        if(err){
                            callback(err,null);
                        } else{
                            callback(null,resourceCostData);
                        }
                    })
                });
            });
        });
}

function getEC2InstanceUsageMetrics(provider, instances, next) {
    var metricsUnits = appConfig.aws.cwMetricsUnits;
    var instanceUsageMetrics = [];
    var instnacesWithMetrics = instances.length;

    if(instances.length == 0)
        next(null, instanceUsageMetrics);

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

    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 1000*60*60*24);
    for(var i = 0; i < instances.length; i++) {
        (function(j) {
            if(('providerData' in instances[j]) && (typeof instances[j].providerData !== undefined)
                && instances[j].providerData) {
                amazonConfig.region = instances[j].providerData.region;
                cw = new CW(amazonConfig);

                async.parallel({
                        CPUUtilization: function (callback) {
                            cw.getUsageMetrics('CPUUtilization', metricsUnits.CPUUtilization,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, callback);
                        },
                        NetworkOut: function (callback) {
                            cw.getUsageMetrics('NetworkOut', metricsUnits.NetworkOut,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], instances[j].platformId, startTime, endTime, callback);
                        },
                        NetworkIn: function (callback) {
                            cw.getUsageMetrics('NetworkIn', metricsUnits.NetworkIn,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], instances[j].platformId, startTime, endTime, callback);
                        },
                        DiskReadBytes: function (callback) {
                            cw.getUsageMetrics('DiskReadBytes', metricsUnits.DiskReadBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], instances[j].platformId, startTime, endTime, callback);
                        },
                        DiskWriteBytes: function (callback) {
                            cw.getUsageMetrics('DiskWriteBytes', metricsUnits.DiskWriteBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], instances[j].platformId, startTime, endTime, callback);
                        }
                    },
                    function (err, results) {
                        if(err) {
                            logger.error(err)
                        } else {
                            instanceUsageMetrics.push({
                                providerId: provider._id,
                                providerType: provider.providerType,
                                orgId: provider.orgId[0],
                                projectId: instances[j].projectId,
                                resourceId: instances[j]._id,
                                platform: 'AWS',
                                platformId: instances[j].platformId,
                                resourceType: 'EC2',
                                startTime: startTime,
                                endTime: endTime,
                                metrics: results
                            });
                        }

                        if(instanceUsageMetrics.length == instnacesWithMetrics)
                            next(null, instanceUsageMetrics);
                    });
            } else {
                instnacesWithMetrics -= 1;

                if(instanceUsageMetrics.length == instnacesWithMetrics)
                    next(null, instanceUsageMetrics);
            }
        })(i);
    }
};

function getS3BucketsMetrics(provider, buckets, callback) {
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
    var endTime= new Date();
    var startTime = new Date(endTime.getTime() - (1000*60*60*24));
    for(var i = 0; i < buckets.length; i++) {
        (function(j) {
                cw = new CW(amazonConfig);
                async.parallel({
                        BucketSizeBytes: function (callback) {
                            cw.getUsageMetrics('BucketSizeBytes','Bytes','AWS/S3',[{Name:'BucketName',Value:buckets[j].Name},{Name:'StorageType',Value:'StandardStorage'}],startTime, endTime, callback);
                        },
                        NumberOfObjects: function (callback) {
                            cw.getUsageMetrics('NumberOfObjects','Count','AWS/S3',[{Name:'BucketName',Value:buckets[j].Name},{Name:'StorageType',Value:'AllStorageTypes'}],startTime, endTime, callback);
                        }
                    },
                    function (err, results) {
                        if(err) {
                            logger.error(err)
                        } else {
                            bucketUsageMetrics.push({
                                providerId: provider._id,
                                providerType: provider.providerType,
                                orgId: provider.orgId[0],
                                resourceId: buckets[j].Name,
                                platform: 'AWS',
                                platformId: buckets[j].Name,
                                resourceType: 'S3',
                                startTime: startTime,
                                endTime: endTime,
                                metrics: results
                            });
                        }
                        if(bucketUsageMetrics.length == bucketWithMetrics) {
                            callback(null, bucketUsageMetrics);
                        }
                    });
        })(i);
    }
};

function getBucketsInfo(provider,callback) {
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
            callback(null,data);
        }
    })
};
