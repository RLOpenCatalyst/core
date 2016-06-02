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
var Schema = mongoose.Schema;

var RDSDBInstancesSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
    },
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: String,
    providerData: Schema.Types.Mixed,
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
    dbEngine:{
        type: String,
        required: true,
        trim: true
    },
    dbInstanceStatus: {
        type: String,
        required: true,
        trim: true
    },
    dbEndpoint:  Schema.Types.Mixed,
    dbAllocatedStorage: {
        type: Number,
        required: true,
        trim: true
    },
    createdOn:{
        type:Date,
        default:Data.now
    },
    vpcSecurityGroups:  Schema.Types.Mixed,
    dbParameterGroups:  Schema.Types.Mixed,
    region:  {
        type: String,
        required: true,
        trim: true
    },
    dbSubnetGroup: Schema.Types.Mixed,
    latestRestorableTime: {
        type:Date,
        default:Data.now
    },
    multiAZ: {
        type:Boolean,
    },
    engineVersion: {
        type: String,
        required: true,
        trim: true
    },
    AutoMinorVersionUpgrade: true,
    ReadReplicaDBInstanceIdentifiers: [],
    licenseModel: {
        type: String,
        required: true,
        trim: true
    },
    optionGroupMemberships: Schema.Types.Mixed,
    PubliclyAccessible: {
        type:Boolean,
    },
    StorageType: {
        type: String,
        required: true,
        trim: true
    },
    StorageEncrypted: {
        type:Boolean,
    },
    dbiResourceId: {
        type: String,
        required: true,
        trim: true
    },
    CACertificateIdentifier: {
        type: String,
        required: true,
        trim: true
    },

});

var RDSDBInstancesSchema = mongoose.model('rdsDbInstances', RDSDBInstancesSchema);
module.exports = RDSDBInstancesSchema;
