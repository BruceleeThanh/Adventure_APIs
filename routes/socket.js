/**
 * Created by Brucelee Thanh on 28/06/2017.
 */
var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var user = require(path.join(__dirname, '../', 'cores/user.js'));
var conversation = require(path.join(__dirname, '../', 'cores/conversation.js'));
var message = require(path.join(__dirname, '../', 'cores/message.js'));

module.exports = function (io, redisClient) {
    //socket io
    io.sockets.on('connection', function (socket) {

        // call when user start application to store {id_user:socketId}
        socket.on('user_online', function (id_user) {
            authentication.cacheSocket(redisClient, id_user.toString(), socket.id);
            socket.id_user = id_user;
            console.log('connection on: ' + id_user + ' ' + socket.id);
        });

        // call when user click a conversation to join room
        socket.on('join_room', function (data) { // data : {id_conversation, id_user}
            var temp = JSON.parse(JSON.stringify(data));
            socket.join(temp.id_conversation);
            io.in(temp.id_conversation).emit('join_room', data);
            console.log('join room: ' + data);
        });

        // call when user leave a conversation to leave room
        socket.on('leave_room', function (data) { // data : {id_conversation, id_user}
            var temp = JSON.parse(JSON.stringify(data));

            socket.leave(temp.id_conversation);
            io.in(temp.id_conversation).emit('leave_room', data);
            console.log('leave room: ' + data);
        });

        // call when user send message (chat) in room
        socket.on('chat_to_room', function (data) { // data:{id_conversation, owner, content}
            var temp = JSON.parse(data);
            socket.broadcast.in(data.id_conversation).emit('new_message', data);
            message.create(temp, function (error, result) {
            });
            console.log('chat to room: ' + data);
        });

        // call when user typing
        socket.on('typing', function (data) { // data : {id_conversation, id_user}
            var temp = JSON.parse(JSON.stringify(data));
            io.in(temp.id_conversation).emit('typing', data);
        });

        // call when user stop typing
        socket.on('stop_typing', function (data) { // data : {id_conversation, id_user}
            var temp = JSON.parse(JSON.stringify(data));
            io.in(temp.id_conversation).emit('stop_typing', data);
        });

        // call when user shutdown application to disconnect
        socket.on('disconnect', function () {
            if (socket.id_user) {
                authentication.cleanSocket(redisClient, socket.id_user.toString());
            }
            user.saveLoginDate(socket.id_user, function (error, result) {
            });
            console.log('Disconnect.! ' + socket.id_user);
        });
    });
};