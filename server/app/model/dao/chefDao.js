/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);
var mongoosePaginate = require('mongoose-paginate');

var Schema = mongoose.Schema;
var chefNodeSchema = new Schema({
    serverId:{
        type:String,
        requires:true,
        trim:true
    },
    orgId:{
        type:String,
        requires:true,
        trim:true
    },
    name: {
        type:String,
        requires:true,
        trim:true
    },
    platformId: {
        type:String,
        requires:true,
        trim:true
    },
    ip: {
        type:String,
        requires:false,
        trim:true
    },
    fqdn: {
        type:String,
        requires:false,
        trim:true
    },
    hardware:{
        os:String,
        os_version:String,
        platform:String,
        platform_version:String,
        platform_family:String,
        memory:{
            total:String,
            free:String
        }
    },
    state:{
        type:String,
        requires:false,
        trim:true
    },
    upTime: {
        type:String,
        requires:false,
        trim:true
    },
    idleTime:{
        type:String,
        requires:false,
        trim:true
    },
    envName:{
        type:String,
        required:false,
        trim:true
    },
    jsonClass:{
        type:String,
        required:false,
        trim:true
    },
    type:{
        type:String,
        required:false,
        trim:true
    },
    run_list:{
        type:[String],
        required:false
    },
    roles:{
        type:[String],
        required:false
    },
    updatedOn:{
        type:Number,
        required:false,
        default:Date.now
    },
    createdOn:{
        type:Number,
        required:false,
        default:Date.now
    },
    isDeleted:{
        type:Boolean,
        required:false,
        default:false
    }
});
chefNodeSchema.plugin(mongoosePaginate);
var chefNodes = mongoose.model('chefNode', chefNodeSchema);

var chefDao = function() {
    this.createNew = function(chefNodeDetails, callback) {
        var chefNode = new chefNodes(chefNodeDetails);
        chefNode.save(function(err, data) {
            if (err) {
                logger.error(err);
                callback(err,null);
            }else{
                callback(null, data);
            }
        });
    };

    this.getChefNodes = function(filterBy, callback) {
        chefNodes.find(filterBy,function(err, chefData) {
            if (err) {
                logger.error(err);
                return callback(err,null);
            }else{
                return callback(null, chefData);
            }
        });
    };


    this.removeTerminatedChefNodes = function(filterBy, callback) {
        chefNodes.update(filterBy,{state:'terminated',isDeleted:true},function(err, chefData) {
            if (err) {
                logger.error(err);
                callback(err,null);
            }else{
                callback(null, chefData);
            }
        });
    };

    this.removeChefNodes = function(filterBy, callback) {
        chefNodes.remove(filterBy,
            function(err, chefData) {
            if (err) {
                logger.error(err);
                callback(err,null);
            }else{
                callback(null, chefData);
            }
        });
    };

    this.updateChefNodeDetailById = function(chefNodeId,fields, callback) {
        chefNodes.update({
            _id: new ObjectId(chefNodeId)
        }, {
            $set: fields
        }, {
            upsert: false
        },function(err, data) {
            if (err) {
                logger.error(err);
                return callback(err,null);
            }else{
                return callback(null, data);
            }
        });
    };

    this.getChefNodesWithPagination = function(query,callback){
        query.queryObj.isDeleted = false;
        chefNodes.paginate(query.queryObj, query.options, function(err, nodes) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, nodes);
            }
        });
    };
}
module.exports = new chefDao();
