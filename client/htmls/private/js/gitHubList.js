
//initialising the datatable...
if (!$.fn.dataTable.isDataTable('#gitTable')) {
    var $gitDatatable = $('#gitTable').DataTable({
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

//calling the global track functionality when track params are available..
$(document).ready(function(e) {
    getGlobalGitServers();
});

function setFileNameCertificate(val) {
    $('#certificateFileNameDisplay').empty();
    var fileNamePublic = val.substr(val.lastIndexOf("\\") + 1, val.length);
    $("#certificateFileNameDisplay").append(fileNamePublic);
}

function setFileNamePrivate(val) {
    $('#privateFileNameDisplay').empty();
    var fileNamePrivate = val.substr(val.lastIndexOf("\\") + 1, val.length);
    $("#privateFileNameDisplay").append(fileNamePrivate);
}


$("input[name='isAuthenticated']:radio").change(function(){
    if($(this).val() === 'Private') {
        $('.isAunthenticatedSection').removeClass('hidden');
    } else {
        $("#authenticationType").val($("#authenticationType option:first").val());
        $('.isAunthenticatedSection').addClass('hidden');
        $('.showForUser').addClass('hidden');
        $('.showForSSH').addClass('hidden');
        $('.showForToken').addClass('hidden');
    }
});

$('#authenticationType').change(function(e) {
    var val = $(this).val();
    if (val === 'userName') {
        $('.showForUser').removeClass('hidden');
        $('.showForSSH').addClass('hidden');
        $('.showForToken').addClass('hidden');
    } else if(val === 'sshKey') {
        $('.showForUser').addClass('hidden');
        $('.showForSSH').removeClass('hidden');
        $('.showForToken').addClass('hidden');
    } else if(val === 'token') {
        $('.showForUser').addClass('hidden');
        $('.showForSSH').addClass('hidden');
        $('.showForToken').removeClass('hidden');
    } else {
        $('.showForUser').addClass('hidden');
        $('.showForSSH').addClass('hidden');
        $('.showForToken').addClass('hidden');
    }
});

//when the user clicks on the new button the setting the value to 'new' for the hidden field to know that user is creating the new item..
$('.addGitHub').click(function(e) {
    $('#gitHubRepoForn').trigger('reset');
    $('.modal-header').find('.modal-title').html('Create New GitHub Repository');
    $('#gitEditHiddenInput').val('new');
    getOrganizationList();
    $('#orgName,#authenticationType').removeAttr('disabled');
    $('.isAunthenticatedSection').addClass('hidden');
    $('#authenticationType').change();
    $('#gitEditHiddenInputId,#gitHiddenPublicFile,#gitHiddenPrivateFile').val('');
    $('input:radio[name="isAuthenticated"][value="Public"]').removeAttr('disabled');
    $('input:radio[name="isAuthenticated"][value="Private"]').removeAttr('disabled');
    $('#certificateFileNameDisplay').empty();
    $('#privateFileNameDisplay').empty();
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
    })
}

//to show the focus on first input ....
$(document).on('shown.bs.modal', function(e) {
    $('[autofocus]', e.target).focus();
});

//form validation for dashboard save
var validator = $('#gitHubRepoForn').validate({
    ignore: [],
    rules: {
        certificateFile: {
            extension: "pem|txt|sh"
        },
        privateFile: {
            extension: "pem|txt|sh"
        },
        gitName: {
            maxlength: 15
        },
        token: {
            number: true
        }
    },
    messages: {
        certificateFile: {
            extension: "Only .pem/.txt/.sh files"
        },
        privateFile: {
            extension: "Only .pem/.txt/.sh files"
        },
        gitName: {
            maxlength: "Limited to 15 chars"
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
$('a.addGitHub[type="reset"]').on('click', function(e) {
    validator.resetForm();
});

function getGlobalGitServers() {
    $('#gitTable').DataTable( {
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "createdRow": function( row, data ) {
            $( row ).attr({"githubName": data.repositoryName,"githubId" : data._id,"repositoryOwner":data.repositoryOwner,
                "repositoryType":data.repositoryType,"authenticationType":data.authenticationType,"repositoryToken":data.repositoryToken,
                "githubDescription" : data.repositoryDesc, "orgId" : data.orgId ,"orgName" : data.orgName,
                "repositoryUserName" : data.repositoryUserName,"repositoryPassword" : data.repositoryPassword,
                "repositorySSHPublicKeyFileId" : data.repositorySSHPublicKeyFileId,"repositorySSHPrivateKeyFileId":data.repositorySSHPrivateKeyFileId,
                "repositorySSHPublicKeyFileName": data.repositorySSHPublicKeyFileName,"repositorySSHPrivateKeyFileName": data.repositorySSHPrivateKeyFileName
            });
        },
        "ajax": '/git-hub',
        "columns": [
            {"data": "repositoryName", "orderable" : true},
            {"data": "orgName","orderable" : false  },
            {"data": "repositoryOwner" ,"orderable" : false },
            {"data": "repositoryType" ,"orderable" : false},
            {"data": "","orderable" : true,
                "render": function (data) {
                    var $tdAction = '<div class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton syncGitRepo" data-placement="top" value="Sync" title="Sync"><i class="ace-icon fa fa-refresh bigger-120"></i></button></div><div style="margin-left:14px;" class="btn-group"><button class="btn btn-info pull-left btn-sg tableactionbutton editGitRepo" data-placement="top" value="Update" title="Edit"><i class="ace-icon fa fa-pencil bigger-120"></i></button></div>';
                    $tdAction = $tdAction + '<div style="margin-left:14px;" class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deleteGitRepo" data-placement="top" value="Remove" title="Delete"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>';
                    return $tdAction;
                }
            }
        ]
    } );
};

$('#gitTable tbody').on( 'click', 'button.editGitRepo', function(){
    validator.resetForm();
    var $this = $(this);
    var $this = $(this);
    var $editModal = $('#modalForGitEdit');
    $editModal.modal('show');
    $editModal.find('#gitEditHiddenInput').val('edit');
    $editModal.find('h4.modal-title').html('Edit GitHub Repo &nbsp;-&nbsp;&nbsp;' + $this.parents('tr').attr('githubName'));
    $editModal.find('#gitName').val($this.parents('tr').attr('githubName'));
    $editModal.find('#gitDescription').val($this.parents('tr').attr('githubDescription'));
    $editModal.find('#orgName').empty().append('<option value="'+$this.parents('tr').attr("orgId")+'">'+$this.parents('tr').attr("orgName")+'</option>').attr('disabled','disabled');
    $editModal.find('#gitRepoOwner').val($this.parents('tr').attr('repositoryOwner'));
    $editModal.find('#gitEditHiddenInputId').val($this.parents('tr').attr('githubId'));
    var repoType = $this.parents('tr').attr('repositoryType');
    var authType = $this.parents('tr').attr('authenticationType');

    if(repoType === 'Private'){
        $('input:radio[name="isAuthenticated"][value="Public"]').attr('disabled', true);
        $('input:radio[name="isAuthenticated"][value="Private"]').removeAttr('disabled').prop('checked', true);
        $('.isAunthenticatedSection').removeClass('hidden');
        if(authType === 'userName') {
            $editModal.find('#authenticationType').val('userName').change().attr('disabled','disabled');
            $editModal.find('#protocolUser').val($this.parents('tr').attr('repositoryUserName'));
            $editModal.find('#protocolPassword').val($this.parents('tr').attr('repositoryPassword'));
        }else if(authType === 'sshKey'){
            $('#privateFile').val('');
            $('#privateFile').removeClass('required');
            $('#certificateFile').val('');
            $('#certificateFile').removeClass('required');
            $editModal.find('#certificateFileNameDisplay').empty();
            $editModal.find('#privateFileNameDisplay').empty();
            $editModal.find('#authenticationType').val('sshKey').change().attr('disabled','disabled');
            $editModal.find('#gitHiddenPublicFile').val($this.parents('tr').attr('repositorySSHPublicKeyFileId'));
            $editModal.find('#gitHiddenPrivateFile').val($this.parents('tr').attr('repositorySSHPrivateKeyFileId'));
            $editModal.find('#certificateFileNameDisplay').append($this.parents('tr').attr('repositorySSHPublicKeyFileName'));
            $editModal.find('#privateFileNameDisplay').append($this.parents('tr').attr('repositorySSHPrivateKeyFileName'));
        } else {
            $editModal.find('#authenticationType').val('token').change().attr('disabled','disabled');
            $editModal.find('#token').val($this.parents('tr').attr('repositoryToken'));
        }
    }else{
        $('input:radio[name="isAuthenticated"][value="Private"]').attr('disabled', true);
        $('input:radio[name="isAuthenticated"][value="Public"]').removeAttr('disabled').prop('checked', true);
        $('.isAunthenticatedSection').addClass('hidden');
        $("#authenticationType").val($("#authenticationType option:first").val());
        $editModal.find('#protocolUser').val('');
        $editModal.find('#protocolPassword').val('');
        $('.showForUser').addClass('hidden');
        $('.showForSSH').addClass('hidden');
        $('.showForToken').addClass('hidden');
    }

    return false;
});

$('#gitTable tbody').on( 'click', 'button.deleteGitRepo', function(){
    var $this = $(this);
    bootbox.confirm({
        message: 'Are you sure you want to Delete GitHub Repo -&nbsp;' + $this.parents('tr').attr('githubName'),
        title: "Warning",
        callback: function(result) {
            if (result) {
                $.ajax({
                    url: '../git-hub/' + $this.parents('tr').attr('githubId'),
                    method: 'DELETE',
                    success: function() {
                        getGlobalGitServers();
                    },
                    error: function(jxhr) {
                        var msg = "Unable to Delete GitHub Repo please try again later";
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

$('#gitTable tbody').on( 'click', 'button.syncGitRepo', function(){
    $('#gitHubListLoader').show();
    var $this = $(this);
    $.ajax({
        url: '../git-hub/' + $this.parents('tr').attr('githubId') + '/sync',
        method: 'GET',
        success: function() {
            bootbox.alert('Sucessfully cloned');
            $('#gitHubListLoader').hide();
        },
        error: function(jxhr) {
            console.log(jxhr);
            var msg = "Unable to Fetch GitRepo please try again later";
            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                msg = jxhr.responseJSON.message;
            } else if (jxhr.responseText) {
                var msgCheck = JSON.parse(jxhr.responseText);
                msg = msgCheck.msg;
            }
            bootbox.alert(msg);
            $('#gitHubListLoader').hide();
        }
    });
    return false;
});


function saveForm(methodName,url,reqBody) {
    $.ajax({
        method: methodName,
        url: url,
        async:false,
        data: reqBody,
        success: function(data, success) {
            $('#modalForGitEdit').modal('hide');
            $('#saveItemSpinner').addClass('hidden');
            $('#saveBtnTrack').removeAttr('disabled');
            getGlobalGitServers();
            $('#saveBtnTrack').removeAttr('disabled');
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
            $('#saveBtnTrack').removeAttr('disabled');
        }
    });
}

//save form for creating a new gitHub item and updation of the gitHub details.
$('#gitHubRepoForn').submit(function(e) {
    var isValidator = $('#gitHubRepoForn').valid();
    if (!isValidator) {
        e.preventDefault();
        return false;
    } else {
        e.preventDefault();
        $('#saveItemSpinner').removeClass('hidden');
        var $form = $('#gitHubRepoForn');
        $this = $(this);
        var repositoryName, orgValue, description, authenticationType, repositoryOwner, repositoryType,
            passwordName, userName, certChainFileId, privateKeyFileId, certChainFileName, privateKeyFileName, repositoryToken;

        repositoryName = $this.find('.gitName').val().trim();
        orgValue = $this.find('#orgName').val();
        description = $this.find('#gitDescription').val();
        repositoryOwner = $this.find('#gitRepoOwner').val();
        repositoryType= $('input[name=isAuthenticated]:checked').val();
        authenticationType = $this.find('#authenticationType').val();
        userName = $this.find('#protocolUser').val().trim();
        repositoryToken = $this.find('#token').val().trim();
        passwordName = $this.find('#protocolPassword').val().trim();
        certChainFileId = $this.find('#gitHiddenPublicFile').val();
        privateKeyFileId = $this.find('#gitHiddenPrivateFile').val();
        var dashboardEditNew = $this.find('#gitEditHiddenInput').val();
        var gitHubId = $form.find('input#gitEditHiddenInputId').val();
        var url;
        var reqBody = {};
        var methodName;
        //for edit of form.
        var fileCertificate = $('#certificateFile').get(0).files[0];
        var filePrivate = $('#privateFile').get(0).files[0];
        var formData = new FormData();
        formData.append('file', fileCertificate);
        var newFormData = new FormData();
        newFormData.append('file', filePrivate);
        if (dashboardEditNew === 'edit') {
            url = '../git-hub/' + gitHubId;
            methodName = 'PUT';
        } else {
            methodName = 'POST';
            url = '../git-hub';
        }
        if (authenticationType === 'sshKey') {
            if(certChainFileId === '' && privateKeyFileId === ''){
                $.ajax({
                    method: "POST",
                    url: '../fileUpload?fileId=' + certChainFileId,
                    data: formData,
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: function(dataCertificate, success) {
                        $.ajax({
                            method: "POST",
                            url: '../fileUpload?fileId=' + privateKeyFileId,
                            data: newFormData,
                            cache: false,
                            contentType: false,
                            processData: false,
                            success: function(dataPrivate, success) {
                                reqBody = {
                                    "repositoryName": repositoryName,
                                    "orgId": orgValue,
                                    "repositoryDesc": description,
                                    "repositoryOwner": repositoryOwner,
                                    "repositoryType": repositoryType,
                                    "authenticationType": authenticationType,
                                    "repositorySSHPublicKeyFileId": dataCertificate.fileId,
                                    "repositorySSHPrivateKeyFileId": dataPrivate.fileId
                                }
                                saveForm(methodName,url,reqBody);
                            }
                        });
                    }
                });
            } else {
                reqBody = {
                    "_id": gitHubId,
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType,
                    "authenticationType": authenticationType,
                    "repositorySSHPublicKeyFileId": certChainFileId,
                    "repositorySSHPrivateKeyFileId": privateKeyFileId
                }
                saveForm(methodName,url,reqBody);
            }
        } else if (authenticationType === 'userName') {
            if(dashboardEditNew === 'new'){
                reqBody = {
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType,
                    "authenticationType": authenticationType,
                    "repositoryUserName": userName,
                    "repositoryPassword": passwordName
                }
            } else {
                reqBody = {
                    "_id": gitHubId,
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType,
                    "authenticationType": authenticationType,
                    "repositoryUserName": userName,
                    "repositoryPassword": passwordName
                }
            }
            saveForm(methodName,url,reqBody);
        } else if (authenticationType === 'token') {
            if(dashboardEditNew === 'new'){
                reqBody = {
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType,
                    "authenticationType": authenticationType,
                    "repositoryToken": repositoryToken
                }
            } else {
                reqBody = {
                    "_id": gitHubId,
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType,
                    "authenticationType": authenticationType,
                    "repositoryToken": repositoryToken
                }
            }
            saveForm(methodName,url,reqBody);
        } else {
            if(dashboardEditNew === 'new'){
                reqBody = {
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType
                }
            } else {
                reqBody = {
                    "_id": gitHubId,
                    "repositoryName": repositoryName,
                    "orgId": orgValue,
                    "repositoryDesc": description,
                    "repositoryOwner": repositoryOwner,
                    "repositoryType": repositoryType
                }
            }
            saveForm(methodName,url,reqBody);
        }
        return false;
    }
});