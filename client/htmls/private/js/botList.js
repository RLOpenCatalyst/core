
$(document).ready(function(e) {
    getOrganizationList();
    $('#botTeamSync').hide();
    $(".botTeamList").select2({
        placeholder: "Select Team(s)"
    });
});

//to list down the organization for creating the gitHub repo item.
function getOrganizationList() {
    $.get('/d4dMasters/readmasterjsonnew/1', function(data) {
        var str = '',
            len = data.length;
        for (var i = 0; i < data.length; i++) {
            str = str + '<option value="' + data[i].rowid + '">' + data[i].orgname + '</option>';
        }
        $('#orgName').html(str);
        var selectedOrg = $("#orgName").val();
        filterColumn(selectedOrg);
    })
}

function filterColumn(orgId) {
    $(".botTeamList").select2("val","");
    var filter;
    if(orgId !== undefined) {
        filter = orgId;
    } else {
        filter = $('#orgName').val();
    }
    getGlobalBots(filter);
    getTeamList(filter);
}

function getTeamList(orgId) {
    $.ajax({
        url: '../d4dMasters/readmasterjsonnew/21',
        method: 'GET',
        success: function(data) {
            var str;
            if(data && data.length > 0) {
                for(var i=0;i<data.length; i++) {
                    if(orgId === data[i].orgname_rowid[0]) {
                        str = str + '<option value="' + data[i].rowid + '">' + data[i].teamname + '</option>';
                        $('#teamList').html(str);
                    }
                }
            } else {
                $('#gitImportTable').addClass('hidden');
                $('#gitCloneImportSave').hide();
                $('#noDataAvailable').show();
            }
        },
        error: function(jxhr) {
            $('#gitImpLoader').hide();
            $('#gitImportTable').hide();
            console.log(jxhr);
            var msg = "Unable to Fetch Team List.";
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                msg = jxhr.responseJSON.message;
            } else if (jxhr.responseText) {
                var msgCheck = JSON.parse(jxhr.responseText);
                msg = msgCheck.msg;
            }
            toastr.error(msg);
            $('#gitHubListLoader').hide();
        }
    });
    return false;
}

function getGlobalBots(orgId) {
    $('#botsTable').DataTable( {
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "createdRow": function( row, data ) {
            $( row ).attr({"botName": data.name,"botId" : data.id,"category":data.category,
                "type":data.type,"orgName":data.orgName,"orgId":data.orgId
            });
        },
        "ajax": {
            "url": "/bot?filterBy=orgId:" + orgId,
            "data": function( result ) {
                var columnIndex = parseInt(result.order[0].column);
                var newResult = {
                    draw:result.draw,
                    page:result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                    pageSize:result.length,
                    sortOrder:result.order[0].dir,
                    sortBy:result.columns[columnIndex].data,
                    paginationType: 'jquery',
                    search:result.search.value
                }
                return newResult;
            }
        },
        "columns": [
            {"data": "name", "orderable" : true},
            {"data": "id","orderable" : false  },
            {"data": "category" ,"orderable" : false },
            {"data": "type" ,"orderable" : false},
            {"data": "orgName" ,"orderable" : false},
            {"data": "environmentName", "orderable": true,
                "render": function (data) {
                    return data ? data : '-';
                }
            }
        ]
    });
};

$('.botTeamList').on('change',function(){
    if($('#teamList').val() === null) {
        $('#botTeamSync').hide();   
    }
})

$('#botsTable tbody').on( 'click', 'tr', function () {
    $(this).toggleClass('active');
    if($('#teamList').val() && $('#teamList').val().length>0) {
        if($(this).hasClass('active')) {
            $('#botTeamSync').show();
        } else {
            $('#botTeamSync').hide();    
        }
    } else {
        if($(this).hasClass('active')) {
            $('#botTeamSync').hide();
        }
    }
}); 

$('#botTeamSync').click(function(){
    var data = $('#botsTable').DataTable().rows('.active').data();
    var selectedOrg = $("#orgName").val();
    var teamId = $('#teamList').val();
    var reqBody = {};
    var resourceIds = [];
    $.each(data,function(key,val) {
        resourceIds.push(val.id);
        reqBody.add = [{
            resourceIds:resourceIds,
            teamIds:teamId
        }];
    });
    reqBody.delete = [];
    console.log(reqBody);
    var resourceType = 'bots';
    $.ajax({
        method: 'POST',
        url: '../api/org/' + selectedOrg + '/' + resourceType,
        data: reqBody,
            success: function(data, success) {
                toastr.success('Succesfullly added BOTs to teams');
            },
            error: function(jxhr) {
                console.log(jxhr);
                var msg = "Server Behaved Unexpectedly";
                if (jxhr.responseJSON && jxhr.responseJSON.message) {
                    msg = jxhr.responseJSON.message;
                } else if (jxhr.responseText) {
                    msg = jxhr.responseText;
                }
                toastr.error(msg);

                $('#saveItemSpinner').addClass('hidden');
                $('#gitCloneImport').removeAttr('disabled');
            }
    });
    
    return false;
});

