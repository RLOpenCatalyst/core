
//to Connect devops_new DB
db = db.getSiblingDB('devops_new');

// to  update auditId field as botId instead of mongo _id
db.getCollection('audittrails').find().forEach(element => {
   print(element.auditId)
   try {
      auditId=ObjectId(element.auditId)
      bot=db.getCollection('bots').findOne({_id:auditId});
   if(bot){
    print(bot.id)
    updatedAudit=db.getCollection('audittrails').update({_id:element._id},{$set:{auditId:bot.id}})
   }else{
    print('null');
   }
   }
   catch(err){
      print('already changed')
   }
   
});


// to  update auditId field as botId instead of mongo _id
botIds=db.getCollection("bots").distinct("id");
botIds.forEach(botId=>{
   print('botId  '+botId);
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
         print ('logs not found')
      }else{     
      for (i=0;i<uniq.length;i++){      
            element=uniq[i] 
            if(element.length==24){
            print('element  ' +element);
            updatedAudit=db.getCollection('audittrails').update({auditId:element},{$set:{auditId:botId}},{"multi":true})
            updatedlogs=db.getCollection("logs").update({"referenceId":element},{$set:{"referenceId.$":botId}},{"multi":true})
            print (updatedAudit);  
            print (updatedlogs)
            }else{
               print(element +'is not bot _id')
            }                          
            
         }
      }
})


// to Remove expired bots(non reproducible) audits records
auditIds=db.getCollection("audittrails").distinct("auditId").map(item=>{
   try {
      element=ObjectId(item);
      return item
   }catch(err){
      print ('already updated')
   }
}).filter(item=>{
   if(item != undefined || item != null ){
      return true;
   }
})
removed=db.getCollection('audittrails').remove({auditId:{$in:auditIds}})
print (removed)






