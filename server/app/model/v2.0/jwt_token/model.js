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
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/utils/schema-validator');

// File which contains ldap DB schema and DAO methods. 

var Schema = mongoose.Schema;

var JWTTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        trim: true
    },
    expiry: {
        type: Number,
        required: true,
        trim: true
    }
});

JWTTokenSchema.statics.createNew = function createNew(tokenData, callback) {
    var self = this;
    var jwtToken = new self(tokenData);
    jwtToken.save(function(err, tokenData) {
        if (err) {
            return callback(err);
        }
        callback(null, self);
    });
};

JWTTokenSchema.statics.removeToken = function removeToken(token, callback) {
    this.remove({
        token: token
    }, function(err, count) {
        if (err) {
            return callback(err);
        }
        callback(null, count);
    });
};


JWTTokenSchema.statics.findByToken = function findByToken(token, callback) {
    this.find({
        token: token
    }, function(err, jwtTokens) {
        if (err) {
            return callback(err);
        }
        var jwtToken = null;
        if (jwtTokens.length) {
            jwtToken = jwtTokens[0];
        }
        callback(null, jwtToken);
    });
};

var JWTToken = mongoose.model('jwttoken', JWTTokenSchema);
module.exports = JWTToken;