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


var rdsResourceSchema = new Schema({
    _id:false,
    dbInstanceIdentifier: {
        type: String,
        required: true,
        trim: true
    },
    dbName: {
        type: String,
        required: true,
        trim: true
    },
    dbInstanceClass: {
        type: String,
        required: true,
        trim: true
    },
    dbEngine: {
        type: String,
        required: true,
        trim: true
    },
    dbInstanceStatus: {
        type: String,
        required: true,
        trim: true
    },
    dbInstanceCreatedOn: {
        type: Number,
        required: true,
        trim: true
    },
    dbEndpoint: Schema.Types.Mixed,
    dbAllocatedStorage: {
        type: Number,
        required: true,
        trim: true
    },
    vpcSecurityGroups: Schema.Types.Mixed,
    dbParameterGroups: Schema.Types.Mixed,
    region: {
        type: String,
        required: true,
        trim: true
    },
    dbSubnetGroup: Schema.Types.Mixed,
    latestRestorableTime: {
        type: Number
    },
    multiAZ: {
        type: Boolean,
    },
    engineVersion: {
        type: String,
        required: true,
        trim: true
    },
    autoMinorVersionUpgrade: Boolean,
    licenseModel: {
        type: String,
        required: true,
        trim: true
    },
    optionGroupMemberships: Schema.Types.Mixed,
    PubliclyAccessible: {
        type: Boolean,
    },
    storageType: {
        type: String,
        required: false,
        trim: true
    },
    storageEncrypted: {
        type: Boolean,
    },
    dbiResourceId: {
        type: String,
        required: true,
        trim: true
    },
    caCertificateIdentifier: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: Number,
        required: false
    }
});


rdsResourceSchema.statics.createNew = function(rdsData){
    var self = this;
    var rdsResources = new self(rdsData);
    return rdsResources;
};



var rdsResources = mongoose.model('rdsResources', rdsResourceSchema);
module.exports = rdsResources;