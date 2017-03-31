var serviceListdata=[];
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
        }]

    });
}
var stateCall=null;
var statePrd= '';
$(document).ready(function(){
    $.get('http://13.82.225.212:8080/ticket-analyser/getsummary', function(data){
         $('#total').html(data.summary.total);
         $('#open').html(data.summary.open);
         $('#closed').html(data.summary.closed);
         $('#missedSla').html(data.summary.missed_sla);
         $('#about_to_miss_sla').html(data.summary.about_to_miss_sla);
         $('#unassigned').html(data.summary.unassigned);
      });

    stateCall= 'openTickets';
    
    periodFilter('getdailyincidents'); 
   
    
    // tickets(status);
    /*slaMissed()*/
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



/*function slaMissed() {
    $.get('http://localhost:8080/ticket-analyser/getweeklysummary?state=closed&page=1&size=20', function(data){
        //var width=(1/4*100);
        var total_missed_sla = data.summary.p1_sla_missed + data.summary.p2_sla_missed + data.summary.p3_sla_missed + data.summary.p4_sla_missed;
        var p1 = ((data.summary.p1_sla_missed/total_missed_sla) *100);
        $('#p1').html(p1.toFixed(2)+"%");
        var p2 = ((data.summary.p2_sla_missed/total_missed_sla) *100);
        $('#p2').html(p2.toFixed(2)+ "%");
        var p3 = ((data.summary.p3_sla_missed/total_missed_sla) *100);
        $('#p3').html(p3.toFixed(2)+ "%");
        var p4 = ((data.summary.p4_sla_missed/total_missed_sla) *100);
        $('#p4').html(p4.toFixed(2)+ "%");

    });
}*/



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

function tickets(state) { 
    stateCall= state;
    prd=statePrd;
    $('.act').removeClass('selected-section');
    $('#'+state+' span').last().addClass("selected-section");


    $('#snTable').DataTable().destroy();
    if(state === 'openTickets'){
        $.get('http://13.82.225.212:8080/ticket-analyser/'+prd+'?state=open', function(data){
        tableCreate(data);
        });
        $('#response').hide();
        $('#resolution').hide();
    }
    else if(state === 'closedTickets'){
        $.get('http:/13.82.225.212:8080/ticket-analyser/'+prd+'?state=closed', function(data){
        tableCreate(data);
        });
        $('#response').hide();
        $('#resolution').hide();
    }
    else if(state === 'slamissedTickets'){
        $.get('http://13.82.225.212:8080/ticket-analyser/'+prd+'?state=slamissed', function(data){
        tableCreate(data);
        });
        $('#response').show();
        $('#resolution').show();
    }
    else if(state === 'slaabouttomissTickets'){
        $.get('http://13.82.225.212:8080/ticket-analyser/'+prd+'?state=sla - about to miss', function(data){
        tableCreate(data);
        });
        $('#response').show();
        $('#resolution').show();
    }
    else if(state === 'unassignedTickets'){
        $.get('http://13.82.225.212:8080/ticket-analyser/'+prd+'?state=unassigned', function(data){
        tableCreate(data);
        });
        $('#response').hide();
        $('#resolution').hide();
    }
    else if(state === 'totalTickets'){
        $.get('http://13.82.225.212:8080/ticket-analyser/'+prd+'?state=', function(data){
        tableCreate(data);
        });
        $('#response').hide();
        $('#resolution').hide();
    }
}

function periodFilter(prd) {
    $('.pridAct').removeClass('active');
    $('#'+prd).last().addClass("active");
    statePrd=prd;
    tickets(stateCall);
};

function tableCreate(data) {
    var total_missed_sla = data.summary.p1 + data.summary.p2 + data.summary.p3 + data.summary.p4;
    var p1 = ((data.summary.p1/total_missed_sla) *100);
    $('#p1').html(p1.toFixed(0)+"%");
    console.log(p1);
    //$('#p1').css('width',p1.toFixed(2)+"%");
    var p2 = ((data.summary.p2/total_missed_sla) *100);
    $('#p2').html(p2.toFixed(0)+ "%");
    //$('#p2').css('width',p2.toFixed(2)+ "%");
    var p3 = ((data.summary.p3/total_missed_sla) *100);
    $('#p3').html(p3.toFixed(0)+ "%");
    //$('#p3').css('width',p3.toFixed(2)+ "%");
    var p4 = ((data.summary.p4/total_missed_sla) *100);
    $('#p4').html(p4.toFixed(0)+ "%");
    console.log(p4);
    //$('#p4').css('width',p4.toFixed(2)+ "%");
     
    /*var responseAdd=((+data.summary.response) + (+data.summary.p2_sla_missed_response) + (+data.summary.p3_sla_missed_response) + (+data.summary.p4_sla_missed_response)); 
    var responseAvg=responseAdd/4;*/
    if(data && data.summary && data.summary.response){
        var resPer=(data.summary.response/data.summary.total)*100;
        $('#response').html(resPer.toFixed(0)+"%");
        $('#response').css('width',resPer.toFixed(2)+ "%");
        $('#response').css('color',"#fff");
    } else{
        $('#response').html("0%");
        $('#response').css('width',"0%");
        $('#response').css('color',"#000");
    }

    /*var resolutionAdd = data.summary.p1_sla_missed_resolution + data.summary.p2_sla_missed_resolution + data.summary.p3_sla_missed_resolution + data.summary.p4_sla_missed_resolution;
    var resolutionAvg = resolutionAdd/4;*/
    if(data && data.summary && data.summary.resolution){
        var resolutionPer = (data.summary.resolution/data.summary.total)*100;
        $('#resolution').html(resolutionPer.toFixed(0)+"%");
        $('#resolution').css('width',resolutionPer.toFixed(2)+ "%");
         $('#resolution').css('color',"#fff");
    } else{
        $('#resolution').html("0%");
        $('#resolution').css('width',"0%");
        $('#resolution').css('color',"#000");
    }
    /*var ATMSresolutionAdd = data.summary.p1_about_to_miss_sla_resolution + data.summary.p2_about_to_miss_sla_resolution + data.summary.p3_about_to_miss_sla_resolution + data.summary.p4_about_to_miss_sla_resolution;
    var ATMSresolutionAvg = ATMSresolutionAdd/4;
    var ATMSresolutionPer = (ATMSresolutionAvg/ATMSresolutionAdd)*100;
    $('#ATMSresolution').html(ATMSresolutionPer.toFixed(2)+"%");
    $('#ATMSresolution').css('width',ATMSresolutionPer.toFixed(2)+ "%");*/

    /*$('#total').html(data.summary.total);
    $('#open').html(data.summary.open);
    $('#closed').html(data.summary.closed);
    $('#missedSla').html(data.summary.missed_sla);
    $('#about_to_miss_sla').html(data.summary.about_to_miss_sla);
    $('#unassigned').html(data.summary.unassigned);*/


    $('#snTable').DataTable( {
            // "processing": true,
            "processing": true,
                'language':{ 
                   "loadingRecords": "&nbsp;",
                   "processing": "Loading..."
                },
            // "deferLoading": 57,
            //"serverSide": true,
            "data":data.summary.incidents ,
            "columns": [
                    {"data": "number", "orderable" : true},
                    {"data": "createdDate","orderable" : false  },
                    {"data": "assigned_to" ,"orderable" : false },
                    {"data": "category" ,"orderable" : false},
                    {"data": "priority" ,"orderable" : false},
                    {"data": "shortDesc" ,"orderable" : false},
                    // {"data": "workLog" ,"orderable" : false},
                    
                ]
        });
}



