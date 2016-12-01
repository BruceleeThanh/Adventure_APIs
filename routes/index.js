var path = require('path');

var user = require(path.join(__dirname, '/user.js'));
var friend = require(path.join(__dirname, '/friend.js'));
var friend_request = require(path.join(__dirname, '/friend_request.js'));
var status = require(path.join(__dirname, '/status.js'));
var file = require(path.join(__dirname, '/file.js'));
var trip = require(path.join(__dirname, '/trip.js'));
var trip_map = require(path.join(__dirname, '/trip_map.js'));
var like_status = require(path.join(__dirname, '/like_status.js'));

module.exports = function (app, redisClient) {
    user(app, redisClient);
    friend(app, redisClient);
    friend_request(app, redisClient);
    status(app, redisClient);
    file(app, redisClient);
    trip(app, redisClient);
    trip_map(app, redisClient);
    like_status(app, redisClient);
};
