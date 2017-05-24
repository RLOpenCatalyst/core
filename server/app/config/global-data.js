var auditQueue;
var gitSync;
var globalDataServices = module.exports = {};
globalDataServices.init = function init() {
    auditQueue = [];
    gitSync = [];
}

globalDataServices.setAudit = function setAudit(auditQueueDetails) {
    auditQueue.push(auditQueueDetails);
}

globalDataServices.getAudit = function getAudit() {
    return auditQueue;
}

globalDataServices.getAuditDetails = function getAuditDetails(fieldName, fieldValue) {
    return auditQueue.filter(function (value) { return value[fieldName] == fieldValue; })[0]
}

globalDataServices.popAudit = function popAudit(fieldName, fieldValue) {
    auditQueue.splice(auditQueue.indexOf(auditQueue.filter(function (value) { return value[fieldName] === fieldValue })[0]), 1)
}

globalDataServices.incRetryCount = function incRetryCount(fieldName, fieldValue) {
    var index = auditQueue.indexOf(auditQueue.filter(function (value) { return value[fieldName] === fieldValue })[0]);
    auditQueue[index].retryCount = auditQueue[index].retryCount + 1;
}

globalDataServices.setGit = function setGit(githubid) {
    gitSync.push({ gitId: githubid});
    return;
}
globalDataServices.getGit = function getGit(githubid) {
    return gitSync.filter(function (value){ return value[gitId] === githubid;})[0]
}
globalDataServices.unSetGit = function unSetGit(githubid) {
    gitSync.splice(gitSync.indexOf(gitSync.filter(function (value) { return value[gitId] === githubid })[0]), 1);
    return;
}