var logger = require('_pr/logger')(module);
var orgResourcePermService = require('_pr/services/orgResourcePermissionService');
var validate = require('express-validation');
var orgResourcePermValidator = require('_pr/validators/orgResourcePermissionValidator.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all('/api/org*', sessionVerificationFunc);
	
	/*app.post('/api/org/:{orgId}/bots', sessionVerification, upsertOrgBots);

	function upsertOrgBots(req, res, next){
//		orgResourcePermService.
	}*/

	app.post('/api/org/:orgId/:resourceType', validate(orgResourcePermValidator.upsert), updateOrgResources);
	
	function updateOrgResources(req, res, next){
		if ( req.body.add.length === 0 && req.body.delete.length === 0 ) {
			var err = { err: 'No records to update'};
			return res.status(500).send(err);
		}
		
		orgResourcePermService.updateOrgResources(req.params.orgId, req.params.resourceType, req.body, function(err, result){
			
			if( err ){
				var response = {
						err: err
				};
				
				if ( result !== null ) {
					response.updated = result;
				}
				return res.status(500).send(response);
			}
			
			return res.status(200).send({ message: 'successfully org resource association completed'});
		});
	}
	
	app.get('/api/org/:orgId/:resourceType', validate(orgResourcePermValidator.get),getResourcesByOrgTeam);
	
	function getResourcesByOrgTeam(req, res, next){
		var actionStatus = null,serviceNowCheck =false;
        var loggedUser =  req.session.user.cn;
        if(req.query.actionStatus && req.query.actionStatus !== null){
            actionStatus = req.query.actionStatus;
        }
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
		
		var queryParameters = {
			orgId : req.params.orgId,
			teamIds : req.query.teamIds.split(','),
			resourceType : req.params.resourceType
		};
		
		if (req.query.searchq) {
			queryParameters.searchq = req.query.searchq;
		}
		orgResourcePermService.getResourcesByOrgTeam(queryParameters, actionStatus, serviceNowCheck, function(err, result){
			if( err ){
				return res.status(500).send(err);
			}
			
			return res.status(200).send(result);
		});
	}
};