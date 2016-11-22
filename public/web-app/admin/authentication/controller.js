angular
    .module('Authentication')
    .controller("AuthenticationCtrl", function ($scope, $mdDialog, AzureService) {

        var initialized = false;
        var request;
        $scope.isWorking = false;
        $scope.admin = {
            azure: {
                clientId: "",
                clientSecret: "",
                tenant: "",
                resource: ""
            },
            adfs: {}
        };

        $scope.method = {
            azure: true,
            adfs: false
        };
        $scope.$watch("method.azure", function () {
            $scope.method.adfs = !$scope.method.azure;
        });
        $scope.$watch("method.adfs", function () {
            $scope.method.azure = !$scope.method.adfs;
        })


        function apiWarning(warning) {
            $mdDialog.show({
                controller: LocalModal,
                templateUrl: '/web-app/modals/modalWarningContent.html',
                escapeToClose: false,
                locals: {
                    items: warning.error
                }
            });
        }
        function reqDone() {
            $mdDialog.show({
                controller: LocalModal,
                templateUrl: '/web-app/modals/modalAdminDoneContent.html',
                locals: {
                    items: "modal.save.authentication"
                }
            })
        }
        function LocalModal($scope, $mdDialog, items) {
            $scope.items = items;
            $scope.close = function () {
                $mdDialog.hide();
                $scope.isWorking = false;
            };
        }


        function azureSaveConfig() {
            $scope.isWorking = true;
            if (request) request.abort();
            request = AzureService.post($scope.admin.azure);
            request.then(function (promise) {
                $scope.isWorking = false;
                if (promise && promise.error) apiWarning(promise.error);
                else reqDone();
            })
        }

        $scope.isWorking = true;
        request = AzureService.get();
        request.then(function (promise) {
            $scope.isWorking = false;
            if (promise && promise.error) apiWarning(promise.error);
            else {
                $scope.method.azure = true;
                $scope.method.adfs = false;
                if (promise.data.azure) {
                    $scope.admin.azure = promise.data.azure;
                } else {
                    $scope.admin = {
                        azure: {
                            clientId: "",
                            clientSecret: "",
                            tenant: "",
                            resource: ""
                        },
                        adfs: {}
                    };
                }
                $scope.admin.azure.signin = promise.data.signin;
                $scope.admin.azure.callback = promise.data.callback;
                $scope.admin.azure.logout = promise.data.logout;
            }
        })



        $scope.isValid = function () {
            if ($scope.method.azure == true) {
                if (!$scope.admin.azure.clientID || $scope.admin.azure.clientID == "") return false;
                else if (!$scope.admin.azure.clientSecret || $scope.admin.azure.clientSecret == "") return false;
                else if (!$scope.admin.azure.tenant || $scope.admin.azure.tenant == "") return false;
                else if (!$scope.admin.azure.resource || $scope.admin.azure.resource == "") return false;
                else return true;
            }
            else if (isWorking) return true;
            else return false;
        }

        $scope.save = function () {
            $scope.isWorking = true;
            if ($scope.method.azure == true) {
                azureSaveConfig();
            }
        }
    })
    .factory("AzureService", function ($http, $q, $rootScope) {

        function get(azureConfig) {
            var canceller = $q.defer();
            var request = $http({
                url: "/api/azure/",
                method: "GET",
                data: { azure: azureConfig },
                timeout: canceller.promise
            });
            return httpReq(request);
        }

        function post(azureConfig) {
            var canceller = $q.defer();
            var request = $http({
                url: "/api/azure/",
                method: "POST",
                data: { azure: azureConfig },
                timeout: canceller.promise
            });
            return httpReq(request);
        }

        function httpReq(request) {
            var promise = request.then(
                function (response) {
                    return response;
                },
                function (response) {
                    return { error: response.data };
                });

            promise.abort = function () {
                canceller.resolve();
            };
            promise.finally(function () {
                console.info("Cleaning up object references.");
                promise.abort = angular.noop;
                canceller = request = promise = null;
            });

            return promise;
        }

        return {
            get: get,
            post: post
        }
    });

