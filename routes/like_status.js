/**
 * Created by Brucelee Thanh on 30/11/2016.
 */

var async = require('async');
var path = require('path');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var LikeStatus = require(path.join(__dirname, '../', 'schemas/like_status.js'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var like_status = require(path.join(__dirname, '../', 'cores/like_status.js'));

module.exports = function (app, redisClient) {
    // Use to both Like and Unlike
    app.post('/api/like_status/like', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
            type: 'hex_string',
            required: true
        }];
        var is_like = null;
        var currentUser = null;
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function (callback) {
                authentication.getLoggedin(redisClient, data.token, function (error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            likeOrUnlike: function (callback) {
                like_status.checkLikeStatusExits(data.id_status, data.owner, function (error, result) {
                    if (error === -1) {
                        like_status.doingLike(data, function (error, result) {
                            if (error === -1) {
                                return callback(-4, null);
                            } else if (error) {
                                return callback(error, null);
                            } else {
                                is_like = 1;
                                return callback(null, result);
                            }
                        });
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        like_status.doingUnLike(data, function (error, result) {
                            if (error === -1) {
                                return callback(-4, null);
                            } else if (error) {
                                return callback(error, null);
                            } else {
                                is_like = 0;
                                return callback(null, result);
                            }
                        });
                    }
                });
            }
        }, function (error, result) {
            if (error) {
                var code = error;
                var message = '';
                if (error === -1) {
                    message = 'Redis error';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Token is not found';
                } else if (error === -4) {
                    message = 'Status is not exits';
                } else {
                    code = 0;
                    message = error;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var updateStatus = result.likeOrUnlike;
                res.json({
                    code: 1,
                    data: {
                        status: updateStatus,
                        is_like: is_like
                    }
                });
            }
        });
    });
};