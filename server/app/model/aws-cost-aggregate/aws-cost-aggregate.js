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
    InvoiceID:{
        type: String,
        require:true,
        trim:true
    },
    PayerAccountId:{
        type: Number,
        require:true,
        trim:true
    },
    LinkedAccountId:{
        type: Number,
        require:true,
        trim:true
    },
    RecordType:{
        type: String,
        require:true,
        trim:true
    },
    RecordId:{
        type: String,
        require:true,
        trim:true
    },
    ProductName:{
        type: String,
        require:true,
        trim:true
    },
    RateId:{
        type: Number,
        require:true,
        trim:true
    },
    SubscriptionId:{
        type: Number,
        require:true,
        trim:true
    },
    PricingPlanId:{
        type: Number,
        require:true,
        trim:true
    },
    UsageType:{
        type: String,
        require:true,
        trim:true
    },
    Operation:{
        type: String,
        require:true,
        trim:true
    },
    AvailabilityZone:{
        type: String,
        require:false,
        trim:true
    },
    ReservedInstance:{
        type: String,
        require:true,
        trim:true
    },
    ItemDescription:{
        type: String,
        require:true,
        trim:true
    },
    UsageStartDate:{
        type: Date,
        require:true,
        trim:true
    },
    UsageEndDate:{
        type: Date,
        require:true,
        trim:true
    },
    UsageQuantity:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    BlendedRate:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    BlendedCost:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    UnBlendedRate:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    UnBlendedCost:{
        type: Number,
        default: 0,
        get: getDecimalNumber,
        set: setDecimalNumber
    },
    ResourceId:{
        type: String,
        require:true,
        trim:true
    },
    ResourceTags:{
        type: [String],
        require:true,
        trim:true
    },
    AwsCostReportCreated:{
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