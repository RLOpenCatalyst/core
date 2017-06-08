 var Joi = require('joi');

 var orgResourcePermisssionValidator = module.exports = {};

 orgResourcePermisssionValidator.upsert = {
 	body : {
 		add : upsertSchema(),
 		delete : upsertSchema()
 	},
 	params : {
 		orgId : Joi.string().required(),
 		resourceType : Joi.string().valid('bots').required()
 	}
 };

 orgResourcePermisssionValidator.get = {
 	query : {
 		teamIds : Joi.string().required(),
 		searchq : Joi.string()
 	},
 	params : {
 		orgId : Joi.string().required(),
 		resourceType : Joi.string().valid('bots').required()
 	}
 };
 
 function upsertSchema(){
	 return Joi.array().items(Joi.object().keys({
			teamIds:Joi.array().items(Joi.string().required()).required(),
				resourceIds:Joi.array().items(Joi.string().required()).required()
			}).optional()).optional();
 }
 
 exports = orgResourcePermisssionValidator;