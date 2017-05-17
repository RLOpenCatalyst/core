$(document).ready(function() {
  var managedTotal = 0,
      unmanagedTotal = 0,
      managedunmanagedTotal = 0;


  function updateTotalCount(type, id, count) {
      if (type === "assigned") {
          managedTotal += count;
          $('#totalS3AssignedBuckets').html(managedTotal);
      }
      if (type === "unassigned") {
          unmanagedTotal += count;
          $('#totalS3UnAssignedBuckets').html(unmanagedTotal);
      }
      if (type === "assignedUnassigned") {
          managedunmanagedTotal += count;
          $('#totalBuckets').html(managedunmanagedTotal);
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
        $('#allAssignedS3BucketsMoreInfo').on('click',function(){
            $('#mainPanelId').hide();
            $('#allAssignedS3TableContainer').show();
            loadAllAssignedS3Buckets();
        });

        $('#allUnAssignedS3BucketsMoreInfo').on('click',function(){
            $('#mainPanelId').hide();
            $('#allUnAssignedS3TableContainer').show();
            loadAllUnAssignedS3Buckets();
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

          var $childS3ManagedInstanceTemplate = $('.childS3ManagedInstanceTemplate').clone();
          $childS3ManagedInstanceTemplate.removeClass('childS3ManagedInstanceTemplate');
          $childS3ManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childS3UnmanagedInstanceTemplate = $('.childS3UnmanagedInstanceTemplate').clone();
          $childS3UnmanagedInstanceTemplate.removeClass('childS3UnmanagedInstanceTemplate');
          $childS3UnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
          $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
          $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass('bg-green');

          $childS3ManagedInstanceTemplate.find('#assignedS3BucketsMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#assignedS3TableContainer').show();
              $('#providerforAssignedS3Id').empty().append(awsSpecificProvName);
              loadAssignedS3Buckets(providerId);
            });

          $childS3UnmanagedInstanceTemplate.find('#unAssignedS3BucketsMoreInfo').click(function() {
              $('#mainPanelId').hide();
              $('#unAssignedS3TableContainer').show();
              $('#providerforUnAssignedS3Id').empty().append(awsSpecificProvName);
              loadUnAssignedS3Buckets(providerId);
          });

          $.get('../resources/resourceList?filterBy=providerId:'+ providerId +',resourceType:S3,category:assigned', function(assignedS3Buckets){
            var s3AssignedBucketsLength = assignedS3Buckets.metaData.totalRecords;
              $childS3ManagedInstanceTemplate.find('.countAssignedBuckets').empty().append(s3AssignedBucketsLength);

            var totalAssignedUnAssignedData;
            updateTotalCount("assigned", providerId, s3AssignedBucketsLength);


          

            $.get('../resources/resourceList?filterBy=providerId:'+ providerId +',resourceType:S3,category:unassigned', function(unAssignedS3Buckets) {
              var s3UnAssignedBucketsLength = unAssignedS3Buckets.metaData.totalRecords;
                $childS3UnmanagedInstanceTemplate.find('.countUnAssignedBuckets').empty().append(s3UnAssignedBucketsLength);


              updateTotalCount("unassigned", providerId, s3UnAssignedBucketsLength);

                totalAssignedUnAssignedData = s3AssignedBucketsLength + s3UnAssignedBucketsLength;

              updateTotalCount("assignedUnassigned", providerId, totalAssignedUnAssignedData);
              awstotalinstancecount = awstotalinstancecount + totalAssignedUnAssignedData;

              $childTotalInstanceTemplate.find('.countTotalBuckets').empty().append(totalAssignedUnAssignedData);
              
            });
          });

          $rowTemplate.append($childProviderTemplate);
          $rowTemplate.append($childTotalInstanceTemplate);
          $rowTemplate.append($childS3ManagedInstanceTemplate);
          $rowTemplate.append($childS3UnmanagedInstanceTemplate);
          
          $childS3UnmanagedInstanceTemplate.css({
            display: 'block'
          });
          $childS3ManagedInstanceTemplate.css({
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


  function loadAssignedS3Buckets(providerId) {
    $('#assignedS3ListTable').DataTable({
        "processing": true,
        "serverSide": true,
        "destroy":true,
        "ajax": {
            "url": '/resources?filterBy=providerId:'+ providerId +',resourceType:S3,category:assigned',
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
            {"data": "resourceDetails.bucketName", "orderable" : true},
            {"data": "resourceDetails.bucketOwnerName" ,"orderable" : false },
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
            {"data": "masterDetails.projectName" ,"orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "masterDetails.envName" ,"orderable" : false,
                "render": function (data) {
                    if(data !== null){
                        return data;
                    }else{
                        return '-';
                    }
                }
            },
            {"data": "resourceDetails.bucketSize","orderable" : true  },
            {"data": "resourceDetails.bucketCreatedOn","orderable" : true,
                "render": function (data) {
                    var date = new Date().setTime(data.timestamp);
                    var taskTimestamp = new Date(data).toLocaleString();
                    return taskTimestamp;
                }
            }
        ]
    });
  }

    function loadAllAssignedS3Buckets() {
        $('#allAssignedS3ListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy":true,
            "ajax": {
                "url": '/resources?filterBy=resourceType:S3,category:assigned',
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
                {"data": "resourceDetails.bucketName", "orderable" : true},
                {"data": "resourceDetails.bucketOwnerName" ,"orderable" : false },
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
                {"data": "masterDetails.projectName" ,"orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "masterDetails.envName" ,"orderable" : false,
                    "render": function (data) {
                        if(data !== null){
                            return data;
                        }else{
                            return '-';
                        }
                    }
                },
                {"data": "resourceDetails.bucketSize","orderable" : true  },
                {"data": "resourceDetails.bucketCreatedOn","orderable" : true,
                    "render": function (data) {
                        var date = new Date().setTime(data.timestamp);
                        var taskTimestamp = new Date(data).toLocaleString();
                        return taskTimestamp;
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateResourceCost).toFixed(2):'-';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.usage ? '<span>'+full.usage.NumberOfObjects.average+'</span>'+
                        '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
                    }
                }
            ]
        });
    }

  function loadUnAssignedS3Buckets(providerId) {
      $('#unassignedS3ListTable').DataTable( {
          "processing": true,
          "serverSide": true,
          "destroy":true,
          "ajax": '/resources?filterBy=providerId:'+ providerId +',resourceType:S3,category:unassigned',
          "createdRow": function( row, data ) {
              $( row ).attr({"resourceId" : data._id,"resourceType":data.resourceType})
          },
          "columns": [
              {"data": "resourceDetails.bucketName", "orderable" : true},
              {"data": "resourceDetails.bucketOwnerName" ,"orderable" : false },
              {"data": "resourceDetails.bucketSize","orderable" : true  },
              {"data": "resourceDetails.bucketCreatedOn","orderable" : true,
                  "render": function (data) {
                      var date = new Date().setTime(data.timestamp);
                      var taskTimestamp = new Date(data).toLocaleString();
                      return taskTimestamp;
                  }
              }
          ]
      });
  }

    function loadAllUnAssignedS3Buckets() {
        $('#allUnassignedS3ListTable').DataTable( {
            "processing": true,
            "serverSide": true,
            "destroy":true,
            "ajax": '/resources?filterBy=resourceType:S3,category:unassigned',
            "createdRow": function( row, data ) {
                $( row ).attr({"resourceId" : data._id,"resourceType":data.resourceType})
            },
            "columns": [
                {"data": "resourceDetails.bucketName", "orderable" : true},
                {"data": "resourceDetails.bucketOwnerName" ,"orderable" : false },
                {"data": "resourceDetails.bucketSize","orderable" : true  },
                {"data": "resourceDetails.bucketCreatedOn","orderable" : true,
                    "render": function (data) {
                        var date = new Date().setTime(data.timestamp);
                        var taskTimestamp = new Date(data).toLocaleString();
                        return taskTimestamp;
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateResourceCost).toFixed(2):'-';
                    }
                },
                {"data": "","orderable" : false,
                    "render":function(data, type, full, meta) {
                        return full.usage ? '<span>'+full.usage.NumberOfObjects.average+'</span>'+
                        '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage='+JSON.stringify(full.usage)+'><i class="fa fa-list"></i></a>':'-';
                    }
                }
            ]
        });
    }

  $('#allAssignedS3ListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);
  $('#allUnassignedS3ListTable tbody').on( 'click', '.specProviderUsages', specProviderUsagesClickHandler);

  $('#backfromUnAssignedS3Instance').click(function() {
    $('#mainPanelId').show();
    $('#unAssignedS3TableContainer').hide();
  });

  $('#backfromAssignedS3Instance').click(function() {
    $('#mainPanelId').show();
    $('#assignedS3TableContainer').hide();
  });


  $('#backfromAllUnAssignedS3Instance').click(function() {
    $('#mainPanelId').show();
    $('#allUnAssignedS3TableContainer').hide();
  });

  $('#backfromAllAssignedS3Instance').click(function() {
    $('#mainPanelId').show();
    $('#allAssignedS3TableContainer').hide();
  });


    //Function to get the specific provider usages.
    function specProviderUsagesClickHandler(){
        var $specUsageModalContainer = $('#specUsageModalContainer');
        var dataStr = $(this).attr("data-usage");
        var $data = JSON.parse(dataStr);

        $specUsageModalContainer.find('#specBucketSizeAvg').html(Math.round($data.BucketSizeBytes.average/1048576));
        $specUsageModalContainer.find('#specBucketSizeMin').html(Math.round($data.BucketSizeBytes.minimum/1048576));
        $specUsageModalContainer.find('#specBucketSizeMax').html(Math.round($data.BucketSizeBytes.maximum/1048576));

        $specUsageModalContainer.find('#specNumOfObjectsAvg').html($data.NumberOfObjects.average);
        $specUsageModalContainer.find('#specNumOfObjectsMin').html($data.NumberOfObjects.minimum);
        $specUsageModalContainer.find('#specNumOfObjectsMax').html($data.NumberOfObjects.maximum);

        $specUsageModalContainer.modal('show');
    }
});