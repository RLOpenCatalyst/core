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

// The file contains all the end points for Tracks

var logger = require('_pr/logger')(module);
var Track = require('_pr/model/track/trackType');
var errorResponses = require('./error_responses');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/trackType*', sessionVerificationFunc);

    // Get all track
    app.get('/trackType', function(req, res) {
        Track.getTrackType(function(err, trackType) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (trackType) {
                res.send(200, trackType);
                return;
            }
        });
    });

    // Create track
    app.post('/trackType', function(req, res) {
        logger.debug(JSON.stringify(req.body));
        logger.debug("Got Track data: ", JSON.stringify(req.body.trackTypeData));

        Track.createNew(req.body.trackTypeData, function(err, trackType) {
            if (err) {
                logger.debug("error ", errorResponses.db.error);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (trackType) {
                logger.debug("post trackType");
                res.send(200, trackType);
                return;
            }
        });


    });

    // Update Track
    app.post('/trackType/:trackTypeId/update', function(req, res) {
        logger.debug("Got track Type data: ", JSON.stringify(req.body.trackTypeData), req.params.trackTypeId);
        Track.getTrackTypeById(req.params.trackTypeId, function(err, trackType) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!trackType) {
                res.send(404, "Tracks not found!");
                return;
            }
            Track.updateTrack(req.params.trackTypeId, req.body.trackTypeData, function(err, updateCount) {
                if (err) {
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                res.send(200, {
                    updateCount: updateCount
                });
            });
        });
    });

    // Get Track w.r.t. Id
    app.get('/trackType/:trackTypeId', function(req, res) {
        Track.getTrackTypeById(req.params.trackTypeId, function(err, trackType) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (trackType) {
                res.send(200, trackType);
                return;
            } else {
                res.send(404, "Track not found!");
                return;
            }
        });
    });

    // Delete Track w.r.t. Id
    app.delete('/trackType/:trackTypeId', function(req, res) {
        Track.getTrackTypeById(req.params.trackTypeId, function(err, trackType) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (trackType) {
                Track.removeTracks(req.params.trackTypeId, function(err, trackType) {
                    if (err) {
                        logger.debug("Error while removing trackType: ", JSON.stringify(trackType));
                        res(500, "Error while removing trackType:");
                        return;
                    }
                    if (trackType) {
                        logger.debug("Successfully Removed trackType.");
                        res.send(200, "Successfully Removed trackType.");
                        return;
                    }
                });
            } else {
                res.send(404, "Tracks not found!");
                return;
            }
        });
    });

};
