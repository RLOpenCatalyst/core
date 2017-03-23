
var logger = require('_pr/logger')(module);
var clientAppAccess = require('_pr/model/client-app-access/client-app-access.js');

var clientAppAccessService = module.exports = {};

clientAppAccessService.createTransaction = function createTransaction(transactionObj, callback) {
	
	clientAppAccess.createNew(transactionObj,function(err, data){
		if(err) {
			err.status = 400;
			return callback(err,null);
		}

		logger.debug('Bot transaction create');
		return callback(null, {transactionId : data._id});
	});
}

clientAppAccessService.getTransaction = function getTransaction(transactionID,  callback){

	clientAppAccess.findByTxnId(transactionID, function(err, data){

		if (err) {

			err.status = 400;
			return callback(err, null);
		}

		if (!data) {
			var err = new Error('Transaction not found');
			err.status = 404;
			return callback(err);
		}

		if (data.status === 'used') {
			
			var err = new Error('Transaction is already used');
			err.status = 400;
			return callback(err, null);
		}


		logger.debug('Updating the tranasaction status to end');

		clientAppAccess.updateTransaction(transactionID, function(err, updateData){

			if ( err ) {
				err.status = 400;
				return callback(err);
			}

			return callback(null, data);
		});
	});
}