
//to Connect devops_new DB
db = db.getSiblingDB('devops_new');
print ("connected "+db)

print ('STEP-1 - updating auditId field as botId instead of mongo _id using audittrail collection')
// to  update auditId field as botId instead of mongo _id
ctr=0;
updatedCount=0

audittrailsAry=db.getCollection('audittrails').find();
print ('updation in progress Please wait for some time to complete ')
audittrailsAry.forEach(element=> {
   try {
      auditId=ObjectId(element.auditId)
      bot=db.getCollection('bots').findOne({_id:auditId});
   if(bot){
    updatedAudit=db.getCollection('audittrails').update({_id:element._id},{$set:{auditId:bot.id}})
    updatedCount++
   }else{
   }
   }
   catch(err){
   }
   ctr++;
   if (ctr === audittrailsAry.length) {
      print (updatedCount +' documents updated successfully')
   }
});
print("========STEP-1 Done=============")


print ('STEP-2 - updating auditId field as botId instead of mongo _id using logs collection')
// to  update auditId field as botId instead of mongo _id
ctr1=0
updatedCount1=0
botIds=db.getCollection("bots").distinct("id");
print ('updation in progress Please wait for some time to complete ')
botIds.forEach(botId=>{
         ids =db.getCollection("logs").find({"log":{$regex:".*"+botId+".*i"}},{referenceId:1}).map(e=>{
         try {
            element=ObjectId(e.referenceId[0]);
            return e.referenceId[0]
         }catch(err){
            return e.referenceId[1]
         }
      }).filter(item=>{
         if(item != undefined || item != null ){
            return true;
         }
      })
      uniq = [...new Set(ids)]
      if(!uniq || uniq.length==0){
      }else{     
      for (i=0;i<uniq.length;i++){      
            element=uniq[i] 
            if(element.length==24){
            updatedAudit=db.getCollection('audittrails').update({auditId:element},{$set:{auditId:botId}},{"multi":true})
            updatedlogs=db.getCollection("logs").update({"referenceId":element},{$set:{"referenceId.$":botId}},{"multi":true})
            ctr++
            }else{
            }                          
            
         }
      }
      ctr1++
      if (ctr1 === botIds.length) {
         print (updatedCount1 +' documents updated successfully')
      }
})
print("========STEP-2 Done=============")




// to Remove expired bots(non reproducible) audits records
print ('STEP-3 - Remove expired bots(non reproducible) audits records form autittrail collection')
print ('removing in progress please wit some time to complete')
auditIds=db.getCollection("audittrails").distinct("auditId").map(item=>{
   try {
      element=ObjectId(item);
      return item
   }catch(err){
   }
}).filter(item=>{
   if(item != undefined || item != null ){
      return true;
   }
})

removed=db.getCollection('audittrails').remove({auditId:{$in:auditIds}})
print (removed.nRemoved+' recordes removed from audittrails collection')
print("========STEP-3 Done===========")


print ('==================Script Execution Done===================')






