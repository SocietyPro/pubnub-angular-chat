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

    $rootScope.$watch('users',function () {
      $scope.users = $rootScope.users;
    });

    $rootScope.$watch('messages',function () {
      $scope.messages = $rootScope.messages;
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
        auth_key:"myAuthKey",
        uuid:$scope.uuid
      });
      PubNub.ngGrant({
        channel: 'rvb_ganked',
        read: true,
        write: true,
        callback: function() {
          return console.log("channel all set", arguments);
        }
      });
      PubNub.ngGrant({
        channel: 'rvb_ganked-pnpres',
        read: true,
        write: false,
        callback: function() {
          return console.log('channel presence all set', arguments);
        }
      });
      PubNub.ngSubscribe({
        channel: 'rvb_ganked'
      });
      /* Get a reasonable historical backlog of messages to populate the channels list*/
      $rootScope.$on(PubNub.ngPrsEv('rvb_ganked'), function(ngEvent, payload) {
            var newData, userData;
            userData = PubNub.ngPresenceData('rvb_ganked');
            newData = {};
            $rootScope.users = PubNub.map(PubNub.ngListPresence('rvb_ganked'), function(x) {
              var newX;
              console.log("x",x)
              newX = x;
              if (x.replace) {
                newX = x.replace(/\w+__/, "");
              }
              if (x.uuid) {
                newX = x.uuid.replace(/\w+__/, "");
              }
              newData[newX] = userData[x] || {};
              return newX;
            });
            $rootScope.$apply();
            return $scope.userData = newData;
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
      console.log("initialized");
      $rootScope.username = $scope.username;
      $hideDialog();      
    }
  }]);

