var mongoose = require('mongoose');
var util = require('util');
var Schema = mongoose.Schema;

var ClientAppAccessSchema = new Schema({
    clientRedirectUrl: {
        type: String,
        required: true,
        trim: true
    },
    catalystUrl: {
        type: String,
        required: true,
        trim: true
    },
    params: {
        type: Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        requried: true,
        trim: true
    },
    createdTime: {
        type: Date,
        default: Date.now
    },
    modifiedDate: {
        type: Date,
        default: Date.now
    },
    sessionData: {
        type: Object,
        required: true
    }
});

var APP_ACCESS_STATUS  = {
    CREATED: 'created',
    USED: 'used'
};

ClientAppAccessSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    data.status = APP_ACCESS_STATUS.CREATED;
    var botTransaction = new self(data);
    botTransaction.save(function(err, data) {
        if (err) {
            return callback(err)
        }

        return callback(err, data);
    });
}

ClientAppAccessSchema.statics.findByTxnId = function findByTxnId(id, callback) {

    if (!mongoose.Types.ObjectId.isValid(id)) {

        return callback(new Error('Invalid id'));
    }

    this.findById(id, function(err, data) {
        if (err) {
            return callback(err);
        }

        return callback(null, data);
    });
}

ClientAppAccessSchema.statics.updateTransaction = function updateTransaction(id, callback) {
    this.update({
        _id: id
    }, {
        $set: {
            status: APP_ACCESS_STATUS.USED,
            modifiedDate: Date.now()
        }
    }, function(err, data) {

        if (err) {
            return callback(err);
        }

        return callback(null, data);
    });
}

var BotTransaction = mongoose.model('ClientAppAccess', ClientAppAccessSchema);

module.exports = BotTransaction;