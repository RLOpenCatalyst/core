var logger = require('_pr/logger')(module);
var async = require("async");
var appConfig = require('_pr/config/snowconfig');
var snowtaskEmailService = module.exports = {};
var vega = require('vega')
var request = require('request');
var fs = require('fs')
var Promise = require('promise');
var csv = require("csvtojson");

var username = appConfig.username;
var password = appConfig.password;

var date = new Date();
var from = new Date(date.getFullYear(), date.getMonth(), 1);
var curmonth = date.getMonth();


var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');


// Set the header

snowtaskEmailService.saveSnowTask = function saveSnowTask(startdiff, enddiff, assignmentgroup, callback) {


    var urlfortask = `https://scholastic.service-now.com/api/now/table/sc_task?sysparm_query=sys_updated_onBETWEENjavascript:gs.daysAgoStart(` + startdiff + `)@javascript:gs.daysAgoEnd(` + enddiff + `)^assignment_group=` + assignmentgroup;
    var urlforincident = `https://scholastic.service-now.com/api/now/table/incident?sysparm_query=sys_updated_onBETWEENjavascript:gs.daysAgoStart(` + startdiff + `)@javascript:gs.daysAgoEnd(` + enddiff + `)^assignment_group=` + assignmentgroup;
    var option = "assigned_to";
    var urlBasedonOption = `https://scholastic.service-now.com/api/now/table/sys_user?sysparm_query=sys_idIN`;

    async.waterfall([

        function (next) {
            gettingTheTaskandIncidentForCurrentMonth(urlfortask, urlforincident, option, urlBasedonOption, next);
        },
        function (data, next) {
            gettingTheTaskandIncidentHalfyearly(data, option, assignmentgroup, next);
        },
        function (data, next) {
            readCategoryFromConfig(data, urlfortask, next);
        },
        function (taskandincidentdata, next) {
            fetchsys_idfortaskandIncident(taskandincidentdata, next);
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

// For getting unique value

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}



function gettingTheTaskandIncidentHalfyearly(taskandincidentData, option, assignmentgroup, callback) {
    async.waterfall([
        function (next) {
            calculateTaskStatisticsForPastSixMOnths(taskandincidentData, assignmentgroup, next);
        },
        function (taskandincidentData, next) {
            calculateIncidentStatisticsForPastSixMonths(taskandincidentData, option, assignmentgroup, next);
        },
        function (taskandincidentData, next) {
            calculatethefailedstatusBycallingScholastic(taskandincidentData, next)
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






// For Current Month

function gettingTheTaskandIncidentForCurrentMonth(urlfortask, urlforincident, option, urlBasedonOption, callback) {
    async.waterfall([
        function (next) {
            calculateTaskStatisticsforcurrentMonth(urlfortask, option, urlBasedonOption, next);
        },
        function (taskData, next) {
            calculateIncidentStatisticsforcurrentMonth(taskData, urlforincident, option, next);
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


function calculatethefailedstatusBycallingScholastic(taskandincidentdata, callback) {
    // Iterate array and make get api call (taskandincidentdata.arrforlastday)

    makepostrequest(appConfig.scholasticApi + "/auth/signin").then(function (token) {
        async.forEach(taskandincidentdata.arrforLastdayData, function (arritem, cb) {

            //appConfig[arritem.shortdescription].botid

            getRequest(appConfig.scholasticApi + "/bot/" + appConfig[arritem.shortdescription].botid + "/bot-history", token)
                .then(function (result) {
                    var obj = JSON.parse(result);
                    var flag = 0

                    obj.botHistory.forEach(function (item) {

                        if (item.auditTrailConfig.
                            serviceNowTicketRefObj.ticketNo === arritem.sysid) {
                            flag = 1;
                        }
                    })
                    if (flag === 1) {
                        arritem.reason = "Triggered but failed";
                    }
                    else {
                        arritem.reason = "Not Triggered";
                    }
                    // arritem.push(objforlastday);
                    cb();
                })


        }, function (err) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, taskandincidentdata);
            }

        })
    }).catch(function (err) {
        console.log("error detected" + err);
    })



}



function calculateTaskStatisticsforcurrentMonth(url, option, urlBasedonOption, callback) {



    var options = {
        url: url,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }


    var taskData = {};
    var arr = [];
    var countfailtask = 0;
    var countTask = Array(31).fill(0);
    var countofindividualBOT = [];
    var arrforFailedTaskCurrentMOnth = [];

    var countCurrentMonthTaskautomated = 0, countCurrentMonthTaskmanual = 0, countofCurrentMonthInboundTickets = 0;


    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {


            var obj = JSON.parse(body);

            var arrforlastday = [];


            obj.result.forEach(function (item) {
                if (item["closed_by"].value) {
                    arr.push(item["closed_by"].value);
                }
            })
            var unique = arr.filter(onlyUnique);

            taskData.unique = unique;
            var graph_data = {};

            // for success and failure runs we can add in the object only

            for (var key of unique) {
                graph_data[key] = {

                    countOfCloseTask: 0,
                    countOfCloseIncident: 0

                };
            }

            obj.result.forEach(function (item) {

                var isTerminate = item['short_description'].split(' ')[0];

                var objforcurrentMOnth = {};
                var index = new Date(item["sys_updated_on"]).getDate();
                console.log(index)
                // add condition for automation using short_description


                if (item["state"] === "3" && appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === true) {

                    if (countTask[index] == null || countTask[index] == undefined) { countTask[index] = 1; }

                    else { countTask[index]++; }
                }


                if (item["state"] === "3" && appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === true) {

                    graph_data[appConfig.TDMSBOTSysId].countOfCloseTask += 1;
                } else if (item["state"] === "3" && appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === false) {
                    graph_data[item["closed_by"].value].countOfCloseTask += 1;
                }

                if ((isTerminate === "Security" || isTerminate === "Terminate" || isTerminate === "Delete")) {
                    // objforlastday.name = appConfig[isTerminate].category
                    // objforlastday.tasknumber = data[i]["number"];
                    // objforlastday.shortdescription = isTerminate;
                    // objforlastday.sysid = data[i]["sys_id"];

                    // arrforlastday.push(objforlastday);
                    if (item["state"] != "3") {
                        countfailtask++
                    } else if (item["state"] === "3") {
                        countCurrentMonthTaskautomated++
                        graph_data[appConfig.TDMSBOTSysId].countOfCloseTask += 1;

                        if (countTask[index] == null || countTask[index] == undefined) { countTask[index] = 1; }

                        else { countTask[index]++; }
                    }
                    countofCurrentMonthInboundTickets++

                }



                if (appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === true && item["state"] != 3) {
                    objforcurrentMOnth.name = appConfig[item["short_description"]].category
                    objforcurrentMOnth.tasknumber = item["number"];
                    arrforFailedTaskCurrentMOnth.push(objforcurrentMOnth);

                    countfailtask++
                }

                if (appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === true && item["state"] === "3") {
                    // per BOT

                    // countofindividualBOT[appConfig[item["short_description"]]]++

                    countCurrentMonthTaskautomated++;
                }
                else if (appConfig[item["short_description"]] && appConfig[item["short_description"]].automated === false && item["state"] === "3") {
                    countCurrentMonthTaskmanual++;
                }




                //total tickets whose state is closed complete it can be manual or automated
                if (appConfig[item["short_description"]]) {
                    countofCurrentMonthInboundTickets++;
                }





            })

            console.log("automated Task" + countCurrentMonthTaskautomated);
            console.log("array current month" + countTask)
            taskData.arrforFailedTaskCurrentMOnth = arrforFailedTaskCurrentMOnth;
            taskData.graph_data = graph_data;
            taskData.urlBasedonOption = urlBasedonOption;
            taskData.countTask = countTask;
            taskData.countfailtask = countfailtask;

            taskData.countCurrentMonthTaskautomated = countCurrentMonthTaskautomated;
            taskData.countCurrentMonthTaskmanual = countCurrentMonthTaskmanual;
            taskData.countofCurrentMonthInboundTickets = countofCurrentMonthInboundTickets;


            callback(null, taskData);
        } else {
            callback(error, null);
        }

    })

}


//This function is for yearly

function calculateTaskStatisticsForPastSixMOnths(taskandincidentData, assignmentgroup, callback) {
    console.log("inside task");
    var diff = 0;
    var urlfortask = `https://scholastic.service-now.com/sc_task.do?CSV&sysparm_fields=sys_updated_on,state,assigned_to,short_description,number,closed_by,sys_id,assignment_group&sysparm_query=sys_updated_onBETWEENjavascript:gs.daysAgoStart(180)@javascript:gs.daysAgoEnd(0)^assignment_group=` + assignmentgroup;
    var options = {
        url: urlfortask,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }
    var arrforfailedtaskLastDay = []
    var arrforfailedTaskLastWeek = []
    var countTask = [];
    var arrforlastday = [];
    var resourcearraylastday = [];


    var countLastdayTaskautomated = 0, countlastdayTaskmanual = 0, countoffailtaskLastDay = 0, countoflastdayInboundTickets = 0;
    var countLastWeekTaskautomated = 0, countlastWeekTaskmanual = 0, countoffailtaskLastWeek = 0, countoflastweekInboundTickets = 0;

    var promise = new Promise(function (resolve, reject) {
        request.get(options, function (error, response, body) {
            if (error) reject(error);
            else resolve(response);
        }).pipe(fs.createWriteStream(__dirname + "/../../temp/task.csv"))
    });


    promise.then(function (value) {
        //  console.log(value);
        csv()
            .fromFile(__dirname + "/../../temp/task.csv")
            .then(function (data) { //when parse finished, result will be emitted here.
                for (var i = 0; i < data.length; i++) {
                    var objforlastday = {};
                    // here we will filter the last day data and week data

                    var isTerminate = data[i]['short_description'].split(' ')[0];
                    var check = new Date(data[i]["sys_updated_on"]);
                    var timeDiff = Math.abs(date.getTime() - check.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));



                    var index = new Date(data[i]["sys_updated_on"]).getMonth();

                    var currentMonth = new Date().getMonth();

                    if (new Date().getFullYear() === new Date(data[i]["sys_updated_on"]).getFullYear()) {
                        diff = currentMonth - index;
                    }
                    else {
                        diff = (12 + currentMonth) - index;
                    }

                    //&& (date.getDate() - check.getDate() === 1)
                    // Last day data
                    if (diffDays >= 1 && diffDays <= 2 && (date.getMonth() === check.getMonth()) && (date.getDate() - check.getDate() === 1)) {
                        console.log(check.getDate());
                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] === "Closed Complete") {

                            countLastdayTaskautomated++;
                        }
                        else if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === false && data[i]["state"] === "Closed Complete") {
                            countlastdayTaskmanual++;
                        }
                        // checking if assigned to is no one

                        if ((isTerminate === "Security" || isTerminate === "Terminate" || isTerminate === "Delete")) {

                            if (data[i]["state"] != "Closed Complete") {
                                objforlastday.name = appConfig[isTerminate].category
                                objforlastday.tasknumber = data[i]["number"];
                                objforlastday.shortdescription = isTerminate;
                                objforlastday.sysid = data[i]["sys_id"];

                                arrforlastday.push(objforlastday);
                                countoffailtaskLastDay++
                            } else if (data[i]["state"] === "Closed Complete") {
                                countLastdayTaskautomated++;
                            }

                            countoflastdayInboundTickets++;
                        }


                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] != "Closed Complete") {
                            objforlastday.name = appConfig[data[i]["short_description"]].category
                            objforlastday.tasknumber = data[i]["number"];
                            objforlastday.shortdescription = data[i]["short_description"];
                            objforlastday.sysid = data[i]["sys_id"];

                            arrforlastday.push(objforlastday);
                            countoffailtaskLastDay++


                        }

                        //total tickets whoe state is closed complete it can be manual or automated
                        if (appConfig[data[i]["short_description"]]) {
                            countoflastdayInboundTickets++;
                        }


                    }
                    else if (diffDays >= 1 && diffDays <= 2 && (date.getMonth() != check.getMonth()) && (check.getDate() === 31 || check.getDate() === 30)) {
                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] === "Closed Complete") {

                            countLastdayTaskautomated++;
                        }
                        else if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === false && data[i]["state"] === "Closed Complete") {
                            countlastdayTaskmanual++;
                        }
                        // checking if assigned to is no one

                        if ((isTerminate === "Security" || isTerminate === "Terminate" || isTerminate === "Delete")) {

                            if (data[i]["state"] != "Closed Complete") {
                                objforlastday.name = appConfig[isTerminate].category
                                objforlastday.tasknumber = data[i]["number"];
                                objforlastday.shortdescription = isTerminate;
                                objforlastday.sysid = data[i]["sys_id"];

                                arrforlastday.push(objforlastday);
                                countoffailtaskLastDay++
                            } else if (data[i]["state"] === "Closed Complete") {
                                countLastdayTaskautomated++;
                            }

                            countoflastdayInboundTickets++;
                        }


                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] != "Closed Complete") {
                            objforlastday.name = appConfig[data[i]["short_description"]].category
                            objforlastday.tasknumber = data[i]["number"];
                            objforlastday.shortdescription = data[i]["short_description"];
                            objforlastday.sysid = data[i]["sys_id"];

                            arrforlastday.push(objforlastday);
                            countoffailtaskLastDay++


                        }

                        //total tickets whoe state is closed complete it can be manual or automated
                        if (appConfig[data[i]["short_description"]]) {
                            countoflastdayInboundTickets++;
                        }

                    }
                    //  calculating automation statistics past week

                    if (diffDays >= 1 && diffDays <= 7) {
                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] === "Closed Complete") {

                            countLastWeekTaskautomated++;
                        }

                        else if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === false && data[i]["state"] === "Closed Complete") {
                            countlastWeekTaskmanual++;
                        }
                        // Checking for Terminate and Security

                        if ((isTerminate === "Security" || isTerminate === "Terminate" || isTerminate === "Delete")) {

                            if (data[i]["state"] != "Closed Complete") {


                                countoffailtaskLastWeek++
                            } else if (data[i]["state"] === "Closed Complete") {
                                countLastWeekTaskautomated++;

                            }


                            countoflastweekInboundTickets++
                        }


                        if (appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true && data[i]["state"] != "Closed Complete") {

                            countoffailtaskLastWeek++
                        }

                        if (appConfig[data[i]["short_description"]]) {
                            countoflastweekInboundTickets++;
                        }


                    }

                    // for past six months
                    if (data[i]["state"] === "Closed Complete" && (isTerminate === "Security" || isTerminate === "Terminate" || isTerminate === "Delete")) {
                        if (countTask[diff] == null || countTask[diff] == undefined) { countTask[diff] = 1; }
                        else {
                            countTask[diff]++;
                        }
                    }




                    if (data[i]["state"] === "Closed Complete" && appConfig[data[i]["short_description"]] && appConfig[data[i]["short_description"]].automated === true) {
                        if (countTask[diff] == null || countTask[diff] == undefined) { countTask[diff] = 1; }
                        else {
                            countTask[diff]++;
                        }
                    }

                }


                //Creating array for last day statistics

                //   var uniqueresourcelastday = resourcearraylastday.filter(onlyUnique);

                // console.log("resources" + uniqueresourcelastday)


                // taskandincidentData.uniqueresourcelastday = uniqueresourcelastday;
                taskandincidentData.countTaskHalfYearly = countTask;
                taskandincidentData.arrforLastdayData = arrforlastday
                taskandincidentData.countLastdayTaskautomated = countLastdayTaskautomated;
                taskandincidentData.countlastdayTaskmanual = countlastdayTaskmanual;
                taskandincidentData.countoffailtaskLastDay = countoffailtaskLastDay;
                taskandincidentData.countoflastdayInboundTasks = countoflastdayInboundTickets

                taskandincidentData.countLastWeekTaskautomated = countLastWeekTaskautomated;
                taskandincidentData.countlastWeekTaskmanual = countlastWeekTaskmanual;
                taskandincidentData.countoffailtaskLastWeek = countoffailtaskLastWeek;
                taskandincidentData.countoflastweekInboundTasks = countoflastweekInboundTickets;

                console.log("fail task last week" + countoffailtaskLastWeek)
                console.log(countTask);
                // console.log(")*&^" + JSON.stringify(taskandincidentData));
                callback(null, taskandincidentData);

            })


    }).catch((err) => {
        console.log(err);
    });
}

function calculateIncidentStatisticsforcurrentMonth(taskData, url, option, callback) {

    console.log("in incident");

    var options = {
        url: url,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }

    var arr = [];
    var countIncident = Array(31).fill(0);
    var countfailincident = 0;

    var countCurrentMonthIncidentautomated = 0, countCurrentMonthIncidentmanual = 0, countofCurrentMonthInboundIncident = 0;
    // var incidentarrforlastday = [];

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
            var uniqueforincident = arr.filter(onlyUnique);

            for (var key of uniqueforincident) {

                if (!taskData.graph_data[key]) {

                    taskData.unique.push(key);
                    taskData.graph_data[key] = {

                        countOfCloseTask: 0,
                        countOfCloseIncident: 0

                    };
                }
            }

            obj.result.forEach(function (item) {

                var isautomated = item['short_description'].split(' ')[0];

                var index = new Date(item["sys_updated_on"]).getDate();


                // Here just check for the Taleo condition
                if ((item["incident_state"] === "6" || item["incident_state"] === "7") && isautomated === "Taleo") {

                    // console.log(index);

                    if (countIncident[index] === null || countIncident[index] === undefined)
                        countIncident[index] = 1;
                    else countIncident[index]++;
                }

                if ((item["incident_state"] === "6" || item["incident_state"] === "7") && isautomated === "Taleo") {

                    taskData.graph_data[appConfig.TDMSBOTSysId].countOfCloseIncident += 1;
                } else if ((item["incident_state"] === "6" || item["incident_state"] === "7") && isautomated != "Taleo") {
                    taskData.graph_data[item["assigned_to"].value].countOfCloseIncident += 1;
                }



                if ((item["incident_state"] !== "6" && item["incident_state"] !== "7") && isautomated === "Taleo") {

                    // objforcurrentMOnth.name = appConfig[item["short_description"]].category
                    // objforcurrentMOnth.tasknumber = item["number"];
                    // arrforFailedTaskCurrentMOnth.push(objforcurrentMOnth);

                    countfailincident++
                }

                if (isautomated === "Taleo" && (item["incident_state"] === "6" || item["incident_state"] === "7")) {

                    countCurrentMonthIncidentautomated++;
                }
                else if ((item["incident_state"] === "6" || item["incident_state"] === "7") && isautomated != "Taleo") {
                    countCurrentMonthIncidentmanual++;
                }
                // checking if assigned to is no one


                //total tickets whoe state is closed complete it can be manual or automated
                // if ( data[i]["state"] != "Open" ) {
                countofCurrentMonthInboundIncident++;
                //   }





            })

            console.log("incident failed" + countfailincident);
            console.log("array current incident month" + countIncident)
            taskData.failincident = countfailincident;
            taskData.countIncident = countIncident;

            taskData.countCurrentMonthIncidentautomated = countCurrentMonthIncidentautomated;
            taskData.countCurrentMonthIncidentmanual = countCurrentMonthIncidentmanual;
            taskData.countofCurrentMonthInboundIncident = countofCurrentMonthInboundIncident;
            //  taskData.incidentarrforlastday = incidentarrforlastday;

            console.log(JSON.stringify(taskData));

            callback(null, taskData);
        } else {
            callback(error, null);
        }

    })

}



function calculateIncidentStatisticsForPastSixMonths(datas, option, assignmentgroup, callback) {
    console.log("inside incident");

    var arrforautomationStatisticsPastsixMonths = [];
    var arrtask = []
    var diff = 0;
    var arrincident = [];
    var month = [];
    var months = ["JAN", "FEB", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPT", "OCT", "NOV", "DEC"];
    //    var urlforincident = `https://scholastic.service-now.com/api/now/table/incident?sysparm_query=sys_updated_onBETWEENjavascript:gs.daysAgoStart(180)@javascript:gs.daysAgoEnd(1)^assignment_group=${appConfig.accessAndCompliance}^sysparm_default_exported_fields=all`;
    var downloadincidentCSV = `https://scholastic.service-now.com/incident.do?CSV&sysparm_fields=sys_updated_on,incident_state,assigned_to,short_description,number,sys_id,assignment_group&sysparm_query=sys_updated_onBETWEENjavascript:gs.daysAgoStart(180)@javascript:gs.daysAgoEnd(0)^assignment_group=` + assignmentgroup;

    var countLastdayIncidentautomated = 0, countlastdayIncidentmanual = 0, countoffailIncidentLastDay = 0, countoflastdayInboundIncident = 0;
    var countLastWeekIncidentautomated = 0, countlastWeekIncidentmanual = 0, countoffailIncidentLastWeek = 0, countoflastweekInboundIncident = 0;

    var options = {
        url: downloadincidentCSV,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }
    var countIncident = [];

    // var promise = new Promise(function (resolve, reject) {
    //     request.get(options, function (error, response, body) {
    //         if (error) reject(error);
    //         else resolve(response);
    //     }).pipe(fs.createWriteStream('./snowincident.json'))
    // });


    var promise1 = new Promise(function (resolve, reject) {
        request.get(options, function (error, response, body) {
            if (error) reject(error);
            else resolve(response);
            // console.log(response.body.length)
        }).pipe(fs.createWriteStream(__dirname + "/../../temp/incident.csv"))
    });

    promise1.then(function (value) {
        console.log(__dirname + "/../../temp/incident.csv")
        csv()
            .fromFile(__dirname + "/../../temp/incident.csv")
            .then(function (data) { //when parse finished, result will be emitted here.
                // console.log(data);
                for (var i = 0; i < data.length; i++) {
                    var check = new Date(data[i]["sys_updated_on"]);
                    var timeDiff = Math.abs(date.getTime() - check.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    var isautomated = data[i]['short_description'].split(' ')[0];
                    var index = new Date(data[i]["sys_updated_on"]).getMonth();
                    var objforlastday = {};
                    var currentMonth = new Date().getMonth();

                    if (new Date().getFullYear() === new Date(data[i]["sys_updated_on"]).getFullYear()) {
                        diff = currentMonth - index;
                        if (!month[diff]) {
                            month[diff] = months[index] + " " + new Date().getFullYear();
                        }

                    }
                    else {
                        diff = (12 + currentMonth) - index;
                        if (!month[diff]) {
                            month[diff] = months[index] + " " + new Date(data[i]["sys_updated_on"]).getFullYear();
                        }

                    }

                    if ((data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed") && isautomated === "Taleo") {
                        if (countIncident[diff] == null || countIncident[diff] == undefined) { countIncident[diff] = 1; }
                        else {
                            countIncident[diff]++;
                        }
                    }

                    // Last day data
                    if (diffDays >= 1 && diffDays <= 2 && (date.getMonth() === check.getMonth()) && (date.getDate() - check.getDate() === 1)) {
                        if (isautomated === "Taleo" && (data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {

                            countLastdayIncidentautomated++;
                        }
                        else if ((data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {
                            countlastdayIncidentmanual++;
                        }
                        // checking if assigned to is no one



                        if (data[i]["incident_state"] != "Resolved" && isautomated === "Taleo" && data[i]["incident_state"] !== "Closed") {
                            objforlastday.name = "Email Network Request"
                            objforlastday.tasknumber = data[i]["number"];
                            objforlastday.shortdescription = "Taleo";
                            objforlastday.sys_id = data[i]["sys_id"];

                            //here for taleo there will be one bot only

                            datas.arrforLastdayData.push(objforlastday);
                            countoffailIncidentLastDay++
                        }

                        //total tickets whoe state is closed complete it can be manual or automated
                        // if ( data[i]["state"] != "Open" ) {
                        countoflastdayInboundIncident++;
                        //   }


                    }
                    else if (diffDays >= 1 && diffDays <= 2 && (date.getMonth() != check.getMonth()) && (check.getDate() === 31 || check.getDate() === 30)) {

                        if (isautomated === "Taleo" && (data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {

                            countLastdayIncidentautomated++;
                        }
                        else if ((data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {
                            countlastdayIncidentmanual++;
                        }
                        // checking if assigned to is no one



                        if (data[i]["incident_state"] != "Resolved" && isautomated === "Taleo" && data[i]["incident_state"] !== "Closed") {
                            objforlastday.name = "Email Network Request"
                            objforlastday.tasknumber = data[i]["number"];
                            objforlastday.shortdescription = "Taleo";
                            objforlastday.sys_id = data[i]["sys_id"];

                            //here for taleo there will be one bot only

                            datas.arrforLastdayData.push(objforlastday);
                            countoffailIncidentLastDay++
                        }

                        //total tickets whoe state is closed complete it can be manual or automated
                        // if ( data[i]["state"] != "Open" ) {
                        countoflastdayInboundIncident++;
                    }
                    //  calculating automation statistics past week

                    if (diffDays >= 1 && diffDays <= 7) {
                        if (isautomated === "Taleo" && (data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {

                            countLastWeekIncidentautomated++;
                        }

                        else if ((data[i]["incident_state"] === "Resolved" || data[i]["incident_state"] === "Closed")) {
                            countlastWeekIncidentmanual++;
                        }
                        // Checking for Terminate and Security



                        if (isautomated === "Taleo" && data[i]["incident_state"] != "Resolved" && data[i]["incident_state"] != "Closed") {

                            countoffailIncidentLastWeek++
                        }

                        //  if ( data[i]["state"] != "Open" ) {
                        countoflastweekInboundIncident++;
                        // }


                    }





                }
                console.log(countIncident);

                for (var i = 0; i < countIncident.length; i++) {
                    arrtask.push({
                        x: month[i],
                        y: datas.countTaskHalfYearly[i],
                        c: 'task'

                    });
                    arrincident.push({
                        x: month[i],
                        y: countIncident[i],
                        c: 'incident'

                    });
                }
                for (var i = 0; i < arrtask.length; i++) {

                    arrforautomationStatisticsPastsixMonths.push(arrtask[i]);
                    arrforautomationStatisticsPastsixMonths.push(arrincident[i]);
                }

                writeBarChartToPng(arrforautomationStatisticsPastsixMonths, "automationstatisticspastSixmonths", "taskandincidentYaxisFilter");




                datas.countLastdayTicketautomated = datas.countLastdayTaskautomated + countLastdayIncidentautomated;
                datas.countlastdayTicketmanual = datas.countlastdayTaskmanual + countlastdayIncidentmanual;
                datas.countoffailTicketLastDay = datas.countoffailtaskLastDay + countoffailIncidentLastDay;
                datas.countoflastdayInboundTickets = datas.countoflastdayInboundTasks + countoflastdayInboundIncident

                datas.countLastWeekTicketautomated = datas.countLastWeekTaskautomated + countLastWeekIncidentautomated;
                datas.countlastWeekTicketmanual = datas.countlastWeekTaskmanual + countlastWeekIncidentmanual;
                datas.countoffailTicketsLastWeek = datas.countoffailtaskLastWeek + countoffailIncidentLastWeek;
                datas.countoflastweekInboundTickets = datas.countoflastweekInboundTasks + countoflastweekInboundIncident;

                console.log("fail incident last week" + countoffailIncidentLastWeek)

                console.log("total fail" + datas.countoffailTicketsLastWeek)
                console.log("=======" + JSON.stringify(datas))
                callback(null, datas);
            }).on('error', function (err) {
                console.log(err)
                callback(err, null);
            })

    });

}

function fetchsys_idfortaskandIncident(taskandincidentData, callback) {

    var jsonobjectForMail = {};
    var countofResolvedIncident = 0;
    var countofResolvedTask = 0;

    var sum_manual_avg = 0;

    var arrforUserTemplateTable = [];
    var arrforLastDaytableStatistics = [];
    var arrforLastWeektableStatistics = [];
    var arrforTotalStatisticsTable = [];

    // we will use this array to populate the upper table in template
    var arrforCurrentMonthtableStatistics = [];
    var countofresources = 0;
    var automationtotal = 0, manualtotal = 0;
    var botfteforLastDay = 0;

    // var date = new Date();

    // var curmonth = date.getMonth();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);


    var startdiffdays = calcBusinessDays(firstDay, date);



    var month = ["JAN", "FEB", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPT", "OCT", "NOV", "DEC"];
    var optionsforuser = {
        url: taskandincidentData.urlBasedonOption + taskandincidentData.unique,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'
        }
    }

    var mappedTaskandIncidentdata = {};
    mappedTaskandIncidentdata.graph_data = {};

    request.get(optionsforuser, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var obj = JSON.parse(body);
            var sys_name = {};
            obj.result.forEach(function (item) {
                if (taskandincidentData.unique.includes(item["sys_id"])) {


                    sys_name[item["sys_id"]] = item["name"];
                }
            })




            for (var keydata in taskandincidentData.graph_data) {
                for (var keydatasys_name in sys_name) {
                    if (keydata === keydatasys_name) {
                        mappedTaskandIncidentdata.graph_data[sys_name[keydatasys_name]] = taskandincidentData.graph_data[keydata];

                    }
                }
            }


            deleteUsersNotNeededInReport(mappedTaskandIncidentdata.graph_data);



            for (var key in mappedTaskandIncidentdata.graph_data) {

                countofResolvedIncident = countofResolvedIncident + mappedTaskandIncidentdata.graph_data[key].countOfCloseIncident;
                countofResolvedTask = countofResolvedTask + mappedTaskandIncidentdata.graph_data[key].countOfCloseTask;

                arrforUserTemplateTable.push({
                    name: key,
                    incidents: mappedTaskandIncidentdata.graph_data[key].countOfCloseIncident,
                    tasks: mappedTaskandIncidentdata.graph_data[key].countOfCloseTask,
                    total: (mappedTaskandIncidentdata.graph_data[key].countOfCloseTask) + (mappedTaskandIncidentdata.graph_data[key].countOfCloseIncident),
                    avgperday: Math.round(((mappedTaskandIncidentdata.graph_data[key].countOfCloseTask) + (mappedTaskandIncidentdata.graph_data[key].countOfCloseIncident)) / startdiffdays, 1)
                });

                countofresources++;

            }

            // we can add our code here to get the percentage automation

            // for (var key in arrforUserTemplateTable) {

            //     if (arrforUserTemplateTable[key].name === "TDMS AutoBOT") {
            //         var automationtotal = arrforUserTemplateTable[key].total;
            //         var avgtdms = arrforUserTemplateTable[key].avgperday;
            //     } else {
            //         manualtotal = manualtotal + arrforUserTemplateTable[key].total;
            //         sum_manual_avg = sum_manual_avg + arrforUserTemplateTable[key].avgperday;
            //     }

            // }


            automationtotal = taskandincidentData.countCurrentMonthIncidentautomated + taskandincidentData.countCurrentMonthTaskautomated;

            var passpercent = ((automationtotal) / (taskandincidentData.failincident + taskandincidentData.countfailtask + automationtotal)) * 100;
            var manualForCurrentMOnth = taskandincidentData.countCurrentMonthTaskmanual + taskandincidentData.countCurrentMonthIncidentmanual
            var botvsfteForcurrentMonth = (automationtotal / (manualForCurrentMOnth / (countofresources - 1)));
            //  console.log("fte" + botvsfteForcurrentMonth);
            arrforCurrentMonthtableStatistics.push({

                manual: manualForCurrentMOnth,
                BOTvsFTE: botvsfteForcurrentMonth.toFixed(0),
                failtaskandincident: taskandincidentData.failincident + taskandincidentData.countfailtask,
                automatedTickets: automationtotal,
                inboundTickets: (taskandincidentData.countofCurrentMonthInboundTickets + taskandincidentData.countofCurrentMonthInboundIncident)
            });


            // Here we are creating two arr for creating multi bar chart for tickets resolved each day
            creatingMultibarChartforCurrentmonthStatistics(taskandincidentData);
            // Final creation of object which we need in the email template


            //Creating array for last day and last week data for template

            //var percentautomationLastday = (taskandincidentData.countLastdayTicketautomated / taskandincidentData.countoflastdayInboundTickets) * 100;
            //var percentautomationLastWeek = (taskandincidentData.countLastWeekTicketautomated / taskandincidentData.countoflastweekInboundTickets) * 100;
            var passPercentLastday = (taskandincidentData.countLastdayTicketautomated / (taskandincidentData.countLastdayTicketautomated + taskandincidentData.countoffailTicketLastDay)) * 100;
            var passPercentLastWeek = (taskandincidentData.countLastWeekTicketautomated / (taskandincidentData.countLastWeekTicketautomated + taskandincidentData.countoffailTicketsLastWeek)) * 100;
            // add condition for bot vs fte if countlastday task manual is not equal to zero (infinity)
            if (taskandincidentData.countlastdayTicketmanual == 0) {
                botfteforLastDay = taskandincidentData.countLastdayTicketautomated
            } else {
                botfteforLastDay = (taskandincidentData.countLastdayTicketautomated / (taskandincidentData.countlastdayTicketmanual / (countofresources - 1))).toFixed(0)
            }


            arrforLastDaytableStatistics.push({

                manual: taskandincidentData.countlastdayTicketmanual,
                BOTvsFTE: botfteforLastDay,
                failtaskandincident: taskandincidentData.countoffailTicketLastDay,
                automatedTickets: taskandincidentData.countLastdayTicketautomated,
                inboundTickets: taskandincidentData.countoflastdayInboundTickets
            });

            // Look for Bot vs Fte
            arrforLastWeektableStatistics.push({

                manual: taskandincidentData.countlastWeekTicketmanual,
                BOTvsFTE: (taskandincidentData.countLastWeekTicketautomated / (taskandincidentData.countlastWeekTicketmanual / (countofresources - 1))).toFixed(0),
                failtaskandincident: taskandincidentData.countoffailTicketsLastWeek,
                automatedTickets: taskandincidentData.countLastWeekTicketautomated,
                inboundTickets: taskandincidentData.countoflastweekInboundTickets
            });



            jsonobjectForMail = {

                userTable: arrforUserTemplateTable,
                totalstatisticstable: arrforTotalStatisticsTable,
                currentmonth: month[curmonth],
                todaydate: date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear(),
                groupname: "Access and Compliance",
                resourcecount: countofresources,
                currentMonthstatisticstable: arrforCurrentMonthtableStatistics,
                failedTasksAndIncidentLastday: taskandincidentData.arrforLastdayData,
                lastdayTableStatistics: arrforLastDaytableStatistics,
                lastWeekTableStatistics: arrforLastWeektableStatistics,
                failedTasksandINcidentCurrentMonth: taskandincidentData.arrforFailedTaskCurrentMOnth
            };


            // Function for Creating Pie Chart for task and incident Inbound Statistics
            console.log(jsonobjectForMail)
            createPieChartForInboundTaskandIncident(taskandincidentData.countofCurrentMonthInboundIncident, taskandincidentData.countofCurrentMonthInboundTickets)


            callback(null, jsonobjectForMail);
        } else {
            callback(error, null);
        }
    })
}






function calcBusinessDays(dDate1, dDate2) { // input given as Date objects
    var iWeeks, iDateDiff, iAdjust = 0;
    if (dDate2 < dDate1) return -1; // error code if dates transposed
    var iWeekday1 = dDate1.getDay(); // day of week
    var iWeekday2 = dDate2.getDay();
    iWeekday1 = (iWeekday1 == 0) ? 7 : iWeekday1; // change Sunday from 0 to 7
    iWeekday2 = (iWeekday2 == 0) ? 7 : iWeekday2;
    if ((iWeekday1 > 5) && (iWeekday2 > 5)) iAdjust = 1; // adjustment if both days on weekend
    iWeekday1 = (iWeekday1 > 5) ? 5 : iWeekday1; // only count weekdays
    iWeekday2 = (iWeekday2 > 5) ? 5 : iWeekday2;

    // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
    iWeeks = Math.floor((dDate2.getTime() - dDate1.getTime()) / 604800000)

    if (iWeekday1 <= iWeekday2) {
        iDateDiff = (iWeeks * 5) + (iWeekday2 - iWeekday1)
    } else {
        iDateDiff = ((iWeeks + 1) * 5) - (iWeekday1 - iWeekday2)
    }

    iDateDiff -= iAdjust // take into account both days on weekend

    return (iDateDiff + 1); // add 1 because dates are inclusive
}





function createPieChartForInboundTaskandIncident(countofResolvedIncident, countofResolvedTask) {

    var arrforpiechart = [];


    arrforpiechart.push({

        browserFamily: "incident",
        percent: countofResolvedIncident
    });
    arrforpiechart.push({

        browserFamily: "task",
        percent: countofResolvedTask
    });

    writePieChartToPng(arrforpiechart, "TaskandIncident");
}

function creatingMultibarChartforCurrentmonthStatistics(taskandincidentData) {

    var arrtask = [];
    var arrincident = [];
    var month = ["JAN", "FEB", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPT", "OCT", "NOV", "DEC"];
    var arrforautomationStatisticsEachDay = []

    for (var i = 1; i <= date.getDate(); i++) {


        arrtask.push({
            x: i + "-" + month[curmonth],
            y: taskandincidentData.countTask[i],
            c: 'task'

        });
        arrincident.push({
            x: i + "-" + month[curmonth],
            y: taskandincidentData.countIncident[i],
            c: 'incident'

        });

    }

    // preparing this array for  the automation bar chart for every single day
    for (var i = 0; i < arrtask.length; i++) {

        arrforautomationStatisticsEachDay.push(arrtask[i]);
        arrforautomationStatisticsEachDay.push(arrincident[i]);
    }
    writeBarChartToPng(arrforautomationStatisticsEachDay, "automationstatisticseveryday", "taskandincidentYaxisFilter");
}


function deleteUsersNotNeededInReport(filteredMappeddata) {
    // Removing users which are not needed in the report
    for (var key in filteredMappeddata) {
        for (var i in appConfig.filterNames) {

            if (key === appConfig.filterNames[i]) {
                delete filteredMappeddata[key]
            }
        }

    }
}

// add unique in the url

function readCategoryFromConfig(data, url, callback) {
    var arrAutomated = [];
    var arrforTemplateTable = [];
    var arrManual = [];
    var arrclosed = [];
    var arrinprogress = [];

    var categoryPngGraph = {};

    var arrofobject = [];
    var arrforAutomatedAndManual = [];

    var options = {
        url: url,
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/json'

        }
    }

    var arr = [];

    // getStart the request
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var obj = JSON.parse(body);

            obj.result.forEach(function (item) {





                if (item['short_description']) {

                    if (appConfig[item["short_description"]]) {

                        var short_des = appConfig[item["short_description"]];

                        arr.push(short_des.category);
                    }
                }
            })
            // pushing SEcurity Termination is already there 
            arr.push('Add user to Security Group');


            var unique = arr.filter(onlyUnique);
            console.log("+++++" + unique)
            var graph_data = {};

            // in future if we want for closed or in progress state
            for (var key of unique) {
                graph_data[key] = {

                    countOfClose: 0,
                    countOfInprogress: 0,
                    automated: 0,
                    manual: 0
                };
            }

            obj.result.forEach(function (item) {
                var isTerminate = item['short_description'].split(' ')[0];

                if (isTerminate === "Terminate") {
                    if (item['state'] === '3') {
                        if (appConfig[isTerminate].automated === true && item['assigned_to'].value === appConfig.TDMSBOTSysId) {
                            graph_data['Termination'].automated += 1;
                        }
                        else {
                            graph_data['Termination'].manual += 1;
                        }
                    }



                }
                else if (isTerminate === "Security") {
                    if (item['state'] === '3') {
                        if (appConfig[isTerminate].automated === true && item['assigned_to'].value === appConfig.TDMSBOTSysId) {

                            graph_data['Add user to Security Group'].automated += 1;
                        }

                        else {
                            graph_data['Add user to Security Group'].manual += 1;
                        }
                    }

                }
                else if (appConfig[item["short_description"]]) {
                    if (item['state'] === '3') {
                        var value = appConfig[item["short_description"]]
                        if (value.automated === true && item['assigned_to'].value === appConfig.TDMSBOTSysId) {

                            graph_data[value.category].automated += 1;
                        } else {
                            graph_data[value.category].manual += 1;
                        }
                    }
                }
            })



            for (var key in graph_data) {




                arrAutomated.push({
                    x: key,
                    y: graph_data[key].automated,
                    key: 'automated'

                });

                arrManual.push({
                    x: key,
                    y: graph_data[key].manual,
                    key: 'manual'

                });


            }
            // creating object for png graph
            categoryPngGraph = {


                automated: arrAutomated,
                manual: arrManual
            };


            console.log("json" + JSON.stringify(categoryPngGraph));

            for (var i = 0; i < categoryPngGraph.automated.length; i++) {


                categoryPngGraph.automated[i]['c'] = "automated";
                categoryPngGraph.manual[i]['c'] = "manual";


                if (categoryPngGraph.automated[i].y != 0) {
                    arrforAutomatedAndManual.push(categoryPngGraph.automated[i])
                }
                if (categoryPngGraph.manual[i].y != 0) {
                    arrforAutomatedAndManual.push(categoryPngGraph.manual[i])
                }


            }
            // writeToPng(arrofobject, filter);
            // For Automation Report
            writeBarChartToPng(arrforAutomatedAndManual, "automation", "category");


            callback(null, data);


        } else {
            callback(error, null);
        }

    })

}

function writeBarChartToPng(arrofobject, filter, yaxisfilter) {

    var stackedBarChartSpec = require(__dirname + '/../../temp/stacked-bar-chart.spec.json');
    delete stackedBarChartSpec.data[0].values;
    stackedBarChartSpec.data[0]['values'] = arrofobject;
    if (yaxisfilter === "category")
        stackedBarChartSpec.axes[0]['title'] = "Automation";// Later we can change that
    else
        stackedBarChartSpec.axes[0]['title'] = "Automation";

    // create a new view instance for a given Vega JSON spec
    var view = new vega
        .View(vega.parse(stackedBarChartSpec))
        .renderer('none')
        .initialize();

    // generate static PNG file from chart
    view
        .toCanvas()
        .then(function (canvas) {
            // process node-canvas instance for example, generate a PNG stream to write var
            // stream = canvas.createPNGStream();
            console.log('Writing PNG to file...')
            fs.writeFile("./temp/" + filter + "stackedBarChart.png", canvas.toBuffer())
            console.log("./temp/" + filter + "stackedBarChart.png");
        })
        .catch(function (err) {
            console.log("Error writing PNG to file:")
            console.error(err)
        });
}

// we can remove this function later and the condition in the upper function to classify on 
// basis of pie chart and bar charts

function writePieChartToPng(arrofobject, filter) {

    var stackedPieChartSpec = require(__dirname + '/../../temp/stacked-pie-chart.spec.json');
    delete stackedPieChartSpec.data[0].values;
    stackedPieChartSpec.data[0]['values'] = arrofobject;

    // create a new view instance for a given Vega JSON spec
    var view = new vega
        .View(vega.parse(stackedPieChartSpec))
        .renderer('none')
        .initialize();

    // generate static PNG file from chart
    view
        .toCanvas()
        .then(function (canvas) {
            // process node-canvas instance for example, generate a PNG stream to write var
            // stream = canvas.createPNGStream();
            console.log('Writing PNG to file...')
            fs.writeFile("./temp/" + filter + "pieChart.png", canvas.toBuffer())
            console.log("./temp/" + filter + "pieChart.png");
        })
        .catch(function (err) {
            console.log("Error writing PNG to file:")
            console.error(err)
        });
}

function makepostrequest(url) {
    return new Promise((resolve, reject) => {


        var options = {
            method: 'POST',
            url: url,
            headers:
            {

                'content-type': 'application/json'
            },
            body:
            {
                username: appConfig.catalystUsername,
                pass: appConfig.catalystPassword,
                authType: 'token'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body.token);
            }
        });
    })

}

function getRequest(url, token) {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'GET',
            url: url,
            headers:
            {
                'content-type': 'application/json',
                'x-catalyst-auth': token
            }
        };

        request(options, function (error, response, body) {
            if (error) {
                throw new Error(error);
                reject(error);
            } else {
                console.log(body);
                resolve(body);
            }
        });
    })
}

