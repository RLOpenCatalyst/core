

db = db.getSiblingDB('devops_new');
print ("connected "+db);
var botList=db.getCollection('bots').find({}).toArray();
var audittrails=db.getCollection('audittrails').find({}).toArray();

print ('No of bots found from bots collection '+botList.length);
print ('No of audits found from audittrails collection '+audittrails.length);
function manualExecutionBot(auditId) {
    for(let bot of botList) {
        if(bot.id == auditId)
            return bot.manualExecutionTime
    }
    return 0;
}

function getStartOfDay(date) {
    d = new Date(date);
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
    startHour =Date.UTC(year,month,day,0,0,0,0);
    return startHour;
}


function getFromData(summaryArr, obj) {
  var  index = summaryArr.findIndex(function (x) {
        return x.user == obj.user
            && x.botID == obj.botID
            && x.date == obj.date
    })
    return index;
}

botAuditTrailSummaryData = [];

for(i=0;i<audittrails.length;i++){
     audittrail=audittrails[i];
     manualExecution = manualExecutionBot(audittrail.auditId);
     summaryObj = {};
     startHour = getStartOfDay(audittrail.startedOn)
     summaryObj['user'] = audittrail.user;
     summaryObj['botID'] = audittrail.auditId;
     summaryObj['date'] = startHour;
     var index = getFromData(botAuditTrailSummaryData, summaryObj);
     if(index == -1) {
         successCount = 0;
         failedCount = 0;
         runningCount = 0;
         if(audittrail.actionStatus == 'success'){successCount++}
         else if(audittrail.actionStatus == 'failed') {failedCount++}
         else{runningCount++};
         summaryObj['successCount'] =successCount;
         summaryObj['failedCount'] = failedCount;
         summaryObj['runningCount'] = runningCount;
         summaryObj['timeSaved'] = ((manualExecution * 60 * 1000) - (audittrail.endedOn - audittrail.startedOn)) > 0 ? ((manualExecution * 60 * 1000) - (audittrail.endedOn - audittrail.startedOn)) : 0  ;
         botAuditTrailSummaryData.push(summaryObj);
     } else {
        summaryObj = botAuditTrailSummaryData[index];
        successCount = summaryObj.successCount;
        failedCount = summaryObj.failedCount;
        runningCount = 0;
        if(audittrail.actionStatus == 'success'){successCount++} 
        else if(audittrail.actionStatus == 'failed') {failedCount++}
        else{runningCount++} ;
        summaryObj['successCount'] =successCount;
        summaryObj['failedCount'] = failedCount;
        summaryObj['runningCount'] = runningCount;
        timeSaved = ((manualExecution * 60 * 1000) - (audittrail.endedOn - audittrail.startedOn)) > 0 ? ((manualExecution * 60 * 1000) - (audittrail.endedOn - audittrail.startedOn)) : 0
        summaryObj['timeSaved'] = summaryObj.timeSaved + timeSaved;
        botAuditTrailSummaryData[index] = summaryObj;
    }

}

upadated=0;
botAuditTrailSummaryData.forEach(function (batsData) {
var updatedDocs=db.getCollection("botaudittrailsummaries").update({
        botID: batsData.botID,
        user: batsData.user,
        date: batsData.date
    }, { $set: batsData}, { upsert: true});
    upadated+=updatedDocs.nModified +updatedDocs.nUpserted;
});
print (upadated +' Documents created in summary collection');
