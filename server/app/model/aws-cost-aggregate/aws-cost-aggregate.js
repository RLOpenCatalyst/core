var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var schemaValidator = require('_pr/model/dao/schema-validator.js');

var awsCostAggregateSchema = new Schema({
    /*orgId: {
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
    },*/
    InvoiceID:{
        type: String,
        require:true,
        trim:true
    },
    PayerAccountId:{
        type: String,
        require:true,
        trim:true
    },
    LinkedAccountId:{
        type: String,
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
        type: String,
        require:true,
        trim:true
    },
    SubscriptionId:{
        type: String,
        require:true,
        trim:true
    },
    PricingPlanId:{
        type: String,
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
        type: String,
        require:true,
        trim:true
    },
    UsageEndDate:{
        type: String,
        require:true,
        trim:true
    },
    UsageQuantity:{
        type: String,
        trim:true
    },
    BlendedRate:{
        type: String,
        trim:true
    },
    BlendedCost:{
        type: String,
        trim:true
    },
    UnBlendedRate:{
        type: String,
        trim:true
    },
    UnBlendedCost:{
        type: String,
        trim:true
    },
    ResourceId:{
        type: String,
        require:true,
        trim:true
    },
    ResourceTags:Schema.Types.Mixed,
    awsCostReportCreated:{
        type:Date,
        require:false,
        default:Date.now
    }
});

awsCostAggregateSchema.statics.createAWSCostByCSV = function(awsAggregateCostData, callback) {
    var awsCostAggregate = new AwsCostAggregation(awsAggregateCostData);
    awsCostAggregate.save(function(err, data) {
        if (err) {
            logger.error("createAWSCostByCSV Failed", err, awsAggregateCostData);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

function getDecimalNumber(val) {
    return (val/1000000);
}
function setDecimalNumber(val) {
    return (val*1000000);
}

var AwsCostAggregation = mongoose.model('awsCostAggregate', awsCostAggregateSchema);
module.exports = AwsCostAggregation;