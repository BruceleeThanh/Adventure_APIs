/**
 * Created by Brucelee Thanh on 02/12/2016.
 */
var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var news = require(path.join(__dirname, '../', 'cores/news.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));

module.exports = function (app, redisClient) {
    app.get('/api/news/time_line', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'user',
            type: 'hex_string',
            required: false
        }, {
            name: 'page',
            type: 'number',
            required: false,
            min: 1
        }, {
            name: 'per_page',
            type: 'number',
            required: false,
            min: 10,
            max: 100
        }];

        var currentUser = null;
        var userId = null;
        async.series({
            validate: function (callback) {
                validator(req.query, fields, function (error, result) {
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
                        if (data.user) {
                            if (currentUser._id !== data.user) {
                                userId = data.user;
                            } else {
                                userId = currentUser._id;
                            }
                        } else {
                            userId = currentUser._id;
                        }
                        return callback(null, null);
                    }
                });
            },
            getOwnStatus: function (callback) {
                news.getTimeLine({
                    owner: userId
                }, function (error, results) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                });
            }
        }, function (error, results) {
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
                    message = 'Timeline is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = results.getOwnStatus;
                res.json({
                    code: 1,
                    data: foundStatus,
                    total: foundStatus.length
                });
            }
        });
    });
    app.get('/api/news/news_feed', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'page',
            type: 'number',
            required: false,
            min: 1
        }, {
            name: 'per_page',
            type: 'number',
            required: false,
            min: 10,
            max: 100
        }];

        var currentUser = null;
        var lstFriend = [];
        async.series({
            validate: function (callback) {
                validator(req.query, fields, function (error, result) {
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
                        lstFriend.push(currentUser._id);
                        return callback(null, null);
                    }
                });
            },
            getFriend: function (callback) {
                friend.findFriend({_id: currentUser._id}, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var friends = result;
                        for (i in friends) {
                            if (friends[i].user_one._id.toHexString() !== currentUser._id) {
                                lstFriend.push(friends[i].user_one._id);
                            }
                            if (friends[i].user_two._id.toHexString() !== currentUser._id) {
                                lstFriend.push(friends[i].user_two._id);
                            }
                        }
                        return callback(null, null);
                    }
                });
            },
            news_feed: function (callback) {
                var opts = {
                    _id: lstFriend,
                    permission: [2, 3], // 2: friend, 3: public
                    type: 1, // 1: normal status
                    page : data.page,
                    per_page : data.per_page
                };
                news.getNewsFeed(currentUser._id, opts, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            }
        }, function (error, results) {
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
                    message = 'News Feed is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = results.news_feed;
                res.json({
                    code: 1,
                    data: foundStatus,
                    total: foundStatus.length
                });
            }
        });
    });
};