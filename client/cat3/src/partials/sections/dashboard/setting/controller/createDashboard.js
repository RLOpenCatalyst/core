(function (angular) {
    "use strict";
    angular.module('dashboard.settings')
        .controller('createDashboardCtrl', ['$scope', '$rootScope', '$state','genericServices', function ($scope,$rootScope,$state,genericServices){
            var crt=this;
            crt.newEnt={};
            crt.Collcter=[];
            crt.CollcterVersion=[];
            var treeNames = ['Setting',' Create CI-CD Dashboard'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            genericServices.getTreeNew().then(function (orgs) {
                crt.organObject = orgs;
            });

            // get collecter
            crt.getCollection=function () {
                if(crt.newEnt && crt.newEnt.dashboardURL){
                    var req = {
                        method: 'GET',
                        url: '/dashboardcicd/collectors',
                        headers: {
                            'Content-Type': 'application/json',
                            'Dashboard-url':crt.newEnt.dashboardURL
                        }
                    };
                    genericServices.promiseOwn(req).then(function (collecters) {
                        crt.collecters=collecters.data;
                    });
                }
            };

            crt.getCollcterItems=function (name,id) {
                crt.Collcter[name]={};
                var req = {
                    method: 'GET',
                    url: ' /dashboardcicd/collector/'+id,
                    headers: {
                        'Content-Type': 'application/json',
                        'Dashboard-url':crt.newEnt.dashboardURL
                    }
                };
                genericServices.promiseOwn(req).then(function (items) {
                    var optionProj=[];
                    var a=[];
                    angular.forEach(items.data,function (val) {
                        console.log(name,'---',val);
                        if(optionProj.indexOf(val.options.projectName) === -1) {
                            optionProj.push(val.options.projectName);
                            a.push(val.options);

                        }
                    });
                    crt.Collcter[name]=a;
                });
            };

            crt.getSubCollcterItems=function (name,id) {
                crt.newEnt[name].version='';
                var req = {
                    method: 'GET',
                    url: ' /dashboardcicd/collector/'+id,
                    headers: {
                        'Content-Type': 'application/json',
                        'Dashboard-url':crt.newEnt.dashboardURL
                    }
                };
                genericServices.promiseOwn(req).then(function (items) {
                    var a=[];
                    angular.forEach(items.data,function (val) {
                        if(val.options.projectId === crt.newEnt[name].project ) {
                            a.push(val.options);

                        }
                    });
                    crt.CollcterVersion[name]=a;
                });
            };
            crt.createDashboard=function (res) {
                var req = {
                    method: 'POST',
                    url: '/dashboardcicd/setupdashboard/'+res.application.components[0].id,
                    headers: {
                        'Content-Type': 'application/json',
                        'Dashboard-url':crt.newEnt.dashboardURL
                    },
                    data: [
                        {"options":{"id":crt.newEnt.Jiraproject.version},
                        "name":"Jiraproject",
                        "componentId":res.application.components[0].id,
                        "collectorItemIds":[crt.newEnt.Jiraproject.collecterId]}
                        ]
                };
                genericServices.promiseOwn(req).then(function (res) {
                    console.log(res);
                });
            };

            crt.submitForm=function () {
                var req = {
                    method: 'POST',
                    url: '/dashboardcicd/dashboard',
                    headers: {
                        'Content-Type': 'application/json',
                        'Dashboard-url':crt.newEnt.dashboardURL
                    },
                    data: {"template": "capone",
                        "title": crt.newEnt.dashboardName,
                        "type": "team",
                        "applicationName": crt.newEnt.dashboardName,
                        "componentName": crt.newEnt.dashboardName,
                        "owner": "admin"
                    }
                };
                genericServices.promiseOwn(req).then(function (res) {
                    crt.createDashboard(res.data);
                });
            };


        }]);
})(angular);
