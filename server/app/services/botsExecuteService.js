var	botsNewService = require('./botsNewService.js');
var	botsService = require('./botsService.js');

module.exports.botExecute = function botExecute(req,res) {
        var executionType = null;
        var reqBody = null;
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
            if(req.body.scriptParams && req.body.scriptParams !=null){
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
            }else {
                if(req.query.executionType && req.query.executionType !== null){
                    executionType = req.query.executionType;
                }
                botsNewService.executeBots(req.params.botId,req.body,req.session.user.cn,executionType,function (err, data) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        data.botId=req.params.botId;
                        return res.status(200).send(data);
                    }
                });
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