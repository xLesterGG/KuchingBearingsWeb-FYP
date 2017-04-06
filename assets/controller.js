var app = angular.module("myApp",['ui.router']);

app.config(function($stateProvider,$urlRouterProvider) {
//  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('admin',{
      url:"/admin",
      templateUrl: "templates/admin.html"
    })

    .state('admin.create',{
      url:"/admin/create",
      templateUrl: "templates/adminCreate.html"
    })

    .state('admin.info',{
      url:"/admin/info",
      templateUrl: "templates/info.html"
    })

    .state('history',{
      url: '/history',
      templateUrl: "templates/history.html"
    })

    .state('history.content',{
      url: '/history/content',
      templateUrl: "templates/historyContent.html"
    })

    .state('inbox',{
      url: '/inbox',
      templateUrl: "templates/inbox.html"
    })

    .state('inbox.chat',{
      url: '/chat/:id',
      templateUrl: "templates/chats.html"
    });


})

app.service('messageService',function() {
  var messageConvo = [];

  var addMessage = function(newObj){
      messageConvo.push(newObj);
    //   console.log(newObj);
  };

  var getMessage = function(){
    return messageConvo;
  };

  return {
    addMessage: addMessage,
    getMessage: getMessage
  };
});

var socket = io.connect("http://localhost:3000");

app.controller("chatCtrl",($scope, $stateParams, messageService)=>{

    // $scope.required = true;
//    console.log(chatID.length);
    // console.log(socket);
    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.joinedRooms = [];
    $scope.allInquiryList = [];

    $scope.messages = [];

    // socket.emit("join", 'asdf');
    $scope.hideName = true;
    $scope.hideRoom = false;



    // $scope.joinServer = (username)=>{
    //
    //     console.log(username);
    //     socket.emit("join", username);
    //     $scope.hideName = true;
    //     $scope.hideRoom = false;
    // };


    socket.on("sendMessage",(msg)=>{
        var message = {};
        var message = msg;

      //  $scope.messages.push(message);

      console.log(msg);
        messageService.addMessage(message);
        $scope.$apply();

      //  console.log($scope.messages[0].messageText);

    });

    socket.on("updateInquiryList",(inquiryList)=>{
        $scope.allInquiryList = inquiryList;
        $scope.$apply();
        // console.log($scope.allRoomList);
    });


});

app.controller("chatBoxCtrl",($scope,$stateParams,messageService)=>{
    $scope.chatID = $stateParams.id; //get chat id
      $scope.messages = messageService.getMessage(); //get messages
    //   console.log($scope.messages[0]);


    // $scope.filterRoom = '';

    // $scope.filterR = '';

    $scope.updateFilter = ()=>{
    //     // console.log($scope.filterRoom);
    //     // if($scope.filterRoom == 'clear'){
    //     //     $scope.filterR = {};
    //     // }
    //     // else{
            $scope.filterR = {'inquiryID': $stateParams.id};
    //     // }
    };


    $scope.sendMessage2 = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            toSend.dest = $scope.chatID;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend);
            $scope.inputMessage = '';
        }
    };

    $scope.autojoinRoom = ()=>{
        console.log($scope.chatID);
      socket.emit("joinRoom",$scope.chatID);
    //   console.log("init");
    };

});
