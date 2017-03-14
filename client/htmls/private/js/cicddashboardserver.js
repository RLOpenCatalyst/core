//initialising the datatable...
if (!$.fn.dataTable.isDataTable('#cicdDashboardServerTable')) {
    var $gitDatatable = $('#cicdDashboardServerTable').DataTable({
        "pagingType": "full_numbers",
        "bInfo": false,
        "bLengthChange": false,
        "paging": true,
        "bFilter": false,
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
        }]

    });
}

$(document).ready(function(e) {
    getGlobalGitServers();
});

