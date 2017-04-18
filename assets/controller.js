var app = angular.module("myApp",['ui.router']);
document.addEventListener('DOMContentLoaded', function () {
    if (!Notification) {
        alert('Desktop notifications not available in your browser. Try Chrome.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});

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
    //   console.log(messageConvo);
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
    console.log('c1 loaded');

    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
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

    socket.on("loadMessage",(msg)=>{
        // var message = {};
        var message = msg;
        messageService.addMessage(message);
        $scope.$apply();

    });

    socket.on("recieveMessage",(msg)=>{
        console.log('recieving message');
        var message = {};
        var message = msg;
    //    $scope.messages.push(message);
        console.log()
    //   console.log($scope.allInquiryList[msg.inquiryID].inquiryName);
        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

      console.log(msg);
        messageService.addMessage(message);
        $scope.$apply();

        if(message.messageUser!= 'admin'){
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {
                var notification = new Notification($scope.notificationtitle, {
                    icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
                    body: message.messageText,
                });

                notification.onclick = function () {
                    window.open("http://localhost:3000/#!/inbox/chat/"+msg.inquiryID);
                };

            }
        }

    });

    socket.on("updateInquiryList",(inquiryList)=>{
        $scope.allInquiryList = inquiryList;
        $scope.$apply();
        // console.log($scope.allRoomList);
    });

    // $scope.updateRead = (inq)=>{
    //     console.log(inq);
    //     socket.emit("updateLastRead",inq);
    // };


});

app.controller("chatBoxCtrl",($scope,$stateParams,messageService)=>{
    console.log('c 2 loaded');
    $scope.chatID = $stateParams.id; //get chat id
    $scope.messages = messageService.getMessage(); //get messages


    $scope.updateFilter = ()=>{
        $scope.filterR = {'inquiryID': $stateParams.id};
        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });
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

    // $scope.updateRead = ()=>{
    //     socket.emit("updateLastRead2",$scope.chatID);
    // };

});
