var logger = require('_pr/logger')(module);
var nodeMailer = require('nodemailer');
var authEmail = require('_pr/model/dao/authemaildao');

var schedulerService = module.exports = {
    sendEmail: sendEmail
};

function sendEmail(msg) {
    authEmail.findOne({
        category: 'failedbot'
    }, function (err, config) {
        if(err) logger.error(err);
        else if (config == null) logger.info('No email config found');
        else {
            var transporter = nodeMailer.createTransport({
                host: config.smtpserver,
                port: 25
            });

            var mailOptions = {
                from: config.email,
                to: 'ritu.rai@relevancelab.com',
                subject: config.subject,
                text: config.body+msg,
                html: config.body+msg
            };

            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    logger.error(error);
                } else {
                    logger.info('Message sent: %s', info.messageId);
                }
            });
        }
    })
}


sendEmail();