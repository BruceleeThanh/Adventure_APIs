var path = require('path');
var async = require('async');

module.exports.cacheLogin = function (redisClient, token, user, callback) {
    redisClient.set(token, JSON.stringify(user), function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.cleanLogin = function (redisClient, token, callback) {
    redisClient.del(token, function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.getLoggedin = function (redisClient, token, callback) {
    redisClient.get(token, function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(error, reply);
        }
    });
};

module.exports.cacheSocket = function (redisClient, id_user, socketId, callback) {
    redisClient.set(id_user, socketId, function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.cleanSocket = function (redisClient, id_user, callback) {
    redisClient.del(id_user, function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(null, null);
        }
    });
};

module.exports.getSocket = function (redisClient, id_user, callback) {
    redisClient.get(id_user, function (error, reply) {
        if (error) {
            require(path.join(__dirname, '/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(JSON.stringify(error), null);
        } else {
            if (typeof callback === 'function') return callback(error, reply);
        }
    });
};

module.exports.roles = ['NormalUser', 'Moderator', 'Admin', 'SuperUser'];
