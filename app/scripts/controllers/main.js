'use strict';

/**
 * @ngdoc function
 * @name pajsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pajsApp
 */
angular.module('pajsApp')
  .controller('MainCtrl',['$scope','PubNub','$rootScope','$materialDialog', function ($scope,PubNub,$rootScope,$materialDialog) {
    $scope.selectedChannel = "";
    if (!PubNub.initialized()) {
      var hideDialog = $materialDialog({
        templateUrl:"views/login.html",
        clickOutsideToClose: false,
        escapeToClose: false,
        controller: "loginCtrl"
      });
    }

    $scope.users = [];
    $scope.messages = [];
    $scope.userData;

    $rootScope.$watch('users',function () {
      console.log($rootScope.users);
      $scope.users = $rootScope.users;
      console.log($scope.users);
    });

    $rootScope.$watch('messages',function () {
      $scope.messages = $rootScope.messages;
    });

    $rootScope.$watch('userData',function () {
      $scope.userData = $rootScope.userData;
    });

    $scope.signOut = function () {
      // body...
        PubNub.ngUnsubscribe({
          channel: 'rvb_ganked'
        });
        PubNub.destroy();
        var hideDialog = $materialDialog({
          templateUrl:"views/login.html",
          clickOutsideToClose: false,
          escapeToClose: false,
          controller: "loginCtrl"
        });

    }
    
    $scope.logged = function() {
      return PubNub.initialized();
    }


    $scope.publish = function() {
      console.log('publish', $scope);
      PubNub.ngPublish({
        channel: 'rvb_ganked',
        message: {
          text: $scope.newMessage,
          user: $rootScope.username
        }
      });
      return $scope.newMessage = '';
    };

  }])

  .controller('loginCtrl',['$scope','PubNub','$rootScope','$hideDialog',function($scope,PubNub,$rootScope,$hideDialog){
    $rootScope.users = [];
    $rootScope.messages = [];
    $scope.username = 'Cambrian ' + Math.floor(Math.random() * 1000);
    $scope.login = function () {
      $scope.uuid = Math.floor(Math.random() * 1000000) + '__' + $scope.username;
      PubNub.init({
        publish_key:'pub-c-bf1cbccf-f8bf-412a-8e2c-0930f6d87453',
        subscribe_key:'sub-c-5dfe513c-3fbe-11e4-98c8-02ee2ddab7fe',
        secret_key: "sec-c-YzM0OGY3ZmItOGMwNy00ODIzLWFjZjgtZTg4OGUwNzA3ZDRj",
        uuid:$scope.uuid,
        ssl:true
      });
      PubNub.ngGrant({
        channel: 'rvb_ganked',
        read: true,
        write: false,
        callback: function() {
          return PubNub.ngGrant({
            channel: 'rvb_ganked-pnpres',
            read: true,
            write: true,
            callback: function() {
              console.log('channel presence all set', arguments);
              PubNub.ngSubscribe({
                channel: 'rvb_ganked',
                error: function() {
                  return console.log(arguments);
                }
              });
              /* Get a reasonable historical backlog of messages to populate the channels list*/
              $rootScope.$on(PubNub.ngPrsEv('rvb_ganked'), function(ngEvent, payload) {
                console.log("got a presence event",ngEvent);
                console.log(PubNub.ngListPresence('rvb_ganked'));
                return $rootScope.$apply(function () {
                  return $rootScope.users = PubNub.ngListPresence('rvb_ganked');
                });
              });

              PubNub.ngHereNow({
                  channel: 'rvb_ganked'
                });
              $rootScope.$on(PubNub.ngMsgEv('rvb_ganked'), function(ngEvent, payload) {
                var msg;
                msg = payload.message.user ? "[" + payload.message.user + "] " + payload.message.text : "[unknown] " + payload.message;
                return $rootScope.$apply(function() {
                  return $rootScope.messages.unshift(msg);
                });
              });
              PubNub.ngHistory({
                channel: 'rvb_ganked',
                count: 500
              });
              return console.log("initialized");
            }
          });    
        }
      });
      
      
      $rootScope.username = $scope.username;
      $hideDialog();      
    }
  }]);

