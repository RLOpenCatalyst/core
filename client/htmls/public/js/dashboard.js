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

        $.get('../providers/' + providerid + '/managedInstances', function (dataManaged) {
            var managedInstancesLength = dataManaged.metaData.totalRecords;
            $childManagedInstanceTemplate.find('.countMangedInstance').empty().append(managedInstancesLength);

            var totalInstances;
            var managedData = dataManaged.metaData.totalRecords;
            updateTotalCount("managed", providerid, managedData);

            $childManagedInstanceTemplate.find('#managedInstSpecificMoreInfo').click(function () {
                $('#mainPanelId').hide();
                $('#managedTableContainer').show();
                $('#providerforManagedInstId').empty().append(providerName);
                loadManagedInstances(providerid);
            });

            $.get('../providers/' + providerid + '/unmanagedInstances', function (dataUnmanaged) {
                var unmanagedData = dataUnmanaged.metaData.totalRecords;
                $childUnmanagedInstanceTemplate.find('.countUnmangedInstance').empty().append(unmanagedData);


                updateTotalCount("unmanaged", providerid, unmanagedData);


                awstotalinstancecount = awstotalinstancecount + totalInstances;

                $childUnmanagedInstanceTemplate.find('#assignedInstSpecificMoreInfo').click(function () {
                    $('#mainPanelId').hide();
                    $('#unmanagedTableContainer').show();
                    $('#providerforunManagedInstId').empty().append(providerName);
                    loadAssignedInstances(providerid);
                });
                $.get('../providers/' + providerid + '/unassigned-instances', function (dataUnmanaged) {
                    var unassignedData = dataUnmanaged.recordsTotal;
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

            $('#totalManagedInstancesMoreInfo').on('click', function () {
                $('#mainPanelId').hide();
                $('#trackedManagedInstancesAllProviderTableContainer').show();
                loadAllManagedInstances();
            });

            $('#totalAssignedInstancesMoreInfo').on('click', function () {
                $('#mainPanelId').hide();
                $('#trackedAssignedInstancesAllProviderTableContainer').show();
                loadAllAssignedInstances();
            });
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
            "ajax": '/providers/' + providerId + '/managedInstanceList',
            "columns": [
                {"data": "platformId", "orderable": true},
                {"data": "orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "environmentName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "hardware.os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "instanceIP", "orderable": true},
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.region ? full.region : full.providerData ? full.providerData.region : '-';
                    }
                },
                {"data": "instanceState", "orderable": true},
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

    function loadAllManagedInstances() {
        $('#allProviderTrackedManagedInstanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "ajax": '/tracked-instances?category=managed',
            "columns": [
                {"data": "platformId", "orderable": true},
                {"data": "orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "environmentName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "hardware.os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "instanceIP", "orderable": true},
                {"data": "instanceState", "orderable": true},
                {"data": "providerType", "orderable": true,
                    "render": function (data) {
                        if (data === 'aws') {
                            return 'AWS';
                        } else if (data === 'azure') {
                            return 'Azure';
                        } else if (data === 'vmware') {
                            return 'VMWare';
                        } else if (data === 'openstack') {
                            return 'OpenStack';
                        }
                    }
                },
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
            "ajax": '/providers/' + providerId + '/unmanagedInstanceList',
            "columns": [
                {"data": "platformId", "orderable": true},
                {"data": "orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "environmentName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "ip", "orderable": true},
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.region ? full.region : full.providerData ? full.providerData.region : '-';
                    }
                },
                {"data": "state", "orderable": true},
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
            "ajax": '/providers/' + providerId + '/unassigned-instances',
            "columns": [
                {"data": "platformId", "orderable": true},
                {"data": "orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "ip", "orderable": true,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "", "orderable": true,
                    "render": function (data, type, full, meta) {
                        return full.region ? full.region : full.providerData ? full.providerData.region : '-';
                    }
                },
                {"data": "state", "orderable": true},
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

    function loadAllAssignedInstances() {
        $('#allProviderTrackedAssignedInstanceListTable').DataTable({
            "processing": true,
            "serverSide": true,
            "destroy": true,
            "createdRow": function (row, data) {
                $(row).attr({"data-id": data._id})
            },
            "ajax": '/tracked-instances?category=assigned',
            "columns": [
                {"data": "platformId", "orderable": true},
                {"data": "orgName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "projectName", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "environmentName", "orderable": true,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "os", "orderable": false,
                    "render": function (data) {
                        return data ? data : '';
                    }
                },
                {"data": "ip", "orderable": true},
                {"data": "state", "orderable": true},
                {"data": "providerType", "orderable": true,
                    "render": function (data) {
                        if (data === 'aws') {
                            return 'AWS';
                        } else if (data === 'azure') {
                            return 'Azure';
                        } else if (data === 'vmware') {
                            return 'VMWare';
                        } else if (data === 'openstack') {
                            return 'OpenStack';
                        }
                    }
                },
                {"data": "", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.cost ? full.cost.symbol + ' ' + parseFloat(full.cost.aggregateInstanceCost).toFixed(2) : '-';
                    }
                },
                {"data": "usage", "orderable": false,
                    "render": function (data, type, full, meta) {
                        return full.usage ? '<span>' + full.usage.CPUUtilization.average + '&nbsp;%</span>' +
                            '<a class="btn btn-primary btn-sm width25padding4marginleft10 specProviderUsages pull-right"  title="Usage Details" data-usage=' + full._id + '><i class="fa fa-list"></i></a>' : '-';
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

    $('#metricSelector').change(function () {
        var chartId = $(this).val();
        $('.chartContainer').hide();
        $('#' + chartId).show();
        $(window).trigger('resize');
    });

    //Function to get the specific provider usages.
    function specProviderUsagesClickHandler() {
        var $specUsageModalContainer = $('#specUsageModalContainer');
        var instanceId = $(this).attr("data-usage");
        var toTimeString = new Date().toISOString().slice(0, 19);
        var ts = Math.round(new Date().getTime() / 1000);
        var tsYesterday = ts - (24 * 3600);
        var fromTimeString = new Date(tsYesterday * 1000).toISOString().slice(0, 19);

        //1_MINUTE, 5_MINUTES, 1_HOUR, 6_HOURS, 1_MONTH, 6_MONTHS, 1_YEAR
        var seggregateBy = '1_HOUR';
        var url = '/analytics/trend/usage?resource=' + instanceId + '&fromTimeStamp=' + fromTimeString + '&toTimeStamp=' + toTimeString + '&seggregateBy=' + seggregateBy;
        $.ajax(url)
            .done(function () {
                $('#chartCPUUtilization').empty();
                var chartCPUUtilization = new Morris.Line({
                    element: 'chartCPUUtilization',
                    resize: true,
                    data: [
                        {
                            "fromTime": "2016-07-29T00:00:01",
                            "toTime": "2016-07-29T01:00:00",
                            "maximum": 0.83,
                            "minimum": 0,
                            "average": 0.035
                        },
                        {
                            "fromTime": "2016-07-29T01:00:01",
                            "toTime": "2016-07-29T02:00:00",
                            "maximum": 0.82,
                            "minimum": 0.81,
                            "average": 0.81
                        },
                        {
                            "fromTime": "2016-07-29T02:00:01",
                            "toTime": "2016-07-29T03:00:00",
                            "maximum": 0.35,
                            "minimum": 0.33,
                            "average": 0.34
                        },
                        {
                            "fromTime": "2016-07-29T03:00:01",
                            "toTime": "2016-07-29T04:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T04:00:01",
                            "toTime": "2016-07-29T05:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        },
                        {
                            "fromTime": "2016-07-29T05:00:01",
                            "toTime": "2016-07-29T06:00:00",
                            "maximum": 0.83,
                            "minimum": 0,
                            "average": 0.035
                        },
                        {
                            "fromTime": "2016-07-29T06:00:01",
                            "toTime": "2016-07-29T07:00:00",
                            "maximum": 0.82,
                            "minimum": 0.81,
                            "average": 0.81
                        },
                        {
                            "fromTime": "2016-07-29T07:00:01",
                            "toTime": "2016-07-29T08:00:00",
                            "maximum": 0.35,
                            "minimum": 0.33,
                            "average": 0.34
                        },
                        {
                            "fromTime": "2016-07-29T08:00:01",
                            "toTime": "2016-07-29T09:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T09:00:01",
                            "toTime": "2016-07-29T10:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        },
                        {
                            "fromTime": "2016-07-29T10:00:01",
                            "toTime": "2016-07-29T11:00:00",
                            "maximum": 0.83,
                            "minimum": 0,
                            "average": 0.035
                        },
                        {
                            "fromTime": "2016-07-29T11:00:01",
                            "toTime": "2016-07-29T12:00:00",
                            "maximum": 0.82,
                            "minimum": 0.81,
                            "average": 0.81
                        },
                        {
                            "fromTime": "2016-07-29T12:00:01",
                            "toTime": "2016-07-29T13:00:00",
                            "maximum": 0.35,
                            "minimum": 0.33,
                            "average": 0.34
                        },
                        {
                            "fromTime": "2016-07-29T13:00:01",
                            "toTime": "2016-07-29T14:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T14:00:01",
                            "toTime": "2016-07-29T15:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        },
                        {
                            "fromTime": "2016-07-29T15:00:01",
                            "toTime": "2016-07-29T16:00:00",
                            "maximum": 0.83,
                            "minimum": 0,
                            "average": 0.035
                        },
                        {
                            "fromTime": "2016-07-29T16:00:01",
                            "toTime": "2016-07-29T17:00:00",
                            "maximum": 0.82,
                            "minimum": 0.81,
                            "average": 0.81
                        },
                        {
                            "fromTime": "2016-07-29T17:00:01",
                            "toTime": "2016-07-29T18:00:00",
                            "maximum": 0.35,
                            "minimum": 0.33,
                            "average": 0.34
                        },
                        {
                            "fromTime": "2016-07-29T18:00:01",
                            "toTime": "2016-07-29T19:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T19:00:01",
                            "toTime": "2016-07-29T20:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        },
                        {
                            "fromTime": "2016-07-29T20:00:01",
                            "toTime": "2016-07-29T21:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T21:00:01",
                            "toTime": "2016-07-29T22:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        },
                        {
                            "fromTime": "2016-07-29T22:00:01",
                            "toTime": "2016-07-29T23:00:00",
                            "maximum": 0,
                            "minimum": 0,
                            "average": 0
                        },
                        {
                            "fromTime": "2016-07-29T23:00:01",
                            "toTime": "2016-07-29T24:00:00",
                            "maximum": 0.12,
                            "minimum": 0.12,
                            "average": 0.12
                        }
                    ],
                    xkey: 'toTime',
                    ykeys: ['average'],
                    labels: ['Utilization'],
                    lineColors: ['#3c8dbc'],
                    postUnits: '%',
                    hideHover: 'auto'
                });
                $('#chartNetworkOut').empty();
                var NetworkOut = new Morris.Line({
                    element: 'chartNetworkOut',
                    resize: true,
                    data: [
                        {y: '2011 Q1', item1: 2666},
                        {y: '2011 Q2', item1: 2778},
                        {y: '2011 Q3', item1: 4912},
                        {y: '2011 Q4', item1: 3767},
                        {y: '2012 Q1', item1: 6810},
                        {y: '2012 Q2', item1: 5670},
                        {y: '2012 Q3', item1: 4820},
                        {y: '2012 Q4', item1: 15073},
                        {y: '2013 Q1', item1: 10687},
                        {y: '2013 Q2', item1: 8432}
                    ],
                    xkey: 'y',
                    ykeys: ['item1'],
                    labels: ['Item 1'],
                    lineColors: ['#A52A2A'],
                    hideHover: 'auto'
                });
                $('#chartNetworkIn').empty();
                var NetworkIn = new Morris.Line({
                    element: 'chartNetworkIn',
                    resize: true,
                    data: [
                        {y: '2011 Q1', item1: 2666},
                        {y: '2011 Q2', item1: 2778},
                        {y: '2011 Q3', item1: 4912},
                        {y: '2011 Q4', item1: 3767},
                        {y: '2012 Q1', item1: 6810},
                        {y: '2012 Q2', item1: 5670},
                        {y: '2012 Q3', item1: 4820},
                        {y: '2012 Q4', item1: 15073},
                        {y: '2013 Q1', item1: 10687},
                        {y: '2013 Q2', item1: 8432}
                    ],
                    xkey: 'y',
                    ykeys: ['item1'],
                    labels: ['Item 1'],
                    lineColors: ['#00008B'],
                    hideHover: 'auto'
                });
                $('#chartDiskReadBytes').empty();
                var DiskReadBytes = new Morris.Line({
                    element: 'chartDiskReadBytes',
                    resize: true,
                    data: [
                        {y: '2011 Q1', item1: 2666},
                        {y: '2011 Q2', item1: 2778},
                        {y: '2011 Q3', item1: 4912},
                        {y: '2011 Q4', item1: 3767},
                        {y: '2012 Q1', item1: 6810},
                        {y: '2012 Q2', item1: 5670},
                        {y: '2012 Q3', item1: 4820},
                        {y: '2012 Q4', item1: 15073},
                        {y: '2013 Q1', item1: 10687},
                        {y: '2013 Q2', item1: 8432}
                    ],
                    xkey: 'y',
                    ykeys: ['item1'],
                    labels: ['Item 1'],
                    lineColors: ['#006400'],
                    hideHover: 'auto'
                });
                $('#chartDiskWriteBytes').empty();
                var DiskWriteBytes = new Morris.Line({
                    element: 'chartDiskWriteBytes',
                    resize: true,
                    data: [
                        {y: '2011 Q1', item1: 2666},
                        {y: '2011 Q2', item1: 2778},
                        {y: '2011 Q3', item1: 4912},
                        {y: '2011 Q4', item1: 3767},
                        {y: '2012 Q1', item1: 6810},
                        {y: '2012 Q2', item1: 5670},
                        {y: '2012 Q3', item1: 4820},
                        {y: '2012 Q4', item1: 15073},
                        {y: '2013 Q1', item1: 10687},
                        {y: '2013 Q2', item1: 8432}
                    ],
                    xkey: 'y',
                    ykeys: ['item1'],
                    labels: ['Item 1'],
                    lineColors: ['#2F4F4F'],
                    hideHover: 'auto'
                });
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