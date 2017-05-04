 var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io');
var uuid = require('node-uuid');


// var config = {
//     apiKey: "AIzaSyDmqaNP6Txo6uYapMozqvNwa5BuQtfY_4Y",
//     authDomain: "testing-97f82.firebaseapp.com",
//     databaseURL: "https://testing-97f82.firebaseio.com",
//     storageBucket: "testing-97f82.appspot.com",
//     messagingSenderId: "772760457598"
// };

// var config = {
//     apiKey: "AIzaSyBgaYoTGGIx-XX84lp8zrvgOI1_SFm6iaM",
//     authDomain: "kuching-bearings.firebaseapp.com",
//     databaseURL: "https://kuching-bearings.firebaseio.com",
//     projectId: "kuching-bearings",
//     storageBucket: "kuching-bearings.appspot.com",
//     messagingSenderId: "630426422934"
//   };

var config = {
    apiKey: "AIzaSyAs4US9O4tjsC_DZdcgmbPT3D0Xd179od4",
    authDomain: "kuchingbearings.firebaseapp.com",
    databaseURL: "https://kuchingbearings.firebaseio.com",
    projectId: "kuchingbearings",
    storageBucket: "kuchingbearings.appspot.com",
    messagingSenderId: "1033971329142"
  };





app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts')); // redirect bootstrap JS


app.use('/css',express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/angular'));
app.use('/js', express.static(__dirname + '/assets'));
app.use('/css', express.static(__dirname + '/assets')); // for style.css
app.use('/socket.io',express.static(__dirname+'/node_modules/socket.io-client/dist'));
app.use('/js',express.static(__dirname + '/node_modules/firebase'));
app.use('/templates', express.static(__dirname + '/templates')); //template html
app.use('/js',express.static(__dirname + '/node_modules/angular-ui-router/release')); // redirect angular-ui-router

// app.use('/js',express.static(__dirname+'/node_modules/firebase/'));


// app.get('/',(req,res)=>{
//     // res.send('hello');
//     res.sendFile(__dirname +'/index.html');
// });

// app.get('/',(req,res)=>{
//     // res.send('hello');
//     res.sendFile(__dirname +'/home.html');
// });

app.get('/',(req,res)=>{
    // res.send('hello');
    res.sendFile(__dirname +'/index1.html');
});


// app.get('/login',(req,res)=>{
//     // res.send('hello');
//     res.sendFile(__dirname +'/login.html');
// });


server.listen(3000,"localhost");
var socket = io.listen(server);
var people = {};
var inquiries = {};
var conversations = {};

var firebase = require('firebase');
firebase.initializeApp(config);
var database = firebase.database();


var ready = false;
var isReady = false;

var a = database.ref('/inquiries'); // get changes to rooms
var b = database.ref('/conversations');
var c = database.ref('/conversations/'); // to receive incoming messages and update view


socket.on("connection",(client)=>{
    var currentUser;

    client.on("getUser",()=>{
        if(currentUser == undefined){
            client.emit("redirectToLogin1");
        }
    });


    client.on("retrieveInfo",()=>{
        console.log('retrieving');

        a.on('value',function(res){
            // console.log('loaded / new inquiry');
            for(var r in res.val()){
                 inquiries[r] = res.val()[r];
            }

            ready = true;
            socket.sockets.emit("updateInquiryList",inquiries);
        });

        database.ref('/conversations').once('value').then((res)=>{ // retrieve once client is connected
            console.log('get once');
            if(res.val() != null ){
                for(var key in res.val()){
                    conversations[key] = res.val()[key];
                }

                for(var k in conversations){
                  for(var j in conversations[k]){
                    var temp = conversations[k][j];
                    temp.inquiryID = k;
                    client.emit("loadMessage",temp);
                    // socket.sockets.emit("loadMessage",temp);

                    // console.log (temp.messageText);
                  }
                }

                isReady = true;
            }
            else{
                //something to say no enquiries yet
                isReady = true;
            }
        });

        b.on('child_added',(res)=>{ // when a new chat is created (called when person in new room sends message), create new entry in associative array
            if(isReady){

                if(conversations[res.key] == undefined)
                {
                    conversations[res.key] = {};
                    for(var k in res.val()){

                        // console.log(res.val()[k]);
                        conversations[res.key][k] = res.val()[k];
                        var temp = conversations[res.key][k];
                        temp.inquiryID = res.key;
                        console.log('temp is');
                        console.log(temp);
                        // console.log('key is ' + key);
                        client.emit("recieveMessage",temp)
                        // socket.sockets.emit("recieveMessage",temp);

                    }
                }

            }
        });

        c.on('child_changed',(res)=>{
            // console.log('child changed')
            var l = Object.keys(conversations[res.key]).length;
            var c = 0;

            for(var key in res.val()){
                c++;
                if(c > l){
                    console.log('new message')
                    conversations[res.key][key] = (res.val()[key]);
                    var temp = res.val()[key];
                    temp.inquiryID = res.key
                    // client.emit("recieveMessage",temp)
                    socket.sockets.emit("recieveMessage",temp);

                }
            }

        });
    });



    // console.log('count is'+ socket.engine.clientsCount);

    client.on("joinRoom", (id)=>{
        var inq = inquiries[id];
        if(inq != undefined){
            if('admin' === inq.inquiryOwner){
                // client.emit("systemMessage","You are the owner of this room and you have already been joined.");
            }else{

                var found = false;
                for(var i=0;i<inq.inquiryPeoples.length;i++){
                    if(inq.inquiryPeoples[i] == 'admin'){
                        found = true;
                        break;
                    }
                }

                if(found){

                    // client.emit("systemMessage", "You have already joined this room.");
                }else{

                    inq.inquiryPeoples.push('admin');
                    // console.log(inq.inquiryPeoples);

                    if(inq.lastMessage != undefined){
                        var msg = {
                                messageText: inq.lastMessage.messageText,
                                messageTime : inq.lastMessage.messageTime,
                                messageUser : inq.lastMessage.messageUser,
                                messageRead : true
                        }

                        var data = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg,
                            bearings: inq.bearings
                        }

                        var update = {};
                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);
                    }
                    else{
                        var data = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            bearings: inq.bearings
                        }

                        var update = {};
                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);
                    }
                }
            }
        }else{

            //some error here
        }

    });


    client.on("sendMessage",(message)=>{ // message, room id,
        var inq = inquiries[message.dest]; // inquiry id
        console.log('sending');

        if(inq== null){
            // do something
            console.log('null');
        }else{
            var found = false;
            for(i=0;i<inq.inquiryPeoples.length;i++){
                if(inq.inquiryPeoples[i] === 'admin'){ // check if in room

                    var msg = {};
                    msg.msg = message.mess;
                    msg.sender = 'admin';
                    // console.log(inq.inquiryID);
                    // console.log('not null');
                    var unread = 0;

                    if(inq.msgUnreadCountForMobile == undefined){
                        unread = 1;
                    }
                    else{
                        unread = inq.msgUnreadCountForMobile + 1;
                    }

                    var uid = uuid.v4();


                    database.ref('/conversations/'+inq.inquiryID).push({
                        messageText: msg.msg,
                        messageTime : parseInt(new Date().getTime()),
                        messageUser : msg.sender,
                        messageRead: false,
                        messageID:uid
                    });

                    var msg = {
                        messageText: msg.msg,
                        messageTime : parseInt(new Date().getTime()),
                        messageUser : msg.sender,
                        messageRead: false,
                        messageID:uid
                    }

                    var data = {
                        inquiryPeoples: inq.inquiryPeoples,
                        inquiryName:inq.inquiryName,
                        inquiryID:inq.inquiryID,
                        inquiryOwner: inq.inquiryOwner,
                        lastMessage: msg,
                        msgUnreadCountForMobile: unread,
                        bearings : inq.bearings
                    }

                    var update = {};
                    update['/inquiries/'+ inq.inquiryID] = data;
                    database.ref().update(update);
                    // database.ref('/inquiries/'+ inq.inquiryID)

                    break;
                }
            }
        }

    });

    client.on("updateLastRead",(inq)=>{

        if(inq.lastMessage!= undefined && inq.lastMessage.messageUser!='admin'){
            var msg = {
                messageText: inq.lastMessage.messageText,
                messageTime : inq.lastMessage.messageTime,
                messageUser : inq.lastMessage.messageUser,
                messageRead : true
            }

            var data = {
                inquiryPeoples: inq.inquiryPeoples,
                inquiryName:inq.inquiryName,
                inquiryID:inq.inquiryID,
                inquiryOwner: inq.inquiryOwner,
                lastMessage: msg,
                bearings:inq.bearings
            }

            var update = {};
            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);
        }


    });

    client.on("updateLastRead2",(inqID)=>{

        var inq = inquiries[inqID];
        // console.log(inq);
        if(inq.lastMessage!= undefined && inq.lastMessage.messageUser!='admin'){
            var msg = {
                messageText: inq.lastMessage.messageText,
                messageTime : inq.lastMessage.messageTime,
                messageUser : inq.lastMessage.messageUser,
                messageRead : true
            }

            var data = {
                inquiryPeoples: inq.inquiryPeoples,
                inquiryName:inq.inquiryName,
                inquiryID:inq.inquiryID,
                inquiryOwner: inq.inquiryOwner,
                lastMessage: msg,
                bearings:inq.bearings
            }

            var update = {};
            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);
        }

    });

    client.on("registerUser",(email,password)=>{
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // ...

          console.log(errorCode);
          console.log(errorMessage);

          client.emit("errorMsg",errorMessage);
        });
    });

    client.on("loginUser",(email,password)=>{
        console.log('logging in');
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;

          if(errorCode == 'auth/wrong-password'){
              client.emit("errorMsg","Wrong password, please try again");
          }else if(errorCode == 'auth/user-not-found'){
              client.emit("errorMsg","No such account, please try again");
          }else{
              client.emit("errorMsg",errorMessage);
          }
        //   console.log(errorCode);

        });

        firebase.auth().onAuthStateChanged(user => {
            if(user!=undefined) {
                console.log('logged in');
            // window.location = 'home.html'; //After successful login, user will be redirected to home.html
                currentUser = user;
                client.emit("redirectToInbox",user);
            }else{
                console.log('logged out');
                client.emit("redirectToLogin1");
            }
        });


    });

    client.on("logoutUser",()=>{
        firebase.auth().signOut().then(function() {
          // Sign-out successful.
        }, function(error) {
          // An error happened.
        });
    });

    client.on("sendQuote",(b,inq)=>{

        if(inq.lastMessage != undefined){

            var data = {
                inquiryPeoples: inq.inquiryPeoples,
                inquiryName:inq.inquiryName,
                inquiryID:inq.inquiryID,
                inquiryOwner: inq.inquiryOwner,
                lastMessage: inq.lastMessage,
                bearings: inq.bearings,
                quotes: b
            }

            var update = {};
            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);
        }
        else{
            var data = {
                inquiryPeoples: inq.inquiryPeoples,
                inquiryName:inq.inquiryName,
                inquiryID:inq.inquiryID,
                inquiryOwner: inq.inquiryOwner,
                bearings: inq.bearings,
                quotes: b
            }

            var update = {};
            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);
        }


    });

    client.on("resetPassword",(email)=>{
        firebase.auth().sendPasswordResetEmail(email).then(function() {
            client.emit("resetSuccessful","Reset email sent successfully");
          // Email sent.
        }, function(error) {
          // An error happened.
        });

    });






});
