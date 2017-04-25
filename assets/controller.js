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
$urlRouterProvider.otherwise("home");
  $stateProvider
    .state('home',{
        url:"/home",
        templateUrl: "templates/home.html"
    })
    .state('home.admin',{
      url:"/admin",
      templateUrl: "templates/admin.html"
    })
    //
    // .state('admin.create',{
    //   url:"/admin/create",
    //   templateUrl: "templates/adminCreate.html"
    // })
    //
    // .state('admin.info',{
    //   url:"/admin/info",
    //   templateUrl: "templates/info.html"
    // })
    //
    .state('home.history',{
      url: '/history',
      templateUrl: "templates/history.html"
    })
    //
    // .state('history.content',{
    //   url: '/history/content',
    //   templateUrl: "templates/historyContent.html"
    // })
    //
    .state('home.inbox',{
      url: '/inbox',
      templateUrl: "templates/inbox.html"
    })

    .state('home.inbox.chat',{
      url: '/chat/:id',
      templateUrl: "templates/chats.html"
    })
    .state('login',{
        url:'/login',
        templateUrl:"templates/login.html"
    })
    // .state('/', {
    //     url: '/',
    //     templateUrl: "templates/home.html"
    //
    // })
    ;
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

var socket= io.connect("http://localhost:3000");
console.log('loading angular');

app.controller("loginCtrl",($scope,$state)=>{
    // $state.go('home');
    console.log('at login');

    // console.log(socket);
    $scope.register = (email,pass)=>{
        console.log(email + pass);
        socket.emit("registerUser",email,pass);

    };

    socket.on("registerError",(err)=>{
        alert(err);
    });


    $scope.login = (email,pass)=>{
        console.log(email + pass);
        socket.emit("loginUser",email,pass);
    };

    socket.on("redirectToInbox",(user)=>{
        // console.log(user);
        $state.go('home');
        // window.location = "http://localhost:3000/#!/";
    });

    socket.on("redirectToLogin",(user)=>{
        // console.log(user);
        console.log('2');
        $state.go('login');
        // window.location = "http://localhost:3000/#!/";
    });

});




app.controller("chatCtrl",($scope, $stateParams, messageService,$state)=>{
    // console.log(socket);
    socket.emit("getUser");
    // $state.go('login');

    socket.emit("retrieveInfo");

    // $state.go('inbox');
    // console.log('c1 loaded');
    socket.on("redirectToLogin1",()=>{
        // console.log(user);
        console.log('1');
        $state.go('login');
        // window.location = "http://localhost:3000/#!/";
    });

    $scope.logout = ()=>{
        socket.emit("logoutUser");
    };

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
        // console.log()
    //   console.log($scope.allInquiryList[msg.inquiryID].inquiryName);
        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

    //   console.log(msg);
        messageService.addMessage(message);
        $scope.$apply();

        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });

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

    $scope.updateRead = (inq)=>{
        console.log(inq);
        socket.emit("updateLastRead",inq);
    };


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

    $scope.updateRead = ()=>{
        socket.emit("updateLastRead2",$scope.chatID);
    };

});
