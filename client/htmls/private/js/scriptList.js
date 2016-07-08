//initialising the datatable...
if (!$.fn.dataTable.isDataTable('#scriptListTable')) {
    var $scriptDatatable = $('#scriptListTable').DataTable({
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
            "bSortable": false
        }]

    });
}

 function setfilename(val){
    $('#fileNameDisplay').empty();
    var fileName = val.substr(val.lastIndexOf("\\")+1, val.length);
    $("#fileNameDisplay").append(fileName);
  }

//calling the global track functionality when track params are available..
$(document).ready(function(e) {
    getScriptList();
});

//when the user clicks on the new button the setting the value to 'new' for the hidden field to know that user is creating the new item..
$('.addScriptItem').click(function(e) {
    $('#scriptForm').trigger('reset');
    $('#orgName').removeAttr('disabled');
    $('#scriptType').removeAttr('disabled');
    $('#orgName').val('');
    $('#fileNameDisplay').empty();
    $('.modal-header').find('.modal-title').html('Create New Script Item');
    $('#scriptEditHiddenInput').val('new');
    getOrganizationList();
    
});
//to list down the organization for creating the script item.
function getOrganizationList() {
    $.get('/d4dMasters/readmasterjsonnew/1', function(data) {
        var str = ' <option value="">Select Organization</option>',
        len = data.length;
        for (var i = 0; i < data.length; i++) {
            str = str + '<option value="' + data[i]._id + '">' + data[i].orgname + '</option>';
        }
        $('#orgName').html(str);
    })
}

//to show the focus on first input ....
$(document).on('shown.bs.modal', function(e) {
    $('[autofocus]', e.target).focus();
});


//form validation for dashboard save
var validator = $('#scriptForm').validate({
    rules: {
        trackUrl: {
            url: true
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
                console.log(element);
                console.log(element.parent);
                error.insertBefore('div.inputGroups');
            }
        }
    },
});
$('a.addScriptItem[type="reset"]').on('click', function(e) {
    validator.resetForm();
});


//this is a functionality to get the list of script items that have been created....
function getScriptList() {
    //for getting the list of scripts
    var scriptDetails = '../scriptExecutor';
    $.get(scriptDetails, function(data) {
        if (data && data.length) {
            for (var kk = 0; kk < data.length; kk++) {
                createTableForScript(data[kk]);
            }
        }
    }).fail(function(jxhr) {
        var msg = "Server Behaved Unexpectedly";
        if (jxhr.responseJSON && jxhr.responseJSON.message) {
            msg = jxhr.responseJSON.message;
        } else if (jxhr.responseText) {
            msg = jxhr.responseText;
        }
        bootbox.alert(msg);
    });
};


//creating a table for showcasing the list of script items on the script gallery page..
function createTableForScript(scriptData) {
    var $scriptNameList = $('#scriptListTable tbody');
    var $tr = $('<tr class="scriptItemRow"></tr>').attr('data-scriptId', scriptData._id).attr('data-type', scriptData.type);
    $tr.data('scriptData', scriptData);

    var $tdName = $('<td class="scriptName">' + scriptData.name + '</td>');
    var $tdOrganization = $('<td class="scriptOrganization">' + scriptData.orgDetails.name + '</td>');
    var $tdType = $('<td class="scriptType">' + scriptData.type + '</td>');
    var $tdDescription = $('<td class="scriptDescription">' + scriptData.description + '</td>');

    var $tdAction = $('<td/>');

    $tdAction.append('<div class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton editRowScriptItem" data-placement="top" value="Update" title="Edit"><i class="ace-icon fa fa-pencil bigger-120"></i></button></div>').append('<div style="margin-left:14px;" class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deleteScript" data-placement="top" value="Remove" title="Delete"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>');

    //for editing track items from the table...
    $tdAction.find('button.editRowScriptItem').click(function() {
        var $this = $(this);
        var $tr = $this.parents('tr.scriptItemRow');
        var scriptData = $tr.data('scriptData');
        console.log(scriptData);
        var scriptId = scriptData._id;
        var $editModal = $('#modalForScriptEdit');
        $editModal.modal('show');
        $editModal.find('#scriptEditHiddenInput').val('edit');
        $editModal.find('h4.modal-title').html('Edit Script &nbsp;-&nbsp;&nbsp;' + scriptData.name);
        $editModal.find('#scriptName').val(scriptData.name);
        $editModal.find('#scriptDescription').val(scriptData.description);
        $editModal.find('#orgName').empty().append('<option value="'+scriptData.orgDetails.id+'">'+scriptData.orgDetails.name+'</option>').attr('disabled','disabled');
        $editModal.find('#scriptType').val(scriptData.type).attr('disabled','disabled');
        $editModal.find('#scriptHiddenInputId').val(scriptData._id);
        console.log(scriptData.filePath);
        $editModal.find('#fileNameDisplay').empty().append(scriptData.filePath);
        return false;
    });

    //for deletion of script items from the table..
    $tdAction.find('button.deleteScript').click(function() {

        var $this = $(this);
        var $tr = $this.parents('tr.scriptItemRow');
        var scriptId = scriptData._id;
        bootbox.confirm({
            message: 'Are you sure you want to Delete Script Item -&nbsp;' + scriptData.name + '&nbsp;&nbsp;of Type-&nbsp;' + scriptData.type,
            title: "Warning",
            callback: function(result) {
                if (result) {
                    $.ajax({
                        url: '../scriptExecutor/' + scriptId,
                        method: 'DELETE',
                        success: function() {
                            $scriptDatatable.row($tr).remove().draw(false);
                        },
                        error: function(jxhr) {
                            bootbox.alert(result);
                            var msg = "Unable to Delete URL please try again later";
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

    $tr.append($tdName).append($tdOrganization).append($tdType).append($tdDescription).append($tdAction);
    $scriptNameList.append($tr);
    $scriptDatatable.row.add($tr).draw();
};

//save form for creating a new script item and updation of the script item(name, description etc)..
$('#scriptForm').submit(function(e) {
    var isValidator = $('#scriptForm').valid();
    if (!isValidator) {
        e.preventDefault();
        return false;
    } else {
        e.preventDefault();
        $('#saveItemSpinner').removeClass('hidden');
        var $form = $('#scriptForm');
        var scriptData = {};
        $this = $(this);
        var name = $this.find('#scriptName').val().trim();
        var description = $this.find('#scriptDescription').val().trim();
        var type = $form.find('#scriptType').val();
        var orgId = $form.find('#orgName').val();
        var scriptEditNew = $(this).find('#scriptEditHiddenInput').val();
        var scriptId = $form.find('#scriptHiddenInputId').val();
        var orgName = $form.find('#orgName :selected').text();
        var fileNameDisplay = $form.find('#scriptFile').val();
        console.log(fileNameDisplay);
        var availableFileName = $form.find('#fileNameDisplay').text();
        var orgDetails = {
            name: orgName,
            id: orgId
        }
        var url;
        var reqBody = {};
        //for multipart form data upload..
        var formData = new FormData();
        formData.append('file', $('input[type=file]')[0].files[0]);

        if(fileNameDisplay){
        $.ajax({
            method: "POST",
            url: '../scriptExecutor/uploadScript',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function(data, success) {
                var filePath = data.filename;
                filePath = filePath.split('_')[1];
                //for edit
                if (scriptEditNew === 'edit') {
                    console.log(scriptEditNew);
                    url = '../scriptExecutor/' + scriptId + '/update';
                    reqBody = {
                        "name": name,
                        "description": description,
                        "filePath": filePath
                    };
                } else {
                    url = '../scriptExecutor';
                    reqBody = {
                        "name": name,
                        "type": type,
                        "description": description,
                        "orgDetails": orgDetails,
                        "filePath": filePath
                    };
                }
                $.ajax({
                    method: "POST",
                    url: url,
                    data: reqBody,
                    success: function(data, success) {
                        $('#modalForScriptEdit').modal('hide');
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                        if (scriptEditNew === 'new') {
                            createTableForScript(data);
                            $('#saveBtnScript').removeAttr('disabled');
                        } else {
                            var $tr = $('tr[data-scriptId="' + scriptId + '"]');
                            $tr.find('.scriptName').html(reqBody.name);
                            $tr.find('.scriptDescription').html(reqBody.description);
                            $tr.data('scriptData', {
                                _id: scriptId,
                                name: name,
                                type: type,
                                description: description,
                                orgDetails : orgDetails,
                                filePath: filePath
                            });
                        }
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
                        $('#saveBtnScript').removeAttr('disabled');
                    },
                    failure: function(jxhr) {
                        console.log(jxhr);
                        var msg = "Server Behaved Unexpectedly";
                        if (jxhr.responseJSON && jxhr.responseJSON.message) {
                            msg = jxhr.responseJSON.message;
                        } else if (jxhr.responseText) {
                            msg = jxhr.responseText;
                        }
                        bootbox.alert(msg);
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                    }
                });
            }
        });
        }else{
            //for edit
            if (scriptEditNew === 'edit') {
                console.log(scriptEditNew);
                url = '../scriptExecutor/' + scriptId + '/update';
                reqBody = {
                    "name": name,
                    "description": description,
                    "filePath": availableFileName
                };
            }
            $.ajax({
                    method: "POST",
                    url: url,
                    data: reqBody,
                    success: function(data, success) {
                        $('#modalForScriptEdit').modal('hide');
                        $('#saveItemSpinner').addClass('hidden');
                        $('#saveBtnScript').removeAttr('disabled');
                        var $tr = $('tr[data-scriptId="' + scriptId + '"]');
                        $tr.find('.scriptName').html(reqBody.name);
                        $tr.find('.scriptDescription').html(reqBody.description);
                        $tr.data('scriptData', {
                            _id: scriptId,
                            name: name,
                            type: type,
                            description: description,
                            orgDetails : orgDetails,
                            filePath: availableFileName
                        });
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
                        $('#saveBtnScript').removeAttr('disabled');
                    }
                });
        }
        return false;
    }
});