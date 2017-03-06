var botsNewService = require('./botsNewService.js');
var botsService = require('./botsService.js');
var async = require('async');

module.exports.allBots =  function(req,res) {
    var actionStatus = null,serviceNowCheck = false,data = null;
    if(req.query.actionStatus && req.query.actionStatus !== null){
        actionStatus = req.query.actionStatus;
    }
    if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
        serviceNowCheck = true;
    }
    async.parallel({
        oldbots:function(callback) {
            botsService.getBotsList(req.query,actionStatus,serviceNowCheck, callback);
        },
        newbots:function(callback) {
            botsNewService.getBotsList(req.query,actionStatus, callback);
        }
    },function(err,data) {
        if(err) {
            return res.status(500).send(err);
        }else {
            var bots =[], metaData ={},botSummary ={};
            var oldbots = data.oldbots;
            var newbots = data.newbots;
            if(oldbots.bots.length === 0 && newbots.bots.length === 0){
                bots = [];
                metaData['totalRecords'] = 0;
                metaData['pageSize'] = oldbots.metaData.pageSize;
                metaData['page'] = oldbots.metaData.page;
                metaData['totalPages'] = oldbots.metaData.page;
                metaData['sortBy'] = oldbots.metaData.sortBy;
                metaData['ortOrder'] = oldbots.metaData.sortOrder;
                
            }else if(oldbots.bots.length !== 0 && newbots.bots.length !== 0) {
                var recordCount = oldbots.metaData.totalRecords;
                for(var i = 0; i<recordCount; i++) {
                    bots.push(oldbots.bots[i]);
                    bots[i].isBotsNew = false;
                }
                recordCount = newbots.metaData.totalRecords;
                 for(var i = 0; i<recordCount; i++) {
                    bots.push(newbots.bots[i]);
                    bots[i].isBotsNew = true;
                }
                metaData['totalRecords'] = oldbots.metaData.totalRecords + newbots.metaData.totalRecords;
                metaData['pageSize'] = oldbots.metaData.pageSize;
                metaData['page'] = oldbots.metaData.page;
                metaData['totalPages'] = Math.ceil(metaData.totalRecords / metaData.pageSize);
                metaData['sortBy'] = oldbots.metaData.sortBy;
                metaData['sortOrder'] = oldbots.metaData.sortOrder;
            }else {
                if(oldbots.bots.length !== 0) {
                    var recordCount = oldbots.metaData.totalRecords;
                    for(var i = 0; i<recordCount; i++) {
                        bots.push(oldbots.bots[i]);
                        bots[i].isBotsNew = false;
                    }
                    metaData['totalRecords'] = oldbots.metaData.totalRecords;
                    metaData['pageSize'] = oldbots.metaData.pageSize;
                    metaData['page'] = oldbots.metaData.page;
                    metaData['totalPages'] = oldbots.metaData.totalPages;
                    metaData['sortBy'] = oldbots.metaData.sortBy;
                    metaData['sortOrder'] = oldbots.metaData.sortOrder;
                }else {
                    var recordCount = newbots.metaData.totalRecords;
                    for(var i = 0; i<recordCount; i++) {
                        bots.push(newbots.bots[i]);
                        bots[i].isBotsNew = true;
                    }
                    metaData['totalRecords'] = newbots.metaData.totalRecords;
                    metaData['pageSize'] = newbots.metaData.pageSize;
                    metaData['page'] = newbots.metaData.page;
                    metaData['totalPages'] = newbots.metaData.totalPages;
                    metaData['sortBy'] = newbots.metaData.sortBy;
                    metaData['sortOrder'] = newbots.metaData.sortOrder;
                }
            }
            botSummary['totalNoOfBots'] = oldbots.botSummary.totalNoOfBots + newbots.botSummary.totalNoOfBots;
            botSummary['totalSavedTimeForBots'] = {hours:oldbots.botSummary.totalSavedTimeForBots.hours + newbots.botSummary.totalSavedTimeForBots.hours,
                minutes:oldbots.botSummary.totalSavedTimeForBots.minutes + newbots.botSummary.totalSavedTimeForBots.minutes};
            botSummary['totalNoOfServiceNowTickets'] = oldbots.botSummary.totalNoOfServiceNowTickets + newbots.botSummary.totalNoOfServiceNowTickets;
            botSummary['totalNoOfRunningBots'] = oldbots.botSummary.totalNoOfRunningBots + newbots.botSummary.totalNoOfRunningBots;
            botSummary['totalNoOfFailedBots'] = oldbots.botSummary.totalNoOfFailedBots + newbots.botSummary.totalNoOfFailedBots;
        return res.status(200).send({bots:bots,metaData:metaData,botSummary:botSummary});
        }
    });
}

module.exports.botExecute = function botExecute(req,res) {
        var executionType = null;
        var reqBody = null;
        if(req.body.isBotsNew && req.body.isBotsNew) {
            reqBody = req.body.botsNewParams;
            if(req.query.executionType && req.query.executionType !== null){
                    executionType = req.query.executionType;
                }
            botsNewService.executeBots(req.params.botId,reqBody,req.session.user.cn,executionType,function (err, data) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    data.botId=req.params.botId;
                    return res.status(200).send(data);
                }
            });
            
        } else {
            if(req.body.category && req.body.category ==='Blueprints') {
                if (!req.body.envId) {
                    res.send(400, {
                        "message": "Invalid Environment Id"
                    });
                    return;
                }
                reqBody = {
                    userName: req.session.user.cn,
                    category: "blueprints",
                    permissionTo: "execute",
                    permissionSet: req.session.user.permissionset,
                    envId: req.body.envId,
                    monitorId: req.body.monitorId,
                    domainName: req.body.domainName,
                    stackName: req.body.stackName,
                    version: req.body.version,
                    tagServer: req.body.tagServer
                }
            }else{
                reqBody = {
                    userName: req.session.user.cn,
                    hostProtocol: req.protocol + '://' + req.get('host'),
                    choiceParam: req.body.choiceParam,
                    appData: req.body.appData,
                    tagServer: req.body.tagServer,
                    paramOptions:{
                        cookbookAttributes: req.body.cookbookAttributes,
                        scriptParams: req.body.scriptParams
                    }
                }
            }
            if(reqBody !== null) {
                botsService.executeBots(req.params.botId, reqBody, function (err, data) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        data.botId=req.params.botId;
                        return res.status(200).send(data);
                    }
                })
            }
        }    
    }
    