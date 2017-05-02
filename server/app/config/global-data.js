var auditQueue;
var auditQueueServices = module.exports = {};
auditQueueServices.init = function init(){
    auditQueue = [];
}
auditQueueServices.setAudit = function setAudit(auditQueueDetails) {
    auditQueue.push(auditQueueDetails);
};
auditQueueServices.getAudit = function getAudit() {
    return auditQueue;
};
auditQueueServices.getAuditDetails = function getAuditDetails(remoteAuditId) {
    return auditQueue.filter(function (value) { return value.remoteAuditId == remoteAuditId; })[0]
};
auditQueueServices.popAudit = function popAudit(botId) {
    auditQueue.splice(auditQueue.indexOf(auditQueue.filter(function(value) {return value.botId === botId})[0]),1)
};
auditQueueServices.incRetryCount = function incRetryCount(botId) {
    var index = auditQueue.indexOf(auditQueue.filter(function(value) {return value.botId === botId})[0]);
    auditQueue[index] += 1; 
}