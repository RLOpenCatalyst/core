//to get the org,BU and Proj and environment details, to be used in design
function getOrgProjBUComparison(data, id) {
    data = JSON.parse(JSON.stringify(data));
    //clearing the select box.
    $('#envSelect').empty();
    $.get("/d4dMasters/readmasterjsonnew/4", function(tdata) {
        var $blueprintReadContainer = $(id);
        var $blueprintLaunch = $(id);
        var $blueprintReadContainerCFT = $(id);
        var orgID = (data.orgId)?data.orgId:data.organization.id;
        var bgID = (data.bgId)?data.bgId:data.businessGroup.id;
        var projID = (data.projectId)?data.projectId:data.project.id;
        for (var i = 0; i < tdata.length; i += 1) {
            if (orgID == tdata[i].orgname_rowid) {
                $blueprintReadContainer.find('.modal-body #blueprintORG').val(tdata[i].orgname[0]);
                $blueprintLaunch.find('.modal-body #blueprintOrgEnv').val(tdata[i].orgname[0]);
                $blueprintReadContainerCFT.find('.modal-body #blueprintORGCFT').val(tdata[i].orgname[0]);
            }
            if (bgID == tdata[i].productgroupname_rowid) {
                $blueprintReadContainer.find('.modal-body #blueprintBU').val(tdata[i].productgroupname);
                $blueprintLaunch.find('.modal-body #blueprintBuEnv').val(tdata[i].productgroupname);
                $blueprintReadContainerCFT.find('.modal-body #blueprintBUCFT').val(tdata[i].productgroupname);
            }
            if (projID == tdata[i].rowid) {
                $blueprintReadContainer.find('.modal-body #blueprintProject').val(tdata[i].projectname);
                $blueprintLaunch.find('.modal-body #blueprintProEnv').val(tdata[i].projectname);
                $blueprintReadContainerCFT.find('.modal-body #blueprintProjectCFT').val(tdata[i].projectname);
            }
            var envNames = tdata[i].environmentname.split(',');
            var envIds = tdata[i].environmentname_rowid.split(',');
            var $spinnerEnv = $('#spinnerForEnv');
            $spinnerEnv.removeClass('hidden');
            if (envNames.length === envIds.length) {
                for (var j = 0; j < envNames.length; j++) {
                    if (bgID == tdata[i].productgroupname_rowid) {
                        if (projID == tdata[i].rowid) {
                            var $option = $('<option></option>').val(envIds[j]).html(envNames[j]);
                            $blueprintLaunch.find('.modal-body #envSelect').append($option);
                        }
                    }
                }
                $spinnerEnv.addClass('hidden');
            }
        }
    });
}

var eventAdded = false;
//method for blueprint launch except docker.
function blueprintLaunchDesign(data) {
    bootbox.confirm({
        message: "Are you sure you want to launch the Blueprint? Press Ok To continue",
        title: "Confirmation",
        callback: function(result) {
            if (!result) {
                return;
            } else {

                $('#cftForm').trigger('reset');
                $('#domainNameForm').trigger('reset');
                var blueprintType = data.templateType;
                var domainNameCheck = data.domainNameCheck;
                //setting the envId as it is needed for bpLaunch.
                var envId = $('#envSelect').val();
                //setting the blueprint version.(different versions)
                var blueprintId = $('#modalSelectEnvironment').find('#selectedVersion').val();
                if (blueprintType === 'chef' || blueprintType === 'ami') {
                    var version = data.blueprintConfig.infraManagerData.latestVersion;
                }

                function launchBP(blueprintId, stackName,domainName) {
                    var $launchResultContainer = $('#launchResultContainer');
                    $launchResultContainer.find('.modal-body').empty().append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
                    $launchResultContainer.find('.modal-title').html('Launching Blueprint');
                    $launchResultContainer.modal('show');
                    $.get('/blueprints/' + blueprintId + '/launch?version=' + version + '&envId=' + envId + '&stackName=' + stackName + '&domainName=' + domainName, function(data) {

                        var msgStr = 'Instance Id : ';
                        if (blueprintType === 'cft') {
                            msgStr = 'Stack Id : ' + data.stackId + '. You can view your stack in cloudformation tab(workzone)';
                        } else {
                            msgStr = 'Instance Id : ';
                            msgStr += data.id.join(',');

                            msgStr += '<br/>You can monitor logs from the Launched Instances.';
                        }

                        var $msg = $('<div></div>').append('<h3 style="font-size:16px;" class=\"alert alert-success\">Your Created Blueprint is being Launched, kindly check Workzone to view your instance.</h3>').append(msgStr);

                        $launchResultContainer.find('.modal-body').empty();
                        $launchResultContainer.find('.modal-body').append($msg);
                        if (blueprintType === 'cft') {
                            return;
                        }
                        var instanceId = data.id;
                        var timeout;

                        $launchResultContainer.on('hidden.bs.modal', function(e) {
                            $launchResultContainer.off('hidden.bs.modal');
                            if (timeout) {
                                clearTimeout(timeout);
                            }
                        });
                        $divBootstrapLogArea = $('<div></div>').addClass('logsAreaBootstrap');

                        $launchResultContainer.find('.modal-body').append($divBootstrapLogArea);

                        var lastTimestamp;

                        function pollLogs(timestamp, delay, clearData) {
                            var url = '../instances/' + instanceId + '/logs';
                            if (timestamp) {
                                url = url + '?timestamp=' + timestamp;
                            }

                            timeout = setTimeout(function() {
                                $.get(url, function(data) {
                                    var $modalBody = $divBootstrapLogArea;
                                    if (clearData) {
                                        $modalBody.empty();
                                    }
                                    var $table = $('<div></div>');

                                    for (var i = 0; i < data.length; i++) {
                                        var $rowDiv = $('<div class="row"></div>');
                                        var timeString = new Date().setTime(data[i].timestamp);
                                        var date = new Date(timeString).toLocaleString(); //converts to human readable strings
                                        if (data[i].err) {
                                            $rowDiv.append($('<div class="col-lg-12 col-sm-12" style="color:red;"></div>').append('<span>' + data[i].log + '</span>'));
                                        } else {
                                            $rowDiv.append($('<div class="col-lg-12 col-sm-12 " style="color:white;"></div>').append('<span>' + data[i].log + '</span>'));
                                        }

                                        $table.append($rowDiv);
                                    }
                                    if (data.length) {
                                        lastTimestamp = data[data.length - 1].timestamp;
                                        $modalBody.append($table);
                                        $modalBody.scrollTop($modalBody[0].scrollHeight + 100);
                                    }
                                    if ($launchResultContainer.data()['bs.modal'].isShown) {
                                        pollLogs(lastTimestamp, 1000, false);
                                    }
                                });
                            }, delay);
                        }
                        if (data.id.length <= 1) {
                            instanceId = data.id[0];
                            //to be called only when there is one instance.
                            pollLogs(lastTimestamp, 0, true);
                        } else {
                            for (var j = 0; j < data.id.length; j++) {
                                if (j >= data.id.length - 1) {
                                    $('.logsAreaBootstrap').hide();
                                }
                            }
                        }
                    }).error(function(jxhr) {
                        var message = "Server Behaved Unexpectedly";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            message = jxhr.responseJSON.message;
                        }
                        $launchResultContainer.find('.modal-body').empty().append('<span>' + message + '</span>');
                    });

                }

                if (blueprintType === 'cft') {
                    jQuery.validator.addMethod("noSpace", function(value, element) {
                        return value.indexOf(" ") < 0 && value != "";
                    }, "No space allowed and the user can't leave it empty");
                    $('#cftContainer').modal('show');
                    var validator = $("#cftForm").validate({
                        rules: {
                            cftInput: {
                                noSpace: true,
                                alphanumeric: true
                            }
                        }
                    });
                    $('a.launchBtn[type="reset"]').on('click', function() {
                        validator.resetForm();
                    });

                    if (!eventAdded) {
                        $("#cftForm").unbind().submit(function(e) {
                            var stackName = $('#cftInput').val();
                            var domainName = null;
                            var isValid = $('#cftForm').valid();
                            if (!isValid) {
                                e.preventDefault();
                                return false;
                            } else {
                                var blueprintId = $('#modalSelectEnvironment').find('#selectedVersion').val();
                                launchBP(blueprintId, stackName,domainName);
                                $('#cftContainer').modal('hide');
                                e.preventDefault();
                                return false;
                            }
                        });
                        eventAdded = true;
                    }
                }else if(domainNameCheck === true){
                        jQuery.validator.addMethod("noSpace", function(value, element) {
                            return value.indexOf(" ") < 0 && value != "";
                        }, "No space allowed and the user can't leave it empty");
                        $('#domainNameContainer').modal('show');
                        var validator = $("#domainNameForm").validate({
                            rules: {
                                domainNameInput: {
                                    noSpace: true,
                                    alphanumeric: true
                                }
                            }
                        });
                        $('a.launchBtn[type="reset"]').on('click', function() {
                            validator.resetForm();
                        });

                        if (!eventAdded) {
                            $("#domainNameForm").unbind().submit(function(e) {
                                var domainName = $('#domainNameInput').val();
                                var stackName = null;
                                var isValid = $('#domainNameForm').valid();
                                if (!isValid) {
                                    e.preventDefault();
                                    return false;
                                } else {
                                    var blueprintId = $('#modalSelectEnvironment').find('#selectedVersion').val();
                                    launchBP(blueprintId, stackName,domainName);
                                    $('#domainNameContainer').modal('hide');
                                    e.preventDefault();
                                    return false;
                                }
                            });
                            eventAdded = true;
                        }
                } else {
                    var stackName = null;
                    var domainName = null;
                    launchBP(blueprintId,stackName,domainName);
                }
            }
        }
    });
}
//method for docker blueprint launch.
function dockerBlueprintLaunch(data) {
    bootbox.confirm({
        message: "Are you sure you want to launch the Blueprint? Press Ok To continue",
        title: "Confirmation",
        callback: function(result) {
            if (!result) {
                return;
            } else {
                $('#commentForm')[0].reset();
                $('#Removeonexitfield').change();
                //clearing and redrawing the datatable.
                $dockerinstancesDatatable.clear().draw(false);

                var blueprintType = data.templateType;
                var projectId = data.projectId;
                var envId = $('#envSelect').val();
                var blueprintId = data._id;
                $.get('/instances', function(instanceData) {
                    for (var i = 0; i < instanceData.length; i++) {
                        (function(i) {
                            var blueprintId = data._id;
                            $('.oldlaunchparams').empty(); //clearing the old div for composite blue print.
                            $('.dockerinstancestart').first().addClass('hidden');
                            var dockercompose = data.blueprintConfig.dockerCompose;
                            $('#compositeDockerImagesTable tr.dockerImagesRowDesign').detach(); //clearing previously loaded table.
                            dockercompose.forEach(function(k, v) {
                                addDockerImagesToTable(dockercompose[v]["dockercontainerpathstitle"], dockercompose[v]["dockercontainerpaths"], dockercompose[v]["dockerrepotags"], dockercompose[v]["dockerreponame"], dockercompose[v]["dockerlaunchparameters"]);
                            });

                            $('.dockerimageselectordown').click(function() {
                                movetablerow('dockerimageselectordown', $(this).attr('uniqueid'));
                            });

                            $('.dockerimageselectorup').click(function() {
                                movetablerow('dockerimageselectorup', $(this).attr('uniqueid'));
                            });

                            $('.btnaddDockerLaunchParams').click(function() {
                                var lp = generateDockerLaunchParams();
                                if (lp != '') {
                                    var dockerParamsList = lp[0];

                                    if ((lp[1] !== undefined) && (lp[1] != ''))
                                        dockerParamsList += ' -c ' + lp[1];

                                    if ((lp[2] !== undefined) && (lp[2] != ''))
                                        dockerParamsList += ' -exec ' + lp[2];

                                    $('#' + $('#myModalLabelDockerContainer').attr('saveto')).val(dockerParamsList);
                                    $('#myModalLabelDockerContainer').removeAttr('saveto').modal('hide');
                                }
                            });

                            var $launchDockerInstanceSelector = $('#launchDockerInstanceSelector');
                            var blueprintId = data._id;
                            //var dockerreponame = data.blueprintConfig.dockerRepoName;
                            $launchDockerInstanceSelector.data('blueprintId', blueprintId);
                            loadInstancesContainerList();

                            function loadInstancesContainerList() {
                                $launchDockerInstanceSelector.modal('show');
                                $('#rootwizard').find("a[href*='dockerTab1']").trigger('click'); //showing first tab.

                                var imagePath;
                                if (data.iconPath == undefined) {
                                    imagePath = data.iconPath = 'img/imgo.jpg';
                                } else {
                                    imagePath = data.iconPath;
                                }
                                if (envId === instanceData[i].envId) {
                                    if (instanceData[i].instanceState == 'running') {
                                        var $tdcheckbox = '<div class="text-center"><input type="checkbox" class="instanceselectedfordocker"><img src="' + imagePath + '" style="width:40px;height:30px;" /></div>';
                                        var $tdname = '<div class="dockerinstanceClass text-center" data-instanceId="' + instanceData[i]._id + '" data-blueprintname="' + instanceData[i].blueprintData.blueprintName + '">' + instanceData[i].name + '</div>';
                                        var $tdinstanceip = '<div class="text-center">' + instanceData[i].instanceIP + '</div>';
                                        var $moreinfo = '<a data-original-title="MoreInfo" data-placement="top" rel="tooltip" href="javascript:void(0)" data-instanceId="' + instanceData[i]._id + '" class="tableMoreInfo moreInfo dockerintsancesmoreInfo"></a>';

                                        var $dockerinstancesDatatable = $('#dockerinstancesTable');
                                        $dockerinstancesDatatable.dataTable().fnAddData([
                                            $tdcheckbox,
                                            $tdname,
                                            $tdinstanceip,
                                            $moreinfo
                                        ]);
                                        $('.dockerinstancestart').unbind().click(function(e) {
                                            generateCompositeJsonfromtable();
                                            compositeDockerLaunch(data);
                                        });
                                        $dockerinstancesDatatable.on('click', '.dockerintsancesmoreInfo', instanceLogsHandler);
                                    }
                                }
                            }
                            return;
                        })(i);
                    }
                });
            }
        }
    });
}

//composite blueprint Launch
function blueprintLaunchComposite(data) {
    bootbox.confirm({
        message: "Are you sure you want to launch the Blueprint? Press Ok To continue",
        title: "Confirmation",
        callback: function(result) {
            if (!result) {
                return;
            } else {
                //setting the envId as it is needed for bpLaunch.
                var envId = $('#envSelect').val();
                var blueprintId = $('#modalSelectEnvironment').find('#selectedVersion').val();
                function launchBP(blueprintId, envId) {
                    var $launchResultContainer = $('#launchResultContainer');
                    $launchResultContainer.find('.modal-body').empty().append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
                    $launchResultContainer.find('.modal-title').html('Launching Composite Blueprint');
                    $launchResultContainer.modal('show');
                    $.post('/blueprint-frames', {
                            blueprintId: blueprintId,
                            environmentId: envId 
                        }, function(data) {
                        var $msg = $('<div></div>').append('<h3 style="font-size:16px;" class=\"alert alert-success\">Your Created Blueprint is being Launched, Check Workzone to view your instance.</h3>');
                        $launchResultContainer.find('.modal-body').empty();
                        $launchResultContainer.find('.modal-body').append($msg);
                    }).error(function(jxhr) {
                        var message = "Server Behaved Unexpectedly";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            message = jxhr.responseJSON.message;
                        }
                        $launchResultContainer.find('.modal-body').empty().append('<span>' + message + '</span>');
                    });

                } 
                launchBP(blueprintId, envId);
            }
        }
    });
}

var instanceLogsHandler = function(e) {
    var instanceId = $(this).attr('data-instanceId');
    var timeout;
    var $instanceLogModalContainer = $('#instanceLogModalContainer');
    $instanceLogModalContainer.on('hidden.bs.modal', function(e) {
        $instanceLogModalContainer.off('hidden.bs.modal');
        if (timeout) {
            clearTimeout(timeout);
        }
    });
    $instanceLogModalContainer.find('.logsArea').empty().append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
    $instanceLogModalContainer.modal('show');
    var lastTimestamp;

    //Showing the log for Instances
    function pollLogs(timestamp, delay, clearData) {
        var url = '../instances/' + instanceId + '/logs';
        if (timestamp) {
            url = url + '?timestamp=' + timestamp;
        }
        timeout = setTimeout(function() {
            $.get(url, function(data) {
                var $modalBody = $instanceLogModalContainer.find('.logsArea')
                if (clearData) {
                    $modalBody.empty();
                }
                var $table = $('<table></table>');

                for (var i = 0; i < data.length; i++) {
                    var $rowDiv = $('<tr class="row rowSpacing"></tr>');
                    var timeString = new Date().setTime(data[i].timestamp);
                    var date = new Date(timeString).toLocaleString(); //converts to human readable strings
                    if (data[i].err) {
                        $rowDiv.append($('<td class="col-lg-12 col-sm-12" style="color:red;"></td>').append('<span class="textLogs">' + date + '</span>' + '&nbsp;&nbsp;&nbsp;' + '<span>' + data[i].log + '</span>'));
                    } else {
                        $rowDiv.append($('<td class="col-lg-12 col-sm-12" style="color:DarkBlue;"></td>').append('<span class="textLogs">' + date + '</span>' + '&nbsp;&nbsp;&nbsp;' + '<span>' + data[i].log + '</span>'));
                    }
                    $table.append($rowDiv);
                }
                if (data.length) {
                    lastTimestamp = data[data.length - 1].timestamp;
                    $modalBody.append($table);
                    $modalBody.scrollTop($modalBody[0].scrollHeight + 100);
                }
                if ($instanceLogModalContainer.data()['bs.modal'].isShown) {
                    pollLogs(lastTimestamp, 1000, false);
                }
            });
        }, delay);
    }
    pollLogs(lastTimestamp, 0, true);
};

function generateCompositeJsonfromtable() {
    var dockercompose = [];
    var dockerimages = {};
    $('.dockerImagesRowDesign').each(function() {
        dockerimages = {};
        $(this).find('[paramtype]').each(function() {
            if ($(this).attr('paramtype') == 'dockercontainerpaths') {
                dockerimages[$(this).attr('paramtype')] = $(this).text() + $(this).val();
            } else
                dockerimages[$(this).attr('paramtype')] = $(this).text() + $(this).val();
        });
        $(this).find()
        dockercompose.push(dockerimages);
    });
    return (dockercompose);
}

function compositeDockerLaunch(data) {
    var compositedockerimage = generateCompositeJsonfromtable();
    compositedockerimage = JSON.stringify(compositedockerimage);
    if (!$('.instanceselectedfordocker:checked').length) {
        bootbox.confirm({
            message: "Please select atleast one instance.",
            title: "Warning",
            callback: function(result) {}
        });
        return;
    }
    $('.instanceselectedfordocker:checked').each(function() {
        var repopath = "null"; //would be referenced from the json supplied.
        var instid = $(this).closest('tr').find('.dockerinstanceClass').attr('data-instanceid');
        var instbpname = $(this).closest('tr').find('.dockerinstanceClass').attr('data-blueprintname');
        var amoreinfo = $(this).closest('tr').find('.moreInfo');
        if (instid)
        var $that = $(this);
        var $td = $that.closest('td');

        var tdtext = $td.text();
        $td.find('.dockerspinner').detach();
        $td.find('.dockermessage').detach();
        $td.append('<img class="dockerspinner" style="margin-left:5px" src="img/select2-spinner.gif"></img>');
        $td.attr('title', 'Pulling in Images');
        $.post('../instances/dockercompositeimagepull/' + instid + '/' + repopath, {
            compositedockerimage: encodeURIComponent(compositedockerimage)
        }, function(dockerData) {
            if (dockerData == "OK") {
                if (amoreinfo)
                    amoreinfo.trigger('click');

                var $statmessage = $td.find('.dockerspinner').parent();
                $td.find('.moreInfo').first().click(); //showing the log window.
                $td.find('.dockerspinner').detach();
                $statmessage.append('<span style="margin-left:5px;text-decoration:none" class="dockermessage"></span>');
            } else {
                if (dockerData.indexOf('No Docker Found') >= 0) {
                    var $statmessage = $('.dockerspinner').parent();
                    $('.dockerspinner').detach();
                    $td.find('.dockermessage').detach();
                    $statmessage.append('<span style="margin-left:5px;color:red" title="Docker not found"  class="dockermessage"><i class="fa  fa-exclamation"></i></span>');
                    //Prompt user to execute the docker cookbook.
                    bootbox.alert('Docker was not found on the node : "' + instbpname + '". \n Kindly navigate to Workzone and run Chef Client Run');
                    //Docker launcer popup had to be hidden due to overlap issue.
                    $('#launchDockerInstanceSelector').modal('hide');
                    return false;
                } else {
                    var $statmessage = $('.dockerspinner').parent();
                    $('.dockerspinner').detach();
                    $td.find('.dockermessage').detach();
                    $statmessage.append('<span style="margin-left:5px;color:red" title="' + dockerData + '"  class="dockermessage"><i class="fa  fa-exclamation"></i></span>');
                }
            }
        });
    });
}

//initialising dockerInstance datatable.
if (!$.fn.dataTable.isDataTable('#dockerinstancesTable')) {
    var $dockerinstancesDatatable = $('#dockerinstancesTable').DataTable({
        "pagingType": "full_numbers",
        "aaSorting": [
            [0, "desc"]
        ],
        "aoColumns": [{
            "bSortable": false
        }, {
            "bSortable": true
        }, {
            "bSortable": true
        }, {
            "bSortable": false
        }]
    });
}
var $dockerWizard = $('#rootwizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'onNext': function(tab, navigation, index) {
        $('.dockerinstancestart').first().removeClass('hidden');
        var $valid = $("#commentForm").valid();
        if (!$valid) {
            $validator.focusInvalid();
            return false;
        }
    },
    'onPrevious': function(tab, navigation, index) {
        $('.dockerinstancestart').first().addClass('hidden');
    }
});


