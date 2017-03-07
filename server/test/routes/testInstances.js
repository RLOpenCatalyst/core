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
var server = supertest.agent("http://d4d.rlcatalyst.com");


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

    /*it(" Save Git Hub  ",function(done){
        var reqBody = {
            "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
            "name": "RL-Bot-Library",
            "description": "RL-BOTs Factory",
            "repositoryName": "RLIndia/botsfactory",
            "isAuthenticated":true,
            "repositoryUserName": "Durgesh1988",
            "repositoryPassword": "Durgesh@123"

        };
            server
            .post('/git-hub')
            .send(reqBody)
            .end(function(err,res){
                console.log(res.body);
                assert.equal(res.status, 201);
                done();
            });
    });*/


   /* it(" Create A New Org ",function(done){
        var reqBody = {
            "orgname":"DurgeshOrg",
            "domainname":"Catalyst Organization",
            "plannedCost":"1800",
            "active":"true"
        };
        server
            .post('/d4dMasters/savemasterjsonrownew/1/null/DurgeshOrg')
            .send(reqBody)
            .end(function(err,res){
                console.log(res.body);
                assert.equal(res.status, 200);
                done();
            });
    });
*/


   it(" Delete A New Org ",function(done){
        server
            .get('/d4dMasters/removeitem/1/rowid/ef32efeb-5ce0-49bd-b7e2-66255e51e329')
            .end(function(err,res){
                assert.equal(res.status, 200);
                done();
            });
    });
    /*it(" Update Git Hub  ",function(done){
        var reqBody = {
            "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
            "name": "Bot-Library-Catalyst",
            "description": "BOTs Factory Catalyst",
            "repositoryName": "RLIndia/botsfactory",
            "isAuthenticated":true,
            "repositoryUserName": "Durgesh1988",
            "repositoryPassword": "Durgesh@123"

        };
        server
            .put('/git-hub/5864e1a67beeb0fd27591e23')
            .send(reqBody)
            .end(function(err,res){
                console.log(res);
                assert.equal(res.status, 200);
                done();
            });
    });

    it(" Delete Git Hub  ",function(done){
        server
            .delete('/git-hub/5864e1a67beeb0fd27591e23')
            .end(function(err,res){
                console.log(res);
                assert.equal(res.status, 200);
                done();
            });
    });*/






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


