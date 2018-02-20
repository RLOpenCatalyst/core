var config = require('./config/catalyst-config.json');
var fs = require('fs');
var util = require('util')
var data= require('../node_modules/newrelic/newrelic.js').config;

(()=> {
  data.app_name[0] = config.newRelic.appName
  data.license_key = config.newRelic.licenseKey
  fs.writeFileSync('./newrelic.js', '\'use strict\' \n exports.config = ' + util.inspect(data) , 'utf-8')
})()
