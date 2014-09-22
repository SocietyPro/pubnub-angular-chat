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
      var date = new Date();
      $rootScope.pubnub.publish({
        channel: 'rvb_ganked',
        message: {
          text: $scope.newMessage,
          user: $rootScope.username,
          date: date
        }
      });
      return $scope.newMessage = '';
    };

    $scope.panic = function () {
      console.log('pacnic',$scope);
      var date = new Date();
      $rootScope.pubnub.publish({
        channel: 'rvb_ganked',
        message: {
          text: "Panic Alert! Under Attacked!",
          user: $rootScope.username,
          panic: true,
          date: date
        }
      });
    }
    $scope.backup = function () {
      console.log('backup',$scope);
      var date = new Date();
      $rootScope.pubnub.publish({
        channel: 'rvb_ganked',
        message: {
          text: "I'm Going",
          user: $rootScope.username,
          backup: true,
          date: date
        }
      });
    }
    $scope.stand = function () {
      console.log('stand',$scope);
      var date = new Date();
      $rootScope.pubnub.publish({
        channel: 'rvb_ganked',
        message: {
          text: "No thanks!",
          user: $rootScope.username,
          stand: true,
          date: date
        }
      });
    }
    $scope.keypressListener = function (e) {
      console.log(e);
      if (e.keyCode == 13) {
        $scope.publish();
      }
    }

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
        ssl:true,
        cipher_key: 'my_super_secret_cipherkey'
      });
      $rootScope.pubnub.subscribe({
        restore: false,
        channel: 'rvb_ganked',
        connect: function (connect) {
          console.log("connnected with SSL and AES encryption");
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
          console.log(m);
            return $rootScope.$apply(function() {
              return $rootScope.messages.unshift(m);
            });
        },
        presence   : function( message, env, channel ) {
          $rootScope.$apply(function  () {
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
        count: 100,
        callback: function(m){
          console.log(m[0]);
          $rootScope.$apply(function(){
              $rootScope.messages = m[0].reverse();
          });
        }
      });
      console.log("initialized");
      $rootScope.username = $scope.username;
      $hideDialog();      
    }
  }]);

