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

var request = require('request');
var logger = require('_pr/logger')(module);

module.exports = { 
    startDigitalOcean: startDigitalOcean,
    stopDigitalOcean: stopDigitalOcean,
    verifyDigitalOceanCredentials: verifyDigitalOceanCredentials
}

function startDigitalOcean(instanceId, token, callback) {
    var options = { 
        method: 'POST',
        url: "https://api.digitalocean.com/v2/droplets/"+ instanceId  +"/actions",
        headers: { 
                    Authorization: "Bearer "+ token,
                    'Content-Type': 'application/json' 
                },
    body: { type: 'power_on' },
    json: true };

    request(options, function (error, response, body) {
        logger.debug("response.statusCode: ", response.statusCode);

        if (err) {
            callback(err, null);
            return;
        }

        if (response.statusCode == '201') {
            logger.debug("START DROPLETS...")
            logger.debug("Status------", JSON.stringify(response.status, response.type))
            callback(null, response.status);
            return;
        } else {
            callback(body, null);
            return;
        }
});
}

function stopDigitalOcean(instanceId, token, callback) {
    logger.info("Inside stop digital ocean")
    var options = { 
        method: 'POST',
        url: "https://api.digitalocean.com/v2/droplets/"+ instanceId +"/actions",
        headers: { 
                    Authorization: "Bearer "+ token,
                    'Content-Type': 'application/json' 
                },
        body: { 
            type: 'power_off'
        },
        json: true 
    }
    request(options, function (error, response, body) {
        logger.debug("response.statusCode: ", response.statusCode);
        if (error) {
            logger.error(JSON.stringify(error))
            callback(error, null)
        }
        if (response.statusCode == '201') {
            logger.debug("STOP DROPLETS...")
            logger.debug("Status------", JSON.stringify(response.status, response.type))
            callback(null, response.status);
            return;
        } else {
            logger.info(JSON.stringify(body))
            callback(body, null);
            return;
        }
    })
}

function getDigitalOcean(token, callback) {
    logger.info("Inside Verify digital ocean")
    var options = { 
        method: 'GET',
        url: "https://api.digitalocean.com/v2/droplets",
        headers: { 
                    Authorization: "Bearer "+ token,
                    'Content-Type': 'application/json' 
                },
        json: true 
    }
    request(options, function (error, response, body) {
        if (error) {
            logger.error(JSON.stringify(error))
            callback(error, null)
        }
        if (response.statusCode == '200') {
            logger.debug("Verified digital ocean")
            logger.debug("response.statusCode: ", response.statusCode);
            callback(null, response);
            return;
        } else {
            logger.info(JSON.stringify(body))
            callback(body, null);
            return;
        }
    })
}


function verifyDigitalOceanCredentials(token, callback) {
    getDigitalOcean(token, function (err, res) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            logger.info("Digital Ocean account was able to validate the provided access credentials"); 
            callback(null,{statusCode: 200, message:"Digital Ocean account was able to validate the provided access credentials"}); 
        }
    });
};