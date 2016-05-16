var express = require('express');
var router = express.Router();

var Providers= require('./providers.js');
var NetworkProfiles = require('./network-profile/network-profiles.js');
var Blueprints = require('./blueprints.js');

router.use(Providers.pattern, Providers.router);
router.use(NetworkProfiles.pattern, NetworkProfiles.router);
router.use(Blueprints.pattern, Blueprints.router);

module.exports = router;