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
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));
var user = require(path.join(__dirname, '../', 'cores/user.js'));
var group_member = require(path.join(__dirname, '../', 'cores/group_member.js'));

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
        var isYou = false;
        var relation = null;
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
                                isYou = false;
                            } else {
                                userId = currentUser._id;
                                isYou = true;
                            }
                        } else {
                            userId = currentUser._id;
                            isYou = true;
                        }
                        return callback(null, null);
                    }
                });
            },
            checkFriend: function (callback) {
                if (isYou === false) {
                    var option = {
                        user_one: userId,
                        user_two: currentUser._id
                    };
                    friend.checkExits(option, function (error, result) {
                        if (error) {
                            relation = 3;
                            return callback(null, null);
                        } else {
                            relation = 2;
                            return callback(null, null);
                        }
                    })
                } else {
                    relation = 1;
                    return callback(null, null);
                }
            },
            getInfo: function (callback) {
                user.getDetail(userId, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                })
            },
            getOwnPost: function (callback) {
                var option = {
                    id_user: userId,
                    relation: relation,
                    page: data.page,
                    per_page: data.per_page
                };
                news.getTimeLine(option, function (error, results) {
                    if (error) {
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
                    message = 'User is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundInfo = JSON.parse(JSON.stringify(results.getInfo.getInfo));
                var countTripCreated = results.getInfo.countAllTripsCreatedByUser;
                var countTripJoined = results.getInfo.countAllTripsJoinedOfUser;
                var countPlaceArrived = results.getInfo.countAllPlaceArrivedByUser;
                var foundPost = null;
                var totalPost = 0;
                if(results.getOwnPost){
                    foundPost = JSON.parse(JSON.stringify(results.getOwnPost));
                    totalPost = foundPost.length;
                }
                res.json({
                    code: 1,
                    data: {
                        relation: relation,
                        summary_info: {
                            info: foundInfo,
                            count_trip_created: countTripCreated,
                            count_trip_joined: countTripJoined,
                            count_place_arrived: countPlaceArrived
                        },
                        time_line:{
                            user_post: foundPost,
                            total: totalPost
                        }
                    }
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
        var lstFriends = [];
        var lstGroups = [];
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
                        data.id_user = currentUser._id;
                        lstFriends.push(currentUser._id);
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
                                lstFriends.push(friends[i].user_one._id);
                            }
                            if (friends[i].user_two._id.toHexString() !== currentUser._id) {
                                lstFriends.push(friends[i].user_two._id);
                            }
                        }
                        return callback(null, null);
                    }
                });
            },
            getGroup: function (callback) {
                group_member.getAllIdGroupByUser(data.id_user, function (error, results) {
                    if(error){
                        return callback(null, null);
                    }else {
                        var groups = JSON.parse(JSON.stringify(results));
                        for (let i in groups) {
                            lstGroups.push(groups[i].id_group);
                        }
                        return callback(null, null);
                    }
                });
            },
            news_feed: function (callback) {
                var option = {
                    groups: lstGroups,
                    friends: lstFriends,
                    id_user: data.id_user,
                    page: data.page,
                    per_page: data.per_page
                };
                news.getNewsFeed(option, function (error, result) {
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

    app.get('/api/news/public_trip', function (req, res) {
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
                        return callback(null, null);
                    }
                });
            },
            browse: function (callback) {
                var opt = {
                    permission: 3,
                    type: 1,
                    page: data.page,
                    per_page: data.per_page
                };
                trip.getAll(opt, function (error, results) {
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
                    message = 'Trip is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTrips = results.browse;
                res.json({
                    code: 1,
                    data: foundTrips,
                    total: foundTrips.length
                });
            }
        });
    });
};