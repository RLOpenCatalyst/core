$(document).ready(function() {
  var managedTotal = 0,
      unmanagedTotal = 0,
      managedunmanagedTotal = 0;


  function updateTotalCount(type, id, count) {
    if (type === "managed") {
      managedTotal += count;
      $('#totalmanagedInstances').html(managedTotal);
    }
    if (type === "unmanaged") {
      unmanagedTotal += count;
      $('#totalunmanagedInstances').html(unmanagedTotal);
    }
    if (type === "managedunmanaged") {
      managedunmanagedTotal += count;
      $('#totalInstances').html(managedunmanagedTotal);
    }
  }
  $.get('../allproviders/list', function(totalProviders) {
    var totalcountproviders;
    var awsproviderscount = totalProviders.awsProviders.length;
    var openstackproviderscount = totalProviders.openstackProviders.length;
    var vmwareproviderscount = totalProviders.vmwareProviders.length;
    var hpplubliccloudproviderscount = totalProviders.hpPlublicCloudProviders.length;
    var azureproviderscount = totalProviders.azureProviders.length;


    totalcountproviders = awsproviderscount + openstackproviderscount + vmwareproviderscount + hpplubliccloudproviderscount + azureproviderscount;
    $('#totalProviders').empty();
    $('#awsProviderView').empty();
    $('#openstackProviderView').empty();
    $('#vmwareProvidersView').empty();
    $('#hpPlublicCloudProvidersView').empty();
    $('#azureProvidersView').empty();

    if (totalcountproviders > 0) {
      var $presentProviderView = $('.infrastructureClass');
      $presentProviderView.show();
      $('#totalProviders').append(totalcountproviders);

      $('#providerMoreInfo').on('click',function(){
        $('#mainPanelId').hide();
        $('#trackedInstancesAllProviderTableContainer').show();
        $.get('../tracked-instances', function(data) {
          loadtrackedallProviderInstances(data);
        }).fail(function() {
          //TO DO
          alert("Tracked Instances not properly Loaded");
        });
      });

      var awstotalinstancecount = 0;

      for (var i = 0; i < awsproviderscount; i++) {
        (function(i) {
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var awsSpecificProvName = totalProviders.awsProviders[i].providerName;
          $childProviderTemplate.find('.providerName').empty().append(awsSpecificProvName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var providerid = totalProviders.awsProviders[i]._id;

          var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
          $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          $.get('../providers/' + providerid + '/managedInstances', function(dataManaged) {
            var managedInstancesLength = dataManaged.managedInstances.length;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.managedInstances.length;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('.managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(awsSpecificProvName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              loadManagedInstances(providerid);
            });

            $.get('../providers/' + providerid + '/unmanagedInstanceList', function(dataUnmanaged) {
              var unmanagedData = dataUnmanaged.unmanagedInstances.length;
              $childUnmanagedInstanceTemplate.find('.countUnmangedInstance').empty().append(unmanagedData);


              updateTotalCount("unmanaged", providerid, unmanagedData);

              totalManagedUnmanagedData = managedData + unmanagedData;

              updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);
              awstotalinstancecount = awstotalinstancecount + totalManagedUnmanagedData;

              $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
              $childUnmanagedInstanceTemplate.find('.unmanagedInstSpecificMoreInfo').click(function() {
                $('#mainPanelId').hide();
                $('#unmanagedTableContainer').show();
                $('#providerforunManagedInstId').empty().append(awsSpecificProvName);
                //Managned data passed to loadManagedInstances function to populate data in table.
                loadunManagedInstances(dataUnmanaged.unmanagedInstances);
              });
            });
          });

          $childTotalInstanceTemplate.find('.providerSpecificMoreInfo').click(function() {
            $('#mainPanelId').hide();
            $('#trackedInstancesSpecProviderTableContainer').show();

            $.get('../tracked-instances?filterBy=providerId:'+providerid, function(data) {
              //var trackedInstancesData = data.trackedInstances;
              loadtrackedspecProviderInstances(data);
            }).fail(function() {
              //TO DO
              alert("Tracked Instances for specific provider not properly Loaded");
            });
          });

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childManagedInstanceTemplate);
          $rowTemplate.append($childUnmanagedInstanceTemplate);

          $childUnmanagedInstanceTemplate.css({
            display: 'block'
          });
          $childManagedInstanceTemplate.css({
            display: 'block'
          });
          $childTotalInstanceTemplate.css({
            display: 'block'
          });
          $childProviderTemplate.css({
            display: 'block'
          });
          $rowTemplate.css({
            display: 'block'
          });
          $('#awsProviderView').append($rowTemplate);
        })(i);
      }
      for(var j=0;j<azureproviderscount;j++){
        (function(j){
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var azureProvidersName = totalProviders.azureProviders[j].providerName;
          $childProviderTemplate.find('.providerName').empty().append(azureProvidersName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');

          var providerid = totalProviders.azureProviders[j]._id;

          var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
          $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');

          $.get('../providers/' + providerid + '/managedInstances', function(dataManaged) {
            var managedInstancesLength = dataManaged.managedInstances.length;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.managedInstances.length;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('.managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(azureProvidersName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              loadManagedInstances(dataManaged.managedInstances);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('.unmanagedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(azureProvidersName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              //There is no API call for unmanagedInstances so creating the dummyArray.
              var dummyArray = [];
              loadunManagedInstances(dummyArray);
              //loadunManagedInstances(dataUnmanaged.unmanagedInstances);
            });
          });

          $childTotalInstanceTemplate.find('.providerSpecificMoreInfo').click(function() {
            $('#mainPanelId').hide();
            $('#trackedInstancesSpecProviderTableContainer').show();
            $.get('../tracked-instances?filterBy=providerId:'+providerid, function(data) {
              loadtrackedspecProviderInstances(data);
            }).fail(function() {
              //TO DO
              alert("Tracked Instances for specific provider not properly Loaded");
            });
          });

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childManagedInstanceTemplate);
          $rowTemplate.append($childUnmanagedInstanceTemplate);

          $childUnmanagedInstanceTemplate.css({display:'block'});
          $childManagedInstanceTemplate.css({display:'block'});
          $childTotalInstanceTemplate.css({display:'block'});
          $childProviderTemplate.css({display:'block'});
          $rowTemplate.css({display:'block'});
          $('#azureProvidersView').append($rowTemplate);
        })(j);
      }
      for(var k=0;k<vmwareproviderscount;k++){
        (function(k){
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var vmwareProvidersName = totalProviders.vmwareProviders[k].providerName;
          $childProviderTemplate.find('.providerName').empty().append(vmwareProvidersName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');

          var providerid = totalProviders.vmwareProviders[k]._id;

          var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
          $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');





          $.get('../providers/' + providerid + '/managedInstances', function(dataManaged) {
            var managedInstancesLength = dataManaged.managedInstances.length;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.managedInstances.length;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('.managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(vmwareProvidersName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              loadManagedInstances(dataManaged.managedInstances);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('.unmanagedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(vmwareProvidersName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              //There is no API call for unmanagedInstances so creating the dummyArray.
              var dummyArray = [];
              loadunManagedInstances(dummyArray);
              //loadunManagedInstances(dataUnmanaged.unmanagedInstances);
            });
          });

          $childTotalInstanceTemplate.find('.providerSpecificMoreInfo').click(function() {
            $('#mainPanelId').hide();
            $('#trackedInstancesSpecProviderTableContainer').show();
            $.get('../tracked-instances?filterBy=providerId:'+providerid, function(data) {
              loadtrackedspecProviderInstances(data);
            }).fail(function() {
              //TO DO
              alert("Tracked Instances for specific provider not properly Loaded");
            });
          });

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childManagedInstanceTemplate);
          $rowTemplate.append($childUnmanagedInstanceTemplate);

          $childUnmanagedInstanceTemplate.css({display:'block'});
          $childManagedInstanceTemplate.css({display:'block'});
          $childTotalInstanceTemplate.css({display:'block'});
          $childProviderTemplate.css({display:'block'});
          $rowTemplate.css({display:'block'});
          $('#vmwareProvidersView').append($rowTemplate);
        })(k);
      }
      for(var l=0;l<hpplubliccloudproviderscount;l++){
        (function(l){
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var hpPlublicCloudProvidersName = totalProviders.hpPlublicCloudProviders[l].providerName;
          $childProviderTemplate.find('.providerName').empty().append(hpPlublicCloudProvidersName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-teal');

          var providerid = totalProviders.hpPlublicCloudProviders[l]._id;
          var totalInstances;

          var providerSpecificHref = "/private/index.html#ajax/Settings/CreateProviders.html?"+providerid;
          $childProviderTemplate.find('.providerSpecificMoreInfo').click(function(){
            if (top.location != location) {
              window.top.location.href = providerSpecificHref;
            }else{
              window.location.href = providerSpecificHref;
            }
          });

          var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
          $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-teal');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-teal');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-teal');

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childManagedInstanceTemplate);
          $rowTemplate.append($childUnmanagedInstanceTemplate);

          $childUnmanagedInstanceTemplate.css({display:'block'});
          $childManagedInstanceTemplate.css({display:'block'});
          $childTotalInstanceTemplate.css({display:'block'});
          $childProviderTemplate.css({display:'block'});
          $rowTemplate.css({display:'block'});
          $('#hpPlublicCloudProvidersView').append($rowTemplate);
        })(l);
      }
      for(var m=0;m<openstackproviderscount;m++){
        (function(m){
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var openstackSpecificProvName = totalProviders.openstackProviders[m].providerName;
          $childProviderTemplate.find('.providerName').empty().append(openstackSpecificProvName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');

          var providerid = totalProviders.openstackProviders[m]._id;

          var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
          $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');

          $.get('../providers/' + providerid + '/managedInstances', function(dataManaged) {
            var managedInstancesLength = dataManaged.managedInstances.length;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.managedInstances.length;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('.managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(openstackSpecificProvName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              loadManagedInstances(dataManaged.managedInstances);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('.unmanagedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(openstackSpecificProvName);
              //Managned data passed to loadManagedInstances function to populate data in table.

              //There is no API call for unmanagedInstances so creating the dummyArray.
              var dummyArray = [];
              loadunManagedInstances(dummyArray);
              //loadunManagedInstances(dataUnmanaged.unmanagedInstances);
            });
          });

          $childTotalInstanceTemplate.find('.providerSpecificMoreInfo').click(function() {
            $('#mainPanelId').hide();
            $('#trackedInstancesSpecProviderTableContainer').show();
            $.get('../tracked-instances?filterBy=providerId:'+providerid, function(data) {
              loadtrackedspecProviderInstances(data);
            }).fail(function() {
              //TO DO
              alert("Tracked Instances for specific provider not properly Loaded");
            });
          });

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childManagedInstanceTemplate);
          $rowTemplate.append($childUnmanagedInstanceTemplate);

          $childUnmanagedInstanceTemplate.css({display:'block'});
          $childManagedInstanceTemplate.css({display:'block'});
          $childTotalInstanceTemplate.css({display:'block'});
          $childProviderTemplate.css({display:'block'});
          $rowTemplate.css({display:'block'});
          $('#openstackProviderView').append($rowTemplate);
        })(m);
      }
    } else {
      $('.noProviderView').show();
    }
  }).fail(function() {

  });
  $('#backfrmManagedInstance').click(function() {
    $('#mainPanelId').show();
    $('#managedTableContainer').hide();
  });

  function loadManagedInstances(providerId) {
    $('#managedinstanceListTable').DataTable( {
      "processing": true,
      "serverSide": true,
      "destroy": true,
      "ajax": '/providers/' + providerId + '/managedInstanceList',
      "columns": [
        {"data": "platformId","orderable" : true  },
        {"data": "os","orderable" : false  },
        {"data": "instanceIP","orderable" : true  },
        {"data": "","orderable" : true,
          "render":function(data, type, full, meta) {
            var region =full.region;
            if(region){
              region = full.region;
            }else{
              region = full.providerData.region;
            }
            return region;
          }
        },
        {"data": "instanceState","orderable" : true  },
        {"data": "projectName" ,"orderable" : false },
        {"data": "environmentName","orderable" : true  }
      ]
    } );
  }

  if (!$.fn.dataTable.isDataTable('#managedinstanceListTable')) {
    var $instanceManagedDatatable = $('#managedinstanceListTable').DataTable({
      "pagingType": "full_numbers",
      "bInfo": true,
      "bLengthChange": true,
      "paging": true,
      "bFilter": true,
      "aaSorting": [
        [4, "asc"]
      ],
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
      },{
        "bSortable": false
      }]

    });
  }
  $('#managedinstanceListTable_info').addClass('font-size12');
  $('#managedinstanceListTable_paginate').addClass('font-size12');

  //From unmanaged instances
  $('#backfrmunManagedInstance').click(function() {
    $('#mainPanelId').show();
    $('#unmanagedTableContainer').hide();
  });




  function loadunManagedInstances(unmanagnedData) {
    $instanceunManagedDatatable.clear().draw();
    var $tbody = $('#unmanagedInstance tbody').empty();
    for (var i = 0; i < unmanagnedData.length; i++) {
      var $tr = $('<tr class="unmanagedInstance"></tr>').attr('data-id', unmanagnedData[i]._id);
      var $tdId = $('<td></td>').append(unmanagnedData[i].platformId);
      $tr.append($tdId);

      if(unmanagnedData[i].os){
        var $tdOs = $('<td></td>').append(unmanagnedData[i].os);
        $tr.append($tdOs);
      }else{
        var $tdOs = $('<td></td>').append('');
        $tr.append($tdOs);
      }

      var $tdIpAddress = $('<td></td>').append(unmanagnedData[i].ip);
      $tr.append($tdIpAddress);

      var region = '';
      if (unmanagnedData[i].providerData && unmanagnedData[i].providerData.region) {
        region = unmanagnedData[i].providerData.region;
      }
      var $tdRegion = $('<td></td>').append(region);
      $tr.append($tdRegion);
      var $tdStatus = $('<td></td>').append(unmanagnedData[i].state);
      $tr.append($tdStatus);

      var $tdProjectName = $('<td></td>').append(unmanagnedData[i].projectName);
      $tr.append($tdProjectName);

      $tbody.append($tr);
      $instanceunManagedDatatable.row.add($tr).draw();
    }
  }

  if (!$.fn.dataTable.isDataTable('#unmanagedinstanceListTable')) {
    var $instanceunManagedDatatable = $('#unmanagedinstanceListTable').DataTable({
      "pagingType": "full_numbers",
      "bInfo": true,
      "bLengthChange": true,
      "paging": true,
      "bFilter": true,
      "aaSorting": [
        [4, "asc"]
      ],
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
      },{
        "bSortable": false
      }]

    });
  }
  $('#unmanagedinstanceListTable_info').addClass('font-size12');
  $('#unmanagedinstanceListTable_paginate').addClass('font-size12');

  //For all provider tracked instances.
  $('#backfrmallprovidertrackedInstance').click(function() {
    $('#mainPanelId').show();
    $('#trackedInstancesAllProviderTableContainer').hide();
  });

  function loadtrackedallProviderInstances(allProviderData) {
    $allProviderTrackedInstanceDatatable.clear().draw();
    var $tbody = $('#allProviderTrackedInstance tbody').empty();
    for (var i = 0; i < allProviderData.trackedInstances.length; i++) {
      var $tr = $('<tr class="allproviderTrackedInstance"></tr>').attr('data-id', allProviderData.trackedInstances[i].id);

      var $tdinstancePlatformId = $('<td></td>').append(allProviderData.trackedInstances[i].instancePlatformId);
      $tr.append($tdinstancePlatformId);

      var $tdorgId = $('<td></td>').append(allProviderData.trackedInstances[i].orgName);
      $tr.append($tdorgId);

      /*var $tdbgId = $('<td></td>').append(allProviderData.trackedInstances[i].bgName);
       $tr.append($tdbgId);*/

      var $tdprojectName = $('<td></td>').append(allProviderData.trackedInstances[i].projectName);
      $tr.append($tdprojectName);

      var $tdenvironmentName = $('<td></td>').append(allProviderData.trackedInstances[i].environmentName);
      $tr.append($tdenvironmentName);

      var $tdos = $('<td></td>').append(allProviderData.trackedInstances[i].os);
      $tr.append($tdos);

      var $tdip = $('<td></td>').append(allProviderData.trackedInstances[i].ip);
      $tr.append($tdip);

      if(allProviderData.trackedInstances[i].providerType){
        var $tdproviderType = $('<td></td>').append(allProviderData.trackedInstances[i].providerType.toUpperCase());
        $tr.append($tdproviderType);
      }else{
        var $tdproviderType = $('<td></td>').append(allProviderData.trackedInstances[i].providerType);
        $tr.append($tdproviderType);
      };
      var $tdstatus = $('<td></td>').append(allProviderData.trackedInstances[i].instanceState);
      $tr.append($tdstatus);

      if(allProviderData.trackedInstances[i].cost)
        var $tdcost = $('<td></td>').append(allProviderData.trackedInstances[i].cost);
      else
        var $tdcost = $('<td></td>').append('-');
      $tr.append($tdcost);

      if(allProviderData.trackedInstances[i].usage)
        $tdavgCpuUtilization = '<span>'+allProviderData.trackedInstances[i].usage.CPUUtilization.average+'&nbsp;%</span>'+
            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage='+JSON.stringify(allProviderData.trackedInstances[i].usage)+'><i class="fa fa-list"></i></a>';
      else
        $tdavgCpuUtilization = '<span>&nbsp;-&nbsp;</span>';
      var $tdusage = $('<td></td>').append($tdavgCpuUtilization);
      $tr.append($tdusage);

      $tbody.append($tr);
      $allProviderTrackedInstanceDatatable.row.add($tr).draw();
      $allProviderTrackedInstanceDatatable.on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    }
  }

  if (!$.fn.dataTable.isDataTable('#allProviderTrackedInstanceListTable')) {
    var $allProviderTrackedInstanceDatatable = $('#allProviderTrackedInstanceListTable').DataTable({
      "pagingType": "full_numbers",
      "bInfo": true,
      "bLengthChange": true,
      "paging": true,
      "bFilter": true,
      "aaSorting": [
        [4, "asc"]
      ],
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
      },{
        "bSortable": false
      },{
        "bSortable": false
      },{
        "bSortable": false
      }, {
        "bSortable": false
      },{
        "bSortable": false
      }]

    });
  }
  $('#allProviderTrackedInstanceListTable_info').addClass('font-size12');
  $('#allProviderTrackedInstanceListTable_paginate').addClass('font-size12');



  //For Specific Provider details

  $('#backfrmspecprovidertrackedInstance').click(function() {
    $('#mainPanelId').show();
    $('#trackedInstancesSpecProviderTableContainer').hide();
  });

  function loadtrackedspecProviderInstances(specProviderData) {
    $specProviderTrackedInstanceDatatable.clear().draw();
    var $tbody = $('#specProviderTrackedInstance tbody').empty();
    for (var i = 0; i < specProviderData.trackedInstances.length; i++) {
      var $tr = $('<tr class="specproviderTrackedInstance"></tr>').attr('data-id', specProviderData.trackedInstances[i].id);

      var $tdinstancePlatformId = $('<td></td>').append(specProviderData.trackedInstances[i].instancePlatformId);
      $tr.append($tdinstancePlatformId);

      var $tdorgId = $('<td></td>').append(specProviderData.trackedInstances[i].orgName);
      $tr.append($tdorgId);

      /*var $tdbgId = $('<td></td>').append(specProviderData.trackedInstances[i].bgName);
       $tr.append($tdbgId);*/

      var $tdprojectName = $('<td></td>').append(specProviderData.trackedInstances[i].projectName);
      $tr.append($tdprojectName);

      var $tdenvironmentName = $('<td></td>').append(specProviderData.trackedInstances[i].environmentName);
      $tr.append($tdenvironmentName);

      var $tdos = $('<td></td>').append(specProviderData.trackedInstances[i].os);
      $tr.append($tdos);

      var $tdip = $('<td></td>').append(specProviderData.trackedInstances[i].ip);
      $tr.append($tdip);

      var $tdproviderType = $('<td></td>').append(specProviderData.trackedInstances[i].providerType.toUpperCase());
      $tr.append($tdproviderType);

      var $tdstatus = $('<td></td>').append(specProviderData.trackedInstances[i].instanceState);
      $tr.append($tdstatus);

      if(specProviderData.trackedInstances[i].cost)
        var $tdcost = $('<td></td>').append(specProviderData.trackedInstances[i].cost);
      else
        var $tdcost = $('<td></td>').append('-');
      $tr.append($tdcost);

      if(specProviderData.trackedInstances[i].usage)
        $tdavgCpuUtilization = '<span>'+specProviderData.trackedInstances[i].usage.CPUUtilization.average+'&nbsp;%</span>'+
            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage='+JSON.stringify(specProviderData.trackedInstances[i].usage)+'><i class="fa fa-list"></i></a>';
      else
        $tdavgCpuUtilization = '<span>&nbsp;-&nbsp;</span>';
      var $tdusage = $('<td></td>').append($tdavgCpuUtilization);
      $tr.append($tdusage);

      $tbody.append($tr);
      $specProviderTrackedInstanceDatatable.row.add($tr).draw();
      $specProviderTrackedInstanceDatatable.on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    }
  }

  if (!$.fn.dataTable.isDataTable('#specProviderTrackedInstanceListTable')) {
    var $specProviderTrackedInstanceDatatable = $('#specProviderTrackedInstanceListTable').DataTable({
      "pagingType": "full_numbers",
      "bInfo": true,
      "bLengthChange": true,
      "paging": true,
      "bFilter": true,
      "aaSorting": [
        [4, "asc"]
      ],
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
      },{
        "bSortable": false
      },{
        "bSortable": false
      },{
        "bSortable": false
      },{
        "bSortable": false
      },{
        "bSortable": false
      }]

    });
  }
  $('#specProviderTrackedInstanceListTable_info').addClass('font-size12');
  $('#specProviderTrackedInstanceListTable_paginate').addClass('font-size12');


  //Function to get the specific provider usages.
  function specProviderUsagesClickHandler(){
    var $specUsageModalContainer = $('#specUsageModalContainer');
    var dataStr = $(this).attr("data-usage");
    var $data = JSON.parse(dataStr);

    $specUsageModalContainer.find('#specCpuUtilAvg').html($data.CPUUtilization.average);
    $specUsageModalContainer.find('#specCpuUtilMin').html($data.CPUUtilization.minimum);
    $specUsageModalContainer.find('#specCpuUtilMax').html($data.CPUUtilization.maximum);

    $specUsageModalContainer.find('#specDiskReadAvg').html($data.DiskReadBytes.average);
    $specUsageModalContainer.find('#specDiskReadMin').html($data.DiskReadBytes.minimum);
    $specUsageModalContainer.find('#specDiskReadMax').html($data.DiskReadBytes.maximum);

    $specUsageModalContainer.find('#specDiskWriteAvg').html($data.DiskWriteBytes.average);
    $specUsageModalContainer.find('#specDiskWriteMin').html($data.DiskWriteBytes.minimum);
    $specUsageModalContainer.find('#specDiskWriteMax').html($data.DiskWriteBytes.maximum);

    $specUsageModalContainer.find('#specNetworkOutAvg').html($data.NetworkOut.average);
    $specUsageModalContainer.find('#specNetworkOutMin').html($data.NetworkOut.minimum);
    $specUsageModalContainer.find('#specNetworkOutMax').html($data.NetworkOut.maximum);

    $specUsageModalContainer.find('#specNetworkInAvg').html($data.NetworkIn.average);
    $specUsageModalContainer.find('#specNetworkInMin').html($data.NetworkIn.minimum);
    $specUsageModalContainer.find('#specNetworkInMax').html($data.NetworkIn.maximum);

    $specUsageModalContainer.modal('show');
  }
});