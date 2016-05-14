var express = require('express');
var router = express.Router();

var Provider = require('./providers.js')

router.use(Provider.pattern,Provider.router);



module.exports = router;