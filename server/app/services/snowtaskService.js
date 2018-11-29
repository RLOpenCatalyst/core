var logger = require('_pr/logger')(module);
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");
var snowtask = require('../model/snowtask/snowtask');
var snowtaskService = module.exports = {};

var request = require('request');

var username = 'rle0496';
var password = 'Pass@1234';

var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

console.log(auth);
// Set the header

snowtaskService.saveSnowTask= function saveSnowTask(callback){



    var headers = {
        'Authorization':       auth,
        'Content-Type':     'application/json'
       
    }
    
    // Configure the request
    var options = {
        url: `https://ven01746.service-now.com/api/now/table/sc_task?sysparm_query=sys_created_onBETWEENjavascript%3Ags.dateGenerate('2018-04-16'%2C'00%3A10%3A00')%40javascript%3Ags.dateGenerate('2018-04-22'%2C'12%3A59%3A59')&sysparm_limit=10`,
        headers: headers
    }
    
    // getStart the request
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var data=[];
            var obj = JSON.parse(body);
            
          
            
            
                obj.result.forEach(function (item){
                    var myobj = { "number": item["number"],"sys_updated_by": item["sys_updated_by"],"sys_created_by":item["sys_created_by"],"short_description":item["short_description"],"sys_class_name":item["sys_class_name"],"sys_id":item["sys_id"]};
                    data.push(myobj);
             
                })  
                
                 
            

          // console.log(body.state);
            
            snowtask.createNew(data, function (err, response) {
                    if (err) {
                       callback(err,null);
                    }
                    else {
                        callback(null,response);
                    }
                });
            

        
    }
})
    
    
    
   
}