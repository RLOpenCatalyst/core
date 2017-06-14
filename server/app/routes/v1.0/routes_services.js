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

var logger = require('_pr/logger')(module);
var serviceMapService = require('_pr/services/serviceMapService.js');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/services*', sessionVerificationFunc);

    app.get('/services', function(req, res) {
        serviceMapService.getAllServicesByFilter(req.query,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.get('/services/:serviceId', function(req, res) {
        serviceMapService.getServiceById(req.params.serviceId,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.get('/services/:serviceName/versions', function(req, res) {
        serviceMapService.getAllServiceVersionByName(req.params.serviceName,req.query,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.post('/services', function(req, res) {
        req.body.userName = req.session.user.cn;
        serviceMapService.createNewService(req.body,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.post('/services/:serviceId/resource/:resourceId/authentication', function(req, res) {
        var credentials = null;
        if(req.body.credentials){
            credentials =req.body.credentials;
        }else{
            var error =  new Error();
            error.code = 500;
            error.message = "There is no Credentials Details for Resource"
            res.send(error);
        }
        serviceMapService.resourceAuthentication(req.params.serviceId,req.params.resourceId,credentials,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(result.code,result)
                return
            }
        });
    });

    app.get('/services/:serviceId/resources', function(req, res) {
        serviceMapService.getServiceResources(req.params.serviceId,req.query,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.patch('/services/:serviceId', function(req, res) {
        serviceMapService.updateServiceById(req.params.serviceId,req.body,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });

    app.delete('/services/:serviceId', function(req, res) {
        serviceMapService.deleteServiceById(req.params.serviceId,function(err,result){
            if(err){
                res.send(500,err);
                return;
            }else{
                res.send(200,result)
                return
            }
        });
    });
};