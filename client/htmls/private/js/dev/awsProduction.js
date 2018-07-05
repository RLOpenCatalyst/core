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

var checkandupdateRunlistTable = function() {
    if (!$.fn.dataTable.isDataTable('#tableRunlistForBlueprint')) {
        $tasksRunlist = $('#tableRunlistForBlueprint').DataTable({
            "pagingType": "full_numbers",
            "bInfo": false,
            "aaSorting": [
                [0, "desc"]
            ],
            "bLengthChange": false,
            "paging": false,
            "bFilter": false,
            "aoColumns": [{
                "bSortable": false
            }],
            "bSort": false
        });
    }
}
checkandupdateRunlistTable();

//Used for maintaining one copy of the form for edit or new
var $formBPEdit;
var $formBPNew;


$('#saveRunlist').click(function(e) {
    var $ccrs = $('.cookbookShow').data('$ccrs');
    var runlist = $ccrs.getSelectedRunlist();
    if (!runlist.length) {
        $('#attributesViewListTable').find('tbody').empty();
    }
    createRunlistTable($ccrs.getRunlistNames());
    $('#chefRunlistModal').modal('hide');
    return false;
});

function editAtrributesHandler(e) {

    var $ccrs = $('.cookbookShow').data('$ccrs');
    var runlist = $ccrs.getSelectedRunlist();
    if (!runlist.length) {
        toastr.warning('Please choose a runlist first');
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
    var $ccrs = $('.cookbookShow').data('$ccrs');
    var chefServerId = $ccrs.getChefServerId();
    $.post('../chef/servers/' + chefServerId + '/attributes', reqBody, function(attributesList) {
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
}
$('.awsEditAttributesBtn').click(editAtrributesHandler);

$('.saveAttribBtn').click(saveAtrributesHandler);

function updatecompositedockertableemptymessage() {
    if ($('#compositedockertable').find('tr').length <= 1) {
        //no rows found add empty message
        $('#compositedockertable').append('<tr id="dockerimageemptytr"><td colspan="6" align="center">No images added</td></tr>');
    }
    if ($('#compositeDockerImagesTable').find('tr').length <= 1) {
        //no rows found add empty message
        $('#compositeDockerImagesTable').append('<tr id="dockerImageEmptyTr"><td colspan="6" align="center">No images added</td></tr>');
    }
}

$(document).ready(function() {
    $('.containerIdClass').hide();
    $('.containerPortClass').hide();
    $('.hostPortClass').hide();
    $('.dockerUserClass').hide();
    $('.dockerPasswordClass').hide();
    $('.dockerEmailIdClass').hide();
    $('.imageTagClass').hide();
    $('.groupClass').hide();
    $('.repoUrlClass').hide();
    $('.artifactClass').hide();
    $('.versionClass').hide();
    $('#selectOrgName').trigger('change');
    getTreeDetails();
    if (isAngularIntegration) {
        $('#workZoneNew').attr('href', '#');
        $('#workZoneNew').removeClass('active');
        $('#Workspace1').addClass('hidden');
        $('#designNew').addClass('active');
        $('ul#blueprints').removeClass('hidden');
        $("#ribbon ol.breadcrumb").empty();
        var providerselected = $('#blueprints').attr('providerselected');
        providerselected = providerselected.toUpperCase();
        $("#ribbon ol.breadcrumb").append($("<li>Design</li>" + "<li>PROVIDERS</li>" + "<li>" + providerselected + "</li>"));
    }
    var $addal = $("#addanotherlink"); //#ajax/Aws-Production.html?addnew
    if (window.url.indexOf('addnew') > 0) {
        $addal.attr('href', '#ajax/Aws-Production.html?addanother');
    } else {
        $addal.attr('href', '#ajax/Aws-Production.html?addnew');
    }
    if (window.url.indexOf('addnew') > 0 || window.url.indexOf('addanother') > 0) {
        $('#tabheader').trigger('click');
    }


    //form validation for blueprint save
    var validator = $('#wizard-1').validate({
        ignore: [],
        rules: {
            "checkbox-toggle": {
                required: true
            },
            blueprintNameInput: {
                maxlength: 25
            }
        },
        messages: {
            blueprintNameInput: {
                maxlength: "Limited to 25 characters"
            }
        },
        onkeyup: false,
        errorClass: "error",
        //put error message behind each form element
        errorPlacement: function(error, element) {
            var elem = $(element);
            if (element.parent('.input-groups').length) {
                error.insertBefore(element.parent());
            } else {
                if (element.parent('div.inputGroups')) {
                    error.insertBefore('div.inputGroups');
                }
                $("select.select2-me").each(function(index, el) {
                    if ($(this).is("[data-rule-required]") && $(this).attr("data-rule-required") == "true") {
                        $(this).on('select2-close', function(e) {
                            $(this).valid()
                        });
                    }
                });
            }
        },
        //When there is an error normally you just add the class to the element.
        // But in the case of select2s you must add it to a UL to make it visible.
        // The select element, which would otherwise get the class, is hidden from
        // view.
        highlight: function(element, errorClass, validClass) {
            var elem = $(element);
            if (elem.hasClass("select2-offscreen")) {
                $("#s2id_" + elem.attr("id") + " ul").addClass(errorClass);
            } else {
                elem.addClass(errorClass);
            }
        },
        //When removing make the same adjustments as when adding
        unhighlight: function(element, errorClass, validClass) {
            var elem = $(element);
            if (elem.hasClass("select2-offscreen")) {
                $("#s2id_" + elem.attr("id") + " ul").removeClass(errorClass);
            } else {
                elem.removeClass(errorClass);
            }
        }
    });
    $('a#addanotherlink').click(function(e) {
        validator.resetForm();
    });
    $(document).on('change', '.select2-offscreen', function() {
        if (!$.isEmptyObject(validator.submitted)) {
            validator.form();
        }
    });
    $(document).on("select2-opening", function(arg) {
        var elem = $(arg.target);
        if ($("#s2id_" + elem.attr("id") + " ul").hasClass("myErrorClass")) {
            //jquery checks if the class exists before adding.
            $(".select2-drop ul").addClass("myErrorClass");
        } else {
            $(".select2-drop ul").removeClass("myErrorClass");
        }
    });
    //removing Edit and New BP forms from DOM
    //Cloning tab3 into tab5 for Editing
    $formBPNew = $('#tab3').clone();
    $formBPEdit = $('#tab3').clone().append('<input type="hidden" id="blueprintId">');
}); //document.ready gets over here
//the blueprint section gets over here.
$('#launchParamDocker').click(function() {
    $('#dockerparamsform')[0].reset();
    $('.chooseSelectExit').change();
});

function generateDockerLaunchParams() {
    if ($('#Containernamefield').val() == '') {
        $('.dockerparamrequired').removeClass('hidden');
        return ('');
    }
    var launchparams = '';
    $('[dockerparamkey]').each(function() {
        if ($(this).val() != '') {
            var itms = $(this).val().split(',');
            for (itm in itms) launchparams += ' ' + $(this).attr('dockerparamkey') + ' ' + itms[itm];
        }
    });
    $('#' + $('#myModalLabelDockerContainer').attr('saveto')).val(launchparams);
    return (launchparams);
}

function addDockerTemplateToTable(title, repopath, tagname, reponame, optionallaunchparams) {
    var $cdt = $('#compositedockertable');
    var uniqueid = (Math.floor(Math.random() * 9000) + 1000).toString();
    $('#dockerimageemptytr').detach();
    if (!optionallaunchparams) {
        optionallaunchparams = '';
    }
    var $dockertemplaterow = '<tr class="dockerimagesrow"><td >' + $cdt.find('tr').length + '</td><td paramtype="dockercontainerpathstitle">' + title + '</td><td  paramtype="dockercontainerpaths">' + repopath + '</td><td paramtype="dockerrepotags">' + tagname + '</td><td><input type="text" paramtype="dockerlaunchparameters" id="launchparam' + uniqueid + '" class="" value=" ' + optionallaunchparams + '"><input type="hidden" paramtype="dockerreponame" id="dockerreponame' + uniqueid + '" class="" value="' + reponame + '"><a onclick="loadLaunchParams(\'launchparam' + uniqueid + '\');" href="javascript:void(0);"><i class="icon-append fa fa-list-alt fa-lg" title="Launch Parameters"></i></a></td><td ><a class="dockerimageselectorup" id="dockerimageselectorup' + uniqueid + '"  href="javascript:movetablerow(\'dockerimageselectorup\',' + uniqueid + ');"><i class="fa fa-chevron-circle-up fa-lg"></i></a><a class="dockerimageselectordown" id="dockerimageselectordown' + uniqueid + '" href="javascript:movetablerow(\'dockerimageselectordown\',' + uniqueid + ');" style="padding-left:5px;"><i class="fa fa-chevron-circle-down fa-lg"></i></a><button class="btn btn-xs btn-danger pull-right" value="Remove" title="Remove" id="dockerimageremove' + uniqueid + '" onClick="javascript:removeimage(\'dockerimageremove\',' + uniqueid + ');"><i class="ace-icon fa fa-trash-o fa-lg"></i></button></td></tr>';
    $cdt.append($dockertemplaterow);
}

function addDockerImagesToTable(title, repopath, tagname, reponame, optionallaunchparams) {
    var $cdtDockerImages = $('#compositeDockerImagesTable');
    var uniqueid = (Math.floor(Math.random() * 9000) + 1000).toString();
    $('#dockerImageEmptyTr').detach();
    if (!optionallaunchparams) {
        optionallaunchparams = '';
    }
    var $dockertemplaterowImage = '<tr class="dockerImagesRowDesign"><td >' + $cdtDockerImages.find('tr').length + '</td><td paramtype="dockercontainerpathstitle">' + title + '</td><td  paramtype="dockercontainerpaths">' + repopath + '</td><td paramtype="dockerrepotags">' + tagname + '</td><td><input type="text" paramtype="dockerlaunchparameters" id="launchparam' + uniqueid + '" class="" value="' + optionallaunchparams + '"><input type="hidden" paramtype="dockerreponame" id="dockerreponame' + uniqueid + '" class="" value="' + reponame + '"><a onclick="loadLaunchParams(\'launchparam' + uniqueid + '\');" href="javascript:void(0);"><i class="icon-append fa fa-list-alt fa-lg" title="Launch Parameters"></i></a></td><td ><a class="dockerimageselectorup" id="dockerimageselectorup' + uniqueid + '"  href="javascript:movetablerow(\'dockerimageselectorup\',' + uniqueid + ');"><i class="fa fa-chevron-circle-up fa-lg"></i></a><a class="dockerimageselectordown" id="dockerimageselectordown' + uniqueid + '" href="javascript:movetablerow(\'dockerimageselectordown\',' + uniqueid + ');" style="padding-left:5px;"><i class="fa fa-chevron-circle-down fa-lg"></i></a><a class="btn btn-xs btn-danger pull-right" value="Remove" title="Remove" id="dockerImageRemove' + uniqueid + '" onClick="javascript:removeImageFromTable(\'dockerImageRemove\',' + uniqueid + ');"><i class="ace-icon fa fa-trash-o fa-lg"></i></a></td></tr>';
    $cdtDockerImages.append($dockertemplaterowImage);
}

function showdockertemplateadder() {

    $('#dockertemplateselector').val('');
    $('#dockertemplatetagselector').empty().val('');
    //populating template selector with templates
    var templateurl = "/d4dMasters/readmasterjsonnew/17";
    $('#dockertemplateselector').empty().val('');
    $('#dockertemplatetagselector').empty().val('');
    $.get('/d4dMasters/readmasterjsonnew/17', function(data) {
        if (data.length > 0) {
            var rowGridLength = (data.length);
            for (var z = 0; z < rowGridLength; z += 1) {
                var dockercontainerpathstitle = data[z]['dockercontainerpathstitle'];
                var dockercontainerpaths = data[z]['dockercontainerpaths'];
                var dockerreponame = data[z]['dockerreponame'];
                var getTempName = data[z]['templatename']
                if (data[z]["templatetypename"].toLowerCase() === 'docker') {
                    $('#dockertemplateselector').append('<option value="' + dockercontainerpaths + '" title="' + dockercontainerpaths + '" reponame="' + dockerreponame + '">' + getTempName + '</option>'); //dockercontainerpathstitle
                }
            }
        }
        $('#myModalDockerTemplateContainer').modal('show');
    });
}

function addrows() { //only for testing to be removed
    addDockerTemplateToTable('one', 'one/one', "latest");
    addDockerTemplateToTable('two', 'two/two', "latest");
    addDockerTemplateToTable('three', 'three/three', "latest");
}

function imagechanged() {

    $('#btnaddDockerTemplateToTable').attr('disabled', 'disabled');
    $('#dockertemplateSpinner').removeClass('hidden');
    $('#dockertemplatetagselector').empty().val('');
    if ($('#dockertemplateselector option:selected').attr('reponame') == '')
        $('#dockertemplateselector option:selected').attr('reponame', 'null');

    $.get('/d4dmasters/getdockertags/' + encodeURIComponent($('#dockertemplateselector').val().replace(/\//g, "$$$")) + '/' + $('#dockertemplateselector option:selected').attr('reponame'), function(data) {
        $('#dockertemplateSpinner').addClass('hidden');
        if (data) {
            var tagJson = JSON.parse(data);
            var $dockertemplatetagselector = $('#dockertemplatetagselector');
            $dockertemplatetagselector.empty();
            tagJson.forEach(function(k, v) {
                $dockertemplatetagselector.append('<option value="' + tagJson[v].name + '">' + tagJson[v].name + '</option>');
                if (v >= tagJson.length - 1) {
                    $('#btnaddDockerTemplateToTable').removeAttr('disabled');
                }
            });
            $dockertemplatetagselector.change();
        }

    });

}

function removeimage(what, index) {
    bootbox.confirm("Remove docker image?", function(result) {
        if (!result) {
            return;
        }
        var $lnk = $('#' + what + index);
        var row = $lnk.closest('.dockerimagesrow');
        row.detach();
        renumberDockerImageTable();
        //Add empty message when no rows found
        updatecompositedockertableemptymessage();
    });
}

function removeImageFromTable(what, index) {
    bootbox.confirm("Remove docker image?", function(result) {
        if (!result) {
            return;
        }
        var $lnk = $('#' + what + index);
        var row = $lnk.closest('.dockerImagesRowDesign');
        row.detach();
        reNumberDockerImageTable();
        //Add empty message when no rows found
        updatecompositedockertableemptymessage();
    });
}

function renumberDockerImageTable() {
    var $cdt = $('#compositedockertable').find('tr').each(function(i) {
        $(this).find('td').first().html(i);
    });
}

function reNumberDockerImageTable() {
    var $cdt = $('#compositeDockerImagesTable').find('tr').each(function(i) {
        $(this).find('td').first().html(i);
    });
}

function movetablerow(what, index) {
    var $lnk = $('#' + what + index);
    var row = $lnk.closest('.dockerimagesrow');
    if (what === "dockerimageselectorup") {
        var prev = row.prev();
        if (prev.is('tr.dockerimagesrow')) {
            row.detach();
            prev.before(row);
            row.fadeOut();
            row.fadeIn();
        }
    } else {
        var next = row.next();
        if (next.is('tr.dockerimagesrow')) {
            row.detach();
            next.after(row);
            row.fadeOut();
            row.fadeIn();
        }
    }
    renumberDockerImageTable();
}

function loadLaunchParams(lpinput) {
    $('[dockerparamkey]').val('');
    if ($('#' + lpinput).val() != '') {
        //filling in -exec and -c
        var fullparams = $('#' + lpinput).val();
        var execparam = fullparams.split(' -exec');
        var startupparam;
        if (execparam.length > 0 && typeof execparam[1] != "undefined") {
            $('#additionalStartupcommandfield').val(execparam[1]);
            if (execparam[0].indexOf('-c') > 0) //found a startup command
            {
                startupparam = execparam[0].split(' -c');
                if (startupparam.length > 0) {
                    $('#Startupcommandfield').val(startupparam[1]);
                    fullparams = startupparam[0];
                } else {
                    fullparams = startupparam[0];
                }
            } else fullparams = execparam[0];
        } else {
            startupparam = fullparams.split(' -c');
            if (startupparam.length > 0) {
                $('#Startupcommandfield').val(startupparam[1]);
                fullparams = startupparam[0];
            }
        }
        var params = fullparams.split(' -');
        for (para in params) {
            var subparam = params[para].split(' ');
            if (subparam.length > 0) {
                $inp = $('[dockerparamkey="-' + subparam[0] + '"]').first();
                if ($inp.val() != '') $inp.val($inp.val() + ',' + subparam[1]);
                else $inp.val(subparam[1]);
            }
        }
    }
    $('#myModalLabelDockerContainer').attr('saveto', lpinput).css('z-index', '9999').modal('show');
}

function helperConstructOption(data, keyList, nameKey, valueKey) {
    function getOptionAppend(obj, keyList, nameKey, valueKey) {
        var str = '<option ';
        for (var i = 0; i < keyList.length; i++) {
            str = str + keyList[i] + '="' + obj[keyList[i]] + '" ';
        }
        str = str + 'value="' + obj[valueKey] + '" >' + obj[nameKey] + '</option>';
        return str;
    }
    var str = ''
    for (var i = 0; i < data.length; i++) {
        str = str + getOptionAppend(data[i], keyList, nameKey, valueKey);
    }
    return str;
}


function getProviderList(cloudProviderId) {
    $.ajax({
        type: "GET",
        url: "/aws/providers",
        success: function(data) {
            data = typeof data == "string" ? JSON.parse(data) : data;
            var str = ' <option value="">Select Provider</option>',
                len = data.length;
            str = str + helperConstructOption(data, ['secretKey', 'accessKey', 'providerType', 'instanceLimit'], 'providerName', '_id');
            $('#providerId').html(str);
            if (cloudProviderId) {
                $('#providerId').find('option[value="' + cloudProviderId + '"]').attr('selected', 'selected');
                $('#providerId').trigger('change');
            } else {
                if ($('.productdiv2.role-Selected').first().attr('templatetype') == "ami") {
                    var vmimage = JSON.parse($('.productdiv2.role-Selected').first().attr('imagedata'));
                    $('#providerId').val(vmimage.providerId).trigger('change');
                    $('#providerId').attr('disabled', 'disabled');
                }
            }

        },
        failure: function(data) {
            toastr.error(data.toString());
        }
    });
}

function getImagesWithOSFilter(imgId, instanceCount) {
    $('#imageId').attr('disabled', false);

    function getFilteredList(data, value) {
        if (!value) {
            return data;
        }
        var list = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].osName.toLowerCase() === value.toLowerCase()) {
                list.push(data[i]);
            }
        }
        return list;
    }
    var triggered = false;

    function loadData() {
        var providerVal = $('#providerId').val();
        if (providerVal) {

            var $selected = $("#providerId option:selected");
            var instanceLimit = parseInt($selected.attr('instanceLimit')) || 10;
            $('#instanceCount').empty();
            for (var i = 1; i <= instanceLimit; i++) {
                var $option = $('<option></option>').val(i).html(i);
                $('#instanceCount').append($option);
            }
            if (instanceCount) {
                $('#instanceCount').val(instanceCount);
            }




            $.get("/vmimages/providers/" + providerVal, function(data) {
                var str = ' <option value="">Select Image</option>';
                var data = getFilteredList(data, $('#instanceOS').val()),
                    len = data.length;
                str = str + helperConstructOption(data, ['providerId', 'vType', 'osType', '_id'], 'name', 'imageIdentifier');
                $('#imageId').html(str);

                //Setting the imageId to the saved value
                if ($('#imageId').attr('savedval'))
                    helpersetselectvalue($('#imageId'), '_id', $('#imageId').attr('savedval'));
                //setting image value for ami type and disabling it- vn
                if ($('.productdiv2.role-Selected').first().attr('templatetype') == 'ami') {
                    try {
                        var vmimage = JSON.parse($('.productdiv2.role-Selected').first().attr('imagedata'));
                        $('#imageId').val(vmimage.imageIdentifier).attr('disabled', 'disabled');
                        $('#instanceOS').val(vmimage.osName);
                        $('#instanceOS').attr('disabled', 'disabled');
                    } catch (err) {

                    }
                }
                //setting the selection
                if (imgId) {
                    $('#imageId').find('option[value="' + imgId + '"]').attr('selected', 'selected');
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]._id === imgId) {
                            $('#instanceOS').find('option[value="' + data[i].osName + '"]').attr('selected', 'selected');
                            if (!triggered) {
                                $('#instanceOS').trigger('change');
                                triggered = true;
                            }
                            break;
                        }
                    }

                }
                $('#imageId').trigger('change');
            });
        } else {
            $('#imageId').html('<option value="">Select Image</option>').trigger('change');
        }
    }
    $('#providerId').on('change', loadData);
    $('#instanceOS').on('change', loadData);
}

function getSecurityCheckedList() {
    var list = [];
    $('#securityGroupIds').find('input[type="checkbox"]:checked').each(function() {
        list.push(this.value);
    });
    return list;
}

function setSecurityCheckedList(list) {
    //alert(list);
    $.each(list, function(index, val) {
        $('#securityGroupIds').find('input[value="' + val + '"]').removeAttr('checked').trigger('click');
    });
}

function getImageInstances(instanceType) {
    $('#imageId').on('change', function() {
        $.get("/vmimages/instancesizes/all/list", function(data) {
            var vType = $('#imageId').find('option:selected').attr('vType'),
                str = '<option value=""> Select Instance Type</option>';
            var list = [];
            for (var i = 0; i < data.length; i++) {
                for (var key in data[i]) {
                    if (vType == key) {
                        list = data[i][key];
                        break;
                    }
                }
            }
            for (var i = 0; i < list.length; i++) {
                str = str + '<option value="' + list[i] + '">' + list[i] + '</option>'
            }
            $('#instancesize').html(str);
            if (instanceType) {
                $('#instancesize').find('option[value="' + instanceType + '"]').attr('selected', 'selected');
                $('#instancesize').trigger('change');
            }
            //Setting the imageId to the saved value
            if ($('#instancesize').attr('savedval'))
                helpersetselectvalue($('#instancesize'), 'value', $('#instancesize').attr('savedval'));
        });
    });

}
var regionList;

function getCompleteRegionList() {
    $.get('/vmimages/regions/list', function(data) {
        regionList = data;
    });
}
getCompleteRegionList();


function getSecurityGroup(securityGroupsIds) {
    function bringAllOpenFirst(data) {
        var temp, index;
        for (var i = 0; i < data.length; i++) {
            if (data[i].GroupName == "all_open") {
                temp = data[i];
                index = i;
                break;
            }
        }
        if (temp) {
            data[index] = data[0];
            data[0] = temp;
        }
        return data;
    }

    function populateData() {
        var $provider = $('#providerId');
        var accessKey = $provider.find("option:selected").attr('accessKey');
        secretKey = $provider.find("option:selected").attr('secretKey');
        region = $('#region').val();
        vpcId = $('#vpcId').val();
        var providerId = $provider.val();
        var $spinnerSecurityGroup = $('#spinnerSecurityGroup').addClass('hidden');
        if (providerId && region && vpcId) {
            $spinnerSecurityGroup.removeClass('hidden');
            $.ajax({
                url: '/aws/providers/vpc/' + vpcId + '/securitygroups',
                method: "post",
                data: {
                    "providerId": providerId,
                    "region": region
                },
                success: function(list) {
                    var str = '',
                        getTemplate = function(val, name, checked) {
                            return '<label class="toggle font-sm" style="padding-left:4px;"><input onclick="if($(this).is(&quot;:checked&quot;)) {$(this).closest(&quot;label&quot;).' + 'css(&quot;background-color&quot;,&quot;#eeeeee&quot;);$(this).css(&quot;border-color&quot;,&quot;#3b9ff3&quot;);}else{$(this).closest(&quot;label&quot;).css(&quot;background-color&quot;,&quot;#ffffff&quot;);$(this).css(&quot;border-' + 'color&quot;,&quot;red&quot;);}" type="checkbox" id="checkbox-toggle" name="checkbox-toggle" rowid="1ae4f099-7adc-4089-81c6-db2248774142"' + 'value="' + val + '" style="width:100%" ' + checked + '><i data-swchoff-text="NO" data-swchon-text="YES"></i>' + name + '</label>';
                        },
                        list = bringAllOpenFirst(list),
                        len = list.length;
                    for (var i = 0; i < len; i++) {
                        if (securityGroupsIds.indexOf(list[i].GroupId) !== -1) {
                            str = str + getTemplate(list[i].GroupId, list[i].GroupId + ' | ' + list[i].GroupName, 'checked');
                        } else {
                            str = str + getTemplate(list[i].GroupId, list[i].GroupId + ' | ' + list[i].GroupName, '');
                        }

                    }
                    $spinnerSecurityGroup.addClass('hidden');
                    $('#securityGroupIds').html('').append(str);
                    //Setting the securityGroupIds to the saved value
                    if ($('#securityGroupIds').attr('savedval'))
                        setSecurityCheckedList($('#securityGroupIds').attr('savedval').split(','));


                },
                error: function(xhr) {
                    toastr.error(xhr.responseText);
                }
            });
        } else {
            $('#securityGroupIds').html('');
        }
    }
    $('#vpcId').on('change', populateData);
}

function getkeypairList(keyPairId) {
    function getRegionName(regionValue) {
        for (var i = 0; i < regionList.length; i++) {
            if (regionList[i].region.toLowerCase() == regionValue.toLowerCase()) {
                return regionList[i].region_name;
            }
        }
    }
    $('#providerId').on('change', function() {
        var key = $(this).val();
        if (key) {
            $.get('/aws/providers/' + key, function(data) {
                var keylist = data.keyPairs;
                var str = '<option value="">Select KeyPairs</option>';
                for (var i = 0; i < keylist.length; i++) {
                    str = str + '<option value="' + keylist[i]._id + '">' + keylist[i].keyPairName + '</option>';
                }
                $('#keypairId').html(str);
                if (keyPairId) {
                    $('#keypairId').find('option[value="' + keypairId + '"]').attr('selected', 'selected');
                    $('#keypairId').trigger('change');
                }
                //Adding data reader
                if ($('#keypairId').attr('savedval'))
                    helpersetselectvalue($('#keypairId'), 'value', $('#keypairId').attr('savedval'));
                /*bring Region list from providers*/
                var str1 = '<option value="">Select Region</option>';
                for (var i = 0; i < keylist.length; i++) {
                    str1 = str1 + '<option value="' + keylist[i].region + '">' + getRegionName(keylist[i].region) + ' | ' + keylist[i].region + '</option>';
                }
                $('#region').html(str1);
                //Adding data reader

                if ($('#region').attr('savedval')) {

                    helpersetselectvalue($('#region'), 'value', $('#region').attr('savedval'));
                    if ($('.productdiv2.role-Selected').first().attr('templatetype') == "ami") {
                        $('#instanceOS').attr('disabled', 'disabled');
                        $('#providerId').attr('disabled', 'disabled');
                        $('#imageId').attr('disabled', 'disabled');
                    }
                }

            });
        }
    });
}

function getVPC(vpcId) {
    function populateData() {
        var $provider = $('#providerId');
        var providerId = $provider.val();
        var $spinner = $('#vpcSpinner').addClass('hidden');
        var accessKey = $provider.find("option:selected").attr('accessKey'),
            secretKey = $provider.find("option:selected").attr('secretKey'),
            region = $('#region').val();
        if (providerId && region) {
            $spinner.removeClass('hidden');
            $.ajax({
                url: "/aws/providers/describe/vpcs",
                method: "post",
                data: {
                    "providerId": providerId,
                    "region": region
                },
                success: function(data) {
                    var str = '';
                    var filteredData = [];
                    for (var i = 0; i < data.Vpcs.length; i++) {
                        if (data.Vpcs[i].State.toLowerCase() == "available") {
                            filteredData.push(data.Vpcs[i]);
                        }
                    }
                    for (var i = 0; i < filteredData.length; i++) {
                        if (filteredData[i].IsDefault) {
                            str = str + '<option selected value="' + filteredData[i].VpcId + '">' + filteredData[i].VpcId + ' (' + filteredData[i].CidrBlock + ') Default</option>';
                        } else {
                            str = str + '<option value="' + filteredData[i].VpcId + '">' + filteredData[i].VpcId + ' (' + filteredData[i].CidrBlock + ') ' + (filteredData[i].Tags.length ? filteredData[i].Tags[0].Value : "") + '</option>';
                        }
                    }
                    $('#vpcId').html(str)
                    if (vpcId) {
                        $('#vpcId').find('option[value="' + vpcId + '"]').attr('selected', 'selected');
                    }

                    $('#vpcId').trigger('change');
                    $spinner.addClass('hidden');
                },
                error: function(xhr) {
                    toastr.error(xhr.responseText);
                }
            });
        } else {
            $('#vpcId').html('<option value="">Select VPC</option>');
        }
    }
    $('#providerId').on('change', populateData);
    $('#region').on('change', populateData);
}

function getSubnet(subnetId) {
    function populateData() {
        var $provider = $('#providerId');
        var $spinnerSubnet = $('#spinnerSubnet').addClass('hidden');
        var accessKey = $provider.find("option:selected").attr('accessKey'),
            secretKey = $provider.find("option:selected").attr('secretKey'),
            region = $('#region').val(),
            vpcId = $('#vpcId').val();
        var providerId = $provider.val();
        if (providerId && region && vpcId) {
            $spinnerSubnet.removeClass('hidden');
            $.ajax({
                url: "/aws/providers/vpc/" + vpcId + "/subnets",
                method: "post",
                data: {
                    "providerId": providerId,
                    "region": region
                },
                success: function(data) {
                    var str = '<option value="">Select Subnet</option>';
                    var filteredData = [];
                    for (var i = 0; i < data.Subnets.length; i++) {
                        if (data.Subnets[i].State.toLowerCase() == "available") {
                            filteredData.push(data.Subnets[i]);
                        }
                    }
                    for (var i = 0; i < filteredData.length; i++) {
                        str = str + '<option value="' + filteredData[i].SubnetId + '">' + filteredData[i].SubnetId + ' (' + filteredData[i].AvailabilityZone + ') ' + (filteredData[i].Tags.length ? filteredData[i].Tags[0].Value : "") + '</option>';
                    }
                    $spinnerSubnet.addClass('hidden');
                    $('#subnetId').html(str);
                    if (subnetId) {
                        $('#subnetId').find('option[value="' + subnetId + '"]').attr('selected', 'selected');
                        $('#subnetId').trigger('change');
                    }
                    //Adding data reader
                    if ($('#subnetId').attr('savedval'))
                        helpersetselectvalue($('#subnetId'), 'value', $('#subnetId').attr('savedval'));

                },
                error: function(xhr) {
                    toastr.error(xhr.responseText);
                }
            });
        } else {
            $('#subnetId').html('<option value="">Select Subnet</option>');
        }
    }
    $('#vpcId').on('change', populateData);

}

function resetForm() {
    $('[multiselect]').empty();
}


function dataLoader(blueprintData) {
    var cloudProviderId = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderId) {
        cloudProviderId = blueprintData.blueprintConfig.cloudProviderId;
    }
    getProviderList(cloudProviderId);

    var instanceType = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.instanceType) {
        instanceType = blueprintData.blueprintConfig.cloudProviderData.instanceType;
    }
    getImageInstances(instanceType);

    var securityGroupIds = [];
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.securityGroupIds) {
        securityGroupIds = blueprintData.blueprintConfig.cloudProviderData.securityGroupIds;
    }
    getSecurityGroup(securityGroupIds);

    var keyPairId = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.keyPairId) {
        securityGroupIds = blueprintData.blueprintConfig.cloudProviderData.keyPairId;
    }
    getkeypairList(keyPairId);

    var vpcId = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.vpcId) {
        vpcId = blueprintData.blueprintConfig.cloudProviderData.vpcId;
    }
    getVPC(vpcId);

    var subnetId = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.subnetId) {
        subnetId = blueprintData.blueprintConfig.cloudProviderData.subnetId;
    }
    getSubnet(subnetId);

    var imageId = null;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.imageId) {
        imageId = blueprintData.blueprintConfig.cloudProviderData.imageId;
    }
    var instanceCount;
    if (blueprintData && blueprintData.blueprintConfig && blueprintData.blueprintConfig.cloudProviderData && blueprintData.blueprintConfig.cloudProviderData.instanceCount) {
        instanceCount = blueprintData.blueprintConfig.cloudProviderData.instanceCount;
    }
  
    getImagesWithOSFilter(imageId,instanceCount);
    $.get('../aws/ec2/amiids', function(data) {
        var $instanceOS = $('#instanceOS');
        $instanceOS.html('').append('<option value="">Select Operating System</option>')
        for (var i = 0; i < data.length; i++) {
            $option = $('<option data-instanceOS="' + data[i].osType + '" value="' + data[i].os_name + '">' + data[i].os_name + '</option>');
            $option.data('supportedInstanceType', data[i].supportedInstanceType);
            $instanceOS.append($option);
        }
        var $instanceType = $('#intanceTypeControl');
        $instanceOS.change(function(e) {
            $instanceType.empty();
            $selectedOption = $(this).find('option:selected');
            var supportedInstanceType = $selectedOption.data('supportedInstanceType');
            if (typeof supportedInstanceType != 'undefined') {
                for (var i = 0; i < supportedInstanceType.length; i++) {
                    var $option = $('<option></option>').val(supportedInstanceType[i]).html(supportedInstanceType[i]);
                    $instanceType.append($option);
                }
            }
        });
        $instanceOS.trigger('change');
    });
}

$(document).ready(function() {

    $('#selectOrgName').change(function(e) {
        awsLoadData();
    });

    function awsLoadData() {
        var sortbyid = function SortByID(x, y) {
            return x.position - y.position;
        }

        $.get('/d4dMasters/readmasterjsonnew/16', function(data) {
            data = JSON.parse(data);
            var rowLength = data.length;
            var containerTemp = "";
            var selectedrow = false;
            var getDesignTypeImg;
            var getDesignTypeRowID;
            for (var i = 0; i < rowLength; i += 1) {
                switch (data[i]['templatetype']) {
                    case "chef":
                        data[i]['position'] = 0;
                        break;
                    case "ami":
                        data[i]['position'] = 1;
                        break;
                    case "cft":
                        data[i]['position'] = 2;
                        break;
                    case "docker":
                        data[i]['position'] = 3;
                        break;
                    case "composite":
                        data[i]['position'] = 4;
                        break;
                }
            }
            data.sort(sortbyid);

            var selectCheck = $('#selectOrgName').val();
            $('#orgIDCheck').val(selectCheck);
            for (var i = 0; i < rowLength; i += 1) {
                $("#templateContent").empty();
                if (data[i]['templatetype'] && data[i]['templatetype'] == 'arm') continue;
                getDesignTypeImg = data[i]['templatetype'];
                if (selectCheck == data[i].orgname_rowid) {
                    switch (data[i].templatetype) {
                        case "chef":
                            getDesignTypeImg = '/d4dMasters/image/16ae9c94-19f6-485a-8c17-9af7a0f5f23d__designtemplateicon__Appfactory.png';
                            break;
                        case "ami":
                            getDesignTypeImg = '/d4dMasters/image/9d14d362-493e-4d62-b029-a6761610b017__designtemplateicon__DevopsRoles.png';
                            break;
                        case "docker":
                            getDesignTypeImg = '/d4dMasters/image/b02de7dd-6101-4f0e-a95e-68d74cec86c0__designtemplateicon__Docker.png';
                            break;
                        case "cft":
                            getDesignTypeImg = '/d4dMasters/image/4fdda07b-c1bd-4bad-b1f4-aca3a3d7ebd9__designtemplateicon__Cloudformation.png';
                            break;
                        case "composite":
                            getDesignTypeImg = '/d4dMasters/image/ba52a37d-c1e4-47bd-9391-327a95008a61__designtemplateicon__composite.png';
                            break;
                    }
                    getDesignTypeRowID = data[i]['rowid'];
                    if (getDesignTypeImg) {
                        if (getDesignTypeImg.indexOf('/d4dMasters/image') === -1) {
                            // getDesignTypeImg = "/d4dMasters/image/" + getDesignTypeRowID + "__designtemplateicon__" + getDesignTypeImg;
                        }
                        containerTemp += '<div class="" style="width:200px;float:left">' + ' <div id=grid' + i + ' class="blueprintdiv blueprintdiv-aws appfactory" data-' + 'templateType="' + data[i]
                        ['templatetypename'] + '" data-gallerytype="' + data[i]['templatetype'] + '">' + '<div style="">' +
                            '<img  style="height:25px;padding:2px" alt="" src="img/app-store-' + 'icons/Logoheader.png"><span style="padding-top:4px;position:absolute;' +
                            'padding-left: 4px;">' + '<b>' + data[i]['templatetypename'] + '</b>' + '</span></div>' +
                            '<div style="padding-top:10px;padding-left:0px;text-align:center;">' + '<img alt="Template Icon" ' + 'src="' + getDesignTypeImg +
                            '" style="height:60px;width:auto;">' + '</div></div></div>';
                    } else {
                        containerTemp += '<div class="" style="width:200px;float:left">' + ' <div id=grid' + i + ' class="blueprintdiv blueprintdiv-aws appfactory" data-' + 'templateType="' + data[i]
                        ['templatetypename'] + '" data-gallerytype="' + data[i]['templatetype'] + '">' + '<div style="">' +
                            '<img  style="height:25px;padding:2px" alt="" src="img/app-store-' + 'icons/Logoheader.png"><span style="padding-top:4px;position:absolute;' +
                            'padding-left: 4px;">' + '<b>' + data[i]['templatetypename'] + '</b>' + '</span></div>' + '<div style="padding-top:10px;padding-left:27px;">' +
                            '<img style="height:40px;width:auto;" alt="" ' + 'src="img/logo.png">' + '</div></div></div>';
                    }

                }
            }
            $("#templateContent").append(containerTemp);
            $("#templateContent #grid0").addClass("role-Selected");
        });
    }

    awsLoadData();

    $('#templateContent').on("click", '.blueprintdiv', function() {
        $('#templateContent .role-Selected').removeClass('role-Selected');
        $(this).addClass('role-Selected');
    });
    $('#individualTemplateNameGrid').on("click", '.productdiv2', function() {
        if (!$(this).hasClass('role-Selected')) {
            $('#individualTemplateNameGrid').find('.role-Selected').removeClass('role-Selected');
            $(this).addClass('role-Selected');
            resetForm();
        }
    });

});

var reqBody;
var formInitializer = function(editing, blueprintData, callback) {
        var $selectedItem = $('.role-Selected');
        if (!$selectedItem.length && !editing) {
            toastr.error('Please choose a blueprint design');
            return false;
        }
        dataLoader(blueprintData);
        $('#orgnameSelect').val($('#orgIDCheck').val());
        $('#orgnameSelect').attr('disabled', true);
        if ($('.productdiv2.role-Selected').length > 0) {
            //Setting controls connected to docker to hidden
            $('.forDocker').hide();
            $('.notForDocker').show();
            $('.forCFT').hide();
            $('.cookbookShow').parent().show();
            $('.divconfigureparameterrunlist').show();
            $('.divchefrunlist').show();
            if ($('.productdiv2.role-Selected').first().attr('templatetype') == "Docker" || $('.productdiv2.role-Selected').first().attr('templatetype') == "docker") {
                //Auto adding the selected template by default
                var $dockerdiv = $('#tab2').find('.productdiv2.role-Selected').first();
                $('.dockerimagesrow').detach();
                //added now.
                $('.dockerimagesrowDocker').detach();

                if (editing) {
                    var compdock = $('#compositedockertable').attr('savedval');
                    if (compdock) {
                        compdock = JSON.parse(compdock);
                        for (var dci = 0; dci < compdock.length; dci++) {
                            addDockerTemplateToTable(compdock[dci].dockercontainerpathstitle, compdock[dci].dockercontainerpaths, compdock[dci].dockerrepotags, compdock[dci].dockerreponame, compdock[dci].dockerlaunchparameters);
                        }
                    }
                } else
                    addDockerTemplateToTable($dockerdiv.attr('templatename'), $dockerdiv.attr('dockercontainerpaths'), 'latest', $dockerdiv.attr('dockerreponame'), '--name ' + $dockerdiv.attr('templatename'));
                //Checking if docker then only Edit organization paramerters are to be shown
                if (!$('#CollapseEditorgParam').hasClass('in')) {
                    $('a[href="#CollapseEditorgParam"]').click();
                }
                $('div.selectedTemplateArea').first().addClass('hidden').parent().addClass('hidden'); //hiding card view in template
                $('.divconfigureparameterrunlist').hide();
                $('.divchefrunlist').hide();
                //When docker stepping to 4th tab
                $('#orgnameSelect').trigger('change');
                $('.forDocker').show();
                $('.notForDocker').hide();

            } else if ($('.productdiv2.role-Selected').first().attr('templatetype') == "CloudFormation" || $('.productdiv2.role-Selected').first().attr('templatetype') == "cft") {
                $('.notforCFT').hide();
                $('.forCFT').show();
                $('.divconfigureparameterrunlist').hide();
                $('.divchefrunlist').hide();
                if (!$('#CollapseEditorgParam').hasClass('in')) {
                    $('a[href="#CollapseEditorgParam"]').click();
                }
                var $panelBody = $('#CollapseStackParameters').find('.panel-body').empty();;
                var cftTemplateFileName = $('.productdiv2.role-Selected').attr('cftTemplateFileName');
                $panelBody.append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
                $.ajax({
                    type: "GET",
                    url: "/aws/providers",
                    success: function(data) {
                        data = typeof data == "string" ? JSON.parse(data) : data;
                        var providerStr = '<option value="">Select Provider</option>';
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].providerType === 'AWS') {
                                providerStr = providerStr + '<option value="' + data[i]._id + '">' + data[i].providerName + '</option>';
                            }
                        }
                        var $providerInput = $('<select id="cftProviderInput" class="form-control"></select>').append(providerStr);
                        var $providerInputContainer = $('<div class="col-lg-6 col-md-6" style="margin-top: 10px;"><label class="cftParameterLabelContainer" for=""><span class="cftParameterLabel">Choose Provider</span><span class="control-label redSpan">&nbsp;*</span></label><div class="input-groups"></div></div>');
                        $providerInputContainer.find('.input-groups').append($providerInput);
                        $.get('/vmimages/regions/list', function(regionList) {
                            regionList = typeof regionList == "string" ? JSON.parse(regionList) : regionList;
                            var regionOptStr = '<option value="">Select Region</option>';
                            for (var i = 0; i < regionList.length; i++) {
                                regionOptStr = regionOptStr + '<option value="' + regionList[i].region + '">' + regionList[i].region_name + '</option>';
                            }
                            var $regionInput = $('<select id="cftRegionInput" class="form-control"></select>').append(regionOptStr);
                            var $regionInputContainer = $('<div class="col-lg-6 col-md-6" style="margin-top: 10px;"><label class="cftParameterLabelContainer" for=""><span class="cftParameterLabel required">Choose Region</span><span class="control-label redSpan">&nbsp;*</span></label><div class="input-groups"></div></div>');
                            $regionInputContainer.find('.input-groups').append($regionInput);
                            $.get('/d4dMasters/cftTemplate?templateFile=' + cftTemplateFileName, function(data) {
                                var templateData = {};
                                try {
                                    templateData = JSON.parse(data);
                                } catch (err) {
                                    toastr.error("Invalid template file");
                                    return;
                                }
                                var formHtmlDivHtml = '';
                                $panelBody.empty().append($regionInputContainer).append($providerInputContainer).append(formHtmlDivHtml).append('<input type="hidden" id="cftTemplateFileInput" value="' + cftTemplateFileName + '"/>');
                                var parameters = templateData.Parameters;
                                if (parameters) {
                                    var keys = Object.keys(parameters);
                                    for (var i = 0; i < keys.length; i++) {
                                        var parameter = parameters[keys[i]];
                                        var $parameterInput;
                                        if (parameter.AllowedValues) {
                                            $parameterInput = $('<select class="cftParameterInput form-control"></select>');
                                            for (var j = 0; j < parameter.AllowedValues.length; j++) {
                                                var $option = $('<option></option>').val(parameter.AllowedValues[j]).html(parameter.AllowedValues[j]);
                                                $parameterInput.append($option);
                                            }
                                        } else {
                                            $parameterInput = $('<input class="cftParameterInput form-control" type="text" autofocus="autofocus">');
                                        }
                                        if (parameter.Default) {
                                            $parameterInput.val(parameter.Default);
                                        }
                                        $parameterInput.attr('data-cftParameter-type', parameter.type);
                                        $parameterInput.attr('data-cftParameter-name', keys[i]);
                                        var $inputContainer = $('<div class="col-lg-6 col-md-6" style="margin-top: 10px;"><label class="cftParameterLabelContainer" for=""><span class="cftParameterLabel"></span><span class="control-label redSpan">&nbsp;*</span></label><div class="input-groups"></div></div>');
                                        $inputContainer.find('.input-groups').append($parameterInput);
                                        $inputContainer.find('.cftParameterLabel').append(keys[i]);
                                        if (parameter.Description) {
                                            var $desc = $('<span></span>').attr('title', parameter.Description).append('&nbsp;&nbsp;<img src="img/help.png"/>');
                                            $inputContainer.find('.cftParameterLabelContainer').append($desc);
                                        }
                                        $panelBody.append($inputContainer);
                                    }
                                }
                                var resources = templateData.Resources;
                                var resourceKeys = Object.keys(resources);
                                var $panelGroup = $('<div class="panel-group smart-accordion-default col-lg-12 col-md-12" id="cft-resource-editArea" style="margin-top:5px"></div>');
                                var $panel = $('<div class="panel panel-default cft-resource-editPanel"><div class="panel-heading"><h4 class="panel-title"><a class="panel-toggle" data-toggle="collapse" data-parent="#cft-resource-editArea" href="#" class="collapsed"><i class="fa fa-fw fa-plus-circle txt-color-blue"></i> <i class="fa fa-fw fa-minus-circle txt-color-red"></i><span class="heading-text"></span></a></h4></div><div id="CollapseEditorgParam" class="panel-collapse collapse" style="height: auto;"><div class="panel-body" style="padding-left: 8px;"></div></div></div>');
                                var $inputContainerTemplate = $('<div class="col-lg-6 col-md-6" style="margin-top: 10px;"><label class="cftResourceLabelContainer" for=""><span class="cftResourceLabel"></span><span class="control-label redSpan">&nbsp;*</span></label><div class="input-groups"></div></div>');
                                var $resourceInputTemplate = $('<input class="cftResourceInput form-control" type="text" autofocus="autofocus">');
                                var hasResource = false;
                                // for runlist input
                                var $orgListInput = $('#orgnameSelect');
                                $orgListInput.change(function() {
                                    $this = $(this);
                                    if ($this.val() === 'choose') {
                                        return;
                                    }
                                    if (!editing) {
                                        var $ccrs = $chefCookbookRoleSelector($this.val(), function(data) {}, null);
                                        $('.cftResourceRunlistInput').empty().append($ccrs).data('$ccrs', $ccrs);
                                    }
                                });
                                for (var i = 0; i < resourceKeys.length; i++) {
                                    if (resources[resourceKeys[i]].Type === "AWS::EC2::Instance" || resources[resourceKeys[i]].Type === "AWS::AutoScaling::AutoScalingGroup") {
                                        var resourceName = resourceKeys[i];
                                        if (resources[resourceKeys[i]].Type === "AWS::AutoScaling::AutoScalingGroup") {
                                            resourceName = "AutoScaleInstanceResource"
                                        }
                                        var $clone = $panel.clone();
                                        $clone.find('.heading-text').html('Configure Resource : ' + resourceName);
                                        $clone.find('.panel-collapse').attr('id', 'cftResource-' + resourceName);
                                        $clone.find('.panel-toggle').attr('href', '#cftResource-' + resourceName);
                                        // for username
                                        var $inputUsernameContainer = $inputContainerTemplate.clone();
                                        var $inputUsername = $resourceInputTemplate.clone();
                                        $inputUsername.addClass('cftResourceUsernameInput');
                                        $inputUsernameContainer.find('.input-groups').append($inputUsername);
                                        $inputUsernameContainer.find('.cftResourceLabel').html('Instance Username');
                                        //for resourceLogicalId
                                        var $inputLogicalId = $resourceInputTemplate.clone();
                                        $inputLogicalId.addClass('cftResourceLogicalIdInput');
                                        $inputLogicalId.attr('type', 'hidden');
                                        $inputLogicalId.val(resourceName);
                                        // for chefRunlist
                                        var $inputChefRunlistContainer = $('<div class="col-lg-12 col-md-12 cftResourceRunlistInput"></div>');
                                        if ($orgListInput.val().toLowerCase() !== 'choose') {
                                            var $ccrs = $chefCookbookRoleSelector($orgListInput.val(), function(data) {}, []);
                                            $inputChefRunlistContainer.empty().append($ccrs).data('$ccrs', $ccrs);
                                        }
                                        $clone.find('.panel-body').append($inputUsernameContainer);
                                        $clone.find('.panel-body').append($inputLogicalId);
                                        $clone.find('.panel-body').append($inputChefRunlistContainer);
                                        $panelGroup.append($clone);
                                        hasResource = true;
                                    }
                                }
                                if (hasResource) {
                                    $panelBody.append($panelGroup);
                                }

                                if (typeof callback === 'function') {

                                    callback();
                                }

                            });
                        });
                    },
                    failure: function(data) {
                        toastr.error(data.toString());
                    }
                });
            } else {
                //setting the instance count drop down
                $('#instanceCount').val("1");
                if ($('.productdiv2.role-Selected').first().attr('templatetype') != "ami") {
                    $('#instanceOS').removeAttr('disabled');
                    $('#providerId').removeAttr('disabled');
                    $('#orgnameSelect').removeAttr('disabled');
                }
                if (!$('#CollapseConfigureproviderParameter').hasClass('in')) {
                    $('a[href="#CollapseConfigureproviderParameter"]').click();
                }

            }
        }
        var $clone = $selectedItem.clone().removeClass('role-Selected');
        var selectedText = $clone.attr("data-templateType");
        if ($selectedItem.attr('data-templateType') == 'desktopProvisoning') {
            wizard.show(4);
            return false;
        }
        if ($('#tab2 .role-Selected').length > 0) {
            $('#tab3 .selectedTemplateArea').empty().append($('#tab2 .role-Selected').clone());
        }
        //force clicking orgnameSelect
        $('#orgnameSelect').trigger('change');
        $(".chooseBG").change();
        $(".chooseDockerContainer").change();
        var validatorForm = $("#wizard-1").validate();
        validatorForm.resetForm();
    } // end of formInitializer


var saveEditedBlueprint = function() {
    var $form = $('#blueprintEditForm');
    var templatetype = $form.attr('templateType')
    var isValid = $form.valid();
    if (isValid) {
        saveblueprint();
    }
}

function validateApplicationDeployData() {
    var $nexusServer = $('#chooseNexusServer');
    var $chooseRepository = $('#chooseRepository');
    var $chooseArtifacts = $('#chooseArtifacts');
    var $chooseVersions = $('#chooseVersions');
    var appVersion = $chooseVersions.val();
    var nexusUrl = $nexusServer.find('option:selected').attr('data-nexusUrl');
    var nexusServerType = $nexusServer.find('option:selected').attr('data-serverType');
    var nexusRepoUrl = "";
    var repoId = $chooseRepository.find('option:selected').val();
    var nexusRepoId = $nexusServer.find('option:selected').val();
    if ($('.checkConfigApp').prop("checked")) {
        if (nexusServerType === "nexus") {
            var artifactId = $chooseArtifacts.find('option:selected').val();
            if (!artifactId) {
                alert("Please select artifact.");
                return false;
            }
            var versionId = $chooseVersions.find('option:selected').val();
            if (!versionId) {
                alert("Please select version.");
                return false;
            }
            var $chooseGroupId = $('#chooseGroupId');
            var groupId = $chooseGroupId.find('option:selected').val().replace(/\./g, '/');
            var repoURIObj = $("#chooseArtifacts").data();
            var nexusRepoUrl = "";
            if (repoURIObj) {
                for (var i = 0; i < repoURIObj.repoObj.length; i++) {
                    if (artifactId === repoURIObj.repoObj[i].artifactId && versionId === repoURIObj.repoObj[i].version) {
                        nexusRepoUrl = repoURIObj.repoObj[i].resourceURI;
                    }
                }
            }
            return true;

        } else {
            var dockerImage = $chooseRepository.val();
            var containerId = $('#containerIdDiv').val();
            var containerPort = $('#containerPort').val();
            var hostPort = $('#hostPort').val();
            var dockerUser = $('#dockerUser').val();
            var dockerPassword = $('#dockerPassword').val();
            var dockerEmailId = $('#dockerEmailId').val();
            var imageTag = $('#imageTag').find('option:selected').val();
            if (!dockerImage) {
                alert("Please select repository.");
                return false;
            }

            if (!containerPort) {
                alert("Please specify container port.");
                return false;
            }
            if (!hostPort) {
                alert("Please specify host port.");
                return false;
            }
            if (!imageTag) {
                alert("Please specify tag.");
                return false;
            }
            return true;
        }
    } else {
        return true;
    }
}

var saveblueprint = function(tempType) {

    if (validateApplicationDeployData()) {
        bootbox.confirm({
            message: "Are you sure want to submit this Blueprint Data? Press Ok to Continue",
            title: "Confirm",
            callback: function(result) {
                if (result) {
                    var $selectedTemplateArea = $('.selectedTemplateArea');
                    var $selectedItem = $selectedTemplateArea.find('.productdiv2');
                    if (!$selectedItem.length) {
                        alert('please choose a template');
                        return false;
                    }
                    if ($('#orgnameSelect').val() === 'choose') {
                        alert('please choose an Organization');
                        return false;
                    }
                    reqBody = {};
                    if ($('#bpeditcontent').find('input#blueprintId')) {
                        reqBody.blueprintId = $('#bpeditcontent').find('input#blueprintId').val();
                    }

                    reqBody.templateId = $selectedItem.attr('data-templateId');
                    reqBody.templateType = $selectedItem.attr('data-templateType');
                    if (!tempType) //setting when on edit mode
                        tempType = $selectedItem.attr('data-templateType');
                    reqBody.templateComponents = $selectedItem.attr('data-templateComponent').split(',');
                    reqBody.dockercontainerpathstitle = $selectedItem.attr('dockercontainerpathstitle');
                    reqBody.dockercontainerpaths = $selectedItem.attr('dockercontainerpaths');
                    reqBody.dockerlaunchparameters = $('#dockerlaunchparameters').val();
                    reqBody.dockerreponame = $('.productdiv2.role-Selected').attr('dockerreponame');
                    //constructing the docker composite json.
                    var dockercompose = [];
                    var dockerimages = {};
                    var $nexusServer = $('#chooseNexusServer');
                    var $chooseRepository = $('#chooseRepository');
                    var $chooseArtifacts = $('#chooseArtifacts');
                    var $chooseVersions = $('#chooseVersions');
                    var appVersion = $chooseVersions.val();
                    var nexusUrl = $nexusServer.find('option:selected').attr('data-nexusUrl');
                    var nexusServerType = $nexusServer.find('option:selected').attr('data-serverType');
                    var nexusRepoUrl = "";
                    var repoId = $chooseRepository.find('option:selected').val();
                    var nexusRepoId = $nexusServer.find('option:selected').val();
                    var rowId = $nexusServer.find('option:selected').val();
                    if ($('.checkConfigApp').prop("checked")) {
                        if (nexusServerType === "nexus") {
                            var artifactId = $chooseArtifacts.find('option:selected').val();
                            if (!artifactId) {
                                alert("Please select artifact.");
                                return false;
                            }
                            var versionId = $chooseVersions.find('option:selected').val();
                            if (!versionId) {
                                alert("Please select version.");
                                return false;
                            }
                            var $chooseGroupId = $('#chooseGroupId');
                            var groupId = $chooseGroupId.find('option:selected').val().replace(/\./g, '/');
                            var repoURIObj = $("#chooseArtifacts").data();
                            var nexusRepoUrl = "";
                            if (repoURIObj) {
                                for (var i = 0; i < repoURIObj.repoObj.length; i++) {
                                    if (artifactId === repoURIObj.repoObj[i].artifactId && versionId === repoURIObj.repoObj[i].version) {
                                        nexusRepoUrl = repoURIObj.repoObj[i].resourceURI;
                                    }
                                }
                            }
                            var nexus = {
                                "rowId": rowId,
                                "repoId": nexusRepoId,
                                "url": nexusRepoUrl,
                                "version": appVersion,
                                "repoName": repoId,
                                "artifactId": artifactId,
                                "groupId": $chooseGroupId.find('option:selected').val()
                            };
                            reqBody.nexus = nexus;
                        } else {
                            var dockerImage = $chooseRepository.val();
                            var containerId = $('#containerIdDiv').val();
                            var containerPort = $('#containerPort').val();
                            var hostPort = $('#hostPort').val();
                            var dockerUser = $('#dockerUser').val();
                            var dockerPassword = $('#dockerPassword').val();
                            var dockerEmailId = $('#dockerEmailId').val();
                            var imageTag = $('#imageTag').find('option:selected').val();
                            if (!dockerImage) {
                                alert("Please select repository.");
                                return false;
                            }

                            if (!containerPort) {
                                alert("Please specify container port.");
                                return false;
                            }
                            if (!hostPort) {
                                alert("Please specify host port.");
                                return false;
                            }
                            if (!imageTag) {
                                alert("Please specify version.");
                                return false;
                            }



                            var docker = {
                                rowId: rowId,
                                repoId: nexusRepoId,
                                image: dockerImage,
                                containerId: containerId,
                                containerPort: containerPort,
                                hostPort: hostPort,
                                dockerUser: dockerUser,
                                dockerPassword: dockerPassword,
                                dockerEmailId: dockerEmailId,
                                imageTag: imageTag
                            };
                            reqBody.docker = docker;
                        }
                    }
                    $('.dockerimagesrow').each(function() {
                        dockerimages = {};
                        $(this).find('[paramtype]').each(function() {
                            dockerimages[$(this).attr('paramtype')] = $(this).text() + $(this).val();
                        });
                        dockercompose.push(dockerimages);
                    });

                    reqBody.dockercompose = dockercompose;
                    //Get all the runlist
                    var cbs = [];
                    var $ccrs = $('.cookbookShow').data('$ccrs');
                    cbs = $ccrs.getSelectedRunlist();
                    reqBody.runlist = cbs.join(); //$('#cookbookSelect').val();
                    var $ccrs = $('.cookbookShow').data('$ccrs');
                    reqBody.chefServerId = $ccrs.getChefServerId();
                    reqBody.instanceType = $('select.instanceType').val();
                    reqBody.instanceOS = $('#instanceOS').val();
                    reqBody.instanceCount = $('#instanceCount').val();
                    if (!reqBody || reqBody == "undefined") {
                        var reqBody = {};
                    }
                    var $ccrs = $('.cookbookShow').data('$ccrs');
                    var cbs = [];
                    cbs = $ccrs.getSelectedRunlist();
                    reqBody.runlist = cbs;
                    reqBody.chefServerId = $ccrs.getChefServerId();
                    reqBody.instanceType = $('select.instanceType').val();
                    var $instanceOsoptionsSelected = $('#instanceOS').find('option:selected');
                    reqBody.instanceOS = $instanceOsoptionsSelected.attr('data-instanceOS');
                    reqBody.instanceAmiid = $instanceOsoptionsSelected.attr('data-amiid');
                    reqBody.instanceUsername = $instanceOsoptionsSelected.attr('data-amiid-username');
                    reqBody.templateId = $('.productdiv2.role-Selected').attr('data-templateId');
                    reqBody.templateType = $('.productdiv2.role-Selected').attr('data-templateType');
                    reqBody.templateComponents = $('.productdiv2.role-Selected').attr('data-templateComponent').split(',');
                    reqBody.dockercontainerpaths = $('#dockerrepoListInput :selected').attr('repopath'); //$('.productdiv2.role-Selected').attr('dockercontainerpaths');
                    reqBody.dockerrepotags = $('.productdiv2.role-Selected').attr('dockerrepotags');
                    reqBody.dockerimagename = $('#dockerrepoListInput').val();
                    reqBody.dockerlaunchparameters = $('#dockerlaunchparameters').val();
                    reqBody.dockerreponame = $('.productdiv2.role-Selected').attr('dockerreponame');
                    reqBody.iconpath = $('.productdiv2.role-Selected').find('img[src*="__templatesicon__"]').first().attr('src');
                    reqBody.orgId = $('#orgnameSelect').val();
                    reqBody.bgId = $('#bgListInput').val();
                    reqBody.projectId = $('#projectListInput').val();
                    if ($('#serviceDeliveryCheck').prop("checked")) {
                        reqBody.botType = $('#botType').val();
                        reqBody.shortDesc = $('#shortDesc').val();
                        reqBody.serviceDeliveryCheck = true;
                        reqBody.botCategory = $('#botCategory').val();
                    }
                    var imageIdentifier = $('#imageId').val();
                    var imageId = $('#imageId').find('option:selected').attr('_id');
                    var securityGroupIds = getSecurityCheckedList();
                    var providerId = $('#providerId').val();
                    var keyPairId = $('#keypairId').val();
                    var instanceType = $('#instancesize').val();
                    var vpcId = $('#vpcId').val();
                    var subnetId = $('#subnetId').val();
                    var region = $('#region').val();
                    reqBody.keyPairId = keyPairId;
                    reqBody.securityGroupIds = securityGroupIds;
                    reqBody.instanceType = instanceType;
                    reqBody.instanceAmiid = imageIdentifier;
                    reqBody.instanceUsername = 'root';
                    reqBody.vpcId = vpcId;
                    reqBody.subnetId = subnetId;
                    reqBody.imageId = imageId;
                    reqBody.providerId = providerId;
                    reqBody.region = region;
                    reqBody.name = $('#blueprintNameInput').val();
                    reqBody.domainNameCheck = $("input[name='domainNameCheck']:checked").val();
                    //Checking for docker blueprint images
                    if (($('.productdiv2.role-Selected').first().attr('templatetype') == "Docker" || $('.productdiv2.role-Selected').first().attr('templatetype') == "docker") && $('#dockerimageemptytr').length > 0) {
                        //no rows found add empty message
                        alert("Please add atleast one image");
                        return false;
                    }
                    var appUrls = [];
                    var $appUrlTableBody = $('#appUrlTable tbody');
                    var $trs = $appUrlTableBody.find('tr');
                    $trs.each(function(e) {
                        var $this = $(this);
                        if ($this.data('appUrlData')) {
                            appUrls.push($this.data('appUrlData'));
                        }
                    });
                    reqBody.appUrls = appUrls;
                    // for cft templates
                    reqBody.cftProviderId = $('#cftProviderInput').val();
                    if (typeof $('#cftRegionInput').val() != "undefined")
                        reqBody.region = $('#cftRegionInput').val();
                    var cftParameters = [];
                    $('.cftParameterInput').each(function() {
                        var $this = $(this);
                        var parameterObj = {
                            ParameterKey: $this.attr('data-cftParameter-name'),
                            ParameterValue: $this.val(),
                            type: $this.attr('data-cftParameter-type')
                        }
                        cftParameters.push(parameterObj);
                    });
                    reqBody.cftStackParameters = cftParameters;
                    reqBody.cftTemplateFile = $('#cftTemplateFileInput').val();
                    var cftInstances = [];
                    $('.cft-resource-editPanel').each(function() {
                        var $this = $(this);
                        var runlist = [];
                        var $ccrs = $this.find('.cftResourceRunlistInput').data('$ccrs');
                        if ($ccrs) {
                            runlist = $ccrs.getSelectedRunlist();
                        }
                        var instanceObj = {
                            logicalId: $this.find('.cftResourceLogicalIdInput').val(),
                            username: $this.find('.cftResourceUsernameInput').val(),
                            runlist: runlist
                        };
                        cftInstances.push(instanceObj);
                    });
                    reqBody.cftInstances = cftInstances;


                    $trAttribute = $('#attributesViewListTable').find('tbody tr');
                    var attributes = [];
                    $trAttribute.each(function() {
                        var $tr = $(this);
                        attributes.push({
                            name: $tr.attr('data-attributeName'),
                            jsonObj: $tr.data('jsonObj')
                        });
                    });
                    reqBody.attributes = attributes;



                    $('.blueprintMsgContainer').hide();

                    if (($('.productdiv2.role-Selected').data('templatetype')).toLowerCase() != "docker") {
                        reqBody.blueprintType = "instance_launch";
                        if (($('.productdiv2.role-Selected').data('templatetype')).toLowerCase() === 'cloudformation' || ($('.productdiv2.role-Selected').data('templatetype')).toLowerCase() === 'cft') {
                            reqBody.blueprintType = 'aws_cf';
                        }
                        $.post('/organizations/' + reqBody.orgId + '/businessgroups/' + reqBody.bgId + '/projects/' + reqBody.projectId + '/blueprints', {
                            blueprintData: reqBody
                        }, function(data) {
                            //in edit mode refresh the blueprints page
                            if (reqBody.blueprintId) {
                                $('#projectListInputExisting').trigger('change'); //refresh the blueprints page
                                closeblueprintedit(reqBody.blueprintId);
                                return;
                            }

                            var validatorForm = $("#wizard-1").validate();
                            validatorForm.resetForm();
                            $('.blueprintSaveSuccess').show();
                            $('.blueprintNameSuccess').html('Blueprint&nbsp;&nbsp;<a id="blueprintInfo" data-toggle="modal">' + data.name + '</a>&nbsp;&nbsp;Saved Successfully');
                            $('.blueprintNameLaunch').html('Launch Blueprint -&nbsp;&nbsp;' + data.name);
                            $wizard.data('secondClick', true);
                            var wizard = $wizard.data('bootstrapWizard');
                            wizard.next();
                            wizard.disablePreviouBtn();
                            //modal to open the launch popup where user will select the launch button.
                            $('a.blueprintNameLaunch').click(function(e) {
                                var $blueprintLaunch = $('#modalSelectEnvironment');
                                getOrgProjBUComparison(data, $blueprintLaunch);
                                //setting the value of version in the hidden field.
                                $blueprintLaunch.find('#selectedVersion').val(data._id);
                            });
                            eventAdded = false;
                            //launch for type - software stack, os image & cft.
                            $('.launchBlueprintBtn').unbind().click(function(e) {
                                //method defined in index.html to obtain all the blueprint object data.
                                blueprintLaunchDesign(data);
                            });



                            if (tempType === 'softwarestack' || tempType === 'osimage') {
                                $('a#blueprintInfo').attr('href', '#modalForRead').click(function(e) {
                                    var $blueprintReadContainer = $('#modalForRead');
                                    if (tempType === 'softwarestack') {
                                        $('.modal-title').html('Blueprint Information-Software Stack');
                                    }
                                    if (tempType === 'osimage') {
                                        $('.modal-title').html('Blueprint Information-OSImage');
                                    }
                                    //condition for getting the OS,instanceType,version...
                                    $blueprintReadContainer.modal('show');
                                    //for getting the blueprint name
                                    $blueprintReadContainer.find('.modal-body #blueprintNameInputNew').val(data.name);
                                    //for getting the OsName
                                    $blueprintReadContainer.find('.modal-body #instanceOSNew').val(data.blueprintConfig.cloudProviderData.instanceOS);
                                    //for getting the instance Size
                                    $blueprintReadContainer.find('.modal-body #instancesizeNew').val(data.blueprintConfig.cloudProviderData.instanceType);
                                    //for getting the version
                                    $blueprintReadContainer.find('.modal-body #instanceVersion').val(data.blueprintConfig.infraManagerData.latestVersion);
                                    //for getting the SubnetId
                                    $blueprintReadContainer.find('.modal-body #instanceSubnetId').val(data.blueprintConfig.cloudProviderData.subnetId);
                                    //loop for getting the Security Group
                                    $blueprintReadContainer.find('.modal-body #instanceSecurityGroupId').val(data.blueprintConfig.cloudProviderData.securityGroupIds);
                                    $blueprintReadContainer.find('.modal-body #instanceVPC').val(data.blueprintConfig.cloudProviderData.vpcId);
                                    // loop for getting runlist
                                    for (var j = 0; j < data.blueprintConfig.infraManagerData.versionsList.length; j++) {
                                        $blueprintReadContainer.find('.modal-body #instanceRunlist').val(data.blueprintConfig.infraManagerData.versionsList[j].runlist);
                                    }
                                    //for getting the image Name
                                    $.ajax({
                                        type: "GET",
                                        url: "/vmimages/" + data.blueprintConfig.cloudProviderData.imageId,
                                        success: function(data) {
                                            $blueprintReadContainer.find('.modal-body #instanceImage').val(data.name);
                                        }
                                    });
                                    //for getting the Provider name,Type,Region,KeyPair
                                    $.ajax({
                                        type: "GET",
                                        url: "/aws/providers/" + data.blueprintConfig.cloudProviderId,
                                        success: function(data) {
                                            $blueprintReadContainer.find('.modal-body #instanceProviderName').val(data.providerName);
                                            $blueprintReadContainer.find('.modal-body #instanceProviderType').val(data.providerType);
                                            // loop for getting region and Keypair
                                            for (var k = 0; k < data.keyPairs.length; k++) {
                                                $blueprintReadContainer.find('.modal-body #instanceRegion').val(data.keyPairs[k].region);
                                                $blueprintReadContainer.find('.modal-body #instancekeyPair').val(data.keyPairs[k].keyPairName);
                                            }
                                        },
                                        failure: function(data) {
                                            toastr.error(data.toString());
                                        }
                                    });
                                    $blueprintReadContainer.find('.modal-body #blueprintTemplateType').val(data.templateType);
                                    getOrgProjBUComparison(data, $blueprintReadContainer);

                                });
                            } else if (tempType === 'cloudformation') {
                                $('a#blueprintInfo').attr('href', '#modalForReadCFT').click(function(e) {
                                    var $blueprintReadContainerCFT = $('#modalForReadCFT');
                                    $('.modal-title').html('Blueprint Information-CFT');
                                    $blueprintReadContainerCFT.modal('show');
                                    //for getting the blueprint name
                                    $blueprintReadContainerCFT.find('.modal-body #blueprintNameCFT').val(data.name);
                                    $blueprintReadContainerCFT.find('.modal-body #blueprintTemplateTypeCFT').val(data.templateType);
                                    if (!data.version) {
                                        data.version = "1";
                                    }
                                    $blueprintReadContainerCFT.find('.modal-body #instanceVersion').val(data.version);
                                    getOrgProjBUComparison(data, $blueprintReadContainerCFT);
                                });
                            }
                            //for getting the blueprint name
                        }).error(function(xhr) {
                            $('.blueprintSaveFail').find('h3').first().html(xhr.responseText);
                            $('.blueprintSaveFail').show();
                        });
                    } else {
                        reqBody.blueprintType = "docker";
                        $.post('/organizations/' + reqBody.orgId + '/businessgroups/' + reqBody.bgId + '/projects/' + reqBody.projectId + '/blueprints', {
                            blueprintData: reqBody
                        }, function(data) {
                            $('.blueprintNameLaunch').html('Launch Blueprint -&nbsp;&nbsp;' + data.name);
                            $('a.blueprintNameLaunch').click(function(e) {
                                var $blueprintLaunch = $('#modalSelectEnvironment');
                                getOrgProjBUComparison(data, $blueprintLaunch);
                            });
                            $('.launchBlueprintBtn').unbind().click(function(e) {
                                dockerBlueprintLaunch(data);
                            });

                            //in edit mode refresh the blueprints page
                            if (reqBody.blueprintId) {
                                $('#projectListInputExisting').trigger('change'); //refresh the blueprints page
                                closeblueprintedit(reqBody.blueprintId);
                            }

                            var validatorFormDocker = $("#wizard-1").validate();
                            validatorFormDocker.resetForm();
                            $('.blueprintSaveSuccess').show();
                            $('.blueprintNameSuccess').html('Blueprint&nbsp;&nbsp;<b>' + data.name + '</b>&nbsp;&nbsp;Saved Successfully');
                            $wizard.data('secondClick', true);
                            var wizard = $wizard.data('bootstrapWizard');
                            wizard.next();
                            wizard.disablePreviouBtn();
                        }).error(function(xhr) {
                            $('.blueprintSaveFail').find('h3').first().html(xhr.responseText);
                            $('.blueprintSaveFail').show();
                        });
                    }
                }
            }
        }).find('.modal-header').css('background-color', 'ghostwhite');
    }
}


var $wizard = $('#bootstrap-wizard-1').bootstrapWizard({
    'tabClass': 'form-wizard',
    'onNext': function(tab, navigation, index) {
        if (index === 1) {
            $('#viewCreateNew').addClass('hidden');
            $('#selectOrgName').attr('disabled', true);
            var $selectedItem = $('.role-Selected');
            if (!$selectedItem.length) {
                alert('please choose a blueprint design');
                return false;
            }
            var $clone = $selectedItem.clone().removeClass('role-Selected');
            var selectedText = $clone.attr("data-templateType");
            //hiding to move to next tag when docker selected
            $('#individualTemplateNameGrid').hide();
            var getID = parseInt($clone.attr("id").replace("grid", ""), 10);
            var gallerytype = $clone.attr("data-gallerytype");
            var templateurl = "/d4dMasters/readmasterjsonnew/17";
            if (gallerytype == 'ami') {
                templateurl = '/vmimages';
            }
            if (gallerytype === 'composite') {
                $('#compositeSpinner').removeClass('hidden');
                $('#compositeBlueprintID').val('');
                $("#compositeBlueprintDiv").show();
                $("#compositeBlueprintDiv").load("ajax/compositeBlueprint.html");
                $('#nextSpecificValue').hide();
                $('#saveCompBlup').show();
                $('#compositeSpinner').addClass('hidden');
                return true;
            } else {
                $('#saveCompBlup').hide();
                $("#compositeBlueprintDiv").hide();
                $('#nextSpecificValue').show();
            }
            $.ajax({
                url: templateurl,
                dataType: "json",
                type: "GET",
                cache: "true",
                success: function(data) {
                    var rowGridLength = (data.length);
                    var getIndividualData = "";
                    var getTempName;
                    var getRowID, getImage;
                    for (var z = 0; z < rowGridLength; z += 1) {
                        if (gallerytype == 'ami') {
                            getRowID = data[z]['_id'];
                            getTemplateType = data[z]['osType'];
                            getImage = 'img/osIcons/' + getTemplateType + '.png';
                            getTempName = data[z]['name'];
                            getImageData = '\'' + JSON.stringify(data[z]) + '\'';

                            if (!data[z]['providerType'] || data[z]['providerType'] === 'aws') //fix to only display images for aws
                            {
                                getIndividualData += '<div class="col-sm-3 col-lg-2 col-md-3">' + '<div class="productdiv2" data-templateId="' + getTempName + '" data-' + 'templateComponent="component' + z + '" ' + 'imagedata=' + getImageData + 'data-templateName="' + getTempName + '" data-' + 'templateType="' + gallerytype + '" templatetype="' + gallerytype + '" templatename="' + getTempName + '" templatescookbooks="">' + '<ul class="list-unstyled system-prop" style="text-align:center;">' + '<li><img style="height:40px;width:auto;" alt="" ' + 'src="' + getImage + '">' + '</li><li style="font-size:12px;"><u><b>' + getTempName + '</b></u></li></ul></div></div>';
                            }
                            if (z >= rowGridLength - 1) {
                                var wizard = $wizard.data('bootstrapWizard');
                                $('#individualTemplateNameGrid').show();
                            }
                            continue;
                        }
                        //iterate thhrough columns to get correct column and value
                        var selectedrow = false;
                        var currField = null;
                        getTempName = data[z]['templatename'];
                        getRowID = data[z]['rowid'];
                        getImage = data[z]['templatesicon_filename'];
                        getTemplateType = data[z]['templatetypename'];
                        if (selectedText.trim() != getTemplateType.trim()) continue;
                        gettemplatescookbooks = data[z]['templatescookbooks'].replace(/"/g, "");
                        dockercontainerpathstitle = data[z]['dockercontainerpathstitle'];
                        dockercontainerpaths = data[z]['dockercontainerpaths'];
                        dockerreponame = data[z]['dockerreponame'];
                        //To be removed and converted to reference when the new master model is implemented.
                        dockerusername = '';
                        dockercred = '';
                        dockeremail = '';
                        //added to the docker template adder pop-up : Vinod
                        $('#dockertemplateselector').append('<option value="' + dockercontainerpaths + '" title="' + dockercontainerpaths + '" reponame="' + dockerreponame + '">' + getTempName + '</option>'); //dockercontainerpathstitle
                        var templateImgUrl = "img/logo.png";
                        if (getImage) {
                            templateImgUrl = "/d4dMasters/image/" + getRowID + "__templatesicon__" + getImage
                        }
                        var templateFileName = ''
                        if (data[z]['template_filename']) {
                            templateFileName = getRowID + '__template__' + data[z]['template_filename'];
                        }
                        getIndividualData += '<div class="col-sm-3 col-lg-2 col-md-3">' + '<div class="productdiv2" data-templateId="' + getTempName + '" data-' + 'templateComponent="component' + z + '" ' + 'dockercontainerpathstitle="' + dockercontainerpathstitle + '" ' + 'dockercontainerpaths="' + dockercontainerpaths + '" ' + 'dockerreponame="' + dockerreponame + '" ' + 'data-templateName="' + getTempName + '" data-' + 'templateType="' + gallerytype + '" templatetype="' + getTemplateType + '" templatename="' + getTempName + '" templatescookbooks="' + gettemplatescookbooks + '" cftTemplateFileName="' + templateFileName + '">' + '<ul class="list-unstyled system-prop" style="text-align:center;">' + '<li><img style="height:40px;width:auto;" alt="" ' + 'src="' + templateImgUrl + '">' + '</li><li style="font-size:12px;"><u><b>' + getTempName + '</b></u></li>';
                        if (getTemplateType != "Docker" && getTemplateType != "docker") {
                            var cb = $chefCookbookRoleSelector.getRunlistNames(gettemplatescookbooks.split(','));
                            var licb = '';
                            for (var cbi = 0; cbi < cb.length; cbi++) {
                                licb += '<li style="font-size:10px;" blueprinttype="other">' + cb[cbi] + '</li>';
                            }
                            $('#individualTemplateNameGrid').show();
                        } else //when template type is docker
                        {
                            var cb = dockercontainerpathstitle.split(',');
                            var cbpath = dockercontainerpaths.split(',');
                            var licb = '';
                            for (var cbi = 0; cbi < cb.length; cbi++) {
                                licb += '<li style="font-size:10px;" path="' + cbpath[cbi] + '" title="Container" blueprinttype="dockercontainer">' + cb[cbi] + '</li>';
                            }
                            $('#individualTemplateNameGrid').show();
                        }
                        getIndividualData += licb + '</ul></div></div>';
                    }
                    $("#individualTemplateNameGrid").html("");
                    $("#individualTemplateNameGrid").append(getIndividualData).find('.productdiv2').first().click();
                    //Proceeding to next step when selected type is docker
                    if ($('#tab1').find('.role-Selected').attr('data-templatetype') === "Docker" || $('#tab1').find('.role-Selected').attr('data-templatetype') === "docker") {}
                    var wizard = $wizard.data('bootstrapWizard');
                    if ($('#individualTemplateNameGrid').children('div').length) {
                        wizard.enableNextBtn();
                    } else {
                        bootbox.alert({
                            message: "There are no templates available. Navigate to Settings to add a few.",
                            title: "Warning"
                        });
                        wizard.disableNextBtn();
                    }
                }
            });
            $('#tab' + (index + 1)).find('.temp').empty().append($clone);
            $('.' + $selectedItem.attr('data-templateType')).find('.productdiv2:first').trigger('click');
        } else if (index == 2) {
            //If a docker type of template selected then select the Org
            formInitializer();
        } else if (index == 3) {
            if ($wizard.data('secondClick')) {
                return true;
            }
            var isValid = $('#wizard-1').valid();
            var tempType = $('.role-Selected').data('templatetype').toLowerCase();
            if (tempType !== "docker" && tempType !== 'cloudformation' && !isValid) {
                return false;
            } else {
                saveblueprint(tempType);
            }
            return false;
        }
    },
    'onPrevious': function(tab, navigation, index) {
        $('#saveCompBlup').hide();
        $('#nextSpecificValue').show();
        if (index === 0) {
            $('#viewCreateNew').removeClass('hidden');
            $('#selectOrgName').attr('disabled', false);
            var wizard = $wizard.data('bootstrapWizard');
            wizard.enableNextBtn();
        } else if (index === 1) {
            if ($('#tab1').find('.role-Selected').attr('data-templatetype') === "Docker" || $('#tab1').find('.role-Selected').attr('data-templatetype') === "docker") {
                $('#bootstrap-wizard-1').bootstrapWizard('show', 2);
                var validatorForm = $("#wizard-1").validate();
            }
        } else if (index === 2) {} else if (index === 3) {
            var validatorForm = $("#wizard-1").validate();
            validatorForm.resetForm();
        }
    }

});
var $rolesCards = $('.blueprintdiv')
$('.blueprintdiv').on("click", function() {
    $rolesCards.removeClass('role-Selected');
    if ($(this).hasClass('role-Selected')) {
        $(this).removeClass('role-Selected');
    } else {
        $(this).addClass('role-Selected');
    }
});
var $selectedTemplate = $('.productdiv2').click(function(e) {
    $selectedTemplate.removeClass('role-Selected');
    var $this = $(this);
    $('.selectedTemplateArea').empty().append($this.clone(false).css({
        'cursor': 'auto'
    }));
    $this.addClass('role-Selected');
});


var OrgdataLoader = function(editing, blueprintData) {
    $.ajax({
        type: "get",
        dataType: "json",
        async: false,
        url: "../organizations/getTreeForbtv",
        success: function(data) {
            $('#selectOrgName').html('');
            $('#orgnameSelect').html('');
            data = JSON.parse(JSON.stringify(data));
            var $orgListInput = $('#orgnameSelect');
            $bgList = $('#bgListInput');
            var $envList = $('#envList');
            for (var i = 0; i < data.length; i++) {
                $('#selectOrgName').append($('<option></option>').val(data[i].rowid).html(data[i].name));
                $orgListInput.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].nodes).data('project', data[i].nodes[0].nodes).data('envList', data[i].nodes[0].nodes));
            }

            $orgListInput.change(function(e) {
                var orgName = $(this).val();
                if (orgName == 'choose') {
                    return;
                }
                var $selectedOrgOption = $(this).find(":selected");
                $bgList.empty();
                $bgList.append($('<option></option>').val('choose').html('Choose'));
                var getBGs = $selectedOrgOption.data('bglist');
                if (getBGs != null) {
                    for (var i = 0; i < getBGs.length; i++) {
                        $bgList.append($('<option></option>').val(getBGs[i].rowid).html(getBGs[i].name).data('projList', getBGs[i].nodes));
                    }
                    //setting the read values
                    if ($bgList.attr('savedval'))
                        helpersetselectvalue($bgList, 'value', $bgList.attr('savedval'));
                }
                var $cookbookShow = $('.cookbookShow').empty();
                $cookbookShow.append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
                var tcb = [];
                var $card = $('#tab3').find('div[class*="productdiv2"]').first();
                //To check if in edit mode

                if ($card.length) {
                    var templatescookbooks = $card.attr('templatescookbooks');
                    if (templatescookbooks) {
                        tcb = templatescookbooks.split(',');
                    } else { //should be edit mode
                        if ($('#tableRunlistForBlueprint').attr('savedval'))
                            tcb = $('#tableRunlistForBlueprint').attr('savedval').split(',');
                    }
                } else {

                    if ($('#tableRunlistForBlueprint').attr('savedval'))
                        tcb = $('#tableRunlistForBlueprint').attr('savedval').split(',');
                }
                var $ccrs = $chefCookbookRoleSelector(orgName, function(data) {}, tcb);
                $cookbookShow.empty();
                $cookbookShow.append($ccrs);
                var currentRunlistNames = $ccrs.getRunlistNames(tcb);
                $tasksRunlist.clear().draw();
                for (var i = 0; i < currentRunlistNames.length; i++) {
                    var $runlistList = $('#tableRunlistForBlueprint');
                    var $tr = $('<tr class="runlistRow"></tr>');
                    var $tdName = $('<td class="runlistDescription">' + currentRunlistNames[i] + '</td>');
                    $tr.append($tdName);
                    $runlistList.append($tr);
                    $tasksRunlist.row.add($tr).draw();
                }
                $cookbookShow.data('$ccrs', $ccrs)
            });

            $('#selectOrgName').trigger('change');

            var $projectList = $('#projectListInput');
            $bgList.change(function(e) {
                var bgName = $(this).val();
                if (bgName == 'choose') {
                    return;
                }
                var $selectedOrgOption = $(this).find(":selected");
                $projectList.empty();
                $projectList.append($('<option></option>').val('choose').html('Choose'));
                var getProjs = $selectedOrgOption.data('projList');
                for (var i = 0; i < getProjs.length; i++) {
                    $projectList.append($('<option></option>').val(getProjs[i].rowid).html(getProjs[i].name));
                }
                //setting the read values
                if ($projectList.attr('savedval')) {
                    helpersetselectvalue($projectList, 'value', $projectList.attr('savedval'));
                    //locking Org BG and Project during edit
                    $('#orgnameSelect').attr('disabled', 'disabled');
                    $bgList.attr('disabled', 'disabled');
                    $projectList.attr('disabled', 'disabled');
                }
            });
            $('#chooseNexusServer').click(function(e) {
                var projectSelName = $('#projectListInput option:selected').val();
                if (!projectSelName || projectSelName == 'choose') {
                    alert("Please Choose Project Before Proceeding....");
                }
            });
            $projectList.change(function(e) {

                var $nexusServer = $('#chooseNexusServer');
                var $chooseRepository = $('#chooseRepository');
                var $chooseGroupId = $('#chooseGroupId');
                var $chooseArtifacts = $('#chooseArtifacts');
                var $chooseVersions = $('#chooseVersions');
                var projectId = $(this).val();

                if (blueprintData && (blueprintData.nexus || blueprintData.docker)) {
                    $('.checkConfigApp').attr('checked', 'checked');
                }
                if ($('.checkConfigApp').prop("checked")) {
                    if (blueprintData && (blueprintData.nexus || blueprintData.docker)) {
                        getNexusServer(blueprintData.nexus, blueprintData.docker);
                    } else {
                        getNexusServer();
                    }
                } else {
                    $nexusServer.empty();
                    $nexusServer.append('<option value="">Choose Server</option>');
                    resetAllFields();
                }
                $('.checkConfigApp').click(function() {
                    if ($(this).prop("checked")) {
                        if (blueprintData && (blueprintData.nexus || blueprintData.docker)) {
                            getNexusServer(blueprintData.nexus, blueprintData.docker);
                        } else {
                            getNexusServer();
                        }
                    } else {
                        $nexusServer.empty();
                        $nexusServer.append('<option value="">Choose Server</option>');
                        resetAllFields();
                    }
                });

                function resetAllFields() {
                    $chooseRepository.empty();
                    $chooseRepository.append('<option value="">Choose Repositories</option>');
                    $chooseGroupId.empty();
                    $('#chooseGroupId').append('<option value="">Choose Group ID</option>');
                    $chooseArtifacts.empty();
                    $chooseArtifacts.append('<option value="">Choose Artifacts</option>');
                    $chooseVersions.empty();
                    $chooseVersions.append('<option value="">Choose Versions</option>');
                    var $repositoryUrl = $('#repositoryUrl');
                    $repositoryUrl.val("");
                    var $containerId = $('#containerIdDiv');
                    $containerId.val("");
                    var $containerPort = $('#containerPort');
                    $containerPort.val("");
                    var $hostPort = $('#hostPort');
                    $hostPort.val("");
                    var $dockerUser = $('#dockerUser');
                    $dockerUser.val("");
                    var $dockerPassword = $('#dockerPassword');
                    $dockerPassword.val("");
                    var $dockerEmailId = $('#dockerEmailId');
                    $dockerEmailId.val("");
                    var $imageTag = $('#imageTag');
                    $imageTag.val("");
                }

                function resetSpinners() {
                    $('.reposerverspinner').css('display', 'none');
                    $('.repospinner').css('display', 'none');
                    $('.repourlspinner').css('display', 'none');
                    $('.artifactsspinner').css('display', 'none');
                    $('.versionspinner').css('display', 'none');
                    $('.jobdetailsspinner').css('display', 'none');
                }

                function getNexusServer(nexusBPData, dockerBPData) {
                    resetAllFields();
                    $nexusServer.empty();
                    $nexusServer.append('<option value="">Choose Server</option>');
                    var $chooseJobType = $('#chooseJobType');
                    $chooseJobType.empty();
                    $('#chooseJobType').append('<option value="">Choose Job</option>');
                    $('.reposerverspinner').css('display', 'inline-block');
                    $.get('/d4dMasters/readmasterjsonnew/26', function(nexus) {
                        $('.reposerverspinner').css('display', 'none');
                        if (nexus.length) {
                            for (var i = 0; i < nexus.length; i++) {
                                $('#chooseNexusServer').append('<option data-groupId = "' + nexus[i].groupid + '" data-nexusUrl = "' + nexus[i].hostname + '" value=' + nexus[i].rowid + ' data-serverType = "' + nexus[i].configType + '">' + nexus[i].nexusservername + '</option>');
                            }
                        }
                        $.get('/d4dMasters/readmasterjsonnew/18', function(dockerData) {
                            if (dockerData.length) {
                                for (var i = 0; i < dockerData.length; i++) {
                                    $nexusServer.append('<option value=' + dockerData[i].rowid + ' data-serverType = "' + dockerData[i].configType + '">' + dockerData[i].dockerreponame + '</option>');
                                }
                                if (dockerBPData || nexusBPData) {
                                    if (dockerBPData) {
                                        $('#chooseNexusServer').find('option[value="' + dockerBPData.repoId + '"]').attr('selected', 'selected').change();
                                    } else {
                                        $('#chooseNexusServer').find('option[value="' + nexusBPData.repoId + '"]').attr('selected', 'selected').change();
                                    }
                                }
                            }
                        });
                    });
                }
                $nexusServer.change(function(e) {

                    var nexusServerType = $nexusServer.find('option:selected').attr('data-serverType');
                    if ($nexusServer.find('option:selected').text() == 'Choose Server') {
                        $('.groupClass').hide();
                        $('.containerIdClass').hide();
                        $('.containerPortClass').hide();
                        $('.repoUrlClass').hide();
                        $('.artifactClass').hide();
                        $('.versionClass').hide();
                        $('.createTaskLinkUpgrade').attr('disabled', 'disabled');
                        // Reset all values
                        resetAllFields();
                    } else if (nexusServerType == 'nexus') {
                        $('.groupClass').show();
                        $('.repoUrlClass').show();
                        $('.artifactClass').show();
                        $('.versionClass').show();
                        $('.containerIdClass').hide();
                        $('.containerPortClass').hide();
                        $('.hostPortClass').hide();
                        $('.dockerUserClass').hide();
                        $('.dockerPasswordClass').hide();
                        $('.dockerEmailIdClass').hide();
                        $('.imageTagClass').hide();
                        resetAllFields();


                        if (blueprintData && blueprintData.nexus) {
                            getNexusServerRepo($(this).val(), blueprintData.nexus);
                        } else {
                            getNexusServerRepo($(this).val());
                        }

                        if (blueprintData && blueprintData.nexus) {
                            getNexusServerGroupId(blueprintData.nexus);
                        } else {
                            getNexusServerGroupId($(this).val());
                        }
                    } else { // It's Docker
                        resetAllFields();
                        $('.groupClass').hide();
                        $('.repoUrlClass').hide();
                        $('.artifactClass').hide();
                        $('.versionClass').hide();
                        $('.containerIdClass').show();
                        $('.containerPortClass').show();
                        $('.hostPortClass').show();
                        $('.dockerUserClass').show();
                        $('.dockerPasswordClass').show();
                        $('.dockerEmailIdClass').show();
                        $('.imageTagClass').show();
                        if (blueprintData && blueprintData.docker) {
                            getDockerRepoes(blueprintData.docker);
                            if (blueprintData && blueprintData.docker) {

                                var dockerBPData = blueprintData.docker;
                                $('#containerIdDiv').val(dockerBPData.containerId);
                                $('#containerPort').val(dockerBPData.containerPort);
                                $('#hostPort').val(dockerBPData.hostPort);
                                $('#dockerUser').val(dockerBPData.dockerUser);
                                $('#dockerPassword').val(dockerBPData.dockerPassword);
                                $('#dockerEmailId').val(dockerBPData.dockerEmailId);
                            }
                        } else {
                            getDockerRepoes();
                        }
                    }
                });

                function getDockerRepoes(dockerBPData) {
                    $('.repospinner').css('display', 'inline-block');
                    if (projectId) {
                        $.get('/d4dMasters/project/' + projectId, function(anProject) {
                            $('.repospinner').css('display', 'none');
                            if (anProject.length) {
                                anProject = anProject[0];
                                if (anProject.repositories) {
                                    var repositories = anProject.repositories.docker;
                                    if (repositories.length) {
                                        for (var x = 0; x < repositories.length; x++) {
                                            $chooseRepository.append('<option value="' + repositories[x] + '">' + repositories[x] + '</option>');
                                        }
                                        if (dockerBPData) {
                                            $chooseRepository.find('option[value="' + dockerBPData.image + '"]').attr('selected', 'selected').data('dockerBPData', dockerBPData).change();
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        $('.repospinner').css('display', 'none');
                    }
                }

                function getNexusServerRepo(nexusId, nexusBPData) {
                    $('.repospinner').css('display', 'inline-block');
                    if (nexusId) {
                        $.get('/nexus/' + nexusId + '/repositories', function(nexusRepos) {
                            $('.repospinner').css('display', 'none');
                            if (nexusRepos.length) {
                                $.get('/d4dMasters/project/' + projectId, function(anProject) {
                                    if (anProject.length) {
                                        project = anProject[0];
                                        if (project.repositories) {
                                            var repositories = project.repositories.nexus;
                                            if (repositories.length) {
                                                for (var x = 0; x < repositories.length; x++) {
                                                    (function(x) {
                                                        for (var i = 0; i < nexusRepos.length; i++) {
                                                            if (repositories[x] === nexusRepos[i].name) {
                                                                $chooseRepository.append('<option data-repoName="' + nexusRepos[i].name + '" data-repoUrl="' + nexusRepos[i].resourceURI + '" value="' + nexusRepos[i].id + '">' + nexusRepos[i].name + '</option>');
                                                            }
                                                        }
                                                    })(x);
                                                }

                                                if (nexusBPData) {
                                                    $('#chooseRepository').find('option[value="' + nexusBPData.repoName + '"]').attr('selected', 'selected').change();
                                                } else {
                                                    $('#chooseRepository > option:eq(1)').attr('selected', true).change();
                                                }



                                            }
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        $('.repospinner').css('display', 'none');
                    }
                }

                $chooseRepository.change(function(e) {
                    var nexusServerType = $nexusServer.find('option:selected').attr('data-serverType');

                    if (nexusServerType === 'nexus') {
                        $('.containerIdClass').hide();
                        $('.containerPortClass').hide();
                        $('.repoUrlClass').show();
                        $('.artifactClass').show();
                        $('.versionClass').show();
                        var $repositoryUrl = $('#repositoryUrl');
                        $repositoryUrl.val("");
                        $chooseArtifacts.empty();
                        $chooseArtifacts.append('<option value="">Choose Artifacts</option>');

                        $chooseVersions.empty();
                        $chooseVersions.append('<option value="">Choose Versions</option>');
                        $('#repositoryUrl').val($(this).find('option:selected').attr('data-repoUrl'));
                        var repoName = $(this).find('option:selected').attr('data-repoName');
                        var nexusId = $nexusServer.val();
                        var groupId = $('#chooseGroupId').val();
                        var $chooseGroupId = $('#chooseGroupId');

                        if (!repoName) {
                            $chooseGroupId.empty();
                            $('#chooseGroupId').append('<option value="">Choose Group ID</option>');

                            var groupId = $('#chooseNexusServer :selected').attr('data-groupId').split(",");
                            for (var g = 0; g < groupId.length; g++) {
                                $('#chooseGroupId').append('<option value="' + groupId[g] + '">' + groupId[g] + '</option>');
                            }
                        } else {
                            $('#chooseGroupId > option:eq(1)').attr('selected', true).change();
                        }
                    } else {
                        $('.containerIdClass').show();
                        $('.containerPortClass').show();
                        $('.hostPortClass').show();
                        $('.dockerUserClass').show();
                        $('.dockerPasswordClass').show();
                        $('.dockerEmailIdClass').show();
                        $('.imageTagClass').show();
                        $('.groupClass').hide();
                        $('.repoUrlClass').hide();
                        $('.artifactClass').hide();
                        $('.versionClass').hide();
                        var $imageTag = $('#imageTag');
                        $imageTag.empty();
                        $('#imageTag').append('<option value= "">Choose Tag</option>');
                        var dockerBPData = $(this).find('option:selected').data('dockerBPData');
                        getImageTags(dockerBPData);
                    }
                });


                // List all tags w.r.t docker image
                function getImageTags(dockerBPData) {
                    var imageName = $('#chooseRepository').find('option:selected').val();
                    if (imageName) {
                        var repository = "";
                        var image = "";
                        if (imageName.indexOf("/") != -1) {
                            repository = imageName.split("/")[0];
                            image = imageName.split("/")[1];
                        }

                        if (!repository) {
                            repository = "library";
                        }
                        if (!image) {
                            image = imageName;
                        }
                        if (repository && image) {
                            $('.tagspinner').removeClass('hidden');
                            $.get('/d4dMasters/docker/' + repository + '/' + image + '/tags', function(tags) {
                                $('.tagspinner').addClass('hidden');
                                if (tags.length) {
                                    for (var i = 0; i < tags.length; i++) {
                                        $('#imageTag').append('<option value=' + tags[i].name + '>' + tags[i].name + '</option>');

                                    }
                                    if (dockerBPData) {
                                        $('#imageTag').find('option[value="' + dockerBPData.imageTag + '"]').attr('selected', 'selected');
                                    }
                                }
                            });
                        } else {
                            alert("Invalid docker image.");
                            return;
                        }
                    } else {
                        $('.tagspinner').css('display', 'none');
                    }
                }

                function getNexusServerGroupId(nexusBPData) {
                    var groupId = $('#chooseNexusServer :selected').attr('data-groupId').split(",");
                    for (var g = 0; g < groupId.length; g++) {
                        $('#chooseGroupId').append('<option value="' + groupId[g] + '">' + groupId[g] + '</option>');
                    }
                    if (nexusBPData) {
                        $('#chooseGroupId').find('option[value="' + nexusBPData.groupId + '"]').attr('selected', 'selected').change();
                    } else {
                        $('#chooseGroupId > option:eq(1)').attr('selected', true).change();
                    }
                }

                $chooseGroupId.change(function(e) {
                    var repoName = $('#chooseRepository').find('option:selected').attr('data-repoName');
                    var nexusId = $('#chooseNexusServer').val();
                    var groupId = $('#chooseGroupId').val();
                    if (blueprintData && blueprintData.nexus) {
                        getNexusServerRepoArtifact(nexusId, repoName, groupId, blueprintData.nexus);
                    } else {
                        getNexusServerRepoArtifact(nexusId, repoName, groupId);
                    }

                });

                function getNexusServerRepoArtifact(nexusId, repoName, groupId, nexusBPData) {
                    $('.artifactsspinner').css('display', 'inline-block');

                    $chooseArtifacts.empty();
                    $chooseArtifacts.append('<option value="">Choose Artifacts</option>');
                    if (nexusId && repoName) {
                        $.get('/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact', function(artifacts) {
                            $('.artifactsspinner').css('display', 'none');
                            if (artifacts.length) {
                                var repoList = [];
                                var uniqueArtifacts = [];
                                var checker;
                                for (var i = 0; i < artifacts.length; i++) {
                                    var repoObj = {};
                                    repoObj['resourceURI'] = artifacts[i].resourceURI;
                                    repoObj['version'] = artifacts[i].version;
                                    repoObj['artifactId'] = artifacts[i].artifactId;
                                    repoList.push(repoObj);
                                    if (!checker || comparer(checker, artifacts[i]) != 0) {
                                        checker = artifacts[i];
                                        uniqueArtifacts.push(checker);
                                    }
                                }
                                $("#chooseArtifacts").data("repoObj", repoList);
                                for (var j = 0; j < uniqueArtifacts.length; j++) {
                                    $('#chooseArtifacts').append('<option data-groupId="' + uniqueArtifacts[j].groupId + '" value=' + uniqueArtifacts[j].artifactId + '>' + uniqueArtifacts[j].artifactId + '</option>');
                                }
                                if (nexusBPData) {
                                    $('#chooseArtifacts').find('option[value="' + nexusBPData.artifactId + '"]').attr('selected', 'selected').change();
                                } else {
                                    $('#chooseArtifacts > option:eq(1)').attr('selected', true).change();
                                }

                            }
                        });
                    } else {
                        $('.artifactsspinner').css('display', 'none');
                    }
                }

                $chooseArtifacts.change(function(e) {
                    $chooseVersions.empty();
                    $chooseVersions.append('<option value="">Choose Versions</option>');
                    var repoName = $chooseRepository.find('option:selected').attr('data-repoName');
                    var nexusId = $nexusServer.val();
                    var groupId = $(this).find('option:selected').attr('data-groupId');
                    var artifactId = $(this).val();
                    if (blueprintData && blueprintData.nexus) {
                        getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId, blueprintData.nexus);
                    } else {
                        getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId);
                    }

                });
                var comparer = function compareObject(a, b) {
                    if (a.artifactId === b.artifactId) {
                        return 0;
                    } else {
                        return 1;
                    }
                }

                function getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId, nexusBPData) {
                    $('.versionspinner').css('display', 'inline-block');
                    var $chooseVersions = $('#chooseVersions');
                    $chooseVersions.empty();
                    $('#chooseVersions').append('<option value="">Choose Versions</option>');
                    if (nexusId && repoName && groupId && artifactId) {
                        $.get('/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact/' + artifactId + '/versions', function(data) {
                            $('.versionspinner').css('display', 'none');
                            if (data) {
                                var versions = data.metadata.versioning[0].versions[0].version;
                                for (var i = 0; i < versions.length; i++) {
                                    $('#chooseVersions').append('<option value=' + versions[i] + '>' + versions[i] + '</option>');
                                }
                                if (nexusBPData) {
                                    $('#chooseVersions').find('option[value="' + nexusBPData.version + '"]').attr('selected', 'selected').change();
                                } else {
                                    $chooseVersions.find('option:last-child').attr('selected', true).change();
                                }

                            } else {
                                $('.versionspinner').css('display', 'none');
                            }
                        });
                    } else {
                        $('.versionspinner').css('display', 'none');
                    }
                }
            });
        }
    });
}

OrgdataLoader(); //Wrapped for editing


$(document).ready(function() {
    $("#blueprintNameInput").focus();
});

$('#newAppSeries').click(function(e) {
    $('#appURLForm').trigger("reset");
});
$('#addAppBtn').click(function(e) {
    var rowCount1 = $('#appUrlTable').find('tbody > tr').length;
    if (rowCount1 === 2) {
        $('#newAppSeries').addClass('hidden');
        return;
    }
});


function addAppUrlToTable(appName, appUrl) {
    var $row = $('<tr/>');

    $row.data('appUrlData', {
        name: appName,
        url: appUrl
    });
    var $tdName = $('<td/>');
    $tdName.append(appName);
    var $tdURL = $('<td/>');
    $tdURL.append(appUrl);
    var $tdAction = $('<td/>');
    $tdAction.append('<div class="btn-group"><button class="btn btn-danger pull-left btn-sg tableactionbutton deleteURL" value="Remove" title="Remove"><i class="ace-icon fa fa-trash-o bigger-120"></i></button></div>');
    $tdAction.find('.deleteURL').click(function() {
        $row.remove();
        var rowCount2 = $('#appUrlTable').find('tbody > tr').length;
        if (rowCount2 === 1) {
            $('#appEntry').removeClass('hidden');
            return;
        }
        if (rowCount2 < 3) {
            $('#newAppSeries').removeClass('hidden');
            return;
        }
    });
    $row.append($tdName).append($tdURL).append($tdAction);
    $('#appUrlTable').find('tbody').append($row);
    $('#modalAppNameURL').modal('hide');
    $('#appEntry').addClass('hidden');
    return false;
}

$('#appURLForm').submit(function(e) {
    var regexpURL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    var appName = $(this).find('.appName').val();
    var appUrl = $(this).find('.appURL').val();
    if (!(appName)) {
        alert("Please Enter Name");
        return false;
    }
    if (!(appUrl)) {
        alert('Please Enter URL');
        return false;
    }
    if (!regexpURL.test(appUrl)) {
        alert('Please Enter a Valid URL');
        return false;
    }
    addAppUrlToTable(appName, appUrl);
    return false;

});


function cachesavedvalues(blueprintdata) {
    var $content = $('#tab3');
    if (blueprintdata) {
        $content.find('#orgnameSelect').attr('savedval', blueprintdata.orgId);
        $content.find('#blueprintNameInput').attr('savedval', blueprintdata.name);
        $content.find('#bgListInput').attr('savedval', blueprintdata.bgId);
        $content.find('#projectListInput').attr('savedval', blueprintdata.projectId);
        $content.find('#appUrlTable').attr('savedval', JSON.stringify(blueprintdata.appUrls));
        if(blueprintdata.domainNameCheck === true){
            $content.find('input[name="domainNameCheck"][value="false"]').prop('checked',false);
            $content.find('input[name="domainNameCheck"][value="true"]').prop('checked',true);
        }else{
            $content.find('input[name="domainNameCheck"][value="false"]').prop('checked',true);
            $content.find('input[name="domainNameCheck"][value="true"]').prop('checked',false);
        }
        if (blueprintdata.nexus) {
            $content.find('#chooseNexusServer').attr('savedval', blueprintdata.nexus.repoId);
            //$content.find('#chooseRepository').attr('savedval',blueprintdata.nexus.url); //To be checked.
            $content.find('#chooseGroupId').attr('savedval', blueprintdata.nexus.groupId);
            $content.find('#chooseArtifacts').attr('savedval', blueprintdata.nexus.artifactId);
            $content.find('#chooseVersions').attr('savedval', blueprintdata.nexus.version);
            $content.find('#repositoryUrl').attr('savedval', blueprintdata.nexus.url);
        }
        if (blueprintdata.blueprintConfig) {
            $content.find('#compositedockertable').attr('savedval', JSON.stringify(blueprintdata.blueprintConfig.dockerCompose));
            if (blueprintdata.blueprintConfig.cloudProviderData) {
                $content.find('#instanceOS').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.instanceOS);
                $content.find('#imageId').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.imageId);
                $content.find('#vpcId').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.vpcId);
                $content.find('#subnetId').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.subnetId);
                $content.find('#keypairId').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.keyPairId);
                $content.find('#instancesize').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.instanceType);
                $content.find('#securityGroupIds').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.securityGroupIds);
                $content.find('#instanceCount').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.instanceCount);
                $content.find('#region').attr('savedval', blueprintdata.blueprintConfig.cloudProviderData.region);
            }
            if (blueprintdata.blueprintConfig.infraManagerData) {
                if (blueprintdata.blueprintConfig.infraManagerData.versionsList[0]) {
                    $content.find('#tableRunlistForBlueprint').attr('savedval', blueprintdata.blueprintConfig.infraManagerData.versionsList[0].runlist);
                }
            }
            $content.find('#providerId').attr('savedval', blueprintdata.blueprintConfig.cloudProviderId);

        }
    }
}

function helpersetselectvalue($selectctrl, prop, propvalue) {
    $selectctrl.find('option').each(function() {
        if ($(this).attr(prop) == propvalue) {
            $selectctrl.val($(this).attr('value'));
        }
    });
    $selectctrl.trigger('change');
}

function displaySavedBPValues() {
    var $content = $('#bpeditcontent');
    helpersetselectvalue($content.find('#instanceOS'), 'data-instanceos', $content.find('#instanceOS').attr('savedval'));

    //Blueprint Name
    $content.find('#blueprintNameInput').val($content.find('#blueprintNameInput').attr('savedval'));
}
//Initializing the blueprint area according to the Template-Type and showing
//the differnt template types whenever a blueprint is added
function loadblueprintedit(blueprintId, baseblueprintId) {
    $('#myTab3 li').addClass('hidden');
    $('#myTab3 li.blueprintEditbutton').removeClass('hidden');
    $('#myTab3 li.compositeBlueprintHeader').addClass('hidden');
    $('#versionModalContainer').modal('hide');
    $('#tab3').remove();
    //removing selection of template from new screen
    $('#tab2').find('.productdiv2').removeClass('role-Selected');

    $.get('/blueprints/' + blueprintId, function(blueprintdata) {
        if (blueprintdata) {

            $('#myTab3 a[href="#viewEdit"]').tab('show');
            var $newformBPEdit = $formBPEdit.clone();
            var $editForm = $('<form></form>').attr('id', 'blueprintEditForm');
            $editForm.attr('templateType', blueprintdata.templateType);
            $editForm.attr('novalidate', 'novalidate');
            $editForm.append($newformBPEdit);
            $('#bpeditcontent').append($editForm);
            $('#bpeditcontent').find('#tab3 *').unbind();
            cachesavedvalues(blueprintdata);
            $('#bpeditcontent .productdiv2').detach(); //removing existing cardview on edit screen
            $('#bpeditcontent').find('input#blueprintId').val(baseblueprintId); //setting the blueprintid for edit

            var $prod2 = $('<div class="hidden productdiv2 role-Selected"></div>');

            $prod2.attr('dockerreponame', blueprintdata.blueprintConfig.dockerRepoName);
            $prod2.attr('data-templateId', blueprintdata.templateId);
            $prod2.attr('data-templateType', blueprintdata.templateType);
            $prod2.attr('templatetype', blueprintdata.templateType);

            $prod2.attr('data-templateComponent', 'component1'); //to check
            $prod2.attr('dockerrepotags', blueprintdata.blueprintConfig.dockerRepoTags);

            $prod2.attr('cfttemplatefilename', blueprintdata.blueprintConfig.templateFile);

            $('#bpeditcontent .selectedTemplateArea').html('');
            //adding produtdiv2 for saving
            $('#bpeditcontent .selectedTemplateArea').append($prod2);

            if (blueprintdata.blueprintType == 'aws_cf') {

                formInitializer(true, blueprintdata, function() {
                    var $content = $('#tab3');
                    //alert('out' + $content.find('#cftRegionInput').length);
                    $content.find('#cftRegionInput').val(blueprintdata.blueprintConfig.region);
                    $content.find('#cftProviderInput').val(blueprintdata.blueprintConfig.cloudProviderId);
                    if (blueprintdata.blueprintConfig.instances) {
                        for (var insti = 0; insti < blueprintdata.blueprintConfig.instances.length; insti++) {
                            $content.find('#cftResource-' + blueprintdata.blueprintConfig.instances[insti].logicalId + ' .cftResourceUsernameInput').val(blueprintdata.blueprintConfig.instances[insti].username);
                            var $ccrs = $chefCookbookRoleSelector(blueprintdata.orgId, function(data) {}, blueprintdata.blueprintConfig.instances[insti].runlist);
                            $content.find('#cftResource-' + blueprintdata.blueprintConfig.instances[insti].logicalId + ' .cftResourceRunlistInput').empty().append($ccrs).data('$ccrs', $ccrs);
                        }
                    }

                    for (var spi = 0; spi < blueprintdata.blueprintConfig.stackParameters.length; spi++) {
                        $content.find('input[data-cftparameter-name="' + blueprintdata.blueprintConfig.stackParameters[spi].ParameterKey + '"]').val(blueprintdata.blueprintConfig.stackParameters[spi].ParameterValue);
                    }
                });
            } else {
                formInitializer(true, blueprintdata);
            }

            checkandupdateRunlistTable();
            OrgdataLoader(null, blueprintdata); //reloading Org params section
            $('#orgnameSelect').trigger('change');

            //Add a productdiv2 with required elements for form rendering
            var $card = $('#viewCreate .productdiv1[data-blueprintid="' + blueprintId + '"]').clone();
            $card.find('button').detach();
            $card.find('a').detach();
            $card.find('.moreInfo').detach();
            $card.appendTo($('#bpeditcontent .selectedTemplateArea')); //appending selected card view
            $('.selectedTemplateArea .productdiv2').append('<img src="' + $('.selectedTemplateArea').find('img[src*="__templatesicon__"]').first().attr('src') + '">');
            displaySavedBPValues();
            $newformBPEdit.find('.awsEditAttributesBtn').click(editAtrributesHandler);
            $newformBPEdit.find('.saveAttribBtn').click(saveAtrributesHandler);

            if (blueprintdata.blueprintConfig.infraManagerData && blueprintdata.blueprintConfig.infraManagerData.versionsList) {
                var versionsList = blueprintdata.blueprintConfig.infraManagerData.versionsList;
                var verData = versionsList[versionsList.length - 1];
                if (verData && verData.attributes) {
                    createAttribTableRowFromJson(verData.attributes);
                }
            }
            if (blueprintdata && blueprintdata.blueprintConfig && blueprintdata.blueprintConfig.cloudProviderData && blueprintdata.blueprintConfig.cloudProviderData.instanceCount) {
                $newformBPEdit.find('#instanceCount').find('option[value="' + blueprintdata.blueprintConfig.cloudProviderData.instanceCount + '"]').attr('selected', 'selected');
            }

            if (blueprintdata && blueprintdata.appUrls && blueprintdata.appUrls.length) {
                for (var i = 0; i < blueprintdata.appUrls.length; i++) {
                    addAppUrlToTable(blueprintdata.appUrls[i].name, blueprintdata.appUrls[i].url);
                }
            }
            if (blueprintdata && blueprintdata.appUrls && blueprintdata.appUrls.length === 2) {
                $newformBPEdit.find('#newAppSeries').addClass('hidden');
            }

            var validator = $editForm.validate({
                ignore: [],
                rules: {
                    "checkbox-toggle": {
                        required: true
                    },
                    blueprintNameInput: {
                        maxlength: 25
                    }
                },
                messages: {
                    blueprintNameInput: {
                        maxlength: "Limited to 25 characters"
                    }
                },
                onkeyup: false,
                errorClass: "error",
                //put error message behind each form element
                errorPlacement: function(error, element) {
                    var elem = $(element);
                    if (element.parent('.input-groups').length) {
                        error.insertBefore(element.parent());
                    } else {
                        if (element.parent('div.inputGroups')) {
                            error.insertBefore('div.inputGroups');
                        }
                        $("select.select2-me").each(function(index, el) {
                            if ($(this).is("[data-rule-required]") && $(this).attr("data-rule-required") == "true") {
                                $(this).on('select2-close', function(e) {
                                    $(this).valid()
                                });
                            }
                        });
                    }
                },
                //When there is an error normally you just add the class to the element.
                // But in the case of select2s you must add it to a UL to make it visible.
                // The select element, which would otherwise get the class, is hidden from
                // view.
                highlight: function(element, errorClass, validClass) {
                    var elem = $(element);
                    if (elem.hasClass("select2-offscreen")) {
                        $("#s2id_" + elem.attr("id") + " ul").addClass(errorClass);
                    } else {
                        elem.addClass(errorClass);
                    }
                },
                //When removing make the same adjustments as when adding
                unhighlight: function(element, errorClass, validClass) {
                    var elem = $(element);
                    if (elem.hasClass("select2-offscreen")) {
                        $("#s2id_" + elem.attr("id") + " ul").removeClass(errorClass);
                    } else {
                        elem.removeClass(errorClass);
                    }
                }
            });

        } else {

        }
    });
    //To Do
    //Show Save and Cancel button.

}

function loadCompositeBlueprintEdit(compositeBlueprintId) {
    $('#selectOrgName').attr('disabled', true);
    $('#myTab3 li').removeClass('active');
    $('#viewCreate').removeClass('active');
    $('#myTab3 li').addClass('hidden');
    $('#myTab3 li.compositeBlueprintHeader').removeClass('hidden');
    $('#myTab3 li.compositeBlueprintHeader').addClass('active');
    $('#tab1').removeClass('active');
    $('#l2').addClass('active');
    $('#tab2').addClass('active');
    $('#tab2').tab('show');
    $('#compositeSpinner').removeClass('hidden');
    $('#cancelSpecificValue').show();
    $("#compositeBlueprintDiv").show();
    $('#nextSpecificValue').hide();
    $('#previousValue').hide();
    $('#saveCompBlup').show();
    $("#compositeBlueprintDiv").load("ajax/compositeBlueprint.html");
}

//on cancel of update composite blueprint..
function closeCompositeEdit(){
    $('#saveCompBlup').hide();
    $('#cancelSpecificValue').hide();
    $('#myTab3 li').removeClass('hidden');
    $('#l2').removeClass('active');
    $('#myTab3 li.compositeBlueprintHeader').addClass('hidden');
    $('#myTab3 li.blueprintEditbutton').addClass('hidden');
    $('#tab1').addClass('active');
    $('#viewCreate').addClass('active');
    $('#l2 a[href="#tab5"]').addClass('hidden');
    $('#myTab3 a[href="#viewCreate"]').tab('show');
    $('#previousValue').show();
    $('#nextSpecificValue').show();
    $("#compositeBlueprintDiv").hide();
    $('#orgnameSelect').trigger('change');
}

function closeblueprintedit(blueprintId) {
    isEditingBP = false;
    $('#myTab3 li').removeClass('hidden');
    $('#myTab3 li.blueprintEditbutton').addClass('hidden');
     $('#myTab3 li.compositeBlueprintHeader').addClass('hidden');
    $('#myTab3 a[href="#viewCreate"]').tab('show');
    $('#tab3').remove();
    var $newformBPNew = $formBPNew.clone();
    $('#bpeditcontent .productdiv2').detach(); //removing existing cardview on edit screen
    $('#newbpcontainer').append($newformBPNew);
    OrgdataLoader(); //reloading Org params section
    $('#orgnameSelect').trigger('change');
}

function initializeBlueprintAreaNew(data) {
    //Displaying the Template Types.
    $('#accordion-2').empty();
    $.get("/d4dMasters/readmasterjsonnew/16", function(tdata) {
        tdata = JSON.parse(tdata);
        var $containerTempNew = "";
        var selectedrow = false;
        var getDesignTypeImg;
        var getDesignTypeRowID;
        var getDesignTypeName;
        var getDesignType;

        for (var i = 0; i < tdata.length; i++) {
            getDesignTypeImg = tdata[i]['designtemplateicon_filename'];
            getDesignTypeRowID = tdata[i]['rowid'];
            getDesignTypeName = tdata[i]['templatetypename'];
            getDesignType = tdata[i]['templatetype'];
            //Extracting the TT definitions. Add New Template types
            if ($("div." + tdata[i]['templatetype']).length === 0) {
                $containerTempNew = '<div class="panel panel-default blueprintContainer hidden">' + '<div class="panel-heading">' + '<h4 class="panel-title">' + '<a href="#collapse' + i + '" data-parent="#accordion-2" data-toggle="collapse" class="collapsed"> ' + '<i class="fa fa-fw fa-plus-circle txt-color-blue"></i> ' + '<i class="fa fa-fw fa-minus-circle txt-color-red"></i>' + getDesignTypeName + '</a>' + '</h4></div><div class="panel-collapse collapse bpeditas" id="collapse' + i + '">' + '<div class="panel-body ' + getDesignType + '"></div>' + '</div>';
                $('#accordion-2').append($containerTempNew);
            }
        }
        //for other blueprint types..
        for (var i = 0; i < data.length; i++) {
            addBlueprintToDom(data[i]);
        }
    }); //end of readmasterjson to be pushed to the end of the function.
    //Expanding the fist Accordion.
};

function initializeCompositeBP() {
    $('#accordion-3').empty();
    var $containerCompoTemp = "";
    $containerCompoTemp = '<div class="panel panel-default blueprintContainer hidden">' + '<div class="panel-heading">' + '<h4 class="panel-title">' + '<a href="#collapseCompo" data-parent="#accordion-3" data-toggle="collapse" class="collapsed"> ' + '<i class="fa fa-fw fa-plus-circle txt-color-blue"></i> ' + '<i class="fa fa-fw fa-minus-circle txt-color-red"></i>Composite</a>' + '</h4></div><div class="panel-collapse collapse bpeditas" id="collapseCompo">' + '<div class="panel-body composite"></div>' + '</div>';
    $('#accordion-3').append($containerCompoTemp);
    var orgId = $("#orgnameSelectExisting option:selected").val();
    var bgId = $('#bgListInputExisting option:selected').val();
    var projId = $('#projectListInputExisting option:selected').val();
    $.get('../composite-blueprints?filterBy=organizationId:'+orgId+'+businessGroupId:'+bgId+'+projectId:'+projId, function(compositeData) {
        if (compositeData && compositeData.compositeBlueprints) {
            for (var j = 0; j < compositeData.compositeBlueprints.length; j++) {
                addBlueprintToComposite(compositeData.compositeBlueprints[j]);
            }
        }
    });
}

function getOrgProjDetails(id) {
    var orgName = $("#orgnameSelectExisting option:selected").text();

    var bgName = $('#bgListInputExisting option:selected').text();
    var projName = $('#projectListInputExisting option:selected').text();
    var $blueprintReadContainer = $(id);
    $blueprintReadContainer.find('.modal-body #blueprintORG').val(orgName);
    $blueprintReadContainer.find('.modal-body #blueprintBU').val(bgName);
    $blueprintReadContainer.find('.modal-body #blueprintProject').val(projName);
    var $blueprintReadContainerCFT = $(id);
    $blueprintReadContainerCFT.find('.modal-body #blueprintORGCFT').val(orgName);
    $blueprintReadContainerCFT.find('.modal-body #blueprintBUCFT').val(bgName);
    $blueprintReadContainerCFT.find('.modal-body #blueprintProjectCFT').val(projName);
}

//for showing composite blueprints in the blueprints page
function addBlueprintToComposite(data) {
    //Find a panel-body with the template type class
    var $currRolePanelComposite = $('#accordion-3').find('.composite');
    var $itemContainer = $('<div></div>').addClass("productdiv4");
    var $itemBodyComposite = $('<div></div>').addClass('productdiv1 cardimage').attr('data-blueprintId', data.id);
    var $ul = $('<ul></ul>').addClass('list-unstyled system-prop').css({
        'text-align': 'center'
    });
    var $liRead = $('<a style="float:right;margin:5px;cursor:pointer" class="readBtn"><div class="moreInfo moreInfoabsolute"></div></a>').attr('data-toggle', 'tooltip').attr('data-placement', 'top').attr('title', 'More Info');
    $ul.append($liRead);
    $('#bpOrganization').val($("#orgnameSelectExisting option:selected").text());
    $('#bpBusinessGroup').val($('#bgListInputExisting option:selected').text());
    $('#bpProject').val($('#projectListInputExisting option:selected').text());
    //more info click..
    $liRead.click(function(e) {
        $('#accordionCompo').empty();
        var compositeBlueprintId = data.id;
        $.get('/composite-blueprints/' + compositeBlueprintId, function(data) {
            console.log(data);
            $('.compositeBlueprintInfo').removeClass('hidden');
            $('#compositeBP').empty();
            var $compoBlueperintTemp = "";
            for (var i = 0; i < data.blueprints.length; i++) {
                var compBlueprint = data.blueprints[i];
                $('#compositeInfoTable table').attr('id', compBlueprint._id);
                var $tableClone = $('#compositeInfoTable').html();
                $compoBlueperintTemp = '<div class="panel panel-default blueprintContainer">' + '<div class="panel-heading">' + '<h4 class="panel-title">' + '<a href="#collapseComposite' + i + '" data-parent="#accordionCompo" data-toggle="collapse" class="collapsed"> ' + '<i class="fa fa-fw fa-plus-circle txt-color-blue"></i> ' + '<i class="fa fa-fw fa-minus-circle txt-color-red"></i>' + data.blueprints[i].name + '</a>' + '</h4></div><div class="panel-collapse collapse" id="collapseComposite' + i + '">' + '<div class="panel-body ' + data.blueprints[i].name + '" id=' + data.blueprints[i]._id + '>' + $tableClone + '</div>' + '</div>';
                $('#accordionCompo').append($compoBlueperintTemp);
                $('#' + compBlueprint._id + ' .templateType').val(compBlueprint.templateType);
                $('#' + compBlueprint._id + ' .bpVersion').val(compBlueprint.version);
                $('#' + compBlueprint._id + ' .bpOS').val(compBlueprint.blueprintConfig.cloudProviderData.instanceOS);
                $('#' + compBlueprint._id + ' .bpSize').val(compBlueprint.blueprintConfig.cloudProviderData.instanceType);
                $('#' + compBlueprint._id + ' .bpProviderType').val(compBlueprint.blueprintConfig.cloudProviderType);
                $('#' + compBlueprint._id + ' .bpVPC').val(compBlueprint.blueprintConfig.cloudProviderData.vpcId);
                $('#' + compBlueprint._id + ' .bpSubnetId').val(compBlueprint.blueprintConfig.cloudProviderData.subnetId);
                $('#' + compBlueprint._id + ' .bpSecurityGroupId').val(compBlueprint.blueprintConfig.cloudProviderData.securityGroupIds);
                $('#' + compBlueprint._id + ' .bpRunlist').val(compBlueprint.blueprintConfig.infraManagerData.versionsList[0].runlist);
            }

            var $blueprintReadContainer = $('#modalForCompositeInfo');
            $('.modal-title').html('Blueprint Information Composite&nbsp;-' + data.name);
            $blueprintReadContainer.modal('show');
        });
    });

    var $img
    $img = $('<img />').attr('src', 'img/composite.png').attr('alt', data.name).addClass('cardLogo');
    var $liImage = $('<li></li>').append($img);
    $ul.append($liImage);

    var $liCardName = $('<li title="' + data.name + '"></li>').addClass('Cardtextoverflow').html('<u><b>' + data.name + '</b></u>');
    //Versions sections
    var $editButton = $('<button class="btn btn-primary bpvicon" title="Edit"></button>');
    var $launchButton = $('<a href="#modalSelectEnvironment" class="btn btn-primary launchIcon" title="Launch" data-backdrop="false" data-toggle="modal"></a>');
    
    $editButton.append('<i class="fa fa-pencil bpvi"></i>');
    $launchButton.append('<i class="fa fa-location-arrow white"></i>');
    $launchButton.attr('data-blueprintId', data.id);
    $editButton.attr('data-blueprintId', data.id);

    $launchButton.click(function(e) {
        var lastversion = data.id //default version
        var $blueprintLaunch = $('#modalSelectEnvironment');
        $blueprintLaunch.find('#selectedVersion').val(lastversion);
        getOrgProjBUComparison(data, $blueprintLaunch);
        $('.launchBlueprintBtn').unbind().click(function(e) {
            blueprintLaunchComposite(data);
        });
    });

    $editButton.click(function(e) {
        var lastversion = data.id; //default version
        //load the edit screen. Currently loaded from popup
        if (lastversion) {
            loadCompositeBlueprintEdit(lastversion);
            $('#compositeBlueprintID').val(lastversion);
        } else {
            bootbox.alert({
                message: 'Blueprint data error. Could not read.',
                title: 'Warning'
            });
        }
        e.preventDefault();
    });

    $ul.append($liCardName).append($launchButton).append($editButton);
    $itemBodyComposite.append($ul);
    $itemContainer.append($itemBodyComposite);
    $currRolePanelComposite.append($itemContainer);
    //enabling the bluepintContiner div when item added.
    $currRolePanelComposite.closest('.blueprintContainer').removeClass('hidden');
    $currRolePanelComposite.parent().parent().show();

    $itemBodyComposite.click(function(e) {
        if ($(this).hasClass('role-Selected1')) {
            $(this).removeClass('role-Selected1');
        } else {
            $(this).addClass('role-Selected1');
        }
    });
}


var isEditingBP = false;

function addBlueprintToDom(data) {
    //Find a panel-body with the template type class
    var $currRolePanel = $('#accordion-2').find('.' + data.templateType);
    if ($currRolePanel.length > 0) {
        var $itemContainer = $('<div></div>').addClass("productdiv4");
        var $itemBody = $('<div></div>').addClass('productdiv1 cardimage').attr('data-blueprintId', data._id).attr('data-projectId', data.projectId).attr('data-envId', data.envId).attr('data-chefServerId', data.chefServerId).attr('data-templateType', data.templateType);
        var $ul = $('<ul></ul>').addClass('list-unstyled system-prop').css({
            'text-align': 'center'
        });
        var $liRead = $('<a style="float:right;margin:5px;cursor:pointer" class="readBtn"><div class="moreInfo moreInfoabsolute"></div></a>').attr('data-toggle', 'tooltip').attr('data-placement', 'top').attr('title', 'More Info');
        $ul.append($liRead);
        var $img
        if (data.iconpath) {
            if (data.templateType == "Docker" || data.templateType == "docker") {
                $img = $('<img />').attr('src', 'img/galleryIcons/Docker.png').attr('alt', data.name).addClass('cardLogo');
            } else $img = $('<img />').attr('src', data.iconpath).attr('alt', data.name).addClass('cardLogo');
        } else $img = $('<img />').attr('src', 'img/imgo.jpg').attr('alt', data.name).addClass('cardLogo');
        var $liImage = $('<li></li>').append($img);
        $ul.append($liImage);

        var $liCardName = $('<li title="' + data.name + '"></li>').addClass('Cardtextoverflow').html('<u><b>' + data.name + '</b></u>');

        var $selecteditBtnContainer = $('<div style="position:absolute;padding-left:27px;bottom:11px;"></div>');
        var $selectVerEdit = $('<a style="padding:0px 4px;margin-left:3px;border-radius:5px;" class="bpEditBtn"><i class="ace-icon fa fa-pencil"></i></a>').addClass('btn btn-primary').attr('data-toggle', 'tooltip').attr('data-placement', 'top').attr('title', 'Edit');

        //Versions sections
        var $linkVersions = $('<button class="btn btn-primary bpvicon" title="Edit"></button>');
        var $launchButton = $('<a href="#modalSelectEnvironment" class="btn btn-primary launchIcon" title="Launch" data-backdrop="false" data-toggle="modal"></a>');

        var _versions = [];

        if (data.versions)
            _versions = sortResults(data.versions, 'version');
        $linkVersions.append('<i class="fa fa-pencil bpvi"></i>');
        $launchButton.append('<i class="fa fa-location-arrow white"></i>');
        $launchButton.attr('blueprintId', data._id);
        $linkVersions.attr('blueprintId', data._id);
        if (data.versions) {
            $linkVersions.attr('versions', JSON.stringify(_versions));
            $launchButton.attr('versions', JSON.stringify(_versions));
            if (_versions[0].name) {
                $liCardName = $('<li title="' + _versions[0].name + '"></li>').addClass('Cardtextoverflow').html('<u><b>' + _versions[0].name + '</b></u>');
                $itemBody.attr('data-blueprintId', _versions[0].id);
            }

        } else {
            $linkVersions.attr('versions', '[]');
            $launchButton.attr('versions', '[]');
        }

        var $selectVer = $('<select></select>').addClass('blueprintVer');
        var $liVersion = $('<li class="margintop5">Version:&nbsp;</li>').append($selectVer);

        if (data.versions) {

            _versions = sortResults(data.versions, 'version');

            for (var kk = 0; kk < _versions.length; kk++) {
                var $option = $('<option></option>').val(_versions[kk].id).html(_versions[kk].version);
                $selectVer.append($option);
            }
        }
        var $firstVersionOption = $('<option></option>').val(data._id).html("1");
        $selectVer.append($firstVersionOption);


        $ul.append($liCardName).append($liVersion);


        $linkVersions.click(function(e) {
            if (!isEditingBP) {
                isEditingBP = true;
                //Get the lastest version
                var lastversion = $(this).parents('.cardimage').find('.blueprintVer').val(); //default version
                //load the edit screen. Currently loaded from popup. Call that funcction.
                if (lastversion) {
                    loadblueprintedit(lastversion, $(this).attr('blueprintId')); //base version required for UI
                } else {
                    bootbox.alert({
                        message: 'Blueprint data error. Could not read.',
                        title: 'Warning'
                    });
                }
                e.preventDefault();
            }
        });

        $launchButton.click(function(e) {
            var lastversion = $(this).parents('.cardimage').find('.blueprintVer').val(); //default version
            console.log(lastversion);
            var $blueprintLaunch = $('#modalSelectEnvironment');
            $blueprintLaunch.find('#selectedVersion').val(lastversion);
            getOrgProjBUComparison(data, $blueprintLaunch);
            eventAdded = false;
            $('.launchBlueprintBtn').unbind().click(function(e) {
                if (data.templateType === "chef" || data.templateType === "ami" || data.templateType === "cft") {
                    blueprintLaunchDesign(data);
                } else if (data.templateType === "docker") {
                    dockerBlueprintLaunch(data);
                }

            });
        })

        //Versions sections End
        var $selectVer = null;
        var tagLabel = '';
        //Docker Check
        if (data.templateType == "Docker" || data.templateType == "docker") {
            $selectVer = $('<select style="padding:1px;margin-right:5px;"></select>').addClass('dockerrepotagselect').attr('data-blueprintId', data._id);
            $itemBody.attr('dockerreponame', data.dockerreponame);
            $itemBody.attr('dockerrepotags', data.dockerrepotags);
            $itemBody.attr('dockercontainerpaths', data.dockercontainerpaths);
            if (typeof data.blueprintConfig.dockerCompose != 'undefined') {
                data.blueprintConfig.dockerCompose.forEach(function(k, v) {
                    var $liDockerRepoName = $('<li title="Docker Repo Name" class="dockerimagetext" style="text-align:left;margin-left:15px" ><i class="fa fa-check-square" style="padding-right:5px"/>' + data.blueprintConfig.dockerCompose[v]["dockercontainerpathstitle"] + '</li>');
                });
            }
            if (data.dockerrepotags && data.dockerrepotags != '') {
                $selectVer.empty();
                var dockerrepostags = data.dockerrepotags.split(',');
                $.each(dockerrepostags, function(k) {
                    $selectVer.append('<option value="' + dockerrepostags[k] + '">' + dockerrepostags[k] + '</option>');
                });
            }
            $selectVer.hide();
            $selectVerEdit.hide();
            //for software stack and os image

            (function(blueprint) {
                $liRead.click(function(e) {
                    var blueprintId = $(this).parents('.cardimage').find('.blueprintVer').val();
                    $.get('/blueprints/' + blueprintId, function(blueprint) {
                        var $blueprintReadContainerCFT = $('#modalForReadCFT');
                        $('.modal-title').html('Blueprint Information-Docker');
                        $blueprintReadContainerCFT.modal('show');
                        //for getting the blueprint name
                        $blueprintReadContainerCFT.find('.modal-body #blueprintNameCFT').val(blueprint.name);
                        $blueprintReadContainerCFT.find('.modal-body #blueprintTemplateTypeCFT').val(blueprint.templateType);
                        if (!blueprint.version) {
                            blueprint.version = "1";
                        }
                        $blueprintReadContainerCFT.find('.modal-body #instanceVersion').val(blueprint.version);
                        getOrgProjDetails($blueprintReadContainerCFT);
                    });

                });
            })(data);
        } else {

            $selectVer = $('<select style="padding:1px;padding-left:5px;"></select>').addClass('blueprintVersionDropDown').attr('data-blueprintId', data._id);
            if (data.templateType === 'chef' || data.templateType === 'ami') {
                $selectVerEdit.hide();
                $selectVer.hide();
                //code for info about blueprints

                $liRead.click(function(e) {
                    var blueprintId = $(this).parents('.cardimage').find('.blueprintVer').val();
                    $.get('/blueprints/' + blueprintId, function(blueprint) {
                        var $blueprintReadContainer = $('#modalForRead');
                        $blueprintReadContainer.find('.modal-body #blueprintNameInputNew').val(blueprint.name);
                        if (blueprint.templateType === 'chef') {
                            $('.modal-title').html('Blueprint Information-Software Stack');
                        }
                        if (blueprint.templateType === 'ami') {
                            $('.modal-title').html('Blueprint Information-OSImage');
                        }
                        //for getting the image Name
                        $.ajax({
                            type: "GET",
                            url: "/vmimages/" + blueprint.blueprintConfig.cloudProviderData.imageId,
                            success: function(data) {
                                $blueprintReadContainer.find('.modal-body #instanceImage').val(data.name);
                            }
                        });
                        //for getting the Provider name,Type,Region,KeyPair
                        $.ajax({
                            type: "GET",
                            url: "/aws/providers/" + blueprint.blueprintConfig.cloudProviderId,
                            success: function(data) {
                                $blueprintReadContainer.find('.modal-body #instanceProviderName').val(data.providerName);
                                $blueprintReadContainer.find('.modal-body #instanceProviderType').val(data.providerType);
                                // loop for getting region and Keypair
                                for (var k = 0; k < data.keyPairs.length; k++) {
                                    $blueprintReadContainer.find('.modal-body #instanceRegion').val(data.keyPairs[k].region);
                                    $blueprintReadContainer.find('.modal-body #instancekeyPair').val(data.keyPairs[k].keyPairName);
                                }
                            },
                            failure: function(data) {
                                toastr.error(data.toString());
                            }
                        });
                        var $parent = $(this).parents('.cardimage');
                        var version = $parent.find('.blueprintVersionDropDown').val();
                        $blueprintReadContainer.modal('show');
                        //for getting the blueprint name
                        //for getting the OsName
                        $blueprintReadContainer.find('.modal-body #instanceOSNew').val(blueprint.blueprintConfig.cloudProviderData.instanceOS);
                        //for getting the instance Size
                        $blueprintReadContainer.find('.modal-body #instancesizeNew').val(blueprint.blueprintConfig.cloudProviderData.instanceType);
                        //for getting the SubnetId
                        $blueprintReadContainer.find('.modal-body #instanceSubnetId').val(blueprint.blueprintConfig.cloudProviderData.subnetId);
                        //loop for getting the Security Group
                        $blueprintReadContainer.find('.modal-body #instanceSecurityGroupId').val(blueprint.blueprintConfig.cloudProviderData.securityGroupIds);
                        //for getting the VPC
                        $blueprintReadContainer.find('.modal-body #instanceVPC').val(blueprint.blueprintConfig.cloudProviderData.vpcId)
                        // loop for getting runlist
                        for (var j = 0; j < blueprint.blueprintConfig.infraManagerData.versionsList.length; j++) {
                            $blueprintReadContainer.find('.modal-body #instanceRunlist').val(blueprint.blueprintConfig.infraManagerData.versionsList[j].runlist);
                        }
                        if (!blueprint.version) {
                            blueprint.version = "1";
                        }
                        $blueprintReadContainer.find('.modal-body #instanceVersion').val(blueprint.version);
                        $blueprintReadContainer.find('.modal-body #blueprintTemplateType').val(blueprint.templateType);
                        getOrgProjDetails($blueprintReadContainer);
                    });
                });
            } else if (data.templateType === 'cft' || data.templateType === 'arm') {
                $selectVerEdit.hide();
                $selectVer.hide();

                $liRead.click(function(e) {
                    var blueprintId = $(this).parents('.cardimage').find('.blueprintVer').val();
                    $.get('/blueprints/' + blueprintId, function(blueprint) {
                        var $blueprintReadContainerCFT = $('#modalForReadCFT');
                        if (blueprint.templateType == 'arm') {
                            $blueprintReadContainerCFT.find('.modal-title').html('Blueprint Information-ARM');
                        } else {
                            $blueprintReadContainerCFT.find('.modal-title').html('Blueprint Information-CFT');
                        }
                        $blueprintReadContainerCFT.modal('show');
                        //for getting the blueprint name
                        $blueprintReadContainerCFT.find('.modal-body #blueprintNameCFT').val(blueprint.name);
                        $blueprintReadContainerCFT.find('.modal-body #blueprintTemplateTypeCFT').val(blueprint.templateType);
                        if (!blueprint.version) {
                            blueprint.version = "1";
                        }
                        $blueprintReadContainerCFT.find('.modal-body #instanceVersion').val(blueprint.version);
                        getOrgProjDetails($blueprintReadContainerCFT);
                    });
                });
            }

        }
        if (localStorage.getItem('userRole') !== '[Consumer]') {
            var $li = $('<li></li>').css({
                "font-size": '10px'
            }).append(tagLabel, $selectVer, $selectVerEdit);
        } else {
            var $li = $('<li></li>').css({
                "font-size": '10px'
            }).append(tagLabel, $selectVer);
        }
        if ($selectVer.attr('class').indexOf('dockerrepotagselect') < 0) {
            if (typeof data.blueprintConfig.infraManagerData !== 'undefined') {
                for (var j = 0; j < data.blueprintConfig.infraManagerData.versionsList.length; j++) {
                    var $options = $('<option></option>').append(data.blueprintConfig.infraManagerData.versionsList[j].ver).val(data.blueprintConfig.infraManagerData.versionsList[j].ver);
                    $selectVer.append($options);
                }
            }
        }
        $selecteditBtnContainer.append($li);

        $ul.append($launchButton).append($linkVersions);
        $itemBody.append($ul);
        $itemBody.append($selecteditBtnContainer);
        $itemContainer.append($itemBody);
        $currRolePanel.append($itemContainer);
        //enabling the bluepintContiner div when item added.
        $currRolePanel.closest('.blueprintContainer').removeClass('hidden');
        $currRolePanel.parent().parent().show();



        $itemBody.click(function(e) {
            //Check if the checkbox is chekced before removing highlight
            if ($(this).hasClass('role-Selected1')) {
                $(this).removeClass('role-Selected1');
            } else {
                $(this).addClass('role-Selected1');
            }

        });
    }


}
//for removing the selected blueprint in the Existing Blueprints tab
function removeSelectedBlueprint() {

    var blueprintId = [];
    var compositeBlueprintId = [];
    $('.productdiv1.role-Selected1').each(function() {
        blueprintId.push($(this).find('button[title="Edit"]').first().attr('blueprintId'));
        compositeBlueprintId.push($(this).find('button[title="Edit"]').attr('data-blueprintId'));
    });

    if (blueprintId.length > 0 || compositeBlueprintId.length > 0) {
        bootbox.confirm("Are you sure you would like to remove the selected blueprints?", function(result) {
            if (!result) {
                return;
            } else {
                var url1 = '/blueprints';
                var url2 = '/composite-blueprints/delete';
                var data1 = {
                    blueprints: blueprintId
                };
                var data2 = {
                    compositeBlueprints: compositeBlueprintId
                };
                $.ajax({
                    url: (blueprintId[0] !=undefined)  ? url1 : url2,
                    data: (blueprintId[0] !=undefined) ? data1 : data2,
                    type: (blueprintId[0] !=undefined) ? 'DELETE' : 'POST',
                    success: function(data) {
                        if (data) {
                            var $bcc = $('.productdiv1.role-Selected1').closest('.blueprintContainer');
                            $('.productdiv1.role-Selected1').parent().detach();
                            //Check if any blueprints are found else display empty message
                            if ($('#accordion-2').find('.productdiv1').length <= 0) {
                                $('#npbpmsg').removeClass('hidden');
                            } else {
                                $('#npbpmsg').addClass('hidden');
                            }
                            if ($bcc.find('.panel-body').children().length <= 0) {
                                $bcc.addClass('hidden');
                            }
                        } else alert(data);
                    }
                });
            }
        });
    } else {
        bootbox.alert({
            message: 'Please select a blueprint to remove.',
            title: 'Warning'
        });
    }
}

function showbpcopydialog() {
    var blueprintId = [];
    $('.productdiv1.role-Selected1').each(function() {
        blueprintId.push($(this).attr('data-blueprintid'));
    });
    if (blueprintId.length > 0) {
        $('#copyBlueprintModal').modal('show');
        $('#copyBlueprintModal').find('label.bpcopycount').html(blueprintId.length + ' blueprint(s) selected.');
    } else {
        bootbox.alert({
            message: 'Please select a blueprint to copy.',
            title: 'Warning'
        });
    }
}

function copySelectedBlueprint() {
    var blueprintId = [];
    $('.productdiv1.role-Selected1').each(function() {
        blueprintId.push($(this).attr('data-blueprintid'));
    });
    var orgid = $('#orgnameSelectExistingforcopy').val();
    var buid = $('#bgListInputExistingforcopy').val();
    var projid = $('#projectListInputExistingforcopy').val();

    var copyobj = {
        orgid: orgid,
        buid: buid,
        projid: projid,
        blueprints: blueprintId
    }
    $.post('/blueprints/copy', copyobj, function(data, msg) {
        if (data && data.length) {
            var orgid = $('#orgnameSelectExisting').val();
            var buid = $('#bgListInputExisting').val();
            var projid = $('#projectListInputExisting').val();

            for (var i = 0; i < data.length; i++) {
                if (data[i].orgId === orgid && data[i].bgId === buid && data[i].projectId === projid) {
                    addBlueprintToDom(data[i]);
                }
            }
        }
        $('#copyBlueprintModal').modal('hide');
    });
}


$('#dockerRepoInputId').trigger('click');
$(".repoTypeSelectorRadioBtn").click(function() {
    var val = $(this).attr('data-repotype');
    $('.repoTypeClass').hide();
    $('#' + val).show();
});

$(document).ready(function() {
    $('#serviceDeliveryCheck').click(function() {
        if ($('#serviceDeliveryCheck').prop("checked")) {
            $('.sevice-delivery-section').addClass('showservice');
        } else {
            $('.sevice-delivery-section').removeClass('showservice');
        }
    });
});