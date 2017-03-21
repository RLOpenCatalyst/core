

var validate = require('express-validation');
var botTransactionvalidator = require('_pr/validators/botTransactionValidator.js');
var botTransactionService = require('_pr/services/botTransactionService.js');
var util = require('util');
var logger = require('_pr/logger')(module);

module.exports.setRoutes = function(app) {
	app.post('/transaction', validate(botTransactionvalidator.create), createBotTransaction );
	function createBotTransaction(req, res, next){

		logger.debug('Calling createBotTransaction', req.body);
		botTransactionService.createBotTransaction(req.body, function(err, data){
			if(err) {
				logger.error('Error occured while creating transaction ', err);
				return next(err);
			}

			res.status(200).send(data);
		});

	}

	app.get('/transaction/:transactionId', validate(botTransactionvalidator.get), getBotTransaction);

	function getBotTransaction( req, res, next){
		botTransactionService.getBotTransaction(req.params.transactionId, function(err, data){
			if ( err ) {
				logger.error('Error occured getting bot transaction ', err);
				return next(err);
			}

			var base64 = new Buffer(JSON.stringify(data.params)).toString('base64');

			res.redirect(data.catalystUrl + '?params=' + base64);
		});
	}
}