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
}
auditQueueServices.getAuditDetails = function getAuditDetails(fieldName,fieldValue) {
    return auditQueue.filter(function (value) { return value[fieldName] == fieldValue; })[0]
}
auditQueueServices.popAudit = function popAudit(fieldName,fieldValue) {
    auditQueue.splice(auditQueue.indexOf(auditQueue.filter(function(value) {return value[fieldName] === fieldValue})[0]),1)
};
auditQueueServices.incRetryCount = function incRetryCount(fieldName,fieldValue) {
    var index = auditQueue.indexOf(auditQueue.filter(function(value) {return value[fieldName] === fieldValue})[0]);
    auditQueue[index] += 1;
}