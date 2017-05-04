var app = angular.module("myApp",['ui.router']);
document.addEventListener('DOMContentLoaded', function () {
    if (!Notification) {
        alert('Desktop notifications not available in your browser. Try Chrome.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});



var socket= io.connect("http://localhost:3000");

app.controller("loginCtrl",($scope,$state)=>{
    // $state.go('home');

    $scope.showlogin = true;

    $scope.register = (email,pass)=>{
        console.log(email + pass);
        socket.emit("registerUser",email,pass);
    };

    $scope.resetPassword = (email)=>{
        socket.emit("resetPassword",email);
    };

    socket.on("errorMsg",(err)=>{
        alert(err);
    });


    $scope.login = (email,pass)=>{
        console.log(email + pass);
        socket.emit("loginUser",email,pass);
    };

    socket.on("resetSuccessful",(mess)=>{
        alert(mess);
        location.reload();

    });

    socket.on("redirectToInbox",(user)=>{
        $state.go('home');
    });

    socket.on("redirectToLogin",(user)=>{
        $state.go('login');
    });

});




app.controller("chatCtrl",($scope, $stateParams, messageService,$state,inqService)=>{
    socket.emit("getUser");

    socket.emit("retrieveInfo");

    // $state.go('inbox');
    // socket.on("redirectToLogin1",()=>{
    //     // console.log(user);
    //     // console.log('1');
    //
    //
    //     // $state.go('login');
    //     // window.location = "http://localhost:3000/#!/";
    // });

    $scope.logout = ()=>{
        socket.emit("logoutUser");
    };

    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.allInquiryList = [];

    $scope.messages = [];

    $scope.hideName = true;
    $scope.hideRoom = false;

    socket.on("loadMessage",(msg)=>{
        var message = msg;
        messageService.addMessage(message);
        $scope.$apply();

    });

    socket.on("recieveMessage",(msg)=>{
        console.log('recieving message');
        var message = {};
        var message = msg;

        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

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

        inqService.addInq(inquiryList);
        $scope.$apply();
    });

    $scope.updateRead = (inq)=>{
        // console.log(inq);
        socket.emit("updateLastRead",inq);
    };


});

app.controller("chatBoxCtrl",($scope,$stateParams,messageService,inqService)=>{

    $scope.chatID = $stateParams.id; //get chat id
    $scope.messages = messageService.getMessage(); //get messages

    $scope.currentInq = {};
    $scope.bearing1= [];
    $scope.allInq = {};

    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.currentInq = $scope.allInq[$scope.chatID];

        for(var i=0;i<$scope.currentInq['bearings'].length;i++ ){
            $scope.bearing1.push($scope.currentInq['bearings'][i].serialNo);
        }

        console.log($scope.bearing1);
    };

    $scope.updateBearings = (index,serial)=>{
        $scope.bearing1[index] = serial;
    };

    $scope.ppu = [];
    $scope.quantity = [];
    $scope.total = [];
    $scope.bearing= [];
    $scope.gTotal = 0;

    $scope.getTotal = ()=>{
        var l = $scope.ppu.length;
        console.log('length is' + l);
        var total = 0;
        for(var i =0; i<l; i++)
        {
            // console.log($scope.ppu[i] +"*"+ $scope.quantity[i])
            total = total + ($scope.ppu[i] * $scope.quantity[i]);
        }

        $scope.gTotal = total;
    };

    $scope.sendQuote = ()=>{
        // socket.emit("sendQuote",$scope.currentInq,$scope.currentInqOri);
        $scope.data = [];
        // console.log($scope.ppu);

        for(var i = 0; i < $scope.ppu.length;i++){
            var serial = $scope.bearing1[i];
            var q = $scope.quantity[i];
            var ppu = $scope.ppu[i];
            var t = $scope.total[i];

            var c = {};
            c['serialNo']= serial;
            c['quantity'] = q;
            c['pricePerUnit'] = ppu;
            c['total'] = q * ppu;

            $scope.data.push(c);
            // console.log(c);
        }

        $scope.tosend = {};
        $scope.tosend.bearings = $scope.data;
        $scope.tosend.gTotal = $scope.gTotal;

        // console.log($scope.tosend);

        // $scope.data.push()
        // console.log($scope.currentInq);
    };

    $scope.addRow = ()=>{
        $scope.currentInq.bearings.push({});
        $scope.bearing1.push('');
    };

    $scope.removeRow= (index)=>{
        if(index>-1)
        {
            $scope.currentInq.bearings.splice(index,1);
            $scope.ppu.splice(index,1);
            $scope.quantity.splice(index,1);
            // $scope.total.splice(index,1);

            $scope.bearing1.splice(index,1);

            console.log($scope.total);
            $scope.getTotal();
        }
    };


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
        socket.emit("joinRoom",$scope.chatID);
    };

    $scope.updateRead = ()=>{
        socket.emit("updateLastRead2",$scope.chatID);
    };

});

app.filter('customFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            if (item.inquiryID === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
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


app.service('inqService', function() {
    var inqList = [];

    var addInq = function(newObj) {
    //   inqList.push(newObj);
        inqList = newObj;
    };

    var getInq = function(){
      return inqList;
    };

    return {
        addInq: addInq,
        getInq: getInq
    };

});

app.service('messageService',function() {

    var messageConvo = [];
    var addMessage = function(newObj){
      messageConvo.push(newObj);
    };

    var getMessage = function(){
    return messageConvo;
    };

    return {
        addMessage: addMessage,
        getMessage: getMessage
    };
});
