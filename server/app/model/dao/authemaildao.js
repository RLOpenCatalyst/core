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


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var schemaValidator = require('./schema-validator');


var Schema = mongoose.Schema;
var authemailschema = new Schema({
    from: {
        type: String,
        required: true,
        trim: true
    },
    to: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,

        trim: true
    },
    smtpserver: {
        type: String,
        required: false,
        trim: true
    },
    category:{
        type: String,
        required: true,
        trim: true,
        default: "failedbot"
    },
    subject: {
        type: String,
        required: false,
        trim: true
    },
    body: {
        type: String,
        required: false,
        trim: true
    },
    username: {
        type: String,
        required: false,
        trim: true
    }
});

var AuthEmail = mongoose.model('authemail', authemailschema);

module.exports = AuthEmail;