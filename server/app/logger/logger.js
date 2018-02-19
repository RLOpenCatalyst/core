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



var winston = require('winston');
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('util');
var events = require('events');


// init log folder now ...Will create if one does not exist already
var log_folder = path.normalize(__dirname+"/../logs");
mkdirp.sync(log_folder);

winston.emitErrs = true;

/**
 * Custom logger hat will append the current module name in front of each log
 */
var CatLogger = function(logger, calling_module){
    var exports = {};
    var methods = ["info", "debug", "warn", "error", "log"];

    events.EventEmitter.call(this);

    // We will modify the args we send to logger's log methods.
    // We want the file name as part of the logs !!
    function change_args(args){
        var label = '';
        if(calling_module && calling_module.filename){
            label = new Date().toISOString()+" [" + path.basename(calling_module.filename) + "] ";
            args[0]=label+args[0];
        }
        return args;
    }

    // add info,debug, warn, error, log method into exports
    methods.forEach(function(method){
        exports[method] = function(msg){
            var args = change_args(arguments);
            logger[method].apply(logger, args);
        };
    });

    return exports;
};

util.inherits(CatLogger,events.EventEmitter);
CatLogger.prototype.emitlog = function(data){
    this.emit("log",data);
}


/**
 * This is the single logger used for logging application level logs
 */
var logger = new winston.Logger({
    transports: [
        new winston.transports.DailyRotateFile({
            level: 'debug',
            datePattern: '.yyyy-MM-dd',
            filename: 'catalyst.log',
            dirname:log_folder,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: true,
            timestamp:true,
            name:'cat-file-log'
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
            name:'cat-console'
        })
    ],
    exitOnError: false
});

/**
 * The logger by express
 */
var express_logger = new winston.Logger({
    transports: [
        new winston.transports.DailyRotateFile({
            level: 'debug',
            datePattern: '.yyyy-MM-dd',
            filename: 'access.log',
            dirname:log_folder,
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: true,
            timestamp:true,
            name:'express-file-log'
        })
    ],
    exitOnError: false
});

/**
 * This is how application level loggers are created in a specific module.
 * This method is more efficient than returning one logger for each module.
 *
 * var logger = require('./lib/logger')(module);
 *
 * @param module - The the calling module.
 */
function create_logger(calling_module){
    return new CatLogger(logger, calling_module);
};// end create_logger

/**
 * Used to log Express Logs.Not to be used for anything else !!!!
 */
function create_express_logger(){
    return new CatLogger(express_logger);
};// end create_express_logger

module.exports = create_logger;
module.exports.ExpressLogger = create_express_logger;