var express = require('express');
var Authentication = require('./authentications.js');
var Providers = require('./providers.js');
var NetworkProfiles = require('./network-profiles.js');
var Blueprints = require('./blueprints.js');
var logger = require('_pr/logger')(module);


var router = express.Router();




router.use(Authentication.pattern, Authentication.router);

if (Authentication.sessionVerifier) {
    router.use(Authentication.sessionVerifier);
}



router.use(Providers.pattern, Providers.router);
router.use(NetworkProfiles.pattern, NetworkProfiles.router);
router.use(Blueprints.pattern, Blueprints.router);



router.use(errorHandler);

function errorHandler(err, req, res, next) {
    if (err) {
        logger.error(err);

        var errorResponse = {
            'status': err.status,
            'message': err.message,
            'errors': []
        };
        if ('errors' in err) {
            for (var i = 0; i < err.errors.length; i++) {
                if ('message' in err.errors[i])
                    errorResponse.errors.push(err.errors[i].messages);
            }
        }

        return res.status(err.status).send(errorResponse);
    }
}

module.exports = router;