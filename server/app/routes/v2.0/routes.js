var express = require('express');
var Authentication = require('./authentication.js');
var Providers= require('./providers.js');
var NetworkProfiles = require('./network-profiles.js');
var Blueprints = require('./blueprints.js');


var router = express.Router();




router.use(Authentication.pattern, Authentication.router);

if (Authentication.sessionVerifier) {
    router.use(Authentication.sessionVerifier);
}


router.use(Providers.pattern, Providers.router);
router.use(NetworkProfiles.pattern, NetworkProfiles.router);
router.use(Blueprints.pattern, Blueprints.router);

module.exports = router;