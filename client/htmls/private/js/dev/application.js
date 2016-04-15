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

$('#syncAppPipelineView').on("click", function() {
    loadPipeline();
    getAllApplicationData();
    return;
});
$('#syncAppTableView').on("click", function() {
    getAllApplicationData();
    return;
});
$(document).ready(function() {
    managePipelineConfiguration();
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
        $('.hostPortClass').hide();
        $('.dockerUserClass').hide();
        $('.dockerPasswordClass').hide();
        $('.dockerEmailIdClass').hide();
        $('.imageTagClass').hide();
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



function loadPipeline() {
    // fething application
    var projectId = urlParams['projid'];
    $.get('/app/deploy/project/' + projectId + '/list', function(deployData) {
        var sorteddeployData = deployData;
        cmp = function(x, y) {
            return x > y ? 1 : x < y ? -1 : 0;
        };
        //sort name ascending then id descending
        deployData.sort(function(a, b) {
            //note the minus before -cmp, for descending order           
            var versionA = a.applicationVersion
            return cmp(
                [cmp(a.applicationName, b.applicationName), -cmp(a.applicationVersion, b.applicationVersion)], [cmp(b.applicationName, a.applicationName), -cmp(b.applicationVersion, a.applicationVersion)]
            );
        });

        $.get('/app/deploy/pipeline/project/' + projectId, function(dataPipeline) {
            $('.loadingPipelineView').hide();
            if (dataPipeline.length) {

                var envs = getTableHeaderData(dataPipeline[0].envId);
                creationPipelineTableView(projectId, envs.arrEnv, envs.arrPresentEnvSeq, deployData);

            } else {
                $.get('/d4dMasters/project/' + projectId, function(dataforenvName) {

                    var individualenvName = dataforenvName[0].environmentname;
                    individualenvNames = individualenvName.split(",");

                    var envs = getTableHeaderData(individualenvNames)
                    creationPipelineTableView(projectId, envs.arrEnv, envs.arrSequence, deployData);


                }).fail(function() {});
            }
        });

    });


    function getTableHeaderData(envs) {
        var arrEnv = [];
        var arrPresentEnvSeq = [''];
        arrEnv.push({
            "title": 'App Details'
        });
        for (var i = 0; i < envs.length; i++) {
            arrEnv.push({
                "title": envs[i]
            });
            arrPresentEnvSeq.push(envs[i]);
        }

        return {
            arrEnv: arrEnv,
            arrPresentEnvSeq: arrPresentEnvSeq
        };
    }

    function createMainCard(applicationName, versionNumber) {
        var tempStr = '';
        var $mainCardTemplate = $('.mainCardTemplate');

        var $mainCard = $mainCardTemplate.clone(true);
        $mainCard.removeClass('mainCardTemplate');
        $mainCard.css({
            display: 'inline-flex',
            width: '100%'
        });

        $mainCard.find('.applicationMainIP').html(applicationName);
        $mainCard.find('.applicationMainIP').attr('title', applicationName);
        $mainCard.find('.versionMain').html(versionNumber);

        //if (applicationName === "catalyst" || applicationName === "Catalyst" || applicationName === "D4D" || applicationName === "core") {
        if (applicationName === "petclinic"){
            $mainCard.find('.mainImageHeight').attr("src", "img/petclinic.png");
        } else {
            $mainCard.find('.mainImageHeight').attr("src", "img/rsz_logo.png");
        }
        return $mainCard;
    }

    function sortDeployDataByDate(appDeployDataObj) {
        function sortAscending(data_A, data_B) {
            data_A = convertToDateObj(data_A);
            data_B = convertToDateObj(data_B);
            return (data_B - data_A);
        }


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
            var applicationLastDeployTime = appDeployDataObj.applicationLastDeploy[n];

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
        return sortedappDeployDataObj;
    }

    function createStatusPresentCard(appDeployDataObj, $td, last) {
        var envnamePresent = appDeployDataObj.envnamePresent;
        var appNamePresent = appDeployDataObj.appNamePresent;
        var appVersionPresent = appDeployDataObj.appVersionPresent;
        $.ajax({
            url: '/deploy/permission/project/' + projectId + '/env/' + envnamePresent + '?application=' + appNamePresent + '&version=' + appVersionPresent,
            type: 'GET',
            contentType: "application/json",
            async: true,
            success: function(data) {
                var tempStr = '';
                var $childCardTemplate = $('.childCardTemplate');
                var $childPresentCard = $childCardTemplate.clone(true);
                $childPresentCard.removeClass('childCardTemplate');
                $childPresentCard.css({
                    display: 'inline-flex',
                    width: '100%'
                });
                $childPresentCard.find('.applicationChildIP').html(appDeployDataObj.appNodeIP);
                $childPresentCard.find('.lastapplicationDeploy').html(appDeployDataObj.appLastDeploy);
                var appStatusCard = appDeployDataObj.appStatus.toUpperCase();
                if (appStatusCard === "SUCCESSFUL" || appStatusCard === "SUCCESSFULL" || appStatusCard === "SUCCESS") {
                    $childPresentCard.find('.imgHeight').removeClass('imgStatusSuccess').addClass('imgStatusSuccess');
                    $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary btn-danger').addClass('btn-success');

                } else {
                    $childPresentCard.find('.imgHeight').removeClass('imgStatusSuccess').addClass('imgStatusFailure');
                    $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary btn-success').addClass('btn-danger');
                }
                $childPresentCard.find('.applicationEnvNamePipelineView').html(envnamePresent);
                if (data.length && (data[0].isApproved == "true")) {
                    $childPresentCard.find('.btn-promote').removeAttr('disabled');
                } else if (data.length && (data[0].isApproved == "false")) {
                    $childPresentCard.find('.btn-promote').attr('disabled', 'disabled');
                }

                var promoteBtnId = envnamePresent + "_" + appNamePresent + "_" + appVersionPresent;
                $childPresentCard.find('.btn-promote').attr('id', promoteBtnId);
                if (last) {
                    $childPresentCard.find('.secondChildSpanTemplate').remove();
                }
                $td.append($childPresentCard);
            },
            error: function(jqxhr) {}
        });
    };

    function createEmptyCard(env, last) {
        var tempStr = '';
        var $childCardTemplate = $('.childCardTemplate');
        var $childPresentCard = $childCardTemplate.clone(true);
        $childPresentCard.removeClass('childCardTemplate');
        $childPresentCard.css({
            display: 'inline-flex',
            width: '100%'
        });
        $childPresentCard.find('.applicationEnvNamePipelineView').html(env);
        $childPresentCard.find('.applicationChildIP').html('');
        $childPresentCard.find('.lastDeploySpan').html('');
        $childPresentCard.find('.imgHeight').removeClass('imgStatusSuccess').addClass('imgStatusUnknown');
        $childPresentCard.find('.applicationChildDetails').removeClass('btn-primary').addClass('btn-grey');
        $childPresentCard.find('.lastapplicationDeploy').html('');
        $childPresentCard.children().addClass('opacityHalfponinterevntsNone');
        if (last) {
            $childPresentCard.find('.secondChildSpanTemplate').remove();

        }
        return $childPresentCard;
    }



    function creationPipelineTableView(projectId, arrEnv, arrSequence, deploymentsData) {
        if (arrEnv.length && arrEnv.length > 1) {
            $('.noAppEnvironment').hide();
            $('.noAppEnvironmentSelected').hide();
            $('#tableContainer').show();
            var $tableClone = $('.tableClone').clone();
            $tableClone.removeClass('tableClone');
            $('#tableContainer').empty().append($tableClone);
            $tableClone.DataTable({
                columns: arrEnv,
                "bSort": false,
                "bAutoWidth": false,
                "bProcessing": true,
                "bDeferRender": true,
                "bFilter": false,
                "searching": true,
                "bLengthChange": true,
                "bProcessing": true,
                "fnCreatedRow": function(row, data, index) {
                    var $tds = $(row).find('td');

                    var deployData = deploymentsData[index];
                    if (deployData) {
                        $(row).data('appNameVer', deployData);
                        var sortedData = sortDeployDataByDate(deployData);
                        for (var i = 0; i < $tds.length; i++) {
                            if (i === 0) {
                                var $mainCard = createMainCard(deployData.applicationName, deployData.applicationVersion);
                                $($tds[i]).empty().append($mainCard);
                                continue;
                            }

                            var indexOfEnv = sortedData.envId.indexOf(arrSequence[i]);
                            var last = false;
                            if (i == $tds.length - 1) {
                                last = true;
                            }
                            if (indexOfEnv != -1) {

                                var $card = createStatusPresentCard({
                                    envnamePresent: sortedData.envId[indexOfEnv],
                                    appNamePresent: sortedData.applicationName,
                                    appVersionPresent: sortedData.applicationVersion,
                                    appNodeIP: sortedData.applicationNodeIP[indexOfEnv],
                                    appLastDeploy: sortedData.applicationLastDeploy[indexOfEnv],
                                    appStatus: sortedData.applicationStatus[indexOfEnv]
                                }, $($tds[i]), last);
                            } else {
                                $card = createEmptyCard(arrSequence[i], last);
                                $($tds[i]).append($card);
                            }
                            if ($tds.length > 3) {
                                $('.btn-grp-CSS').css({
                                    "width": "100px !important"
                                });
                            }
                            $($tds[i]).data('envType', arrSequence[i]);
                        }
                    } else {
                        console.log('deploy data is null');
                    }
                }
            });

            var dummyData = [];
            arrEnv.forEach(function() {
                dummyData.push('');
            });

            for (var i = 0; i < deploymentsData.length; i++) {
                var dataString = JSON.stringify(deploymentsData[i]);
                dummyData[0] = dataString;
                $tableClone.dataTable().fnAddData(dummyData);
            }


            $tableClone.addClass('margintop40');
            $tableClone.find('thead th').addClass('padding-left5per theadcolor');
            var $tableapplicationTest = $tableClone;
            var $tableapplicationTbody = $tableClone.find('tbody');
            $tableapplicationTbody.on('click', '.applicationChildDetails', moreinfoDetailsPipelineViewClickHandler);
            $tableapplicationTbody.on('click', '.btn-approve', btnApproveDetailsPipelineViewClickHandler);
            $tableapplicationTbody.on('click', '.btn-promote', btnPromoteDetailsPipelineViewClickHandler);
            $('#envSpecificDataTable').on('click', '.appSpecificLogs', appSpecificLogsViewClickHandler);


        } else {
            var $noAppEnvironment = $('.noAppEnvironment').clone();
            if ($('.noAppEnvironmentSelected').length) {
                $('.noAppEnvironment').hide();
                $('.noAppEnvironmentSelected').remove();
            }
            $('.noAppEnvironment').removeClass('noAppEnvironment').addClass('noAppEnvironmentSelected');
            $noAppEnvironment.css("display", "block");
            $('#tableContainer').hide();
            $('#divapplicationcardview').append($noAppEnvironment);
        }
    };
}
loadPipeline();

function appSpecificLogsViewClickHandler() {
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
            $modal.find('.appLogsSpecific').html(data);
            $modal.modal('show');
            return false;
        });
    }
}


function btnApproveDetailsPipelineViewClickHandler(e) {
    var $modal = $('#modalapproveConfigure');
    $modal.find('#approvedEnvName').empty();
    var envName = $(this).closest('td').find('.applicationEnvNamePipelineView').html();
    $modal.find('#approvedEnvName').append(envName);
    var projectId = urlParams.projid;
    var appName = $(this).closest('tr').find('.applicationMainIP').html();
    var version = $(this).closest('tr').find('.versionMain').html();
    $.ajax({
        url: '/deploy/permission/project/' + projectId + '/env/' + envName + '?application=' + appName + '&version=' + version,
        type: 'GET',
        contentType: "application/json",
        success: function(data) {
            if (data.length && (data[0].isApproved == "true")) {
                $modal.find('#approvalCommentsDesc').val('');
                $modal.find('#approvalCommentsDesc').val(data[0].comments);

            } else if (data.length && (data[0].isApproved == "false")) {
                $modal.find('#approvalCommentsDesc').val('');
                $modal.find('#approvalCommentsDesc').val(data[0].comments);
            } else {
                $modal.find('#approvalCommentsDesc').val('');
            }
        },
        error: function(jqxhr) {}
    });
    $modal.find('.approveSave').off('click').on('click', function() {
        bootbox.confirm({
            message: "Are you sure you would like to <strong>approve</strong> promote app from " + envName + " ?",
            title: "Confirmation",
            callback: function(result) {
                if (!result) {
                    return;
                } else {
                    var comments = $modal.find('#approvalCommentsDesc').val();
                    var promoteBtnID = envName + "_" + appName + "_" + version;
                    var dataApprove = {
                        "permission": {
                            "projectId": projectId,
                            "envId": envName,
                            "appName": appName,
                            "version": version,
                            "comments": comments,
                            "isApproved": "true"
                        }
                    };
                    $.ajax({
                        url: '/deploy/permission',
                        data: JSON.stringify(dataApprove),
                        type: 'POST',
                        contentType: "application/json",
                        success: function(data) {
                            $('.btn-promote[id="' + promoteBtnID + '"]').removeAttr('disabled');
                            $('#modalapproveConfigure').modal('hide');
                        },
                        error: function(jqxhr) {
                            $('#modalapproveConfigure').modal('hide');
                        }
                    });
                }
            }
        });
    });
    $modal.find('.revokeSave').off('click').on('click', function() {
        bootbox.confirm({
            message: "Are you sure you would like to <strong>revoke</strong> promote app from " + envName + " ?",
            title: "Confirmation",
            callback: function(result) {
                if (!result) {
                    return;
                } else {
                    var comments = $modal.find('#approvalCommentsDesc').val();
                    var promoteBtnID = envName + "_" + appName + "_" + version;
                    var dataRevoke = {
                        "permission": {
                            "projectId": projectId,
                            "envId": envName,
                            "appName": appName,
                            "version": version,
                            "comments": comments,
                            "isApproved": "false"
                        }
                    };
                    $.ajax({
                        url: '/deploy/permission',
                        data: JSON.stringify(dataRevoke),
                        type: 'POST',
                        contentType: "application/json",
                        success: function(data) {
                            $('.btn-promote[id="' + promoteBtnID + '"]').attr('disabled', 'disabled');
                            $('#modalapproveConfigure').modal('hide');
                        },
                        error: function(jqxhr) {
                            $('#modalapproveConfigure').modal('hide');
                        }
                    });
                }
            }
        });
    });
    $modal.modal('show');
}

function getEnvironmentForProject() {
    var projectId = urlParams.projid;
    $.get('/d4dMasters/project/' + projectId, function(project) {
        if (project.length) {
            var aProject = project[0];
            var envNames = aProject.environmentname.split(",");
            var envIds = aProject.environmentname_rowid.split(",");
            if (envNames.length) {
                for (var i = 0; i < envNames.length; i++) {
                    $('#chooseEnvironments').append('<option data-Name=' + envNames[i] + ' value=' + envIds[i] + '>' + envNames[i] + '</option>');
                }
            } else {
                alert("No Environment associated with Project.");
            }
        }
    });
}
$('#chooseEnvironments').change(function() {
    var $modal = $('#modalpromoteConfigure');
    var envId = $modal.find('#chooseEnvironments').find('option:selected').val();
    var $ul = $('#promoteNodesId');
    $ul.empty();
    var orgId = urlParams.org;
    var bgId = urlParams.bg;
    var projectIds = urlParams.projid;
    var $chooseJobs = $('#chooseJobs');
    $chooseJobs.empty();
    $('#chooseJobs').append('<option value="">Choose Job</option>');

    $.get('/organizations/' + orgId + '/businessgroups/' + bgId + '/projects/' + projectIds + '/environments/' + envId + '/tasks', function(tasks) {
        if (tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].taskType === "chef") {
                    $('#chooseJobs').append('<option value=' + tasks[i]._id + '>' + tasks[i].name + '</option>');
                }
            }
        }
        $('#chooseJobs > option:eq(1)').attr('selected', true).change();
    });

    $('#promoteNodesId').find('li').hide();
});

function getTasksForPromote(envId) {
    var orgId = urlParams.org;
    var bgId = urlParams.bg;
    var projectId = urlParams.projid;
    var $chooseJobs = $('#chooseJobs');
    $chooseJobs.empty();
    $('#chooseJobs').append('<option value="">Choose Job</option>');

    $.get('/organizations/' + orgId + '/businessgroups/' + bgId + '/projects/' + projectId + '/environments/' + envId + '/tasks', function(tasks) {
        if (tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                if (tasks[i].taskType === "chef") {
                    $('#chooseJobs').append('<option value=' + tasks[i]._id + '>' + tasks[i].name + '</option>');

                }
            }
        }
    });
}
$('#chooseJobs').change(function() {
    $('#promoteNodesId').find('li').hide();
    var $modal = $('#modalpromoteConfigure');
    var taskId = $modal.find('#chooseJobs').find('option:selected').val();
    var projectId = urlParams.projid;
    var envName = $modal.find('#chooseEnvironments').find('option:selected').text();
    var rowDataSetappName = $('#modalpromoteConfigure').data("appName");
    var rowDataSetappVersion = $('#modalpromoteConfigure').data("appVersion");
    var $ul = $('#promoteNodesId');
    $ul.empty();
    $.get('/tasks/' + taskId, function(tasks) {
        if (tasks && tasks.taskConfig.nodeIds.length) {
            /*$.get('/app/deploy/project/' + projectId + '/env/' + envName + '/application/' + rowDataSetappName + '?version=' + rowDataSetappVersion, function(data) {
                if (data.length) {
                    var $ul = $('#promoteNodesId');
                    for (var i = 0; i < data.length; i++) {
                        var $li = $('<li><label class="checkbox promoteModalCheckBox"><input type="checkbox" name="promoteNodesCheckBox" value=' + data[i].applicationNodeIP + '><i></i>' + data[i].applicationNodeIP + '</label></li>');
                        $li.hide();
                        $ul.append($li);
                    }
                }*/

            var nodeIps = [];
            var count = 0;
            for (var i = 0; i < tasks.taskConfig.nodeIds.length; i++) {
                $.get('/instances/' + tasks.taskConfig.nodeIds[i], function(instance) {
                    count++;
                    if (instance) {
                        nodeIps.push(instance.instanceIP);
                        var $ul = $('#promoteNodesId');
                        var $li = $('<li><label class="checkbox promoteModalCheckBox"><input type="checkbox" name="promoteNodesCheckBox" value=' + instance.instanceIP + '><i></i>' + instance.name + '</label></li>');
                        $li.hide();
                        $ul.append($li);
                    }
                    if (count === tasks.taskConfig.nodeIds.length) {
                        var checked = false;
                        var exists = {};
                        $('#promoteNodesId').find('li').each(function() {
                            var nodeIp = $(this).find('input').val();
                            if (nodeIps.indexOf(nodeIp) !== -1) {
                                if (!exists[nodeIp]) {
                                    $(this).find('input')[0].checked = true;
                                    exists[nodeIp] = true;

                                } else {
                                    $(this).remove();
                                }

                            }
                            $(this).show();
                        });
                    }
                });
            }
            //});
        }
    });
});


function btnPromoteDetailsPipelineViewClickHandler(e) {
    var $modal = $('#modalpromoteConfigure');
    $modal.find('#appPromoteForm')[0].reset();
    $('#chooseEnvironments').empty();
    //$('#chooseEnvironments').append('<option value="">Choose Environment</option>');
    $modal.find('#chooseJobs').empty();
    $('#chooseJobs').append('<option value="">Choose Job</option>');
    $('#chooseSourceEnvironments').empty();
    var $ul = $modal.find('#promoteNodesId');
    $ul.empty();
    var rowData = $(this);
    //getEnvironmentForProject();
    var self = this;
    var projectId = urlParams.projid;
    var appName = $(this).closest('tr').find('.applicationMainIP').html();
    var sourceEnv = $(this).closest('td').find('.applicationEnvNamePipelineView').html();
    var tEnv = $(this).closest('td').next('td').find('.applicationEnvNamePipelineView').html();
    $('#chooseSourceEnvironments').append('<option value=' + sourceEnv + '>' + sourceEnv + '</option>');
    var projectId = urlParams.projid;
    $.get('/d4dMasters/project/' + projectId, function(project) {
        if (project.length) {
            var aProject = project[0];
            var envNames = aProject.environmentname.split(",");
            var envIds = aProject.environmentname_rowid.split(",");
            $.get('/app/deploy/pipeline/project/' + projectId, function(config) {
                if (envNames.length && config.length) {
                    var configEnv = config[0].envId;
                    if (!configEnv.length) {
                        alert("Environment not configured for Application.");
                        return;
                    }
                    for (var i = 0; i < envNames.length; i++) {
                        for (var j = 0; j < configEnv.length; j++) {
                            if (envNames[i] === configEnv[j]) {
                                $('#chooseEnvironments').append('<option data-Name=' + envNames[i] + ' value=' + envIds[i] + '>' + envNames[i] + '</option>');
                            }
                        }
                    }
                    if (tEnv) {
                        $('#chooseEnvironments').find('option[data-name="' + tEnv + '"]').attr('selected', 'selected').change();
                    }
                } else {
                    alert("Either no Environment associated with Project or Environment not configured for Application.");
                    return;
                }
            });
        }

    });

    var version = $(this).closest('tr').find('.versionMain').html();
    $modal.data('appName', appName);
    $modal.data('appVersion', version);
    $modal.find('.promoteSave').off('click').on('click', function() {
        getenvName(function(targetEnvName) {
            var nodeList = [];
            $('#promoteNodesId').find('li').filter(':has(:checkbox:checked)').each(function() {
                var $li = $(this);
                var nodeIp = $li.find('input[name="promoteNodesCheckBox"]').val();
                nodeList.push(nodeIp);
            });

            var taskId = $modal.find('#chooseJobs').find('option:selected').val();
            var choosedEnvName = $modal.find('#chooseEnvironments').find('option:selected').text();
            if (sourceEnv === choosedEnvName) {
                bootbox.confirm({
                    message: "Source environment can't be same as target environment.",
                    title: "Warning",
                    callback: function(result) {}
                });
                return;
            }
            if (targetEnvName != choosedEnvName) {
                bootbox.confirm({
                    message: "Please navigate to target Environment on Tree view in order to promote.",
                    title: "Warning",
                    callback: function(result) {}
                });
                return;
            }
            if (!choosedEnvName) {
                bootbox.confirm({
                    message: "Please Choose Environment.",
                    title: "Warning",
                    callback: function(result) {}
                });
                return;
            }
            if (!taskId) {
                bootbox.confirm({
                    message: "Please Choose Job.",
                    title: "Warning",
                    callback: function(result) {}
                });
                return;
            }
            if (!nodeList.length) {
                bootbox.confirm({
                    message: "Please specify atleast one target node.",
                    title: "Warning",
                    callback: function(result) {}
                });
                return;
            }

            $.get('/tasks/' + taskId, function(tasksData) {
                if (tasksData) {
                    var ipAddress = {
                        "ipAddress": nodeList
                    }
                    $.post('/instances/ipAddress/list', ipAddress, function(instanceIds) {
                        if (instanceIds.length) {
                            tasksData['nodeIds'] = instanceIds;
                            tasksData['runlist'] = tasksData.taskConfig.runlist;
                            tasksData['attributes'] = tasksData.taskConfig.attributes;

                            tasksData['name'] = tasksData.name;
                            tasksData['taskType'] = tasksData.taskType;
                            tasksData['description'] = tasksData.description;
                            tasksData['jobResultURL'] = tasksData.jobResultURL;
                            //tasksData['blueprintIds'] = tasksData.blueprintIds;

                            var reqBody = {
                                    taskData: tasksData
                                }
                                //tasksData.taskType = tasksData.taskConfig.taskType;
                            $.post('../tasks/' + taskId + '/update', reqBody, function(updatedTask) {
                                console.log(updatedTask);
                            });
                        }
                    });
                }

                $.get('/app/data/project/' + projectId + '/env/' + sourceEnv + '?application=' + appName + '&version=' + version, function(data) {
                    if (data.length) {
                        var nexusData = {
                            "nexusData": {
                                "nexusUrl": "",
                                "version": "",
                                "containerId": "",
                                "containerPort": "",
                                "dockerRepo": "",
                                "upgrade": "true"
                            }
                        };


                        if (data[0].nexus && data[0].nexus.nodeIps.length) {
                            nexusData["nexusData"]["nexusUrl"] = data[0].nexus.repoURL;
                            nexusData["nexusData"]["version"] = data[0].version;
                        }

                        if (data[0].docker.length) {
                            nexusData["nexusData"]["dockerImage"] = data[0].docker[0].image;
                            nexusData["nexusData"]["containerId"] = data[0].docker[0].containerId;
                            nexusData["nexusData"]["containerPort"] = data[0].docker[0].containerPort;
                            nexusData["nexusData"]["hostPort"] = data[0].docker[0].hostPort;
                            nexusData["nexusData"]["dockerUser"] = data[0].docker[0].dockerUser;
                            nexusData["nexusData"]["dockerPassword"] = data[0].docker[0].dockerPassword;
                            nexusData["nexusData"]["dockerEmailId"] = data[0].docker[0].dockerEmailId;
                            nexusData["nexusData"]["imageTag"] = data[0].docker[0].imageTag;
                        }

                        var appData = {
                            "appData": {
                                "projectId": data[0].projectId,
                                "envId": targetEnvName,
                                "appName": data[0].appName,
                                "version": data[0].version,
                                "nexus": data[0].nexus,
                                "docker": data[0].docker
                            }
                        };
                        $.ajax({
                            url: '/app/data',
                            data: JSON.stringify(appData),
                            type: 'POST',
                            contentType: "application/json",
                            "async": false,
                            success: function(data) {
                                console.log("Successfully updated app-data.");
                            },
                            error: function(jqxhr) {
                                bootbox.confirm({
                                    message: "Failed to update update appName in Project.",
                                    title: "Warning",
                                    callback: function(result) {}
                                });
                                return;
                            }
                        });

                        $('a[data-executetaskid=' + taskId + ']').trigger('click', nexusData);
                        $('#modalpromoteConfigure').modal('hide');
                    } else {
                        bootbox.confirm({
                            message: "Something went wrong,no repository information available.",
                            title: "Warning",
                            callback: function(result) {}
                        });
                        return;
                        //$('#modalpromoteConfigure').modal('hide');
                    }
                });
            });
        });
    });
    $modal.modal('show');
}

function moreinfoDetailsPipelineViewClickHandler(e) {
    var $td = $(this).closest('td');
    var env = $td.data('envType');
    var $modal = $('#modalDetailsAppDeploy');

    var $row = $(this).closest("tr");
    var rowSetDataDetailsObj = $row.data("appNameVer");
    var applicationNamePipelineText = $(this).parents().eq(5).find('.applicationEnvNamePipelineView').html();
    var $envSpecificDataArr = $('#envSpecificDataTable').DataTable({
        "order": [
            [1, "desc"]
        ],
        destroy: true,
    });
    $envSpecificDataArr.clear().draw();

    for (var i = 0; i < rowSetDataDetailsObj.envId.length; i++) {
        if (rowSetDataDetailsObj.envId[i] === env) {
            var rowSetDetailsLogs = rowSetDataDetailsObj.appLogs[i];
            var nodeIp = rowSetDataDetailsObj.applicationNodeIP[i];
            if (rowSetDetailsLogs) {
                rowSetDetailsLogs = rowSetDetailsLogs.replace(/"/g, '');
            }
            var $tdlogs = '<a class="btn btn-primary btn-sm width27borderradius50 appSpecificLogs " data-logs="' + rowSetDetailsLogs + '"  data-nodeIp="' + nodeIp + '"><i class="fa fa-info font-size-11"></i></a>';
            var applicationLastDeployTime = rowSetDataDetailsObj.applicationLastDeploy[i];

            if ((applicationLastDeployTime.toLowerCase().indexOf("am") > -1) || (applicationLastDeployTime.toLowerCase().indexOf("pm") > -1)) {
                applicationLastDeployTime = applicationLastDeployTime;
            } else {
                applicationLastDeployTime = getLocaleTime(applicationLastDeployTime);
            }
            $envSpecificDataArr.row.add([
                rowSetDataDetailsObj.applicationNodeIP[i],
                applicationLastDeployTime,
                rowSetDataDetailsObj.applicationStatus[i],
                $tdlogs
            ]).draw();

        }
    }
    $('#envSpecificDataTable_length').hide();
    $('#envSpecificDataTable_filter').hide();



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
                        var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul class='createAppUlCSS'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                        var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up createAppUpBtn' type='button'><i class='fa fa-chevron-up createAppUpBtnItag'></i></a><a class='btn btn-default btn-primary down createAppDownBtn' type='button'><i class='fa fa-chevron-down createAppDownBtnItag'></i></a>");
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
                        var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul class='createAppUlCSS'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                        var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up createAppUpBtn' type='button'><i class='fa  fa-chevron-up createAppUpBtnItag'></i></a><a class='btn btn-default btn-primary down createAppDownBtn' type='button'><i class='fa fa-chevron-down createAppDownBtnItag'></i></a>");
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
                    var $tdActive = $('<td/>').html("<div class='iphone-toggle-buttons'><ul class='createAppUlCSS'><li><label for='checkbox-" + i + "'><input type='checkbox' class='appDeployCheckboxOrder' name='checkbox-" + i + "' id='checkbox-" + i + "' " + checked + " /><span></span></label></li></ul></div>");
                    var $tdupdown = $('<td/>').html("<a class='btn btn-default btn-primary up createAppUpBtn' type='button'><i class='fa fa-chevron-up createAppUpBtnItag'></i></a><a class='btn btn-default btn-primary down createAppDownBtn' type='button'><i class='fa  fa-chevron-down createAppDownBtnItag'></i></a>");
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
    if (formatStr) {
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
    if (strInputDate) {
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
    if (obj) {
        var datestring = ("0" + obj.getDate()).slice(-2) + "-" + ("0" + (obj.getMonth() + 1)).slice(-2) + "-" +
            obj.getFullYear() + " " + ("0" + obj.getHours()).slice(-2) + ":" + ("0" + obj.getMinutes()).slice(-2) + ":" + obj.getSeconds();
        return datestring;
    }
}


$('.appdeployConfigureSaveBtn').click(function() {
    configurePipeLine();
});

function configurePipeLine() {
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


    //creationPipelineTableView(projectId, arrEnv, arrPresentEnvSeq);
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
            loadPipeline();
        },
        error: function(jqxhr) {
            $('#modalappcardConfigure').modal('hide');
        }
    });
};

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
    var $hostPort = $('#hostPort');
    $hostPort.val("");
    var $dockerUser = $('#dockerUser');
    $dockerUser.val("");
    var $dockerPassword = $('#dockerPassword');
    $dockerPassword.val("");
    var $dockerEmailId = $('#dockerEmailId');
    $dockerEmailId.val("");
    var $imageTag = $('#imageTag');
    $imageTag.val("");

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
        $('.hostPortClass').hide();
        $('.dockerUserClass').hide();
        $('.dockerPasswordClass').hide();
        $('.dockerEmailIdClass').hide();
        $('.imageTagClass').hide();
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
        $('.hostPortClass').hide();
        $('.dockerUserClass').hide();
        $('.dockerPasswordClass').hide();
        $('.dockerEmailIdClass').hide();
        $('.imageTagClass').hide();
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
        $('.imageTagClass').show();
        $('.containerIdClass').show();
        $('.containerPortClass').show();
        $('.hostPortClass').show();
        $('.dockerUserClass').show();
        $('.dockerPasswordClass').show();
        $('.dockerEmailIdClass').show();
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
        $('.hostPortClass').hide();
        $('.dockerUserClass').hide();
        $('.dockerPasswordClass').hide();
        $('.dockerEmailIdClass').hide();
        $('.imageTagClass').hide();
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
        $('.hostPortClass').show();
        $('.dockerUserClass').show();
        $('.dockerPasswordClass').show();
        $('.dockerEmailIdClass').show();
        $('.imageTagClass').show();
        $('.groupClass').hide();
        $('.repoUrlClass').hide();
        $('.artifactClass').hide();
        $('.versionClass').hide();
        var $imageTag = $('#imageTag');
        $imageTag.empty();
        $('#imageTag').append('<option value= "">Choose Tag</option>');
        getImageTags();
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

// List all tags w.r.t docker image
function getImageTags() {
    var imageName = $('#chooseRepository').find('option:selected').val();
    if (imageName) {
        var repository = "";
        var image = "";
        if (imageName.indexOf("/") != -1) {
            repository = imageName.split("/")[0];
            image = imageName.split("/")[1];
        }

        if (!repository) {
            repository = "library";
        }
        if (!image) {
            image = imageName;
        }
        if (repository && image) {
            $('.tagspinner').removeClass('hidden');
            $.get('/d4dMasters/docker/' + repository + '/' + image + '/tags', function(tags) {
                $('.tagspinner').addClass('hidden');
                if (tags.length) {
                    for (var i = 0; i < tags.length; i++) {
                        $('#imageTag').append('<option value=' + tags[i].name + '>' + tags[i].name + '</option>');

                    }
                }
            });
        } else {
            alert("Invalid docker image.");
            return;
        }
    } else {
        $('.tagspinner').css('display', 'none');
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
    var dockerImage = $('#chooseRepository').find('option:selected').val();
    if (!dockerImage) {
        alert("Please select repository.");
        return false;
    }
    var containerId = $('#containerIdInput').val();
    var containerPort = $('#containerPort').val();
    var hostPort = $('#hostPort').val();
    var dockerUser = $('#dockerUser').val();
    var dockerPassword = $('#dockerPassword').val();
    var dockerEmailId = $('#dockerEmailId').val();
    var imageTag = $('#imageTag').find('option:selected').val();

    if (!containerPort) {
        alert("Please specify container port.");
        return false;
    }
    if (!hostPort) {
        alert("Please specify host port.");
        return false;
    }
    if (!imageTag) {
        alert("Please specify version.");
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
    //var appName = dockerImage.split("/")[1];
    var appName = dockerImage;
    var upgrade = $('#upgradeValue').val();
    var nexusData = {
        "nexusData": {
            "nexusUrl": "",
            "version": "",
            "containerId": containerId,
            "containerPort": containerPort,
            "dockerImage": dockerImage,
            "hostPort": hostPort,
            "dockerUser": dockerUser,
            "dockerPassword": dockerPassword,
            "dockerEmailId": dockerEmailId,
            "imageTag": imageTag,
            "upgrade": upgrade
        }
    };


    $.get('/tasks/' + taskId, function(tasks) {
        if (tasks && tasks.taskConfig.nodeIds.length) {
            var nodeIps = [];
            var count = 0;
            var actualDocker = [];
            for (var i = 0; i < tasks.taskConfig.nodeIds.length; i++) {
                $.get('/instances/' + tasks.taskConfig.nodeIds[i], function(instance) {
                    count++;
                    var docker = {
                        "image": dockerImage,
                        "containerId": containerId,
                        "containerPort": containerPort,
                        "hostPort": hostPort,
                        "dockerUser": dockerUser,
                        "dockerPassword": dockerPassword,
                        "dockerEmailId": dockerEmailId,
                        "imageTag": imageTag,
                        "nodeIp": instance.instanceIP
                    };
                    actualDocker.push(docker);

                    if (instance) {
                        nodeIps.push(instance.instanceIP);
                    }
                    if (tasks.taskConfig.nodeIds.length === count) {
                        getenvName(function(envName) {
                            var appData = {
                                "appData": {
                                    "projectId": instance.projectId,
                                    "envId": envName,
                                    "appName": dockerImage,
                                    "version": imageTag,
                                    "docker": actualDocker
                                }
                            };
                            $.ajax({
                                url: '/app/data',
                                data: JSON.stringify(appData),
                                type: 'POST',
                                contentType: "application/json",
                                success: function(data) {
                                    console.log("Successfully updated app-data");
                                },
                                error: function(jqxhr) {
                                    //alert("Failed to update update appName in Project.")
                                }
                            });
                            $('a[data-executetaskid=' + taskId + ']').trigger('click', nexusData);
                            $('#modalUpgradeAppDeploy').modal('hide');
                        });
                    }
                });
            }
        }
    });
    /*$('a[data-executetaskid=' + taskId + ']').trigger('click', nexusData);
    $('#modalUpgradeAppDeploy').modal('hide');*/
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
            "dockerImage": "",
            "hostPort": "",
            "dockerUser": "",
            "dockerPassword": "",
            "dockerEmailId": "",
            "imageTag": "",
            "upgrade": upgrade
        }
    };


    $.get('/tasks/' + taskId, function(tasks) {
        if (tasks && tasks.taskConfig.nodeIds.length) {
            var nodeIps = [];
            var count = 0;
            for (var i = 0; i < tasks.taskConfig.nodeIds.length; i++) {
                $.get('/instances/' + tasks.taskConfig.nodeIds[i], function(instance) {
                    count++;
                    if (instance) {
                        nodeIps.push(instance.instanceIP);
                    }

                    if (tasks.taskConfig.nodeIds.length === count) {
                        getenvName(function(envName) {
                            var appData = {
                                "appData": {
                                    "projectId": instance.projectId,
                                    "envId": envName,
                                    "appName": artifactId,
                                    "version": versionId,
                                    "nexus": {
                                        "repoURL": nexusRepoUrl,
                                        "nodeIps": nodeIps
                                    }
                                }
                            };
                            $.ajax({
                                url: '/app/data',
                                data: JSON.stringify(appData),
                                type: 'POST',
                                contentType: "application/json",
                                success: function(data) {
                                    console.log("Successfully updated app-data");
                                },
                                error: function(jqxhr) {
                                    alert("Failed to update update appName in Project.");
                                    return;
                                }
                            });
                        });
                    }
                });
            }
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

function managePipelineConfiguration() {
    var projectId = urlParams.projid;
    $.get('/app/deploy/pipeline/project/' + projectId, function(dataPipeline) {
        if (!dataPipeline.length) {
            configurePipeLine();
            var envs = getTableHeaderData(dataPipeline[0].envId);
            creationPipelineTableView(projectId, envs.arrEnv, envs.arrPresentEnvSeq, deployData);
        }
    });
};

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
        $("#nodataAppDeploy").addClass('noDataAppDeployCSS');

        var $accordianTemplate = $('.accordianTemplateContainer').find('.accordianTemplate');
        var dataenvAccordianName;

        function moreInfoAppDeployClickHandler(e) {
            var $modal = $('#modalAppCardLogDetails');
            var $logContainer = $modal.find('.logsForAppDeploy').show();
            $logContainer.empty().append('<img class="center-block loaderImg" src="img/loading.gif" />');
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
            getprojectName(function(projectNameUrlParams) {
                var $clone = $accordianTemplate.clone(true);
                for (var i = 0; i < data.length; i++) {
                    if (data[i].projectId) {
                        var dataenvAccordianName = "Application Deployment for : " + projectNameUrlParams;
                        $clone.find('.envAppDeployName').html(dataenvAccordianName);
                        $clone.find('.panel-title').addClass('padding10');
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
                        var $taskenvArray = $('#tableappDeploydetails');
                        var upgradeAppDeploy;
                        if (!data[i]._id) {
                            upgradeAppDeploy = "NA";
                        } else {
                            upgradeAppDeploy = '<a class="btn btn-primary btn-sg tableactionbutton moreinfoUpgradeAppDeploy upgradeMoreInfoCSS"><i class="ace-icon fa fa-upload bigger-120"></i></a>';
                        }



                        var logsAppDeploy;
                        if (!data[i]._id) {
                            logsAppDeploy = "NA";
                        } else {
                            logsAppDeploy = '<a class="moreinfoAppDeploy marginleft27Per" id=' + data[i]._id + ' title="Logs Info"></a>';
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
                }
            });
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
        $accordianTemplatenoData.addClass('accordianTempnoDataCSS');
        $accordianTemplatenoData.find('.panel-title').addClass('padding0');
        $accordianTemplatenoData.find('.margintop2right8').addClass('margintop-6');
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
