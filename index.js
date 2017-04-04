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
a.on('value',function(res){
    console.log('loaded / new inquiry');
    for(var r in res.val()){
         inquiries[r] = res.val()[r];
    }

    ready = true;
    // socket.sockets.emit("updateRoomList",rooms);
});




var isReady = false;

socket.on("connection",(client)=>{
    client.joinedRooms = [];
    client.ownedRooms = [];

    client.on("join",(name)=>{

        // console.log(name);

        database.ref('/conversations').once('value').then((res)=>{ // retrieve once client is connected
            // console.log(res.val());
            console.log('get once');
            if(res.val() != null ){
                for(var key in res.val()){
                    conversations[key] = res.val()[key];
                    // console.log(chats[key]);
                }
                isReady = true;
            }
            else{
                //something to say no enquiries yet
                isReady = true;
            }
        });

        var b = database.ref('/conversations');
        b.on('child_added',(res)=>{ // when a new chat is created (called when person in new room sends message)
            if(isReady){
                // console.log(res.val())
                for(var key in res.val())
                {
                    if(conversations[key] == undefined)
                    {
                        console.log('child added');
                        conversations[key] = res.val()[key];
                    }
                }

            }
        });

        var c = database.ref('/conversations');
        c.on('child_changed',(res)=>{

            var l = Object.keys(conversations[res.key]).length;

            // console.log('length is ' + l );
            var c = 0;

            for(var key in res.val()){
                c++;
                if(c > l){
                    conversations[res.key][key] = (res.val()[key]);
                    console.log(conversations[res.key]);
                    // console.log(res.val()[key].messageText);
                }
                    //    socket.to(res.val().messages[0].roomID).emit("sendMessage",res.val().messages[k]);

            }

        });

        // var joinedRooms = [];  // list of room ids
        // var ownedRooms = []; // list of room ids

        // people[client.id] = {"name" : name, "joinedRooms": joinedRooms, "ownedRooms": ownedRooms};   //create new people object
        // client.emit("systemMessage", "You (" + name + ") have connected to the server"); // alert

        var message;
        if(ready){
            if(Object.keys(inquiries).length == 0 ){
                message= "There are currently no inquiries";
            }else{
                // var msg = "The available inquiries are ";

                // var aR = [];
                // for(var key in inquiries){
                //     aR.push(inquiries[key]);
                // }

                // for(var i = 0 ; i < aR.length;i++){
                //     if(i==0){
                //         msg = msg + aR[i].inquiryName ;
                //     }
                //     else if(i == rooms.length -1){
                //         msg = msg + "," +aR[i].inquiryName + "." ;
                //     }
                //     else{
                //         msg = msg + ","+ aR[i].inquiryName ;
                //     }
                // }
                //
                // message  = msg;
            }
            // client.emit("listRoom",message); // list available rooms
            // socket.sockets.emit("updateRoomList",conversations);
        }

    });

    // client.on("createRoom",(name)=>{
    //     var id = uuid.v4();
    //     var room = new Room(name,id,client.id); // create room obj
    //
    //     // people[client.id].ownedRooms.push(room.id); // update people object
    //     // people[client.id].joinedRooms.push(room.roomID); // update people object
    //
    //     // room.addPerson(client.id); // update room object
    //     room.peoples.push(client.id);
    //
        // database.ref('/enquiries/'+room.id).set({
        //     roomName:room.name,
        //     roomID:room.id,
        //     roomOwner: room.owner,
        //     peoples : room.peoples
        // });
    //
    //     client.joinedRooms.push(room.id); // update socket object
    //     // client.ownedRooms.push(room.id); // update socket object
    //
    //     client.join(client.joinedRooms[client.joinedRooms.length -1 ], ()=>{ // join room
    //         socket.sockets.emit("updateRoomList",rooms);
    //
    //         client.emit("systemMessage","Welcome to room " + room.name +".");
    //         client.emit("systemMessage", "You are the owner of this room and you are automatically joined.");
    //         client.emit("systemMessage", "Room id is " + room.id);
    //
    //         var joinedRooms = {};
    //         joinedRooms.list = [];
    //
    //         var msg = "You are currenly joined to rooms : "
    //         for(var i = 0; i<client.joinedRooms.length;i++){
    //             if(i==0){
    //                    msg = msg + rooms[client.joinedRooms[i]].roomName ;
    //                    joinedRooms.list.push(rooms[client.joinedRooms[i]]);
    //                }
    //                else if(i == client.joinedRooms.length -1){
    //                    msg = msg + "," +rooms[client.joinedRooms[i]].roomName + "." ;
    //                    joinedRooms.list.push(rooms[client.joinedRooms[i]]);
    //                }
    //                else{
    //                    msg = msg + ","+ rooms[client.joinedRooms[i]].roomName ;
    //                    joinedRooms.list.push(rooms[client.joinedRooms[i]]);
    //                }
    //         }
    //         joinedRooms.msg = msg;
    //         client.emit("getJoinedRooms",joinedRooms); // list joined rooms
    //     });
    // });



    client.on("joinRoom", (id)=>{
        var inq = inquiries[id];

        if(inq != undefined){
            if('admin' === room.roomOwner){
                // client.emit("systemMessage","You are the owner of this room and you have already been joined.");
            }else{
                var found = false;
                for(var i=0;i<inq.inquiryPeoples.length;i++){
                    if(room.inquiryPeoples[i] == 'admin'){
                        found = true;
                        break;
                    }
                }


                if(found){
                    // client.emit("systemMessage", "You have already joined this room.");
                }else{
                    // room.addPerson(client.id);
                    // room.inquiryPeoples.push(client.id);

                    var data = {
                        inquiryPeoples: inq.inquiryPeoples,
                        inquiryName:inq.inquiryName,
                        inquiryID:inq.inquiryID,
                        inquiryOwner: inq.inquiryOwner
                    }

                    var update = {};
                    update['/inquiries/'+ inq.inquiryID] = data;
                    database.ref().update(update);

                    // people[client.id].joinedRooms.push(room.id);
                    // client.joinedRooms.push(room.roomID);
                    // client.join(client.joinedRooms[client.joinedRooms.length-1],()=>{
                    //
                    //     socket.sockets.in(room.roomID).emit("systemMessage",people[client.id].name + " has connected to the room "+ room.roomName);
                    //     client.emit("systemMessage","Welcome to room " + room.roomName +".");
                    //     client.emit("systemMessage", "Room id is " + room.roomID);
                    //
                    //     var joinedRooms = {};
                    //     joinedRooms.list = [];
                    //
                    //     var msg = "You are currenly joined to rooms : "
                    //     for(var i = 0; i<client.joinedRooms.length;i++){
                    //         if(i==0){
                    //                msg = msg + rooms[client.joinedRooms[i]].roomName ;
                    //                joinedRooms.list.push(rooms[client.joinedRooms[i]]);
                    //            }
                    //            else if(i == client.joinedRooms.length -1){
                    //                msg = msg + "," +rooms[client.joinedRooms[i]].roomName + "." ;
                    //                joinedRooms.list.push(rooms[client.joinedRooms[i]]);
                    //            }
                    //            else{
                    //                msg = msg + ","+ rooms[client.joinedRooms[i]].roomName ;
                    //                joinedRooms.list.push(rooms[client.joinedRooms[i]]);
                    //            }
                    //     }
                    //     joinedRooms.msg = msg;
                    //     client.emit("getJoinedRooms",joinedRooms); // list joined rooms
                    // });
                }
            }
        }else{
            // alert('Error: Room might not exist, please refresh!');
            // var queryHandler = require('special_query_handler');
            // app.get('/');
            //some error here
        }

    });




    client.on("sendMessage",(message)=>{ // message, room id,
        var inq = inquiries[message.dest];

        if(inq== null){
            // do something
            console.log('null');
        }else{
            var found = false;
            for(i=0;i<room.peoples.length;i++){
                if(room.peoples[i] === 'admin'){

                    var msg = {};
                    // msg.msg =  people[client.id].name + ": " +message.mess;
                    msg.msg = 'admin: ' +message.mess;

                    // msg.inquiryID = inq.inquiryID;
                    msg.sender = 'admin';

                    if(conversations[inq.inquiryID]== null){
                        // chats[room.roomID] = [];
                        // var a = [];
                        // a.push(msg);

                        database.ref('/conversations/'+room.roomID).set({
                            messageText: msg.msg,
                            messageTime : '1491267891768',
                            messageuser = msg.sender
                        });
                    }
                    else{
                        var b =  [];
                        // console.log('SENDING');
                        // console.log('length of ori' chats[room.roomID].length);
                        b = JSON.parse(JSON.stringify(chats[room.roomID]));
                        b.push(msg);
                        // console.log(b);
                        var data = {
                            messages : b
                        }

                        var update = {};
                        update['/chats/'+ room.roomID] = data;
                        database.ref().update(update);
                    }

                    // socket.to(room.id).emit("sendMessage",msg);
                    break;
                }
            }
        }

    });

});
