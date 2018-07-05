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


// This file act as a controller for nexus.

var nexus = require('_pr/lib/nexus.js');
var logger = require('_pr/logger')(module);
var Client = require('node-rest-client').Client;
var parser = require('xml2json');

module.exports.setRoutes = function(app, verificationFunc) {
    app.all('/nexus/*', verificationFunc);

    // Authenticate Nexus.
    app.post('/nexus/authenticate', function(req, res) {
    	logger.debug("Called nexus authenticate");
    	if(!req.body.hostname){
    		res.status(500).send("HostName can't be empty.");
    		return;
    	}
    	if(!req.body.username){
    		res.status(500).send("UserName can't be empty.");
    		return;
    	}
    	if(!req.body.nexuspassword){
    		res.status(500).send("Password can't be empty.");
    		return;
    	}
    	if(req.body.hostname.indexOf("http://") === -1){
    		res.status(500).send("Invalid hostname.");
    		return;
    	}
        nexus.authenticateNexus(req.body, function(data) {
            if (!data.length) {
                logger.debug("Nexus Authentication Failed: ");
                res.send(data);
                return;
            }else{
            	res.send(200,data);
            }
        });
    });

    app.get('/nexus/:anId/repositories',function(req,res){
    	logger.debug("Called nexus repositories..");
    	if(!req.params.anId){
    		res.status(500).send("Nexus Id can't be empty.");
    	}
    	nexus.getNexusRepositories(req.params.anId,function(err,repositories){
    		if(err){
    			logger.debug("Error while fetching nexus repositories.");
    			res.status(500).send("Error while fetching nexus repositories.");
    			return;
    		}
    		if(!repositories){
    			res.send(404,"There is no Nexus Server configured.");
    			return;
    		}
    		logger.debug("Got nexus repositories: ",JSON.stringify(repositories));
    		repositories = JSON.parse(repositories);
    		res.send(repositories.repositories.data['repositories-item']);
    	});
    });

	app.get('/nexus/userName/:userName/nexusPassword/:nexusPassword/repositories',function(req,res){
		logger.debug("Called nexus repositories..");
		if(!req.params.userName){
			res.status(500).send("Nexus User Name can't be empty.");
		}
		if(!req.params.nexusPassword){
			res.status(500).send("Nexus Password can't be empty.");
		}
		if(!req.query.hostName){
			res.status(500).send("Nexus Host Name can't be empty.");
		}
		var options_auth = {
			user: req.params.userName,
			password: req.params.nexusPassword
		};
		client = new Client(options_auth);
		var nexusUrl = req.query.hostName + '/service/local/repositories';
		client.registerMethod("jsonMethod", nexusUrl, "GET");
		var reqSubmit = client.methods.jsonMethod(function(data, response) {
			try {
				var json = parser.toJson(data);
				logger.debug("data: ", JSON.stringify(json));
				json = JSON.parse(json);
				res.send(json.repositories.data['repositories-item']);
			} catch (err) {
				logger.debug("Error while fetching nexus repositories.");
				res.status(500).send("Error while fetching nexus repositories.");
				return;
			}
		});
	});

    app.get('/nexus/:anId/repositories/:repoName/group/:groupId/artifact',function(req,res){
    	logger.debug("Called nexus repositories..");
    	if(!req.params.anId){
    		res.status(500).send("Nexus Id can't be empty.");
    	}
    	nexus.getNexusArtifact(req.params.anId,req.params.repoName,req.params.groupId,function(err,artifact){
    		if(err){
    			logger.debug("Error while fetching nexus artifact.");
    			res.status(500).send("Error while fetching nexus artifact.");
    			return;
    		}
    		if(!artifact){
    			res.send(404,"There is no Nexus Server configured.");
    			return;
    		}
    		logger.debug("Got nexus artifact: ",JSON.stringify(artifact));
    		res.send(artifact);
    	});
    });

    app.get('/nexus/:anId/repositories/:repoName/group/:groupId/artifact/:artifactId/versions',function(req,res){
    	logger.debug("Called nexus repositories..");
    	if(!req.params.anId){
    		res.status(500).send("Nexus Id can't be empty.");
    	}
    	nexus.getNexusArtifactVersions(req.params.anId,req.params.repoName,req.params.groupId,req.params.artifactId,function(err,versions){
    		if(err){
    			logger.debug("Error while fetching nexus artifact versions.");
    			res.status(500).send("Error while fetching nexus artifact versions.");
    			return;
    		}
    		if(!versions){
    			res.send(404,"There is no Nexus Server configured.");
    			return;
    		}
    		logger.debug("Got nexus artifact versions: ",JSON.stringify(versions));
    		res.send(versions);
    	});
    });

    // This endpoint will capture nexus repo url and update in knife.rb file
    app.post('/nexus/organization/:orgId/chef',function(req,res){
    	logger.debug("Called nexus url update knife.rb..");
    	nexus.updateNexusRepoUrl(req.params.orgId,req.body,function(err,data){
    		if(err){
    			logger.debug("Error: ",err);
    			res.status(500).send("Error got.");
    			return;
    		}
    		if(data){
    			res.send(data);
    			return;
    		}else{
    			res.send(404,"No data found.");
    			return;
    		}
    	});
    });

}
