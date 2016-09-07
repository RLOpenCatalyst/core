$(document).ready(function() {
    var urlproviderId,
        managedTotal = 0,
        unmanagedTotal = 0,
        unassigned = 0,
        managedunmanagedTotal = 0,
        managedData = 0,
        unManagedData = 0,
        unAssignedData = 0;
        $('#instanceActionListLoader').show();
    
    function clearInstance(){
        unmanagedTotal = managedTotal = unassigned = managedunmanagedTotal = 0;
        $('#totalManagedInstances').html(managedTotal);
        $('#totalUnmanagedInstances').html(unmanagedTotal);
        $('#totalUnAssignedInstances').html(unassigned);
        $('#totalInstances').html(managedunmanagedTotal);
    }

    $("#refreshBtn").click(function() {
        clearInstance();
        getManagedInstances();
        getAssignedInstances();
        getUnassignedInstances();
    });

    var orgId;
    $.get("/d4dMasters/readmasterjsonnew/1", function(data){
        for(var i =0;i<data.length;i++){
            $("#orgDropdown").append($("<option></option>").val(data[i].rowid).html(data[i].orgname));
        }
        orgId = data[0].rowid;
        $("#orgDropdown").change(function(e){
            clearInstance();
            orgId = $("#orgDropdown").val();
            getManagedInstances();
            getAssignedInstances();
            getUnassignedInstances();
        });
        $("#orgDropdown").trigger("change");
    });

    //ajax call to get the list of aws providiers.
    $.ajax({
        type: 'GET',
        url: '../aws/providers',
        success: function(data, success) {
            if (data.length === 0) {
                $('.providerSelect').addClass('hidden');
                $('.noTrackItems').removeClass('hidden');
            } else {
                for (var i = 0; i < data.length; i++) {
                    $('.providerSelect').removeClass('hidden');
                   // $("#providerDropdown").append($("<option></option>").val(data[i]._id).html(data[i].providerName));
                }
            }
        }
    });

    $.get("/d4dMasters/readmasterjsonnew/4", function(tdata) {
        for (var i = 0; i < tdata.length; i += 1) {
            console.log(tdata);
            var envNames = tdata[i].environmentname;
            var envIds = tdata[i].environmentname_rowid;
            var $projectOption = $('<option></option>').val(tdata[i].rowid).html(tdata[i].projectname).attr('envId',envIds).attr('envName',envNames);
            $('.filterProjectId').append($projectOption);
            $('.filterProjectId').change(function(e) {
                $('.filterEnvId').empty();
                var element = $("option:selected", this);
                var envCheckId = element.attr("envId").split(',');
                var envName = element.attr("envName").split(',');  
                if(envCheckId.length === envName.length){
                        for (var j = 0; j < envName.length; j++) {
                        console.log(envName[j]);
                        var $option = $('<option></option>').val(envName[j]).html(envName[j]);
                        $('.filterEnvId').append($option);
                    }
                }   
            });
            $('.filterProjectId').trigger('change');
        }
    });

    function updateTotalCount(type, count) {
        if (type === "managed") {
            managedTotal += count;
            $('#totalManagedInstances').html(managedTotal);
        }
        if (type === "assigned") {
            unmanagedTotal += count;
            $('#totalUnmanagedInstances').html(unmanagedTotal);
        }
        if (type === "unassigned") {
            unassigned += count;
            $('#totalUnAssignedInstances').html(unassigned);
        }
        if (type === "managedunmanaged") {
            managedunmanagedTotal += count;
            $('#totalInstances').html(managedunmanagedTotal);
        }
    }

    function getManagedInstances(){
        $('#instanceActionListLoader').show();
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: "../tracked-instances?category=managed&filterBy=orgId:"+orgId,
            success: function(data) {
                managedData = data.recordsTotal;
                updateTotalCount("managed", managedData);
                $('#instanceActionListLoader').hide();
            }
        });    
    }
    
    function getAssignedInstances(){
        $('#instanceActionListLoader').show();
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: "../tracked-instances?category=assigned&filterBy=orgId:"+orgId,
            success: function(data) {
                unManagedData = data.recordsTotal;
                updateTotalCount("assigned", unManagedData);
                $('#instanceActionListLoader').hide();
            }
        });    
    }
    
    function getUnassignedInstances(){
        $('#instanceActionListLoader').show();
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: "../tracked-instances?category=unassigned&filterBy=orgId:"+orgId,
            success: function(data) {
                unAssignedData = data.recordsTotal;
                updateTotalCount("unassigned", unAssignedData);
                var totalInstances;
                totalInstances = managedData + unManagedData + unAssignedData;
                updateTotalCount("managedunmanaged", totalInstances);
                $('#instanceActionListLoader').hide();
            }
        });    
    }
    
    $('#totalManagedInstancesMoreInfo').on('click', function() {
        loadAllManagedInstances();
        $('#instanceTableContainer').show();
        $('#instanceAssignedContainer').hide();
        $('#instanceUnAssignedContainer').hide();
    });

    $('#totalUnManagedInstancesMoreInfo').on('click', function() {
        loadAllUnManagedInstances();
        $('#instanceTableContainer').hide();
        $('#instanceUnAssignedContainer').hide();
        $('#instanceAssignedContainer').show();
    });

    $('#totalUnAssignedInstancesMoreInfo').on('click', function() {
        getUnassignedInstancesWithProjectAndEnv();
        $('#instanceTableContainer').hide();
        $('#instanceAssignedContainer').hide();
        $('#instanceUnAssignedContainer').show();
    });

    function loadAllManagedInstances() {
        $('.footer').addClass('hidden');
        $('#instanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": '/tracked-instances?category=managed&filterBy=orgId:'+orgId,
            "columns": [{
                "data": "platformId",
                "orderable": true
            }, {
                "data": "orgName",
                "orderable": false,
                "render": function(data) {
                    return data ? data : '';
                }
            },{
                "data": "bgName",
                "orderable": false,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "projectName",
                "orderable": false,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "environmentName",
                "orderable": true,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "instanceIP",
                "orderable": true
            }, {
                "data": "instanceState",
                "orderable": true
            }]
        });
    }

    function loadAllUnManagedInstances() {
        $('.footer').addClass('hidden');
        $('#instanceAssignedTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": '/tracked-instances?category=assigned&filterBy=orgId:'+orgId,
            "columns": [{
                "data": "platformId",
                "orderable": true
            }, {
                "data": "orgName",
                "orderable": false,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "projectName",
                "orderable": false,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "environmentName",
                "orderable": true,
                "render": function(data) {
                    return data ? data : '';
                }
            }, {
                "data": "ip",
                "orderable": true
            }, {
                "data": "state",
                "orderable": true
            }]
        });
    }

    /*//loading UnAssigned Data
    function getUnassignedData(key) {
        
    };*/


    function getUnassignedInstancesWithProjectAndEnv() {
        $('.footer').removeClass('hidden');
        $('#instanceUnassignedTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": '/tracked-instances?category=unassigned&filterBy=orgId:'+orgId,
            "createdRow": function(row, data) {
                $(row).attr({
                    "instanceId": data._id,
                    "urlproviderId":data.providerId
                })
            },
            "columns": [{
                "data": "platformId",
                "orderable": true
            }, {
                "data": "os",
                "orderable": false
            }, {
                "data": "ip",
                "orderable": true,
                "render": function(data) {
                    if (data) {
                        return data;
                    } else {
                        return '';
                    }
                }
            }, {
                "data": "state",
                "orderable": true
            }, {
                "data": "",
                "orderable": false,
                "render": function(data, type, full) {
                    if (full.projectTag !== null) {
                        var tagValue = full.projectTag;
                        return '<input class="form-control projectTagName" type="text" value="' + tagValue + '"/>';
                    } /*else if (envProjectMappingObject.project && full.tags[envProjectMappingObject.project]) {
                        var tagValue = full.tags[envProjectMappingObject.project];
                        return '<input class="form-control projectTagName"  type="text" value="' + tagValue + '"/>';
                    }*/ else {
                        return '<input class="form-control projectTagName" type="text" placeholder="Enter a project tag value" value=""/>';
                    }
                }
            }, {
                "data": "",
                "orderable": false,
                "render": function(data, type, full) {
                    if (full.environmentTag !== null) {
                        var tagValue = full.environmentTag;
                        return '<input class="form-control envTagName" type="text" value="' + tagValue + '"/>';
                    } /*else if (envProjectMappingObject.environment && full.tags[envProjectMappingObject.environment]) {
                        var tagValue = full.tags[envProjectMappingObject.environment];
                        return '<input class="form-control envTagName" type="text" value="' + tagValue + '"/>';
                    } */else {
                        return '<input class="form-control envTagName" placeholder="Enter a environment tag value" type="text" value=""/>';
                    }
                }
            },{
                "data": "platformId","orderable" : false,
                "render":function(data,type,full,meta){
                    if(full.platformId){
                        return '<input class="nodeCheckBox" type="checkbox" val=""/>';
                    }
                }
            }]
        });
    }

    $('#unassignedSyncBtn').on('click', function(e) {
            var updateInstanceTagsObj = {};
            var updateInstanceTagsArr = [];
            var providerId,projectTagsMapName,envTagsMapName;
            var $checkBox_checked = $('#instanceUnassignedTable').find('tbody tr').filter(':has(:checkbox:checked)');
            if($checkBox_checked.length > 0) {
                $('#instanceUnassignedTable').find('tbody tr').filter(':has(:checkbox:checked)').each(function () {
                    //Batch update instances tags
                    var updateUniqueInstanceTagsObj = {};
                    providerId = $(this).attr("urlproviderId");
                    var instanceId = $(this).attr("instanceId");
                    var envProjectMappingObject = {}; 
                    var projectTagName = $(this).find('.projectTagName').val();
                    var envTagName = $(this).find('.envTagName').val();
                    $.get('/providers/' + providerId + '/tag-mappings', function(tagsListSelected) {
                        if (tagsListSelected) {
                            
                            for (var i = 0; i < tagsListSelected.length; i++) {
                                var objcatalystEntityType = tagsListSelected[i].catalystEntityType;
                                var objtagName = tagsListSelected[i].tagName;
                                //Creating an object to map with unassigned instances(To get data for project and environment in every row)
                                if (objcatalystEntityType == 'project') {
                                    envProjectMappingObject['project'] = objtagName;
                                }
                                if (objcatalystEntityType == 'environment') {
                                    envProjectMappingObject['environment'] = objtagName;
                                }
                                console.log(envProjectMappingObject.project,envProjectMappingObject.environment);
                                projectTagsMapName = envProjectMappingObject.project;
                                envTagsMapName = envProjectMappingObject.environment;
                            }
                            updateUniqueInstanceTagsObj["id"] = instanceId;
                            updateUniqueInstanceTagsObj["tags"] = {};
                            updateUniqueInstanceTagsObj["tags"][projectTagsMapName] = projectTagName;
                            updateUniqueInstanceTagsObj["tags"][envTagsMapName] = envTagName;
                            console.log(projectTagName,envTagName);
                            console.log(updateUniqueInstanceTagsObj);
                            updateInstanceTagsArr.push(updateUniqueInstanceTagsObj);
                            updateInstanceTagsObj["instances"] = updateInstanceTagsArr;
                            console.log(updateInstanceTagsObj["instances"],updateInstanceTagsArr);
                            $.ajax({
                                url: '/providers/' + providerId + '/unassigned-instances',
                                data: JSON.stringify(updateInstanceTagsObj),
                                type: 'PATCH',
                                contentType: "application/json",
                                success: function (data) {
                                    $('.margintop-25left250').fadeIn();
                                    $('#spanunassignedformSaveId').text('Updated successfully');
                                    $('.margintop-25left250').delay(2000).fadeOut();
                                },
                                error: function (jqxhr) {
                                    alert(jqxhr.responseJSON.message);
                                }
                            }); 
                        }
                    }).fail(function(jxhr) {
                        var msg = "Tag mappings not loaded as behaved unexpectedly.";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                    });
                                       
                });
            }else{
                alert("Please select corresponding check-box for updating tags");
            }
        });
});