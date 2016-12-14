var path = require('path');
var async = require('async');

module.exports.cacheLogin = function(redisClient, token, user, callback) {
    redisClient.set(token, JSON.stringify(user), function(error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.cleanLogin = function(redisClient, token, callback) {
    redisClient.del(token, function(error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.getLoggedin = function(redisClient, token, callback) {
    redisClient.get(token, function(error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback
                === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(error, reply);
        }
    });
};

module.exports.roles = ['NormalUser', 'Moderator', 'Admin', 'SuperUser'];
