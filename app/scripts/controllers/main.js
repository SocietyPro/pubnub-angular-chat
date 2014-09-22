'use strict';

/**
 * @ngdoc function
 * @name pajsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pajsApp
 */
angular.module('pajsApp')
  .controller('MainCtrl',['$scope','$rootScope','$materialDialog', function ($scope,$rootScope,$materialDialog) {
    $scope.selectedChannel = "";
    var hideDialog = $materialDialog({
      templateUrl:"views/login.html",
      clickOutsideToClose: false,
      escapeToClose: false,
      controller: "loginCtrl"
    });

    $scope.users = [];
    $scope.messages = [];
    $scope.username = "";

    $rootScope.$watch('users',function () {
      $scope.users = $rootScope.users;
    });

    $rootScope.$watch('messages',function () {
      $scope.messages = $rootScope.messages;
    });
    $rootScope.$watch('username',function () {
      $scope.username = $rootScope.username;
    });

    $scope.signOut = function () {
      // body...
        $rootScope.pubnub.unsubscribe({
          channel: 'rvb_ganked'
        });
        var hideDialog = $materialDialog({
          templateUrl:"views/login.html",
          clickOutsideToClose: false,
          escapeToClose: false,
          controller: "loginCtrl"
        });

    }


    $scope.publish = function() {
      console.log('publish', $scope);
      $rootScope.pubnub.publish({
        channel: 'rvb_ganked',
        message: {
          text: $scope.newMessage,
          user: $rootScope.username
        }
      });
      return $scope.newMessage = '';
    };

  }])

  .controller('loginCtrl',['$scope','$rootScope','$hideDialog',function($scope,$rootScope,$hideDialog){
    $rootScope.users = [];
    $rootScope.messages = [];
    $rootScope.username = "";
    $scope.username = 'Cambrian' + Math.floor(Math.random() * 1000);
    $scope.login = function () {
      $scope.uuid = $scope.username;
      $rootScope.pubnub = PUBNUB.init({
        publish_key:'pub-c-8781d89b-1000-422d-b6ec-b75340d087bc',
        subscribe_key:'sub-c-fda9bb42-b75a-11e2-bc76-02ee2ddab7fe',
        uuid:$scope.uuid,
        ssl:true
      });
      $rootScope.pubnub.subscribe({
        restore: false,
        channel: 'rvb_ganked',
        connect: function (connect) {
          $rootScope.pubnub.here_now({
            channel: "rvb_ganked",
            callback: function (u) {
              $rootScope.$apply(function () {
                // body...
                $rootScope.users = u.uuids;
              });
            }
          });
        },
        message: function(m) {
            var msg;
            msg = m.user ? "[" + m.user + "] " + m.text : "[unknown] " + m;
            return $rootScope.$apply(function() {
              return $rootScope.messages.unshift(msg);
            });
        },
        presence   : function( message, env, channel ) {
          $rootScope.$apply(function  () {
            console.log(message);
            console.log(env);
            console.log(channel);
            if (message.action == "join") {
              $rootScope.users.push(message.uuid);
            } else {
              $rootScope.users.splice($rootScope.users.indexOf(message.uuid), 1);
            }
          });
        }
      });
      $rootScope.pubnub.history({
        channel: 'rvb_ganked',
        count: 500,
        callback: function(m){
          $rootScope.$apply(function(){
            for (var i = 0; i < m[0].length; i++) {
              var msg;
              msg = m[0][i].user ? "[" + m[0][i].user + "] " + m[0][i].text : "[unknown] " + m[0][i];
              $rootScope.messages.unshift(msg);
            }
          });
        }
      });
      console.log("initialized");
      $rootScope.username = $scope.username;
      $hideDialog();      
    }
  }]);

