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
            var managedInstancesLength = dataManaged.length;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.length;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('.managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(awsSpecificProvName);
              //Managned data passed to loadManagedInstances function to populate data in table.
              loadManagedInstances(dataManaged);
            });

            $.get('../providers/' + providerid + '/unmanagedInstances', function(dataUnmanaged) {
              $childUnmanagedInstanceTemplate.find('.countUnmangedInstance').empty().append(dataUnmanaged.length);
              var unmanagedData = dataUnmanaged.length;

              updateTotalCount("unmanaged", providerid, unmanagedData);

              totalManagedUnmanagedData = managedData + unmanagedData;

              updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);
              awstotalinstancecount = awstotalinstancecount + totalManagedUnmanagedData;

              $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            });
          });

          $childProviderTemplate.find('.providerSpecificMoreInfo').click(function() {
            $('#mainPanelId').hide();
            $('#trackedInstancesSpecProviderTableContainer').show();

            $.get('../tracked-instances?filterBy=providerId:'+providerid, function(data) {
              console.log("Hit specific");
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
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');
          
          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-yellow');
          
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
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');

          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-blue');
          
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
          $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');
          
          var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
          $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
          $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');
          
          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-red');
          
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

  function loadManagedInstances(managnedData) {
    $instanceManagedDatatable.clear().draw();
    var $tbody = $('#managedInstance tbody').empty();
    for (var i = 0; i < managnedData.length; i++) {
      var $tr = $('<tr class="managedInstance"></tr>').attr('data-id', managnedData[i]._id);
      var $tdId = $('<td></td>').append(managnedData[i].platformId);
      $tr.append($tdId);

      var $tdOs = $('<td></td>').append(managnedData[i].hardware.os);
      $tr.append($tdOs);

      var $tdIpAddress = $('<td></td>').append(managnedData[i].instanceIP);
      $tr.append($tdIpAddress);

      var region = '';
      if (managnedData[i].providerData && managnedData[i].providerData.region) {
        region = managnedData[i].providerData.region;
      }
      var $tdRegion = $('<td></td>').append(region);
      $tr.append($tdRegion);
      var $tdStatus = $('<td></td>').append(managnedData[i].instanceState);
      $tr.append($tdStatus);

      var $tdProjectName = $('<td></td>').append(managnedData[i].projectName);
      $tr.append($tdProjectName);

      $tbody.append($tr);
      $instanceManagedDatatable.row.add($tr).draw();
    }
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

      var $tdorgId = $('<td></td>').append(allProviderData.trackedInstances[i].orgId);
      $tr.append($tdorgId);

      var $tdbgId = $('<td></td>').append(allProviderData.trackedInstances[i].bgId);
      $tr.append($tdbgId);

      var $tdprojectName = $('<td></td>').append(allProviderData.trackedInstances[i].projectName);
      $tr.append($tdprojectName);

      var $tdenvironmentName = $('<td></td>').append(allProviderData.trackedInstances[i].environmentName);
      $tr.append($tdenvironmentName);

      var $tdos = $('<td></td>').append(allProviderData.trackedInstances[i].os);
      $tr.append($tdos);

      var $tdip = $('<td></td>').append(allProviderData.trackedInstances[i].ip);
      $tr.append($tdip);

      var $tdproviderType = $('<td></td>').append(allProviderData.trackedInstances[i].providerType);
      $tr.append($tdproviderType);

      var $tdcost = $('<td></td>').append(allProviderData.trackedInstances[i].averageCpuUtilization);
      $tr.append($tdcost);

      /*var $tdusage = $('<td></td>').append(allProviderData.trackedInstances[i].usage.CPUUtilization.average);
      $tr.append($tdusage);*/

      $tdavgCpuUtilization = '<span>'+allProviderData.trackedInstances[i].usage.CPUUtilization.average+'</span><a class="btn btn-primary btn-sm width25padding4marginleft10"><i class="fa fa-list"></i></a>';

      var $tdusage = $('<td></td>').append($tdavgCpuUtilization);
      $tr.append($tdusage);
      /*var $tdOs = $('<td></td>').append(managnedData[i].hardware.os);
      $tr.append($tdOs);

      var $tdIpAddress = $('<td></td>').append(managnedData[i].instanceIP);
      $tr.append($tdIpAddress);

      var region = '';
      if (managnedData[i].providerData && managnedData[i].providerData.region) {
        region = managnedData[i].providerData.region;
      }
      var $tdRegion = $('<td></td>').append(region);
      $tr.append($tdRegion);
      var $tdStatus = $('<td></td>').append(managnedData[i].instanceState);
      $tr.append($tdStatus);

      var $tdProjectName = $('<td></td>').append(managnedData[i].projectName);
      $tr.append($tdProjectName);*/

      $tbody.append($tr);
      $allProviderTrackedInstanceDatatable.row.add($tr).draw();
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
      },{
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

      var $tdorgId = $('<td></td>').append(specProviderData.trackedInstances[i].orgId);
      $tr.append($tdorgId);

      var $tdbgId = $('<td></td>').append(specProviderData.trackedInstances[i].bgId);
      $tr.append($tdbgId);

      var $tdprojectName = $('<td></td>').append(specProviderData.trackedInstances[i].projectName);
      $tr.append($tdprojectName);

      var $tdenvironmentName = $('<td></td>').append(specProviderData.trackedInstances[i].environmentName);
      $tr.append($tdenvironmentName);

      var $tdos = $('<td></td>').append(specProviderData.trackedInstances[i].os);
      $tr.append($tdos);

      var $tdip = $('<td></td>').append(specProviderData.trackedInstances[i].ip);
      $tr.append($tdip);

      var $tdproviderType = $('<td></td>').append(specProviderData.trackedInstances[i].providerType);
      $tr.append($tdproviderType);

      var $tdcost = $('<td></td>').append(specProviderData.trackedInstances[i].averageCpuUtilization);
      $tr.append($tdcost);

      /*var $tdusage = $('<td></td>').append(specProviderData.trackedInstances[i].usage.CPUUtilization.average);
      $tr.append($tdusage);*/

      $tdavgCpuUtilization = '<span>'+specProviderData.trackedInstances[i].usage.CPUUtilization.average+'</span><a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages"><i class="fa fa-list"></i></a>';

      var $tdusage = $('<td></td>').append($tdavgCpuUtilization);
      $tr.append($tdusage);

      $tbody.append($tr);
      $specProviderTrackedInstanceDatatable.row.add($tr).draw();
      $specProviderTrackedInstanceDatatable.on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    }
  }

  function specProviderUsagesClickHandler(){
    var $usageModalContainer = $('#usageModalContainer');
    $usageModalContainer.modal('show');
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
});