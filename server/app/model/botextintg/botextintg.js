var mongoose = require('mongoose');
var util = require('util');
var Schema = mongoose.Schema;

var BotTransactionSchema = new Schema({
	clientRedirectUrl : {
		type: String,
		required :true,
		trim:true
	},
	catalystUrl : {
		type: String,
		required: true,
		trim:true
	},
	params:{
		type: Schema.Types.Mixed,
		required: true
	},
	status: {
		type: String,
		requried: true,
		trim:true
	},
	createdTime: {
		type: Date,
		default : Date.now
	},
	modifiedDate : {
		type: Date,
		default: Date.now
	}
});

var BOT_TRANSACTION_STATUS = {
	START : 'start',
	END : 'end'
};

BotTransactionSchema.statics.createNew = function createNew(data, callback){
	var self = this;
	data.status = BOT_TRANSACTION_STATUS.START;
	var botTransaction = new self(data);
	botTransaction.save(function(err, data){
		if(err) {
			return callback(err)
		}

		return callback(err, data);
	});
}

BotTransactionSchema.statics.findByTxnId = function findByTxnId(id, callback){

	if(!mongoose.Types.ObjectId.isValid(id)){

		return callback(new Error('Invalid id'));
	}

	this.findById(id, function (err, data){
		if ( err ) {
			return callback(err);
		}

		return callback( null , data);
	});
}

BotTransactionSchema.statics.updateTransaction = function updateTransaction(id, callback){
	this.update({
		_id: id
	}, {
		$set:{
			status: BOT_TRANSACTION_STATUS.END,
			modifiedDate : Date.now()
		}
	}, function (err, data){

		if ( err ) {
			return callback(err);
		}

		return callback(null, data);
	});
}

var BotTransaction = mongoose.model('botTransaction', BotTransactionSchema);

module.exports = BotTransaction;
