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
            authentication.cacheSocket(redisClient, id_user, socket.id);
            socket.id_user = id_user;
            console.log('connection on: ' + id_user + ' ' + socket.id);
        });

        // call when user click a conversation to join room
        socket.on('join_room', function (data) { // data : {room_id, id_user}
            var temp = JSON.parse(JSON.stringify(data));
            socket.join(temp.room_id);
            io.to(temp.room_id).emit({
                join: temp
            });
        });

        // call when user leave a conversation to leave room
        socket.on('leave_room', function (data) { // data : {room_id, id_user}
            var temp = JSON.parse(JSON.stringify(data));
            socket.leave(temp.room_id);
            io.to(temp.room_id).emit({
                leave: temp
            });
        });

        // call when user send message (chat) in room
        socket.on('chat_to_room', function (data) { // data:{room_id, id_sender, message}
            var temp = JSON.parse(JSON.stringify(data));

            io.to(temp.room_id).emit({

            })
        });

        socket.on('server_receive', function (data) {
            console.log(data);
            // emit to all user
            io.sockets.emit('server_send', {data: data + ".!"});
            // emit to sent user
            socket.emit('server_send', {data: data + ".!"});
        });

        // call when user shutdown application to disconnect
        socket.on('disconnect', function () {
            authentication.cleanSocket(redisClient, socket.id_user);
            user.saveLoginDate(socket.id_user, function (error, result) {
            });
            console.log('Disconnect.! ' + socket.id_user);
        });
    });
};