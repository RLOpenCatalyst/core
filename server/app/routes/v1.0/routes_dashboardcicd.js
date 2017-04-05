var logger = require('_pr/logger')(module);
var url = require('url');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var client = new Client();

module.exports.setRoutes = function (app, sessionVerification){
	//var client = null;
	app.all('/dashboardcicd/*', sessionVerification);

	app.get('/dashboardcicd/collectors',function(req,res){
		//logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		//logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}

		durl = 'http://' + durl + '/api/dashboard/collectors';
		var client = new Client();
	//	client.registerMethod("jsonMethod", durl, "GET");
		//logger.debug('here :' + durl);
		client.get(durl,function (data, response) {
		logger.debug(data);
            res.send(JSON.stringify(data));
            client = null;
            return;
        });

        // // Handling Exception for nexus req.
        // reqSubmit.on('error', function (err) {
        //     logger.debug('Something went wrong on req!!');
        //     res.send('402');
        //     reqSubmit = null;
        // });
	});

	app.get('/dashboardcicd/collector/:colid',function(req,res){
		//logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		//logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}
		durl = 'http://' + durl + '/api/collector/' + req.params.colid;
		
		//client.registerMethod("jsonMethod", durl, "GET");
		//logger.debug('here :' + durl);
		client.get(durl,function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // // Handling Exception for nexus req.
        // reqSubmit.on('error', function (err) {
        //     logger.debug('Something went wrong on req!!');
        //     res.send('402');
        // });
	});

	app.post('/dashboardcicd/dashboard',function(req,res){
		//logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		//logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
	
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}
		var args = {
				data : JSON.parse(JSON.stringify(req.body)),
		        headers: {
		            "Content-Type": "application/json"
		        }
    	}


		durl = 'http://' + durl + '/api/dashboard';
		//var client = new Client();
		client.registerMethod("postMethod", durl, "POST");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.postMethod(args,function (data, response) {
            res.send(JSON.stringify(data));

            return;
        });

        //Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });

        
	});

	app.post('/dashboardcicd/setupdashboard/:dashid',function(req,res){
		 logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		// logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}
		var args = {
				data : JSON.parse(JSON.stringify(req.body)),
		        headers: {
		            "Content-Type": "application/json"
		        }
    	}
		durl = 'http://' + durl + '/api/setupdashboard/' + req.params.dashid;
		//var client = new Client();
		client.registerMethod("postMethod", durl, "POST");
		logger.debug('here :' + durl);
		var reqSubmit = client.methods.postMethod(args,function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // Handling Exception for nexus req.
        // reqSubmit.on('error', function (err) {
        //     logger.debug('Something went wrong on req!!');
        //     res.send('402');
        // });
	});

	app.delete('/dashboardcicd/dashboard/:dashid',function(req,res){
		// logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		// logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}
		var args = {
				data : JSON.parse(JSON.stringify(req.body)),
		        headers: {
		            "Content-Type": "application/json"
		        }
    	}
		durl = 'http://' + durl + '/api/dashboard/' + req.params.dashid;
		//var client = new Client();
		client.registerMethod("deleteMethod", durl, "DELETE");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.deleteMethod(args,function (data, response) {
			//logger.debug(response);
			if(data == "Internal error."){
				//No dashboard found with the ID.
				res.send('{"data":"No Dashboard Found."}');
			}
			else
            	res.send('200');
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });

        reqSubmit.on('requestTimeout', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('404');
        });
	});

	app.get('/dashboardcicd/dashboard/:dashid',function(req,res){
		// logger.debug("dashboardcicd header: ", req.headers['dashboard-url']);
		// logger.debug("dashboardcicd body: ", JSON.stringify(req.body));
		var durl = req.headers['dashboard-url'];
		if(!durl){
			res.send('404');
			return;
		}
		var args = {
				data : JSON.parse(JSON.stringify(req.body)),
		        headers: {
		            "Content-Type": "application/json"
		        }
    	}
		durl = 'http://' + durl + '/api/dashboard/' + req.params.dashid;
	//	var client = new Client();
		client.registerMethod("getMethod", durl, "GET");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.getMethod(args,function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // // Handling Exception for nexus req.
        // reqSubmit.on('error', function (err) {
        //     logger.debug('Something went wrong on req!!');
        //     res.send('402');
        // });
	});

};
