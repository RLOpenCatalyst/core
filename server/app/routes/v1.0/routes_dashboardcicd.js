var logger = require('_pr/logger')(module);
var url = require('url');
var fs = require('fs');
var Client = require('node-rest-client').Client;

module.exports.setRoutes = function (app, sessionVerification){
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
		client = new Client();
		client.registerMethod("jsonMethod", durl, "GET");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.jsonMethod(function (data, response) {
		logger.debug(data);
            res.send(JSON.stringify(data));
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });
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
		client = new Client();
		client.registerMethod("jsonMethod", durl, "GET");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.jsonMethod(function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });
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
		client = new Client();
		client.registerMethod("postMethod", durl, "POST");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.postMethod(args,function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });
	});

	app.post('/dashboardcicd/setupdashboard/:dashid',function(req,res){
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
		durl = 'http://' + durl + '/api/setupdashboard/' + req.params.dashid;
		client = new Client();
		client.registerMethod("postMethod", durl, "POST");
		//logger.debug('here :' + durl);
		var reqSubmit = client.methods.postMethod(args,function (data, response) {
            res.send(JSON.stringify(data));
            return;
        });

        // Handling Exception for nexus req.
        reqSubmit.on('error', function (err) {
            logger.debug('Something went wrong on req!!');
            res.send('402');
        });
	});

};
