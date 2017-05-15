var validate = require('express-validation');
var clientAppAccessValidator = require('_pr/validators/clientAppAccessValidator.js');
var clientAppAccessService = require('_pr/services/clientAppAccessService.js');
var tempAuthToken = require('_pr/model/temp-auth-token');
var util = require('util');
var logger = require('_pr/logger')(module);

module.exports.setRoutes = function(app, sessionVerification) {
    app.post('/client-app-access', validate(clientAppAccessValidator.create), sessionVerification, createApplicationAccess);

    function createApplicationAccess(req, res, next) {

        logger.debug('Calling createApplicationAccess', req.body);
        var bodyData = req.body;
        bodyData.sessionData = req.session.user;
        clientAppAccessService.createTransaction(bodyData, function(err, data) {
            if (err) {
                logger.error('Error occured while creating transaction ', err);
                return next(err);
            }

            res.status(200).send(data);
        });

    }

    app.get('/client-app-access/:transactionId', validate(clientAppAccessValidator.get), getTransaction);

    function getTransaction(req, res, next) {
        clientAppAccessService.getTransaction(req.params.transactionId, function(err, data) {
            if (err) {
                logger.error('Error occured getting bot transaction ', err);
                return next(err);
            }
         
            tempAuthToken.createNew(data.sessionData, function(err, tokenData) {
                if (err) {
                    logger.error('Error occured getting temporary auth token ', err);
                    return next(err);
                }
                //var base64 = new Buffer(JSON.stringify(data.params)).toString('base64');
                res.redirect(data.catalystUrl + '?Token=' + tokenData.token + '&BotName=id:'+data.params.botId+'&redirectUrl='+data.clientRedirectUrl);
            });
        });
    }
}