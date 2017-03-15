//initialising the datatable...
if (!$.fn.dataTable.isDataTable('#cicdDashboardServerTable')) {
    var $cicdDashboardServerTable = $('#cicdDashboardServerTable').DataTable({
        "pagingType": "full_numbers",
        "bInfo": false,
        "bLengthChange": false,
        "paging": true,
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
            "bSortable": false
        }]

    });
}

$(document).ready(function(e) {
    getGlobalcicdDashboardServers();
});

function getGlobalcicdDashboardServers(){
    $('#cicdDashboardServerTable').DataTable( {
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "createdRow": function( row, data ) {
           $( row ).attr({"dashboardName": data.dashboardName,"dashboardDesc":data.dashboardDesc,"orgId" : data.orgId ,"orgName" : data.orgName,"dashboardId" : data._id,"dashboardServer":data.dashboardServer,"dashboardServerUserName":data.dashboardServerUserName,"dashboardDbHostName":data.dashboardDbHostName
            });
        },
        "ajax": '/cicd-dashboardservice',
        "columns": [
            {"data": "dashboardName", "orderable" : true},
            {"data": "orgName","orderable" : false  },
            {"data": "dashboardServer" ,"orderable" : true },
            {"data": "dashboardDbHostName" ,"orderable" : false},
            
            {"data": "","orderable" : true,
                "render": function (data) {
                    var $tdAction = '<div style="margin-left:14px;" class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton editcicdDashboardServer" data-placement="top" value="Update" title="Edit"><i class="ace-icon fa fa-pencil bigger-120"></i></button></div>';
                    $tdAction = $tdAction + '<div style="margin-left:14px;" class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deletecicdDashboardServer" data-placement="top" value="Remove" title="Delete"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>';
                    return $tdAction;
                }
            }
        ]
    } );

}


//when the user clicks on the new button the setting the value to 'new' for the hidden field to know that user is creating the new item..
$('.addcicddashboardServer').click(function(e) {
    $('#cicddashboardServerForm').trigger('reset');
    $('.modal-header').find('.modal-title').html('Create New CICD Dashboard Server');
    $('#cicddashboardServerEditHiddenInput').val('new');
    $('#dashboardDbHostName').val('localhost');
    
    getOrganizationList();
    $('#orgName,#dashboardName').removeAttr('disabled');
    
    $('#cicddashboardServerEditHiddenInputId').val('');
    var $editModal = $('#modalForcicddashboardServerEdit');
    $editModal.modal('show');
   
});

//to list down the organization for creating the gitHub repo item.
function getOrganizationList() {
    $.get('/d4dMasters/readmasterjsonnew/1', function(data) {
        var str = ' <option value="">Select Organization</option>',
            len = data.length;
        for (var i = 0; i < data.length; i++) {
            str = str + '<option value="' + data[i].rowid + '">' + data[i].orgname + '</option>';
        }
        $('#orgName').html(str);
    });
}

//save form for creating a new gitHub item and updation of the gitHub details.
$('#cicddashboardServerForm').submit(function(e) {
    $('#saveBtncicddashboardServer').removeAttr('disabled');
    var isValidator = $('#cicddashboardServerForm').valid();
    if (!isValidator) {
        e.preventDefault();
        return false;
    } else {
        e.preventDefault();
        $('#saveItemSpinner').removeClass('hidden');
        var $form = $('#cicddashboardServerForm');
        $this = $(this);
        var dashboardName = $this.find('#dashboardName').val().trim();
        var orgValue = $this.find('#orgName').val();
        var dashboardDesc = $this.find('#dashboardDesc').val();
        var dashboardServer = $this.find('#dashboardServer').val();
        var dashboardServerUserName = $this.find('#dashboardServerUserName').val();
        var dashboardServerPassword = $this.find('#dashboardServerPassword').val();
        var dashboardDbHostName = $this.find('#dashboardDbHostName').val();
        var newFormData = new FormData();
        var dashboardEditNew = $this.find('#cicddashboardServerEditHiddenInput').val();
        var cicddashboardServerEditHiddenInputId = $form.find('input#cicddashboardServerEditHiddenInputId').val();
        if (dashboardEditNew === 'edit') {
            url = '../cicd-dashboardservice/' + cicddashboardServerEditHiddenInputId;
            methodName = 'PUT';
        } else {
            methodName = 'POST';
            url = '../cicd-dashboardservice';
        }
        reqBody = {
                "dashboardName": dashboardName,
                "orgId": orgValue,
                "dashboardDesc": dashboardDesc,
                "dashboardServer": dashboardServer,
                "dashboardServerUserName": dashboardServerUserName,
                "dashboardServerPassword": dashboardServerPassword,
                "dashboardDbHostName": dashboardDbHostName,
          
        }
       
        saveForm(methodName,url,reqBody);

    }
});

$('a.addcicddashboardServer[type="reset"]').on('click', function(e) {
    validator.resetForm();
});


function saveForm(methodName,url,reqBody) {
    $.ajax({
        method: methodName,
        url: url,
        async:false,
        data: reqBody,
        success: function(data, success) {
            $('#modalForcicddashboardServerEdit').modal('hide');
            $('#saveItemSpinner').addClass('hidden');
            $('#saveBtncicddashboardServer').removeAttr('disabled');
            getGlobalcicdDashboardServers();
            
        },
        error: function(jxhr) {
            console.log(jxhr);
            var msg = "Server Behaved Unexpectedly";
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                msg = jxhr.responseJSON.message;
            } else if (jxhr.responseText) {
                msg = jxhr.responseText;
            }
            bootbox.alert(msg);

            $('#saveItemSpinner').addClass('hidden');
            $('#saveBtncicddashboardServer').removeAttr('disabled');
        }
    });
}

var validator = $('#cicddashboardServerForm').validate({
    ignore: [],
    rules: {
        
        dashboardName: {
            maxlength: 15
        }
    },
    messages: {
        
        gitName: {
            maxlength: "Limited to 30 chars"
        }
    },
    onkeyup: false,
    errorClass: "error",

    //put error message behind each form element
    errorPlacement: function(error, element) {
        console.log(error, element);
        var elem = $(element);
        if (element.parent('.input-groups').length) {
            error.insertBefore(element.parent());
        } else {
            if (element.parent('div.inputGroups')) {
                error.insertBefore('div.inputGroups');
            }
        }
    }
});

//Edit Population

$('#cicdDashboardServerTable tbody').on( 'click', 'button.editcicdDashboardServer', function(){
    validator.resetForm();
    var $this = $(this);
    var $editModal = $('#modalForcicddashboardServerEdit');
    $editModal.find('#cicddashboardServerEditHiddenInput').val('edit');
    $editModal.modal('show');

    $editModal.find('h4.modal-title').html('Edit CICD Dashboard Server &nbsp;-&nbsp;&nbsp;' + $this.parents('tr').attr('dashboardName'));
    $editModal.find('#dashboardName').val($this.parents('tr').attr('dashboardName')).attr('disabled','true');
    $editModal.find('#dashboardDesc').val($this.parents('tr').attr('dashboardDesc'));
    $editModal.find('#orgName').empty().append('<option value="'+$this.parents('tr').attr("orgId")+'">'+$this.parents('tr').attr("orgName")+'</option>').attr('disabled','disabled');
    $editModal.find('#dashboardServer').val($this.parents('tr').attr('dashboardServer'));
    $editModal.find('#dashboardServerUserName').val($this.parents('tr').attr('dashboardServerUserName'));
    $editModal.find('#dashboardDbHostName').val($this.parents('tr').attr('dashboardDbHostName'));
    $editModal.find('#cicddashboardServerEditHiddenInputId').val($this.parents('tr').attr('dashboardId'));
    return false;
});

$('#cicdDashboardServerTable tbody').on( 'click', 'button.deletecicdDashboardServer', function(){
    var $this = $(this);
    bootbox.confirm({
        message: 'Are you sure you want to Delete CI CD Dashboard Server -&nbsp;' + $this.parents('tr').attr('dashboardName'),
        title: "Warning",
        callback: function(result) {
            if (result) {
                $.ajax({
                    url: '../cicd-dashboardservice/' + $this.parents('tr').attr('dashboardId'),
                    method: 'DELETE',
                    success: function() {
                        getGlobalcicdDashboardServers();
                    },
                    error: function(jxhr) {
                        var msg = "Unable to Delete CI CD Dashboard Server please try again later";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                    }
                });
            } else {
                return;
            }
        }
    });
    return false;
});

//to show the focus on first input ....
$(document).on('shown.bs.modal', function(e) {
    $('[autofocus]', e.target).focus();
});