var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');

var OrgResourcePermissionSchema = new Schema({
	orgId : {
		type:String,
		required: true
	},
	teamId : {
		type:String,
		required:true
	},
	resourceType: {
		type: String,
		required : true
	},
	resourceIds:[{
		type: String
	}],
	createdDate:{
		type: Date,
		default: Date.now
	},
	modifiedDate : {
		type : Date,
		default: Date.now
	}
});

OrgResourcePermissionSchema.statics.upsertOrgResource = function upsertOrgResource(data, cb){
	
	var query = {
		orgId: data.orgId,
		teamId : data.teamId,
		resourceType : data.resourceType
	};
	
	OrgResourcePermission.find( query, function(err, result){
		if(err){
			return cb(err, null);
		}
		if (result.length == 1) {
			OrgResourcePermission.update( query, {$set: {resourceIds: data.resourceIds, modifiedDate: Date.now()}}, function(err, result){
				if (err){
					return cb(err, result);
				}
				
				return cb(null, result)
			});
		} else if(result.length == 0 ){
			var orgResourcePerm = new OrgResourcePermission(data);
			orgResourcePerm.save(function(err, result){
				if(err){
					return cb(err, null);
				}
				
				return cb(null, result);
			});
		} else {
			return cb(new Error('Multiple records for the orgId: ' + orgId + ' teamId: ' + teamId), null);
		}
	});
}

OrgResourcePermissionSchema.statics.findResourceListByOrgTeam = function findResourceListByOrgTeam(orgId, teamIds, resourceType, cb){
	var query = {};
	if (orgId !== null && orgId !== undefined ){
		query.orgId = orgId;
	}
	
	query.teamId = {
			$in : teamIds
	};
	
	query.resourceType = resourceType;
	OrgResourcePermission.find(query, function(err, result){
		if(err){
			return cb(err, null);
		}
		
		return cb(null, result);
	});
}

//OrgResourcePermissionSchema.methods.updateOrgBots = function updateOrgBots(orgId, teamId, data, cb){
//	OrgResourcePermission.update(query, {$set: {orgId:orgId, teamId: teamId, botIds: data}}, {upsert:true}, function(err, result){
//		if (err){
//			return cb(err, result);
//		}
//		
//		return cb(null, result)
//	});
//}

OrgResourcePermissionSchema.statics.deleteResource = function deleteResource(id, resourceType, cb){
	
	var query = {
		resourceIds:id,
		resourceType : resourceType
	};
	
	var errors = [];
	var successes = [];
	OrgResourcePermission.find( query, function(err, result){
		if(err){
			return cb(err, null);
		}
		
		result.forEach(function(r){
			r.resourceIds = r.resourceIds.filter(function(rId){
				return rId !== id;
			});
		});
		async.forEach(result, function(orgResource, k) {
			var updateQuery = {
					orgId : orgResource.orgId,
					teamId : orgResource.teamId,
					resourceType : resourceType
			};
			OrgResourcePermission.update(updateQuery, {$set:{resourceIds: orgResource.resourceIds}}, function(err, result){
				if(err){
					errors.push(err);
					return k(err);
				}
				
				successes.push(result);
				return k();
			});
		}, function(err){
			if(err){
				return cb(errors);
			}
			
			return cb(null,successes);
		});
	});
}

var OrgResourcePermission = mongoose.model('orgResourcePermission', OrgResourcePermissionSchema);
module.exports = OrgResourcePermission;