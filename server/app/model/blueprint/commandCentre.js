var request = require('request');
var appConfig = require('_pr/config');

var ccServices = module.exports = {};

ccServices.createBusinessService = function(url, name, groupName, subGroupName,crCallback) {
                var options = {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    json: {
                        "url": url,
                        "name": name,
                        "group": groupName,
                        "sub_group": subGroupName,
                        "interval": appConfig.dboardConfig.interval,
                        "repeat_every": appConfig.dboardConfig.repeat_every
                    }
                }
                request.post(appConfig.dboardConfig.baseURl + appConfig.dboardConfig.servicePath, options, (error, resx, body) => {
                    if (error || resx.statusCode != 200)
                        return crCallback(error ? error : `Server throwing ${resx.statusCode}`, null);
                    else
                        return crCallback(null, body);
                })
}
