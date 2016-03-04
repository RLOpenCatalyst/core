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
var bcrypt = require('bcryptjs');

// This file act as a Util class which contains methods to hash password and authentication logic.

var AuthUtil = function(){
	// Generating encrypted password using bcrypt 
    this.hashPassword = function(aPassword,callback){
        bcrypt.genSalt(10,function(err,salt){
            if(err){
                logger.debug("Error while Generating Salt.")
                callback(err,null);
            }
            bcrypt.hash(aPassword,salt,function(err,hashedPassword){
                if(err){
                    logger.debug("Errot while hashing password.");
                    callback(err,null);
                }
                callback(null,hashedPassword);
            });
        });
    }

    // Compare password with hashed password
    this.checkPassword = function(password,hashedPassword,callback){
    	logger.debug("password: ",password,hashedPassword);
        bcrypt.compare(password,hashedPassword,function(err,isMatched){
            if(err){
                logger.debug("Something wrong while matching password.");
                callback(err,null);
            }
            logger.debug("isMatched: ",isMatched);
            callback(null,isMatched);
        })
    };
}

module.exports = new AuthUtil();