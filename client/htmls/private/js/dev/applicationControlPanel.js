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

$(function() {
    var urlParams = {};
    (window.onpopstate = function() {
        var url = window.location.href;
        var indexOfQues = url.lastIndexOf("?");
        if (indexOfQues != -1) {
            var sub = url.substring(indexOfQues + 1);
            console.log(sub);
            var params = sub.split('&')
            for (var i = 0; i < params.length; i++) {
                var paramParts = params[i].split('=');
                urlParams[paramParts[0]] = paramParts[1];
            }
        }

    })();

    // var htmlTemplate = '<div style="max-width: 262px !important;" class="col-sm-4 col-md-4 col-lg-3 col-xs-12 appcard-role-outer"> <div style="border-radius: 12px;border-color: #dddddd;" class="panel panel-primary appcard-role-inner"> <div style="height:40px;text-align:center;background:#40baf1 !important;border-radius: 10px 10px 0 0;border-color: #40baf1 !important;" class="panel-heading"> <span contenteditable="false" style="float:left;" class="domain-roles-icon"> <img src="img/liferay.jpg" style="height:24px"> </span> <span style="text-align:center;width:30px;font-weight: bold;"> <a class="applicationName" style="color:white" href="javascript:void(0)">Life Ray</a> </span> <span class="pull-right"> <a data-toggle="modal" href="#modalAppCardSettings" style="padding-right:5px;cursor:pointer;color:white;font-size:20px;" class="fa fa-cog"> </a> </span> <br></div><div data-deploy-runlist="recipe[liferay]" data-instance-ip="52.11.46.8" data-jenkin-job-name="LR-Spring" class="appCardBody"> <div style="min-height: 115px;" class="appCardLoadingContainer"> <img src="img/loading.gif" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" class="center-block"> </div><div style="padding: 7px;" class="panel-body panel-primary appCardInfo"> <div class="minheight120"> <div style="height:20px;" class="col-lg-12 col-sm-12 col-xs-12"> <label style="margin-left: 90px;" class="custom-select"> <select style="font-size: 11px;"> <option>AWS_SCLT</option> <option>AWS_CHINA</option> <option>AWS_INDIA</option> </select> </label> </div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 24px;margin-left: -5px;" src="img/projectdemo/app-performanceblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a style="color: #777;font-size: 13px;" href="newrelic.html" target="_blank">App Performance</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/logsblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a style="color: #777;font-size: 13px;" href="kibana.html" target="_blank">App Logs</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/code_healthblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a class="codeHealthUrl" style="color: #777;font-size: 13px;" href="sonar.html" target="_blank">Code Health</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/UI_performanceblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a class="uiHealthUrl" style="color: #777;font-size: 13px;" href="yslow.html" target="_blank">UI Performance</a> </div></div></div></div><div style="padding:3px;border-radius:0 0 12px 12px;background:white!important;" class="panel-footer clearfix"> <div style="padding-left:4px;padding-right:4px;" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="3/3/2015 11:08:28am" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnBuild width100" data-toggle="modal" href="javascript:void(0)">Last Build </a> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="3/3/2015 17:08:52pm" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnDeploy width100" data-toggle="modal" href="javascript:void(0)">Last Deploy </a> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="2/3/2015 09:23:25am" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnTest width100" data-toggle="modal" href="javascript:void(0)">Last Test </a> </div></div><div style="padding-left:4px;padding-right:4px;margin-top:-8px" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 #01df3a;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 red;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 #01df3a;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div></div><div style="padding-left:4px;padding-right:4px;" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a class="btn btn-primary btn-sm width50borderradius50 appCardBuildBtn" data-toggle="modal" href="javascript:void(0)"> <i style="font-size: 14px;" class="fa fa-inbox"> </i> </a> <span style="font-size: 10px;">Build</span> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a class="btn btn-primary btn-sm width40borderradius50Deploy" data-toggle="modal" href="#modalappCardDeploy"> <i style="font-size: 14px;" class="fa fa-bullseye"> </i> </a> <span style="font-size: 10px;">Deploy</span> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="padding-left:10px;" class="btn btn-primary btn-sm width50borderradius50" data-toggle="modal" href="#modalappCardTest"> <i style="font-size: 14px;" class="fa fa-location-arrow"> </i> </a> <span style="font-size: 10px;">Test</span> </div></div></div></div></div></div>';
    var htmlTemplate = '<div style="max-width: 262px ! important; width: 262px; height: 400px;" class="col-sm-4 col-md-4 col-lg-3 col-xs-12 appcard-role-outer"> <div style="border-radius: 12px;border-color: #dddddd;" class="panel panel-primary appcard-role-inner"> <div style="height:40px;text-align:center;background:#40baf1 !important;border-radius: 10px 10px 0 0;border-color: #40baf1 !important;" class="panel-heading"> <span contenteditable="false" style="float:left;" class="domain-roles-icon"> <img src="img/liferay.jpg" style="height:24px"> </span> <span class="applicationName" style="text-align:center;width:30px;font-weight: bold;color:white"> </span> <br></div><div data-deploy-runlist="recipe[liferay]" data-instance-ip="52.11.46.8" data-jenkin-job-name="LR-Spring" class="appCardBody"> <div style="min-height: 115px;" class="appCardLoadingContainer"> <img src="img/loading.gif" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" class="center-block"> </div><div style="padding: 7px;" class="panel-body panel-primary appCardInfo"> <div class="minheight120"> <div style="height:20px;" class="col-lg-12 col-sm-12 col-xs-12 appInstancesDropdownContainer"> <label style="margin-left: 90px;" class="custom-select"> <select class="appInstancesDropdown" style="font-size: 11px;"> </select> </label> </div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 24px;margin-left: -5px;" src="img/projectdemo/app-performanceblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a style="color: #777;font-size: 13px;" href="newrelic.html" target="_blank">App Performance</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/logsblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a style="color: #777;font-size: 13px;" href="kibana.html" target="_blank">App Logs</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/code_healthblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a class="codeHealthUrl" style="color: #777;font-size: 13px;" href="sonar.html" target="_blank">Code Health</a> </div></div><div class="col-lg-12 col-sm-12 col-xs-12 paddingtopbottom10"> <img style="height: 27px;margin-left: -5px;" src="img/projectdemo/UI_performanceblack.png"> <div style=" margin-left: 30px;margin-top: -22px;"> <a class="uiHealthUrl" style="color: #777;font-size: 13px;" href="yslow.html" target="_blank">UI Performance</a> </div></div></div></div><div style="padding:3px;border-radius:0 0 12px 12px;background:white!important;" class="panel-footer clearfix"> <div style="padding-left:4px;padding-right:4px;" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="3/3/2015 11:08:28am" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnBuild width100" data-toggle="modal" href="javascript:void(0)">Last Build </a> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="3/3/2015 17:08:52pm" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnDeploy width100" data-toggle="modal" href="javascript:void(0)">Last Deploy </a> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="margin-bottom:2px;font-size:12px;color:#666" data-original-title="2/3/2015 09:23:25am" data-placement="top" rel="tooltip" class="btn btn-white btn-sm btnTest width100" data-toggle="modal" href="javascript:void(0)">Last Test </a> </div></div><div style="padding-left:4px;padding-right:4px;margin-top:-8px" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 #01df3a;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 red;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="background: none repeat scroll 0 0 #01df3a;margin-bottom:2px; height: 4px;" class="btn btn-white btn-sm btnBuild" data-toggle="modal" href="javascript:void(0)"> </a> </div></div><div style="padding-left:4px;padding-right:4px;" class="col-lg-12 col-sm-12 col-xs-12"> <div style="padding-left:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a class="btn btn-primary btn-sm width50borderradius50 appCardBuildBtn" data-toggle="modal" href="javascript:void(0)"> <i style="font-size: 14px;" class="fa fa-inbox"> </i> </a> <span style="font-size: 10px;">Build</span> </div><div style="padding-left:0px;padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a class="btn btn-primary btn-sm width40borderradius50Deploy appCardDeployBtn" data-toggle="modal" href="javascript:void(0)"> <i style="font-size: 14px;" class="fa fa-bullseye"> </i> </a> <span style="font-size: 10px;">Deploy</span> </div><div style="padding-right:0px;" class="col-lg-4 col-sm-4 col-xs-4"> <a style="padding-left:10px;" class="btn btn-primary btn-sm width50borderradius50" data-toggle="modal" href="#modalappCardTest"> <i style="font-size: 14px;" class="fa fa-location-arrow"> </i> </a> <span style="font-size: 10px;">Test</span> </div></div></div></div></div></div>';

    var $appCardTemplate = $(htmlTemplate);

    var buildUrlsHtmlTemplate = '<a data-original-title="Functional Test" data-placement="top" rel="tooltip" href="javascript:void(0)" class="functionalTestUrl" target="_blank"> <i class="fa fa-fw fa-crosshairs txt-color-blue"></i> </a> <a data-original-title="Performance Test" data-placement="top" rel="tooltip" href="javascript:void(0)" class="perfTestUrl" target="_blank"> <i class="fa fa-fw fa-dot-circle-o txt-color-blue"></i> </a> <a data-original-title="Non Functional Test" data-placement="top" rel="tooltip" href="javascript:void(0)" class="nonFunctionalTestUrl" target="_blank"> <i class="fa fa-fw fa-compass txt-color-blue"></i> </a> <a data-original-title="Security Test" data-placement="top" rel="tooltip" href="javascript:void(0)" class="secTestUrl" target="_blank"> <i class="fa fa-fw fa-lock txt-color-blue"></i> </a> <a data-original-title="Unit Test" data-placement="top" rel="tooltip" href="javascript:void(0)" class="unitTestUrl" target="_blank"> <i class="fa fa-fw fa-lemon-o txt-color-blue"></i> </a> <a data-original-title="Code Coverage" data-placement="top" rel="tooltip" href="javascript:void(0)" class="codeCoverageTestUrl" target="_blank"> <i class="fa fa-fw fa-bookmark-o txt-color-blue"></i> </a> <a data-original-title="Code Analysis" data-placement="top" rel="tooltip" href="javascript:void(0)" class="codeAnalysisTestUrl" target="_blank"> <i class="fa fa-fw fa-barcode txt-color-blue"></i> </a>';

    function addBuildHistoryRow(buildHistory, buildData) {
        var dataTable = $('#tableBuild').DataTable();


        var $trHistoryRow = $('<tr></tr>');
        var $tdSerialNo = $('<td></td>');
        $trHistoryRow.append($tdSerialNo);
        var $tdJobName = $('<td></td>').append(buildHistory.jobName);
        $trHistoryRow.append($tdJobName);

        var timeString = new Date().setTime(buildHistory.timestampStarted);
        var date = new Date(timeString).toLocaleString();

        var $tdBuildNumber = $('<td></td>').append('<span>' + buildHistory.jobNumber + '</span>');
        $trHistoryRow.append($tdBuildNumber);
        if (buildHistory.status === "success") {
            var $tdBuildStatus = $('<td></td>').append('<img src="img/indicator_started.png"/>');
            $trHistoryRow.append($tdBuildStatus);
        } else if (buildHistory.status === "failed") {
            var $tdBuildStatusFailure = $('<td></td>').append('<img src="img/indicator_stopped.png"/>');
            $trHistoryRow.append($tdBuildStatusFailure);
        } else {
            var $tdBuildStatusRunning = $('<td></td>').append('<img src="img/indicator_unknown.png"/>');
            $trHistoryRow.append($tdBuildStatusRunning);
        }


        var $tdUserName = $('<td></td>').append(buildHistory.user);
        $trHistoryRow.append($tdUserName);

        var $tdUrls = $('<td></td>').append(buildUrlsHtmlTemplate);

        $tdUrls.find('.functionalTestUrl').attr('href', buildData.functionalTestUrl);
        $tdUrls.find('.perfTestUrl').attr('href', buildData.performanceTestUrl);
        $tdUrls.find('.nonFunctionalTestUrl').attr('href', buildData.nonFunctionalTestUrl);
        $tdUrls.find('.secTestUrl').attr('href', buildData.securityTestUrl);
        $tdUrls.find('.unitTestUrl').attr('href', buildData.unitTestUrl);
        $tdUrls.find('.codeCoverageTestUrl').attr('href', buildData.codeCoverageTestUrl);
        $tdUrls.find('.codeAnalysisTestUrl').attr('href', buildData.codeAnalysisUrl);

        $trHistoryRow.append($tdUrls);

        var $tdTime = $('<td></td>').append(date);
        $trHistoryRow.append($tdTime);
        var $aLogs = $('<a class="moreinfoBuild" rel="tooltip" data-placement="top" data-original-title="MoreInfo"></a>');
        $aLogs.click(function(e) {
            var $taskExecuteTabsHeaderContainer = $('#taskExecuteTabsHeader').empty();
            var $taskExecuteTabsContent = $('#taskExecuteTabsContent').empty();
            var $modal = $('#appCardBuildResult');

            $modal.find('.loadingContainer').show();
            $modal.find('.errorMsgContainer').hide();
            $modal.find('.outputArea').hide();
            $modal.modal('show');
            $.get('../jenkins/' + buildHistory.jenkinsServerId + '/jobs/' + buildHistory.jobName + '/builds/' + buildHistory.jobNumber + '/output', function(logs) {

                var $liHeader = $('<li><a href="#tab_jenkinsTask" data-toggle="tab">Jenkins Job</a></li>');
                $taskExecuteTabsHeaderContainer.append($liHeader);
                var $tabContent = $('<div class="tab-pane fade" id="tab_jenkinsTask"><div class="taskLogArea chefLOGS"></div></div>');
                $tabContent.find('.taskLogArea').empty().append(logs.output);
                $taskExecuteTabsContent.append($tabContent);
                $liHeader.find('a').click();
                $modal.find('.loadingContainer').hide();
                $modal.find('.errorMsgContainer').hide();
                $modal.find('.outputArea').show();
            }).fail(function(jxhr) {
                $modal.find('.loadingContainer').hide();
                $modal.find('.outputArea').hide();
                var $errorContainer = $modal.find('.errorMsgContainer').show();
                if (jxhr.responseJSON && jxhr.responseJSON.message) {
                    $errorContainer.html(jxhr.responseJSON.message);
                } else {
                    $errorContainer.html("Server Behaved Unexpectedly");
                }
            });

        });
        var $tdLogLink = $('<td></td>').append($aLogs);
        $trHistoryRow.append($tdLogLink);

        dataTable.row.add($trHistoryRow).draw();

        pageSetUp();
    }

    function addDeployHistoryRow(deployHistory) {

        $.get('../applications/' + deployHistory.applicationId + '/appInstances/' + deployHistory.appInstanceId, function(appInstanceData) {
            var dataTable = $('#tableDeploy').DataTable();
            var $trDeployHistoryRow = $('<tr></tr>');
            var $tdSerialNo = $('<td></td>');

            $trDeployHistoryRow.append($tdSerialNo);

            var $tdAppInstance = $('<td></td>').append(appInstanceData.name);
            $trDeployHistoryRow.append($tdAppInstance);

            var workflow = null;
            for (var k = 0; k < appInstanceData.workflows.length; k++) {
                console.log('id ==> ', appInstanceData.workflows[k]._id, " == ", deployHistory.workflowId);
                if (deployHistory.workflowId === appInstanceData.workflows[k]._id) {
                    workflow = appInstanceData.workflows[k];
                    break;
                }
            }
            var $deployWorkflow = $('<td></td>').append(workflow.name);
            $trDeployHistoryRow.append($deployWorkflow);

            var $envSet = $('<td></td>').append(appInstanceData.envId);
            $trDeployHistoryRow.append($envSet);
            $.get('/d4dMasters/readmasterjsonrecord/3/' + appInstanceData.envId, function(data) {
                //console.log(JSON.stringify(data));
                $envSet.html(data.environmentname);
            });

            if (deployHistory.status === "success") {
                var $tdDeployStatus = $('<td></td>').append('<img src="img/indicator_started.png"/>');
                $trDeployHistoryRow.append($tdDeployStatus);
            }
            if (deployHistory.status === "failed") {
                var $tdDeployStatusFailure = $('<td></td>').append('<img src="img/indicator_stopped.png"/>');
                $trDeployHistoryRow.append($tdDeployStatusFailure);
            }
            if (deployHistory.status === "running") {
                var $tdDeployStatusRunning = $('<td></td>').append('<img src="img/indicator_unknown.png"/>');
                $trDeployHistoryRow.append($tdDeployStatusRunning);
            }

            var $tdUserName = $('<td></td>').append(deployHistory.user);
            $trDeployHistoryRow.append($tdUserName);

            var timeString = new Date().setTime(deployHistory.timestampStarted);
            var date = new Date(timeString).toLocaleString();


            var $tdTime = $('<td></td>').append(date);
            $trDeployHistoryRow.append($tdTime);

            //logs
            var $aLogs = $('<a class="moreinfoBuild" rel="tooltip" data-placement="top" data-original-title="Deploy Logs"></a>');
            $aLogs.click(function(e) {
                $('#showDeployLogsLink').data('deployHistoryId', deployHistory._id).click();
            });

            var $tdLogLink = $('<td></td>').append($aLogs);
            $trDeployHistoryRow.append($tdLogLink);

            dataTable.row.add($trDeployHistoryRow).draw();
        });




    }

    function addAppInstanceRow(appInstance, applicationId) {

        var dataTable = $('#appInstancesTable').DataTable();
        var $tr = $('<tr></tr>');
        var $tdSno = $('<td/>');
        $tr.append($tdSno);
        var $tdName = $('<td/>').html(appInstance.name);
        $tr.append($tdName);
        var $tdEnv = $('<td></td>').html(appInstance.envId);
        $tr.append($tdEnv);
        $.get('/d4dMasters/readmasterjsonrecord/3/' + appInstance.envId, function(data) {
            //console.log(JSON.stringify(data));
            $tdEnv.html(data.environmentname);
        });

        /*var $tdNodes = $('<td></td>');
        if (appInstance.nodes && appInstances.nodes.length) {
            var $tdNodes = $tdNodes.html(appInstance.nodes.length + '(<a href="javascript:void(0) />view<a>")');
        }
        $tr.append($tdNodes);
        */

        $tdAction = $('<td><a data-original-title="Deploy" data-placement="top" rel="tooltip" style="border-radius:50%;margin-right:10px;" href="javascript:void(0)" data-toggle="modal" class="btn btn-primary btn-sm appInstanceDeployBtn"><i class="fa fa-bullseye" style="font-size: 14px;"> </i></a><a data-original-title="Edit" data-placement="top" rel="tooltip" style="border-radius:50%;margin-right:10px;" href="#appInstancesEditModal" data-toggle="modal" class="btn btn-info btn-sm editBTN"><i class="fa fa-pencil" style="font-size: 14px;"></i></a><a data-original-title="Delete" data-placement="top" rel="tooltip" style="border-radius:50%" href="javascript:void(0)" data-toggle="modal" class="btn btn-danger btn-sm appInstanceDelBtn"><i class="fa fa-trash" style="font-size: 14px;"> </i></a></td>');
        var hasAppModifyPermission = false;
        if (haspermission('application_instance', 'modify')) {
            hasAppModifyPermission = true;
        }
        if (!hasAppModifyPermission) {
            $tdAction.find('.editBTN').addClass('hidden');
        }
        var hasAppDeletePermission = false;
        if (haspermission('application_instance', 'delete')) {
            hasAppDeletePermission = true;
        }
        if (!hasAppDeletePermission) {
            $tdAction.find('.appInstanceDelBtn').addClass('hidden');
        }
        $tdAction.find('.appInstanceDeployBtn').click(function() {
            var appInstanceId = appInstance._id;
            var $modal = $('#deployConfiguretModel');
            $modal.find('.errorMsgContainer').hide();
            $modal.find('.workFlowArea').hide();
            $modal.find('.deployResultArea').hide();
            $modal.find('.loadingContainer').show();
            $modal.modal('show');
            $.get('../applications/' + applicationId + '/appInstances/' + appInstanceId + '/workflows', function(workflows) {
                var $workflowDropDown = $modal.find('.workflowDropdown');
                $workflowDropDown.empty();
                for (var j = 0; j < workflows.length; j++) {
                    var $option = $('<option></option>').val(workflows[j]._id).html(workflows[j].name);
                    $workflowDropDown.append($option);
                }
                $workflowDropDown.data('applicationId', applicationId);
                $workflowDropDown.data('appInstanceId', appInstanceId);

                $modal.find('.workFlowArea').show();
                $modal.find('.loadingContainer').hide();


            }).fail(function(jxhr) {
                $modal.find('.loadingContainer').hide();
                $modal.find('.workFlowArea').hide();
                $modal.find('.deployResultArea').hide();

                var $errorContainer = $modal.find('.errorMsgContainer').show();
                if (jxhr.responseJSON && jxhr.responseJSON.message) {
                    $errorContainer.html(jxhr.responseJSON.message);
                } else {
                    $errorContainer.html("Server Behaved Unexpectedly");
                }

            });
        });
        $tdAction.find('.appInstanceDelBtn').click(function() {
            $.ajax({
                url: '../applications/' + applicationId + '/appInstances/' + appInstance._id,
                method: 'DELETE',
                success: function() {
                    dataTable.row($tr).remove().draw(false);
                    $('.appInstancesDropdown option[value="' + appInstance._id + '"]').remove();
                },
                error: function() {

                }
            })

        });

        $tr.append($tdAction);
        dataTable.row.add($tr).draw();
        pageSetUp();
    }
    var buildInfo = null;

    function buildEventHandler(e) {
        var applicationId = urlParams.appId;
        var $taskExecuteTabsHeaderContainer = $('#taskExecuteTabsHeader').empty();
        var $taskExecuteTabsContent = $('#taskExecuteTabsContent').empty();
        var $modal = $('#appCardBuildResult');
        $modal.find('.loadingContainer').show();
        $modal.find('.errorMsgContainer').hide();
        $modal.find('.outputArea').hide();
        $modal.modal('show');
        $.get('../applications/' + applicationId + '/build', function(data) {

            if (data.taskType === 'chef') {

            } else {

                //adding to build history tab
                $.get('../applications/' + applicationId + '/lastBuildInfo', function(lastBuildInfo) {
                    if (buildInfo) {
                        addBuildHistoryRow(lastBuildInfo, buildInfo);
                    }

                });


                var $liHeader = $('<li><a href="#tab_jenkinsTask" data-toggle="tab">Jenkins Job</a></li>');
                $taskExecuteTabsHeaderContainer.append($liHeader);
                var $tabContent = $('<div class="tab-pane fade" id="tab_jenkinsTask"><div class="taskLogArea taskLOGS"></div></div>');
                $taskExecuteTabsContent.append($tabContent);

                function pollJob() {
                    $.get('../jenkins/' + data.jenkinsServerId + '/jobs/' + data.jobName, function(job) {
                        console.log(job.lastBuild.number);
                        console.log(data.lastBuildNumber);
                        if (job.lastBuild.number > data.lastBuildNumber) {
                            $modal.find('.loadingContainer').hide();
                            $modal.find('.errorMsgContainer').hide();
                            $modal.find('.outputArea').show();
                            $liHeader.find('a').click();

                            function pollJobOutput() {
                                console.log('data==>', data);
                                $.get('../jenkins/' + data.jenkinsServerId + '/jobs/' + data.jobName + '/builds/' + job.lastBuild.number + '/output', function(jobOutput) {
                                    $tabContent.find('.taskLogArea').html(jobOutput.output);
                                    setTimeout(function() {
                                        if ($('#appCardBuildResult').data()['bs.modal'].isShown) {
                                            pollJobOutput();
                                        }
                                    }, 3000);
                                });
                            }
                            pollJobOutput();
                        } else {
                            pollJob();
                        }
                        console.log(job);
                    });
                }
                pollJob();

            }

        }).fail(function(jxhr) {
            $modal.find('.loadingContainer').hide();
            $modal.find('.outputArea').hide();
            var $errorContainer = $modal.find('.errorMsgContainer').show();
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                $errorContainer.html(jxhr.responseJSON.message);
            } else {
                $errorContainer.html("Server Behaved Unexpectedly");
            }
        });
    }

    $('#showDeployLogsLink').click(function(e) {
        var $this = $(this);
        var $modal = $('#deployResultModel');
        $modal.find('.errorMsgContainer').hide();
        $modal.find('.outputArea').hide();
        $modal.find('.loadingContainer').show();
        $modal.modal('show');
        var deployHistoryId = $this.data('deployHistoryId');
        $.get('../applications/' + urlParams.appId + '/deployHistory/' + deployHistoryId, function(history) {

            $.get('../applications/' + history.applicationId + '/appInstances/' + history.appInstanceId + '/workflows/' + history.workflowId, function(workflow) {
                $.post('../tasks', {
                    taskIds: workflow.taskIds
                }, function(tasks) {
                    var $taskList = $('#logTaskList').empty();
                    for (var i = 0; i < tasks.length; i++) {
                        var $option = $('<option></option>').val(tasks[i]._id).html(tasks[i].name).data('task', tasks[i]);
                        $option.data('timestampStarted', history.timestampStarted);
                        $option.data('timestampEnded', history.timestampEnded);
                        $taskList.append($option);
                    }
                    if (tasks.length) {
                        $taskList.change();
                    }
                    $modal.find('.loadingContainer').hide();
                    $modal.find('.outputArea').show();
                }).fail(function(jxhr) {
                    $modal.find('.loadingContainer').hide();
                    $modal.find('.outputArea').hide();
                    var $errorContainer = $modal.find('.errorMsgContainer').show();
                    if (jxhr.responseJSON && jxhr.responseJSON.message) {
                        $errorContainer.html(jxhr.responseJSON.message);
                    } else {
                        $errorContainer.html("Server Behaved Unexpectedly");
                    }

                });
            }).fail(function(jxhr) {
                $modal.find('.loadingContainer').hide();
                $modal.find('.outputArea').hide();
                var $errorContainer = $modal.find('.errorMsgContainer').show();
                if (jxhr.responseJSON && jxhr.responseJSON.message) {
                    $errorContainer.html(jxhr.responseJSON.message);
                } else {
                    $errorContainer.html("Server Behaved Unexpectedly");
                }

            });
        }).fail(function(jxhr) {
            $modal.find('.loadingContainer').hide();
            $modal.find('.outputArea').hide();
            var $errorContainer = $modal.find('.errorMsgContainer').show();
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                $errorContainer.html(jxhr.responseJSON.message);
            } else {
                $errorContainer.html("Server Behaved Unexpectedly");
            }

        });
    });


    function pollTaskLogs($tabLink, $tab, timestamp, timestampEnded, delay, clearData) {
        var instanceId = $tabLink.attr('data-taskInstanceId');
        var poll = $tabLink.attr('data-taskPolling');
        if (poll !== 'true') {
            console.log('not polling');
            return;
        }

        var url = '../instances/' + instanceId + '/logs';
        if (timestamp) {
            url = url + '?timestamp=' + timestamp;
            if (timestampEnded) {
                url = url + '&timestampEnded=' + timestampEnded;
            }
        }

        timeout = setTimeout(function() {
            $.get(url, function(data) {
                var $modalBody = $tab.find('.taskLogArea')
                if (clearData) {
                    $modalBody.empty();
                }
                var $table = $('<table></table>');

                for (var i = 0; i < data.length; i++) {
                    var $rowDiv = $('<tr class="row"></tr>');
                    var timeString = new Date().setTime(data[i].timestamp);
                    var date = new Date(timeString).toLocaleString(); //converts to human readable strings

                    /*$rowDiv.append($('<div class="col-lg-4 col-sm-4"></div>').append('<div>' + date + '</div>'));*/

                    if (data[i].err) {
                        $rowDiv.append($('<td class="col-lg-12 col-sm-12" style="color:red;"></td>').append('<span class="textLogs">' + date + '</span>' + '&nbsp;&nbsp;&nbsp;' + '<span>' + data[i].log + '</span>'));
                    } else {
                        $rowDiv.append($('<td class="col-lg-12 col-sm-12" style="color:DarkBlue;"></td>').append('<span class="textLogs">' + date + '</span>' + '&nbsp;&nbsp;&nbsp;' + '<span>' + data[i].log + '</span>'));
                    }

                    $table.append($rowDiv);
                    $table.append('<hr/>');

                }


                if (data.length) {
                    lastTimestamp = data[data.length - 1].timestamp;
                    console.log(lastTimestamp);
                    $modalBody.append($table);
                    $modalBody.scrollTop($modalBody[0].scrollHeight + 100);
                    $tabLink.attr('data-taskPollLastTimestamp', data[data.length - 1].timestamp);

                }


                console.log('polling again');
                if (!timestampEnded && $tabLink.attr('data-taskPolling') === 'true' && $('#deployResultModel').data()['bs.modal'].isShown) {

                    pollTaskLogs($tabLink, $tab, $tabLink.attr('data-taskPollLastTimestamp'), null, 1000, false);

                } else {
                    console.log('not polling again');
                }
            });
        }, delay);
    }

    $('#logTaskList').change(function(e) {
        var $option = $(this).find(":selected");
        console.log($option, $(this).val());
        var task = $option.data('task');
        var instanceIds = task.taskConfig.nodeIds;

        var timestampStarted = $option.data('timestampStarted');
        var timestampEnded = $option.data('timestampEnded');

        var $modal = $('#deployResultModel');
        $modal.find('.instanceErrorMsgContainer').hide();
        $modal.find('.instanceLogsOutputContainer').hide();
        $modal.find('.instanceLoadingContainer').show();

        var $taskExecuteTabsHeaderContainer = $('#deployTaskExecuteTabsHeader').empty();
        var $taskExecuteTabsContent = $('#deployTaskExecuteTabsContent').empty();

        $.post('../instances', {
            instanceIds: instanceIds
        }, function(instances) {
            for (var i = 0; i < instances.length; i++) {
                var $liHeader = $('<li><a href="#tab_' + instances[i]._id + '" data-toggle="tab" data-taskInstanceId="' + instances[i]._id + '">' + instances[i].chef.chefNodeName + '</a></li>');
                if (i === 4) {
                    var $liMoreHeader = $('<li class="dropdown dropdownlog"><a href="javascript:void(0);" class="dropdown-toggle" data-toggle="dropdown">More... <b class="caret"></b></a><ul class="dropdown-menu"></ul></li>');

                    $taskExecuteTabsHeaderContainer.append($liMoreHeader);

                    $taskExecuteTabsHeaderContainer = $liMoreHeader.find('ul');

                }

                $taskExecuteTabsHeaderContainer.append($liHeader);

                var $tabContent = $('<div class="tab-pane fade" id="tab_' + instances[i]._id + '"><div class="taskLogArea chefLOGS" style="font-size:13px;"></div></div>');

                $taskExecuteTabsContent.append($tabContent);


            }
            //shown event
            $taskExecuteTabsHeaderContainer.find('a[data-toggle="tab"]').each(function(e) {
                $(this).attr('data-taskPolling', 'true');
                var tabId = $(this).attr('href')
                var lastTimestamp = null;
                if (timestampEnded) {
                    lastTimestamp = timestampEnded;
                }
                pollTaskLogs($(this), $(tabId), timestampStarted, lastTimestamp, 0, false);
                //e.relatedTarget // previous active tab
            });

            $taskExecuteTabsHeaderContainer.find('a[data-toggle="tab"]').on('hidden.bs.tab', function(e) {
                $(e.target).attr('data-taskPolling', 'true');
                //e.relatedTarget // previous active tab
            }).first().click();
            $modal.find('.instanceErrorMsgContainer').hide();
            $modal.find('.instanceLoadingContainer').hide();
            $modal.find('.instanceLogsOutputContainer').show();
        }).fail(function(jxhr) {
            $modal.find('.instanceLoadingContainer').hide();
            $modal.find('.instanceLogsOutputContainer').hide();
            var $errorContainer = $modal.find('.instanceErrorMsgContainer').show();
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                $errorContainer.html(jxhr.responseJSON.message);
            } else {
                $errorContainer.html("Server Behaved Unexpectedly");
            }
        });
    });



    function createAppCard(data) {
        var $appCard = $appCardTemplate.clone();
        var applicationId = data._id;
        $appCard.data('applicationId', data._id);

        //setting up name 
        $appCard.find('.appcard-role-outer').css({
            'width': '262px',
            'height': '400px'
        });
        $appCard.find('.applicationName').html(data.name);
        $('.applicationNameLabel').html(data.name);
        if (data.git) {
            $('.gitUrlLabel').html(data.git.repoUrl);
        }
        $appCard.find('.appcard-role-inner').click(function(e) {
            var selectedappcardDesign = $(".appcard-role-inner").index($(this));
            localStorage.setItem("selectedappcardDesign", selectedappcardDesign);
            $('.appcard-role-inner').removeClass('role-Selectedcard-app');
            $(this).addClass('role-Selectedcard-app');
        });


        if (!data.appInstances.length) {
            $appCard.find('.appInstancesDropdownContainer').css({
                'visibility': 'hidden'
            });
        }
        for (var i = 0; i < data.appInstances.length; i++) {
            addAppInstanceRow(data.appInstances[i], data._id);
            $appCard.find('.appInstancesDropdown').append($('<option></option>').val(data.appInstances[i]._id).html(data.appInstances[i].name));
        }

        $.get('../applications/' + applicationId + '/buildConf', function(buildData) {
            buildInfo = buildData;
            $appCard.find('.codeHealthUrl').attr('href', buildData.codeAnalysisUrl);
            $appCard.find('.uiHealthUrl').attr('href', buildData.uiPerformaceUrl);

            // getting task name
            $.get('../tasks/' + buildData.taskId, function(task) {
                $('.buildTaskName').html(task.name);
            });

            $.get('/d4dMasters/readmasterjsonrecord/3/' + buildData.envId, function(data) {
                //console.log(JSON.stringify(data));
                $('.buildEnvLabel').html(data.environmentname);
            });
            var $buildParameterForm = $('.buildParameterForm');
            if (buildData.functionalTestUrl) {
                $buildParameterForm.find('.functionalTestUrlContainer').find('.urlValue').val(buildData.functionalTestUrl);
            }
            if (buildData.performanceTestUrl) {
                $buildParameterForm.find('.performanceTestUrlContainer').find('.urlValue').val(buildData.performanceTestUrl);
            }
            if (buildData.securityTestUrl) {
                $buildParameterForm.find('.securityTestUrlContainer').find('.urlValue').val(buildData.securityTestUrl);
            }
            if (buildData.nonFunctionalTestUrl) {
                $buildParameterForm.find('.nonFunctionalTestUrlContainer').find('.urlValue').val(buildData.nonFunctionalTestUrl);
            }
            if (buildData.unitTestUrl) {
                $buildParameterForm.find('.unitTestUrlContainer').find('.urlValue').val(buildData.unitTestUrl);
            }
            if (buildData.codeCoverageTestUrl) {
                $buildParameterForm.find('.codeCoverageUrlContainer').find('.urlValue').val(buildData.codeCoverageTestUrl);
            }
            if (buildData.codeAnalysisUrl) {
                $buildParameterForm.find('.codeAnalysisUrlContainer').find('.urlValue').val(buildData.codeAnalysisUrl);
            }
            if (buildData.uiPerformaceUrl) {
                $buildParameterForm.find('.uiPerformanceTestUrlContainer').find('.urlValue').val(buildData.uiPerformaceUrl);
            }



            // setting build history
            $.get('../applications/' + applicationId + '/buildHistory', function(buildHistories) {
                for (var i = 0; i < buildHistories.length; i++) {
                    addBuildHistoryRow(buildHistories[i], buildData);
                }
            });
        });
        //searcg deploy history
        $.get('../applications/' + applicationId + '/deployHistory', function(deployHistories) {
            for (var i = 0; i < deployHistories.length; i++) {
                addDeployHistoryRow(deployHistories[i]);
            }
        });



        $appCard.find('.appCardDeployBtn').data('applicationId', data._id).click(function(e) {
            var applicationId = $(this).data('applicationId');
            var appInstanceId = $appCard.find('.appInstancesDropdown').val();
            var $modal = $('#deployConfiguretModel');
            $modal.find('.errorMsgContainer').hide();
            $modal.find('.workFlowArea').hide();
            $modal.find('.deployResultArea').hide();
            $modal.find('.loadingContainer').show();
            $modal.modal('show');
            $.get('../applications/' + applicationId + '/appInstances/' + appInstanceId + '/workflows', function(workflows) {
                var $workflowDropDown = $modal.find('.workflowDropdown');
                $workflowDropDown.empty();
                for (var j = 0; j < workflows.length; j++) {
                    var $option = $('<option></option>').val(workflows[j]._id).html(workflows[j].name);
                    $workflowDropDown.append($option);
                }
                $workflowDropDown.data('applicationId', applicationId);
                $workflowDropDown.data('appInstanceId', appInstanceId);

                $modal.find('.workFlowArea').show();
                $modal.find('.loadingContainer').hide();

            }).fail(function(jxhr) {
                $modal.find('.loadingContainer').hide();
                $modal.find('.workFlowArea').hide();
                $modal.find('.deployResultArea').hide();

                var $errorContainer = $modal.find('.errorMsgContainer').show();
                if (jxhr.responseJSON && jxhr.responseJSON.message) {
                    $errorContainer.html(jxhr.responseJSON.message);
                } else {
                    $errorContainer.html("Server Behaved Unexpectedly");
                }

            });

        });
        $appCard.find('.appCardBuildBtn').click(buildEventHandler);
        $('.appCardBuildBtn').click(buildEventHandler);

        return $appCard;
    }

    $('.executeWorkflowBtn').click(function(e) {
        var $modal = $('#deployConfiguretModel');
        $modal.find('.errorMsgContainer').hide();
        $modal.find('.workFlowArea').hide();
        $modal.find('.deployResultArea').hide();
        $modal.find('.loadingContainer').show();
        var $workflowDropDown = $modal.find('.workflowDropdown');
        var applicationId = $workflowDropDown.data('applicationId');
        var appInstanceId = $workflowDropDown.data('appInstanceId');
        var workflowId = $workflowDropDown.val();

        $.get('../applications/' + applicationId + '/appInstances/' + appInstanceId + '/workflows/' + workflowId + '/execute', function(result) {
            $modal.find('.loadingContainer').hide();
            $modal.find('.workFlowArea').hide();
            $modal.find('.deployResultArea').show();

            $.get('../applications/' + applicationId + '/lastDeployInfo', function(lastDeploy) {
                if (lastDeploy) {
                    addDeployHistoryRow(lastDeploy);
                    $('#showDeployLogsLink').data('deployHistoryId', lastDeploy._id).click();
                }
            });

        }).fail(function(jxhr) {
            $modal.find('.loadingContainer').hide();
            $modal.find('.workFlowArea').hide();
            $modal.find('.deployResultArea').hide();

            var $errorContainer = $modal.find('.errorMsgContainer').show();
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                $errorContainer.html(jxhr.responseJSON.message);
            } else {
                $errorContainer.html("Server Behaved Unexpectedly");
            }
        });

    });

    $('.buildParameterForm').submit(function(e) {
        var buildParameters = {};
        var $this = $(this);
        buildParameters.functionalTestUrl = $this.find('.functionalTestUrlContainer').find('.urlValue').val();
        buildParameters.performanceTestUrl = $this.find('.performanceTestUrlContainer').find('.urlValue').val();
        buildParameters.nonFunctionalTestUrl = $this.find('.nonFunctionalTestUrlContainer').find('.urlValue').val();
        buildParameters.securityTestUrl = $this.find('.securityTestUrlContainer').find('.urlValue').val();
        buildParameters.unitTestUrl = $this.find('.unitTestUrlContainer').find('.urlValue').val();
        buildParameters.codeCoverageTestUrl = $this.find('.codeCoverageUrlContainer').find('.urlValue').val();
        buildParameters.codeAnalysisUrl = $this.find('.codeAnalysisUrlContainer').find('.urlValue').val();
        buildParameters.uiPerformaceUrl = $this.find('.uiPerformanceTestUrlContainer').find('.urlValue').val();
        $.post('../applications/'+urlParams.appId+'/buildConf/buildParameters', {
            buildParameters: buildParameters
        }, function(buildData) {
            $('.codeHealthUrl').attr('href', buildData.codeAnalysisUrl);
            $('.uiHealthUrl').attr('href', buildData.uiPerformaceUrl);
            var $saveNotification = $('.buildParameterSaveNotification').show();
            $saveNotification.fadeOut(1000);
        });
        return false;
    });



    // loading cards

    $.get('../applications/' + urlParams.appId, function(app) {
        var $cardList = $('.appcardList');
        console.log(app);
        if (app) {
            $cardList.append(createAppCard(app));
        }

        // loading envronments 
        $.get('../d4dMasters/3/orgname_rowid/' + app.orgId, function(envs) {
            envs = JSON.parse(envs);
            var $envList = $('#environmentList');
            if (envs.length) {
                $envList.prop("disabled", false);
            }
            for (var i = 0; i < envs.length; i++) {
                var $option = $('<option></option>').html(envs[i].environmentname).val(envs[i].rowid);
                $envList.append($option);
            }

            $envList.change(function(e) {

                var envId = $(this).val();
                if (envId) {
                    var $taskList = $('#deploymentTaskList').empty();
                    $.get('/organizations/' + app.orgId + '/businessgroups/' + app.bgId + '/projects/' + app.projectId + '/environments/' + envId + '/tasks', function(tasks) {
                        for (var i = 0; i < tasks.length; i++) {
                            if (tasks[i].taskType === 'chef') {
                                var $li = $('<li></li>');
                                $li.append('<label style="margin: 5px;" class="checkbox"><input type="checkbox" data-tasknamename="' + tasks[i].name + '" name="checkboxTasklist" value="' + tasks[i]._id + '"><i></i>' + tasks[i].name + '</label>');
                                $taskList.append($li);
                            }
                        }
                    });
                }
            });

        });



    });



    // addAppInstanceBtn 

    $('.addAppInstanceBtn').click(function(e) {

        var reqBody = {};
        reqBody.name = $('#applicationInstanceNameInput').val();
        if (!reqBody.name) {
            alert('Please Enter AppInstance Name');
            return;
        }
        reqBody.envId = $('#environmentList').val();
        if (!reqBody.envId) {
            alert('Please Choose an Environment');
            return;
        }
        var taskIds = [];
        var $inputs = $('.deploymentSelectedTasks').find('input');
        $inputs.each(function(e) {
            taskIds.push($(this).val());
        });
        reqBody.workflows = [{
            name: $('#applicationWorkflowNameInput').val(),
            taskIds: taskIds
        }]
        if (!reqBody.workflows[0].name) {
            alert('Please Enter Workflow name');
            return;
        }

        if (!reqBody.workflows[0].taskIds.length) {
            alert('Please Choose tasks');
            return;
        }

        $.post('../applications/' + urlParams.appId + '/appInstances', {
            appInstanceData: reqBody
        }, function(appInstance) {

            var $dropdownContainer = $('.appInstancesDropdownContainer').css({
                'visibility': 'visible'
            });
            addAppInstanceRow(appInstance, urlParams.appId);
            $dropdownContainer.find('.appInstancesDropdown').append($('<option></option>').val(appInstance._id).html(appInstance.name));
            $('#modaladdAppInstances').modal('hide');

        }).fail(function(jxhr) {
            alert('Server Behaved Unexpectedly');
        });


    });


    if (!$.fn.dataTable.isDataTable('#tableBuild')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tableBuild').DataTable({
            "pagingType": "full_numbers",
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
                "bSortable": false
            }],
            "fnRowCallback": function(nRow, aData, iDisplayIndex) {
                $("td:first", nRow).html(iDisplayIndex + 1);
                return nRow;
            }
        });
    }

    if (!$.fn.dataTable.isDataTable('#appInstancesTable')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#appInstancesTable').DataTable({
            "pagingType": "full_numbers",
            "aoColumns": [{
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }],
            "fnRowCallback": function(nRow, aData, iDisplayIndex) {
                $("td:first", nRow).html(iDisplayIndex + 1);
                return nRow;
            }
        });
    }

    if (!$.fn.dataTable.isDataTable('#tableDeploy')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tableDeploy').DataTable({
            "pagingType": "full_numbers",
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
                "bSortable": false
            }],
            "fnRowCallback": function(nRow, aData, iDisplayIndex) {
                $("td:first", nRow).html(iDisplayIndex + 1);
                return nRow;
            }
        });
    }
    if (!$.fn.dataTable.isDataTable('#tableDeploy2')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tableDeploy2').DataTable({
            "pagingType": "full_numbers",
            "aoColumns": [{
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": false
            }]
        });
    }

    if (!$.fn.dataTable.isDataTable('#tableUITest')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tableUITest').DataTable({
            "pagingType": "full_numbers",
            "aoColumns": [{
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }]
        });
    }

    if (!$.fn.dataTable.isDataTable('#tablePerformanceTest')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tablePerformanceTest').DataTable({
            "pagingType": "full_numbers",
            "aoColumns": [{
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }]
        });
    }

    if (!$.fn.dataTable.isDataTable('#tableFunctionalTest')) {
        // $buildDatatable =  $('#tableBuild').DataTable({
        $('#tableFunctionalTest').DataTable({
            "pagingType": "full_numbers",
            "aoColumns": [{
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }, {
                "bSortable": true
            }]
        });
    }




    $('.btnItemAdd').click(function(e) {
        //alert('hello');
        var $deploymentSelectedList = $('.deploymentSelectedTasks');
        var $selectedCookbooks = $("input[name=checkboxTasklist]:checked");
        $selectedCookbooks.each(function(idx) {
            var $this = $(this);
            $deploymentSelectedList.append($('<li title="' + $this.attr('data-tasknamename') + '"><label style="margin: 5px;"><input type="hidden" value="' + $this.val() + '"/>' + $this.attr('data-tasknamename').substr(0, 15) + '</label></li>').on('click', function(e) {
                if ($(this).hasClass('deploymentCookbookSelected')) {
                    $(this).removeClass('deploymentCookbookSelected');
                } else {
                    $(this).addClass('deploymentCookbookSelected');
                }
            }));
            $this.attr('checked', false);
            $this.parents('li').hide().data('itemSelected', true);
        });
        e.preventDefault();
        return (false);
    });

    $('.btnItemRemove').click(function(e) {
        var $deploymentSelectedList = $('.deploymentSelectedTasks');
        $deploymentSelectedList.find('.deploymentCookbookSelected').each(function() {
            var value = $(this).find('input').val();
            var selector = 'input[name=checkboxRole][value="' + value + '"]';
            console.log(selector);
            $('input[name=checkboxRole][value="' + value + '"]').parents('li').show().data('itemSelected', false);
            $('input[name=checkboxTasklist][value="' + value + '"]').parents('li').show().data('itemSelected', false);
            $(this).remove();
        });
        //chrome fix - Page refresh - Vinod 
        e.preventDefault();
        return (false);
    });

    $(".btnItemUp").on('click', function(e) {
        var $selectedRunlist = $('.deploymentCookbookSelected');

        $selectedRunlist.insertBefore($selectedRunlist.first().prev());
        //chrome fix - Page refresh - Vinod 
        e.preventDefault();
        return (false);
    });

    $(".btnItemDown").on('click', function(e) {
        var $selectedRunlistDown = $('.deploymentCookbookSelected');

        $selectedRunlistDown.insertAfter($selectedRunlistDown.last().next());
        //chrome fix - Page refresh - Vinod 
        e.preventDefault();
        return (false);
    });

    pageSetUp();
});
$(document).ready(function() {
    pageSetUp();
});