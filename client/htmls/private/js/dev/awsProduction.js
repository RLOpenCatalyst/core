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
        }]
    });
}

function createRunlistTable(runlist) {
    $tasksRunlist.clear().draw();
    for (i = 0; i < runlist.length; i++) {
        var $runlistList = $('#tableRunlistForBlueprint');
        var $tr = $('<tr class="runlistRow"></tr>');
        var $tdName = $('<td class="runlistDescription">' + runlist[i] + '</td>');
        $tr.append($tdName);
        $runlistList.append($tr);
        $tasksRunlist.row.add($tr).draw();
    }
}
$('#saveRunlist').click(function(e) {
    var $ccrs = $('.cookbookShow').data('$ccrs');
    console.log($ccrs);
    console.log($ccrs.getSelectedRunlist());
    var runlist = $ccrs.getSelectedRunlist();
    createRunlistTable($ccrs.getRunlistNames());
    $('#chefRunlistModal').modal('hide');
    return false;
});


$('#editAttributesBtn').click(function(e) {
    var $ccrs = $('.cookbookShow').data('$ccrs');
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
    //var $ccrs = $('.runlistContainer').data('$ccrs');
    var $ccrs = $('.cookbookShow').data('$ccrs');
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

function updatecompositedockertableemptymessage() {
    if ($('#compositedockertable').find('tr').length <= 1) {
        //no rows found add empty message
        $('#compositedockertable').append('<tr id="dockerimageemptytr"><td colspan="6" align="center">No images added</td></tr>');
    }
}
$(document).ready(function() {
    $('#selectOrgName').trigger('change');
    var $addal = $("#addanotherlink"); //#ajax/Aws-Production.html?addnew
    if (window.url.indexOf('addnew') > 0) $addal.attr('href', '#ajax/Aws-Production.html?addanother');
    else $addal.attr('href', '#ajax/Aws-Production.html?addnew');
    $.ajax({
        type: "get",
        dataType: "json",
        async: false,
        url: "../organizations/getTreeNew",
        success: function(data) {
            console.log(data);
            data = JSON.parse(JSON.stringify(data));
            var $orgListInput = $('#orgnameSelectExisting');
            var $bgList = $('#bgListInputExisting');
            var $projectList = $('#projectListInputExisting');
            var $envList = $('#envListExisting');
            var $projectList = $('#projectListInputExisting');
            $bgList.change(function(e) {
                var bgName = $(this).val();
                if (bgName == 'choose') {
                    return;
                }
                var $selectedOrgOption = $(this).find(":selected");
                $projectList.empty();
                var getProjs = bgProjects[bgName];
                for (var i = 0; i < getProjs.length; i++) {
                    var $option = $('<option></option>').val(getProjs[i].rowid).html(getProjs[i].name);
                    $projectList.append($option);
                }
                $projectList.trigger('change');
            });
            var $spinnerProject = $('#spinnerProjectChange').addClass('hidden');
            $('#projectListInputExisting').change(function(e) {
                var reqBodyNew = {};
                $spinnerProject.removeClass('hidden');
                reqBodyNew.orgId = $orgListInput.val();
                reqBodyNew.bgId = $bgList.val();
                reqBodyNew.projectId = $projectList.val();
                reqBodyNew.envId = $envList.val();
                $.get('../organizations/' + reqBodyNew.orgId + '/businessgroups/' + reqBodyNew.bgId + '/projects/' + reqBodyNew.projectId + '/environments/' + reqBodyNew.envId + '/', function(data) {
                    console.log('success---3---4');
                    //Syncing up the tree view based on url
                    initializeBlueprintAreaNew(data.blueprints);
                    $spinnerProject.addClass('hidden');
                    if (data.blueprints.length > 0) {
                        $('#accordion-2').removeClass('hidden');
                        $spinnerProject.addClass('hidden');
                    } else {
                        $spinnerProject.addClass('hidden');
                    }
                });
            }); //choose env gets over
            var bgProjects = {};
            for (var i = 0; i < data.length; i++) {
                console.log(data[i].businessGroups);
                $orgListInput.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].businessGroups).data('envList', data[i].environments));
                for (var j = 0; j < data[i].businessGroups.length; j++) {
                    var rowid = data[i].businessGroups[j].rowid;
                    $bgList.append($('<option></option').val(rowid).html(data[i].businessGroups[j].name));
                    bgProjects[rowid] = data[i].businessGroups[j].projects;
                }
                for (var k = 0; k < data[i].environments.length; k++) {
                    $envList.append($('<option></option').val(data[i].environments[k].rowid).html(data[i].environments[k].name))
                }
            }
            $bgList.trigger('change');
            $('.chooseOrgSelectExisting').change(function(e) {
                if ($(this).val() == 'choose') {
                    $('#accordion-2').addClass('hidden');
                }
                $('.chooseBGExisting').change();
                $('.chooseProjectExisting').change();
            });
        }
    }); //getTreeNew gets over here
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
    //remove any empty row message from table
    $('#dockerimageemptytr').detach();
    if (!optionallaunchparams) {
        optionallaunchparams = '';
    }
    var $dockertemplaterow = '<tr class="dockerimagesrow"><td >' + $cdt.find('tr').length + '</td><td paramtype="dockercontainerpathstitle">' + title + '</td><td  paramtype="dockercontainerpaths">' + repopath + '</td><td paramtype="dockerrepotags">' + tagname + '</td><td><input type="text" paramtype="dockerlaunchparameters" id="launchparam' + uniqueid + '" class="" value=" ' + optionallaunchparams + '"><input type="hidden" paramtype="dockerreponame" id="dockerreponame' + uniqueid + '" class="" value="' + reponame + '"><a onclick="loadLaunchParams(\'launchparam' + uniqueid + '\');" href="javascript:void(0);"><i class="icon-append fa fa-list-alt fa-lg" title="Launch Parameters"></i></a></td><td ><a class="dockerimageselectorup" id="dockerimageselectorup' + uniqueid + '"  href="javascript:movetablerow(\'dockerimageselectorup\',' + uniqueid + ');"><i class="fa fa-chevron-circle-up fa-lg"></i></a><a class="dockerimageselectordown" id="dockerimageselectordown' + uniqueid + '" href="javascript:movetablerow(\'dockerimageselectordown\',' + uniqueid + ');" style="padding-left:5px;"><i class="fa fa-chevron-circle-down fa-lg"></i></a><button class="btn btn-xs btn-danger pull-right" value="Remove" title="Remove" id="dockerimageremove' + uniqueid + '" onClick="javascript:removeimage(\'dockerimageremove\',' + uniqueid + ');"><i class="ace-icon fa fa-trash-o fa-lg"></i></button></td></tr>';
    $cdt.append($dockertemplaterow);
}

function showdockertemplateadder() {
    $('#dockertemplateselector').val('');
    $('#dockertemplatetagselector').empty().val('');
    $('#myModalDockerTemplateContainer').modal('show');
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

    //alert('url:' + '/d4dmasters/getdockertags/' + encodeURIComponent($('#dockertemplateselector').val().replace(/\//g, "$$$")) + '/' + $('#dockertemplateselector option:selected').attr('reponame'));
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

function renumberDockerImageTable() {
    var $cdt = $('#compositedockertable').find('tr').each(function(i) {
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
            // alert(execparam[1]);
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
    $('#myModalLabelDockerContainer').attr('saveto', lpinput).modal('show');
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

function getProviderList() {
    $.ajax({
        type: "GET",
        url: "/aws/providers",
        success: function(data) {
            data = typeof data == "string" ? JSON.parse(data) : data;
            console.log(data);
            var str = ' <option value="">Select Provider</option>',
                len = data.length;
            str = str + helperConstructOption(data, ['secretKey', 'accessKey', 'providerType'], 'providerName', '_id');
            //getting openstack provider list
            $.ajax({
                type: "GET",
                url: "/openstack/providers",
                success: function(data) {
                    data = typeof data == "string" ? JSON.parse(data) : data;
                    console.log(data);
                    len = data.length;
                    str += helperConstructOption(data, ['username', 'password', 'providerType'], 'providerName', '_id');
                    $('#providerId').html(str);
                },
                failure: function(data) {
                    alert(data.toString());
                }
            });
            //end of openstack 
        },
        failure: function(data) {
            alert(data.toString());
        }
    });
}

function getImagesWithOSFilter() {
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
        console.log(list);
        return list;
    }

    function loadData() {
        var providerVal = $('#providerId').val();
        if (providerVal) {
            $.get("/vmimages/providers/" + providerVal, function(data) {
                var str = ' <option value="">Select Image</option>',
                    data = getFilteredList(data, $('#instanceOS').val()),
                    len = data.length;
                str = str + helperConstructOption(data, ['providerId', 'vType', 'osType', '_id'], 'name', 'imageIdentifier');
                $('#imageId').html(str);
                //setting image value for ami type and disabling it- vn
                if ($('.productdiv2.role-Selected').first().attr('templatetype') == 'ami') {
                    var vmimage = JSON.parse($('.productdiv2.role-Selected').first().attr('imagedata'));
                    $('#imageId').val(vmimage.imageIdentifier).attr('disabled', 'disabled');
                }
                //setting the selection
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
    var list = []
    $('#securityGroupIds').find('input[type="checkbox"]:checked').each(function() {
        list.push(this.value);
    });
    return list;
}

function getImageInstances() {
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

function getSecurityGroup() {
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
                        getTemplate = function(val, name) {
                            return '<label class="toggle font-sm" style="padding-left:4px;"><input onclick="if($(this).is(&quot;:checked&quot;)) {$(this).closest(&quot;label&quot;).' + 'css(&quot;background-color&quot;,&quot;#eeeeee&quot;);$(this).css(&quot;border-color&quot;,&quot;#3b9ff3&quot;);}else{$(this).closest(&quot;label&quot;).css(&quot;background-color&quot;,&quot;#ffffff&quot;);$(this).css(&quot;border-' + 'color&quot;,&quot;red&quot;);}" type="checkbox" id="checkbox-toggle" name="checkbox-toggle" rowid="1ae4f099-7adc-4089-81c6-db2248774142"' + 'value="' + val + '" style="width:100%"><i data-swchoff-text="NO" data-swchon-text="YES"></i>' + name + '</label>';
                        },
                        list = bringAllOpenFirst(list),
                        len = list.length;
                    for (var i = 0; i < len; i++) {
                        str = str + getTemplate(list[i].GroupId, list[i].GroupId + ' | ' + list[i].GroupName);
                    }
                    $spinnerSecurityGroup.addClass('hidden');
                    $('#securityGroupIds').html('').append(str);
                },
                error: function(xhr) {
                    bootbox.alert(xhr.responseText);
                }
            });
        } else {
            $('#securityGroupIds').html('');
        }
    }
    $('#vpcId').on('change', populateData);
}

function getkeypairList() {
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
                /*bring Region list from providers*/
                var str1 = '<option value="">Select Region</option>';
                for (var i = 0; i < keylist.length; i++) {
                    str1 = str1 + '<option value="' + keylist[i].region + '">' + getRegionName(keylist[i].region) + ' | ' + keylist[i].region + '</option>';
                }
                $('#region').html(str1);
            });
        }
    });
}

function getVPC() {
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
                    console.log(data);
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
                    $('#vpcId').html(str).trigger('change');
                    $spinner.addClass('hidden');
                },
                error: function(xhr) {
                    bootbox.alert(xhr.responseText);
                }
            });
        } else {
            $('#vpcId').html('<option value="">Select VPC</option>');
        }
    }
    $('#providerId').on('change', populateData);
    $('#region').on('change', populateData);
}

function getSubnet() {
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
                    console.log(data);
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
                },
                error: function(xhr) {
                    bootbox.alert(xhr.responseText);
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
$(document).ready(function() {
    awsLoadData();
    getProviderList();
    getImageInstances();
    getSecurityGroup();
    getkeypairList();
    getVPC();
    getSubnet();
    getImagesWithOSFilter();
    console.log("Orgname===>" + localStorage.getItem('selectedOrgName'));
    $.get('../aws/ec2/amiids', function(data) {
        var $instanceOS = $('#instanceOS');
        $instanceOS.append('<option value="">Select Operating System</option>')
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
            console.log(supportedInstanceType);
            if (typeof supportedInstanceType != 'undefined') {
                for (var i = 0; i < supportedInstanceType.length; i++) {
                    var $option = $('<option></option>').val(supportedInstanceType[i]).html(supportedInstanceType[i]);
                    $instanceType.append($option);
                }
            }
        });
        $instanceOS.trigger('change');
    });
    var sortbyid = function SortByID(x, y) {
        return x.position - y.position;
    }

    $('#selectOrgName').change(function(e) {
        awsLoadData();
    });

    function awsLoadData() {
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
                    }
                    getDesignTypeRowID = data[i]['rowid'];
                    if (getDesignTypeImg) {
                        if (getDesignTypeImg.indexOf('/d4dMasters/image') === -1) {
                            getDesignTypeImg = "/d4dMasters/image/" + getDesignTypeRowID + "__designtemplateicon__" + getDesignTypeImg;
                        }
                        containerTemp += '<div class="" style="width:222px;float:left">' + ' <div id=grid' + i + ' class="blueprintdiv appfactory" data-' + 'templateType="' + data[i]
                            ['templatetypename'] + '" data-gallerytype="' + data[i]['templatetype'] + '">' + '<div style="">' +
                            '<img  style="height:25px;padding:2px" alt="" src="img/app-store-' + 'icons/Logoheader.png"><span style="padding-top:4px;position:absolute;' +
                            'padding-left: 4px;">' + '<b>' + data[i]['templatetypename'] + '</b>' + '</span></div>' +
                            '<div style="padding-top:10px;padding-left:0px;text-align:center;">' + '<img alt="Template Icon" ' + 'src="' + getDesignTypeImg +
                            '" style="height:60px;width:auto;">' + '</div></div></div>';
                    } else {
                        containerTemp += '<div class="" style="width:222px;float:left">' + ' <div id=grid' + i + ' class="blueprintdiv appfactory" data-' + 'templateType="' + data[i]
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
var $wizard = $('#bootstrap-wizard-1').bootstrapWizard({
    'tabClass': 'form-wizard',
    'onNext': function(tab, navigation, index) {
        console.log(navigation, index)
        if (index === 1) {
            $('#viewCreateNew').addClass('hidden');
            $('#selectOrgName').attr('disabled', true);
            $("#tabheader").html('Choose Templates');
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
            $.ajax({
                url: templateurl,
                dataType: "json",
                type: "GET",
                cache: "true",
                success: function(data) {
                    console.log('templateData ==> ', data);
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
                        console.log(getTemplateType);
                        if (selectedText.trim() != getTemplateType.trim()) continue;
                        gettemplatescookbooks = data[z]
                            ['templatescookbooks'].replace(/"/g, "");
                        dockercontainerpathstitle = data[z]['dockercontainerpathstitle'];
                        dockercontainerpaths = data[z]
                            ['dockercontainerpaths'];
                        dockerreponame = data[z]['dockerreponame'];
                        //To be removed and converted to reference when the new master model is implemented.
                        dockerusername = '';
                        dockercred = '';
                        dockeremail = '';
                        console.log('here end ' + dockercontainerpathstitle);
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
            $("#tabheader").html('Choose Template');
            //If a docker type of template selected then select the Org 
            var $selectedItem = $('.role-Selected');
            // alert('in ' + $selectedItem.length);
            if (!$selectedItem.length) {
                bootbox.alert('please choose a blueprint design');
                return false;
            }
            //Selection of Orgname from localstorage 
            $('#orgnameSelect').val($('#orgIDCheck').val());
            $('#orgnameSelect').attr('disabled', true);
            console.log('role-Selected before ==> ', $('#tab2 .role-Selected').length);
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
                    //populating the docker repo titles
                    var $dockerrepotitles = $('.productdiv2.role-Selected').attr('dockercontainerpathstitle').split(',');
                    var $dockerrepopaths = $('.productdiv2.role-Selected').attr('dockercontainerpaths').split(',');
                    var $dockerreponame = $('.productdiv2.role-Selected').attr('dockerreponame');
                    var $dockerrepoListInput = $('#dockerrepoListInput');
                    $dockerrepoListInput.empty();
                    $dockerrepotitles.forEach(function(k, v) {
                        var $opt = $('<option value="' + $dockerrepotitles[v] + '" repopath="' + $dockerrepopaths[v] + '">' + $dockerrepotitles[v] + '</option>');
                        $dockerrepoListInput.append($opt);
                    });
                    updatecompositedockertableemptymessage();
                    //Setting the appropriate tags
                    //Attaching the change event to pull tags for the select repo
                    $dockerrepoListInput.change(function(e) {
                        $.get('/d4dmasters/getdockertags/' + encodeURIComponent($(this).find('option:selected').attr('repopath')) + '/' + $dockerreponame, function(data) {
                            if (data) {
                                var tagJson = JSON.parse(data);
                                var $dockerrepotagsdiv = $('#dockerrepotagsdiv');
                                $dockerrepotagsdiv.empty();
                                var dockerrepotags = [];
                                tagJson.forEach(function(k, v) {
                                    if (v < 3) {
                                        $('#dockerrepotagsdiv').append('<div class="codelistitem" style="margin-top:2px;padding-top:2px;border:1px solid #eeeeee; background-color:#eeeeee !important;height:26px;"><p class="bg-success"><i style="padding-left:10px;padding-right:10px" class="ace-icon fa fa-check"></i>' + tagJson[v].name + '</p></div>');
                                        if (dockerrepotags == '') dockerrepotags += tagJson[v].name;
                                        else dockerrepotags += ',' + tagJson[v].name;
                                    }
                                    //limiting the number to the top 5
                                });
                                $('.productdiv2.role-Selected').first().attr('dockerrepotags', dockerrepotags);
                                $('.productdiv2.role-Selected').first().attr('dockerimagename', $dockerrepoListInput.val());
                            }
                        });
                    });
                    $dockerrepoListInput.trigger('change');
                    //End Setting appropriate tags
                    //polulate the docker tags
                    var $dockerrepotagsul = $('#dockerrepotagsul');
                    $('.forDocker').show();
                    $('.notForDocker').hide();
                } else if ($('.productdiv2.role-Selected').first().attr('templatetype') == "CloudFormation") {
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
                            console.log(data);
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
                                        console.log(err);
                                        bootbox.alert("Invalid template file");
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
                                        var $ccrs = $chefCookbookRoleSelector($this.val(), function(data) {}, null);
                                        $('.cftResourceRunlistInput').empty().append($ccrs).data('$ccrs', $ccrs);
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
                                });
                            });
                        },
                        failure: function(data) {
                            alert(data.toString());
                        }
                    });
                } else {
                    //setting the instance count drop down
                    $('#instanceCount').val("1");
                    if ($('.productdiv2.role-Selected').first().attr('templatetype') == "ami") {
                        var vmimage = JSON.parse($('.productdiv2.role-Selected').first().attr('imagedata'));
                        $('#instanceOS').val(vmimage.osName);
                        $('#instanceOS').change().attr('disabled', 'disabled');
                        $('#providerId').val(vmimage.providerId);
                        $('#providerId').change().attr('disabled', 'disabled');
                        $('#orgnameSelect').attr('disabled', 'disabled');
                    } else {
                        $('#instanceOS').removeAttr('disabled');
                        $('#providerId').removeAttr('disabled');
                        $('#orgnameSelect').removeAttr('disabled');
                    }
                    if (!$('#CollapseConfigureproviderParameter').hasClass('in')) {
                        $('a[href="#CollapseConfigureproviderParameter"]').click();
                    }
                }
            }
            console.log('role-Selected after ==> ', $('#tab2 .role-Selected').length);
            var $clone = $selectedItem.clone().removeClass('role-Selected');
            var selectedText = $clone.attr("data-templateType");
            if ($selectedItem.attr('data-templateType') == 'desktopProvisoning') {
                wizard.show(4);
                return false;
            }
            if ($('#tab2 .role-Selected').length > 0) {
                console.log('cloning');
                $('#tab3 .selectedTemplateArea').empty().append($('#tab2 .role-Selected').clone());
            }
            //force clicking orgnameSelect
            $('#orgnameSelect').trigger('change');
            $(".chooseBG").change();
            $(".chooseDockerContainer").change();
            var validatorForm = $("#wizard-1").validate();
            validatorForm.resetForm();
        } else if (index == 3) {
            if ($wizard.data('secondClick')) {
                return true;
            }
            var isValid = $('#wizard-1').valid();
            var tempType = $('.role-Selected').data('templatetype').toLowerCase();
            if (tempType !== "docker" && tempType !== 'cloudformation' && !isValid) {
                return false;
            } else {
                bootbox.confirm({
                    message: "Are you sure want to submit this Blueprint Data? Press Ok to Continue",
                    title: "Confirm",
                    callback: function(result) {
                        if (result) {
                            $("#tabheader").html('Create Blueprint');
                            var $selectedTemplateArea = $('.selectedTemplateArea');
                            var $selectedItem = $selectedTemplateArea.find('.productdiv2');
                            console.log($selectedItem.length);
                            if (!$selectedItem.length) {
                                alert('please choose a template');
                                return false;
                            }
                            if ($('#orgnameSelect').val() === 'choose') {
                                alert('please choose an Organization');
                                return false;
                            }
                            reqBody = {};
                            reqBody.templateId = $selectedItem.attr('data-templateId');
                            reqBody.templateType = $selectedItem.attr('data-templateType');
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

                            //alert($('.checkConfigApp').prop("checked"));
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
                                        "repoId": nexusRepoId,
                                        "url": nexusRepoUrl,
                                        "version": appVersion,
                                        "repoName": repoId,
                                        "artifactId": artifactId,
                                        "groupId": groupId
                                    };
                                    reqBody.nexus = nexus;
                                } else {
                                    var dockerImage = $chooseRepository.val();
                                    var containerId = $('#containerIdDiv').val();
                                    var containerPort = $('#containerPort').val();
                                    if (!dockerImage) {
                                        alert("Please select repository.");
                                        return false;
                                    }
                                    var docker = {
                                        "image": dockerImage,
                                        "containerId": containerId,
                                        "containerPort": containerPort
                                    };
                                    reqBody.docker = docker;
                                }
                            }
                            console.log($('#compositedockertable').find('.dockerimagesrow').length);
                            $('.dockerimagesrow').each(function() {
                                dockerimages = {};
                                $(this).find('[paramtype]').each(function() {
                                    console.log($(this).text() + $(this).val());
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
                            console.log(reqBody);
                            console.log("reqBody ==>", reqBody);
                            if (!reqBody || reqBody == "undefined") {
                                console.log('resetting');
                                var reqBody = {};
                            }
                            var $ccrs = $('.cookbookShow').data('$ccrs');
                            var cbs = [];
                            cbs = $ccrs.getSelectedRunlist();
                            reqBody.runlist = cbs;

                            //Attributes start

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

                            // Attributes end


                            reqBody.chefServerId = $ccrs.getChefServerId();
                            console.log("instanceType ==>", $('select.instanceType').val());
                            reqBody.instanceType = $('select.instanceType').val();
                            var $instanceOsoptionsSelected = $('#instanceOS').find('option:selected');
                            console.log($('#instanceOS').val());
                            // alert($('#instanceOS').val());
                            console.log($instanceOsoptionsSelected);
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
                            reqBody.name = $('#blueprintNameInput').val();
                            /*$('#userListSelect').find('option').attr('selected', 'selected');
                            reqBody.users = $('#userListSelect').val();
                            if (!reqBody.users) {
                                alert("Please choose users");
                                return false;
                            }*/
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
                            $('.blueprintMsgContainer').hide();
                            if (($('.role-Selected').data('templatetype')).toLowerCase() != "docker") {
                                reqBody.blueprintType = "instance_launch";
                                if (($('.role-Selected').data('templatetype')).toLowerCase() === 'cloudformation') {
                                    reqBody.blueprintType = 'aws_cf';
                                }
                                //alert(reqBody);
                                console.log(reqBody);
                                $.post('/organizations/' + reqBody.orgId + '/businessgroups/' + reqBody.bgId + '/projects/' + reqBody.projectId + '/blueprints', {
                                    blueprintData: reqBody
                                }, function(data) {
                                    console.log(data);
                                    var validatorForm = $("#wizard-1").validate();
                                    validatorForm.resetForm();
                                    $('.blueprintSaveSuccess').show();
                                    $('.blueprintNameSuccess').html('Blueprint&nbsp;&nbsp;<a id="blueprintInfo" data-toggle="modal">' + data.name + '</a>&nbsp;&nbsp;Saved Successfully');
                                    $wizard.data('secondClick', true);
                                    var wizard = $wizard.data('bootstrapWizard');
                                    wizard.next();
                                    wizard.disablePreviouBtn();
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
                                                    console.log(data);
                                                    $blueprintReadContainer.find('.modal-body #instanceImage').val(data.name);
                                                    //alert(data.name);
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
                                                    alert(data.toString());
                                                }
                                            });
                                            $blueprintReadContainer.find('.modal-body #blueprintTemplateType').val(data.templateType);
                                            $.ajax({
                                                type: "get",
                                                dataType: "json",
                                                async: false,
                                                url: "../organizations/getTreeNew",
                                                success: function(dataTree) {
                                                    console.log(data);
                                                    data = JSON.parse(JSON.stringify(data));
                                                    //  alert(JSON.stringify(data));
                                                    $.get("/d4dMasters/readmasterjsonnew/4", function(tdata) {
                                                        for (var i = 0; i < tdata.length; i += 1) {
                                                            if (data.orgId == tdata[i].orgname_rowid) {
                                                                $blueprintReadContainer.find('.modal-body #blueprintORG').val(tdata[i].orgname[0]);
                                                            }
                                                            if (data.bgId == tdata[i].productgroupname_rowid) {
                                                                $blueprintReadContainer.find('.modal-body #blueprintBU').val(tdata[i].productgroupname);
                                                            }
                                                            if (data.projectId == tdata[i].rowid) {
                                                                $blueprintReadContainer.find('.modal-body #blueprintProject').val(tdata[i].projectname);
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    } else if (tempType === 'cloudformation') {
                                        $('a#blueprintInfo').attr('href', '#modalForReadCFT').click(function(e) {
                                            var $blueprintReadContainerCFT = $('#modalForReadCFT');
                                            $('.modal-title').html('Blueprint Information-CFT');
                                            $blueprintReadContainerCFT.modal('show');
                                            //for getting the blueprint name
                                            $blueprintReadContainerCFT.find('.modal-body #blueprintNameCFT').val(data.name);
                                            $blueprintReadContainerCFT.find('.modal-body #blueprintTemplateTypeCFT').val(data.templateType);
                                            $.ajax({
                                                type: "get",
                                                dataType: "json",
                                                async: false,
                                                url: "../organizations/getTreeNew",
                                                success: function(dataTree) {
                                                    console.log(data);
                                                    data = JSON.parse(JSON.stringify(data));
                                                    $.get("/d4dMasters/readmasterjsonnew/4", function(tdata) {
                                                        for (var i = 0; i < tdata.length; i += 1) {
                                                            if (data.orgId == tdata[i].orgname_rowid) {
                                                                $blueprintReadContainerCFT.find('.modal-body #blueprintORG').val(tdata[i].orgname[0]);
                                                            }
                                                            if (data.bgId == tdata[i].productgroupname_rowid) {
                                                                $blueprintReadContainerCFT.find('.modal-body #blueprintBU').val(tdata[i].productgroupname);
                                                            }
                                                            if (data.projectId == tdata[i].rowid) {
                                                                $blueprintReadContainerCFT.find('.modal-body #blueprintProject').val(tdata[i].projectname);
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    }
                                    //for getting the blueprint name
                                }).error(function(xhr) {
                                    $('.blueprintSaveFail').find('h3').first().html(xhr.responseText);
                                    $('.blueprintSaveFail').show();
                                });
                                console.log('final', reqBody);
                            } else {
                                reqBody.blueprintType = "docker";
                                $.post('/organizations/' + reqBody.orgId + '/businessgroups/' + reqBody.bgId + '/projects/' + reqBody.projectId + '/blueprints', {
                                    blueprintData: reqBody
                                }, function(data) {
                                    console.log(data);
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
                                console.log('final', reqBody);
                            }
                        }
                    }
                }).find('.modal-header').css('background-color', 'ghostwhite');
            }
            return false;
        }
    },
    'onPrevious': function(tab, navigation, index) {
        if (index === 0) {
            $("#tabheader").html('Choose Template Type');
            $('#viewCreateNew').removeClass('hidden');
            $('#selectOrgName').attr('disabled', false);
            var wizard = $wizard.data('bootstrapWizard');
            wizard.enableNextBtn();
        } else if (index === 1) {
            $("#tabheader").html('Choose Templates');
            if ($('#tab1').find('.role-Selected').attr('data-templatetype') === "Docker" || $('#tab1').find('.role-Selected').attr('data-templatetype') === "docker") {
                $('#bootstrap-wizard-1').bootstrapWizard('show', 2);
                var validatorForm = $("#wizard-1").validate();
            }
        } else if (index === 2) {
            $("#tabheader").html('Choose Template');
        } else if (index === 3) {
            $("#tabheader").html('Create Blueprint');
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
    console.log("this ==> ", this);
    var $this = $(this);
    $('.selectedTemplateArea').empty().append($this.clone(false).css({
        'cursor': 'auto'
    }));
    $this.addClass('role-Selected');
});
$.ajax({
    type: "get",
    dataType: "json",
    async: false,
    url: "../organizations/getTreeForbtv",
    success: function(data) {
        console.log(data);
        $('#selectOrgName').trigger('change');
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
            }
            var $cookbookShow = $('.cookbookShow').empty();
            $cookbookShow.append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />');
            var tcb = [];
            var $card = $('#tab3').find('div[class*="productdiv2"]').first();
            if ($card.length) {
                var templatescookbooks = $card.attr('templatescookbooks');
                if (templatescookbooks) {
                    tcb = templatescookbooks.split(',');
                }
            }
            console.log(tcb);
            console.log('tcbdhd == >', tcb);
            var $ccrs = $chefCookbookRoleSelector(orgName, function(data) {}, tcb);
            console.log("Variables>>>>>" + $ccrs);
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
            if ($('.checkConfigApp').prop("checked")) {
                getNexusServer();
            } else {
                $nexusServer.empty();
                $nexusServer.append('<option value="">Choose Server</option>');
                resetAllFields();
            }
            $('.checkConfigApp').click(function() {
                if ($(this).prop("checked")) {
                    getNexusServer();
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
            }

            function resetSpinners() {
                $('.reposerverspinner').css('display', 'none');
                $('.repospinner').css('display', 'none');
                $('.repourlspinner').css('display', 'none');
                $('.artifactsspinner').css('display', 'none');
                $('.versionspinner').css('display', 'none');
                $('.jobdetailsspinner').css('display', 'none');
            }

            function getNexusServer() {
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
                        }
                        var exists = {},
                            elm;
                        $nexusServer.find('option').each(function() {
                            if (nexus.length) {
                                if ($(this).attr('data-serverType') == 'nexus') {
                                    elm = $(this).attr('data-serverType');
                                    if (!exists[elm]) {
                                        $(this).attr('selected', true).change();
                                        exists[elm] = true;
                                    }
                                }
                            } else {
                                if ($(this).attr('data-serverType') == 'docker') {
                                    elm = $(this).attr('data-serverType');
                                    if (!exists[elm]) {
                                        $(this).attr('selected', true).change();
                                        exists[elm] = true;
                                    }
                                }
                            }
                        });
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
                    resetAllFields();

                    getNexusServerGroupId();
                    getNexusServerRepo($(this).val());
                } else { // It's Docker
                    resetAllFields();
                    $('.groupClass').hide();
                    $('.repoUrlClass').hide();
                    $('.artifactClass').hide();
                    $('.versionClass').hide();
                    $('.containerIdClass').show();
                    $('.containerPortClass').show();
                    var containerId = $('#containerIdInput').val();
                    getDockerRepoes();
                }
            });

            function getDockerRepoes() {
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
                                }
                            }
                        }
                    });
                } else {
                    $('.repospinner').css('display', 'none');
                }
            }

            function getNexusServerRepo(nexusId) {
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

                                            $('#chooseRepository > option:eq(1)').attr('selected', true).change();
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
                    $('.groupClass').hide();
                    $('.containerIdClass').show();
                    $('.containerPortClass').show();
                    $('.repoUrlClass').hide();
                    $('.artifactClass').hide();
                    $('.versionClass').hide();
                }
            });

            function getNexusServerGroupId() {
                var groupId = $('#chooseNexusServer :selected').attr('data-groupId').split(",");
                for (var g = 0; g < groupId.length; g++) {
                    $('#chooseGroupId').append('<option value="' + groupId[g] + '">' + groupId[g] + '</option>');
                }
                $('#chooseGroupId > option:eq(1)').attr('selected', true).change();
            }

            $chooseGroupId.change(function(e) {
                var repoName = $('#chooseRepository').find('option:selected').attr('data-repoName');
                var nexusId = $('#chooseNexusServer').val();
                var groupId = $('#chooseGroupId').val();
                getNexusServerRepoArtifact(nexusId, repoName, groupId);
            });

            function getNexusServerRepoArtifact(nexusId, repoName, groupId) {
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
                            $('#chooseArtifacts > option:eq(1)').attr('selected', true).change();
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
                getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId);
            });
            var comparer = function compareObject(a, b) {
                if (a.artifactId === b.artifactId) {
                    return 0;
                } else {
                    return 1;
                }
            }

            function getNexusServerRepoArtifactVersions(nexusId, repoName, groupId, artifactId) {
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
                            $chooseVersions.find('option:last-child').attr('selected', true).change();
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
/*
(function() {
    var $loadingContainer = $('.userListLoadingContainer').empty().append('<img class="center-block" style="height:50px;width:50px;margin-top: 10%;margin-bottom: 10%;" src="img/loading.gif" />').show();
    $.get('../users', function(userList) {
        var $userListSelect = $('#userListSelect').empty();
        userList = JSON.parse(userList);
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
            $userListSelect.append($option);
        }
        $loadingContainer.hide();
        $userListSelect.show();
    }).error(function() {
        $loadingContainer.empty().append('Unable to load users. Please try again later.');
    });
})();*/
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
$('#appURLForm').submit(function(e) {
    var regexpURL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    var $row = $('<tr/>');
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
    $row.data('appUrlData', {
        name: appName,
        url: appUrl
    })
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
});
//Initializing the blueprint area according to the Template-Type and showing
//the differnt template types whenever a blueprint is added
function initializeBlueprintAreaNew(data) {
    var reqBodyNew = {};
    var $orgListInput = $('#orgnameSelectExisting');
    reqBodyNew.orgId = $orgListInput.val();
    var $AppFactpanelBody = $('.appFactoryPanel').find('.panel-body');
    $AppFactpanelBody.empty();
    var $devopsRolepanelBody = $('.devopsRolePanel').find('.panel-body');
    $devopsRolepanelBody.empty();
    var $desktopProvisioningPanelBody = $('.desktopProvisioningPanel').find('.panel-body');
    $devopsRolepanelBody.empty();
    //Displaying the Template Types.
    $.get("/d4dMasters/readmasterjsonnew/16", function(tdata) {
        tdata = JSON.parse(tdata);
        var rowLength = tdata.length;
        var $containerTempNew = "";
        var selectedrow = false;
        var getDesignTypeImg;
        var getDesignTypeRowID;
        var getDesignTypeName;
        var getDesignType;
        $('#accordion-2').empty();
        for (var i = 0; i < rowLength; i += 1) {
            getDesignTypeImg = tdata[i]['designtemplateicon_filename'];
            getDesignTypeRowID = tdata[i]['rowid'];
            getDesignTypeName = tdata[i]['templatetypename'];
            getDesignType = tdata[i]['templatetype'];
            //Extracting the TT definitions. Add New Template types
            var $currRolePanel = null;
            switch (getDesignTypeName) {
                case "AppFactory":
                    $AppFactpanelBody = $('<div class="panel-body AppFactory"></div>');
                    $currRolePanel = $AppFactpanelBody;
                    break;
                case "DevopsRoles":
                    $DevopsRolespanelBody = $('<div class="panel-body DevopsRoles"></div>');
                    $currRolePanel = $DevopsRolespanelBody;
                    break;
                case "CloudFormation":
                    $CloudFormationBody = $('<div class="panel-body CloudFormation"></div>');
                    $currRolePanel = $CloudFormationBody;
                    break;
                case "Docker":
                    $DockerpanelBody = $('<div class="panel-body Docker"></div>');
                    $currRolePanel = $DockerpanelBody;
                    break;
                case "Desktop":
                    $DesktopProvisioningPanelBody = $('<div class="panel-body Desktop"></div>');
                    $currRolePanel = $DesktopProvisioningPanelBody;
                    break;
                case "Environment":
                    $EnvironmentpanelBody = $('<div class="panel-body Environment"></div>');
                    $currRolePanel = $EnvironmentpanelBody;
                    break;
            }
            console.log(tdata);
            if ($("div." + tdata[i]['templatetype']).length === 0) {
                $containerTempNew = '<div class="panel panel-default blueprintContainer hidden">' + '<div class="panel-heading">' + '<h4 class="panel-title">' + '<a href="#collapse' + i + '" data-parent="#accordion-2" data-toggle="collapse" class="collapsed"> ' + '<i class="fa fa-fw fa-plus-circle txt-color-blue"></i> ' + '<i class="fa fa-fw fa-minus-circle txt-color-red"></i>' + getDesignTypeName + '</a>' + '</h4></div><div class="panel-collapse collapse" id="collapse' + i + '">' + '<div class="panel-body ' + getDesignType + '"></div>' + '</div>';
                $('#accordion-2').append($containerTempNew);
            }
        }
        for (var i = 0; i < data.length; i++) {
            (function(i) {
                //Find a panel-body with the template type class
                var $currRolePanel = $('#accordion-2').find('.' + data[i].templateType);
                if ($currRolePanel.length > 0) {
                    var $itemContainer = $('<div></div>').addClass("productdiv4");
                    var $itemBody = $('<div></div>').addClass('productdiv1 cardimage').attr('data-blueprintId', data[i]._id).attr('data-projectId', data[i].projectId).attr('data-envId', data[i].envId).attr('data-chefServerId', data[i].chefServerId).attr('data-templateType', data[i].templateType);
                    var $ul = $('<ul></ul>').addClass('list-unstyled system-prop').css({
                        'text-align': 'center'
                    });
                    var $liRead = $('<a style="float:right;margin:5px;cursor:pointer" class="readBtn"><div class="moreInfo"></div></a>').attr('data-toggle', 'tooltip').attr('data-placement', 'top').attr('title', 'More Info');
                    $ul.append($liRead);
                    var $img
                    if (data[i].iconpath) {
                        if (data[i].templateType == "Docker" || data[i].templateType == "docker") {
                            $img = $('<img />').attr('src', 'img/galleryIcons/Docker.png').attr('alt', data[i].name).addClass('cardLogo');
                        } else $img = $('<img />').attr('src', data[i].iconpath).attr('alt', data[i].name).addClass('cardLogo');
                    } else $img = $('<img />').attr('src', 'img/imgo.jpg').attr('alt', data[i].name).addClass('cardLogo');
                    var $liImage = $('<li></li>').append($img);
                    $ul.append($liImage);
                    var $liCardName = $('<li title="' + data[i].name + '"></li>').addClass('Cardtextoverflow').html('<u><b>' + data[i].name + '</b></u>');
                    $ul.append($liCardName);
                    var $selecteditBtnContainer = $('<div style="position:absolute;padding-left:27px;bottom:11px;"></div>');
                    var $selectVerEdit = $('<a style="padding:0px 4px;margin-left:3px;border-radius:5px;" class="bpEditBtn"><i class="ace-icon fa fa-pencil"></i></a>').addClass('btn btn-primary').attr('data-toggle', 'tooltip').attr('data-placement', 'top').attr('title', 'Edit');
                    var $selectVer = null;
                    var tagLabel = '';
                    //Docker Check
                    if (data[i].templateType == "Docker" || data[i].templateType == "docker") {
                        console.log("data[i}" + JSON.stringify(data[i]));
                        $selectVer = $('<select style="padding:1px;margin-right:5px;"></select>').addClass('dockerrepotagselect').attr('data-blueprintId', data[i]._id);
                        $itemBody.attr('dockerreponame', data[i].dockerreponame);
                        $itemBody.attr('dockerrepotags', data[i].dockerrepotags);
                        $itemBody.attr('dockercontainerpaths', data[i].dockercontainerpaths);
                        if (typeof data[i].blueprintConfig.dockerCompose != 'undefined') {
                            data[i].blueprintConfig.dockerCompose.forEach(function(k, v) {
                                var $liDockerRepoName = $('<li title="Docker Repo Name" class="dockerimagetext" style="text-align:left;margin-left:15px" ><i class="fa fa-check-square" style="padding-right:5px"/>' + data[i].blueprintConfig.dockerCompose[v]["dockercontainerpathstitle"] + '</li>');
                                $ul.append($liDockerRepoName);
                            });
                        }
                        if (data[i].dockerrepotags && data[i].dockerrepotags != '') {
                            $selectVer.empty();
                            var dockerrepostags = data[i].dockerrepotags.split(',');
                            $.each(dockerrepostags, function(k) {
                                $selectVer.append('<option value="' + dockerrepostags[k] + '">' + dockerrepostags[k] + '</option>');
                            });
                        }
                        $selectVer.hide();
                        $selectVerEdit.hide();
                        //for software stack and os image
                        function getOrgProjDetails(id) {
                            var orgName = $("#orgnameSelectExisting option:selected").text();
                            var bgName = $('#bgListInputExisting option:selected').text();
                            var projName = $('#projectListInputExisting option:selected').text();
                            var $blueprintReadContainer = $(id);
                            $blueprintReadContainer.find('.modal-body #blueprintORG').val(orgName);
                            $blueprintReadContainer.find('.modal-body #blueprintBU').val(bgName);
                            $blueprintReadContainer.find('.modal-body #blueprintProject').val(projName);
                            var $blueprintReadContainerCFT = $(id);
                            $blueprintReadContainerCFT.find('.modal-body #blueprintORG').val(orgName);
                            $blueprintReadContainerCFT.find('.modal-body #blueprintBU').val(bgName);
                            $blueprintReadContainerCFT.find('.modal-body #blueprintProject').val(projName);
                        }
                        (function(blueprint) {
                            $liRead.click(function(e) {
                                var $blueprintReadContainerCFT = $('#modalForReadCFT');
                                $('.modal-title').html('Blueprint Information-Docker');
                                $blueprintReadContainerCFT.modal('show');
                                //for getting the blueprint name
                                $blueprintReadContainerCFT.find('.modal-body #blueprintNameCFT').val(blueprint.name);
                                $blueprintReadContainerCFT.find('.modal-body #blueprintTemplateTypeCFT').val(blueprint.templateType);
                                getOrgProjDetails($blueprintReadContainerCFT);
                            });
                        })(data[i]);
                    } else {
                        $selectVer = $('<select style="padding:1px;padding-left:5px;"></select>').addClass('blueprintVersionDropDown').attr('data-blueprintId', data[i]._id);
                        if (data[i].templateType === 'chef' || data[i].templateType === 'ami') {
                            $selectVerEdit.hide();
                            $selectVer.hide();
                            //code for info about blueprints
                            (function(blueprint) {
                                $liRead.click(function(e) {
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
                                            console.log(data);
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
                                            alert(data.toString());
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
                                        //for getting the version
                                        $blueprintReadContainer.find('.modal-body #instanceVersion').val(blueprint.blueprintConfig.infraManagerData.versionsList[j].ver);
                                    }
                                    $blueprintReadContainer.find('.modal-body #blueprintTemplateType').val(blueprint.templateType);
                                    getOrgProjDetails($blueprintReadContainer);
                                });
                            })(data[i]);
                        } else if (data[i].templateType === 'cft' || data[i].templateType === 'arm') {
                            $selectVerEdit.hide();
                            $selectVer.hide();
                            (function(blueprint) {
                                $liRead.click(function(e) {
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
                                    $.ajax({
                                        type: "get",
                                        dataType: "json",
                                        async: false,
                                        url: "../organizations/getTreeNew",
                                        success: function(dataTree) {
                                            console.log(data);
                                            data = JSON.parse(JSON.stringify(data));
                                            for (var j = 0; j < dataTree.length; j++) {
                                                (function(j) {
                                                    $blueprintReadContainerCFT.find('.modal-body #blueprintORG').val(dataTree[j].name);
                                                    for (var p = 0; p < dataTree[j].businessGroups.length; p++) {
                                                        (function(p) {
                                                            $blueprintReadContainerCFT.find('.modal-body #blueprintBU').val(dataTree[j].businessGroups[p].name);
                                                            for (var x = 0; x < dataTree[j].businessGroups[p].projects.length; x++) {
                                                                $blueprintReadContainerCFT.find('.modal-body #blueprintProject').val(dataTree[j].businessGroups[p].projects[x].name);
                                                            }
                                                        })
                                                        (p);
                                                    }
                                                })
                                                (j);
                                            }
                                        }
                                    });
                                });
                            })(data[i]);
                        }
                        $selectVerEdit.click(function(e) {
                            var $parent = $(this).parents('.cardimage');
                            var $blueprintEditResultContainer = $('#blueprintEditResultContainer');
                            $blueprintEditResultContainer.modal('show');
                            var projectId = $parent.attr('data-projectId');
                            var envId = $parent.attr('data-envId');
                            var blueprintId = $parent.attr('data-blueprintId');
                            var chefServerId = $parent.attr('data-chefServerId');
                            var version = $parent.find('.blueprintVersionDropDown').val();
                            $.get('../blueprints/' + blueprintId + '/versions/' + version, function(versionData) {
                                console.log('blueprint data', versionData);
                                var $ccrs = $chefCookbookRoleSelector(reqBodyNew.orgId, function(data) {}, versionData.runlist);
                                $ccrs.find('#cookbooksrecipesselectedList').attr('data-blueprintId', blueprintId);
                                $blueprintEditResultContainer.find('.modal-body').empty().append($ccrs).data('$ccrs', $ccrs);
                            }).error(function() {
                                $blueprintEditResultContainer.find('.modal-body').empty();
                                $blueprintEditResultContainer.find('.modal-body').append('<span>Oops! Something went wrong. Please try again later</span>');
                            });
                        });
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
                        if (typeof data[i].blueprintConfig.infraManagerData !== 'undefined') {
                            for (var j = 0; j < data[i].blueprintConfig.infraManagerData.versionsList.length; j++) {
                                var $options = $('<option></option>').append(data[i].blueprintConfig.infraManagerData.versionsList[j].ver).val(data[i].blueprintConfig.infraManagerData.versionsList[j].ver);
                                $selectVer.append($options);
                            }
                        }
                    }
                    $selecteditBtnContainer.append($li);
                    $itemBody.append($ul);
                    $itemBody.append($selecteditBtnContainer);
                    $itemContainer.append($itemBody);
                    $currRolePanel.append($itemContainer);
                    //enabling the bluepintContiner div when item added.
                    $currRolePanel.closest('.blueprintContainer').removeClass('hidden');
                    $currRolePanel.parent().parent().show();
                    //Attaching the selection event.
                    if (i == (data.length - 1)) {
                        var $productdiv1 = $('.productdiv1');
                        $productdiv1.click(function(e) {
                            $productdiv1.removeClass('role-Selected1');
                            $(this).addClass('role-Selected1');
                        });
                    }
                }
            })(i);
        }
        if ($('#accordion-2').length > 0) {
            console.log('object ==>', $('#accordion-2').find('.blueprintContainer:not(.hidden)').first().find('.panel-heading a'));
            $('#accordion-2').find('.blueprintContainer:not(.hidden)').first().find('.panel-heading a').click();
        }
    }); //end of readmasterjson to be pushed to the end of the function.
    $('#accordion-2').on('show.bs.collapse', function(e) {
        console.log(e.target);
        $(e.target).find('.productdiv1').first().click();
    });
    //Expanding the fist Accordion.
};
//for removing the selected blueprint in the Existing Blueprints tab
function removeSelectedBlueprint() {
    var blueprintId = $('.productdiv1.role-Selected1').attr('data-blueprintid');
    if (blueprintId) {
        bootbox.confirm("Are you sure you would like to remove this blueprint?", function(result) {
            if (!result) {
                return;
            } else {
                $.ajax({
                    url: '/blueprints/' + blueprintId,
                    type: 'DELETE',
                    success: function(data) {
                        if (data) {
                            var $bcc = $('.productdiv1.role-Selected1').closest('.blueprintContainer');
                            $('.productdiv1.role-Selected1').parent().detach();
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
$('#dockerRepoInputId').trigger('click');
$(".repoTypeSelectorRadioBtn").click(function() {
    var val = $(this).attr('data-repotype');
    $('.repoTypeClass').hide();
    $('#' + val).show();
});
