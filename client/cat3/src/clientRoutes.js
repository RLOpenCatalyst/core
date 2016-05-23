function routeConfig($stateProvider, $urlRouterProvider, $httpProvider) {
    'use strict';
    var val = window.localStorage.getItem('catAuthToken');
    if (val) {
        var getAuthTokenDetails = JSON.parse(val);
        if (getAuthTokenDetails && getAuthTokenDetails.token) {
            $httpProvider.defaults.headers.common[getAuthTokenDetails.tokenHeaderName] = getAuthTokenDetails.token;
        }
    }

    $urlRouterProvider.otherwise("/signin");
    $stateProvider.state('signinDefault', {
        url: "",
        templateUrl: "src/partials/sections/login/login.html",
        controller: "loginCtrl"
    })
            .state('signin', {
                url: "/signin",
                templateUrl: "src/partials/sections/login/login.html",
                controller: "loginCtrl"
            })
            .state('dashboard', {
                url: "/dashboard",
                template: "<div ui-view></div>",
                controller: "dashboardCtrl",
                onEnter: function () {
                },
                onExit: function () {
                }
            })
            .state('dashboard.workzone', {
                url: "/workzone",
                templateUrl: "src/partials/sections/dashboard/workzone/workzone.html",
                controller: "workzoneCtrl",
                onEnter: function () {
                },
                onExit: function () {
                }
            })

            //code commented because we are navigating from v3.0 to v2.0 when the user clicks on design,settings & Track..

            .state('dashboard.design', {
                url: "/design",
                templateUrl: "src/partials/sections/dashboard/design/design.html",
                controller: "designCtrl"
            })
            .state('dashboard.settings', {
                url: "/settings",
                templateUrl: "src/partials/sections/dashboard/setting/setting.html",
                controller: "settingCtrl",
                params: {
                    activeSection : 'activeSection'
                }
            })
            .state('dashboard.track', {
                url: "/track",
                templateUrl: "src/partials/sections/dashboard/track/track.html",
                controller: "trackCtrl"
            })
            .state('dashboard.settings.organization', {
                url: "/organizations",
                templateUrl: "src/partials/sections/dashboard/setting/organization/organization.html",
                controller: "organizationCtrl"
            })
            .state('dashboard.settings.listOrganizations', {
                url: "/organizations/list",
                templateUrl: "src/partials/sections/dashboard/setting/organization/organizationList.html",
                controller: "organizationListCtrl"
            })
            .state('dashboard.settings.newOrganization', {
                url: "/organizations/new",
                templateUrl: "src/partials/sections/dashboard/setting/organization/organizationNew.html",
                controller: "organizationNewCtrl"
            })
            .state('dashboard.settings.editOrganization', {
                url: "/organizations/edit/:id",
                templateUrl: "src/partials/sections/dashboard/setting/organization/organizationNew.html",
                controller: "organizationNewCtrl"
            }).state('reset', {
                url: "/reset",
                controller: "resetCtrl"
            });
}

angularApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', routeConfig]);