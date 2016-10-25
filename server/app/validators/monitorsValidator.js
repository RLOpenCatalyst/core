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

var monitorsValidator = module.exports = {};

monitorsValidator.create = {
    body: {
        "orgId": Joi.string().max(40).required(),
        "name": Joi.string().max(40).required(),
        "type": Joi.valid('sensu', 'other'),
        "parameters": Joi.object()
            .keys({
                "url": Joi.string(),
                "transportProtocol": Joi.valid('rabbitmq', 'redis'),
                "transportProtocolParameters": Joi.object().keys({
                        "host": Joi.string().required(),
                        "port": Joi.number().required(),
                        "vhost": Joi.string(),
                        "user": Joi.string(),
                        "password": Joi.string().required(),
                        "heartbeat": Joi.number(),
                        "prefetch": Joi.number(),
                        "ssl": Joi.object().keys({
                            "certChainFileId": Joi.string().required(),
                            "privateKeyFileId": Joi.string().required()
                        })
                    })
                    .when('transportProtocol', {
                        is: 'rabbitmq',
                        then: Joi.object({ 'vhost': Joi.required(), 'user': Joi.required(), 'heartbeat': Joi.required(), 'prefetch': Joi.required() })
                    })
            })
            .required()
            .when('type', {
                is: 'sensu',
                then: Joi.object({ 'url': Joi.required(), 'transportProtocol': Joi.required(), 'transportProtocolParameters': Joi.required() })
            })
    }
};

monitorsValidator.update = {
    body: {
        "orgId": Joi.string().max(40).required(),
        "name": Joi.string().max(40).required(),
        "type": Joi.valid('sensu', 'other'),
        "parameters": Joi.object()
            .keys({
                "url": Joi.string(),
                "transportProtocol": Joi.valid('rabbitmq', 'redis'),
                "transportProtocolParameters": Joi.object().keys({
                        "host": Joi.string().required(),
                        "port": Joi.number().required(),
                        "vhost": Joi.string(),
                        "user": Joi.string(),
                        "password": Joi.string(),
                        "heartbeat": Joi.number(),
                        "prefetch": Joi.number(),
                        "ssl": Joi.object().keys({
                            "certChainFileId": Joi.string(),
                            "privateKeyFileId": Joi.string()
                        })
                    })
                    .when('transportProtocol', {
                        is: 'rabbitmq',
                        then: Joi.object({ 'vhost': Joi.required(), 'user': Joi.required(), 'heartbeat': Joi.required(), 'prefetch': Joi.required() })
                    })
            })
            .required()
            .when('type', {
                is: 'sensu',
                then: Joi.object({ 'url': Joi.required(), 'transportProtocol': Joi.required(), 'transportProtocolParameters': Joi.required() })
            })
    }
};
