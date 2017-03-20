
//initialising the datatable...
if (!$.fn.dataTable.isDataTable('#snTable')) {
    var $snDatatable = $('#snTable').DataTable({
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
        }, {
            "bSortable": false
        }, {
            "bSortable": false
        }]

    });
}

$(document).ready(function(){
    serviceNowDetails();
    tickets()
    // serviceNowDetails('/public/serviceNow.json');
    // tickets();
    // $("#weekly").click(function(){
    //     alert("weekly");
    //     serviceNowDetails('http://192.168.152.86:9090/ticket-analyser/getweeklysummary');
    // });
    // $("#monthly").click(function(){
    //     alert("monthly");
    //     serviceNowDetails('http://192.168.152.86:9090/ticket-analyser/getweeklysummary');
    // });
    // $("#daily").click(function(){
    //     alert("monthly");
    //     serviceNowDetails('http://192.168.152.86:9090/ticket-analyser/getdailysummary');
    // });
    //dailySN("http://192.168.152.86:9090/ticket-analyser/getdailysummary");
});
    //jQuery.support.cors = true;
// function serviceNowDetails() {
    
//     $.ajax({
//         type: "GET",
//         url: service + '/serviceNow.json',
//         contentType: "application/json",
//         dataType: "json",
//         cache: false,
//         success: function (data) {
//             alert(data);
//             if(data && data.incidents && data.incidents.length){
//                 var trHTML = '';
//               for(i=0; i<data.incidents.length; i++) { 
//                 trHTML += '<tr><td>' + data.incidents[i].number + '</td>'
//                              '<td>' + data.incidents[i].createdDate + '</td>'
//                              '<td>' + data.incidents[i].assigned_to + '</td>'
//                              '<td>' + data.incidents[i].category + '</td>'
//                              '<td>' + data.incidents[i].priority + '</td>'
//                              '<td>' + data.incidents[i].shortDesc + '<td>'
//                              '<td>' + data.incidents[i].workLog + '</td></tr>';
//               }
//               $('#snTable').html(trHTML);
//             }
//         }
//     });
// }

function tickets() {
     $.get('/public/serviceNow.json', function(data){
     $('#total').html(data.summary.total);
     $('#open').html(data.summary.open);
     $('#closed').html(data.summary.closed);
     $('#missedSla').html(data.summary.missed_sla);
     $('#about_to_miss_sla').html(data.summary.about_to_miss_sla);
     $('#unassigned').html(data.summary.unassigned);
 });
}




function dailySN(url) {
    $('#snTable').DataTable({
        "createdRow": function( row, data ) {},
        "ajax": {
            "url": url,
            "dataSrc": "incidents"
        },
       // "ajax": '/public/serviceNow.json',
        "columns": [
            {"data": "number", "orderable" : true},
            {"data": "createdDate","orderable" : false  },
            {"data": "assigned_to" ,"orderable" : false },
            {"data": "category" ,"orderable" : false},
            {"data": "priority" ,"orderable" : false},
            {"data": "shortDesc" ,"orderable" : false},
            {"data": "workLog" ,"orderable" : false},
            
        ]
    } );

};


// function serviceNowDetails(url) {
//     $.ajax({
//         url:url,
//         type: 'GET',
//         dataType: 'jsonp',
//         success:function(content,code)
//         {
//             console.log(JSON.parse(code));
//         }      
//     });
// };

function serviceNowDetails() {
    $('#snTable').DataTable( {
        
        "createdRow": function( row, data ) {
            
        },
        "ajax": {
            "url": '/public/serviceNow.json',
            "dataSrc": "incidents"
        },
               "columns": [
            {"data": "number", "orderable" : true},
            {"data": "createdDate","orderable" : false  },
            {"data": "assigned_to" ,"orderable" : false },
            {"data": "category" ,"orderable" : false},
            {"data": "priority" ,"orderable" : false},
            {"data": "shortDesc" ,"orderable" : false},
            {"data": "workLog" ,"orderable" : false},
            
        ]
    } );
};

