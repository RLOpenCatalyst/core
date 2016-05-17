var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var schemaValidator = require('_pr/model/dao/schema-validator.js');

var awsCostAggregateSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.orgIdValidator
    },
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: {
        type: String,
        required: false,
        trim: true
    },
    projectId: {
        type: String,
        required: false,
        trim: true
    },
    instanceId: {
        type: String,
        required: false,
        trim: true
    },
    invoiceID:{
        type: String,
        require:true,
        trim:true
    },
    payerAccountId:{
        type: Number,
        require:true,
        trim:true
    },
    linkedAccountId:{
        type: Number,
        require:true,
        trim:true
    },
    recordType:{
        type: String,
        require:true,
        trim:true
    },
    recordId:{
        type: String,
        require:true,
        trim:true
    },
    productName:{
        type: String,
        require:true,
        trim:true
    },
    rateId:{
        type: Number,
        require:true,
        trim:true
    },
    subscriptionId:{
        type: Number,
        require:true,
        trim:true
    },
    pricingPlanId:{
        type: Number,
        require:true,
        trim:true
    },
    usageType:{
        type: String,
        require:true,
        trim:true
    },
    operation:{
        type: String,
        require:true,
        trim:true
    },
    availabilityZone:{
        type: String,
        require:false,
        trim:true
    },
    reservedInstance:{
        type: String,
        require:true,
        trim:true
    },
    itemDescription:{
        type: String,
        require:true,
        trim:true
    },
    usageStartDate:{
        type: Date,
        require:true,
        trim:true
    },
    usageEndDate:{
        type: Date,
        require:true,
        trim:true
    },
    usageQuantity:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    blendedRate:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    blendedCost:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    unBlendedRate:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    unBlendedCost:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    resourceId:{
        type: String,
        require:true,
        trim:true
    },
    resourceTags:{
        type: [String],
        require:true,
        trim:true
    },
    awsCostReportCreated:{
        type:Date,
        require:false,
        default:Date.now
    },
    awsCostReportUpdated:{
        type:Date,
        require:false,
        default:Date.now
    }
});
function getDecimalNumber(val) {
    return (val/1000000);
}
function setDecimalNumber(val) {
    return (val*1000000);
}

var awsCostAggregate = mongoose.model('awsCostAggregate', awsCostAggregateSchema);
module.exports = awsCostAggregate;