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
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/utils/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');
var uuid = require('node-uuid');


var Schema = mongoose.Schema;



var TempTokenSchema = new Schema({
    token: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    sessionData: Object
});


TempTokenSchema.index({
    createdAt: 1
}, {
    expireAfterSeconds: 5 * 60
});



// Static methods :- 

// creates a new task
TempTokenSchema.statics.createNew = function(sessionData, callback) {
    var token = uuid.v4();
    var that = this;
    var tempToken = new that({
        token: token,
        sessionData: sessionData
    });


    tempToken.save(function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

// find by token
TempTokenSchema.statics.findByToken = function(token, callback) {
    if (!token) {
        process.nextTick(function() {
            callback(new Error("Invalid token"));
        });
        return;
    }
    var queryObj = {
        token: token,
    }

    this.find(queryObj, function(err, authTokens) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (!authTokens.length) {
            callback(null, null);
            return;
        }
        if (authTokens.length > 1) { // having more than one entry for token.

            for (var i = 0; i < authTokens.length; i++) {
                authTokens[i].remove(); // deleting all the tokens
            }
            callback(null, null);
        } else {
            callback(null, authTokens[0]);
        }

    });
};



// remove token
TempTokenSchema.statics.removeByToken = function(token, callback) {
    if (!token) {
        process.nextTick(function() {
            callback(new Error("Invalid token"));
        });
        return;
    }
    this.remove({
        "token": token
    }, function(err, deleteCount) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, deleteCount);
    });
};


var TempAuthToken = mongoose.model('TempAuthToken', TempTokenSchema);

module.exports = TempAuthToken;