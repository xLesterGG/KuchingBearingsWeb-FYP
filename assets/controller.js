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
      url: '/inbox/chat/:id',
      templateUrl: "templates/chats.html"
    });





})



app.controller("chatCtrl",($scope, $stateParams)=>{
    var socket = io.connect("http://localhost:3000");

    $scope.required = true;
    $scope.chatID = $stateParams.id; //get chat id
//    console.log(chatID.length);
    console.log(socket);
    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.joinedRooms = [];
    $scope.allRoomList = [];

    $scope.messages = [];
    $scope.filterRoom = '';

    $scope.filterR = '';

    $scope.updateFilter = ()=>{
        console.log($scope.filterRoom);
        if($scope.filterRoom == 'clear'){
            $scope.filterR = {};
        }
        else{
            $scope.filterR = {'roomID': $scope.filterRoom};
        }
    };


    $scope.joinServer = (username)=>{
        socket.emit("join", username);
        $scope.hideName = true;
        $scope.hideRoom = false;
    };

    $scope.createRoom = ()=>{
        if($scope.rname==''){
            alert('Enter room name')
        }else{
            socket.emit("createRoom",$scope.rname);
            $scope.hideSend = false;
        }
    };

    $scope.autojoinRoom = ()=>{

      socket.emit("joinRoom",$scope.chatID);
      console.log("init");
    };

    $scope.joinRoom = ()=>{
        if($scope.rname==''){
            alert('Enter room name');
        }else{
            socket.emit("joinRoom",$scope.rname);
            $scope.hideSend = false;
        }
    };


    $scope.sendMessage = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            toSend.dest = $scope.selectedChannel;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend);
        }
    };

    $scope.sendMessage2 = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            toSend.dest = $scope.chatID;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend);
        }
    };


    socket.on("systemMessage", (msg)=>{
        var message = {};
        message.msg = msg;
        message.type = "system";

        $scope.messages.push(message);
        $scope.$apply();

        console.log(message.msg);
    });

    socket.on("listRoom",(r)=>{
        var message = {};
        message.msg = r;
        message.type="list"

        $scope.messages.push(message);
        $scope.$apply();
    });

    socket.on("getJoinedRooms",(joinedRooms)=>{
        var message = {};
        message.msg = joinedRooms.msg;
        message.type="joined"

        $scope.messages.push(message);
        $scope.joinedRooms = joinedRooms.list;
        $scope.$apply();
    });

    socket.on("sendMessage",(msg)=>{
        var message = {};
        var message = msg;
        message.type = "message";


        $scope.messages.push(message);
        $scope.$apply();

        console.log($scope.messages);
    });

    socket.on("updateRoomList",(roomList)=>{
        $scope.allRoomList = roomList;
        $scope.$apply();
        // console.log($scope.allRoomList);
    });


});
