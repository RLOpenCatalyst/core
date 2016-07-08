function getTreeDetails(){
    $.ajax({
        type: "get",
        dataType: "json",
        async: false,
        url: "../organizations/getTreeNew",
        success: function(data) {
            data = JSON.parse(JSON.stringify(data));
            var $orgListInput = $('#orgnameSelectExisting');
            var $bgList = $('#bgListInputExisting');
            var $projectList = $('#projectListInputExisting');
            var $envList = $('#envListExisting');
            var $projectList = $('#projectListInputExisting');
            //Dropdowns on the copy popup
            var $orgListInputforcopy = $('#orgnameSelectExistingforcopy');
            var $bgListforcopy = $('#bgListInputExistingforcopy');
            var $projectListforcopy = $('#projectListInputExistingforcopy');
            var $envListforcopy = $('#envListExistingforcopy');

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

            $bgListforcopy.change(function(e) {
                var bgName = $(this).val();
                if (bgName == 'choose') {
                    return;
                }
                var $selectedOrgOption = $(this).find(":selected");
                $projectListforcopy.empty();
                var getProjs = bgProjects[bgName];
                for (var i = 0; i < getProjs.length; i++) {
                    var $option = $('<option></option>').val(getProjs[i].rowid).html(getProjs[i].name);
                    $projectListforcopy.append($option);
                }
                $projectListforcopy.trigger('change');
            });

            var $spinnerProject = $('#spinnerProjectChange').addClass('hidden');
            $('#projectListInputExisting').change(function(e) {
                var reqBodyNew = {};
                $spinnerProject.removeClass('hidden');
                reqBodyNew.orgId = $orgListInput.val();
                reqBodyNew.bgId = $bgList.val();
                reqBodyNew.projectId = $projectList.val();
                reqBodyNew.envId = $envList.val();
                var blueprintTypeList = ["docker", "aws_cf", "instance_launch"];
                for(var i =0;i<blueprintTypeList.length;i++){
                    $.get('../organizations/' + reqBodyNew.orgId + '/businessgroups/' + reqBodyNew.bgId + '/projects/' + reqBodyNew.projectId + '/environments/' + reqBodyNew.envId + '/aws?blueprintType='+blueprintTypeList[i]+'', function(data) {
                        //Syncing up the tree view based on url
                        initializeBlueprintAreaNew(data.blueprints);
                        $spinnerProject.addClass('hidden');
                        if (data.blueprints.length > 0) {
                            $('#accordion-2').removeClass('hidden');
                            $spinnerProject.addClass('hidden');
                            $('#npbpmsg').addClass('hidden');
                        } else {
                            $spinnerProject.addClass('hidden');
                            //show no blueprints found message
                            //$('#npbpmsg').removeClass('hidden');
                        }
                    });
                }
            }); //choose env gets over

            var bgProjects = {};
            for (var i = 0; i < data.length; i++) {
                $orgListInput.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].businessGroups).data('envList', data[i].environments));
                for (var j = 0; j < data[i].businessGroups.length; j++) {
                    var rowid = data[i].businessGroups[j].rowid;
                    $bgList.append($('<option></option').val(rowid).html(data[i].businessGroups[j].name));
                    //Dropdowns on the copy popup
                    $bgListforcopy.append($('<option></option').val(rowid).html(data[i].businessGroups[j].name));


                    bgProjects[rowid] = data[i].businessGroups[j].projects;
                }
                for (var k = 0; k < data[i].environments.length; k++) {
                    $envList.append($('<option></option').val(data[i].environments[k].rowid).html(data[i].environments[k].name))
                }

                //Dropdowns on the copy popup
                $orgListInputforcopy.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].businessGroups).data('envList', data[i].environments));
            }
            $bgList.trigger('change');
            $bgListforcopy.trigger('change');
            $('.chooseOrgSelectExisting').change(function(e) {
                if ($(this).val() == 'choose') {
                    $('#accordion-2').addClass('hidden');
                }
                $('.chooseBGExisting').change();
                $('.chooseProjectExisting').change();
            });
            $('.chooseOrgSelectExistingforcopy').change(function(e) {
                $('.chooseBGExisting').change();
                $('.chooseProjectExisting').change();
            });
        }
    }); //getTreeNew gets over here
}
var runlistCheckAttribute;
var versionAttr = [];
function softwareStackListing() {
    $.ajax({
        type: "get",
        dataType: "json",
        async: false,
        url: "../organizations/getTreeNew",
        success: function(data) {
            data = JSON.parse(JSON.stringify(data));
            var $orgListInput = $('#orgnameSelectExisting');
            var $bgList = $('#bgListInputExisting');
            var $projectList = $('#projectListInputExisting');
            var $envList = $('#envListExisting');
            var $projectList = $('#projectListInputExisting');
            var $orgListInputforcopy = $('#orgnameSelectExistingforcopy');
            var $bgListforcopy = $('#bgListInputExistingforcopy');
            var $projectListforcopy = $('#projectListInputExistingforcopy');
            var $envListforcopy = $('#envListExistingforcopy');

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

            $bgListforcopy.change(function(e) {
                var bgName = $(this).val();
                if (bgName == 'choose') {
                    return;
                }
                var $selectedOrgOption = $(this).find(":selected");
                $projectListforcopy.empty();
                var getProjs = bgProjects[bgName];
                for (var i = 0; i < getProjs.length; i++) {
                    var $option = $('<option></option>').val(getProjs[i].rowid).html(getProjs[i].name);
                    $projectListforcopy.append($option);
                }
                $projectListforcopy.trigger('change');
            });
            var $spinnerProject = $('#spinnerProjectChange').addClass('hidden');
            function createBpAttributes(list){

            }
            $('#projectListInputExisting').change(function(e) {
                var reqBodyNew = {};
                $spinnerProject.removeClass('hidden');
                reqBodyNew.orgId = $orgListInput.val();
                reqBodyNew.bgId = $bgList.val();
                reqBodyNew.projectId = $projectList.val();
                reqBodyNew.envId = $envList.val();
                var blueprintTypeList = "instance_launch";
                $.get('../organizations/' + reqBodyNew.orgId + '/businessgroups/' + reqBodyNew.bgId + '/projects/' + reqBodyNew.projectId + '/environments/' + reqBodyNew.envId + '/aws?blueprintType=' + blueprintTypeList + '', function(data) {
                    //Syncing up the tree view based on url
                    var list = [], bpAttributes = [];
                    var versionOptions=[];
                    for (var i = 0; i < data.blueprints.length; i++) {
                        var item = {
                            "className": "blueprintClass",
                            "value": data.blueprints[i].name,
                            "data": {
                                "key": data.blueprints[i].name,
                                "value": data.blueprints[i]._id,
                                "bpData": data.blueprints[i]
                            }
                        };
                        var option='<option data-value="' + data.blueprints[i]._id + '" value="'+data.blueprints[i]._id+'" >'+data.blueprints[i].version+'</option>';
                        if(data.blueprints[i] && data.blueprints[i].versions){
                            for (var kk = 0; kk < data.blueprints[i].versions.length; kk++) {
                                var varLop= data.blueprints[i].versions[kk];
                                option += '<option data-value="' +varLop.id + '" value="'+varLop.id+'">'+varLop.version+'</option>';
                            }
                        }
                        versionOptions[data.blueprints[i]._id]=option;
                        if(data.blueprints[i] && data.blueprints[i].versions){
                            for (var l = 0; l < data.blueprints[i].versions.length; l++) {
                                versionOptions[data.blueprints[i].versions[l].id]=option;
                            }
                        }
                        bpAttributes[data.blueprints[i]._id] = data.blueprints[i];
                        list.push(item);
                    }
                    var selectedElements = [];
                    var compsiteBlueprint = window.chefSelectorComponent({
                        scopeElement: '#compsiteBlueprintSelecter',
                        optionList: list,
                        selectorList: selectedElements,
                        isSortList: true,
                        isSearchBoxEnable: false,
                        isOverrideHtmlTemplate: true,
                        isPriorityEnable: true,
                        isExcludeDataFromOption: false,
                    });
                    // select blueprint for edit
                    if ($('#selectorList').val() == null) {
                        $('#attributeBlue').hide();
                    } else {
                        $('#attributeBlue').show();
                    }
                    //
                    var selectedValueOnRight;
                    var _versions = [];
                    $(document).on('change', '.bpVersion', function() {
                        var thisVal=$('.bpVersion').val()
                        var selectBlueId=$('#selectorList').val();
                        $('#selectorList option:selected').prop('value',thisVal);
                        $.get('/blueprints/' + thisVal, function(blueprintdata) {
                            bpAttributes[thisVal]=blueprintdata;
                            editRunListAttribute ()
                        });
                    });
                    $('#selectorList').change(function() {
                       // manage accordion
                        editRunListAttribute();
                        if (!$('#collapsed').hasClass('collapsed')) {
                            $('#collapsed').trigger('click');
                        }
                        $('.bpVersion').html(versionOptions[$('#selectorList').val()])
                        $('.bpVersion').val($('#selectorList').val());
                    });
                    function editRunListAttribute () {
                        $tasksRunlist.clear().draw();
                        var $table = $('#attributesViewListTable').removeClass('hidden');
                        var $tbody = $table.find('tbody').empty();
                        $('#attributeBlue').show();
                        var $selectVer = $('.bpVersion');
                        selectedValueOnRight = $('#selectorList option:selected').val();
                        var runlistForTable = bpAttributes[selectedValueOnRight].blueprintConfig.infraManagerData.versionsList[0].runlist
                        createRunlistTable(runlistForTable);
                        //assigning the value to the attribute reader.
                        runlistCheckAttribute = runlistForTable;
                        $selectVer.unbind().click(function(e) {
                            //$('#CollapseEditRunlistParam').show();
                            $tasksRunlist.clear().draw();
                            $table.find('tbody').empty();
                            var lastversion = $('.bpVersion').val(); //default version
                            $.get('/blueprints/' + lastversion, function(blueprintdata) {
                               // $('#CollapseEditRunlistParam').show();
                                var blueprintRunlistOnChange = blueprintdata.blueprintConfig.infraManagerData.versionsList[0].runlist;
                                createRunlistTable(blueprintRunlistOnChange);
                                runlistCheckAttribute = blueprintRunlistOnChange;
                                // on save of composite blueprint

                            });
                        })
                    }

                    $('#saveCompBlup').unbind().click(function(e) {
                        if(!$('#blueprintName').val()){
                            alert('Please enter Composite Blueprint name!');
                            return true;
                        } if($('#selectorList option').length == 0){
                            alert('Please Select Blueprint!');
                            return true;
                        }
                        bootbox.confirm({
                            message: "Are you sure you want to save the Composite Blueprint? Press Ok To continue",
                            title: "Confirmation",
                            callback: function(result) {
                                if (!result) {
                                    return;
                                } else {
                                    var blueprintName = $('#blueprintName').val();
                                    var attributes = [],blueprintsList = [];
                                    //running a loop to extract the values of each option available in the option List
                                    var $selectorList = $('#selectorList');
                                    $selectorList.find('option').each(function() {
                                        blueprintsList.push({
                                            id: $(this).val(),
                                            attributes: versionAttr[$(this).val()]
                                        });
                                    });

                                    var url, bpData = {};
                                    url = '../composite-blueprints/';
                                    reqBody = {
                                        "name": blueprintName,
                                        "organizationId":$('#orgnameSelectExisting').val(),
                                        "businessGroupId": $('#bgListInputExisting').val(),
                                        "projectId": $('#projectListInputExisting').val(),
                                        "blueprints": blueprintsList
                                    };

                                    $.ajax({
                                        method: "POST",
                                        url: url,
                                        data: reqBody,
                                        success: function(data, success) {
                                            bootbox.hideAll();
                                            alert('Successfully Created a Composite Blueprint');
                                            $('.previous').trigger('click');
                                            initializeCompositeBP();
                                        },
                                        error: function(jxhr) {
                                            var msg = "Server Behaved Unexpectedly";
                                            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                                                msg = jxhr.responseJSON.message;
                                            } else if (jxhr.responseText) {
                                                msg = jxhr.responseText;
                                            }
                                            bootbox.alert(msg);
                                        },
                                        failure: function(jxhr) {
                                            var msg = "Server Behaved Unexpectedly";
                                            if (jxhr.responseJSON && jxhr.responseJSON.message) {
                                                msg = jxhr.responseJSON.message;
                                            } else if (jxhr.responseText) {
                                                msg = jxhr.responseText;
                                            }
                                            bootbox.alert(msg);
                                        }
                                    });
                                    return false;
                                }
                            }
                        });
                        //save ends in next line
                    })
                    $spinnerProject.addClass('hidden');
                    if (data.blueprints.length > 0) {
                        $('#npbpmsgComposite').addClass('hidden');
                        $('#compositeDivision').show();
                    } else {
                        //show no blueprints found message
                        $('#compositeDivision').hide();
                        $('#npbpmsgComposite').removeClass('hidden');
                    }
                });
            }); //choose env gets over

            var bgProjects = {};
            for (var i = 0; i < data.length; i++) {
                $orgListInput.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].businessGroups).data('envList', data[i].environments));
                for (var j = 0; j < data[i].businessGroups.length; j++) {
                    var rowid = data[i].businessGroups[j].rowid;
                    $bgList.append($('<option></option').val(rowid).html(data[i].businessGroups[j].name));
                    //Dropdowns on the copy popup
                    $bgListforcopy.append($('<option></option').val(rowid).html(data[i].businessGroups[j].name));
                    bgProjects[rowid] = data[i].businessGroups[j].projects;
                }
                for (var k = 0; k < data[i].environments.length; k++) {
                    $envList.append($('<option></option').val(data[i].environments[k].rowid).html(data[i].environments[k].name))
                }

                //Dropdowns on the copy popup
                $orgListInputforcopy.append($('<option></option>').val(data[i].rowid).html(data[i].name).data('bglist', data[i].businessGroups).data('envList', data[i].environments));
            }
            $bgList.trigger('change');
            $bgListforcopy.trigger('change');
            $('.chooseOrgSelectExisting').change(function(e) {
                if ($(this).val() == 'choose') {
                    $('#accordion-2').addClass('hidden');
                }
                $('.chooseBGExisting').change();
                $('.chooseProjectExisting').change();
            });
            $('.chooseOrgSelectExistingforcopy').change(function(e) {
                $('.chooseBGExisting').change();
                $('.chooseProjectExisting').change();
            });
        }
    }); //getTreeNew gets over here
}

function sortResults(versions, prop, asc) {
    versions = versions.sort(function(a, b) {
        a[prop] = parseInt(a[prop]);
        b[prop] = parseInt(b[prop]);
        if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
        else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
    });
    return (versions);
}

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


function editAtrributesHandlers() {
    var runlist = runlistCheckAttribute;
    if (runlist.length == 0) {
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
    var chefServerDetails = "/d4dMasters/readmasterjsonnew/10";
    var chefServerId;
    $.get(chefServerDetails,function(data){
    for(var i =0 ; i<data.length;i++){
    chefServerId = data[i].rowid;
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
    }
    });
    return false;
}

function createAttribTableRowFromJson(attributes) {
    var $table = $('#attributesViewListTable').removeClass('hidden');
    var $tbody = $table.find('tbody').empty();
    var versionSelectDropdown  = $('.bpVersion').val();
    
    versionAttr[versionSelectDropdown] = attributes;
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


function saveAtrributesHandler(e) {
    var $modal = $('#editAttributesModalContainer');
    var $tbody = $modal.find('.attributesEditTableBody');
    var $input = $tbody.find('.attribValueInput');
    var attributes = [];
    for (var j = 0; j < $input.length; j++) {
        var $this = $($input[j]);
        var attributeKey = $this.attr('data-attribKey');
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
    createAttribTableRowFromJson(attributes);
    $modal.modal('hide');
}

