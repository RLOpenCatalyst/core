
db = db.getSiblingDB('devops_new');
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

// db = db.getSiblingDB('devops_new');
// db.getCollection('botaudittrailsummaries').find().forEach(element => {
//    print(element.botID)
//    try {
//       botID=ObjectId(element.botID)
//       bot=db.getCollection('bots').findOne({_id:botID});
//    if(bot){
//     print(bot.id)
//     updatedAudit=db.getCollection('botaudittrailsummaries').update({botID:element.botID},{$set:{botID:bot.id}})
//    }else{
//     print('null');
//    }
//    }
//    catch(err){
//       print('already changed')
//    }
   
// });