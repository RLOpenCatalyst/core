var orgResourcePermission = require('_pr/model/org-resource-permission/orgResourcePermission.js');
var logger = require('_pr/logger')(module);
var async = require('async');
var botDao = require('_pr/model/bots/1.1/bot.js');
var botService = require('_pr/services/botService.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');

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

		var isUpdateRequired = false;
		if(isAdd) {
			data.add.forEach(function(d){
				d.resourceIds.forEach(function(rId){
					d.teamIds.forEach(function(tId) {
						if(teamsResourceInfo[tId].resourceIds !== undefined && teamsResourceInfo[tId].resourceIds !== null) {
							if(teamsResourceInfo[tId].resourceIds.indexOf(rId) === -1){
								isUpdateRequired = true;
								teamsResourceInfo[tId].resourceIds.push(rId);
							}
						} else{
							teamsResourceInfo[tId].orgId = orgId;
							teamsResourceInfo[tId].resourceIds = [rId];
							isUpdateRequired = true;
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
							isUpdateRequired = true;
							teamsResourceInfo[tId].resourceIds.splice(teamsResourceInfo[tId].resourceIds.indexOf(rId),1);
						}
					});
				});
			});
		}
		
		if ( isUpdateRequired !== true) {
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

exports.updateOrgResources = updateOrgResources;
exports.getResourcesByOrgTeam = getResourcesByOrgTeam;
exports.getResourceIdsByOrg = getResourceIdsByOrg;