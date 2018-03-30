var logger = require('_pr/logger')(module);
var nodeMailer = require('nodemailer');
var authEmail = require('_pr/model/dao/authemaildao');
var mongoDbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var AWS = require('aws-sdk');
var Cryptography = require('_pr/lib/utils/cryptography.js');

var schedulerService = module.exports = {
    sendEmail: sendEmail,
    verifyEmail: verifyEmail
};

function sendEmail(msg) {
    authEmail.findOne({
        category: 'failedbot'
    }, function (err, data) {
        if(err) logger.error(err);
        else if (data == null) logger.info('No email config found');
        else {
            sendSns(data);
        }
    })
}

function verifyEmail(emailId, callback) {
    authEmail.findOne({
        category: 'failedbot'
    }, function (err, data) {
        if(err) console.log(err);
        else {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var secretKey = cryptography.decryptText(data.secretkey, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var ses = new AWS.SES({
                "accessKeyId": data.accesskey,
                "secretAccessKey": secretKey,
                "region": data.region,
                "accountNumber": data.accountno
            });
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
    })
}

function sendSns(data) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var secretKey = cryptography.decryptText(data.secretkey, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var ses = new AWS.SES({
        "accessKeyId": data.accesskey,
        "secretAccessKey": secretKey,
        "region": data.region,
        "accountNumber": data.accountno
    });
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
        Source: data.from,
    };
    ses.sendEmail(params, function(err, data){
        if(err) console.log(err);
        else {
            console.log(JSON.stringify(data));
        }
    });
}
