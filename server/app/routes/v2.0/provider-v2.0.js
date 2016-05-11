var router = require('express').Router();


router.get('/',function(req,res,next){
   res.status(200).send('hello world v2.0');
});


module.exports.pattern = '/provider';
module.exports.router = router;