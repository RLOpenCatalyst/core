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

      $('#totalManagedInstancesMoreInfo').on('click',function(){
        $('#mainPanelId').hide();
        $('#trackedManagedInstancesAllProviderTableContainer').show();
        loadAllManagedInstances();
      });

      $('#totalAssignedInstancesMoreInfo').on('click',function(){
        $('#mainPanelId').hide();
        $('#trackedAssignedInstancesAllProviderTableContainer').show();
        loadAllAssignedInstances();
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
            var managedInstancesLength = dataManaged.metaData.totalRecords;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalManagedUnmanagedData;
            var managedData = dataManaged.metaData.totalRecords;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(awsSpecificProvName);
              loadManagedInstances(providerid);
            });

            $.get('../providers/' + providerid + '/unmanagedInstances', function(dataUnmanaged) {
              var unmanagedData = dataUnmanaged.metaData.totalRecords;
              $childUnmanagedInstanceTemplate.find('.countUnmangedInstance').empty().append(unmanagedData);


              updateTotalCount("unmanaged", providerid, unmanagedData);

              totalManagedUnmanagedData = managedData + unmanagedData;

              updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);
              awstotalinstancecount = awstotalinstancecount + totalManagedUnmanagedData;

              $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
              $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function() {
                $('#mainPanelId').hide();
                $('#unmanagedTableContainer').show();
                $('#providerforunManagedInstId').empty().append(awsSpecificProvName);
                loadAssignedInstances(providerid);
              });
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

            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(azureProvidersName);
              loadManagedInstances(providerid);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(azureProvidersName);
              loadAssignedInstances(providerid);
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

            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(vmwareProvidersName);
              loadManagedInstances(providerid);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(vmwareProvidersName);
              loadAssignedInstances(providerid);
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

            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#managedTableContainer').show();
              $('#providerforManagedInstId').empty().append(openstackSpecificProvName);
              loadManagedInstances(providerid);
            });

            var unmanagedData = 0;
            updateTotalCount("unmanaged", providerid, unmanagedData);
            totalManagedUnmanagedData = managedData + unmanagedData;

            updateTotalCount("managedunmanaged", providerid, totalManagedUnmanagedData);

            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalManagedUnmanagedData);
            $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unmanagedTableContainer').show();
              $('#providerforunManagedInstId').empty().append(openstackSpecificProvName);
              loadAssignedInstances(providerid);
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



  //From unmanaged instances
  $('#backfrmunManagedInstance').click(function() {
    $('#mainPanelId').show();
    $('#unmanagedTableContainer').hide();
  });


  function loadManagedInstances(providerId){
    $('#managedinstanceListTable').DataTable({
      "processing": true,
      "serverSide": true,
      "destroy":true,
      "ajax": '/providers/' + providerId + '/managedInstanceList',
      "columns": [
        {"data": "platformId","orderable" : true},
        {"data": "orgName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "projectName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "environmentName","orderable" : true,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "hardware.os","orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "instanceIP","orderable" : true},
        {"data": "","orderable" : true,
          "render":function(data, type, full, meta) {
              return full.region?full.region:full.providerData?full.providerData.region:'-';
          }
        },
        {"data": "instanceState","orderable" : true  }
      ]
    });
  }

  function loadAllManagedInstances(){
    $('#allProviderTrackedManagedInstanceListTable').DataTable({
      "processing": true,
      "serverSide": true,
      "destroy":true,
      "ajax": '/tracked-instances?category=managed',
      "columns": [
        {"data": "platformId","orderable" : true},
        {"data": "orgName" ,"orderable" : false,
          "render": function(data){
              return data?data:'';
          }
        },
        {"data": "projectName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "environmentName","orderable" : true,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "hardware.os","orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "instanceIP","orderable" : true},
        {"data": "instanceState","orderable" : true},
        {"data": "providerType","orderable" : true,
          "render": function(data){
            if(data === 'aws'){
              return 'AWS';
            }else if(data === 'azure'){
              return 'Azure';
            }else if(data === 'vmware'){
              return 'VMWare';
            }else if(data === 'openstack'){
              return 'OpenStack';
            }
          }
        },
        {"data": "","orderable" : false,
          "render":function(data, type, full, meta) {
              return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2):'-';
          }
        },
        {"data": "usage","orderable" : false,
          "render":function(data, type, full, meta) {
            return full.usage ? '<span>'+full.usage.CPUUtilization.average+'&nbsp;%</span>'+
                  '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
          }
        }
      ]
    });
  }

  function loadAssignedInstances(providerId){
    $('#unmanagedinstanceListTable').DataTable( {
      "processing": true,
      "serverSide": true,
      "destroy":true,
      "createdRow": function( row, data ) {
        $( row ).attr({"data-id" : data._id})
      },
      "ajax": '/providers/' + providerId + '/unmanagedInstanceList',
      "columns": [
        {"data": "platformId","orderable" : true  },
        {"data": "orgName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "projectName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "environmentName","orderable" : true,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "os","orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "ip","orderable" : true  },
        {"data": "","orderable" : true,
          "render":function(data, type, full, meta) {
            return full.region?full.region:full.providerData?full.providerData.region:'-';
          }
        },
        {"data": "state","orderable" : true  }
      ]
    });
  }

  function loadAllAssignedInstances(){
    $('#allProviderTrackedAssignedInstanceListTable').DataTable( {
      "processing": true,
      "serverSide": true,
      "destroy":true,
      "createdRow": function( row, data ) {
        $( row ).attr({"data-id" : data._id})
      },
      "ajax": '/tracked-instances?category=assigned',
      "columns": [
        {"data": "platformId","orderable" : true  },
        {"data": "orgName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "projectName" ,"orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "environmentName","orderable" : true,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "os","orderable" : false,
          "render": function(data){
            return data?data:'';
          }
        },
        {"data": "ip","orderable" : true  },
        {"data": "state","orderable" : true  },
        {"data": "providerType","orderable" : true,
            "render": function(data){
              if(data === 'aws'){
                return 'AWS';
              }else if(data === 'azure'){
                return 'Azure';
              }else if(data === 'vmware'){
                return 'VMWare';
              }else if(data === 'openstack'){
                return 'OpenStack';
              }
            }
        },
        {"data": "","orderable" : false,
          "render":function(data, type, full, meta) {
            return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2):'-';
          }
        },
        {"data": "usage","orderable" : false,
          "render":function(data, type, full, meta) {
            return full.usage ? '<span>'+full.usage.CPUUtilization.average+'&nbsp;%</span>'+
            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
          }
        }
      ]
    });
  }

  $('#allProviderTrackedManagedInstanceListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);
  $('#allProviderTrackedAssignedInstanceListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);
  //For all Managed  tracked instances.
  $('#backfrmallprovidertrackedManagedInstance').click(function() {
    $('#mainPanelId').show();
    $('#trackedManagedInstancesAllProviderTableContainer').hide();
  });

  //For all Assigned  tracked instances.
  $('#backfrmallprovidertrackedAssignedInstance').click(function() {
    $('#mainPanelId').show();
    $('#trackedAssignedInstancesAllProviderTableContainer').hide();
  });

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