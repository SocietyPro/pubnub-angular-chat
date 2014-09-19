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
    $scope.selectedChannel = "";
    $scope.controlChannel = '__controlchannel';
    $scope.channels = [];

    $scope.signOut = function () {
      // body...
      if ($scope.selectedChannel) {
        PubNub.ngUnsubscribe({
          channel: $scope.selectedChannel
        });
        $scope.selectedChannel = "";
        PubNub.destroy();
        var hideDialog = $materialDialog({
          templateUrl:"views/login.html",
          clickOutsideToClose: false,
          escapeToClose: false,
          controller: "loginCtrl"
        });
      }

    }
    
    $scope.logged = function() {
      return PubNub.initialized();
    }

    $scope.createChannel = function() {
      var hideDialog = $materialDialog({
        templateUrl:"views/createChannel.html",
        clickOutsideToClose: false,
        escapeToClose: false,
        controller: "createChannelCtrl"
      });
    }

    $scope.check = function(channel) {
      var _ref;
      console.log('subscribe', channel.name);
      if (channel.name === $scope.selectedChannel) {
        return;
      }
      var auth_key = null;
      if (channel.priv) {
        var hideDialog = $materialDialog({
        templateUrl:"views/subscribeChannel.html",
        clickOutsideToClose: false,
        escapeToClose: false,
        locals: {
          channel: channel
        },
        controller: function ($scope, PubNub, $hideDialog, $rootScope) {
            $scope.channel = channel;
            $scope.subscribe = function () {
              console.log("$scope.auth_key",$scope.auth_key);
              $rootScope.subscribe($scope.channel,$scope.auth_key);
              $hideDialog();
            }
          }
        });   
      } else {
        auth_key = null;
        $rootScope.subscribe(channel, auth_key);
      }
    }
    $rootScope.subscribe = function (channel, auth_key) {
      console.log("auth_key",auth_key);
      console.log("channel",channel.name);
      PubNub.ngSubscribe({
        channel: channel.name,
        auth_key: auth_key,
        error: function() {
          console.log("Error");
          return console.log(arguments);
        }
      });
      if ($scope.selectedChannel) {
        PubNub.ngUnsubscribe({
          channel: $scope.selectedChannel
        });
      }
      $scope.messages = [];
      $scope.selectedChannel = channel.name;
      $rootScope.$on(PubNub.ngPrsEv($scope.selectedChannel), function(ngEvent, payload) {
        return $scope.$apply(function() {
          console.log(payload);
          var newData, userData;
          userData = PubNub.ngPresenceData($scope.selectedChannel);
          console.log("presence data");
          console.log(PubNub.ngPresenceData($scope.selectedChannel));

          newData = {};

          console.log("list precense",PubNub.ngListPresence($scope.selectedChannel))
          $scope.users = PubNub.map(PubNub.ngListPresence($scope.selectedChannel), function(x) {
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
          console.log("users",$scope.users);
          return $scope.userData = newData;
        });
      });
      PubNub.ngHereNow({
        channel: $scope.selectedChannel
      });
      $rootScope.$on(PubNub.ngMsgEv($scope.selectedChannel), function(ngEvent, payload) {
        var msg;
        msg = payload.message.user ? "[" + payload.message.user + "] " + payload.message.text : "[unknown] " + payload.message;
        return $scope.$apply(function() {
          return $scope.messages.unshift(msg);
        });
      });
      return PubNub.ngHistory({
        channel: $scope.selectedChannel,
        auth_key: auth_key,
        count: 500
      });
    };

    $scope.publish = function() {
      console.log('publish', $scope);
      if (!$scope.selectedChannel) {
        return;
      }
      PubNub.ngPublish({
        channel: $scope.selectedChannel,
        message: {
          text: $scope.newMessage,
          user: $rootScope.username
        }
      });
      return $scope.newMessage = '';
    };

    $scope.$on('controlChannel', function (e,channel) {
      // body...
       console.log(channel);
       if ($scope.channels.indexOf(channel.name) < 0) {
          $scope.channels.push(channel);
          $scope.$apply();
          console.log($scope.channels); 
        
        }

    });

  }])

  .controller('loginCtrl',['$scope','PubNub','$rootScope','$hideDialog',function($scope,PubNub,$rootScope,$hideDialog){
    $scope.username = 'Cambrian ' + Math.floor(Math.random() * 1000);
    $scope.login = function () {
      $scope.uuid = Math.floor(Math.random() * 1000000) + '__' + $scope.username;
      PubNub.init({
        publish_key:'pub-c-bf1cbccf-f8bf-412a-8e2c-0930f6d87453',
        subscribe_key:'sub-c-5dfe513c-3fbe-11e4-98c8-02ee2ddab7fe',
        secret_key: "sec-c-YzM0OGY3ZmItOGMwNy00ODIzLWFjZjgtZTg4OGUwNzA3ZDRj",
        uuid:$scope.uuid
      });
      PubNub.ngGrant({
        channel: '__controlchannel',
        read: true,
        write: true,
        callback: function() {
          return console.log("control channel all set", arguments);
        }
      });
      PubNub.ngGrant({
        channel: '__controlchannel-pnpres',
        read: true,
        write: false,
        callback: function() {
          return console.log('control channel presence all set', arguments);
        }
      });
      PubNub.ngSubscribe({
      channel: '__controlchannel'
    });

    $rootScope.$on(PubNub.ngMsgEv('__controlchannel'), function(ngEvent, payload) {
      console.log(payload);
      $rootScope.$broadcast('controlChannel',payload.message);
      
    });
    /* Get a reasonable historical backlog of messages to populate the channels list*/

    PubNub.ngHistory({
      channel: '__controlchannel',
      count: 500
    });
      console.log("initialized");
      $rootScope.username = $scope.username;
      $hideDialog();      
    }
  }])

  .controller('createChannelCtrl',['$scope','PubNub','$rootScope','$hideDialog',function($scope,PubNub,$rootScope,$hideDialog){
    $scope.create = function() {  
      var channel;
      console.log('createChannel', $scope);
      if (!$scope.newChannel) {
        return;
      }
      if ($scope.isChecked && !$scope.auth_key) {
        return;
      }
      var ak = $scope.isChecked? $scope.auth_key : null;
      console.log("ak",ak);
      channel = $scope.newChannel;
      $scope.newChannel = '';
      PubNub.ngGrant({
        channel: channel,
        read: true,
        write: true,
        auth_key: ak,
        callback: function() {
          return console.log("" + channel + " all set", arguments);
        }
      });
      PubNub.ngGrant({
        channel: "" + channel + "-pnpres",
        read: true,
        write: false,
        auth_key:ak,
        callback: function() {
          return console.log("" + channel + " presence all set", arguments);
        }
      });
      

      PubNub.ngPublish({
        channel: '__controlchannel',
        message: {
          name:channel,
          priv: $scope.isChecked
        }
      });
      $hideDialog();
    }
  }]);
