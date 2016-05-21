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
    providerName:{
        type: String,
        required:true,
        trim:true
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
    payerAccountNumber:{
        type: String,
        require:true,
        trim:true
    },
    recordType:{
        type: String,
        require:true,
        trim:true
    },
    productName:{
        type: String,
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
    region:{
        type: String,
        require:false,
        trim:true
    },
    isReservedInstance:{
        type: String,
        require:true,
        trim:true
    },
    description:{
        type: String,
        require:true,
        trim:true
    },
    usageStartDate:{
        type: String,
        require:true,
        trim:true
    },
    usageEndDate:{
        type: String,
        require:true,
        trim:true
    },
    usageQuantity:{
        type: String,
        trim:true
    },
    blendedRate:{
        type: String,
        trim:true
    },
    blendedCost:{
        type: String,
        trim:true
    },
    ResourceTags:Schema.Types.Mixed,
    awsCostReportCreated:{
        type:Date,
        require:false,
        default:Date.now
    },
    instanceState:{
        type:String,
        trim:true,
        require:false
    },
    instanceType:{
        type:String,
        trim:true,
        require:false
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