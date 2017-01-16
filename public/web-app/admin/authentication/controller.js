angular
    .module('Authentication')
    .controller("AuthenticationCtrl", function ($scope, $mdDialog, ConfigService) {

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
            adfs: {
                server: "",
                entityID: "",
                loginUrl: "",
                logoutURL: "",
                entryPoint: "",
                metadata :undefined
            }
        };
        $scope.method = "azure";
        $scope.$watch("method.azure", function () {
            $scope.method.adfs = !$scope.method.azure;
        });
        $scope.$watch("method.adfs", function () {
            $scope.method.azure = !$scope.method.adfs;
        })
        $scope.$watch("admin.adfs.metadata", function (a, b) {
            if ($scope.admin.adfs.metadata) {
                var start, stop, temp;

                start = $scope.admin.adfs.metadata.indexOf("entityID=") + 10;
                console.log(start);
                if (start) $scope.admin.adfs.entityID = $scope.admin.adfs.metadata.substring(start, $scope.admin.adfs.metadata.indexOf("\"", start));
                start = -1;

                start = $scope.admin.adfs.metadata.indexOf("SingleSignOnService Binding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect\"");
                console.log(start);
                if (start) start = $scope.admin.adfs.metadata.indexOf("Location=", start) + 10;
                console.log(start);
                if (start) $scope.admin.adfs.loginUrl = $scope.admin.adfs.metadata.substring(start, $scope.admin.adfs.metadata.indexOf("\"", start));

                start = -1;
                start = $scope.admin.adfs.metadata.indexOf("SingleLogoutService Binding=\"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect\"");
                console.log(start);
                if (start) start = $scope.admin.adfs.metadata.indexOf("Location=", start) + 10;
                console.log(start);
                if (start) $scope.admin.adfs.logoutUrl = $scope.admin.adfs.metadata.substring(start, $scope.admin.adfs.metadata.indexOf("\"", start));
            }
        })
        $scope.adfsCert = function () {
            if ($scope.admin.adfs.server) return "https://" + $scope.admin.adfs.server + "/FederationMetadata/2007-06/FederationMetadata.xml";
            else return false;
        }


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
            request = ConfigService.post("azure", $scope.admin.azure);
            request.then(function (promise) {
                $scope.isWorking = false;
                if (promise && promise.error) apiWarning(promise.error);
                else reqDone();
            })
        }
        function adfsSaveConfig() {
            $scope.isWorking = true;
            $scope.admin.adfs.entryPoint = $scope.admin.adfs.loginUrl;
            if (request) request.abort();
            request = ConfigService.post("adfs", $scope.admin.adfs);
            request.then(function (promise) {
                $scope.isWorking = false;
                if (promise && promise.error) apiWarning(promise.error);
                else reqDone();
            })
        }


        $scope.isWorking = true;
        request = ConfigService.get("azure");
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
            if ($scope.method == "azure") {
                if (!$scope.admin.azure.clientID || $scope.admin.azure.clientID == "") return false;
                else if (!$scope.admin.azure.clientSecret || $scope.admin.azure.clientSecret == "") return false;
                else if (!$scope.admin.azure.tenant || $scope.admin.azure.tenant == "") return false;
                else if (!$scope.admin.azure.resource || $scope.admin.azure.resource == "") return false;
                else return true;
            }
            else if ($scope.method == "adfs") {
                if (!$scope.admin.adfs.entityID || $scope.admin.adfs.entityID == "") return false;
                else if (!$scope.admin.adfs.loginUrl || $scope.admin.adfs.loginUrl == "") return false;
                else if (!$scope.admin.adfs.logoutUrl || $scope.admin.adfs.logoutUrl == "") return false;
                else return true;
            }
            else if ($scope.isWorking) return true;
            else return false;
        }

        $scope.save = function () {
            $scope.isWorking = true;
            if ($scope.method == 'azure') {
                azureSaveConfig();
            } else if ($scope.method == "adfs") {
                adfsSaveConfig();
            }
        }
    })
    .factory("ConfigService", function ($http, $q, $rootScope) {

        function get(method, config) {
            var canceller = $q.defer();
            var request = $http({
                url: "/api/" + method + "/",
                method: "GET",
                data: { config: config },
                timeout: canceller.promise
            });
            return httpReq(request);
        }

        function post(method, config) {
            var canceller = $q.defer();
            var request = $http({
                url: "/api/" + method + "/",
                method: "POST",
                data: { config: config },
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