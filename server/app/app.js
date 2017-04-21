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


var express = require("express");
var app = express();
var path = require("path");
var http = require("http");
var https = require("https");
var fs = require('fs');
var childProcess = require('child_process');
var socketIo = require('_pr/socket.io');
var logger = require('_pr/logger')(module);
var expressLogger = require('_pr/logger').ExpressLogger();
var passport = require('passport');
var passportLdapStrategy = require('./lib/ldapPassportStrategy.js');
var passportADStrategy = require('./lib/adPassportStrategy.js');
var Tail = require('tail').Tail;

// express middleware
var expressCompression = require('compression');
var expressFavicon = require('serve-favicon');
var expressCookieParser = require('cookie-parser');
var expressSession = require('express-session');
var expressBodyParser = require('body-parser');
var multipart = require('connect-multiparty');
var expressMultipartMiddleware = multipart();
var appConfig = require('_pr/config');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(expressSession);
var mongoDbConnect = require('_pr/lib/mongodb');
var mongoose = require('mongoose');




logger.debug('Starting Catalyst');
logger.debug('Logger Initialized');
var LDAPUser = require('_pr/model/ldap-user/ldap-user.js');
var catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
LDAPUser.getLdapUser(function(err, ldapData) {
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

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
/*
var dboptions = {
    host: appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
*/
var dboptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongoDbConnect(dboptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        throw new Error(err);
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dboptions.host, dboptions.port, dboptions.dbName);
    }
});

var mongoStore = new MongoStore({
    mongooseConnection: mongoose.connection
}, function() {

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
    resave: false,
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
app.use(passport.initialize());
app.use(passport.session());

//app.use(app.router);

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
    authFunc: function(socket, next) {
        sessionMiddleware(socket.request, socket.request.res, next);
    }
});

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next();
});


logger.debug('Setting up application routes');
var routes = require('./routes/v1.0/routes.js');
var routerV1 = express.Router();
routes.setRoutes(routerV1);

app.use(routerV1);
app.use('/api/v1.0', routerV1);


logger.debug('setting up version 2 routes');
var routerV2 = require('./routes/v2.0');
app.use('/api/v2.0', routerV2);


app.use(function(req, res, next) {
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
    if (month < 10)
        month = '0' + month;
    logger.debug('file :' + __dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate());
    var tail;
    if (fs.existsSync(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate() + '.2'))
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate() + '.2'); //catalyst.log.2015-06-19
    else if (fs.existsSync(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate() + '.1'))
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate() + '.1'); //catalyst.log.2015-06-19
    else
        tail = new Tail(__dirname+'/logs/catalyst.log.' + dt.getFullYear() + '-' + month + '-' + dt.getDate()); //catalyst.log.2015-06-19
    tail.on('line', function(line) {
        socket.emit('log', line);
    });
});


var cronTabManager = require('_pr/cronjobs');
cronTabManager.start();
catalystSync.executeScheduledInstances();
catalystSync.executeSerialScheduledTasks();
catalystSync.executeParallelScheduledTasks();
catalystSync.executeScheduledBots();
catalystSync.executeNewScheduledBots();
server.listen(app.get('port'), function() {
    logger.debug('Express server listening on port ' + app.get('port'));
    require('_pr/services/noticeService.js').init(io,server.address());
    //require('_pr/services/noticeService.js').test();
});