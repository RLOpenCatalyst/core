/**
 * Created by Durgesh Sharma on 26/2/16.
 */

'use strict';
var assert = require('assert');
var supertest = require("supertest");
var should = require("should");
var xlsx = require('node-xlsx');
var util = require('util'),
    fs = require('fs');
var server = supertest.agent("http://localhost:3001");


before(function(done){
    server
        .post('/auth/signin')
        .send({username : 'superadmin', pass : 'superadmin@123'})
        .end(function(err,res){
            if (err) return done(err);
            done();
        });
})

/*describe("Blueprint Info ",function() {

    it("Blueprint Information  ", function (done) {
        server
            .get('/blueprints/57026274ae7109e261266bd0')
            .end(function (err, res) {
                console.log(res.body);
                console.log(res.status);
                done();
            });
    });
});*/


describe("Deploy Permission ",function(){

  /*  it(" Unmanaged Instances List with Pagination ",function(done){
        server
            .get('/providers/56f1459ec9f075275f4ea9be/unmanagedInstances?page=1&pageSize=5')
            .end(function(err,res){
                assert.equal(res.status, 200);
                assert.equal(res.body.length,5);
                done();
            });
    });*/


  /*  it(" Instance List ",function(done){
        server
            .get('/instances/instanceIds')
            .end(function(err,res){
                console.log(res.body);
                assert.equal(res.status, 200);
                done();
            });
    });*/

    it(" Save and Update deploy permission  ",function(done){
        var reqBody = {
            "appDeployData": {
            "applicationLastDeploy": "2016-05-30 09:54:56 +0000",
                "appLogs": "NA",
                "applicationName": "relevancelab/opensc-catalyst",
                "applicationVersion": "3.0.5",
                "applicationInstanceName": "opensc-catalyst",
                "applicationNodeIP": "54.153.97.239",
                "envId": "Dev",
                "hostName": "ip-10-0-0-181.us-west-1.compute.internal",
                "containerId": "DurgeshSharma",
                "applicationType": "Container",
                "applicationStatus": "Successful"
        }
        };
            server
            .post('/app-deploy')
            .send(reqBody)
            .end(function(err,res){
                console.log(res.body);
                assert.equal(res.status, 200);
                done();
            });
    });






   /* it(" Search Unmanaged Instances List based on Status ",function(done){
        server
            .get('/providers/56d41d26708c18ba15138941/unmanagedInstances?status=running')
            .end(function(err,res){
                assert.equal(res.status, 200);
                assert.equal(res.body.length,10);
                assert.equal(res.body[0].state,'running');
                done();
            });
    });*/

    /*it(" Search Unmanaged Instances List based on OS Type with pagination",function(done){
        server
            .get('/providers/56d41d26708c18ba15138941/unmanagedInstances?page=1&pageSize=8&osType=linux')
            .end(function(err,res){
                assert.equal(res.status, 200);
                assert.equal(res.body.length,8);
                assert.equal(res.body[0].os,'linux');
                done();
            });
    });*/

});

/*describe("Check Import by IP  ",function(){
    it(" Import By IP with with Request Body ",function(done){
        var obj = xlsx.parse(__dirname + '/data/dataSheets.xlsx');
        for(var i=0;i<(convertToJSON(obj[0].data)).length;i++) {
            var jsonData = convertToJSON(obj[0].data)[i];
            var reqBody = {
                "fqdn": jsonData.InstanceIP,
                "os": jsonData.InstanceType,
                "credentials": {
                    "username": jsonData.UserName,
                    "password": jsonData.Password
                },
                "configManagmentId": jsonData.ConfigManagID
            };
            var url = '/organizations/' + jsonData.OrgID + '/businessgroups/' + jsonData.BusGrpID + '/projects/' + jsonData.ProID + '/environments/' + jsonData.EnvID + '/addInstance';
            //console.log(reqBody);
            //console.log(url);
            server
                .post(url)
                .send(reqBody)
                .end(function (err, res) {
                    console.log(res.body);
                    assert.equal(res.body.orgId, jsonData.OrgID);
                    assert.equal(res.body.bgId, jsonData.BusGrpID);
                    assert.equal(res.body.projectId, jsonData.ProID);
                    assert.equal(res.body.envId, jsonData.EnvID);
                    assert.equal(res.body.instanceState, 'running');
                    assert.equal(res.status, 200);
                    done();

                });
        }

    });




});*/

function convertToJSON(array) {
    var first = array[0].join()
    var headers = first.split(',');

    var jsonData = [];
    for ( var i = 1, length = array.length; i < length; i++ )
    {

        var myRow = array[i].join();
        var row = myRow.split(',');

        var data = {};
        for ( var x = 0; x < row.length; x++ )
        {
            data[headers[x]] = row[x];
        }
        jsonData.push(data);

    }
    return jsonData;
};


