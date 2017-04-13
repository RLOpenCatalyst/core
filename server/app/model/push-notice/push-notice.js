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
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var noticeSchema = new Schema({
    user_id : {
        type: String,
        required: true
    },
    message:{
        title:{
            type: String,
            required: true
        },
        body: {
            type: String,
            required: false
        }
    },
    severity: {
        type:String,
        required:false
    },
    read_Flag: {
        type: Boolean,
        default: false,
        required: false
    },
    createdOn: {
        type: Number,
        default: Date.now()
    }
});
noticeSchema.plugin(mongoosePaginate);

noticeSchema.statics.createNew = function(noticedetails,callback){
    var noticedata = new notice(noticedetails);
    noticedata.save(function(err,data){
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null,data);
        }
    });
}
noticeSchema.statics.getAllNotices = function(user_id,callback) {
    notice.find({user_id:{$in:[user_id,'system']},read_Flag:false},{},{sort:{createdOn:-1}},function(err,noticeList){
        if(err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null,noticeList);
        }
    });
}

noticeSchema.statics.getAllNoticeWithPagination = function(filterQuey,callback) {
    notice.paginate(filterQuey.queryObj, filterQuey.options, function(err, noticeList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, noticeList);
    });
}

noticeSchema.statics.deleteNotice = function(userid,callback) {
    notice.remove({user_id:userid},function(err,data){
        if(err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null,data);
        }
    });
}

noticeSchema.statics.updateNotice = function(userid,callback) {
    notice.update({user_id:userid},{$set:{read_Flag:true}},{multi:true},function(err,data){
        if(err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }else {
            return callback(null,data);
        }
    });
}

var notice = mongoose.model('notice',noticeSchema);
module.exports = notice;