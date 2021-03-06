var path = require('path');

var user = require(path.join(__dirname, '/user.js'));
var friend = require(path.join(__dirname, '/friend.js'));
var friend_request = require(path.join(__dirname, '/friend_request.js'));
var status = require(path.join(__dirname, '/status.js'));
var file = require(path.join(__dirname, '/file.js'));
var trip = require(path.join(__dirname, '/trip.js'));
var trip_map = require(path.join(__dirname, '/trip_map.js'));
var trip_diary = require(path.join(__dirname, '/trip_diary.js'));
var trip_member = require(path.join(__dirname, '/trip_member.js'));
var like_status = require(path.join(__dirname, '/like_status.js'));
var news = require(path.join(__dirname, '/news.js'));
var comment_status = require(path.join(__dirname, '/comment_status.js'));
var notification = require(path.join(__dirname, '/notification.js'));
var group = require(path.join(__dirname, '/group.js'));
var group_member = require(path.join(__dirname, '/group_member.js'));
var conversation = require(path.join(__dirname, '/conversation.js'));
var message = require(path.join(__dirname, '/message.js'));

module.exports = function (app, redisClient) {
    user(app, redisClient);
    friend(app, redisClient);
    friend_request(app, redisClient);
    status(app, redisClient);
    file(app, redisClient);
    trip(app, redisClient);
    trip_map(app, redisClient);
    trip_diary(app, redisClient);
    trip_member(app, redisClient);
    like_status(app, redisClient);
    news(app, redisClient);
    comment_status(app, redisClient);
    notification(app, redisClient);
    group(app, redisClient);
    group_member(app, redisClient);
    conversation(app, redisClient);
    //message(app, redisClient);
};
