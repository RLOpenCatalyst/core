var logger = require('_pr/logger')(module);
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");
var snowtask = require('../model/snowtask/snowtask');
var appConfig = require('_pr/config');
var snowtaskService = module.exports = {};

var request = require('request');

var username = 's.kota@scholastic.com';
var password = 'Passw0rd';
var arr = [];

var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

console.log(auth);
// Set the header

snowtaskService.saveSnowTask = function saveSnowTask(query, startdiff, enddiff, callback) {

    console.log("Query=========", typeof query);
    var url = `https://scholasticdev.service-now.com/api/now/table/sc_task?`;

    switch (query.period) {
        case 'daily':
            console.log(" I am in daily");
            url = `${url}sysparm_query=sys_created_onBETWEENjavascript:gs.daysAgoStart(` + startdiff + `)@javascript:gs.daysAgoEnd(` + enddiff + `)^assignment_group=7d2a89b30a0a3cde01a870794dbb2d5c`
            console.log(url);
            break;
        case 'monthly':
            console.log(" I am in monthly");
            url = `${url}sysparm_query=sys_created_onBETWEENjavascript:gs.daysAgoStart(` + startdiff + `)@javascript:gs.daysAgoEnd(` + enddiff + `)^assignment_group=7d2a89b30a0a3cde01a870794dbb2d5c`
            console.log(url);
            break;
        case 'custom':
            console.log(" I am in custom");
            url = `${url}sysparm_query=sys_created_onBETWEENjavascript:gs.daysAgoStart(` + startdiff + `)@javascript:gs.daysAgoEnd(` + enddiff + `)^assignment_group=7d2a89b30a0a3cde01a870794dbb2d5c`
            console.log(url);
            break;
        default:
            break;
    }
    async.waterfall([
        function (next) {
            calculateTaskStatistics(url, next);
        },
        function (Sys_idarr, next) {
            fetchsys_id(Sys_idarr, next);
        },
        function (mappeddata, next) {
            mappingofSys_nameandGraph_data(mappeddata, next);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, results)
        return;
    });
}




function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function calculateTaskStatistics(url, callback) {
    var options = {
        url: url,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }
    var taskData = {};
    // getStart the request
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //Object create
            var obj = JSON.parse(body);
            obj.result.forEach(function (item) {
                if (item["assigned_to"].value) {
                    arr.push(item["assigned_to"].value);
                }
            })
            var unique = arr.filter(onlyUnique);
            taskData.unique = unique;
            var graph_data = {};
            for (var key of unique) {
                graph_data[key] = {
                    countOfOpen: 0,
                    countOfClose: 0,
                    countOfInprogress: 0
                };
            }

            obj.result.forEach(function (item) {
                if (item["state"] === "1" && item["assigned_to"].value) {
                    graph_data[item["assigned_to"].value].countOfOpen += 1;
                } else if (item["state"] === "3" && item["assigned_to"].value) {
                    graph_data[item["assigned_to"].value].countOfClose += 1;
                } else if (item["state"] === "2" && item["assigned_to"].value) {
                    graph_data[item["assigned_to"].value].countOfInprogress += 1;
                }
            })
            taskData.graph_data = graph_data;
            callback(null, taskData);
        } else {
            callback(error, null);
        }

    })

}
function fetchsys_id(taskData, callback) {
    var optionsforuser = {
        url: `https://scholasticdev.service-now.com/api/now/table/sys_user?sysparm_query=sys_idIN` + taskData.unique,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'
        }
    }
    var mappeddata = {};
    request.get(optionsforuser, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var obj = JSON.parse(body);
            var sys_name = {};
            obj.result.forEach(function (item) {
                if (taskData.unique.includes(item["sys_id"])) {
                    sys_name[item["sys_id"]] = item["name"];
                }
            })
            mappeddata.sys_name = sys_name;
            mappeddata.graph_data = taskData.graph_data;
            callback(null, mappeddata);
        } else {
            callback(error, null);
        }
    })
}
function mappingofSys_nameandGraph_data(mapped_data, callback) {

    var mappeddata = {};
    mappeddata.graph_data = {};
    var arropen = [];
    var arrclosed = [];
    var arrinprogress = [];

    var jsonobject = {};

    for (var keydata in mapped_data.graph_data) {
        for (var keydatasys_name in mapped_data.sys_name) {
            if (keydata === keydatasys_name) {
                mappeddata.graph_data[mapped_data.sys_name[keydatasys_name]] = mapped_data.graph_data[keydata];

            }
        }
    }
    console.log(mappeddata.graph_data);

    for (var key in mappeddata.graph_data) {
        console.log(mappeddata.graph_data[key].countOfOpen);
        arropen.push({
            x: key,
            y: mappeddata.graph_data[key].countOfOpen,
            key: 'open'

        });
        arrclosed.push({
            x: key,
            y: mappeddata.graph_data[key].countOfClose,
            key: 'closed'

        });
        arrinprogress.push({
            x: key,
            y: mappeddata.graph_data[key].countOfInprogress,
            key: 'inProgress'

        });

    }
    console.log(arropen);
    console.log(arrclosed);
    console.log(arrinprogress);

    jsonobject = {
        open: arropen,
        closed: arrclosed,
        inProgress: arrinprogress
    };
    callback(null, jsonobject);


}
