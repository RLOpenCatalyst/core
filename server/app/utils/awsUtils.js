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

var awsUtil = module.exports ={};

if (process.env.http_proxy) {
	aws.config.update({
		httpOptions: {
			proxy: process.env.http_proxy
		}
	});
}

awsUtil.ec2 = function ec2(config) {
	var params = new Object();

	if (typeof config.region !== undefined) {
		params.region = config.region;
	}

	if (typeof config.isDefault !== undefined && config.isDefault === true) {
		params.credentials = new aws.EC2MetadataCredentials({httpOptions: {timeout: 5000}});
	} else if (typeof config.access_key !== undefined && typeof config.secret_key !== undefined) {
		params.accessKeyId = config.access_key;
		params.secretAccessKey = config.secret_key;
	}

	return new aws.EC2(params);
}