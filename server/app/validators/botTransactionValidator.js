 var Joi = require('joi');


 var botTransactionValidator = module.exports = {};

 botTransactionValidator.create = {
 	body : {
 		params : Joi.any().required(),
 		clientRedirectUrl : Joi.string().required()
 	}
 };

 botTransactionValidator.get = {
 	params : {
 		transactionId : Joi.string().required()
 	}
 }