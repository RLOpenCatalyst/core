 var Joi = require('joi');


 var clientAppAccessValidator = module.exports = {};

 clientAppAccessValidator.create = {
 	body : {
 		params : Joi.any().required(),
 		clientRedirectUrl : Joi.string().required()
 	}
 };

 clientAppAccessValidator.get = {
 	params : {
 		transactionId : Joi.string().required()
 	}
 }