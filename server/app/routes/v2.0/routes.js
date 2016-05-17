var express = require('express');
var Provider = require('./providers.js');
var Authentication = require('./authentication.js');
var router = express.Router();



router.use(Authentication.pattern, Authentication.router);

if (Authentication.sessionVerifier) {
    router.use(Authentication.sessionVerifier);
}

router.get('/test', function(req, res) {
    res.status(200).send('hello token');
});

router.use(Provider.pattern, Provider.router);



module.exports = router;