var aws = require('./utils/awsservice.js');

var callservice = function()
{
  this.getcost = function(access,secret,next)
  {
  var end = new Date();
  var start = new Date(end.getTime() - (1000*60*60*6));
  var start1 = new Date(end.getTime() - (1000*60*60*24));
  var start2 = new Date(end.getTime() - (1000*60*60*24*2));
  var costOfMonth = 0,costOfDay = 0,costf = 0,costy=0, costOfYesterday = 0;
  var ec2 = 0 , s3 = 0, rds = 0, r53 = 0,ip = 0,ebs = 0;
  var regions = ['us-east-1','us-west-2','us-west-1','eu-west-1','eu-central-1','ap-southeast-1','ap-northeast-1','ap-southeast-2','sa-east-1'];

 for(var i = 0; i < regions.length; i++)
    {
      aws.getec(access,secret,regions[i],function(err,instance){ec2 +=(instance);});
      aws.getebs(access,secret,regions[i],function(err,instance){ebs +=(instance);});
      aws.getip(access,secret,regions[i],function(err,instance){ip +=(instance);});
    }
 
  aws.getcost(access,secret,end,start,'Maximum',function(err,cost){
    if(cost != null)
    costOfMonth = cost['Maximum'];
   }); 
 
 aws.getcost(access,secret,end,start1,'Minimum',function(err,cost){
     if(cost != null)
     costf = cost['Minimum'];
   });

    aws.gets3(access,secret,function(err,bucket){s3 = bucket;});
    aws.getr53(access,secret,function(err,routes){r53 += routes;});

  aws.getcost(access,secret,start1,start2,'Minimum',function(err,cost){
          if(costf != 0)
           costy = cost['Minimum'];
   });

    var vii = setInterval(function(){
    costOfDay = costOfMonth - costf;
    costOfYesterday = costf - costy;
    if(costOfDay < 0) costOfDay = 0;
    if(costOfYesterday < 0) costOfYesterday = 0;
    json = {"costOfMonth":costOfMonth,"costOfDay":Number(costOfDay.toFixed(2)),"costOfYesterday":costOfYesterday,"elasticCloudCompute" : ec2,"simpleStorageService" : s3, "elasticIP" : ip, "ebsVolumes" : ebs, "route53" : r53};
    next(null,json);
    clearInterval(vii);
    },12*1000);

  }
}


module.exports = new callservice();
