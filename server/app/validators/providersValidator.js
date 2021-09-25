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
var Joi = require('joi');

var providersValidator = module.exports = {};

providersValidator.create = {
    body: {
        name: Joi.string().max(40).required(),
        // type: Joi.string().max(15).valid('AWS', 'gcp').required(),
        type: Joi.string().max(15).valid('AWS').required(),
        organizationId: Joi.string().max(40).required(),
        providerDetails: Joi.required()
    }
};

providersValidator.update = {
    params: {
        providerId: Joi.string().max(40).required()
    },
    body: {
        name: Joi.string().max(40),
        // type: Joi.string().max(15).valid('AWS', 'gcp'),
        type: Joi.string().max(15).valid('AWS'),
        organizationId: Joi.string().max(40)
    }
};

providersValidator.accessIndividualResource = {
    params: {
        providerId: Joi.string().max(40).required()
    }
};