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
var util = require('util');
var process = require('child_process').exec;

var curl = function(){
	this.executecurl = function(cmd,callback){
		child = process(cmd,function(error,stdout,stderr){
			if(error){
				logger.debug("error:" + error);
				callback(error,null);
			}
			if(stderr){
				logger.debug("stderr:" + stderr + "end of errr");
				callback(stderr,null);

			}
			if(stdout){
				logger.debug("Out:" + stdout);
				callback(null,stdout);
			}
		});
	}
	this.executecwdcmd = function(cmd,cwd1,callback){
		child = process(cmd,{cwd: cwd1},function(error,stdout,stderr){
			if(error){
				callback(error,null);
			}
			if(stderr){
				callback(stderr,null);

			}
			if(stdout){
				logger.debug("Out:" + stdout);
				callback(null,stdout);
			}
		});		
	}	
}

module.exports = curl;

