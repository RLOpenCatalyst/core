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


var aws = require('aws-sdk');
var logger = require('_pr/logger')(module);

if (process.env.http_proxy) {
    aws.config.update({
        httpOptions: {
            proxy: process.env.http_proxy
        }
    });
}
var AWSCloudFormation = function(awsSettings) {

    var that = this;
    var params = new Object();

    if (typeof awsSettings.region !== undefined) {
        params.region = awsSettings.region;
    }

    if (typeof awsSettings.isDefault !== undefined && awsSettings.isDefault == true) {
        params.credentials = new aws.EC2MetadataCredentials({httpOptions: {timeout: 5000}});
    } else if (typeof awsSettings.access_key !== undefined && typeof awsSettings.secret_key !== undefined) {
        params.accessKeyId = awsSettings.access_key;
        params.secretAccessKey = awsSettings.secret_key;
    }

    var cloudFormation = new aws.CloudFormation(params);

    var that = this;
    this.createStack = function(stackOptions, callback) {
        var options = {
            StackName: stackOptions.name,
            Parameters: stackOptions.templateParameters,

        };
        if (stackOptions.templateBody) {
            options.TemplateBody = stackOptions.templateBody;
        } else {
            options.TemplateURL = stackOptions.templateBody;
        }

        
        cloudFormation.createStack(options, function(err, stackData) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, stackData);
        });
    };

    this.deleteStack = function(stackNameOrId, callback) {
        cloudFormation.deleteStack({
            StackName: stackNameOrId
        }, function(err, deleteData) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, deleteData);
        });
    };

    function describeStacks(stackNameOrId, nextToken, callback) {
        cloudFormation.describeStacks({
            StackName: stackNameOrId,
            NextToken: nextToken
        }, function(err, res) {
            if (err) {
                callback(err, null);
                return;
            };
            callback(null, res.Stacks);

        });

    }

    this.getListOfStacks = function(nextToken, callback) {
        describeStacks(null, nextToken, callback);
    };

    this.getStack = function(stackNameOrId, callback) {
        if (!stackNameOrId) {
            process.nextTick(function() {
                callback(null, null);
            });
            return;
        }
        describeStacks(stackNameOrId, null, function(err, stacks) {
            if (err) {
                callback(err, null);
                return;
            }
            if (stacks.length) {
                callback(null, stacks[0]);
            } else {
                callback(null, null);
            }
        });

    };

    this.waitForStackCompleteStatus = function(stackId, callback) {
        var self = this;
        logger.debug('Checking status ==>');
        this.getStack(stackId, function(err, stack) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug('status ==>', stack.StackStatus);
            switch (stack.StackStatus) {
                case 'CREATE_IN_PROGRESS':
                    setTimeout(function() {
                        self.waitForStackCompleteStatus(stackId, callback);
                    }, 3000);
                    break;
                case 'CREATE_FAILED':
                    callback({
                        stackStatus: stack.StackStatus
                    }, null);
                    break;
                case 'CREATE_COMPLETE':
                    callback(null, stack);
                    break;
                default:
                    callback({
                        stackStatus: stack.StackStatus
                    }, null);
                    return;
            }

        });

    };

    function listStackResources(stackNameOrId, nextToken, callback) {
        cloudFormation.listStackResources({
            StackName: stackNameOrId,
            NextToken: nextToken
        }, function(err, res) {
            if (err) {
                callback(err, null);
                return;
            };
            callback(null, res);
        });
    }

    this.listAllStackResources = function(stackNameOrId, callback) {
        var self = this;
        var resources = [];

        function listResources(nextToken, callback) {
            listStackResources(stackNameOrId, nextToken, function(err, res) {
                if (err) {
                    callback(err, null);
                    return;
                }
                resources = resources.concat(res.StackResourceSummaries);
                if (res.NextToken) {
                    listResources(res.NextToken, callback);
                } else {
                    callback(null, resources);
                }

            });
        }
        listResources(null, callback);
    };

    this.getStackEvents = function(stackNameOrId, nextToken, callback) {
        var params = {
            StackName: stackNameOrId
        };
        if (nextToken) {
            params.NextToken = nextToken;
        }

        cloudFormation.describeStackEvents(params, function(err, data) {

            if (err) {
                callback(err, null);
                return;
            }

            callback(null, {
                events: data.StackEvents,
                nextToken: data.NextToken
            });
        });

    };

    this.getAllStackEvents = function(stackNameOrId, callback) {
        var self = this;
        var events = [];

        function getEvents(nextToken, callback) {
            self.getStackEvents(stackNameOrId, nextToken, function(err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                events = events.concat(data.events);
                if (data.nextToken) {
                    getEvents(data.nextToken, callback);
                } else {
                    callback(null, events)
                }
            });
        }
        getEvents(null, callback);


    };

};


module.exports = AWSCloudFormation;