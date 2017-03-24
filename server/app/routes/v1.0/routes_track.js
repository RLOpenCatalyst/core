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
var Track = require('_pr/model/track/track');
var errorResponses = require('./error_responses');
var appConfig = require('_pr/config');
var async = require('async');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/track*', sessionVerificationFunc);

    // Get all track
    app.get('/track', function(req, res) {
        async.waterfall([
            function(next){
                Track.getTracks(next);
            },
            function(tracks,next){
                trackFormatData(tracks,next);
            }
        ],function(err,results){
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.send(200, results);
            return;
        })
    });

    // Create track
    app.post('/track', function(req, res) {
        logger.debug("Got Track data: ", JSON.stringify(req.body.trackData));

        //updating the record when type is present.
        Track.getTrackByType(req.body.trackData.type, function(err, tracks) {
            if (err) {
                logger.debug("error ", errorResponses.db.error);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (tracks.length === 0) {
                //creating new record when type is not present.
                Track.createNew(req.body.trackData, function(err, tracks) {
                    if (err) {
                        logger.debug("error ", errorResponses.db.error);
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    if (tracks) {
                        res.send(200, tracks);
                        return;
                    }
                });
            } else {
                logger.debug(req.body.trackData);
                var items = tracks[0].itemUrls.concat(req.body.trackData.itemUrls);
                tracks[0].itemUrls = items;
                logger.debug("tracks[0]", items);
                tracks[0].save(function(err, track) {
                    if (err) {
                        logger.debug("error ", err);
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    res.send(200, track);
                });
            }
        });


    });

    // Update Track
    app.post('/track/:trackId/update', function(req, res) {
        logger.debug("Got tracks data: ", JSON.stringify(req.body.trackData), req.params.trackId);
        Track.getTrackById(req.params.trackId, function(err, tracks) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!tracks) {
                res.send(404, "Tracks not found!");
                return;
            }
            if (!req.body.trackData.itemUrls) {
                res.status(400).send({
                    message: "Bad Request"
                })
                return;
            }
            Track.updateTrack(req.params.trackId, req.body.trackData.itemUrls, function(err, updateCount) {
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
    app.get('/track/:trackId', function(req, res) {
        Track.getTrackById(req.params.trackId, function(err, tracks) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (tracks) {
                res.send(200, tracks);
                return;
            } else {
                res.send(404, "Track not found!");
                return;
            }
        });
    });

    // Delete Track w.r.t. Id
    app.delete('/track/:trackId/:itemId', function(req, res) {
        Track.getTrackById(req.params.trackId, function(err, track) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (track) {

                if (track.itemUrls && track.itemUrls.length) {
                    var itemUrls = [];
                    for (var i = 0; i < track.itemUrls.length; i++) {
                        if (track.itemUrls[i].id !== req.params.itemId) {
                            itemUrls.push(track.itemUrls[i]);
                        }
                    }
                    if (itemUrls.length) {
                        track.itemUrls = itemUrls;
                        track.save(function(err) {
                            if (err) {
                                logger.debug("Error while removing tracks: ", JSON.stringify(tracks));
                                res(500, "Error while removing tracks:");
                                return;
                            }
                            res.send(200, "Successfully Removed tracks.");
                            return;
                        });
                    } else {
                        track.remove(function(err) {
                            if (err) {
                                logger.debug("Error while removing tracks: ", JSON.stringify(tracks));
                                res(500, "Error while removing tracks:");
                                return;
                            }
                            res.send(200, "Successfully Removed tracks.");
                            return;
                        });
                    }

                } else {
                    track.remove(function(err) {
                        if (err) {
                            logger.debug("Error while removing tracks: ", JSON.stringify(tracks));
                            res(500, "Error while removing tracks:");
                            return;
                        }
                        res.send(200, "Successfully Removed tracks.");
                        return;
                    });
                }
            } else {
                res.send(404, "Tracks not found!");
                return;
            }
        });
    });

};

function trackFormatData(tracks,next){
    if(tracks.length > 0){
        var trackMenuList = appConfig.trackMenu;
        var trackList = []
        for(var i = 0; i < trackMenuList.length;i++){
            (function(trackMenu){
                for(var j = 0;j < tracks.length; j++){
                    if(trackMenu === tracks[j].type){
                        trackList.push(tracks[j]);
                    }
                }
            })(trackMenuList[i]);
        }
        if(trackList.length === tracks.length){
            next(null,trackList);
            return;
        }
    }else{
        next(null,tracks);
        return;
    }
}
