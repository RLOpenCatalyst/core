var AWS = require('aws-sdk');

var dim = 0;
dim = [ 
         {
            Name: 'Currency',
            Value: 'USD'
         }
       ];
module.exports = {
	getcost:function(access,secret,end,start,stat,next)
		{
			var cw = new AWS.CloudWatch({accessKeyId:access,secretAccessKey:secret,region: 'us-east-1'});
			var params = 
			{
	                    EndTime: end, /* required */
	                    MetricName: 'EstimatedCharges', /* required */
	                    Namespace: 'AWS/Billing', /* required */
	                    Period: 86400, /* required */
	                    StartTime: start, /* required */
	                    Statistics: [ /* required */
	                                   stat
	                                 /* more items */
        	                        ],
	                    Dimensions:dim ,
                	};
			 cw.getMetricStatistics(params, function(err, data) 
		         {
		              if (err) console.log(err, err.stack); // an error occurred
		              else
		              next(null,data.Datapoints[0]);
                         });
                    },

	getec:function(access,secret,reg,next)
		{
		      var ec2 = new AWS.EC2({accessKeyId:access,secretAccessKey:secret,region:reg});
		      var params = {
			      Filters:[{ Name : 'instance-state-name' , Values : ['running']}]
				};
	              ec2.describeInstances(params,function(err, data)
			{
		           if (err) return next(err, null);
		           next(null, data.Reservations.length);
		        });
		},

	gets3:function(access,secret,next)
		{
		     var s3 = new AWS.S3({accessKeyId:access,secretAccessKey:secret,region:'us-east-1'});
		     s3.listBuckets(function(err, data) 
			{
		                if (err) return next(err, null);
		                next(null, data.Buckets.length);
     		 	 });
		},

	getebs:function(access,secret,reg,next)
		{
                             var ec2 = new AWS.EC2({accessKeyId:access,secretAccessKey:secret,region:reg});
                
		             ec2.describeVolumes(function(err, data){
                                                   if (err) return next(err, null);
                                                    next(null,data.Volumes.length);
                              });
		},

	getip:function(access,secret,reg,next)
		{
                 var ec2 = new AWS.EC2({accessKeyId:access,secretAccessKey:secret,region:reg});

                 ec2.describeAddresses(function(err, data) {
                                                   if (err) return next(err, null);
                                                    next(null, data.Addresses.length);
                              });
		},

	getr53:function(access,secret,next)
		{
                 var route53 = new AWS.Route53({accessKeyId:access,secretAccessKey:secret,region:'us-east-1'});
                
		 route53.listHostedZones(function(err, data) {
                                                         if (err) return next(err, null);
                                                         next(null,data.HostedZones.length);
                 });
		}		

}
