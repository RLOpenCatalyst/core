(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('addDockerTemplateCtrl',['$scope', '$modalInstance','blueprintCreateService','items', function ($scope,$modalInstance,bpCreateSer,items) {
            $scope.dockerTemplateList = []; 
            for(var i =0;i<items.length;i++){
                if(items[i].templatetypename === 'Docker'){
                    $scope.dockerTemplateList.push(items[i]);
                }
            }
            angular.extend($scope, {
                selectDockerTemplateTag : function() {
                    $scope.isTagLoading = true;
                    var dockerTemplates = $scope.dockerTemplateList;
                    for(var j=0;j<dockerTemplates.length;j++){
                        if(dockerTemplates[j]._id === $scope.dockerTemplateForTag){
                            $scope.dockerTemplateName = dockerTemplates[j].dockercontainerpaths.replace(/\//g, "$$$");
                            $scope.dockerTemplateTypeName = dockerTemplates[j].templatename;
                            $scope.dockerLaunchParameters = '--name ' + dockerTemplates[j].templatename;
                            if(dockerTemplates[j].dockerreponame !== ''){
                                $scope.dockerRepo = dockerTemplates[j].dockerreponame;
                            } else {
                                $scope.dockerRepo = 'null';
                            }
                        }
                    }
                    bpCreateSer.getDockerTemplates($scope.dockerTemplateName,$scope.dockerRepo).then(function(data){
                        $scope.getDockerTags = data;
                        $scope.isTagLoading = false;
                    });
                },
                cancel : function() {
                    $modalInstance.dismiss('cancel');
                },
                ok:function() {
                    $scope.dockerTags = {
                        templatename : $scope.dockerTemplateTypeName,
                        dockercontainerpaths : $scope.dockerTemplateName,
                        tagValue : $scope.dockerTemplatetag,
                        dockerlaunchparameters : $scope.dockerLaunchParameters,
                        dockerreponame : $scope.dockerRepo
                    };
                    $modalInstance.close($scope.dockerTags);    
                }
            });
    }]);
})(angular);