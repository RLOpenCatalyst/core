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

var Schema = mongoose.Schema;
var containerAuditTrailSchema = new Schema({
    instanceIP: {
        type: String,
        trim:true
    },
    platformId: {
        type: String,
        trim:true
    },
    name: {
        type: String,
        unique: true,
        trim:true
    },
    Image:{
        type: String,
        trim:true
    },
    ImageId:{
        type: String,
        trim:true
    },
    platform:{
        type: String,
        trim:true
    },
    os:{
        type: String,
        trim:true
    }
});

containerAuditTrailSchema.statics.createNew = function(containerAuditTrailData) {
    var self = this;
    var containerAuditTrail = new self(containerAuditTrailData);
    return containerAuditTrail;
};

var containerAuditTrail = mongoose.model('containerAuditTrail', containerAuditTrailSchema);
module.exports = new containerAuditTrail();
