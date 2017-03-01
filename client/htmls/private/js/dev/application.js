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

$(document).ready(function() {
    getAllApplicationData();
    $("#divapplicationtableview").hide();
    if ($('#chooseNexusServer :selected').text() == 'Choose Server') {
        $('.createTaskLinkUpgrade').attr('disabled', 'disabled');
    } else {
        $('.createTaskLinkUpgrade').removeAttr('disabled');
    }

    //for breadcrumb
    $('.Applications').click(function(e) {
        var getbreadcrumbul = $('#ribbon').find('.breadcrumb').find('li:lt(5)');
        var getbreadcrumbullength = getbreadcrumbul.length;
        var DummyBreadCrumb;
        if (getbreadcrumbullength > 0) {
            for (var counter = 0; counter < getbreadcrumbullength; counter++) {
                var getbreadcrumbulname = getbreadcrumbul[counter].innerHTML;
                if (DummyBreadCrumb != null && DummyBreadCrumb != "" && DummyBreadCrumb != "undefined") {
                    DummyBreadCrumb += '>' + getbreadcrumbulname;
                } else {
                    DummyBreadCrumb = getbreadcrumbulname;
                }
            }
            DummyBreadCrumb += '>' + 'Applications';

            if (DummyBreadCrumb != null && DummyBreadCrumb != 'undefined') {
                localStorage.removeItem("breadcrumb");
                splitBread = DummyBreadCrumb.split('>');
                if (splitBread.length > 0) {
                    $('#ribbon').find('.breadcrumb').find('li').detach();
                    for (var arraycount = 0; arraycount < splitBread.length; arraycount++) {
                        var liNew = document.createElement('li');
                        liNew.innerHTML = splitBread[arraycount];
                        $('#ribbon').find('.breadcrumb').append(liNew);
                    }
                }
            }
        }

    });

    function newAppDeployClickHandler(e) {
        $('#containerIdDiv').removeAttr('disabled');
        $('#upgradeValue').val("");
        $('.groupClass').hide();
        $('.containerIdClass').hide();
        $('.containerPortClass').hide();
        $('.repoUrlClass').hide();
        $('.artifactClass').hide();
        $('.versionClass').hide();

        $('#formUpgradeAppDeploy')[0].reset();
        resetSpinners();
        var $containerIdName = $('#containerIdInput').val('');
        if ($('#chooseNexusServer :selected').text() == 'Choose Server') {
            $('.createTaskLinkUpgrade').attr('disabled', 'disabled');
        } else {
            $('.createTaskLinkUpgrade').removeAttr('disabled');
        }
        $('.modaltitleforupgradeDeploy').hide();
        $('.modaltitleforNewDeploy').show();
        $('.saveUpgradeAppDeploy').hide();
        $('.saveNewAppDeploy').show();
        getNexusServer();
        getDockerServer();
        var $modal = $('#modalUpgradeAppDeploy');
        $modal.modal('show');
    }
    $('#defaultViewButtonNewDeploy').on('click', newAppDeployClickHandler);
});


getAllPipelineViewData();

function getAllPipelineViewData() {
    var urlParams = {};
    (window.onpopstate = function() {
        var url = window.location.href;
        var indexOfQues = url.lastIndexOf("?");
        if (indexOfQues != -1) {
            var sub = url.substring(indexOfQues + 1);
            var params = sub.split('&')
            for (var i = 0; i < params.length; i++) {
                var paramParts = params[i].split('=');
                urlParams[paramParts[0]] = paramParts[1];
            }
        }
    })();

    var projectId = urlParams.projid;

    $.get('/app/deploy/pipeline/project/' + projectId, function(dataPipeline) {
        if (dataPipeline.length) {
            var arrEnv = [];
            var arrPresentEnvSeq = [];
            var arrSequence = [];
            arrEnv.push({
                "title": 'App Details'
            });
            arrSequence.push('');
            arrPresentEnvSeq.push('');
            for (var i = 0; i < dataPipeline[0].envId.length; i++) {
                var envUniqueText = dataPipeline[0].envId[i];
                var obj = {
                    "title": envUniqueText
                };
                arrEnv.push(obj);
                arrPresentEnvSeq.push(envUniqueText);
            }
            for (var j = 0; j < dataPipeline[0].envSequence.length; j++) {
                var envUniqueText = dataPipeline[0].envSequence[j];
                arrSequence.push(envUniqueText);
            }
            if (arrSequence[dataPipeline[0].envSequence.length] && arrEnv[dataPipeline[0].envId.length]) {
                creationPipelineTableView(projectId, arrEnv, arrPresentEnvSeq);
            }

        } else {
            $.get('/d4dMasters/project/' + projectId, function(dataforenvName) {
                var individualenvName = dataforenvName[0].environmentname;
                individualenvName = individualenvName.split(",");
                var arrEnv = [];
                var arrSequence = [];
                arrEnv.push({
                    "title": 'App Details'
                });
                arrSequence.push('');

                for (var i = 0; i < individualenvName.length; i++) {
                    var envUniqueText = individualenvName[i];

                    var obj = {
                        "title": envUniqueText
                    };
                    arrEnv.push(obj);
                    arrSequence.push(envUniqueText);
                }

                console.log('array sequence');
                console.log(arrSequence);
                if (arrSequence[individualenvName.length]) {
                    creationPipelineTableView(projectId, arrEnv, arrSequence);
                }

            }).fail(function() {});
        }
    }).fail(function() {});
}

function creationPipelineTableView(projectId, arrEnv, arrSequence) {
    if(arrEnv.length && arrEnv.length > 1){
        $('.noAppEnvironment').hide();
        $('.noAppEnvironmentSelected').hide();
        $('#tableContainer').show();
        var $tableClone = $('.tableClone').clone();
        $tableClone.removeClass('tableClone');
        $('#tableContainer').empty().append($tableClone);
        $tableClone.DataTable({
            columns: arrEnv,
            "bSort": false,
            "aoColumnDefs": [{
                'bSortable': true,
                'aTargets': [1]
            }],
            "bAutoWidth": false,
            "bProcessing": true,
            "bDeferRender": true,
            "bFilter": true,
            "bLengthChange": true
        });
        $tableClone.addClass('margintop40');
        $tableClone.find('thead th').addClass('padding-left5per theadcolor');
        var $tableapplicationTest = $tableClone;
        var $tableapplicationTbody = $tableClone.find('tbody');
        $.get('/app/deploy/project/' + projectId + '/list', function(deployData) {

            var sorteddeployData = deployData;
            cmp = function(x, y) {
                return x > y ? 1 : x < y ? -1 : 0;
            };

            //sort name ascending then id descending
            deployData.sort(function(a, b) {
                //note the minus before -cmp, for descending order
                return cmp(
                    [cmp(a.applicationName, b.applicationName), -cmp(a.applicationVersion, b.applicationVersion)], [cmp(b.applicationName, a.applicationName), -cmp(b.applicationVersion, a.applicationVersion)]
                );
            });
            sorteddeployData.forEach(function(appDeployDataObj) {
                function createMainCard(applicationName, versionNumber) {
                    var tempStr = '';

                    var $mainCardTemplate = $('.mainCardTemplate');

                    var $mainCard = $mainCardTemplate.clone(true);
                    $mainCard.css({
                        display: 'inline-flex'
                    });

                    $mainCard.find('.applicationMainIP').html(applicationName);
                    $mainCard.find('.versionMain').html(versionNumber);

                    if (applicationName === "catalyst" || applicationName === "Catalyst") {
                        $mainCard.find('.mainImageHeight').attr("src", "img/rsz_logo.png");
                    } else {
                        $mainCard.find('.mainImageHeight').attr("src", "img/petclinic.png");
                    }

                    var $mainCardtemplateStr = $mainCard.prop('outerHTML');
                    tempStr = tempStr + $mainCardtemplateStr;
                    return tempStr;
                }

                function createStatusPresentCard(appDeployDataObj, indexofData) {
                    var tempStr = '';
                    var $childCardTemplate = $('.childCardTemplate');
                    var $childPresentCard = $childCardTemplate.clone(true);
                    $childPresentCard.css({
                        display: 'inline-flex'
                    });
                    
                    $childPresentCard.find('.applicationChildIP').html(appDeployDataObj.applicationNodeIP[indexofData]);
                    $childPresentCard.find('.lastapplicationDeploy').html(appDeployDataObj.applicationLastDeploy[indexofData]);
                    var appStatusCard = appDeployDataObj.applicationStatus[indexofData].toUpperCase();
                    if (appStatusCard === "SUCCESSFUL" || appStatusCard === "SUCCESSFULL" || appStatusCard === "SUCCESS") {
                        $childPresentCard.find('.imgHeight').attr("src", "img/aws_logo_started.png");
                        $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary btn-danger').addClass('btn-success');

                    } else {
                        $childPresentCard.find('.imgHeight').attr("src", "img/aws_logo_stopped.png");
                        $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary btn-success').addClass('btn-danger');
                    }
                    $childPresentCard.find('.applicationEnvNamePipelineView').html(appDeployDataObj.envId[indexofData]);
                    var $childCardtemplateStr = $childPresentCard.prop('outerHTML');
                    tempStr = tempStr + $childCardtemplateStr;
                    finalArray.push(tempStr);
                };


                function sortAscending(data_A, data_B) {
                    data_A = convertToDateObj(data_A);
                    data_B = convertToDateObj(data_B);
                    return (data_B - data_A);
                }
                var finalArray = [];
                var applicationName = appDeployDataObj.applicationName;
                var versionNumber = appDeployDataObj.applicationVersion;
                var applicationEnvList = appDeployDataObj.envId;


                var sortedappdataList = [];
                var unsortedappdataList = [];
                var indexedList = [];

                for (var j = 0; j < applicationEnvList.length; j++) {
                    sortedappdataList.push(appDeployDataObj.applicationLastDeploy[j]);
                    unsortedappdataList.push(appDeployDataObj.applicationLastDeploy[j]);
                }
                sortedappdataList.sort(sortAscending);

                for (var m = 0; m < unsortedappdataList.length; m++) {
                    indexedList.push(jQuery.inArray(unsortedappdataList[m], sortedappdataList));
                }

                var applicationInstanceName = [];
                var applicationNodeIP = [];
                var applicationLastDeploy = [];
                var applicationStatus = [];
                var containerId = [];
                var hostName = [];
                var envId = [];
                var appLogs = [];
                for (var n = 0; n < indexedList.length; n++) {
                    //var appLastDeployObj = convertToDateObj(appDeployDataObj.applicationLastDeploy[n]);
                    //var appDeployLastTime = convertToDateCustom(appLastDeployObj);
                    var applicationLastDeployTime = appDeployDataObj.applicationLastDeploy[n]
                    if ((applicationLastDeployTime.toLowerCase().indexOf("am") > -1) || (applicationLastDeployTime.toLowerCase().indexOf("pm") > -1)) {
                        applicationLastDeployTime = applicationLastDeployTime;
                    } else {
                        applicationLastDeployTime = getLocaleTime(applicationLastDeployTime);
                    }
                    applicationInstanceName[indexedList[n]] = appDeployDataObj.applicationInstanceName[n];
                    applicationNodeIP[indexedList[n]] = appDeployDataObj.applicationNodeIP[n];
                    applicationLastDeploy[indexedList[n]] = applicationLastDeployTime;
                    applicationStatus[indexedList[n]] = appDeployDataObj.applicationStatus[n];
                    containerId[indexedList[n]] = appDeployDataObj.containerId[n];
                    hostName[indexedList[n]] = appDeployDataObj.hostName[n];
                    envId[indexedList[n]] = appDeployDataObj.envId[n];
                    appLogs[indexedList[n]] = appDeployDataObj.appLogs[n];
                }
                console.log(applicationLastDeploy);
                var sortedappDeployDataObj = {
                    "applicationName": applicationName,
                    "applicationVersion": versionNumber,
                    "projectId": projectId,
                    "applicationInstanceName": applicationInstanceName,
                    "applicationNodeIP": applicationNodeIP,
                    "applicationLastDeploy": applicationLastDeploy,
                    "applicationStatus": applicationStatus,
                    "containerId": containerId,
                    "hostName": hostName,
                    "envId": envId,
                    "appLogs": appLogs
                };

                var presentDataDetailsObj = {};

                var appSortedEnvList = sortedappDeployDataObj.envId;
                for (var j = 0; j < arrSequence.length; j++) {
                    //application main card
                    if (j == 0 && arrSequence[0] == "") {
                        finalArray.push(createMainCard(applicationName, versionNumber));
                    } else if ($.inArray(arrSequence[j], appSortedEnvList) != -1) {
                        var index = $.inArray(arrSequence[j], appSortedEnvList);
                        createStatusPresentCard(sortedappDeployDataObj, index);
                        var specificEnvArr = [];
                        var specificEnvobj = {
                            "applicationInstanceName": sortedappDeployDataObj.applicationInstanceName[index],
                            "applicationNodeIP": sortedappDeployDataObj.applicationNodeIP[index],
                            "applicationLastDeploy": sortedappDeployDataObj.applicationLastDeploy[index],
                            "applicationStatus": sortedappDeployDataObj.applicationStatus[index],
                            "containerId": sortedappDeployDataObj.containerId[index],
                            "hostName": sortedappDeployDataObj.hostName[index],
                            "envId": sortedappDeployDataObj.envId[index],
                            "appLogs": sortedappDeployDataObj.appLogs[index]
                        };
                        specificEnvArr.push(specificEnvobj);

                        presentDataDetailsObj[arrSequence[j]] = specificEnvArr;


                        sortedappDeployDataObj.applicationInstanceName.splice(index, 1);
                        sortedappDeployDataObj.applicationNodeIP.splice(index, 1);
                        sortedappDeployDataObj.applicationLastDeploy.splice(index, 1);
                        sortedappDeployDataObj.applicationStatus.splice(index, 1);
                        sortedappDeployDataObj.containerId.splice(index, 1);
                        sortedappDeployDataObj.hostName.splice(index, 1);
                        sortedappDeployDataObj.envId.splice(index, 1);
                        sortedappDeployDataObj.appLogs.splice(index, 1);
                    } else {
                        //application status absent card
                        var tempStr = '';
                        var $childCardTemplate = $('.childCardTemplate');
                        var $childPresentCard = $childCardTemplate.clone(true);
                        $childPresentCard.css({
                            display: 'inline-flex'
                        });
                        $childPresentCard.find('.applicationChildIP').html('');
                        $childPresentCard.find('.lastDeploySpan').html('');
                        $childPresentCard.find('.imgHeight').attr("src", "img/rsz_inactive.png");
                        $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary').addClass('btn-grey');
                        $childPresentCard.find('.lastapplicationDeploy').html('');
                        $childPresentCard.children().css({
                            'opacity': '0.5',
                            'pointer-events': 'none'
                        });

                        var $childCardtemplateStr = $childPresentCard.prop('outerHTML');
                        tempStr = tempStr + $childCardtemplateStr;
                        finalArray.push(tempStr);
                    }
                }
                var appLastDeployArr = sortedappDeployDataObj.applicationLastDeploy;

                for (var key in presentDataDetailsObj) {
                    if (presentDataDetailsObj.hasOwnProperty(key)) {
                        for (var p = 0; p < appLastDeployArr.length; p++) {
                            if (key == sortedappDeployDataObj.envId[p]) {

                                var specificEnvPresentobj = {
                                    "applicationInstanceName": sortedappDeployDataObj.applicationInstanceName[p],
                                    "applicationNodeIP": sortedappDeployDataObj.applicationNodeIP[p],
                                    "applicationLastDeploy": sortedappDeployDataObj.applicationLastDeploy[p],
                                    "applicationStatus": sortedappDeployDataObj.applicationStatus[p],
                                    "containerId": sortedappDeployDataObj.containerId[p],
                                    "hostName": sortedappDeployDataObj.hostName[p],
                                    "envId": sortedappDeployDataObj.envId[p],
                                    "appLogs": sortedappDeployDataObj.appLogs[p]
                                };
                                presentDataDetailsObj[key].push(specificEnvPresentobj);
                            }
                        }
                    }
                }
                for (var j = 0; j < arrEnv.length; j++) {
                    var finalString = $(finalArray).get(-1);
                    finalArray.pop();
                    var firstSubStr = finalString.lastIndexOf('<span');
                    var lastSubStr = finalString.lastIndexOf('</span>');

                    var finalstr = finalString.substring(0, firstSubStr);
                    var superFinalString = finalstr + "</div>";
                    finalArray.push(superFinalString);
                }
                var rowIndex = $tableapplicationTest.dataTable().fnAddData(finalArray);
                var row = $tableapplicationTest.dataTable().fnGetNodes(rowIndex);
                $(row).data('appNameVer', presentDataDetailsObj);
            });
        });
        /*setTimeout(function(){
            var childCardTemplWidth = $('#tableContainer .childCardTemplate').outerWidth();
            var firstChildSpanTemplWidth = $('#tableContainer .firstChildSpanTemplate').outerWidth();
            var diff = childCardTemplWidth - firstChildSpanTemplWidth;
            var actualSetDiff = diff/2;
            $('#tableContainer .childCardTemplate .secondChildSpanTemplate').css('padding-left',actualSetDiff);
        },10000);*/
        $tableapplicationTbody.on('click', '.applicationChildDetails', moreinfoDetailsPipelineViewClickHandler);
    }else{
        var $noAppEnvironment = $('.noAppEnvironment').clone();
        if($('.noAppEnvironmentSelected').length){
            $('.noAppEnvironment').hide();
            $('.noAppEnvironmentSelected').remove();
        }
        $('.noAppEnvironment').removeClass('noAppEnvironment').addClass('noAppEnvironmentSelected');
        $noAppEnvironment.css("display","block");
        $('#tableContainer').hide();
        $('#divapplicationcardview').append($noAppEnvironment);
    }
}

function moreinfoDetailsPipelineViewClickHandler(e) {
    var $modal = $('#modalDetailsAppDeploy');

    var $row = $(this).closest("tr");
    var rowSetDataDetailsObj = $row.data("appNameVer");
    var applicationNamePipelineText = $(this).parents().eq(5).find('.applicationEnvNamePipelineView').html();
    
    var $envSpecificDataArr = $('#envSpecificDataTable').DataTable({
        "order": [[ 1, "desc" ]],
        destroy: true,
    });
    for (var key in rowSetDataDetailsObj) {
        if (rowSetDataDetailsObj.hasOwnProperty(key)) {
            if (key == applicationNamePipelineText) {
                $envSpecificDataArr.clear();
                for (var k = 0; k < rowSetDataDetailsObj[key].length; k++) {
                    var rowSetDetailsLogs = rowSetDataDetailsObj[key][k].appLogs;
                    var nodeIp = rowSetDataDetailsObj[key][k].applicationNodeIP;
                    rowSetDetailsLogs = rowSetDetailsLogs.replace(/"/g, '');
                    var $tdlogs = '<a class="btn btn-primary btn-sm width27borderradius50 appSpecificLogs " data-logs="' + rowSetDetailsLogs + '"  data-nodeIp="' + nodeIp + '"><i class="fa fa-info font-size-11"></i></a>';
                    $envSpecificDataArr.row.add([
                        rowSetDataDetailsObj[key][k].applicationNodeIP,
                        rowSetDataDetailsObj[key][k].applicationLastDeploy,
                        rowSetDataDetailsObj[key][k].applicationStatus,
                        $tdlogs
                    ]).draw();
                }
                $('#envSpecificDataTable_length').hide();
                $('#envSpecificDataTable_filter').hide();
            }
            $envSpecificDataArr.on('click', '.appSpecificLogs', appSpecificLogsViewClickHandler);
        }

    }

    function appSpecificLogsViewClickHandler(e) {
        var dataLogs = $(this).attr('data-logs');
        var $modal = $('#modallogsSpecificDetails');
        var datahttp = dataLogs.indexOf("http://");
        if (datahttp == 0) {
            $modal.find('.appLogsSpecific').empty();
            window.open(dataLogs, "_blank");
            return false;
        } else {
            $modal.find('.appLogsSpecific').empty();
            var nodeIp = $(this).attr('data-nodeIp');
            var $modal = $('#modallogsSpecificDetails');
            var projectId = urlParams.projid;
            $.get('/instances/' + nodeIp + '/project/' + projectId + '/logs', function(data) {
                $modal.find('.appLogsSpecific').append(data);
                $modal.modal('show');
                return false;
            });
        }
        e.preventdefault();

    }
    $modal.modal('show');
}

function createAttribTableRowFromJson(attributes) {
    var $chefRunModalContainer = $('#chefRunModalContainer')
    var $tbody = $chefRunModalContainer.find('.attributesViewTableBody').empty();
    for (var j = 0; j < attributes.length; j++) {
        var attributeObj = attributes[j].jsonObj;

        function getVal(obj, currentKey) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length; i++) {
                if (typeof obj[keys[i]] === 'object') {
                    getVal(obj[keys[i]], currentKey + '/' + keys[i]);
                } else {
                    var keyString = currentKey + '/' + keys[i];
                    keyString = keyString.substring(1);

                    var $tr = $('<tr/>').attr({
                        'data-attributeKey': keyString,
                        'data-attributeValue': obj[keys[i]],
                        'data-attributeName': attributes[j].name
                    }).data('jsonObj', attributes[j].jsonObj);;

                    var passwordField = false;
                    var passwordField = false;
                    var keyParts = keyString.split('/');
                    if (keyParts.length) {
                        var indexOfPassword = keyParts[keyParts.length - 1].indexOf('password_');
                        if (indexOfPassword !== -1) {
                            passwordField = true;
                        }
                    }

                    var $tdAttributeKey = $('<td/>').html(attributes[j].name);
                    if (passwordField) {
                        var $tdAttributeVal = $('<td/>').html("*****");
                    } else {
                        var $tdAttributeVal = $('<td/>').html(obj[keys[i]]);
                    }
                    $tr.append($tdAttributeKey).append($tdAttributeVal);
                    $tbody.append($tr);
                }
            }
        }
        getVal(attributeObj, '');
    }
}

$('.createAppConfigure').click(function() {
    var selectedEnvironments = [];
    var allEnvironments = [];
    var $tableconfigureapplication = $('#tableconfigureapplication');
    var $tbody = $tableconfigureapplication.find('tbody').empty();
    var projectId = urlParams.projid;
    $.get('/d4dMasters/project/' + projectId, function(dataforenvName) {
        $.get('/app/deploy/pipeline/project/' + projectId, function(dataPipeline) {
            if (dataPipeline.length) {
                for (var i = 0; i < dataPipeline[0].envId.length; i++) {
                    selectedEnvironments.push(dataPipeline[0].envId[i]);
                }
                for (var i = 0; i < dataPipeline[0].envSequence.length; i++) {
                    allEnvironments.push(dataPipeline[0].envSequence[i]);
                }
                var individualenvNamePrnt = dataforenvName[0].environmentname;
                individualenvNamePrnt = individualenvNamePrnt.split(",");

                console.log("allsequenceEnvironments", allEnvironments);
                console.log("individualenvNamePrnt", individualenvNamePrnt);
                for (var x = 0; x < individualenvNamePrnt.length; x++) {
                    if ($.inArray(individualenvNamePrnt[x], allEnvironments) == -1) {
                        allEnvironments.push(individualenvNamePrnt[x]);
                    }
                }
                if (selectedEnvironments.length == 0) {
                    var individualenvName = dataforenvName[0].environmentname;
                    individualenvName = individualenvName.split(",");
                    for (var i = 0; i < individualenvName.length; i++) {
                        var checked = "";
                        if ($.inArray(individualenvName[i], selectedEnvironments) > -1) {
                            checked = "checked";
                        }
                        var $tr = $('<tr/>').attr({
                            'data-configureApplication': individualenvName[i]
                        });
                        var $tdenvName = $('<td class="configAppDeployUniqueName"/>').html(individualenvName[i]);
                        var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul style='padding: 0px; margin: 0px;list-style-type: none;'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                        var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up' style='border-radius:50%;height:27px;width:27px;padding-top:0px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-up'></i></a><a class='btn btn-default btn-primary down' style='border-radius:50%;height:27px;width:27px;padding-top:0px;margin-left:10px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-down'></i></a>");
                        $tr.append($tdenvName).append($tdActive).append($tdupdown);
                        $tbody.append($tr);
                    }
                    $tableconfigureapplication.append($tbody);
                    $tableconfigureapplication.find(".up,.down").click(function() {
                        var row = $(this).parents("tr:first");
                        if ($(this).is(".up")) {
                            row.insertBefore(row.prev());
                        } else {
                            row.insertAfter(row.next());
                        }
                    });
                } else {
                    for (var i = 0; i < allEnvironments.length; i++) {
                        var checked = "";
                        if ($.inArray(allEnvironments[i], selectedEnvironments) > -1) {
                            checked = "checked";
                        }
                        var $tr = $('<tr/>').attr({
                            'data-configureApplication': allEnvironments[i]
                        });
                        var $tdenvName = $('<td class="configAppDeployUniqueName"/>').html(allEnvironments[i]);
                        var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul style='padding: 0px; margin: 0px;list-style-type: none;'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                        var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up' style='border-radius:50%;height:27px;width:27px;padding-top:0px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-up'></i></a><a class='btn btn-default btn-primary down' style='border-radius:50%;height:27px;width:27px;padding-top:0px;margin-left:10px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-down'></i></a>");
                        $tr.append($tdenvName).append($tdActive).append($tdupdown);
                        $tbody.append($tr);
                    }
                    $tableconfigureapplication.append($tbody);
                    $tableconfigureapplication.find(".up,.down").click(function() {
                        var row = $(this).parents("tr:first");
                        if ($(this).is(".up")) {
                            row.insertBefore(row.prev());
                        } else {
                            row.insertAfter(row.next());
                        }
                    });
                }
            } else {
                var individualenvName = dataforenvName[0].environmentname;
                individualenvName = individualenvName.split(",");
                for (var i = 0; i < individualenvName.length; i++) {
                    var checked = "";
                    if ($.inArray(individualenvName[i], individualenvName) > -1) {
                        checked = "checked";
                    }
                    var $tr = $('<tr/>').attr({
                        'data-configureApplication': individualenvName[i]
                    });
                    var $tdenvName = $('<td class="configAppDeployUniqueName"/>').html(individualenvName[i]);
                    var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul style='padding: 0px; margin: 0px;list-style-type: none;'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                    var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up' style='border-radius:50%;height:27px;width:27px;padding-top:0px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-up'></i></a><a class='btn btn-default btn-primary down' style='border-radius:50%;height:27px;width:27px;padding-top:0px;margin-left:10px' type='button'><i style='font-size:12px;margin-left:-5px;margin-top:5px;' class='fa  fa-chevron-down'></i></a>");
                    $tr.append($tdenvName).append($tdActive).append($tdupdown);
                    $tbody.append($tr);
                }
                $tableconfigureapplication.append($tbody);
                $tableconfigureapplication.find(".up,.down").click(function() {
                    var row = $(this).parents("tr:first");
                    if ($(this).is(".up")) {
                        row.insertBefore(row.prev());
                    } else {
                        row.insertAfter(row.next());
                    }
                });
            }
        });
    });
});

function ConvertTimeformat(format, str, formatStr) {
    var time = str;
    var hours = Number(time.match(/^(\d+)/)[1]);
    var minutes = Number(time.match(/:(\d+)/)[1]);
    var seconds = time.split(' ')[0].split(':')[2];
    if(formatStr){
        var AMPM = formatStr;
        if (AMPM == "PM" && hours < 12) hours = hours + 12;
        if (AMPM == "AM" && hours == 12) hours = hours - 12;
    }
    var sHours = hours.toString();
    var sMinutes = minutes.toString();
    var sSeconds = seconds.toString();
    if (hours < 10) sHours = "0" + sHours;
    if (minutes < 10) sMinutes = "0" + sMinutes;
    if (seconds < 10) sSeconds = "0" + sSeconds;
    return (sHours + ":" + sMinutes + ":" + sSeconds);
}

function convertToDateObj(strInputDate) {
    if(strInputDate){
        var strSplit = strInputDate.split(' ');
        var dateStr = strSplit[0];
        var timeStr = strSplit[1];
        var formatStr = strSplit[2];
        var str = ConvertTimeformat("24", timeStr, formatStr);
        if (dateStr.length == 8) {
            var year = strInputDate.substring(0, 2);
            year = 20 + year;
            var month = strInputDate.substring(3, 5);
            month = parseInt(month);
            var day = strInputDate.substring(6, 8);
        } else if (dateStr.length == 9) {
            var year = strInputDate.substring(0, 4);
            var month = strInputDate.substring(5, 6);
            month = parseInt(month);
            var day = strInputDate.substring(7, 9);
        } else {
            var year = strInputDate.substring(0, 4);
            var month = strInputDate.substring(5, 7);
            month = parseInt(month);
            var day = strInputDate.substring(8, 10);
        }
        var hour = str.substring(0, 2);
        var minute = str.substring(3, 5);
        var second = str.substring(6, 8);
        var dateConverted = new Date(year, month - 1, day, hour, minute, second);
        //alert(dateConverted + ' ==== '+strInputDate);
        return dateConverted; 
    }  
}

function convertToDateCustom(obj) {
    if(obj){
        var datestring = ("0" + obj.getDate()).slice(-2) + "-" + ("0" + (obj.getMonth() + 1)).slice(-2) + "-" +
        obj.getFullYear() + " " + ("0" + obj.getHours()).slice(-2) + ":" + ("0" + obj.getMinutes()).slice(-2) + ":" + obj.getSeconds();
        return datestring;
    }
}


$('.appdeployConfigureSaveBtn').click(function() {
    var $tableconfigureapplication = $('#tableconfigureapplication');
    var projectId = urlParams.projid;
    var configureEnvArray = [];
    var configureEnvArraySequence = [];
    var arrEnv = [];
    var arrSequence = [];
    var arrPresentEnvSeq = [];
    arrEnv.push({
        "title": 'App Details'
    });
    arrSequence.push('');
    arrPresentEnvSeq.push('');
    $tableconfigureapplication.find('tbody tr').each(function() {
        $tr = $(this);
        var envUniqueTextAllEnv = $tr.find('.configAppDeployUniqueName').text();
        configureEnvArraySequence.push(envUniqueTextAllEnv);
        arrSequence.push(envUniqueTextAllEnv);
    });
    $tableconfigureapplication.find('tbody tr').filter(':has(:checkbox:checked)').each(function() {
        var $tr = $(this);
        var envUniqueText = $tr.find('.configAppDeployUniqueName').text();
        var obj = {
            "title": envUniqueText
        };
        arrEnv.push(obj);
        arrPresentEnvSeq.push(envUniqueText);
        configureEnvArray.push(envUniqueText);
    });

    creationPipelineTableView(projectId, arrEnv, arrPresentEnvSeq);
    var dataDeployPipeline = {
        "appDeployPipelineData": {
            "loggedInUser": "",
        }
    };
    var projectId = urlParams.projid;
    dataDeployPipeline.appDeployPipelineData.projectId = projectId;
    dataDeployPipeline.appDeployPipelineData.envId = configureEnvArray;
    dataDeployPipeline.appDeployPipelineData.envSequence = configureEnvArraySequence;
    $.ajax({
        url: '/app/deploy/data/pipeline/configure',
        data: JSON.stringify(dataDeployPipeline),
        type: 'POST',
        contentType: "application/json",
        success: function(data) {
            $('#modalappcardConfigure').modal('hide');
        },
        error: function(jqxhr) {
            $('#modalappcardConfigure').modal('hide');
        }
    });
});
$('#instanceviewAppCard').click(function() {
    getenvName(function(envName) {
        var dataenvAccordianName = "Application Deployment for : " + envName;
        $('.envAppDeployName').html(dataenvAccordianName);
    });
});
$('#defaultViewButtonAppCard').click(function() {
    getprojectName(function(projectNameUrlParams) {
        var dataprojectAccordianData = "Application Deployment for : " + projectNameUrlParams;
        $('.envAppDeployName').html(dataprojectAccordianData);
    });
});

function resetAllFields() {
    var $chooseRepository = $('#chooseRepository');
    $chooseRepository.empty();
    $('#chooseRepository').append('<option value="">Choose Repositories</option>');
    var $chooseGroupId = $('#chooseGroupId');
    $chooseGroupId.empty();
    $('#chooseGroupId').append('<option value="">Choose Group ID</option>');
    var $chooseArtifacts = $('#chooseArtifacts');
    $chooseArtifacts.empty();
    $('#chooseArtifacts').append('<option value="">Choose Artifacts</option>');
    var $chooseVersions = $('#chooseVersions');
    $chooseVersions.empty();
    $('#chooseVersions').append('<option value="">Choose Versions</option>');
    var $repositoryUrl = $('#repositoryUrl');
    $repositoryUrl.val("");
    var $containerId = $('#containerIdDiv');
    $containerId.val("");
    var $containerPort = $('#containerPort');
    $containerPort.val("");
}

function resetSpinners() {
    $('.reposerverspinner').css('display', 'none');
    $('.repospinner').css('display', 'none');
    $('.repourlspinner').css('display', 'none');
    $('.artifactsspinner').css('display', 'none');
    $('.versionspinner').css('display', 'none');
    $('.jobdetailsspinner').css('display', 'none');
}

function getNexusServer() {
    resetAllFields();
    var $nexusServer = $('#chooseNexusServer');
    $nexusServer.empty();
    $('#chooseNexusServer').append('<option value="">Choose Server</option>');
    var $chooseJobType = $('#chooseJobType');
    $chooseJobType.empty();
    $('#chooseJobType').append('<option value="">Choose Job</option>');
    $('.reposerverspinner').css('display', 'inline-block');
    $.get('/d4dMasters/readmasterjsonnew/26', function(nexus) {
        $('.reposerverspinner').css('display', 'none');
        if (nexus.length) {
            for (var i = 0; i < nexus.length; i++) {
                $('#chooseNexusServer').append('<option data-groupId = "' + nexus[i].groupid + '" data-nexusUrl = "' + nexus[i].hostname + '" value=' + nexus[i].rowid + ' data-serverType = "' + nexus[i].configType + '">' + nexus[i].nexusservername + '</option>');
            }
        }
    });
}

function getDockerServer() {
    $.get('/d4dMasters/readmasterjsonnew/18', function(dockerData) {
        if (dockerData.length) {
            for (var i = 0; i < dockerData.length; i++) {
                $('#chooseNexusServer').append('<option value=' + dockerData[i].rowid + ' data-serverType = "' + dockerData[i].configType + '">' + dockerData[i].dockerreponame + '</option>');
            }
        }
    });
}

var $nexusServer = $('#chooseNexusServer');
$nexusServer.change(function(e) {
    var nexusServerType = $('#chooseNexusServer :selected').attr('data-serverType');
    if ($('#chooseNexusServer :selected').text() == 'Choose Server') {
        $('.groupClass').hide();
        $('.containerIdClass').hide();
        $('.containerPortClass').hide();
        $('.repoUrlClass').hide();
        $('.artifactClass').hide();
        $('.versionClass').hide();
        $('.createTaskLinkUpgrade').attr('disabled', 'disabled');
        // Reset all values
        resetAllFields();

    } else if (nexusServerType == 'nexus') {
        $('.containerUpgradeDeploy').hide();
        $('.createTaskLinkUpgrade').removeAttr('disabled');
        $('.repoUrlClass').show();
        $('.artifactClass').show();
        $('.versionClass').show();
        $('.groupClass').show();
        $('.containerIdClass').hide();
        $('.containerPortClass').hide();
        resetAllFields();
        var groupId = $('#chooseNexusServer :selected').attr('data-groupId').split(",");
        for (var g = 0; g < groupId.length; g++) {
            $('#chooseGroupId').append('<option value="' + groupId[g] + '">' + groupId[g] + '</option>');
        }
        getNexusServerRepo($(this).val());
        getTasks();
    } else { // It's Docker
        resetAllFields();
        $('.containerUpgradeDeploy').show();
        $('.createTaskLinkUpgrade').removeAttr('disabled');
        $('.groupClass').hide();
        $('.repoUrlClass').hide();
        $('.artifactClass').hide();
        $('.versionClass').hide();
        $('.containerIdClass').show();
        $('.containerPortClass').show();
        var containerId = $('#containerIdInput').val();
        var upgrade = $('#upgradeValue').val();
        if (containerId != "NA" && upgrade == "true") {
            $('#containerIdDiv').val(containerId);
            $('#containerIdDiv').attr('disabled', 'disabled');
        }
        getDockerRepoes();
        getTasks();
    }

});

function getDockerRepoes() {
    $('.repospinner').css('display', 'inline-block');
    var $chooseRepository = $('#chooseRepository');
    var projectId = urlParams.projid;
    if (projectId) {
        $.get('/d4dMasters/project/' + projectId, function(anProject) {
            $('.repospinner').css('display', 'none');
            if (anProject.length) {
                anProject = anProject[0];
                if (anProject.repositories) {
                    var repositories = anProject.repositories.docker;
                    if (repositories.length) {
                        for (var x = 0; x < repositories.length; x++) {
                            $('#chooseRepository').append('<option value="' + repositories[x] + '">' + repositories[x] + '</option>');
                        }
                    }
                }
            }
        });
    } else {
        $('.repospinner').css('display', 'none');
    }
}

function getNexusServerRepo(nexusId) {
    $('.repospinner').css('display', 'inline-block');
    var $chooseRepository = $('#chooseRepository');
    var projectId = urlParams.projid;
    if (nexusId) {
        $.get('/nexus/' + nexusId + '/repositories', function(nexusRepos) {
            $('.repospinner').css('display', 'none');
            if (nexusRepos.length) {

                $.get('/d4dMasters/project/' + projectId, function(anProject) {
                    if (anProject.length) {
                        project = anProject[0];
                        if (project.repositories) {
                            var repositories = project.repositories.nexus;
                            if (repositories.length) {
                                for (var x = 0; x < repositories.length; x++) {
                                    (function(x) {
                                        for (var i = 0; i < nexusRepos.length; i++) {
                                            if (repositories[x] === nexusRepos[i].name) {
                                                $('#chooseRepository').append('<option data-repoName="' + nexusRepos[i].name + '" data-repoUrl="' + nexusRepos[i].resourceURI + '" value="' + nexusRepos[i].id + '">' + nexusRepos[i].name + '</option>');
                                            }
                                        }
                                    })(x);
                                }
                            }
                        }
                    }
                });
            }
        });
    } else {
        $('.repospinner').css('display', 'none');
    }
}

var $chooseRepository = $('#chooseRepository');
$chooseRepository.change(function(e) {
    var nexusServerType = $('#chooseNexusServer :selected').attr('data-serverType');
    if (nexusServerType === 'nexus') {
        $('.containerIdClass').hide();
        $('.containerPortClass').hide();
        $('.repoUrlClass').show();
        $('.artifactClass').show();
        $('.versionClass').show();
        var $chooseGroupId = $('#chooseGroupId');
        $chooseGroupId.empty();
        $('#chooseGroupId').append('<option value="">Choose Group ID</option>');

        var groupId = $('#chooseNexusServer :selected').attr('data-groupId').split(",");
        for (var g = 0; g < groupId.length; g++) {
            $('#chooseGroupId').append('<option value="' + groupId[g] + '">' + groupId[g] + '</option>');
        }
        var $repositoryUrl = $('#repositoryUrl');
        $repositoryUrl.val("");
        var $chooseArtifacts = $('#chooseArtifacts');
        $chooseArtifacts.empty();
        $('#chooseArtifacts').append('<option value="">Choose Artifacts</option>');
        var $chooseVersions = $('#chooseVersions');
        $chooseVersions.empty();
        $('#chooseVersions').append('<option value="">Choose Versions</option>');
        $('#repositoryUrl').val($(this).find('option:selected').attr('data-repoUrl'));
    } else {
        $('.containerIdClass').show();
        $('.containerPortClass').show();
        $('.groupClass').hide();
        $('.repoUrlClass').hide();
        $('.artifactClass').hide();
        $('.versionClass').hide();
    }
});

var $chooseGroupId = $('#chooseGroupId');
$chooseGroupId.change(function(e) {
    var repoName = $('#chooseRepository').find('option:selected').attr('data-repoName');
    var nexusId = $('#chooseNexusServer').val();
    var groupId = $('#chooseGroupId').val();
    getNexusServerRepoArtifact(nexusId, repoName, groupId);
});

function getNexusServerRepoArtifact(nexusId, repoName, groupId) {
    $('.artifactsspinner').css('display', 'inline-block');
    var $chooseArtifacts = $('#chooseArtifacts');
    $chooseArtifacts.empty();
    $('#chooseArtifacts').append('<option value="">Choose Artifacts</option>');
    if (nexusId && repoName) {
        $.get('/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact', function(artifacts) {
            $('.artifactsspinner').css('display', 'none');
            if (artifacts.length) {
                var repoList = [];
                var uniqueArtifacts = [];
                var checker;
                for (var i = 0; i < artifacts.length; i++) {
                    var repoObj = {};
                    repoObj['resourceURI'] = artifacts[i].resourceURI;
                    repoObj['version'] = artifacts[i].version;
                    repoObj['artifactId'] = artifacts[i].artifactId;
                    repoList.push(repoObj);
                    if (!checker || comparer(checker, artifacts[i]) != 0) {
                        checker = artifacts[i];
                        uniqueArtifacts.push(checker);
                    }
                }
                $("#chooseArtifacts").data("repoObj", repoList);
                for (var j = 0; j < uniqueArtifacts.length; j++) {
                    $('#chooseArtifacts').append('<option data-groupId="' + uniqueArtifacts[j].groupId + '" value=' + uniqueArtifacts[j].artifactId + '>' + uniqueArtifacts[j].artifactId + '</option>');
                }
            }
        });
    } else {
        $('.artifactsspinner').css('display', 'none');
    }
}
var $chooseArtifacts = $('#chooseArtifacts');
$chooseArtifacts.change(function(e) {
    var $chooseVersions = $('#chooseVersions');
    $chooseVersions.empty();
    $('#chooseVersions').append('<option value="">Choose Versions</option>');
    var repoName = $('#chooseRepository').find('option:selected').attr('data-repoName');
    var nexusId = $('#chooseNexusServer').val();
    var groupId = $(this).find('option:selected').attr('data-groupId');
    var artifactId = $(this).val();
    getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId);
});

var comparer = function compareObject(a, b) {
    if (a.artifactId === b.artifactId) {
        return 0;
    } else {
        return 1;
    }
}

function getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId) {
    $('.versionspinner').css('display', 'inline-block');
    var $chooseVersions = $('#chooseVersions');
    $chooseVersions.empty();
    $('#chooseVersions').append('<option value="">Choose Versions</option>');
    if (nexusId && repoName && groupId && artifactId) {
        $.get('/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact/' + artifactId + '/versions', function(data) {
            $('.versionspinner').css('display', 'none');
            if (data) {
                var versions = data.metadata.versioning[0].versions[0].version;
                for (var i = 0; i < versions.length; i++) {
                    $('#chooseVersions').append('<option value=' + versions[i] + '>' + versions[i] + '</option>');
                }
            } else {
                $('.versionspinner').css('display', 'none');
            }

        });
    } else {
        $('.versionspinner').css('display', 'none');
    }
}

function getTasks() {
    var orgId = urlParams.org;
    var bgId = urlParams.bg;
    var projectId = urlParams.projid;
    var envId = urlParams.envid;
    var $chooseJobType = $('#chooseJobType');
    $chooseJobType.empty();
    $('#chooseJobType').append('<option value="">Choose Job</option>');

    $.get('/organizations/' + orgId + '/businessgroups/' + bgId + '/projects/' + projectId + '/environments/' + envId + '/tasks', function(tasks) {
        if (tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                $('#chooseJobType').append('<option value=' + tasks[i]._id + '>' + tasks[i].name + '</option>');
            }
        }
    });
}


// on click of Upgrade button
$('.saveUpgradeAppDeploy').on('click', function() {
    var nexusServerType = $('#chooseNexusServer :selected').attr('data-serverType');
    if (nexusServerType === 'nexus') {
        upgradeOrDeploy();
    } else {
        deployNewForDocker();
    }
});

$('.saveNewAppDeploy').on('click', function() {
    var nexusServerType = $('#chooseNexusServer :selected').attr('data-serverType');
    if (nexusServerType === 'nexus') {
        upgradeOrDeploy();
    } else {
        $('#containerIdInput').val($('#containerIdDiv').val());
        deployNewForDocker();
    }
});

// Deploy New App for Docker Container
function deployNewForDocker() {
    var nexusId = $('#chooseNexusServer').find('option:selected').val();
    if (!nexusId) {
        alert("Please select repository server.");
        return false;
    }
    var repoId = $('#chooseRepository').find('option:selected').val();
    if (!repoId) {
        alert("Please select repository.");
        return false;
    }
    var containerId = $('#containerIdInput').val();
    var containerPort = $('#containerPort').val();

    if (!containerPort) {
        alert("Please specify port.");
        return false;
    }
    var taskId = $('#chooseJobType').find('option:selected').val();
    if (!taskId) {
        alert("Please select job.");
        return false;
    }
    var orgId = urlParams.org;
    var bgId = urlParams.bg;
    var projectId = urlParams.projid;
    var envId = urlParams.envid;
    var appName = repoId.split("/")[1];
    var upgrade = $('#upgradeValue').val();
    var nexusData = {
        "nexusData": {
            "nexusUrl": "",
            "version": "",
            "containerId": containerId,
            "containerPort": containerPort,
            "dockerRepo": repoId,
            "upgrade": upgrade
        }
    };

    $.get('/d4dMasters/project/' + projectId, function(projData) {
        if (projData.length) {
            var reqBody = {
                "appName": appName,
                "description": appName + " deployed."
            };
            $.ajax({
                url: '/d4dMasters/project/' + projectId + '/appdeploy/appName/update',
                data: JSON.stringify(reqBody),
                type: 'POST',
                contentType: "application/json",
                success: function(data) {},
                error: function(jqxhr) {
                }
            });
        }
    });
    $('a[data-executetaskid=' + taskId + ']').trigger('click', nexusData);
    $('#modalUpgradeAppDeploy').modal('hide');
    var $containerIdName = $('#containerIdInput').val('');
}

function upgradeOrDeploy() {
    var nexusId = $('#chooseNexusServer').find('option:selected').val();
    if (!nexusId) {
        alert("Please select repository server.");
        return false;
    }
    var repoId = $('#chooseRepository').find('option:selected').val();
    if (!repoId) {
        alert("Please select repository.");
        return false;
    }
    var artifactId = $('#chooseArtifacts').find('option:selected').val();
    if (!artifactId) {
        alert("Please select artifact.");
        return false;
    }
    var versionId = $('#chooseVersions').find('option:selected').val();
    if (!versionId) {
        alert("Please select version.");
        return false;
    }
    var taskId = $('#chooseJobType').find('option:selected').val();
    if (!taskId) {
        alert("Please select job.");
        return false;
    }
    var orgId = urlParams.org;
    var bgId = urlParams.bg;
    var projectId = urlParams.projid;
    var envId = urlParams.envid;
    var groupId = $('#chooseArtifacts').find('option:selected').attr('data-groupId').replace(/\./g, '/');
    var nexusUrl = $('#chooseNexusServer').find('option:selected').attr('data-nexusUrl');
    var nexusRepoUrl = "";
    var repoURIObj = $("#chooseArtifacts").data();
    if (repoURIObj) {
        for (var i = 0; i < repoURIObj.repoObj.length; i++) {
            if (artifactId === repoURIObj.repoObj[i].artifactId && versionId === repoURIObj.repoObj[i].version) {
                nexusRepoUrl = repoURIObj.repoObj[i].resourceURI;
            }
        }
    }
    var upgrade = $('#upgradeValue').val();
    var nexusData = {
        "nexusData": {
            "nexusUrl": nexusRepoUrl,
            "version": versionId,
            "containerId": "",
            "containerPort": "",
            "dockerRepo": "",
            "upgrade": upgrade
        }
    };

    $.get('/d4dMasters/project/' + projectId, function(projData) {
        if (projData.length) {
            var reqBody = {
                "appName": repoId,
                "description": repoId + " deployed."
            };
            $.ajax({
                url: '/d4dMasters/project/' + projectId + '/appdeploy/appName/update',
                data: JSON.stringify(reqBody),
                type: 'POST',
                contentType: "application/json",
                success: function(data) {

                },
                error: function(jqxhr) {
                }
            });
        }
    });
    $('a[data-executetaskid=' + taskId + ']').trigger('click', nexusData);
    $('#modalUpgradeAppDeploy').modal('hide');
    var $containerIdName = $('#containerIdInput').val('');
}

function saveRecord() {
    var dataDeploy = {
        "appDeployData": {
            "applicationName": "",
            "description": "",
            "projectId": ""
        }
    };
    var applicationName = $('#appNameInput').val();
    var applicationDescription = $('#applicationDescriptionInput').val();
    var projectId = urlParams.projid;
    if (!applicationName) {
        $('#errorParam').empty();
        $('#errorParam').append('Application name should not be empty');
        return;
    } else {
        dataDeploy.appDeployData.description = applicationDescription;
        dataDeploy.appDeployData.projectId = projectId;
        dataDeploy.appDeployData.applicationName = applicationName;
        $.ajax({
            url: '/app/deploy/data/create',
            data: JSON.stringify(dataDeploy),
            type: 'POST',
            contentType: "application/json",
            success: function(data) {
                $('#modalAppCardDetails').modal("hide");
                getDropdownList();
            },
            error: function(jqxhr) {
                $("#errorParam").empty();
                $("#errorParam").append("    " + jqxhr.responseText);
            }
        });
    }
}

function getDropdownList() {
    var projectId = urlParams.projid;
    $.get('/d4dMasters/project/' + projectId, function(dataTotalList) {
        var $chooseApplication = $('#chooseApplication');
        $chooseApplication.empty();
        $chooseApplication.append('<option value="All Application">All Application</option>');
        $('#chooseApplication').select2();
        var applicationNameArr = [];
        var applicationDescArr = {};
        $.each(dataTotalList[0].appdeploy, function(key, val) {
            $option = $('<option value="' + val.applicationname + '">' + val.applicationname + '</option>');
            $chooseApplication.append($option);
        });

        $chooseApplication.change();
    }).fail(function() {
        alert("getDropdownList Error");
    });
}

function constructDataListTable() {
    var $taskenvArrayTable = $('#tableappParamDeploy').DataTable();
    $taskenvArrayTable.clear().draw(false);
    $.get('/d4dMasters/readmasterjsonnew/4', function(dataTotalList) {
        $.each(dataTotalList, function(key, val) {
            var $taskenvArrayTable = $('#tableappParamDeploy');
            var rowindex1 = $taskenvArrayTable.dataTable().fnGetData().length;
            $taskenvArrayTable.dataTable().fnAddData([
                rowindex1 + 1,
                val.applicationname,
                val.description
            ]);
        });
    }).fail(function() {});
}

function getenvName(callback) {
    var envId = urlParams.envid;
    $.ajax({
        url: '/d4dMasters/env/' + envId,
        type: 'GET',
        async: true,
        contentType: "application/json",
        success: function(dataenvName) {
            callback(dataenvName);
        },
        error: function(jqxhr) {

        },
        failure: function(data1) {

        }
    });
}

function getprojectName(callback) {
    var projectId = urlParams.projid;
    $.ajax({
        url: '/d4dMasters/projectname/' + projectId,
        type: 'GET',
        async: true,
        contentType: "application/json",
        success: function(datarojectName) {
            callback(datarojectName);
        },
        error: function(jqxhr) {

        },
        failure: function(data1) {

        }
    });
}

function getAllApplicationData() {
    var projectId = urlParams.projid;
    getenvName(function(envName) {
        $.get('/app/deploy/env/' + envName + '/project/' + projectId + '/list', function(data) {
            constructUI(data);
        }).fail(function() {});
    });
};

function getParticularApplicationData(selectedAppName) {
    $("#accordion-AppDeploy").empty();
    var projectId = urlParams.projid;
    getenvName(function(envName) {
        $.ajax({
            url: '/app/deploy/data/env/' + envName + '/' + selectedAppName + '/project/' + projectId + '/list',
            type: 'GET',
            contentType: "application/json",
            success: function(data) {
                constructUI(data);
            },
            error: function(jqxhr) {

            },
            failure: function(data) {

            }
        });
    });
}

function constructUI(data) {
    $('.loadingAppDeploySpinner').hide();
    $("#accordion-AppDeploy").empty();
    if (data.length) {
        var $chooseApplication = $('#chooseApplication');
        var selectedAppName = $chooseApplication.val();
        if (typeof selectedAppName != 'undefined') {
            $('#appDeployName').append().text("  for '" + selectedAppName + "'");
            $('#widgetAppDeploy').show();
        } else {
            $('#appDeployName').append().text("");
            $('#widgetAppDeploy').hide();
        }
        $("#nodataAppDeploy").css({
            "text-align": "center",
            "margin-top": "0px",
            "padding-top": "20px",
            "display": "none"
        });

        var $accordianTemplate = $('.accordianTemplateContainer').find('.accordianTemplate');
        var dataenvAccordianName;

        function moreInfoAppDeployClickHandler(e) {
            var $modal = $('#modalAppCardLogDetails');
            var $logContainer = $modal.find('.logsForAppDeploy').show();
            $logContainer.empty().append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
            $.ajax({
                url: '/app/deploy/' + this.id + '/logs',
                type: 'GET',
                contentType: "application/json",
                success: function(data) {
                    var datahttp = data.indexOf("http://");
                    if (datahttp == 0) {
                        $logContainer.empty();
                        window.open(data, "_blank");
                    } else {
                        $logContainer.empty();
                        $modal.modal('show');
                        data = data.replace(/,/g, "<br />");
                        $logContainer.append(data);
                    }
                },
                error: function(jqxhr) {
                    $logContainer.empty();
                    $modal.modal('show');
                    $logContainer.append('No Logs Available');
                },
                failure: function(data) {

                }
            });
        }

        function moreInfoUpgradeAppDeployClickHandler(e) {
            $('.groupClass').hide();
            $('.repoUrlClass').hide();
            $('.artifactClass').hide();
            $('.versionClass').hide();
            $('#upgradeValue').val("true");
            $('#formUpgradeAppDeploy')[0].reset();
            $('.containerClass').hide();
            resetSpinners();
            $('.modaltitleforNewDeploy').hide();
            $('.modaltitleforupgradeDeploy').show();
            $('.saveNewAppDeploy').hide();
            $('.saveUpgradeAppDeploy').show();
            if ($('#chooseNexusServer :selected').text() == 'Choose Server') {
                $('.createTaskLinkUpgrade').attr('disabled', 'disabled');
            } else {
                $('.createTaskLinkUpgrade').removeAttr('disabled');
            }
            var tabletrIndex = $(".moreinfoUpgradeAppDeploy").index($(this));

            var upgradeAppNameText = $('#tableappDeploydetails tbody tr:eq(' + tabletrIndex + ') td:first').html();
            var upgradeNodeIpText = $('#tableappDeploydetails tbody tr:eq(' + tabletrIndex + ') td:nth-child(5)').html();
            var containerId = $('#tableappDeploydetails tbody tr:eq(' + tabletrIndex + ') td:nth-child(7)').html();
            containerId = containerId.split("</div>")[0].split(">")[1];
            if (!containerId) {
                containerId = "NA";
            }
            $("#upgradeAppName").html(upgradeAppNameText);
            $("#upgradeNodeIp").html(upgradeNodeIpText);
            getNexusServer();
            getDockerServer();
            var $modal = $('#modalUpgradeAppDeploy');
            $('#containerIdInput').val(containerId);
            $modal.modal('show');
        }

        $('#tableappDeploydetails').on('click', '.moreinfoAppDeploy', moreInfoAppDeployClickHandler);
        $('#tableappDeploydetails').on('click', '.moreinfoUpgradeAppDeploy', moreInfoUpgradeAppDeployClickHandler);
        if (data && data.length) {
            var $clone = $accordianTemplate.clone(true);
            for (var i = 0; i < data.length; i++) {
                if (data[i].projectId) {
                    if ($('#' + data[i].projectId + data[i].applicationName + data[i].envId + '_parentAccordian').length == 0) {
                        if (typeof data[i].projectId + data[i].applicationName + data[i].envId == 'undefined') {
                            dataenvAccordianName = '';
                            $clone.find('.envAppDeployName').html(dataenvAccordianName);
                        } else {
                            getprojectName(function(projectNameUrlParams) {
                                var dataenvAccordianName = "Application Deployment for : " + projectNameUrlParams;
                                $clone.find('.envAppDeployName').html(dataenvAccordianName);
                            });
                        }
                        $clone.find('.panel-title').css({
                            "padding": "10px"
                        });
                        $('#accordion-AppDeploy').append($clone);
                        if (!$.fn.dataTable.isDataTable('#tableappDeploydetails')) {
                            $('#tableappDeploydetails').DataTable({
                                "pagingType": "full_numbers",
                                "iDisplayLength": 5,
                                "aLengthMenu": [
                                    [5, 40, 100, -1],
                                    [5, 40, 100, "All"]
                                ],
                                "aaSorting": [
                                    [5, 'desc']
                                ],
                                "aoColumns": [{
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": true
                                }, {
                                    "bSortable": false
                                }, {
                                    "bSortable": false
                                }]
                            });
                        }
                    }
                    var $taskenvArray = $('#tableappDeploydetails');
                    var upgradeAppDeploy;
                    if (!data[i]._id) {
                        upgradeAppDeploy = "NA";
                    } else {
                        upgradeAppDeploy = '<a class="btn btn-primary btn-sg tableactionbutton moreinfoUpgradeAppDeploy" style="box-shadow: none ! important; height: 25px; width: 25px; padding: 2px; font-size: 12px;"><i class="ace-icon fa fa-upload bigger-120"></i></a>';
                    }



                    var logsAppDeploy;
                    if (!data[i]._id) {
                        logsAppDeploy = "NA";
                    } else {
                        logsAppDeploy = '<a class="moreinfoAppDeploy" id=' + data[i]._id + ' title="Logs Info" style="margin-left:27%"></a>';
                    }
                    if (!data[i].applicationName) {
                        data[i].applicationName = "NA";
                    }
                    if (!data[i].applicationInstanceName) {
                        if (data[i].hostName) {
                            data[i].applicationInstanceName = data[i].hostName;
                        } else {
                            data[i].applicationInstanceName = "NA";
                        }
                    }
                    if (!data[i].applicationVersion) {
                        data[i].applicationVersion = "NA";
                    }
                    if (!data[i].applicationType) {
                        data[i].applicationType = "NA";
                    }
                    if (!data[i].containerId) {
                        data[i].containerId = "NA";
                    } else {
                        data[i].containerId = '<div class="spanTextApplication" title="' + data[i].containerId + '">' + data[i].containerId + '</div>'
                    }
                    if (!data[i].hostName) {
                        data[i].hostName = "NA";
                    }
                    if (!data[i].applicationNodeIP) {
                        data[i].applicationNodeIP = "NA";
                    }
                    if (!data[i].applicationLastDeploy) {
                        data[i].applicationLastDeploy = "NA";
                    }
                    if (!data[i].applicationStatus) {
                        data[i].applicationStatus = "NA";
                    }
                    var applicationLastDeployTime = data[i].applicationLastDeploy;

                    if ((applicationLastDeployTime.toLowerCase().indexOf("am") > -1) || (applicationLastDeployTime.toLowerCase().indexOf("pm") > -1)) {
                        applicationLastDeployTime = applicationLastDeployTime;
                    } else {
                        applicationLastDeployTime = getLocaleTime(applicationLastDeployTime);
                    }

                    $taskenvArray.dataTable().fnAddData([
                        //rowindex + 1,
                        data[i].applicationName,
                        data[i].applicationInstanceName,
                        data[i].applicationVersion,
                        data[i].hostName,
                        data[i].applicationNodeIP,
                        applicationLastDeployTime,
                        data[i].containerId,
                        data[i].applicationType,
                        data[i].applicationStatus,
                        logsAppDeploy,
                        upgradeAppDeploy
                    ]);
                }
                if (typeof data[i].envId == 'undefined') {
                    $('#' + data[i].projectId + data[i].applicationName + data[i].envId + '_parentAccordian').hide();
                }
            }
        }
    } else {
        $("#nodataAppDeploy").empty();
        $('.fornNoDataDiv').show();
        if (!$.fn.dataTable.isDataTable('#tableappDeploydetailsforNoData')) {
            $('#tableappDeploydetailsforNoData').DataTable({
                "pagingType": "full_numbers",
                "iDisplayLength": 5,
                "aLengthMenu": [
                    [5, 40, 100, -1],
                    [5, 40, 100, "All"]
                ],
                "aaSorting": [
                    [5, 'desc']
                ],
                "aoColumns": [{
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": true
                }, {
                    "bSortable": false
                }, {
                    "bSortable": false
                }]
            });
        }
        var $accordianTemplatenoData = $('.accordianTemplateContainer').find('.accordianTemplate');
        $accordianTemplatenoData.css({
            "border-color": "#fff",
            "margin-bottom": "0px"
        });
        $accordianTemplatenoData.find('.panel-title').css({
            "padding": "0px"
        });
        $accordianTemplatenoData.find('.margintop2right8').css({
            "margin-top": "-6px"
        });
        var $clonenoData = $accordianTemplatenoData.clone(true);
        $clonenoData.find('#tableappDeploydetails').parent().hide();
        getprojectName(function(projectNameUrlParams) {
            var dataprojectAccordianNameforNoData = "Application Deployment for : " + projectNameUrlParams;
            $clonenoData.find('.envAppDeployName').html(dataprojectAccordianNameforNoData);
        });
        $("#nodataAppDeploy").css({
            "display": "block"
        }).append($clonenoData);
    }
}
$('#parameterAppDeploySaveBtn').on("click", function() {});

$('.envAppDeployModal').click(function(e) {
    $('#formAppDeploy').trigger("reset");
    $("#errorParam").empty();
});
$('.envAppDeployList').click(function(e) {
    constructDataListTable();
});
if (!$.fn.dataTable.isDataTable('#tableappParamDeploy')) {
    $('#tableappParamDeploy').DataTable({
        "pagingType": "full_numbers",
        "iDisplayLength": 5,
        "aLengthMenu": [
            [5, 40, 100, -1],
            [5, 40, 100, "All"]
        ],
        "aoColumns": [{
            "bSortable": true
        }, {
            "bSortable": true
        }, {
            "bSortable": true
        }]
    });
}
$("#tableappParamDeploy_length").hide();
$("#tableappParamDeploy_filter").hide();
var urlParams = {};
(window.onpopstate = function() {
    var url = window.location.href;
    var indexOfQues = url.lastIndexOf("?");
    if (indexOfQues != -1) {
        var sub = url.substring(indexOfQues + 1);
        var params = sub.split('&')
        for (var i = 0; i < params.length; i++) {
            var paramParts = params[i].split('=');
            urlParams[paramParts[0]] = paramParts[1];
        }
    }
})();

function getLocaleTime(str) {
    var findTimeStamp = function(x) {
        x = x.replace(' +0000', '');
        var temp = str.split(' ');
        var date = temp[0].split('-');
        var time = temp[1].split(":");
        var ddate = new Date(Date.UTC(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), parseInt(time[0]), parseInt(time[1]), parseInt(time[2])));
        return ddate.getTime();
    }
    var t = findTimeStamp(str);
    if (t != undefined || t != null) {
        try {
            return new Date(findTimeStamp(str)).toLocaleString();
        } catch (err) {
            return applicationLastDeployTime.slice(0, -6);
        }
    } else {
        return applicationLastDeployTime.slice(0, -6);
    }
}
$('.createTaskLinkUpgrade').click(function(e) {
    $('#modalassignTaskUpgrade').modal("show");
    $("#modalassignTaskUpgrade .modal-body").empty();
    $("#modalassignTaskUpgrade .modal-body").load("ajax/assignTaskUpgradeApp.html");
});