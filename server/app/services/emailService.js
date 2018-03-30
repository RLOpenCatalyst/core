var logger = require('_pr/logger')(module);
var nodeMailer = require('nodemailer');
var authEmail = require('_pr/model/dao/authemaildao');
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var AWS = require('aws-sdk');

var schedulerService = module.exports = {
    sendEmail: sendEmail,
    verifyEmail: verifyEmail
};

var config = {
    "aws": {
    "accessKeyId": "AKIAIFYR6Q3YHS6SAEFQ",
        "secretAccessKey": "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",
        "region": "us-east-1",
        "accountNumber": "549974527830"
    },
    "email": {
        "from": "rlc.support@relevancelab.com",
    }
}

function sendEmail(msg) {
    var dboptions = {
        host: process.env.DB_HOST || appConfig.db.host,
        port: appConfig.db.port,
        dbName: appConfig.db.dbName
    };
    mongoDbConnect(dboptions, function(err) {
        if (err) {
            logger.error("Unable to connect to mongo db >>" + err);
            throw new Error(err);
        } else {
            logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
        }
    });

    authEmail.findOne({
        category: 'failedbot'
    }, function (err, config) {
        if(err) logger.error(err);
        else if (config == null) logger.info('No email config found');
        else {
            sendSns(config);
        }
    })
}

function verifyEmail(emailId, callback) {
    var ses = new AWS.SES(config.aws);
    ses.verifyEmailIdentity({EmailAddress: emailId}, function(err, data) {
        if (err) {
            callback(err, null);
        }
        else {
            console.log(typeof callback);
            callback(null, data);
        }
    });
}

function sendSns(data) {
    var ses = new AWS.SES(config.aws);
    var params = {
        Destination: {
            ToAddresses: [
                data.to
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: data.body
                },
                Text: {
                    Charset: "UTF-8",
                    Data: data.body
                }
            },
            Subject: {
                Charset: "UTF-8",
                Data: data.subject
            }
        },
        Source: 'vmishra-consultant@scholastic.com',
    };
    ses.sendEmail(params, function(err, data){
        if(err) console.log(err);
        else {
            console.log(JSON.stringify(data));
        }
    });
}

sendEmail('Err');
/*
verifyEmail('vmishra-consultant@scholastic.com', function (err, data) {
    if(err) console.log(err);
    else console.log(data);
})*/
