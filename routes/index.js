var path = require('path');

var user = require(path.join(__dirname, '/user.js'));
var friend = require(path.join(__dirname, '/friend.js'));
var friend_request = require(path.join(__dirname, '/friend_request.js'));
var status = require(path.join(__dirname, '/status.js'));
var file = require(path.join(__dirname, '/file.js'));

module.exports = function(app, redisClient) {

    user(app, redisClient);
    friend(app, redisClient);
    friend_request(app, redisClient);
    status(app, redisClient);
    file(app, redisClient);
};
