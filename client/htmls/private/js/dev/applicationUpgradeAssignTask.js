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
    //To Add
    $('#compositeTasksList').on('dblclick', 'option', function() {
        var $this = $(this);
        var $selectedList = $("#compositeselectedTasksList");
        $selectedList.append($this.clone());
        $this.hide();
    });
    //To Remove
    $('#compositeselectedTasksList').on('dblclick', 'option', function() {
        var $instanceCookbookList = $('#compositeTasksList');
        var $this = $(this);
        var value = $this.val();
        $this.remove();
        $instanceCookbookList.find('option[value="' + value + '"]').show();
    });
    //To add the wizard
    $("#btnaddToassignedTasksList").on('click', function() {
        var $options = $('#compositeTasksList option:selected');
        var $selectedList = $("#compositeselectedTasksList");
        $options.each(function() {
            var $this = $(this);
            $selectedList.append($this.clone());
            $this.hide();
        });
    });

    $("#btnremoveFromassignedTasksList").on('click', function() {
        var $instanceCookbookList = $('#compositeTasksList');

        $("#compositeselectedTasksList option:selected").each(function() {
            var $this = $(this);
            var value = $this.val();
            $this.remove();
            $instanceCookbookList.find('option[value="' + value + '"]').show();
        });
    });

    $("#btnassignedTasksListItemUp").on('click', function() {
        $("#compositeselectedTasksList option:selected").each(function() {
            var listItem = $(this);
            var listItemPosition = $("#compositeselectedTasksList option").index(listItem) + 1;

            if (listItemPosition == 1) return false;

            listItem.insertBefore(listItem.prev());
        });

    });

    $("#btnassignedTasksListItemDown").on('click', function() {
        var itemsCount = $("#compositeselectedTasksList option").length;

        $($("#compositeselectedTasksList option:selected").get().reverse()).each(function() {
            var listItem = $(this);
            var listItemPosition = $("#compositeselectedTasksList option").index(listItem) + 1;

            if (listItemPosition == itemsCount) return false;

            listItem.insertAfter(listItem.next());

        });
    });
});


//datatable for runlist
if (!$.fn.dataTable.isDataTable('#tableRunlist')) {
    //var $taskListArea = $('.taskListArea').empty();
    $tasksRunlist = $('#tableRunlist').DataTable({
        "pagingType": "full_numbers",
        "bInfo": false,
        "bLengthChange": false,
        "paging": false,
        "bFilter": false,
        "bSort": false,
        "aoColumns": [{
            "bSortable": false
        }]
    });
}

//datatable for jobResult
if (!$.fn.dataTable.isDataTable('#tableJobList')) {
    //var $taskListArea = $('.taskListArea').empty();
    $jobList = $('#tableJobList').DataTable({
        "pagingType": "full_numbers",
        "bInfo": false,
        "bLengthChange": false,
        "paging": false,
        "bFilter": false,
        "aoColumns": [{
            "bSortable": false,
            "sWidth": "80%",
        }, {
            "bSortable": false,
            "sWidth": "20%"
        }]
    });
}

//datatable for parameters
if (!$.fn.dataTable.isDataTable('#tableParameters')) {
    //var $taskListArea = $('.taskListArea').empty();
    $paramList = $('#tableParameters').DataTable({
        "pagingType": "full_numbers",
        "bInfo": false,
        "bLengthChange": false,
        "paging": false,
        "bFilter": false,
        "aoColumns": [{
            "bSortable": false
        }, {
            "bSortable": false
        }, {
            "bSortable": false
        }, {
            "bSortable": false
        }, {
            "bSortable": false,
            "sWidth": "20%"
        }]
    });
}

$(document).ready(function() {
    $('[data-toggle="popover"]').popover({
        trigger: 'focus'
    });

    $('.addListUrl').click(function(e) {
        $('#jobLinkCreate').trigger("reset");
    });
    $('.addListParam').click(function(e) {
        $('#parameterCreate').trigger('reset');
        // $('#parametersSelect').("val","");
        $('#booleanTable').addClass('hidden');
        $('#stringTable').addClass('hidden');
        $('#choiceTable').addClass('hidden');
    });
});



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

function validatejson(attrctrl) {
    try {
        if (attrctrl.val().trim() != '')
            var attrjson = $.parseJSON(attrctrl.val());
    } catch (err) {
        $('#attrmessage').html('Invalid JSON');
        $('#attrmessage').attr('title', 'Error:' + err);
    }
}

$(document).ready(function() {
    // $(".chooseTasktype").select2();
    // $("#jenkinsServerList").select2();
    // $("#jobListJenkins").select2();
    // $("#parametersSelect").select2();
    // $(".assignuserListJenkins").select2();


    $(document).on('shown.bs.modal', function(e) {
        $('[autofocus]', e.target).focus();
    });

    var $addParameters = $('#addParameters');
    var $addParametersFalse = $('#addParametersFalse');

    $addParametersFalse.change(function() {
        if ($(this).is(":checked")) {
            $('.addParameters').addClass('hidden');
        }
    });

    $addParameters.change(function() {
        if ($(this).is(":checked")) {
            $('.addParameters').removeClass('hidden');
        } else {
            $('.addParameters').addClass('hidden');
        }

    });

    function loadUIData(taskData) {
        console.log("I am in loadUIData");
        var $ccr = $chefCookbookRoleSelector(urlParams.org, function(data) {

        }, runlist, false, {
            deploy: true,
            all: true,
            roles: false,
            cookbooks: false,
            templates: true,

        });
        if (taskData) {
            //On edit click for a Job.
            console.log("I am in loadUIData inside taskData");
            $('.widget-header').find('.widget-margin').html('Edit Job');
            $('.inputTaskName').val(taskData.name);
            $('#compositeTaskName').val(taskData.name);
            $('#taskType').val(taskData.taskType);
            $('#taskType').change();
            $('#taskType').attr('disabled', 'disabled');
            $('textarea#chefDescription').val(taskData.description);
            $('textarea#jenkinsDescription').val(taskData.description);
            $('textarea#compositeDescription').val(taskData.description);

            if (taskData.taskConfig.runlist && taskData.taskConfig.runlist.length) {
                // alert(taskData.taskConfig.runlist);
                if (taskData.taskConfig.runlist.length > 0) {
                    // alert(taskData.taskConfig.runlist.length);
                    createRunlistTable($ccr.getRunlistNames(taskData.taskConfig.runlist));
                }
            }
            if (taskData && taskData.taskType === 'composite') {
                if (taskData.taskConfig.assignTasks && taskData.taskConfig.assignTasks.length) {
                    if (taskData.taskConfig.assignTasks.length > 0) {
                        loadTaskLists(taskData);
                    }
                }
            }

            // console.log('urls ===> ',taskData.taskConfig.jobResultURL);

            if (taskData.taskConfig.jobResultURL && taskData.taskConfig.jobResultURL.length) {
                // alert(taskData.taskConfig.runlist);
                //alert('edit mode');
                for (var z = 0; z < taskData.taskConfig.jobResultURL.length; z++) {
                    console.log('urls ===> ', taskData.taskConfig.jobResultURL);
                    createJobLinksTable(taskData.taskConfig.jobResultURL[z]);


                }
            }
            if (taskData.taskConfig.attributes && taskData.taskConfig.attributes.length) {
                //$('#attrtextarea').text(JSON.stringify(taskData.taskConfig.attributesjson));
                createAttribTableRowFromJson(taskData.taskConfig.attributes);
                //createAttribTableRowFromJson([]);
            }
            if (taskData && taskData.taskType === 'jenkins' && taskData.taskConfig.autoSyncFlag) {

                console.log('reading auto sync flag as:', taskData.taskConfig.autoSyncFlag);

                if (taskData.taskConfig.autoSyncFlag === 'true') {
                    //$('input:radio[class=test1][id=test2]').prop('checked', true);
                    $("input[type='radio'][name='auto_sync'][id='radio_yes']").prop('checked', true);
                } else {
                    $("input[type='radio'][name='auto_sync'][id='radio_no']").prop('checked', true);
                }

            }
            //condition for parameterized build while edit
            console.log("check>>>>>>>>>>>" + JSON.stringify(taskData));
            if (taskData && taskData.taskType === 'jenkins' && taskData.taskConfig.parameterized) {

                console.log('reading parameterized flag as:', taskData.taskConfig.parameterized);
                //  alert(taskData.taskConfig.parameterized.length);
                if (taskData.taskConfig.parameterized.length > 0) {
                    //alert(taskData.parameterized.length);
                    for (var j = 0; j < taskData.taskConfig.parameterized.length; j++) {
                        //  alert(JSON.stringify(taskData.taskConfig.parameterized[j]));
                        //$('input:radio[class=test1][id=test2]').prop('checked', true);
                        $("input[type='radio'][name='paramCheck'][id='addParameters']").prop('checked', true);
                        $('.addParameters').removeClass('hidden');
                        //alert(JSON.stringify(taskData.taskConfig.parameterized[j]));
                        console.log("parapapa>>>>" + taskData.taskConfig.parameterized.length);
                        //alert(JSON.stringify(taskData.taskConfig.parameterized));
                        createParametersTable(taskData.taskConfig.parameterized[j], null);

                    }
                } else {
                    $("input[type='radio'][name='paramCheck'][id='addParametersFalse']").prop('checked', false);
                }
            }
        }

        var $taskType = $('#taskType');


        $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/instances', function(data) {
            var $deploymentNodeList = $('.deploymentNodeList').empty();
            for (var i = 0; i < data.length; i++) {

                // if (!(data[i].chef && data[i].chef.serverId)) {
                //     continue;
                // }
                if (data[i].instanceState == 'running' || data[i].instanceState == 'pending' || data[i].instanceState == 'unknown') {
                    var checked = false;
                    if (taskData && (taskData.taskType === 'chef' || taskData.taskType === 'puppet') && taskData.taskConfig.nodeIds && taskData.taskConfig.nodeIds.length) {
                        if (taskData.taskConfig.nodeIds.indexOf(data[i]._id) !== -1) {
                            checked = true;
                        }
                    }
                    var nodeName;

                    if (data[i].chef) {
                        nodeName = data[i].chef.chefNodeName;
                    } else {
                        nodeName = data[i].puppet.puppetNodeName;
                    }
                    if (data[i].instanceIP) {
                        nodeName = data[i].instanceIP;
                    }
                    if (data[i].blueprintData && data[i].blueprintData.blueprintName) {
                        nodeName = data[i].blueprintData.blueprintName;
                    }
                    if (data[i].name) {
                        nodeName = data[i].name;
                    }


                    var $li = $('<li><label class="checkbox" style="margin: 5px;font-size:13px;"><input type="checkbox" name="deploymentNodesCheckBox" value="' + data[i]._id + '"><i></i>' + nodeName + '</label></li>');
                    if (checked) {
                        $li.find('input')[0].checked = true;
                        //$li.find('label').click();
                    }

                    if (data[i].chef) {
                        $('#selectedNodesChefTask').append($li);
                    } else {
                        $('#selectedNodesPuppetTask').append($li);
                    }

                }
            }
        });

        $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(data) {
            var $deploymentBlueprintList = $('.deploymentBlueprintList').empty();
            for (var i = 0; i < data.blueprints.length; i++) {
                var blueprintName = data.blueprints[i].name;
                var checked = false;
                if (taskData && (taskData.taskType === 'chef') && taskData.blueprintIds && taskData.blueprintIds.length) {
                    if (taskData.blueprintIds.indexOf(data.blueprints[i]._id) !== -1) {
                        checked = true;
                    }
                }
                var $li = $('<li><label class="checkbox" style="margin: 5px;font-size:13px;"><input type="checkbox" name="deploymentBlueprintsCheckBox" value="' + data.blueprints[i]._id + '"><i></i>' + blueprintName + '</label></li>');
                if (checked) {
                    $li.find('input')[0].checked = true;
                }
                if (blueprintName) {
                    $('#selectedBlueprintChefTask').append($li);
                }
            }
        });

        $.get('../organizations/' + urlParams.org + '/roles', function(data) {
            var $deploymentBlueprintList = $('.deploymentRoleList').empty();
            var roles = data.roles;
            roles = Object.keys(roles);

            for (var i = 0; i < roles.length; i++) {
                var role = roles[i];
                var checked = false;
                if (taskData && (taskData.taskType === 'chef') && taskData.taskConfig.role == role) {

                    checked = true;

                }
                var $li = $('<li><label class="radio" style="margin: 5px;font-size:13px;"><input type="radio" name="deploymentRoleCheckBox" value="' + role + '"><i></i>' + role + '</label></li>');
                if (checked) {
                    $li.find('input').attr('checked','checked');
                }

                $('#selectedRoleChefTask').append($li);

            }
        });

        if (taskData && taskData.taskType === 'chef') {
            if (taskData.taskConfig.nodeIds && taskData.taskConfig.nodeIds.length) {
                $('#jobNodeDetailsId').click();
            } else if (taskData.taskConfig.role) {
                $('#selectRoleInputId').click();
            } else if (taskData.blueprintIds && taskData.blueprintIds.length) {
                $('#selectBlueprintInputId').click();
            }
        }


        var runlist = null;
        if (taskData && taskData.taskType === 'chef') {
            runlist = taskData.taskConfig.runlist;
            /*//alert("Runlists are  : "+runlist);
            var $chefRunlistModal = $('#chefRunlistModal');
            $chefRunlistModal.modal('show');
            alert($chefRunlistModal.length);
            var $cookbooksrecipesselectedList = $chefRunlistModal.find('#cookbooksrecipesselectedList');
            //alert($cookbooksrecipesselectedList.length);
            //$('.runlistContainer').data('$ccrs');
            //var $runlistContainer = $('.runlistContainer').data('$ccrs');
            // alert("KKKK");
            //console.log($runlistContainer);
            //alert(runlist);
            //debugger;
            for (i = 0; i < runlist.length; i++) {
                $cookbooksrecipesselectedList.append('<option class="cookbook" style="display:block" value="'+runlist[i]+'">'+runlist[i]+'</option>');
            }*/
        }
        var $ccrs = $chefCookbookRoleSelector(urlParams.org, function(data) {

        }, runlist, false, {
            deploy: true,
            all: true,
            roles: false,
            cookbooks: false
        });



        //to get the name of the chef server that is associated with the organisation...
        $.get('/organizations/' + urlParams.org + '/chefserver', function(data) {
            if (data && data.configname) {
                $('table').find('.chefServerName').html('Chef Server Details for -&nbsp;' + data.configname);
            }
        });
        $('.runlistContainer').append($ccrs);
        $('#loadimageandtextlabel').find('.fontsize13').after("<span style='color:red'>*</span>");
        $('.runlistContainer').data('$ccrs', $ccrs);

        // jenkins 

        $.get('/jenkins/', function(jenkinsList) {
            jenkinsList = JSON.parse(jenkinsList);
            var $jenkinsServerListDropdown = $('#jenkinsServerList');
            for (var i = 0; i < jenkinsList.length; i++) {
                var keys = Object.keys(jenkinsList[i]);
                var $option = $('<option></option>').val(jenkinsList[i][keys[0]]).html(keys[0]);
                $jenkinsServerListDropdown.append($option);
            }
            //$jenkinsServerListDropdown.trigger();
            var $spinnerJob = $('#spinnerForJob').addClass('hidden');
            $jenkinsServerListDropdown.change(function(e) {
                if ($(this).val() == 'choose') {
                    $spinnerJob.addClass('hidden');
                    $jobsList.prop("disabled", true);
                } else {
                    var jenkinsServerId = $(this).val();

                    console.log(jenkinsServerId);

                    $spinnerJob.removeClass('hidden');
                    $jobsList.prop("disabled", true);

                    //this is a condition for getting the list of jenkins job for a particular jenkins server..
                    $.get('/jenkins/' + jenkinsServerId + '/jobs', function(jobsList) {
                        if (jobsList) {
                            $jobsList.append('<option value="">Select Job</option>');
                            for (var i = 0; i < jobsList.length; i++) {
                                var $option = $('<option></option>').val(jobsList[i].name).html(jobsList[i].name);
                                $jobsList.append($option);
                            }



                            $jobsList.prop("disabled", false);
                            if (taskData && taskData.taskType === 'jenkins') {
                                $jobsList.val(taskData.taskConfig.jobName);
                                $jobsList.change();

                            }
                            $spinnerJob.addClass('hidden');
                        }
                    }).fail(function(jxhr) {
                        $spinnerJob.addClass('hidden');
                        var msg = "Jenkins Job Behaved Unexpectedly.";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);


                    });

                }
            });

            //condition for getting the job url for a particular job in jenkins...
            var $jobsList = $('#jobListJenkins');
            var $spinnerJobForUrl = $('#spinnerForUrl').addClass('hidden');
            $jobsList.change(function(e) {
                var jobName = $('#jobListJenkins').val();
                console.log("giobiobibio" + jobName);
                var jenkinsServerId;
                $spinnerJobForUrl.removeClass('hidden');
                for (var i = 0; i < jenkinsList.length; i++) {
                    var keys = Object.keys(jenkinsList[i]);

                    jenkinsServerId = jenkinsList[i][keys[0]];
                }
                //alert(JSON.stringify($option));

                var $jobUrlList = $('.jenkinsJobURL').val();

                if (jobName) {

                    $('.jenkinsJobURL').empty();
                    $.get('/jenkins/' + jenkinsServerId + '/jobs/' + jobName, function(jobsList) {
                        //for (var i = 0; i < jobsList.length; i++) {
                        // alert(JSON.stringify(jobsList));
                        $spinnerJobForUrl.addClass('hidden');
                        $('.jenkinsJobURL').removeClass('hidden');
                        $('#helpImage').removeClass('hidden');
                        var $anchor = "<span><a style='font-size:13px;word-wrap:break-word;' title='" + jobsList.url + "' href='" + jobsList.url + "'' target='_blank' >" + jobsList.url + "</a></span>";
                        //alert($anchor);
                        $('.jenkinsJobURL').val(jobsList.url);
                        //}
                    }).fail(function(jxhr) {
                        $spinnerJobForUrl.addClass('hidden');
                        var msg = "Jenkins Server Behaved Unexpectedly.";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);


                    });
                }


            });


            if (taskData && taskData.taskType === 'jenkins') {
                $jenkinsServerListDropdown.val(taskData.taskConfig.jenkinsServerId);
                $jenkinsServerListDropdown.change();
            }



        });

        $.get('../users', function(userList) {
            userList = JSON.parse(userList);
            var $userLists = $('.userLists').empty();
            userList.sort(function(a, b) {
                var keyA = Object.keys(a);
                var keyB = Object.keys(b);

                if (keyA[0] < keyB[0]) return -1;
                if (keyA[0] > keyB[0]) return 1;
                return 0;
            });

            for (var i = 0; i < userList.length; i++) {
                var keys = Object.keys(userList[i]);
                var $option = $('<option></option>').append(keys[0]).val(keys[0]);
                $userLists.append($option);
            }

        });
    }

    if (urlParams.taskId) {
        $.get('../tasks/' + urlParams.taskId, function(taskData) {
            loadUIData(taskData);
        });
    } else {
        loadUIData();
    }

    //save form for jenkins and chef
    $('#taskForm').submit(function(e) {
        var taskType = $('#taskType').val();
        var taskData = {};
        taskData.taskType = taskType;

        if (taskType === 'chef') {

            var $saveSpinner = $('#spinnerForSave');
            var taskName = $('#chefTaskName').val();
            if (!taskName) {
                bootbox.alert({
                    message: 'Please enter a Task-Name',
                    title: "Error"
                });
                return false;
            }
            taskData.name = taskName;
            console.log($('textarea#chefDescription').val());
            var chefJobDescription = $('textarea#chefDescription').val();

            taskData.description = chefJobDescription;


            // var $addParameters = $('#addParameters input[type=checkbox]');

            var selectedType = $('.jobTypeSelectorRadioBtn:checked').attr('data-jobdetails');
            var nodesList = [];
            var blueprintList = [];
            var role
            if (selectedType === 'Nodes') {
                
                var $selectedNodes = $('#selectedNodesChefTask input[type=checkbox]');
                console.log($selectedNodes.length);

                $selectedNodes.each(function() {
                    if (this.checked) {
                        nodesList.push(this.value);
                    }
                });
                taskData.nodeIds = nodesList;

            } else if (selectedType === 'Role') {
                role = $('input[name="deploymentRoleCheckBox"]:checked').val();
                taskData.role = role;

            } else {
                var $selectedBlueprints = $('#selectedBlueprintChefTask input[type=checkbox]');

                $selectedBlueprints.each(function() {
                    if (this.checked) {
                        blueprintList.push(this.value);
                    }
                });
                taskData.blueprintIds = blueprintList;
            }





            if (!nodesList.length && !blueprintList.length && !role) {
                bootbox.alert({
                    message: 'Please choose either nodes, blueprints or role',
                    title: "Error"
                });
                return false;
            }


            var $ccrs = $('.runlistContainer').data('$ccrs');
            var runlist = $ccrs.getSelectedRunlist();


            /*if (!runlist.length) {
                alert('Please choose runlist');
                return false;
            }*/

            taskData.runlist = runlist;

            //alert(JSON.stringify(taskData));
            //taskData.attributesjson = $('#attrtextarea').val().trim();
            $trAttribute = $('#attributesViewListTable').find('tbody tr');
            var attributes = [];
            $trAttribute.each(function() {
                var $tr = $(this);
                attributes.push({
                    name: $tr.attr('data-attributeName'),
                    jsonObj: $tr.data('jsonObj')
                });
            });
            taskData.attributes = attributes;
            $('.btnSaveTask').attr('disabled', 'disabled');

        } else if (taskType === 'puppet') {

            var $saveSpinner = $('#spinnerForSave');
            var taskName = $('#puppetTaskName').val();
            if (!taskName) {
                bootbox.alert({
                    message: 'Please enter a Task-Name',
                    title: "Error"
                });
                return false;
            }
            taskData.name = taskName;
            var puppetJobDescription = $('#puppetDescription').val();

            taskData.description = puppetJobDescription;

            var $selectedNodes = $('#selectedNodesPuppetTask input[type=checkbox]');
            // var $addParameters = $('#addParameters input[type=checkbox]');

            console.log($selectedNodes.length);
            var nodesList = [];
            $selectedNodes.each(function() {
                if (this.checked) {
                    nodesList.push(this.value);
                }
            });
            if (!nodesList.length) {
                bootbox.alert({
                    message: 'Please choose nodes',
                    title: "Error"
                });
                return false;
            }


            taskData.nodeIds = nodesList;

            //taskData.attributesjson = $('#attrtextarea').val().trim();
            $('.btnSaveTask').attr('disabled', 'disabled');
        } else if (taskType === 'jenkins') {
            var $saveSpinner = $('#spinnerForSave');

            var validatorForm = $("#parameterCreate").validate();
            validatorForm.resetForm();

            var taskName = $('#jenkinsTaskName').val();
            if (!taskName) {
                bootbox.alert({
                    message: 'Please enter a Task-Name',
                    title: 'Error'
                });
                return false;
            }
            taskData.name = taskName;
            var jenkinsServerId = $('#jenkinsServerList').val();
            if (!jenkinsServerId) {
                bootbox.alert({
                    message: 'Please Choose a Jenkins Server',
                    title: 'Error'
                });
                return false;
            }

            var jenkinsJobName = $('#jobListJenkins').val();
            if (!jenkinsJobName) {
                bootbox.alert({
                    message: 'Please Choose a Jenkins Job',
                    title: 'Error'
                });
                return false;
            }

            // Currently removed blueprint launch from jenkins
            /* var $selectedJenkinsBlueprints = $('#selectedBlueprintJenkinsTask input[type=checkbox]');
            var jenkinsBlueprintList = [];
            $selectedJenkinsBlueprints.each(function() {
                if (this.checked) {
                    jenkinsBlueprintList.push(this.value);
                }
            });
            taskData.blueprintIds = jenkinsBlueprintList;*/
            var jenkinsJobDescription = $('textarea#jenkinsDescription').val();
            var usersList = [].concat($('#jenkinsUserList').val());
            if (!usersList.length) {
                alert('Please Choose a users');
                return false;
            }
            var jobUrl = $('.jenkinsJobURL').val();
            /*if(!jobUrl){
               alert('Please Choose Jenkins Job URL');
               return false;
            }*/
            var jobResultURL = [];
            var $jobUrlTableBody = $('#tableJobList tbody');
            var $trs = $jobUrlTableBody.find('tr');
            //alert($trs);
            //alert($trs.length);
            $trs.each(function(e) {
                var $this = $(this);
                jobResultURL.push($this.data('jobUrlData'));
            });
            $('.btnSaveTask').attr('disabled', 'disabled');
            //alert(jobUrlResult);            
            taskData.jenkinsServerId = jenkinsServerId;
            taskData.jobName = jenkinsJobName;
            taskData.description = jenkinsJobDescription;

            taskData.jobResultURL = jobResultURL;
            //  console.log(JSON.stringify(taskData.jobResultURL));
            taskData.jobURL = jobUrl;
            //alert(taskData.jobResultURL);

            taskData.users = usersList;

            var autoSyncFlag = $("input[type='radio'][name='auto_sync']:checked").val();
            console.log('autoSyncFlag:', autoSyncFlag);
            if (autoSyncFlag === "true") {
                taskData.autoSyncFlag = true;
            } else {
                taskData.autoSyncFlag = false;
            }


            //check for build parameters. 
            var isParameterized = false;
            if ($('#addParameters').is(":checked")) {
                isParameterized = true;
                var parameterized = [];
                var $paramBody = $('#tableParameters tbody');
                var $trs = $paramBody.find('tr');
                $trs.each(function(e) {
                    var $this = $(this);
                    parameterized.push($this.data('parameterizedObj'));
                });

                taskData.isParameterized = isParameterized;
                taskData.parameterized = parameterized;
                console.log(taskData.parameterized);
            }
            console.log($('#addParameters').is(":checked"));
            console.log(isParameterized);
        } else if (taskType === 'composite') {
            var $saveSpinner = $('#spinnerForSave');

            var validatorForm = $("#parameterCreate").validate();
            validatorForm.resetForm();
            var taskName = $('#compositeTaskName').val();
            if (!taskName) {
                bootbox.alert({
                    message: 'Please enter a Task-Name',
                    title: 'Error'
                });
                return false;
            }
            taskData.name = taskName;
            var compositeJobDescription = $('textarea#compositeDescription').val();
            taskData.description = compositeJobDescription;
            var assignTasks = [];
            var $orderoptions = $("#compositeselectedTasksList").find('option');
            //alert($orderoptions);
            //alert($trs.length);
            $orderoptions.each(function(e) {
                var $this = $(this);
                assignTasks.push($this.attr('id'));
            });
            if (!$orderoptions.length) {
                bootbox.alert({
                    message: 'Please Select a Task',
                    title: 'Error'
                });
                return false;
            }
            taskData.assignTasks = assignTasks;
            $('.btnSaveTask').attr('disabled', 'disabled');
        } else {
            return false;
        }



        var reqBody = {
            taskData: taskData
        };
        console.log(reqBody);
        if (urlParams.taskId) {
            if (taskType === 'jenkins') {
                $saveSpinner.removeClass('hidden');
                $.get('/jenkins/' + taskData.jenkinsServerId + '/job/' + taskData.jobName + '/lastBuild', function(data) {
                    //alert(JSON.stringify(taskData));
                    var url = taskData.jobResultURL;
                    taskData.jobResultURL = url;
                    $.post('../tasks/' + urlParams.taskId + '/update', reqBody, function(data) {
                        window.initializeTaskArea([data]);
                        console.log(data);

                        $('.btnBack').click();
                        if ($('#chooseJobType')) {
                            getTasks();
                        }
                        bootbox.alert({
                            message: 'Job&nbsp;&nbsp;<b>' + taskData.name + '</b>&nbsp;&nbsp;has been updated successfully',
                            title: "Success"
                        });
                        $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(dataRelatedTask) {
                            initializeTaskArea(dataRelatedTask.tasks);
                        });
                    });
                });
                $saveSpinner.addClass('hidden');
                $('.btnSaveTask').removeAttr('disabled');

                return false;
            } else {
                //alert(JSON.stringify(reqBody));
                $.post('../tasks/' + urlParams.taskId + '/update', reqBody, function(data) {
                    console.log(data);
                    window.initializeTaskArea([data]);
                    $('.btnBack').click();
                    if ($('#chooseJobType')) {
                        getTasks();
                    }
                    bootbox.alert({
                        message: 'Job&nbsp;&nbsp;<b>' + taskData.name + '</b>&nbsp;&nbsp;has been updated successfully',
                        title: "Success"
                    });
                    $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(dataRelatedTask) {
                        initializeTaskArea(dataRelatedTask.tasks);
                    });
                });
                $saveSpinner.addClass('hidden');
                $('.btnSaveTask').removeAttr('disabled');
                return false;
            }
        } else {
            //alert(taskType);
            if (taskType === 'jenkins') {
                $saveSpinner.removeClass('hidden');
                //alert('jenkins');
                $.get('/jenkins/' + taskData.jenkinsServerId + '/job/' + taskData.jobName + '/lastBuild', function(data) {
                    var url = taskData.jobResultURL;

                    taskData.jobResultURLPattern = taskData.jobResultURL;
                    //alert(taskData.jobResultURLPattern);
                    var reqBody = {
                        taskData: taskData
                    };

                    $.post('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/tasks', reqBody, function(data) {
                        console.log(data);
                        window.initializeTaskArea([data]);
                        //alert('spinner');
                        $('.btnBack').click();
                        if ($('#chooseJobType')) {
                            getTasks();
                        }
                        bootbox.alert({
                            message: 'Job&nbsp;&nbsp;<b>' + data.name + '</b>&nbsp;&nbsp;has been successfully created',
                            title: "Success"
                        });
                        $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(dataRelatedTask) {
                            initializeTaskArea(dataRelatedTask.tasks);
                        });
                    });

                    $saveSpinner.addClass('hidden');
                    $('.btnSaveTask').removeAttr('disabled');
                });
                return false;
            } else if (taskType === 'composite') {
                //alert("I am in composite");
                $saveSpinner.removeClass('hidden');
                //alert('chef');
                var reqBody = {
                    taskData: taskData
                };
                $.post('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/tasks', reqBody, function(data) {
                    console.log("My composite data:", data);
                    window.initializeTaskArea([data]);
                    $('.btnBack').click();
                    // $(".alert-message").alert();
                    // window.setTimeout(function() {
                    //     $(".alert-message").alert('close');
                    // }, 4000);
                    if ($('#chooseJobType')) {
                        getTasks();
                    }
                    bootbox.alert({
                        message: 'Job&nbsp;&nbsp;<b>' + data.name + '</b>&nbsp;&nbsp;has been successfully created',
                        title: "Success"
                    });
                    $saveSpinner.addClass('hidden');
                    $('.btnSaveTask').removeAttr('disabled');
                    $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(dataRelatedTask) {
                        initializeTaskArea(dataRelatedTask.tasks);
                    });
                });

                return false;
            } else {
                $saveSpinner.removeClass('hidden');
                //alert('chef');
                var reqBody = {
                    taskData: taskData
                };
                $.post('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/tasks', reqBody, function(data) {
                    console.log(data);
                    window.initializeTaskArea([data]);
                    $('.btnBack').click();
                    if ($('#chooseJobType')) {
                        getTasks();
                    }
                    $(".alert-message").alert();
                    window.setTimeout(function() {
                        $(".alert-message").alert('close');
                    }, 4000);
                    bootbox.alert({
                        message: 'Job&nbsp;&nbsp;<b>' + data.name + '</b>&nbsp;&nbsp;has been successfully created',
                        title: "Success"
                    });
                    $saveSpinner.addClass('hidden');
                    $('.btnSaveTask').removeAttr('disabled');
                    $.get('../organizations/' + urlParams.org + '/businessgroups/' + urlParams['bg'] + '/projects/' + urlParams.projid + '/environments/' + urlParams.envid + '/', function(dataRelatedTask) {
                        initializeTaskArea(dataRelatedTask.tasks);
                    });
                });

                return false;
            }
        }
    });

    function createJobLinksTable(jobResultURL) {

        // alert(jobResultURL);
        var $jobListTable = $('#jobListSave');
        var $tr = $('<tr class="jobResultRow"></tr>');
        var $tdName = $('<td class="jobResultDescription" style="word-break: break-word;"></td>');


        $tr.data('jobUrlData', jobResultURL);

        $tdName.append(jobResultURL);
        var $tdAction = $('<td/>');
        $tdAction.append('<div style="margin-right:17px;float:right;" class="btn-group"><button class="deleteRow" value="Remove" title="Remove"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>');

        $tdAction.find('.deleteRow').click(function() {
            $jobList.row($tr).remove().draw(true);
        });

        $tr.append($tdName).append($tdAction);
        $jobListTable.append($tr);
        $jobList.row.add($tr).draw();
    }

    function createParametersTable(param, parameterType) {
        var parameterType;

        var parameterized = [];

        var parameterizedObj = {
            parameterName: String,
            name: String,
            defaultValue: [String],
            description: String
        };
        // alert("parameterType" + JSON.stringify(parameterType));
        // alert("param" + JSON.stringify(param));
        if (parameterType) {
            if (parameterType === "Boolean") {
                parameterizedObj.parameterName = "Boolean";
                parameterizedObj.name = $('#booleanName').val();
                var defaultValue = [];
                parameterizedObj.defaultValue = false;
                parameterizedObj.defaultValue = $('#booleanValueFalse').val();
                if ($('#booleanValueTrue').is(":checked")) {
                    parameterizedObj.defaultValue = true;
                }
                parameterizedObj.description = $('#booleanDescription').val();

            } else if (parameterType === "String") {
                parameterizedObj.parameterName = "String";
                parameterizedObj.name = $('#stringName').val();
                var defaultValue = [];
                parameterizedObj.defaultValue = $('#stringValue').val();
                parameterizedObj.description = $('#stringDescription').val();

            } else if (parameterType === "Choice") {
                parameterizedObj.parameterName = "Choice";
                parameterizedObj.name = $('#choiceName').val();
                var defaultValue = [];

                parameterizedObj.defaultValue = $('#choiceValue').val().trim();
                // alert(parameterizedObj.defaultValue);
                defaultValue = parameterizedObj.defaultValue.split(',');

                parameterizedObj.defaultValue = defaultValue;

                //parameterizedObj.defaultValue= parameterizedObj.defaultValue.split(',');
                parameterizedObj.description = $('#choiceDescription').val();


            }
        } else if (param) {
            //  alert(param);
            if (param.parameterName === "Boolean") {
                parameterizedObj.parameterName = "Boolean";
                parameterizedObj.name = param.name;
                defaultValue = [];
                parameterizedObj.defaultValue = param.defaultValue;
                if ($('#booleanValueTrue').is(":checked")) {
                    parameterizedObj.defaultValue = true;
                }
                parameterizedObj.description = param.description;

            } else if (param.parameterName === "String") {
                //  alert('check');
                parameterizedObj.parameterName = "String";
                parameterizedObj.name = param.name;
                defaultValue = [];
                parameterizedObj.defaultValue = param.defaultValue;
                parameterizedObj.description = param.description;
            } else if (param.parameterName === "Choice") {
                parameterizedObj.parameterName = "Choice";
                parameterizedObj.name = param.name;
                defaultValue = [];
                parameterizedObj.defaultValue = param.defaultValue;
                parameterizedObj.description = param.description;
            }
        }

        var $parameterListTable = $('#paramList');
        var $tr = $('<tr class="paramResultRow"></tr>');
        $tr.data('parameterizedObj', {
            parameterName: parameterizedObj.parameterName,
            name: parameterizedObj.name,
            defaultValue: parameterizedObj.defaultValue,
            description: parameterizedObj.description
        });
        var $tdType = $('<td class="paramType"></td>');
        var $tdName = $('<td class="paramName"></td>');
        var $tdValue = $('<td title="' + parameterizedObj.defaultValue + '"></td>');
        var $tdDescription = $('<td title="' + parameterizedObj.description + '" class="paramDescription"></td>');
        var $tdAction = $('<td/>');
        $tdAction.append('<div style="margin-right:17px;float:right;" class="btn-group"><button class="deleteRow" value="Remove" title="Remove"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>');

        $tdAction.find('.deleteRow').click(function() {
            $paramList.row($tr).remove().draw(true);
        });
        $tdType.append(parameterizedObj.parameterName);
        $tdName.append(parameterizedObj.name);
        $tdValue.append('<span class="paramValue">' + parameterizedObj.defaultValue + '</span>');
        $tdDescription.append(parameterizedObj.description);
        // alert(parameterizedObj.name);
        $tr.append($tdName).append($tdType).append($tdValue).append($tdDescription).append($tdAction);
        $parameterListTable.append($tr);
        $paramList.row.add($tr).draw();
        parameterized.push(parameterizedObj);
        console.log("param>>>>" + parameterized);

    }



    $('#jobLinkCreate').submit(function(e) {
        var regexpURL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

        // alert('chchch');
        var jobResultURL = $(this).find('.jobLinkCreate').val();
        if (!regexpURL.test(jobResultURL)) {
            alert('Please Enter a Valid URL');
            return false;
        } else {
            createJobLinksTable(jobResultURL)
            $('#jobResultModal').modal('hide');
            return false;
        }
    });

    $('#parameterCreate').submit(function(e) {
        var isValidate = $("#parameterCreate").valid();
        var parameterType = $('#parametersSelect').val();
        if (!isValidate) {
            e.preventDefault();
        } else {
            e.preventDefault();
            if (parameterType === "boolean") {
                createParametersTable(null, parameterType);
                $('#parameterModal').modal('hide');
                return false;
            } else if (parameterType === "choice") {
                createParametersTable(null, parameterType);
                $('#parameterModal').modal('hide');
                return false;
            } else {
                createParametersTable(null, parameterType);
                $('#parameterModal').modal('hide');
                return false;
            }
        }
        $('a#imageLinkParam[type="reset"]').on('click', function() {
            validator.resetForm();
        });
    });

    var validator = $('#parameterCreate').validate({
        errorPlacement: function(error, element) {
            // Append error within linked label
            $(element).closest("form").find("label[for='" + element.attr("id") + "']").append(error);

        },
        rules: {
            booleanName: {
                required: true
            },
            booleanDescription: {
                required: true
            },
            stringName: {
                required: true
            },
            stringValue: {
                required: true
            },
            stringDescription: {
                required: true
            },
            choiceName: {
                required: true
            },
            choiceValue: {
                required: true
            },
            choiceDescription: {
                required: true
            }
        },
        messages: {
            booleanName: {
                required: "&nbsp;(Required)"
            },
            booleanDescription: {
                required: "&nbsp;(Required)"
            },
            stringName: {
                required: "&nbsp;(Required)"
            },
            stringValue: {
                required: "&nbsp;(Required)"
            },
            stringDescription: {
                required: "&nbsp;(Required)"
            },
            choiceName: {
                required: "&nbsp;(Required)"
            },
            choiceValue: {
                required: "&nbsp;(Required)"
            },
            choiceDescription: {
                required: "&nbsp;(Required)"
            }
        },
        onkeyup: false,
        errorClass: "error",
    });

    function createRunlistTable(runlist) {
        //alert(runlist.length);
        //$('#tableRunlist').removeClass('hidden');
        $tasksRunlist.clear().draw();
        // alert(runlist.length);
        //var $chefRunlistModal = $('#chefRunlistModal');
        //alert($chefRunlistModal.length);
        //var $cookbooksrecipesselectedList = $chefRunlistModal.find('#cookbooksrecipesselectedList');
        //alert($cookbooksrecipesselectedList.length);
        //alert(runlist);
        //debugger;
        for (i = 0; i < runlist.length; i++) {
            //$cookbooksrecipesselectedList.append('<option class="cookbook" style="display:block" value="'+runlist[i]+'">'+runlist[i]+'</option>');
            var $runlistList = $('#tableRunlist');
            var $tr = $('<tr class="runlistRow"></tr>');
            var $tdName = $('<td class="runlistDescription">' + runlist[i] + '</td>');
            $tr.append($tdName);
            $runlistList.append($tr);
            $tasksRunlist.row.add($tr).draw();
            //alert($cookbooksrecipesselectedList.find('option').length);
        }
    }

    function createtaskComposite(taskData) {
        var $selectedtaskList = $('#compositeselectedTasksList');
        var assignTasks = taskData.taskConfig.assignTasks;
        if (assignTasks.length) {
            for (var i = 0; i < assignTasks.length; i++) {
                $("#compositeTasksList option").each(function() {
                    var $this = $(this);
                    var value = $this.val();
                    if (assignTasks[i] == $this.attr('id')) {
                        $this.hide();

                        if ($this.attr('class') == 'taskimgchef') {
                            var dummychefId = $this.attr('id');
                            var dummychefValue = $this.attr('value');
                            $selectedtaskList.append($('<option class="taskimgchef" id="' + dummychefId + '" value="' + dummychefValue + '">' + dummychefValue + '</option>'));
                        } else if ($this.attr('class') == 'taskimgpuppet') {
                            var dummypuppetId = $this.attr('id');
                            var dummypuppetValue = $this.attr('value');
                            $selectedtaskList.append($('<option class="taskimgpuppet" id="' + dummypuppetId + '" value="' + dummypuppetValue + '">' + dummypuppetValue + '</option>'));
                        } else if ($this.attr('class') == 'taskimgjenkins') {
                            var dummyjenkinsId = $this.attr('id');
                            var dummyjenkinsValue = $this.attr('value');
                            $selectedtaskList.append($('<option class="taskimgjenkins" id="' + dummyjenkinsId + '" value="' + dummyjenkinsValue + '">' + dummyjenkinsValue + '</option>'));
                        }
                        /*$.get('/tasks/' + assignTasks[i], function(data) {
                            if (data.taskType == 'chef') {
                                $selectedtaskList.append($('<option class="taskimgchef" id="' + data._id + '" value="' + data.name + '">' + data.name + '</option>'));
                            } else if (data.taskType == 'puppet') {
                                $selectedtaskList.append($('<option class="taskimgpuppet" id="' + data._id + '" value="' + data.name + '">' + data.name + '</option>'));
                            } else if (data.taskType == 'jenkins') {
                                $selectedtaskList.append($('<option class="taskimgjenkins" id="' + data._id + '" value="' + data.name + '">' + data.name + '</option>'));
                            }
                        });*/
                    }
                });
            }
        }
    }

    $('#saveRunlist').click(function(e) {
        var $ccrs = $('.runlistContainer').data('$ccrs');
        var runlist = $ccrs.getSelectedRunlist();
        createRunlistTable($ccrs.getRunlistNames());
        $('#chefRunlistModal').modal('hide');
        return false;
    });

    $('#editAttributesBtn').click(function(e) {
        var $ccrs = $('.runlistContainer').data('$ccrs');
        var runlist = $ccrs.getSelectedRunlist();
        if (!runlist.length) {
            alert('Please choose a runlist first');
            return false;
        }
        var $modal = $('#editAttributesModalContainer');
        $modal.find('.attributesEditFormArea').hide();
        $modal.find('.errorMsgContainer').hide();
        $modal.find('.loadingContainer').show();
        $modal.modal('show');

        var reqBody = {
            cookbooks: [],
            roles: []
        }

        for (var i = 0; i < runlist.length; i++) {

            if (runlist[i].indexOf('template') === 0) {
                var templateRunlist = $chefCookbookRoleSelector.getRunlistFromTemplate(runlist[i]);
                runlist = runlist.concat(templateRunlist);
                continue;
            }
            var name = '';
            var item = runlist[i];
            var indexOfBracketOpen = item.indexOf('[');
            if (indexOfBracketOpen != -1) {
                var indexOfBracketClose = item.indexOf(']');
                if (indexOfBracketClose != -1) {
                    name = item.substring(indexOfBracketOpen + 1, indexOfBracketClose);
                }
            }
            if (runlist[i].indexOf('recipe') === 0) {
                if (reqBody.cookbooks.indexOf(name) === -1) {
                    reqBody.cookbooks.push(name);
                }
            } else {
                if (reqBody.roles.indexOf(name) === -1) {
                    reqBody.roles.push(name);
                }
            }

        }
        //var chefServerId = $chefCookbookRoleSelector.getChefServerId();
        var $ccrs = $('.runlistContainer').data('$ccrs');
        var chefServerId = $ccrs.getChefServerId();
        $.post('../chef/servers/' + chefServerId + '/attributes', reqBody, function(attributesList) {
            //var dataTable = $('#attributesEditListArea').DataTable();
            //dataTable.clear();
            var $tbody = $modal.find('.attributesEditTableBody');
            $tbody.empty();
            var $tbodyViewAttributes = $('#attributesViewListTable').find('tbody');
            for (var i = 0; i < attributesList.length; i++) {
                var attributesNamesList = Object.keys(attributesList[i].attributes);
                for (var j = 0; j < attributesNamesList.length; j++) {
                    var $tr = $('<tr/>');
                    var displayName = attributesNamesList[j];
                    if (attributesList[i].attributes[attributesNamesList[j]].display_name) {
                        displayName = attributesList[i].attributes[attributesNamesList[j]].display_name;
                    }
                    var $tdAttribName = $('<td/>').html(displayName);
                    var required = false;
                    if (attributesList[i].attributes[attributesNamesList[j]]['required'] === 'required') {
                        $tdAttribName.append('<span class="control-label" style="color:Red;">&nbsp;*</span>');
                        required = true;
                    }
                    var value = '';
                    if (attributesList[i].attributes[attributesNamesList[j]]['default']) {
                        value = attributesList[i].attributes[attributesNamesList[j]]['default'];
                    }
                    var $trView = $tbodyViewAttributes.find('tr[data-attributeKey="' + attributesNamesList[j] + '"]');
                    if ($trView.length) {
                        value = $trView.attr('data-attributeValue');
                    }

                    var $attributeInput;
                    var choices = attributesList[i].attributes[attributesNamesList[j]].choice;
                    if (choices && choices.length) {
                        $attributeInput = $('<select class="attribValueInput" data-attribKey="' + attributesNamesList[j] + '" data-attribName="' + displayName + '" data-attributeRequired="' + required + '"></select>');
                        for (var k = 0; k < choices.length; k++) {
                            var $option = $('<option></option>').val(choices[k]).html(choices[k]);
                            $attributeInput.append($option);
                        }
                        $attributeInput.val(value);
                    } else {
                        var passwordField = false;
                        var keyParts = attributesNamesList[j].split('/');
                        if (keyParts.length) {
                            var indexOfPassword = keyParts[keyParts.length - 1].indexOf('password_');
                            if (indexOfPassword !== -1) {
                                passwordField = true;
                            }
                        }
                        if (passwordField) {
                            $attributeInput = $('<input type="password" class="attribValueInput" data-attribKey="' + attributesNamesList[j] + '" value="' + value + '" data-attribName="' + displayName + '" data-attributeRequired="' + required + '"/>');
                        } else {
                            $attributeInput = $('<input type="text" class="attribValueInput" data-attribKey="' + attributesNamesList[j] + '" value="' + value + '" data-attribName="' + displayName + '" data-attributeRequired="' + required + '"/>');
                        }
                    }

                    var $tdAttribEditor = $('<td/>').append($attributeInput);
                    var desc = attributesList[i].attributes[attributesNamesList[j]]['description'];
                    if (desc) {
                        var $tooltipAnchor = $('<a data-toggle="tooltip" title="' + desc + '!" style="margin-left:15px"><img src="img/help.png"/></a>');
                        $tooltipAnchor.tooltip();
                        $tdAttribEditor.append($tooltipAnchor);
                    }
                    $tr.append($tdAttribName).append($tdAttribEditor);
                    //dataTable.row.add($tr).draw();
                    $tbody.append($tr)
                }
            }
            $modal.find('.errorMsgContainer').hide();
            $modal.find('.loadingContainer').hide();
            $modal.find('.attributesEditFormArea').show();

        }).fail(function(e) {
            $modal.find('.errorMsgContainer').html('Unable to fetch attributes. Please try again later').show();
            $modal.find('.loadingContainer').hide();
            $modal.find('.attributesEditFormArea').hide();
        });
        return false;
    });

    function createAttribTableRowFromJson(attributes) {
        var $table = $('#attributesViewListTable').removeClass('hidden');
        var $tbody = $table.find('tbody').empty();
        console.log(attributes);
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
                        }).data('jsonObj', attributes[j].jsonObj).css('word-break', 'break-all');

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

    $('.saveAttribBtn').click(function(e) {
        var $modal = $('#editAttributesModalContainer');
        var $tbody = $modal.find('.attributesEditTableBody');
        var $input = $tbody.find('.attribValueInput');
        var attributes = [];
        for (var j = 0; j < $input.length; j++) {
            var $this = $($input[j]);
            var attributeKey = $this.attr('data-attribKey');
            console.log(attributeKey);
            var attribValue = $this.val();
            if (attribValue) {
                var attribPathParts = attributeKey.split('/');
                var attributeObj = {};
                var currentObj = attributeObj;
                for (var i = 0; i < attribPathParts.length; i++) {
                    if (!currentObj[attribPathParts[i]]) {
                        if (i === attribPathParts.length - 1) {
                            currentObj[attribPathParts[i]] = attribValue;
                            continue;
                        } else {
                            currentObj[attribPathParts[i]] = {};
                        }
                    }
                    currentObj = currentObj[attribPathParts[i]];
                }
                attributes.push({
                    name: $this.attr('data-attribName'),
                    jsonObj: attributeObj
                });
            } else {
                if ($this.attr('data-attributeRequired') === 'true') {
                    alert("Please fill in the required attributes");
                    return false;
                }
            }
        }

        console.log('attributeObj ==>', attributes);
        //$('#attrtextarea').text(JSON.stringify(attributeObj));
        createAttribTableRowFromJson(attributes);
        $modal.modal('hide');
    });

    $(document).ready(function() {
        var LocalBreadCrumb = localStorage.getItem("breadcrumb");
        var splitBread = null;
        if (LocalBreadCrumb != null && LocalBreadCrumb != 'undefined') {
            localStorage.removeItem("breadcrumb");
            splitBread = LocalBreadCrumb.split('>');
            if (splitBread.length > 0) {
                $('#ribbon').find('.breadcrumb').find('li').detach();
                for (var arraycount = 0; arraycount < splitBread.length; arraycount++) {
                    var liNew = document.createElement('li');
                    liNew.innerHTML = splitBread[arraycount];
                    $('#ribbon').find('.breadcrumb').append(liNew);
                }
                var parentUl = $('li').filter(".referenceliClass.open").find('ul').find('li[data-envname=' + splitBread[3] + ']');
                parentUl.addClass('active');
            }
        }
    });
    $('#parametersSelect').change(function(e) {
        if (this.value == "Boolean") {
            $("#booleanName").val('');

            $('input#booleanValue:checkbox').removeAttr('checked');
            $("#booleanDescription").val('');
            $("#booleanTable").removeClass('hidden');
            $("#stringTable").addClass('hidden');
            $("#choiceTable").addClass('hidden');
        } else if (this.value == "") {
            $("#stringTable").addClass('hidden');
            $("#booleanTable").addClass('hidden');
            $("#choiceTable").addClass('hidden');
        } else if (this.value == "Choice") {
            $("#stringTable").addClass('hidden');
            $("#booleanTable").addClass('hidden');
            $("#choiceTable").removeClass('hidden');
        } else {
            $("#stringName").val('');
            $("#stringValue").val('');
            $("#stringDescription").val('');
            $("#stringTable").removeClass('hidden');
            $("#booleanTable").addClass('hidden');
            $("#choiceTable").addClass('hidden');
        }
    });

    $("#Jenkins-dropdown").hide();
    $('.jenkinsTaskType').hide();
    $("#Composite-dropdown").hide();
    $('.compositeTaskType').hide();
    $("#Puppet-dropdown").hide();
    $('.puppetTaskType').hide();

    $('#taskType').change(function(e) {
        if (this.value == "chef") {
            $("#Jenkins-dropdown").hide();
            $('.jenkinsTaskType').hide();
            $("#Composite-dropdown").hide();
            $('.compositeTaskType').hide();
            $("#Puppet-dropdown").hide();
            $('.puppetTaskType').hide();
            $("#chef-dropdown").show();
            $('.chefTaskType').show();

        } else if (this.value == "jenkins") {
            $('.chefTaskType').hide();
            $("#chef-dropdown").hide();
            $("#Composite-dropdown").hide();
            $('.compositeTaskType').hide();
            $("#Puppet-dropdown").hide();
            $('.puppetTaskType').hide();
            $("#Jenkins-dropdown").show();
            $('.jenkinsTaskType').show();

        } else if (this.value == "puppet") {
            $("#Jenkins-dropdown").hide();
            $('.jenkinsTaskType').hide();
            $('.chefTaskType').hide();
            $("#chef-dropdown").hide();
            $("#Composite-dropdown").hide();
            $('.compositeTaskType').hide();
            $("#Puppet-dropdown").show();
            $('.puppetTaskType').show();

        } else if (this.value == "composite") {
            $("#Jenkins-dropdown").hide();
            $('.jenkinsTaskType').hide();
            $('.chefTaskType').hide();
            $("#chef-dropdown").hide();
            $("#Puppet-dropdown").hide();
            $('.puppetTaskType').hide();
            $("#Composite-dropdown").show();
            $('.compositeTaskType').show();
            $('.chefInstance').hide();
            $('.puppetInstance').hide();
            loadTaskLists();
        }
    });

    function loadTaskLists(taskData) {
        //To get Task Lists
        $.get('/tasks/list/all', function(taskLists) {
            $('#compositeTasksList').empty();
            console.log("I am in Console" + urlParams.envid);
            for (var i = 0; i < taskLists.length; i++) {
                if (taskLists[i].envId == urlParams.envid) {
                    if (taskLists[i].taskType == 'chef') {
                        $('#compositeTasksList').append($('<option class="taskimgchef" id="' + taskLists[i]._id + '" value="' + taskLists[i].name + '">' + taskLists[i].name + '</option>'));
                    } else if (taskLists[i].taskType == 'puppet') {
                        $('#compositeTasksList').append($('<option class="taskimgpuppet" id="' + taskLists[i]._id + '" value="' + taskLists[i].name + '">' + taskLists[i].name + '</option>'));
                    } else if (taskLists[i].taskType == 'jenkins') {
                        $('#compositeTasksList').append($('<option class="taskimgjenkins" id="' + taskLists[i]._id + '" value="' + taskLists[i].name + '">' + taskLists[i].name + '</option>'));
                    }
                }
            }
            createtaskComposite(taskData);
        }).fail(function(jxhr) {
            alert("TaskLists load Failed");
        });

    }
    $('.chefRunlistModalClose').on('click', function() {
        $('#chefRunlistModal').modal("hide");
    });
    $('.jobResultModalClose').on('click', function() {
        $('#jobResultModal').modal("hide");
    });

    $('.parameterModalClose').on('click', function() {
        $('#parameterModal').modal("hide");
    });

    $('.modalForHelpClose').on('click', function() {
        $('#modalForHelp').modal("hide");
    });

    $('.editAttributesModalContainerClose').on('click', function() {
        $('#editAttributesModalContainer').modal("hide");
    });
});