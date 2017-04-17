 var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io');
var uuid = require('node-uuid');
var Room = require('./room.js')
var firebase = require('firebase');


// var config = {
//     apiKey: "AIzaSyDmqaNP6Txo6uYapMozqvNwa5BuQtfY_4Y",
//     authDomain: "testing-97f82.firebaseapp.com",
//     databaseURL: "https://testing-97f82.firebaseio.com",
//     storageBucket: "testing-97f82.appspot.com",
//     messagingSenderId: "772760457598"
// };

var config = {
    apiKey: "AIzaSyBgaYoTGGIx-XX84lp8zrvgOI1_SFm6iaM",
    authDomain: "kuching-bearings.firebaseapp.com",
    databaseURL: "https://kuching-bearings.firebaseio.com",
    projectId: "kuching-bearings",
    storageBucket: "kuching-bearings.appspot.com",
    messagingSenderId: "630426422934"
  };

firebase.initializeApp(config);

var database = firebase.database();

app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css',express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/js', express.static(__dirname + '/node_modules/angular'));
app.use('/js', express.static(__dirname + '/assets'));
app.use('/css', express.static(__dirname + '/assets')); // for style.css
app.use('/socket.io',express.static(__dirname+'/node_modules/socket.io-client/dist'));
app.use('/js',express.static(__dirname + '/node_modules/firebase'));
app.use('/templates', express.static(__dirname + '/templates')); //template html
app.use('/js',express.static(__dirname + '/node_modules/angular-ui-router/release')); // redirect angular-ui-router


// app.get('/',(req,res)=>{
//     // res.send('hello');
//     res.sendFile(__dirname +'/index.html');
// });

app.get('/',(req,res)=>{
    // res.send('hello');
    res.sendFile(__dirname +'/home.html');
});

server.listen(3000,"localhost");
var socket = io.listen(server);

var people = {};
var inquiries = {};
var conversations = {};


var ready = false;
var a = database.ref('/inquiries'); // get changes to rooms


var c = database.ref('/conversations/'); // to receive incoming messages and update view


var isReady = false;

socket.on("connection",(client)=>{

    a.on('value',function(res){
        console.log('loaded / new inquiry');
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

    var b = database.ref('/conversations');
    b.on('child_added',(res)=>{ // when a new chat is created (called when person in new room sends message), create new entry in associative array
        console.log('child added')
        if(isReady){
            // console.log(res.val())
            console.log(res.key);

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
                }
            }


                // for(var key in res.val())
                // {
                //
                // }

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
                client.emit("recieveMessage",temp)
            }
        }

    });


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
                    console.log(inq.inquiryPeoples);

                    var data = {
                        inquiryPeoples: inq.inquiryPeoples,
                        inquiryName:inq.inquiryName,
                        inquiryID:inq.inquiryID,
                        inquiryOwner: inq.inquiryOwner
                    }

                    var update = {};
                    update['/inquiries/'+ inq.inquiryID] = data;
                    database.ref().update(update);


                }
            }
        }else{
            // console.log('elese undefined');
            // alert('Error: Room might not exist, please refresh!');
            // var queryHandler = require('special_query_handler');
            // app.get('/');
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
                    // msg.msg =  people[client.id].name + ": " +message.mess;
                    msg.msg = message.mess;
                    // msg.inquiryID = inq.inquiryID;
                    msg.sender = 'admin';
                    console.log(inq.inquiryID);

                    if(conversations[inq.inquiryID]== null){
                        console.log('not null');

                        database.ref('/conversations/'+inq.inquiryID).push({
                            messageText: msg.msg,
                            messageTime : parseInt(new Date().getTime()),
                            messageUser : msg.sender
                        });

                        var msg = {
                            messageText: msg.msg,
                            messageTime : parseInt(new Date().getTime()),
                            messageUser : msg.sender
                        }

                        var data = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg
                        }

                        var update = {};
                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);


                        // database.ref('/inquiries/'+ inq.inquiryID)
                    }
                    else{

                        database.ref('/conversations/'+inq.inquiryID).push({
                            messageText: msg.msg,
                            messageTime : parseInt(new Date().getTime()),
                            messageUser : msg.sender
                        });


                        var msg = {
                            messageText: msg.msg,
                            messageTime : parseInt(new Date().getTime()),
                            messageUser : msg.sender
                        }

                        var data = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg
                        }

                        var update = {};
                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);
                    }

                    break;
                }
            }
        }

    });

    client.on("updateLastRead",(inq)=>{

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
            lastMessage: msg
        }

        var update = {};
        update['/inquiries/'+ inq.inquiryID] = data;
        database.ref().update(update);

    });

    client.on("updateLastRead2",(inqID)=>{

        var inq = inquiries[inqID];
        // console.log(inq);

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
            lastMessage: msg
        }

        var update = {};
        update['/inquiries/'+ inq.inquiryID] = data;
        database.ref().update(update);

    });


});
