var orgResourcePermission = require('_pr/model/org-resource-permission/orgResourcePermission.js');
var logger = require('_pr/logger')(module);
var async = require('async');
var botDao = require('_pr/model/bots/1.1/bot.js');
var botService = require('_pr/services/botService.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');

/*function upsertOrgBots(data, cb){
	logger.debug('adding/updating org bots permission');
	var  errors = [];
	var successes = [];
	async.forEach(data, function(orgBot, k){
		orgResourcePermission.upsertOrgBots(orgBot, function(err, result){
			
			if (err) {
				errors.push(err);
			}
			
			successes.push(result);
			return k();
		});
	}, function(){
		
		if (errors.length > 0) {
			logger.error('Failed to insert org bot permission' + JSON.stringify(errors));
			return cb(errors, null);
		}
		
		logger.debug('adding/updating org bots permission completed');
		return cb( null, successes );
	});
}*/

function getResourcesByOrgTeam(queryParameters, actionStatus, serviceNowCheck,cb){
	
	var orgId = queryParameters.orgId
	var teamIds = queryParameters.teamIds;
	var resourceType = queryParameters.resourceType;
	orgResourcePermission.findResourceListByOrgTeam(orgId, teamIds, resourceType, function(err, result){
		
		if( err ){
			return cb(err, null);
		}
		//Get all bots from ids.
		var resourceIds = []; 
		result.forEach(function(r){
			resourceIds = resourceIds.concat(r.resourceIds);
		});
		if ( resourceType === 'bots') {
			queryParameters.resourceIds = resourceIds;
			botService.getBotListById(queryParameters,actionStatus,serviceNowCheck,function(err,result){
				
				if(err){
					logger.error('Error failed to find bot information for orgId: ' + orgId + ' teamId: ' + teamId + ' err: ' + err);
					return cb(err, null);
				}
				
				/*if (queryParameters.searchq) {
					result = result.filter(function(bot){
						return bot.name.toLowerCase().indexOf(queryParameters.searchq.toLowerCase()) > -1;
					});
				}*/
				
				return cb(null, result);
			});
		}
	});
}

function updateOrgResources(orgId, resourceType, data, cb){
	
	var teamsResourceInfo = {};
	var errors = [];
	var successes = [];
	var isAdd = false;
	if (data.add !== undefined) {
 		data.add.forEach(function(l){
 			l.teamIds.forEach(function(tId) {
 				isAdd = true;
 	 			teamsResourceInfo[tId]= {
 						teamId : tId,
 						orgId : orgId,
 						resourceType : resourceType
 				}
 			});
		});
	}

	var isDelete = false;
	if (data.delete !== undefined) {
		data.delete.forEach(function(l){
			l.teamIds.forEach(function(tId) {
				if(teamsResourceInfo[tId] === undefined) {
					isDelete = true;
		 			teamsResourceInfo[tId]= {
							teamId : tId,
							orgId : orgId,
							resourceType : resourceType
					};
				}
 			});
		});
	}
	
	async.forEach(Object.keys(teamsResourceInfo), function(teamId, k){
		orgResourcePermission.findResourceListByOrgTeam(orgId, teamId, resourceType, function(err, result){
			
			if ( err ) {
				logger.error('Error failed to find resource list for orgId: ' + orgId + ' teamId: ' + teamId + ' resourceType: ' + resourceType + ' err: ' + err);
				return k();
			}
			
			if(result.length == 0) {
				return k();
			}
			
			teamsResourceInfo[teamId] = {
					orgId : result[0].orgId,
					teamId : result[0].teamId,
					resourceType : result[0].resourceType,
					resourceIds : result[0].resourceIds
			};
			return k();
		});
	}, function(){

		var isUpdate = false;
		if(isAdd) {
			data.add.forEach(function(d){
				d.resourceIds.forEach(function(rId){
					d.teamIds.forEach(function(tId) {
						if(teamsResourceInfo[tId].resourceIds !== undefined && teamsResourceInfo[tId].resourceIds !== null) {
							isUpdate = true;
							if(teamsResourceInfo[tId].resourceIds.indexOf(rId) === -1){
								teamsResourceInfo[tId].resourceIds.push(rId);
							}
						} else{
							teamsResourceInfo[tId].orgId = orgId;
							teamsResourceInfo[tId].resourceIds = [rId];
							isUpdate = true;
						}
					});
				});
			});
		}
		
		if (isDelete) {
			data['delete'].forEach(function(d){
				d.resourceIds.forEach(function(rId){
					d.teamIds.forEach(function(tId){
						if (teamsResourceInfo[tId].resourceIds.length > 0) {
							isUpdate = true;
							teamsResourceInfo[tId].resourceIds.splice(teamsResourceInfo[tId].resourceIds.indexOf(rId),1);
						}
					});
				});
			});
		}
		
		if ( isUpdate !== true) {
			return cb('No update required', null);
		}
		
		async.forEach(Object.keys(teamsResourceInfo), function(teamResourceInfo, k){
			orgResourcePermission.upsertOrgResource(teamsResourceInfo[teamResourceInfo], function(err, result){
				if(err){
					logger.error('Error failed to upsert the org resource association for orgId : ' + orgId + ' teamId : '+ teamResourceInfo + ' err: ' + err);
					var e = {orgId: orgId, teamId : teamResourceInfo, err: err};
					errors.push(e);
					return k();
				}
				successes.push({orgId: orgId, teamId: teamResourceInfo});
				return k();
			});
		}, function (){
			if (errors.length > 0) {
				return cb(errors, successes);
			}
			
			return cb(null, successes);
		});
	});
}

function getResourceIdsByOrg(queryParameters, cb) {
	
	var query = {
			orgId : queryParameters.orgId,
			resourceType : queryParameters.resourceType
	};
	
	orgResourcePermission.find(query, function(err, orgResourceList){
		if (err) {
			return cb(err);
		}
		
		var teamIds = orgResourceList.map(function(orgResource){
			return orgResource.teamId;
		});
		
		d4dModelNew.d4dModelMastersTeams.find({
			orgname_rowid : queryParameters.orgId, 
			rowid : {$in:teamIds}, 
			id :'21'}, function(err, teamList){
				if (err) {
					return cb(err);
				}
				var botsId = {};
				
				orgResourceList.forEach(function(orgResource){
					orgResource.resourceIds.forEach(function(rId) {
						teamList.forEach(function(t){
							if (botsId[rId] === undefined) {
								botsId[rId] = {
									teamIds :[{teamId: t.rowid, teamName : t.teamname}]
								};
							} else {
								botsId[rId].teamIds = botsId[rId].teamIds.map(function(tId){
									if(tId.teamId !== t.rowid) {
										return {teamId: t.rowid, teamName : t.teamname};
									}
									
									return tId;
								});
							}
						});
					});
				});

				return cb(null, botsId);
		});
	});
}

//exports.upsertOrgResources = upsertOrgResources;
exports.updateOrgResources = updateOrgResources;
exports.getResourcesByOrgTeam = getResourcesByOrgTeam;
exports.getResourceIdsByOrg = getResourceIdsByOrg;