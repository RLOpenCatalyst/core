/**
 * Created by Durgesh Sharma on 26/2/16.
 */

'use strict';
var assert = require('assert');
var supertest = require("supertest");
var should = require("should");
var server = supertest.agent("http://localhost:3001");


describe("Unit Test Case for RL Catalyst ",function(){
    it("Check Application Version",function(done){
        server
            .get('/applications/latest/version')
            .end(function(err,res){
                console.log(res.body);
                assert.equal(res.status, 200);
                assert.equal(res.body.appVersion, '3.02.64');
                done();
            });
    });

    it("Check Login Details with existing User Account",function(done){
        server
            .post('/auth/signin')
            .send({username : '', pass : ''})
            .end(function(err,res){
                assert.equal(res.status, 302);
                assert.equal(res.redirect, true);
                assert.equal(res.text, 'Found. Redirecting to /private/index.html');
                done();
            });
    });


    it("Check Login Details with not existing User Account",function(done){
        server
            .post('/auth/signin')
            .send({username : 'Durgesh', pass : 'Durgesh@123'})
            .end(function(err,res){
                assert.equal(res.status, 302);
                assert.equal(res.redirect, true);
                assert.equal(res.text, 'Found. Redirecting to /public/login.html?o=try');
                done();
            });
    });

    it("Check User is exist or Not with non register Account",function(done){
        var user={
            'userName':'Durgesh',
            'passWord':'Sharma'
        };
        server
            .get('/auth/userexists/user')
            .end(function(err,res){
                assert.equal(res.status, 404);
                assert.equal(res.text, 'No Ldap User found.');
                done();
            });
    });


    it("Check LogOut Details",function(done){
        server
            .get('/auth/signout')
            .end(function(err,res){
                assert.equal(res.status, 302);
                assert.equal(res.redirect, true);
                assert.equal(res.text, 'Found. Redirecting to /public/login.html');
                done();
            });
    });

});

