var express = require('express');
var router = express.Router();

var Provider = require('./provider-v2.0.js')

router.use(Provider.pattern,Provider.router);



module.exports = router;