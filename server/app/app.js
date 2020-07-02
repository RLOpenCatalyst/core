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

// Load application npm package
// require('@risingstack/trace');
require('newrelic')
const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require('fs');
const childProcess = require('child_process');

// Load application express-middleware
const expressCompression = require('compression');
const expressFavicon = require('serve-favicon');
const expressCookieParser = require('cookie-parser');
const expressSession = require('express-session');
const expressBodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const expressMultipartMiddleware = multipart();
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(expressSession);
const passport = require('passport');
const Tail = require('tail').Tail;

// Load application secret credentials
const appConfig = require('_pr/config');
const dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: process.env.DB_PORT || appConfig.db.port,
    dbName: process.env.DB_NAME || appConfig.db.dbName,
    ssl: process.env.DB_SSL || appConfig.db.ssl,
    enable_ssl: process.env.ENABLE_SSL || appConfig.db.enable_ssl,
    enable_auth: process.env.ENABLE_AUTH || appConfig.db.enable_auth,
    ssl_config:{
        "CAFile": process.env.CAFILE || appConfig.db.ssl_config.CAFile,
        "PEMFile": process.env.PEMFILE || appConfig.db.ssl_config.PEMFile
    },
    auth_config:{
        "username":process.env.USERNAME || appConfig.db.auth_config.username,
        "password":process.env.PASSWORD || appConfig.db.auth_config.password,
        "authenticated":process.env.authenticated || appConfig.db.auth_config.authenticated
    }
};

// Initialise the mongodb connections along with that mongoose ORM would be configure
const mongoDbConnect = require('_pr/lib/mongodb');
mongoDbConnect(dboptions, function (err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        throw new Error(err);
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});


// Load application customize package
const socketIo = require('_pr/socket.io');
const logger = require('_pr/logger')(module);
const expressLogger = require('_pr/logger').ExpressLogger();
const LDAPUser = require('_pr/model/ldap-user/ldap-user.js');
const botAuditTrailSummary = require('_pr/db-script/botAuditTrailSummarize');
const passportLdapStrategy = require('./lib/ldapPassportStrategy.js');
const passportADStrategy = require('./lib/adPassportStrategy.js');
const globalData = require('_pr/config/global-data.js');
const catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');

logger.debug('Starting Catalyst');
logger.debug('Logger Initialized');


LDAPUser.getLdapUser(function(err, ldapData) {
    console.log(JSON.stringify(ldapData))
    if (err) {
        logger.error("Failed to get ldap-user: ", err);
        return;
    }
    if (ldapData.length) {
        // setting up up passport authentication strategy
        var ldapUser = ldapData[0];
        passport.use(new passportLdapStrategy({
            host: ldapUser.host,
            port: ldapUser.port,
            baseDn: ldapUser.baseDn,
            ou: ldapUser.ou,
            usernameField: 'username',
            passwordField: 'pass'
        }));
    } else {
        logger.debug("No Ldap User found.");
    }
});


globalData.init();
var mongoStore = new MongoStore({
    mongooseConnection: mongoose.connection
}, function () {

});

app.set('port', process.env.PORT || appConfig.app_run_port);
app.set('sport', appConfig.app_run_secure_port);
app.use(expressCompression());
app.use(expressFavicon(__dirname + '/../../client/htmls/private/img/favicons/favicon.ico'));
app.use(expressCookieParser());

logger.debug("Initializing Session store in mongo");

var sessionMiddleware = expressSession({
    secret: 'sessionSekret',
    store: mongoStore,
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);


app.use(expressMultipartMiddleware);

// parse application/x-www-form-urlencoded
app.use(expressBodyParser.urlencoded({
    limit: '50mb',
    extended: true
}))

// parse application/json


app.use(expressBodyParser.json({
    limit: '50mb'
}))

//setting up passport
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


// app.use(app.router);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/*var options = {
    key: fs.readFileSync('rlcatalyst.key'),
    cert: fs.readFileSync('rlcatalyst.cert'),
    requestCert: true,
    rejectUnauthorized: false
}*/

var server = http.createServer(app);

//getting socket connection
var io = socketIo.getInstance(server, {
    log: false,
    authFunc: function (socket, next) {
        sessionMiddleware(socket.request, socket.request.res, next);
    }
});

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});

var loadIDP = function(cb){
    logger.debug("IDP to be read from:"+JSON.stringify(appConfig.authIdpConfig));
     if(appConfig.authIdpConfig && appConfig.authIdpConfig != ""){
    //     //check if the idpconfig file exists
        var _idp = {};
        logger.debug(appConfig.authIdpDir+appConfig.authIdpConfig);
   
            //File should exists load and update authIdpConfig
             appConfig.authIdpConfig = JSON.parse(fs.readFileSync(appConfig.authIdpDir+appConfig.authIdpConfig,{encoding:'utf8', flag:'r'}));
             logger.debug("Loaded IDP config file. About to use as Auth Strategy");
             logger.debug(JSON.stringify(appConfig.authIdpConfig));
            cb();
     
    }
    else{
        cb();
    }
   
    
}

var authStrategy = function(cb1){
    //cb1();
     loadIDP(function(){
         if(appConfig.authIdpConfig && appConfig.authIdpConfig != ""){
    //         //check if the idpconfig file exists
             var _idp = {};
    //         logger.debug(appConfig.authIdpConfig.strategy);
    //         cb1();
             if(appConfig.authIdpConfig.strategy.toLowerCase().trim() == "saml"){
    //             //read the cert file.
                 logger.debug("Reading cert from file : "+appConfig.authIdpConfig.saml.cert);
                 appConfig.authIdpConfig.saml.cert = fs.readFileSync(appConfig.authIdpDir+appConfig.authIdpConfig.saml.cert,{encoding:'utf8', flag:'r'});
                //logger.debug(JSON.stringify(appConfig.authIdpConfig));
                logger.debug("About to set passport strategy");
                
                require('./lib/samlPassportStrategy.js')(passport, appConfig.authIdpConfig.saml);
                //var samlstrategy = new SAMLPassportStrategy(passport, appConfig.authIdpConfig.saml);
                logger.debug("authenticate "+JSON.stringify(passport.authenticate));
                //samlstrategy.init();
                cb1();
            }
             else{
    //             //to do add other strategy. Until then resetting appConfig.authIdpConfig
                appConfig.authIdpConfig = null;
                cb1();
            }  
               
         }
       else{
             cb1();
         }
        
    });
}

authStrategy(function(){
    

    app.use(passport.initialize());
    app.use(passport.session());

    logger.debug('Setting up application routes');
    var routes = require('./routes/v1.0/routes.js');
    var routerV1 = express.Router();
    routes.setRoutes(routerV1,passport,appConfig.authIdpConfig);

    app.use(routerV1);
    app.use('/api/v1.0', routerV1);


    logger.debug('setting up version 2 routes');
    var routerV2 = require('./routes/v2.0');
    app.use('/api/v2.0', routerV2);

    

});

app.use(function (req, res, next) {
    if (req.accepts('json')) {
        var errorResponse = {
            'status': 404,
            'message': 'Not found'
        };
        res.send(errorResponse);
        return;
    }
});

var socketIORoutes = require('./routes/v1.0/socket.io/routes.js');
socketIORoutes.setRoutes(io);
io.set('log level', 1);
io.sockets.on('connection', function(socket) {
    var dt = new Date();
    var month = dt.getMonth() + 1;
    var currentDate = dt.getDate();
    if(currentDate < 10){
        currentDate = '0'+currentDate;
    }
    if (month < 10)
        month = '0' + month;
    logger.debug('file :' + __dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate);
    var tail;
    if (fs.existsSync(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate + '.2'))
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate + '.2'); //catalyst.log.2015-06-19
    else if (fs.existsSync(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate + '.1'))
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate + '.1'); //catalyst.log.2015-06-19
    else
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + currentDate); //catalyst.log.2015-06-19
    tail.on('line', function(line) {
        socket.emit('log', line);
    });
});

server.listen(app.get('port'), function () {
    logger.debug('Express server listening on port: ' + app.get('port'));
    require('_pr/services/noticeService.js').init(io,server.address());
    //require('_pr/services/noticeService.js').test();
});

var cronTabManager = require('_pr/cronjobs');
cronTabManager.start();
catalystSync.executeScheduledInstances();
catalystSync.executeSerialScheduledTasks();
catalystSync.executeParallelScheduledTasks();
catalystSync.executeScheduledBots();
catalystSync.executeNewScheduledBots();
catalystSync.getBotAuditLogData();
botAuditTrailSummary.createCronJob();


