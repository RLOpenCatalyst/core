$(document).ready(function() {
  var managedTotal = 0,
      unmanagedTotal = 0,
      managedunmanagedTotal = 0;


  function updateTotalCount(type, id, count) {
    if (type === "assigned") {
      managedTotal += count;
      $('#totalAssignedDBInstances').html(managedTotal);
    }
    if (type === "unassigned") {
      unmanagedTotal += count;
      $('#totalUnAssignedDBInstances').html(unmanagedTotal);
    }
    if (type === "assignedUnassigned") {
      managedunmanagedTotal += count;
      $('#totalDBInstances').html(managedunmanagedTotal);
    }
  }
  $.get('../aws/providers', function(totalProviders) {
    var totalcountproviders;
    var awsproviderscount = totalProviders.length;


    totalcountproviders = awsproviderscount ;
    $('#totalProviders').empty();
    $('#awsProviderView').empty();
      if (totalcountproviders == 0) {
          $('#totalProviders').append(totalcountproviders);
      }
    if (totalcountproviders > 0) {
      var $presentProviderView = $('.infrastructureClass');
      $presentProviderView.show();
      $('#totalProviders').append(totalcountproviders);

        $('#allAssignedDBInstancesMoreInfo').on('click',function(){
            $('#mainPanelId').hide();
            $('#allAssignedRDSTableContainer').show();
            loadAllAssignedRDSDBInstances();
        });

        $('#allUnAssignedDBInstancesMoreInfo').on('click',function(){
            $('#mainPanelId').hide();
            $('#allUnAssignedTableContainer').show();
            loadAllUnAssignedDBInstances();
        });

      var awstotalinstancecount = 0;

      for (var i = 0; i < awsproviderscount; i++) {
        (function(i) {
          var $rowTemplate = $('.rowTemplate').clone();
          $rowTemplate.removeClass('rowTemplate');

          var $childProviderTemplate = $('.childProviderTemplate').clone();
          $childProviderTemplate.removeClass('childProviderTemplate');
          var awsSpecificProvName = totalProviders[i].providerName;
          $childProviderTemplate.find('.providerName').empty().append(awsSpecificProvName);
          $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var providerId = totalProviders[i]._id;

          var $childRDSAssignedDBInstanceTemplate = $('.childManagedInstanceTemplate').clone();
            $childRDSAssignedDBInstanceTemplate.removeClass('childManagedInstanceTemplate');
            $childRDSAssignedDBInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childRDSUnAssignedDBInstancesTemplate = $('.childUnmanagedInstanceTemplate').clone();
            $childRDSUnAssignedDBInstancesTemplate.removeClass('childUnmanagedInstanceTemplate');
            $childRDSUnAssignedDBInstancesTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

            $childRDSAssignedDBInstanceTemplate.find('#assignedDBInstancesMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#assignedRDSTableContainer').show();
              $('#providerforAssignedDBInstId').empty().append(awsSpecificProvName);
              loadAssignedRDSDBInstances(providerId);
            });

            $childRDSUnAssignedDBInstancesTemplate.find('#unAssignedDBInstancesMoreInfo').click(function() {
                $('#mainPanelId').hide();
                $('#unAssignedRDSTableContainer').show();
                $('#providerforUnAssignedDBInstId').empty().append(awsSpecificProvName);
              loadUnAssignedDBInstances(providerId);
          });

            $.get('../resources/resourceList?filterBy=providerId:'+ providerId +',resourceType:RDS,category:assigned', function(assignedRDSDBInstances){
                var rdsAssignedDBInstancesLength = assignedRDSDBInstances.metaData.totalRecords;
                $childRDSAssignedDBInstanceTemplate.find('.countAssignedDBInstance').empty().append(rdsAssignedDBInstancesLength);

                var totalAssignedUnAssignedData;
                updateTotalCount("assigned", providerId, rdsAssignedDBInstancesLength);




                $.get('../resources/resourceList?filterBy=providerId:'+ providerId +',resourceType:RDS,category:unassigned', function(unAssignedDBInstances) {
                    var rdsUnAssignedDBInstancesLength = unAssignedDBInstances.metaData.totalRecords;
                    $childRDSUnAssignedDBInstancesTemplate.find('.countUnAssignedDBInstance').empty().append(rdsUnAssignedDBInstancesLength);


                    updateTotalCount("unassigned", providerId, rdsUnAssignedDBInstancesLength);

                    totalAssignedUnAssignedData = rdsAssignedDBInstancesLength + rdsUnAssignedDBInstancesLength;

                    updateTotalCount("assignedUnassigned", providerId, totalAssignedUnAssignedData);
                    awstotalinstancecount = awstotalinstancecount + totalAssignedUnAssignedData;

                    $childTotalInstanceTemplate.find('.countTotalDBInstance').empty().append(totalAssignedUnAssignedData);

                });
            });
          

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childRDSAssignedDBInstanceTemplate);
          $rowTemplate.append($childRDSUnAssignedDBInstancesTemplate);

          $childRDSUnAssignedDBInstancesTemplate.css({
            display: 'block'
          });
          $childRDSAssignedDBInstanceTemplate.css({
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
      
    } else {
      $('.noProviderView').show();
    }
  }).fail(function() {

  });

  function loadAssignedRDSDBInstances(providerId) {
    $('#assignedRDSListTable').DataTable({
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "ajax": {
            "url":  '/resources?filterBy=providerId:'+ providerId +',resourceType:RDS,category:assigned',
            "data": function( result ) {
                var columnIndex = parseInt(result.order[0].column);
                var newResult = {
                    draw:result.draw,
                    page:result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                    pageSize:result.length,
                    sortOrder:result.order[0].dir,
                    sortBy:result.columns[columnIndex].data,
                    filterBy:result.filterBy,
                    search:result.search.value
                }
                return newResult;
            }
        },
        "columns": [
            {"data": "resourceDetails.dbInstanceIdentifier",  "orderable" : true},
            {"data": "masterDetails.orgName","orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "masterDetails.bgName","orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "masterDetails.projectName","orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "masterDetails.envName","orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "resourceDetails.dbEngine","orderable" : true  },
            {"data": "resourceDetails.dbInstanceStatus","orderable" : true  },
            {"data": "resourceDetails.region","orderable" : false  },
            {"data": "resourceDetails.dbInstanceClass","orderable" : false  },
            {"data": "resourceDetails.multiAZ","orderable" : false,
                "render": function (data) {
                    return (data === false)? 'false':'true';
                }
            }
        ]
    });
  }

    function loadAllAssignedRDSDBInstances() {
        $('#allAssignedRDSListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy":true,
            "ajax": {
                "url":  '/resources?filterBy=resourceType:RDS,category:assigned',
                "data": function( result ) {
                    var columnIndex = parseInt(result.order[0].column);
                    var newResult = {
                        draw:result.draw,
                        page:result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                        pageSize:result.length,
                        sortOrder:result.order[0].dir,
                        sortBy:result.columns[columnIndex].data,
                        filterBy:result.filterBy,
                        search:result.search.value
                    }
                    return newResult;
                }
            },
            "columns": [
                {"data": "resourceDetails.dbInstanceIdentifier",  "orderable" : true},
                {"data": "masterDetails.orgName","orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "masterDetails.bgName","orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "masterDetails.projectName","orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "masterDetails.envName","orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "resourceDetails.dbEngine","orderable" : true  },
                {"data": "resourceDetails.dbInstanceStatus","orderable" : true  },
                {"data": "resourceDetails.region","orderable" : false  },
                {"data": "resourceDetails.dbInstanceClass","orderable" : false  },
                {"data": "resourceDetails.multiAZ","orderable" : false,
                    "render": function (data) {
                        return (data === false)? 'false':'true';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateResourceCost).toFixed(2):'-';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.usage ? '<span>'+full.usage.CPUUtilization.average+'&nbsp;%</span>'+
                        '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
                    }
                }
            ]
        });
    }

  function loadUnAssignedDBInstances(providerId){
    $('#unAssignedRDSListTable').DataTable({
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "ajax": {
            "url": '/resources?filterBy=providerId:'+ providerId +',resourceType:RDS,category:unassigned',
            "data": function( result ) {
                var columnIndex = parseInt(result.order[0].column);
                var newResult = {
                    draw:result.draw,
                    page:result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                    pageSize:result.length,
                    sortOrder:result.order[0].dir,
                    sortBy:result.columns[columnIndex].data,
                    filterBy:result.filterBy,
                    search:result.search.value
                }
                return newResult;
            }
        },
        "createdRow": function( row, data ) {
            $( row ).attr({"resourceId" : data._id,"resourceType":data.resourceType})
        },
        "columns": [
            {"data": "resourceDetails.dbInstanceIdentifier",  "orderable" : true},
            {"data": "resourceDetails.dbEngine","orderable" : true  },
            {"data": "resourceDetails.dbInstanceStatus","orderable" : true  },
            {"data": "resourceDetails.region","orderable" : false  },
            {"data": "resourceDetails.dbInstanceClass","orderable" : false  },
            {"data": "resourceDetails.multiAZ","orderable" : false,
                "render": function (data) {
                    return (data === false)? 'false':'true';
                }
            }
        ]
    });
  }

    function loadAllUnAssignedDBInstances(){
        $('#allUnAssignedRDSListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy":true,
            "ajax": {
                "url": '/resources?filterBy=resourceType:RDS,category:unassigned',
                "data": function( result ) {
                    var columnIndex = parseInt(result.order[0].column);
                    var newResult = {
                        draw:result.draw,
                        page:result.start === 0 ? 1 : Math.ceil(result.start / result.length) + 1,
                        pageSize:result.length,
                        sortOrder:result.order[0].dir,
                        sortBy:result.columns[columnIndex].data,
                        filterBy:result.filterBy,
                        search:result.search.value
                    }
                    return newResult;
                }
            },
            "createdRow": function( row, data ) {
                $( row ).attr({"resourceId" : data._id,"resourceType":data.resourceType})
            },
            "columns": [
                {"data": "resourceDetails.dbInstanceIdentifier",  "orderable" : true},
                {"data": "resourceDetails.dbEngine","orderable" : true  },
                {"data": "resourceDetails.dbInstanceStatus","orderable" : true  },
                {"data": "resourceDetails.region","orderable" : false  },
                {"data": "resourceDetails.dbInstanceClass","orderable" : false  },
                {"data": "resourceDetails.multiAZ","orderable" : false,
                    "render": function (data) {
                        return (data === false)? 'false':'true';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateResourceCost).toFixed(2):'-';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.usage ? '<span>'+full.usage.CPUUtilization.average+'&nbsp;%</span>'+
                        '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
                    }
                }
            ]
        });
    }

    $('#allAssignedRDSListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);
    $('#allUnAssignedRDSListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);

    $('#backfrmAssignedDBInstance').click(function() {
        $('#mainPanelId').show();
        $('#assignedRDSTableContainer').hide();
    });

    $('#backfrmAllAssignedDBnstance').click(function() {
        $('#mainPanelId').show();
        $('#allAssignedRDSTableContainer').hide();
    });


    $('#backfrmUnAssignedDBInstance').click(function() {
        $('#mainPanelId').show();
        $('#unAssignedRDSTableContainer').hide();
    });

    $('#backfrmAllUnAssignedDBInstance').click(function() {
        $('#mainPanelId').show();
        $('#allUnAssignedTableContainer').hide();
    });

    //Function to get the specific provider usages.
    function specProviderUsagesClickHandler(){
        var $specUsageModalContainer = $('#specUsageModalContainer');
        var dataStr = $(this).attr("data-usage");
        var $data = JSON.parse(dataStr);

        $specUsageModalContainer.find('#specCPUUtilizationAvg').html($data.CPUUtilization.average);
        $specUsageModalContainer.find('#specCPUUtilizationMin').html($data.CPUUtilization.minimum);
        $specUsageModalContainer.find('#specCPUUtilizationMax').html($data.CPUUtilization.maximum);


        $specUsageModalContainer.find('#specCpuUsageAvg').html($data.CPUCreditUsage.average);
        $specUsageModalContainer.find('#specCpuUsageMin').html($data.CPUCreditUsage.minimum);
        $specUsageModalContainer.find('#specCpuUsageMax').html($data.CPUCreditUsage.maximum);

        $specUsageModalContainer.find('#specCPUCreditBalanceAvg').html($data.CPUCreditBalance.average);
        $specUsageModalContainer.find('#specCPUCreditBalanceMin').html($data.CPUCreditBalance.minimum);
        $specUsageModalContainer.find('#specCPUCreditBalanceMax').html($data.CPUCreditBalance.maximum);

        $specUsageModalContainer.find('#specBinLogUsageAvg').html($data.BinLogDiskUsage.average);
        $specUsageModalContainer.find('#specBinLogUsageMin').html($data.BinLogDiskUsage.minimum);
        $specUsageModalContainer.find('#specBinLogUsageMax').html($data.BinLogDiskUsage.maximum);

        $specUsageModalContainer.find('#specWriteIOPSAvg').html($data.WriteIOPS.average);
        $specUsageModalContainer.find('#specWriteIOPSMin').html($data.WriteIOPS.minimum);
        $specUsageModalContainer.find('#specWriteIOPSMax').html($data.WriteIOPS.maximum);

        $specUsageModalContainer.find('#specReadIOPSAvg').html($data.ReadIOPS.average);
        $specUsageModalContainer.find('#specReadIOPSMin').html($data.ReadIOPS.minimum);
        $specUsageModalContainer.find('#specReadIOPSMax').html($data.ReadIOPS.maximum);

        $specUsageModalContainer.find('#specSwapUsageAvg').html($data.SwapUsage.average);
        $specUsageModalContainer.find('#specSwapUsageMin').html($data.SwapUsage.minimum);
        $specUsageModalContainer.find('#specSwapUsageMax').html($data.SwapUsage.maximum);

        $specUsageModalContainer.find('#specWriteThroughputAvg').html($data.WriteThroughput.average);
        $specUsageModalContainer.find('#specWriteThroughputMin').html($data.WriteThroughput.minimum);
        $specUsageModalContainer.find('#specWriteThroughputMax').html($data.WriteThroughput.maximum);

        $specUsageModalContainer.find('#specReadThroughputAvg').html($data.ReadThroughput.average);
        $specUsageModalContainer.find('#specReadThroughputMin').html($data.ReadThroughput.minimum);
        $specUsageModalContainer.find('#specReadThroughputMax').html($data.ReadThroughput.maximum);

        $specUsageModalContainer.find('#specDiskQueueDepthAvg').html($data.DiskQueueDepth.average);
        $specUsageModalContainer.find('#specDiskQueueDepthMin').html($data.DiskQueueDepth.minimum);
        $specUsageModalContainer.find('#specDiskQueueDepthMax').html($data.DiskQueueDepth.maximum);

        $specUsageModalContainer.find('#specReplicaLagAvg').html($data.ReplicaLag.average);
        $specUsageModalContainer.find('#specReplicaLagMin').html($data.ReplicaLag.minimum);
        $specUsageModalContainer.find('#specReplicaLagMax').html($data.ReplicaLag.maximum);

        $specUsageModalContainer.find('#specFreeStorageSpaceAvg').html($data.FreeStorageSpace.average);
        $specUsageModalContainer.find('#specFreeStorageSpaceMin').html($data.FreeStorageSpace.minimum);
        $specUsageModalContainer.find('#specFreeStorageSpaceMax').html($data.FreeStorageSpace.maximum);

        $specUsageModalContainer.find('#specFreeableMemoryAvg').html($data.FreeableMemory.average);
        $specUsageModalContainer.find('#specFreeableMemoryMin').html($data.FreeableMemory.minimum);
        $specUsageModalContainer.find('#specFreeableMemoryMax').html($data.FreeableMemory.maximum);

        $specUsageModalContainer.find('#specDatabaseConnectionsAvg').html($data.DatabaseConnections.average);
        $specUsageModalContainer.find('#specDatabaseConnectionsMin').html($data.DatabaseConnections.minimum);
        $specUsageModalContainer.find('#specDatabaseConnectionsMax').html($data.DatabaseConnections.maximum);

        $specUsageModalContainer.find('#specReadLatencyAvg').html($data.ReadLatency.average);
        $specUsageModalContainer.find('#specReadLatencyMin').html($data.ReadLatency.minimum);
        $specUsageModalContainer.find('#specReadLatencyMax').html($data.ReadLatency.maximum);

        $specUsageModalContainer.find('#specWriteLatencyAvg').html($data.WriteLatency.average);
        $specUsageModalContainer.find('#specWriteLatencyMin').html($data.WriteLatency.minimum);
        $specUsageModalContainer.find('#specWriteLatencyMax').html($data.WriteLatency.maximum);

        $specUsageModalContainer.find('#specNetworkReceiveThroughputAvg').html($data.NetworkReceiveThroughput.average);
        $specUsageModalContainer.find('#specNetworkReceiveThroughputMin').html($data.NetworkReceiveThroughput.minimum);
        $specUsageModalContainer.find('#specNetworkReceiveThroughputMax').html($data.NetworkReceiveThroughput.maximum);

        $specUsageModalContainer.find('#specNetworkTransmitThroughputAvg').html($data.NetworkTransmitThroughput.average);
        $specUsageModalContainer.find('#specNetworkTransmitThroughputMin').html($data.NetworkTransmitThroughput.minimum);
        $specUsageModalContainer.find('#specNetworkTransmitThroughputMax').html($data.NetworkTransmitThroughput.maximum);

        $specUsageModalContainer.modal('show');
    }
});