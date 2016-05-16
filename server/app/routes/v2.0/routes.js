var express = require('express');
var router = express.Router();

var Provider = require('./providers.js');
var NetworkProfile = require('./network-profiles.js');


router.use(Provider.pattern, Provider.router);
router.use(NetworkProfile.pattern, NetworkProfile.router);



module.exports = router;