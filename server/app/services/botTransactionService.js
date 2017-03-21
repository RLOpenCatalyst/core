
var logger = require('_pr/logger')(module);
var botExtIntg = require('_pr/model/botextintg/botextintg.js');

var botTransactionService = module.exports = {};

botTransactionService.createBotTransaction = function createBotTransaction(botTransactionObj, callback) {
	botExtIntg.createNew(botTransactionObj,function(err, data){
		if(err) {
			err.status = 400;
			return callback(err,null);
		}

		logger.debug('Bot transaction create');
		return callback(null, {transactionId : data._id});
	});
}

botTransactionService.getBotTransaction = function getBotTransaction(transactionID,  callback){

	botExtIntg.findByTxnId(transactionID, function(err, data){

		if (err) {

			err.status = 400;
			return callback(err, null);
		}

		if (!data) {
			var err = new Error('Transaction not found');
			err.status = 404;
			return callback(err);
		}

		if (data.status === 'end') {
			
			var err = new Error('Transaction is already used');
			err.status = 400;
			return callback(err, null);
		}


		logger.debug('Updating the tranasaction status to end');

		botExtIntg.updateTransaction(transactionID, function(err, updateData){

			if ( err ) {
				err.status = 400;
				return callback(err);
			}

			return callback(null, data);
		});
	});
}