$(document).ready(function() {
    //toastr config
    toastr.options.closeButton = true;
    toastr.options.closeDuration = 2000;
    var urlproviderId,
        managedTotal = 0,
        unmanagedTotal = 0,
        unassigned = 0,
        managedunmanagedTotal = 0,
        managedData = 0,
        unManagedData = 0,
        unAssignedData = 0;
        $('#instanceActionListLoader').show();

    function clearInstance() {
        unmanagedTotal = managedTotal = unassigned = managedunmanagedTotal = 0;
        $('#totalManagedInstances').html(managedTotal);
        $('#totalUnmanagedInstances').html(unmanagedTotal);
        $('#totalUnAssignedInstances').html(unassigned);
        $('#totalInstances').html(managedunmanagedTotal);
        $('#instanceTableContainer').hide();
        $('#instanceAssignedContainer').hide();
        $('#instanceUnAssignedContainer').hide();
        $('.footer').addClass('hidden');
    }

    $("#refreshBtn").click(function() {
        clearInstance();
        getManagedInstances();
        getAssignedInstances();
        getUnassignedInstances();
    });

    var orgId, orgProviderId;
    $.get("/d4dMasters/readmasterjsonnew/1", function(data) {
        for (var i = 0; i < data.length; i++) {
            $("#orgDropdown").append($("<option></option>").val(data[i].rowid).html(data[i].orgname));
        }
        orgId = data[0].rowid;
        $("#orgDropdown").change(function(e) {
            clearInstance();
            orgId = $("#orgDropdown").val();
            $("#providerDropdown").find("option:gt(0)").remove();
            getManagedInstances();
            getAssignedInstances();
            getUnassignedInstances();
            awsProviders(orgId);
            $('#instanceActionListLoader').show();
        });
        $("#orgDropdown").trigger("change");
    });

    //ajax call to get the list of aws providiers.
    function awsProviders(orgId) {
        $.ajax({
            type: 'GET',
            url: '../aws/providers/org/' + orgId,
            success: function(data, success) {
                if (data.length === 0) {
                    $('.providerValues').addClass('hidden');
                    $('.noProviderView').show();
                } else {
                    for (var i = 0; i < data.length; i++) {
                        $('.noProviderView').hide();
                        $('.providerValues').removeClass('hidden');
                        $("#providerDropdown").append($("<option></option>").val(data[i]._id).html(data[i].providerName).attr('rowId', data[i]._id));
                    }
                    $("#providerDropdown").change(function(e) {
                        var element = $("option:selected", this);
                        orgProviderId = element.attr("rowId");
                        clearInstance();
                        if (orgProviderId) {
                            getManagedInstances();
                            getAssignedInstances();
                            getUnassignedInstances();
                        } else {
                            getManagedInstances();
                            getAssignedInstances();
                            getUnassignedInstances();
                        }
                    });
                    $("#providerDropdown").trigger("change");
                }
            },
            error :function() {
                $('.providerValues').addClass('hidden');
                $('.noProviderView').show();
                $('#instanceActionListLoader').hide();
          }
        });
    }

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

    function getManagedInstances() {
        $('#instanceActionListLoader').show();
        var urlManagedNoProvider, urlManagedProvider;
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=managed&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
        } else {
            urlManagedProvider = "../tracked-instances?category=managed&filterBy=orgId:" + orgId;
        }
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: (urlManagedNoProvider) ? urlManagedNoProvider : urlManagedProvider,
            success: function(data) {
                managedData = data.recordsTotal;
                updateTotalCount("managed", managedData);
                $('#instanceActionListLoader').hide();
            },
            error: function(){
                managedData = 0;
                updateTotalCount("managed", managedData);
                $('#instanceActionListLoader').hide();  
            }
        });
    }

    function getAssignedInstances() {
        $('#instanceActionListLoader').show();
        var urlManagedNoProvider, urlManagedProvider;
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=assigned&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
        } else {
            urlManagedProvider = "../tracked-instances?category=assigned&filterBy=orgId:" + orgId;
        }
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: (urlManagedNoProvider) ? urlManagedNoProvider : urlManagedProvider,
            success: function(data) {
                unManagedData = data.recordsTotal;
                updateTotalCount("assigned", unManagedData);
                $('#instanceActionListLoader').hide();
            },
            error: function(){
                unManagedData = 0;
                updateTotalCount("assigned", unManagedData);
                $('#instanceActionListLoader').hide();  
            }
        });
    }

    function getUnassignedInstances() {
        $('#instanceActionListLoader').show();
        var urlManagedNoProvider, urlManagedProvider;
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=unassigned&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
        } else {
            urlManagedProvider = "../tracked-instances?category=unassigned&filterBy=orgId:" + orgId;
        }
        $.ajax({
            type: "get",
            dataType: "json",
            async: false,
            url: (urlManagedNoProvider) ? urlManagedNoProvider : urlManagedProvider,
            success: function(data) {
                unAssignedData = data.recordsTotal;
                updateTotalCount("unassigned", unAssignedData);
                var totalInstances;
                totalInstances = managedData + unManagedData + unAssignedData;
                updateTotalCount("managedunmanaged", totalInstances);
                $('#instanceActionListLoader').hide();
            },
            error: function(){
                unAssignedData = 0;
                updateTotalCount("unassigned", unAssignedData);
                var totalInstances;
                totalInstances = managedData + unManagedData + unAssignedData;
                updateTotalCount("managedunmanaged", totalInstances);
                $('#instanceActionListLoader').hide();
            }
        });
    }

    $('#totalManagedInstancesMoreInfo').on('click', function() {
        //$(this).css('box-shadow', '10px 10px 5px #888');
        loadAllManagedInstances();
        $('#instanceTableContainer').show();
        $('#instanceAssignedContainer').hide();
        $('#instanceUnAssignedContainer').hide();
    });

    $('#totalUnManagedInstancesMoreInfo').on('click', function() {
        //$(this).css('box-shadow', '10px 10px 5px #888');
        loadAllUnManagedInstances();
        $('#instanceTableContainer').hide();
        $('#instanceUnAssignedContainer').hide();
        $('#instanceAssignedContainer').show();
    });

    $('#totalUnAssignedInstancesMoreInfo').on('click', function() {
        //$(this).addClass('shadow');
        getUnassignedInstancesWithProjectAndEnv();
        $('#instanceTableContainer').hide();
        $('#instanceAssignedContainer').hide();
        $('#instanceUnAssignedContainer').show();
    });

    function loadAllManagedInstances() {
        var urlManagedNoProvider, urlManagedProvider;
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=managed&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
        } else {
            urlManagedProvider = "../tracked-instances?category=managed&filterBy=orgId:" + orgId;
        }
        $('.footer').addClass('hidden');
        $('#instanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": (urlManagedNoProvider) ? urlManagedNoProvider : urlManagedProvider,
            "columns": [{
                "data": "platformId",
                "orderable": true
            },  {"data": "" ,"orderable" : true ,
                "render":function(data, type, full, meta) {
                    return full.orgName?full.orgName:'-';
                }
            },
                {"data": "" ,"orderable" : true ,
                    "render":function(data, type, full, meta) {
                        return full.bgName?full.bgName:'-';
                    }
                },
                {"data": "" ,"orderable" : true,
                    "render":function(data, type, full, meta) {
                        return full.projectName?full.projectName:'-';
                    }
                },
                {"data": "","orderable" : true,
                    "render":function(data, type, full, meta) {
                        return full.environmentName?full.environmentName:'-';
                    }
                }
                , {
                "data": "",
                "orderable": true,
                    "render":function(data, type, full, meta) {
                        if(full.instanceIP === null){
                            if(full.privateIpAddress === null){
                                return '-';
                            }else{
                                return full.privateIpAddress;
                            }
                        }else{
                            return full.instanceIP;
                        }
                    }
            }, {
                "data": "instanceState",
                "orderable": true
            }]
        });
    }

    function loadAllUnManagedInstances() {
        var urlManagedNoProvider, urlManagedProvider;
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=assigned&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
        } else {
            urlManagedProvider = "../tracked-instances?category=assigned&filterBy=orgId:" + orgId;
        }
        $('.footer').addClass('hidden');
        $('#instanceAssignedTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": (urlManagedNoProvider) ? urlManagedNoProvider : urlManagedProvider,
            "columns": [{
                "data": "platformId",
                "orderable": true
            },  {"data": "" ,"orderable" : true ,
                "render":function(data, type, full, meta) {
                    return full.orgName?full.orgName:'-';
                }
            },
                {"data": "" ,"orderable" : true ,
                    "render":function(data, type, full, meta) {
                        return full.bgName?full.bgName:'-';
                    }
                },
                {"data": "" ,"orderable" : true,
                    "render":function(data, type, full, meta) {
                        return full.projectName?full.projectName:'-';
                    }
                },
                {"data": "","orderable" : true,
                    "render":function(data, type, full, meta) {
                        return full.environmentName?full.environmentName:'-';
                    }
                },
                 {
                "data": "",
                "orderable": true,
                "render": function(data, type, full,meta) {
                    if(full.ip === null){
                        if(full.privateIpAddress === null){
                            return '-';
                        }else{
                            return full.privateIpAddress;
                        }
                    }else{
                        return full.ip;
                    }
                }
            }, {
                "data": "state",
                "orderable": true
            }]
        });
    }

    function getUnassignedInstancesWithProjectAndEnv() {
        var urlManagedNoProvider, urlManagedProvider;
        var envProjectMappingObject = {};
        if (orgProviderId) {
            urlManagedNoProvider = "../tracked-instances?category=unassigned&filterBy=orgId:" + orgId + ' ' + "providerId:" + orgProviderId;
            $.get('/providers/'+ orgProviderId +'/tag-mappings', function(tagsListSelected) {
                if (tagsListSelected) {
                    for (var i = 0; i < tagsListSelected.length; i++) {
                        var objcatalystEntityType = tagsListSelected[i].catalystEntityType;
                        var objtagName = tagsListSelected[i].tagName;
                        if (objcatalystEntityType == 'project') {
                            envProjectMappingObject['project'] = objtagName;
                        }
                        if (objcatalystEntityType == 'environment') {
                            envProjectMappingObject['environment'] = objtagName;
                        }
                        if (objcatalystEntityType == 'bgName') {
                            envProjectMappingObject['bgName'] = objtagName;
                        }
                    }
                    getUnassignedInstancesWithTagMapping(envProjectMappingObject,urlManagedNoProvider);
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
        } else {
            urlManagedProvider = "../tracked-instances?category=unassigned&filterBy=orgId:" + orgId;
            getUnassignedInstancesWithTagMapping(envProjectMappingObject,urlManagedProvider);
        }
    }

    function getUnassignedInstancesWithTagMapping(envProjectMappingObject,url){
        $('.footer').removeClass('hidden');
        $('#instanceUnassignedTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": url,
            "createdRow": function(row, data) {
                $(row).attr({
                    "instanceId": data._id,
                    "urlproviderId": data.providerId
                })
            },
            "columns": [{
                "data": "platformId",
                "orderable": true
            }, {
                "data": "os",
                "orderable": false
            }, {
                "data": "",
                "orderable": true,
                "render":function(data, type, full, meta) {
                    if(full.ip === null){
                        if(full.privateIpAddress === null){
                            return '-';
                        }else{
                            return full.privateIpAddress;
                        }
                    }else{
                        return full.ip;
                    }
                }
            }, {
                "data": "state",
                "orderable": true
            },
                {"data": "" ,"orderable" : false,
                    "render": function(data, type, full) {
                        if(full.tags && envProjectMappingObject.bgName && full.tags[envProjectMappingObject.bgName]) {
                            var tagValue = full.tags[envProjectMappingObject.bgName];
                            return '<input class="form-control bgTagName"  type="text" value="' + tagValue + '"/>';
                        }else{
                            return '<input class="form-control bgTagName" type="text" value=""/>';
                        }
                    }
                },
                {"data": "" ,"orderable" : false,
                    "render": function(data, type, full) {
                        if(full.tags && envProjectMappingObject.project && full.tags[envProjectMappingObject.project]) {
                            var tagValue = full.tags[envProjectMappingObject.project];
                            return '<input class="form-control projectTagName"  type="text" value="' + tagValue + '"/>';
                        }else{
                            return '<input class="form-control projectTagName" type="text" value=""/>';
                        }
                    }
                },
                {"data": "" ,"orderable" : false,
                    "render": function(data, type, full) {
                        if(full.tags && envProjectMappingObject.environment && full.tags[envProjectMappingObject.environment]) {
                            var tagValue = full.tags[envProjectMappingObject.environment];
                            return '<input class="form-control envTagName" type="text" value="' + tagValue + '"/>';
                        }else{
                            return '<input class="form-control envTagName" type="text" value=""/>';
                        }
                    }
                },
                {
                    "data": "platformId",
                    "orderable": false,
                    "render": function(data, type, full, meta) {
                        if (full.platformId) {
                            return '<input class="nodeCheckBox" type="checkbox" val=""/>';
                        }
                    }
                }]
        });
    }

    $('#unassignedSyncBtn').on('click', function(e) {
        var updateInstanceTagsObj = {};
        var updateInstanceTagsArr = [];
        var providerId='', projectTagsMapName='', envTagsMapName='',bgTagsMapName='';
        var $checkBox_checked = $('#instanceUnassignedTable').find('tbody tr').filter(':has(:checkbox:checked)');
        if ($checkBox_checked.length > 0) {
            $('#instanceUnassignedTable').find('tbody tr').filter(':has(:checkbox:checked)').each(function() {
                //Batch update instances tags
                $('#instanceActionListLoader').show();
                var updateUniqueInstanceTagsObj = {};
                providerId = $(this).attr("urlproviderId");
                var instanceId = $(this).attr("instanceId");
                var projectTagName = $(this).find('.projectTagName').val();
                var envTagName = $(this).find('.envTagName').val();
                var bgTagName = $(this).find('.bgTagName').val();
                $.get('/providers/' + providerId + '/tag-mappings', function(tagsListSelected) {
                    if (tagsListSelected) {
                        for (var i = 0; i < tagsListSelected.length; i++) {
                            var objcatalystEntityType = tagsListSelected[i].catalystEntityType;
                            var objtagName = tagsListSelected[i].tagName;
                            //Creating an object to map with unassigned instances(To get data for project and environment in every row)
                            if (objcatalystEntityType == 'project') {
                                projectTagsMapName = objtagName;
                            }
                            if (objcatalystEntityType == 'environment') {
                                envTagsMapName = objtagName;
                            }
                            if (objcatalystEntityType == 'bgName') {
                                bgTagsMapName = objtagName;
                            }
                        }
                        updateUniqueInstanceTagsObj["id"] = instanceId;
                        updateUniqueInstanceTagsObj["tags"] = {};
                        if(projectTagName === '' &&  envTagName === '' && bgTagName ===''){
                            toastr.error("Please update tag value in any text-box corresponding to selected check-box for updating tags");
                            return false;
                        }
                        if(projectTagName !== ''){
                            updateUniqueInstanceTagsObj["tags"][projectTagsMapName] = projectTagName;
                        }
                        if(envTagName !== ''){
                            updateUniqueInstanceTagsObj["tags"][envTagsMapName] = envTagName;
                        }
                        if(bgTagName !== ''){
                            updateUniqueInstanceTagsObj["tags"][bgTagsMapName] = bgTagName;
                        }
                        updateInstanceTagsArr.push(updateUniqueInstanceTagsObj);
                        updateInstanceTagsObj["instances"] = updateInstanceTagsArr;
                        $.ajax({
                            url: '/providers/' + providerId + '/unassigned-instances',
                            data: JSON.stringify(updateInstanceTagsObj),
                            type: 'PATCH',
                            contentType: "application/json",
                            success: function(data) {
                                $('.margintop-25left250').fadeIn();
                                toastr.success('Tag Updated successfully');
                                $('.margintop-25left250').delay(2000).fadeOut();
                                $('#instanceActionListLoader').hide();
                            },
                            error: function(jqxhr) {
                                toastr.error(jqxhr.responseJSON.message);
                                $('#instanceActionListLoader').hide();
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
                    toastr.error(msg);
                    $('#instanceActionListLoader').hide();
                });

            });
        } else {
            toastr.error("Please select corresponding check-box for updating tags");
            return false;
        }
    });
});