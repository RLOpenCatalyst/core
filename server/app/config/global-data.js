var auditQueue;
var auditQueueServices = module.exports = {};
auditQueueServices.init = function init(){
    auditQueue = [];
}
auditQueueServices.setAudit = function setAudit(username,botId,bot_id,logRefId,auditId,auditTrailId,remoteAuditId,link,status,serverUrl) {
    auditQueue.push({
        userName:username,
        botId:botId,
        bot_id:bot_id,
        logRefId:logRefId,
        auditId:auditId,
        auditTrailId:auditTrailId,
        remoteAuditId:remoteAuditId,
        link:link,
        status:status,
        serverUrl:serverUrl});
};
auditQueueServices.getAudit = function getAudit() {
    return auditQueue;
}
auditQueueServices.getAuditDetails = function getAuditDetails(remoteAuditId) {
    return auditQueue.filter(function (value) { return value.remoteAuditId == remoteAuditId; })[0]
}
auditQueueServices.popAudit = function popAudit(botId) {
    auditQueue.splice(auditQueue.indexOf(auditQueue.filter(function(value) {return value.botId === botId})[0]),1)
}