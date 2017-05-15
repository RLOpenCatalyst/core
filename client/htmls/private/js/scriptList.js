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
    $('#saveItemSpinner').addClass('hidden');
    $('#scriptForm').trigger('reset');
    $('#orgName').removeAttr('disabled');
    $('#scriptType').removeAttr('disabled');
    $('#orgName').val('');
    $('#fileNameDisplay').empty();
    $('#scriptHiddenInputId').val('');
    $('#fileHiddenInputId').val('');
    $('.modal-header').find('.modal-title').html('Create New Script Item');
    $('#scriptEditHiddenInput').val('new');
    $('#divParam').hide();
    $('#checkScriptParam').hide();
    getOrganizationList();
});

$("input[name='isParametrized']:radio").change(function(){
    if($(this).val() === 'Yes') {
        $('#noOfParams').addClass("required");
        $('#divParam').show();
        $('#checkScriptParam').show();
    } else {
        $('#noOfParams').removeClass("required");
        $('#divParam').hide();
        $('#checkScriptParam').hide();
    }
});
//to list down the organization for creating the script item.
function getOrganizationList() {
    $.get('/d4dMasters/readmasterjsonnew/1', function(data) {
        var str = ' <option value="">Select Organization</option>',
        len = data.length;
        for (var i = 0; i < data.length; i++) {
            str = str + '<option value="' + data[i].rowid + '">' + data[i].orgname + '</option>';
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
    ignore: [],
    rules: {
        scriptFile: {
            extension: "sh|py"
        },
        scriptName: {
            maxlength: 30
        },
        noOfParams: {
            maxlength: 2,
            number: true
        }
    },
    messages: {
        scriptFile: {
            extension: "Only .sh and .py files can be uploaded"
        },
        scriptName: {
            maxlength: "Limited to 30 chars"
        },
        noOfParams: {
            maxlength: "Limited to 2 Digit",
            number: "Only Numbers"
        }
    },
    onkeyup: false,
    errorClass: "error",
    errorPlacement: function(error, element) {
        var elem = $(element);
        if (element.parent('.input-groups').length) {
            error.insertBefore(element.parent());
        } else {
            if (element.parent('div.inputGroups')) {
                error.insertBefore('div.inputGroups');
            }
        }
    },
});

$('a.addScriptItem[type="reset"]').on('click', function(e) {
    validator.resetForm();
});

function getScriptList() {
    $('#scriptListTable').DataTable( {
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "createdRow": function( row, data ) {
            $( row ).attr({"scriptId" : data.scriptId,"scriptName":data.name,"scriptType":data.type,
                "scriptDesc" : data.description, "orgId" : data.orgDetails.id ,"orgName" : data.orgDetails.name,
                "scriptFileName" : data.fileName,"scriptFileId" : data.fileId,
                "isParametrized" : data.isParametrized,"noOfParams":data.noOfParams});
        },
        "ajax": {
            "url": '/scripts',
            "data": function (result) {
                var columnIndex = parseInt(result.order[0].column);
                var newResult = {
                    draw: result.draw,
                    page: result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                    pageSize: result.length,
                    sortOrder: result.order[0].dir,
                    sortBy: result.columns[columnIndex].data,
                    filterBy: result.filterBy,
                    search: result.search.value
                }
                return newResult;
            }
        },
        "columns": [
            {"data": "name", "orderable" : true},
            {"data": "orgDetails.name" ,"orderable" : false },
            {"data": "type","orderable" : false  },
            {"data": "description" ,"orderable" : false },
            {"data": "fileId" ,"orderable" : false,
                "render": function (data) {
                    var $tdScriptViewer = '<a href="#viewScriptModal" data-backdrop="false" data-toggle="modal" type="button" class="scriptViewer">View</a>';
                    return $tdScriptViewer;
                }
            },
            {"data": "","orderable" : true,
                "render": function (data) {
                    var $tdAction = '<div class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton editRowScriptItem" data-placement="top" value="Update" title="Edit"><i class="ace-icon fa fa-pencil bigger-120"></i></button></div>';
                    $tdAction = $tdAction + '<div style="margin-left:14px;" class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deleteScript" data-placement="top" value="Remove" title="Delete"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>';
                    return $tdAction;
                }
            }
        ]
    } );
};

//show the modal for script view.
$('#scriptListTable tbody').on( 'click', 'a.scriptViewer', function(){
    var $this = $(this);
    var $trForScript = $(this).parents('tr.scriptItemRow');
    var scriptFileId = $this.parents('tr').attr("scriptFileId");
    $.get('../fileUpload?fileId=' + scriptFileId, function(data){
        $('.modal-header').find('.modal-title').html(data.fileName + '&nbsp;(ReadOnly)');  
        $('.modal-body .scriptContainerRead').html(data.fileData);
    })
});

$(".modal").on("hidden.bs.modal", function(){
    $('.modal-title').html('');
    $('.modal-body .scriptContainerRead').html('');
});

$('#scriptListTable tbody').on( 'click', 'button.editRowScriptItem', function(){
    validator.resetForm();
    var $this = $(this);
    var $tr = $(this).parents('tr.scriptItemRow');
    var $editModal = $('#modalForScriptEdit');
    $editModal.modal('show');
    $('#scriptFile').val('');
    $('#scriptFile').removeClass('required');
    $editModal.find('#fileNameDisplay').empty();
    $editModal.find('#scriptEditHiddenInput').val('edit');
    $editModal.find('h4.modal-title').html('Edit Script &nbsp;-&nbsp;&nbsp;' + $this.parents('tr').attr('scriptName'));
    $editModal.find('#scriptName').val($this.parents('tr').attr('scriptName'));
    $editModal.find('#scriptDescription').val($this.parents('tr').attr("scriptDesc"));
    $editModal.find('#orgName').empty().append('<option value="'+$this.parents('tr').attr("orgId")+'">'+$this.parents('tr').attr("orgName")+'</option>').attr('disabled','disabled');
    $editModal.find('#scriptType').val($this.parents('tr').attr('scriptType')).attr('disabled','disabled');
    $editModal.find('#scriptHiddenInputId').val($this.parents('tr').attr('scriptId'));
    $editModal.find('#fileHiddenInputId').val($this.parents('tr').attr('scriptFileId'));
    $editModal.find('#fileNameDisplay').append($this.parents('tr').attr('scriptFileName'));
    if($this.parents('tr').attr('isParametrized') === true ||  $this.parents('tr').attr('isParametrized') === 'true'){
        $('input:radio[name="isParametrized"][value="Yes"]').prop('checked', true);
        $('#noOfParams').addClass("required");
        $('#divParam').show();
        $('#checkScriptParam').show();
        $editModal.find('#noOfParams').val($this.parents('tr').attr('noOfParams'));
    }else{
        $('input:radio[name="isParametrized"][value="No"]').prop('checked', true);
        $('#noOfParams').removeClass("required");
        $('#divParam').hide();
        $('#checkScriptParam').hide();
    }
    $editModal.find('#scriptFileNameHidden').empty().append($this.parents('tr').attr('scriptFileName'));
    return false;
});

$('#scriptListTable tbody').on( 'click', 'button.deleteScript', function(){
    var $this = $(this);
    var $tr = $this.parents('tr.scriptItemRow');
    bootbox.confirm({
        message: 'Are you sure you want to Delete Script Item -&nbsp;' + $this.parents('tr').attr('scriptName') + '&nbsp;&nbsp;of Type-&nbsp;' + $this.parents('tr').attr('scriptType'),
        title: "Warning",
        callback: function(result) {
            if (result) {
                $.ajax({
                    url: '../scripts/' + $this.parents('tr').attr('scriptId'),
                    method: 'DELETE',
                    success: function() {
                        getScriptList();
                    },
                    error: function(jxhr) {
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

function formSave(methodName,url,reqBody) {
    $.ajax({
        method: methodName,
        url: url,
        data: reqBody,
        success: function(data, success) {
            $('#modalForScriptEdit').modal('hide');
            $('#saveItemSpinner').addClass('hidden');
            $('#saveBtnScript').removeAttr('disabled');
            getScriptList();
        },
        error: function(jxhr) {
            removeUploadFile(data.fileId);
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
            removeUploadFile(data.fileId);
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
    return false;
}


//save form for creating a new script item and updation of the script item(name, description etc)..
$('#scriptForm').submit(function(e) {
    var $form = $('#scriptForm');
    var scriptData = {};
    var $this = $(this);
    var isParametrized = false, noOfParams=0;
    if($("input[name='isParametrized']:checked").val() === 'Yes'){
        isParametrized =true;
        noOfParams=parseInt($this.find('#noOfParams').val().trim());
    }
    var name = $this.find('#scriptName').val().trim();
    var description = $this.find('#scriptDescription').val().trim();
    var type = $form.find('#scriptType').val();
    var orgId = $form.find('#orgName').val();
    var scriptEditNew = $(this).find('#scriptEditHiddenInput').val();
    var scriptId = $form.find('#scriptHiddenInputId').val();
    var fileId = $form.find('#fileHiddenInputId').val();
    var orgName = $form.find('#orgName :selected').text();
    var fileNameDisplay = $form.find('#scriptFile').val();
    var availableFileName = $form.find('#fileNameDisplay').text();
    var hiddenFileName = $form.find('#scriptFileNameHidden').text();
    var orgDetails = {
        name: orgName,
        id: orgId
    }
    var url = '';
    var reqBody = {};
    var formData = new FormData();
    formData.append('file', $('input[type=file]')[0].files[0]);
    var methodName ='';
    var isValidator = $('#scriptForm').valid();
    if(isValidator){
        e.preventDefault();
        $.ajax({
        method: "POST",
        url: '../fileUpload?fileId='+fileId,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
            success: function(data, success) {
                if (scriptEditNew === 'new'){
                    url = '../scripts/save/scriptData';
                    methodName = 'POST';
                    reqBody = {
                        "name": name,
                        "type": type,
                        "description": description,
                        "orgDetails": orgDetails,
                        "fileId": data.fileId,
                        "isParametrized":isParametrized,
                        "noOfParams":noOfParams
                    };
                } else {
                    url = '../scripts/update/scriptData';
                    methodName = 'PUT';
                    reqBody = {
                        "scriptId": scriptId,
                        "name": name,
                        "type": type,
                        "description": description,
                        "orgDetails": orgDetails,
                        "fileId": data.fileId,
                        "isParametrized":isParametrized,
                        "noOfParams":noOfParams
                    };    
                }
                formSave(methodName,url,reqBody);      
            }
        });
    return false;
    } else {
    e.preventDefault();
    return false;
    }
});

function removeUploadFile(fileId){
    $.ajax({
        method: "DELETE",
        url: '../fileUpload?fileId=' + fileId,
        success: function (data, success) {
            $('#saveItemSpinner').addClass('hidden');
            $('#saveBtnScript').removeAttr('disabled');
        },
        error: function (jxhr) {
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
        failure: function (jxhr) {
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
