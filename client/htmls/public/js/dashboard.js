$(document).ready(function () {
    var managedTotal = 0,
        unmanagedTotal = 0,
        unassignedTotal = 0,
        managedunmanagedTotal = 0,
        awstotalinstancecount = 0;

    function updateTotalCount(type, id, count) {
        if (type === "managed") {
            managedTotal += count;
            $('#totalmanagedInstances').html(managedTotal);
        }
        if (type === "unmanaged") {
            unmanagedTotal += count;
            $('#totalunmanagedInstances').html(unmanagedTotal);
        }
        if (type === "unassigned") {
            unassignedTotal += count;
            $('#totalunassignedInstances').html(unassignedTotal);
        }
        if (type === "managedunmanaged") {
            managedunmanagedTotal += count;
            $('#totalInstances').html(managedunmanagedTotal);
        }
    }

    function generateProviderRow(providerDetail, providerView, bgClass) {

        var $rowTemplate = $('.rowTemplate').clone();
        $rowTemplate.removeClass('rowTemplate');

        var $childProviderTemplate = $('.childProviderTemplate').clone();
        $childProviderTemplate.removeClass('childProviderTemplate');
        var providerName = providerDetail.providerName;
        $childProviderTemplate.find('.providerName').empty().append(providerName);
        $childProviderTemplate.find('.small-box').removeClass('bg-aqua').addClass(bgClass);

        var providerid = providerDetail._id;

        var $childManagedInstanceTemplate = $('.childManagedInstanceTemplate').clone();
        $childManagedInstanceTemplate.removeClass('childManagedInstanceTemplate');
        $childManagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass(bgClass);

        var $childUnmanagedInstanceTemplate = $('.childUnmanagedInstanceTemplate').clone();
        $childUnmanagedInstanceTemplate.removeClass('childUnmanagedInstanceTemplate');
        $childUnmanagedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass(bgClass);

        var $childTotalInstanceTemplate = $('.childTotalInstanceTemplate').clone();
        $childTotalInstanceTemplate.removeClass('childTotalInstanceTemplate');
        $childTotalInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass(bgClass);

        var $childUnassignedInstanceTemplate = $('.childUnassignedInstanceTemplate').clone();
        $childUnassignedInstanceTemplate.removeClass('childUnassignedInstanceTemplate');
        $childUnassignedInstanceTemplate.find('.small-box').removeClass('bg-aqua').addClass(bgClass);

        $.get( '../resources/track/report?filterBy=providerDetails.id:'+ providerid+',resourceType:EC2', function (resources) {
            var managedInstancesLength = resources.totalManagedResources;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);
            var totalInstances;
            var managedData = resources.totalManagedResources;
            updateTotalCount("managed", providerid, managedData);
            var unmanagedData = resources.totalAssignedResources;
            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function () {
                $('#mainPanelId').hide();
                $('#managedTableContainer').show();
                $('#providerforManagedInstId').empty().append(providerName);
                loadManagedInstances(providerid);
            });
            $childUnmanagedInstanceTemplate.find('.countUnmangedInstance').empty().append(unmanagedData);
            updateTotalCount("unmanaged", providerid, unmanagedData);
            awstotalinstancecount = awstotalinstancecount + totalInstances;
            $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function () {
                $('#mainPanelId').hide();
                $('#unmanagedTableContainer').show();
                $('#providerforunManagedInstId').empty().append(providerName);
                loadAssignedInstances(providerid);
            });
            var unassignedData = resources.totalUnAssignedResources;
            $childUnassignedInstanceTemplate.find('.countUnassignedInstance').empty().append(unassignedData);
            updateTotalCount("unassigned", providerid, unassignedData);
            totalInstances = managedData + unmanagedData + unassignedData;
            updateTotalCount("managedunmanaged", providerid, totalInstances);
            awstotalinstancecount = awstotalinstancecount + totalInstances;
            $childTotalInstanceTemplate.find('.countTotalInstance').empty().append(totalInstances);
            $childUnassignedInstanceTemplate.find('#unassignedInstSpecificMoreInfo').click(function () {
                $('#mainPanelId').hide();
                $('#unassignedTableContainer').show();
                $('#providerforunAssignedInstId').empty().append(providerName);
                loadUnassignedInstances(providerid);
            });
        });
        $rowTemplate.append($childProviderTemplate);
        $rowTemplate.append($childTotalInstanceTemplate);
        $rowTemplate.append($childManagedInstanceTemplate);
        $rowTemplate.append($childUnmanagedInstanceTemplate);
        $rowTemplate.append($childUnassignedInstanceTemplate);

        $childUnassignedInstanceTemplate.css({
            display: 'block'
        });
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
        providerView.append($rowTemplate);
    }
    $.get('../allproviders/list', function (totalProviders) {
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
            var providerDetail, providerView;
            for (var i = 0; i < awsproviderscount; i++) {
                providerDetail = totalProviders.awsProviders[i];
                providerView = $('#awsProviderView');
                generateProviderRow(providerDetail, providerView, 'bg-green');
            }
            for (var j = 0; j < azureproviderscount; j++) {
                providerDetail = totalProviders.azureProviders[j];
                providerView = $('#azureProvidersView');
                generateProviderRow(providerDetail, providerView, 'bg-yellow');
            }
            for (var k = 0; k < vmwareproviderscount; k++) {
                providerDetail = totalProviders.vmwareProviders[k];
                providerView = $('#vmwareProvidersView');
                generateProviderRow(providerDetail, providerView, 'bg-blue');
            }
            for (var l = 0; l < hpplubliccloudproviderscount; l++) {
                providerDetail = totalProviders.hpPlublicCloudProviders[l];
                providerView = $('#vmwareProvidersView');
                generateProviderRow(providerDetail, providerView, 'bg-teal');
            }
            for (var m = 0; m < openstackproviderscount; m++) {
                providerDetail = totalProviders.openstackProviders[j];
                providerView = $('#openstackProviderView');
                generateProviderRow(providerDetail, providerView, 'bg-red');
            }
        } else {
            $('.noProviderView').show();
            $('#totalProviders').append(totalcountproviders);
        }
    }).fail(function () {

    });
    $('#backfrmManagedInstance').click(function () {
        $('#mainPanelId').show();
        $('#managedTableContainer').hide();
    });



    //From unmanaged instances
    $('#backfrmunManagedInstance').click(function () {
        $('#mainPanelId').show();
        $('#unmanagedTableContainer').hide();
    });

    //From unassigned instances
    $('#backfrmunAssignedInstance').click(function () {
        $('#mainPanelId').show();
        $('#unassignedTableContainer').hide();
    });


    function loadManagedInstances(providerId) {
        $('#managedinstanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": {
                "url":'/resources?filterBy=providerDetails.id:'+ providerId+',resourceType:EC2,category:managed',
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
                {"data": "resourceDetails.platformId", "orderable": true},
                {"data": "masterDetails.orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "masterDetails.bgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "masterDetails.projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "masterDetails.envName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "resourceDetails.os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "resourceDetails.publicIp", "orderable": true,
                    "render": function(data, type, full){
                        if(data !== null){
                            return data;
                        }else{
                            return full.resourceDetails.privateIp;
                        }
                    }
                },
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.providerDetails.region.region ? full.providerDetails.region.region : '-';
                    }
                },
                {"data": "resourceDetails.state", "orderable": true},
                {"data": "", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2) : '-';
                    }
                },
                {"data": "usage", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.usage ? '<span>' + full.usage.CPUUtilization.average + '&nbsp;%</span>' +
                            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage=' + full._id + '><i class="fa fa-list"></i></a>' : '-';
                    }
                }
            ]
        });
    }

    function loadAssignedInstances(providerId) {
        $('#unmanagedinstanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "createdRow": function (row, data) {
                $(row).attr({"data-id": data._id})
            },
            "ajax": {
                "url":'/resources?filterBy=providerDetails.id:'+ providerId+',resourceType:EC2,category:assigned',
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
                {"data": "resourceDetails.platformId", "orderable": true},
                {"data": "masterDetails.orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "masterDetails.bgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "masterDetails.projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "masterDetails.envName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '-';
                    }
                },
                {"data": "resourceDetails.os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "resourceDetails.publicIp", "orderable": true,
                    "render": function(data, type, full){
                        if(data !== null){
                            return data;
                        }else{
                            return full.resourceDetails.privateIp;
                        }
                    }
                },
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.providerDetails.region ? full.providerDetails.region.region : '-';
                    }
                },
                {"data": "resourceDetails.state", "orderable": true},
                {"data": "", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2) : '-';
                    }
                },
                {"data": "usage", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.usage ? '<span>' + full.usage.CPUUtilization.average + '&nbsp;%</span>' +
                            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage=' + full._id + '><i class="fa fa-list"></i></a>' : '-';
                    }
                }
            ]
        });
    }

    function loadUnassignedInstances(providerId) {
        $('#unassignedinstanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "createdRow": function (row, data) {
                $(row).attr({"data-id": data._id})
            },
            "ajax": {
                "url":'/resources?filterBy=providerDetails.id:'+ providerId+',resourceType:EC2,category:unassigned',
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
                {"data": "resourceDetails.platformId", "orderable": true},
                {"data": "masterDetails.orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "resourceDetails.os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "resourceDetails.publicIp", "orderable": true,
                    "render": function(data, type, full){
                        if(data !== null){
                            return data;
                        }else{
                            return full.resourceDetails.privateIp;
                        }
                    }
                },
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.providerDetails.region ? full.providerDetails.region.region : '-';
                    }
                },
                {"data": "resourceDetails.state", "orderable": true},
                {"data": "", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2) : '-';
                    }
                },
                {"data": "usage", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.usage ? '<span>' + full.usage.CPUUtilization.average + '&nbsp;%</span>' +
                            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right" title="Usage Details" data-usage=' + full._id + '><i class="fa fa-list"></i></a>' : '-';
                    }
                }
            ]
        });
    }

    $('#managedinstanceListTable tbody').on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    $('#unmanagedinstanceListTable tbody').on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    $('#unassignedinstanceListTable tbody').on('click', '.specProviderUsages', specProviderUsagesClickHandler);
    //For all Managed  tracked instances.
    $('#backfrmallprovidertrackedManagedInstance').click(function () {
        $('#mainPanelId').show();
        $('#trackedManagedInstancesAllProviderTableContainer').hide();
    });

    //For all Assigned  tracked instances.
    $('#backfrmallprovidertrackedAssignedInstance').click(function () {
        $('#mainPanelId').show();
        $('#trackedAssignedInstancesAllProviderTableContainer').hide();
    });
    var previousChartId = null;
    function setCurrentChart(chartId) {
        $('#' + chartId).slideDown("slow");
        previousChartId = chartId;
        $(window).trigger('resize');
    }
    $('#metricSelector').change(function () {
        var chartId = $(this).val();
        if (previousChartId) {
            $('#' + previousChartId).slideUp("slow", function () {
                setCurrentChart(chartId);
            });
        } else {
            setCurrentChart(chartId);

        }
    });

    //Function to get the specific provider usages.
    function specProviderUsagesClickHandler() {
        previousChartId = null;
        $('#metricSelector').val('CPUUtilization');
        $('.chartContainer').hide();
        var $specUsageModalContainer = $('#specUsageModalContainer');
        var instanceId = $(this).attr("data-usage");
        var toTimeString = new Date().toISOString().slice(0, 19);
        var ts = Math.round(new Date().getTime() / 1000);
        var tsYesterday = ts - (24 * 3600);
        var fromTimeString = new Date(tsYesterday * 1000).toISOString().slice(0, 19);

        //in seconds
        var interval = '3600'; // 1 hour
        var url = '/analytics/trend/usage?resource=' + instanceId + '&fromTimeStamp=' + fromTimeString + '&toTimeStamp=' + toTimeString + '&interval=' + interval;
        $.ajax(url)
            .done(function (data) {

                //CPU Utilization Graph
                if (data.CPUUtilization) {
                    $('#chartCPUUtilization').empty();
                    var chartCPUUtilization = new Morris.Line({
                        element: 'chartCPUUtilization',
                        resize: true,
                        data: data.CPUUtilization.dataPoints,
                        xkey: 'toTime',
                        ykeys: ['average'],
                        yLabelFormat: function (y) { return y.toFixed(2)+data.CPUUtilization.symbol; },
                        dateFormat: function (x) { return new Date(x).toString(); },
                        labels: ['Utilization'],
                        lineColors: ['#3c8dbc'],
                        postUnits: data.CPUUtilization.symbol,
                        hideHover: 'auto'
                    });
                }

                //Network Out Graph
                if (data.NetworkOut) {
                    $('#chartNetworkOut').empty();
                    var NetworkOut = new Morris.Line({
                        element: 'chartNetworkOut',
                        resize: true,
                        data: data.NetworkOut.dataPoints,
                        xkey: 'toTime',
                        ykeys: ['average'],
                        dateFormat: function (x) { return new Date(x).toString(); },
                        labels: ['Network Out'],
                        lineColors: ['#A52A2A'],
                        postUnits: data.NetworkOut.symbol,
                        hideHover: 'auto'
                    });
                }
                //Network In Graph
                if (data.NetworkIn) {
                    $('#chartNetworkIn').empty();
                    var NetworkIn = new Morris.Line({
                        element: 'chartNetworkIn',
                        resize: true,
                        data: data.NetworkIn.dataPoints,
                        xkey: 'toTime',
                        ykeys: ['average'],
                        dateFormat: function (x) { return new Date(x).toString(); },
                        labels: ['Network In'],
                        lineColors: ['#00008B'],
                        postUnits: data.NetworkIn.symbol,
                        hideHover: 'auto'
                    });
                }
                //Disk Read Graph
                if (data.DiskReadBytes) {
                    $('#chartDiskReadBytes').empty();
                    var DiskReadBytes = new Morris.Line({
                        element: 'chartDiskReadBytes',
                        resize: true,
                        data: data.DiskReadBytes.dataPoints,
                        xkey: 'toTime',
                        ykeys: ['average'],
                        dateFormat: function (x) { return new Date(x).toString(); },
                        labels: ['Disk Read'],
                        lineColors: ['#006400'],
                        postUnits: data.DiskReadBytes.symbol,
                        hideHover: 'auto'
                    });
                }
                //Disk Read Graph
                if (data.DiskWriteBytes) {
                    $('#chartDiskWriteBytes').empty();
                    var DiskWriteBytes = new Morris.Line({
                        element: 'chartDiskWriteBytes',
                        resize: true,
                        data: data.DiskWriteBytes.dataPoints,
                        xkey: 'toTime',
                        ykeys: ['average'],
                        dateFormat: function (x) { return new Date(x).toString(); },
                        labels: ['Disk Write'],
                        lineColors: ['#2F4F4F'],
                        postUnits: data.DiskWriteBytes.symbol,
                        hideHover: 'auto'
                    });
                }
                $('#metricSelector').trigger('change');
            })
            .fail(function () {
                console.log("error");
            })
            .always(function () {
                console.log("complete");
            });

        $specUsageModalContainer.modal('show');
    }
});