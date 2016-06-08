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
var util = require('util');
var Schema = mongoose.Schema;

var BaseProviderSchema = function BaseProviderSchema() {
    Schema.apply(this, arguments);

    this.add({
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            trim: true
        },
        organizationId: {
            type: String,
            required: true,
            trim: false
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false
        },
        invalidCredentials: {
            type: Boolean,
            required: true,
            default: false
        }
    });
};
util.inherits(BaseProviderSchema, Schema);

module.exports = BaseProviderSchema;