/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const logger = require('_pr/logger')(module);
const runbook = require('../model/runbook/runbook');
const bots = require('../model/bots/1.1/bot');

var runbookService = module.exports = {};

runbookService.getRunbookYAML = function getRunbookYAML(callback) {

    runbook.find({},{
        "name": 1, "runbookYmlJson.bots_associated": 1,"runbookYmlJson.metadata.desc":1
    },function(err,data){
        if(err){
            console.log(err);
            callback(err,null)
        }
        else{
            callback(null,data);
        }
    })


}



runbookService.getRunbookBots = function getRunbookBots(runbookId,callback) {
   runbook.find({"_id":runbookId},{
       "runbookYmlJson.bots_associated.id": 1,"_id": 0
   },function(err,data){
       if(err){
           console.log(err,null)
       }else if(data.length>0){
           var ids=[];
           for (var i=0;i< data[0].runbookYmlJson.bots_associated.length;i++){
                ids.push(data[0].runbookYmlJson.bots_associated[i].id);
           }
           bots.find({id:{$in:ids}},{"id":1,"name":1,"input":1,"desc":1,"category":1},function(err,result){
               if(err){
                   console.log(err);
                   callback(err,null);
               }
               else{
                   callback(null,result);
               }
           })
       }
       else{
           callback(null,data);
       }
   })

}




runbookService.getRunbookCredentials = function getRunbookCredentials(runbookId,callback) {

 runbook.find({"_id":runbookId},{"runbookYmlJson.providers.name": 1,"_id": 0},function(err,credData){
     if(err){
         console.log(err);
         callback(err,null);
     }
     else{
         callback(null,credData);
     }
 })

}


runbookService.createNewOrUpdate = function createNewOrUpdate(){




}