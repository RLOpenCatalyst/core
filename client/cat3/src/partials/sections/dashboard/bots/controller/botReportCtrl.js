/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botReportCtrl',['$scope','toastr','genericServices','uiGridConstants', function ($scope, toastr,genericServices,uiGridConstants) {
        $scope.reportData={
            showColumnFooter: true,
            columnDefs: [
                { name: 'name', field: 'name' ,footerCellTemplate: '<div class="ui-grid-cell-contents">Total</div>', width: 250}
              ],
              data:[],
              onRegisterApi: function(gridApi) {
                $scope.gridApi = gridApi;
        }
        
        };
        
        $scope.filterDate=function (typ){
            let enddate=new Date();
             //enddate.setDate(enddate.getDate() - 1);
             console.log(enddate);
            var monthforenddate = (enddate .getMonth() + 1);
    var day = (enddate .getDate()); 
    var year = (enddate .getFullYear());
    enddate= monthforenddate + "/" + day + "/" + year;
   console.log(enddate);
           let startdate = new Date();
         // startdate.setDate(startdate.getDate() - 1);
            if(typ == 'day'){
                console.log(startdate.getTime());
                var last = new Date(startdate.getTime() - (30 * 24 * 60 * 60 * 1000));
                console.log(last);
                var day =last.getDate();
                var month=last.getMonth()+1;
                var year=last.getFullYear();
                startdate= month + "/" + day + "/" + year;

                var param={
                    url:'/audit-trail/uppermetric?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success'
                }
                genericServices.promiseGet(param).then(function(response) {
                    $scope.dayData=response[0].totalticketsresolved/30|0;
                })
            } else if(typ == 'week'){
                var last = new Date(startdate.getTime() - (30 * 24 * 60 * 60 * 1000));
                var day =last.getDate();
                var month=last.getMonth()+1;
                var year=last.getFullYear();
                startdate= month + "/" + day + "/" + year;
                var param={
                    url:'/audit-trail/uppermetric?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success'
                }
                genericServices.promiseGet(param).then(function(response) {
                    $scope.weekData=response[0].totalticketsresolved/4|0;
                })
            } else if(typ == 'month'){
                var last = new Date(startdate.getTime());
                var day =1;
                var month=1;
                var year=last.getFullYear();
                startdate= month + "/" + day + "/" + year;
                var param={
                    url:'/audit-trail/uppermetric?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success'
                }
                genericServices.promiseGet(param).then(function(response) {
                    $scope.monthData=response[0].totalticketsresolved/(last.getMonth()+1)|0;
            
                })
            } else if(typ == 'monthtilldate'){
                var last = new Date(startdate.getTime());
                var day =1;
                var month=last.getMonth()+1;
                var year=last.getFullYear();
                startdate= month + "/" + day + "/" + year;
                var param={
                    url:'/audit-trail/uppermetric?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success'
                }
                genericServices.promiseGet(param).then(function(response) {
                    $scope.monthDatatilldate=response[0].totalticketsresolved;
            
                })
            }

            
        }


        $scope.reportTable=function (mode){
            let enddate=new Date();
           // enddate.setDate(enddate.getDate() - 1);
            let startdate = new Date();
            // startdate.setDate(startdate.getDate() - 1);
            var month = (enddate .getMonth() + 1);
    var day = (enddate .getDate());
    var year = (enddate .getFullYear());
    enddate= month + "/" + day + "/" + year;

    var last = new Date(startdate.getTime() - (30 * 24 * 60 * 60 * 1000));
    var day =last.getDate();
    var month=last.getMonth()+1;
    var year=last.getFullYear();
  //  var days=new Date(year, month, 0).getDate();
    startdate= month + "/" + day + "/" + year;
       var date = new Date();//

    var b=['Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sept','Oct','Nov','Dec'];



    $scope.reportData={
        showColumnFooter: true,
        columnDefs: [
            { name: 'name', field: 'name' ,footerCellTemplate: '<div class="ui-grid-cell-contents">Total</div>', width: 250}
          ],
          data:[],
          onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
    }
    
    };

  //  console.log(startdate.getDate());

    for(var a=1;a<=30;a++){
        let curentDate=new Date(date.getTime()-(a * 24 * 60 * 60 * 1000));
        let displayDate=b[curentDate.getMonth()]+' '+curentDate.getDate();
        $scope.reportData.columnDefs.push({'name':displayDate,field:'count['+curentDate.getDate()+']',aggregationType: uiGridConstants.aggregationTypes.sum,aggregationHideLabel: true,width:100});

       }



       

            if(mode == 'success'){
               console.log("======= success");
                var param={
                    url:'/audit-trail/filterdata?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success&period=daily'
                }
                genericServices.promiseGet(param).then(function(response) {
                
                    $scope.reportData.data = response;

                   
                    
                })
            } else if(mode == 'failed'){
                console.log("======= failure");
                var param={
                    url:'/audit-trail/filterdata?startdate='+startdate+'&enddate='+enddate+'&actionStatus=failed&period=daily'
                }
                genericServices.promiseGet(param).then(function(response) {
                    $scope.reportData.data = response;

                  
                })
            } else {
                
                var param={
                    url:'/audit-trail/filterdata?startdate='+startdate+'&enddate='+enddate+'&actionStatus=all&period=daily'
                }
                genericServices.promiseGet(param).then(function(response) {
                   
                    $scope.reportData.data = response;
                })
            }
            
        }
        

   
        $scope.showMonthlyData=function (){
            let enddate=new Date();
           // enddate.setDate(enddate.getDate() - 1);
            let startdate = new Date();
            // startdate.setDate(startdate.getDate() - 1);
            var month = (enddate .getMonth() + 1);
    var day = (enddate .getDate());
    var year = (enddate .getFullYear());
    enddate= month + "/" + day + "/" + year;

    var last = new Date(startdate.getTime() - (30 * 24 * 60 * 60 * 1000));
    var day =1;
    var month=1;
    var year=last.getFullYear();
  //  var days=new Date(year, month, 0).getDate();
    startdate= month + "/" + day + "/" + year;
       var date = new Date();//

    var b=['null','Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sept','Oct','Nov','Dec'];

  //  console.log(startdate.getDate());
  $scope.reportData={
    showColumnFooter: true,
    columnDefs: [
        { name: 'name', field: 'name' ,footerCellTemplate: '<div class="ui-grid-cell-contents">Total</div>', width: 250}
      ],
      data:[],
      onRegisterApi: function(gridApi) {
        $scope.gridApi = gridApi;
}

};
    for(var a=1;a<=12;a++){
       // let curentDate=new Date(date.getTime()-(a * 24 * 60 * 60 * 1000));
        let displayDate=b[a];
        $scope.reportData.columnDefs.push({'name':displayDate,field:'count['+a+']',aggregationType: uiGridConstants.aggregationTypes.sum,aggregationHideLabel: true,width:100});

       }

                var param={
                    url:'/audit-trail/filterdata?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success&period=monthly'
                }
                genericServices.promiseGet(param).then(function(response) {
                
                    $scope.reportData.data = response;

                   
                    
                })
            
            
        }




        $scope.showWeeklyData=function (){
            let enddate=new Date();
           // enddate.setDate(enddate.getDate() - 1);
            let startdate = new Date();
            // startdate.setDate(startdate.getDate() - 1);
            var month = (enddate .getMonth() + 1);
    var day = (enddate .getDate());
    var year = (enddate .getFullYear());
    enddate= month + "/" + day + "/" + year;

    var last = new Date(startdate.getTime() - (30 * 24 * 60 * 60 * 1000));
    var day =(last .getDate());
    var month=(last .getMonth() + 1);
    var year=last.getFullYear();
  //  var days=new Date(year, month, 0).getDate();
    startdate= month + "/" + day + "/" + year;
       var date = new Date();//

    var week = ['Week1','Week2','Week3','Week4'];

  //  console.log(startdate.getDate());
  $scope.reportData={
    showColumnFooter: true,
    columnDefs: [
        { name: 'name', field: 'name' ,footerCellTemplate: '<div class="ui-grid-cell-contents">Total</div>', width: 250}
      ],
      data:[],
      onRegisterApi: function(gridApi) {
        $scope.gridApi = gridApi;
}

};
    for(var a=0;a<=3;a++){
       // let curentDate=new Date(date.getTime()-(a * 24 * 60 * 60 * 1000));
        let displayDate=week[a];
        $scope.reportData.columnDefs.push({'name':displayDate,field:'count['+a+']',aggregationType: uiGridConstants.aggregationTypes.sum,aggregationHideLabel: true,width:300});

       }

                var param={
                    url:'/audit-trail/filterdata?startdate='+startdate+'&enddate='+enddate+'&actionStatus=success&period=weekly'
                }
                genericServices.promiseGet(param).then(function(response) {
                
                    $scope.reportData.data = response;

                   
                    
                })
            
            
        }



        $scope.filterDate('day');
        $scope.filterDate('week');
        $scope.filterDate('month');
        $scope.filterDate('monthtilldate');


            $scope.reportTable('all');
    }]);
})(angular);