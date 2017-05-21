var path = require('path');
var async = require('async');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));
var friend_request = require(path.join(__dirname, '../', 'cores/friend_request.js'));
var user = require(path.join(__dirname, '../', 'cores/user.js'));

module.exports = function(app, redisClient) {

    app.get('/api/friend/browse', function(req, res) {
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
            validate: function(callback) {
                validator(req.query, fields, function(error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function(callback) {
                authentication.getLoggedin(redisClient, data.token, function(error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data._id = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            browse: function(callback) {
                friend.browse(data, function(error, results) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                });
            }
        }, function(error, results) {
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
                    message = 'Friend is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundFriend = results.browse;
                var total = foundFriend.length;
                res.json({
                    code: 1,
                    data: foundFriend,
                    total: total
                });
            }
        });
    });

    app.post('/api/friend/search', function(req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        },{
            name: 'keyword',
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
            validate: function(callback) {
                validator(req.body, fields, function(error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function(callback) {
                authentication.getLoggedin(redisClient, data.token, function(error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data._id = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            search: function(callback) {
                friend.search(data, function(error, results) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                });
            }
        }, function(error, results) {
            if (error) {
                var code = error;
                var message = '';
                if (error === -1) {
                    message = 'Redis error';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Token is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundFriends = results.search.findFriends;
                var totalFriend = 0;
                if(foundFriends){
                    totalFriend = foundFriends.length;
                }
                var foundStrangers = results.search.findStrangers;
                var totalStranger = 0;
                if(foundStrangers){
                    totalStranger = foundStrangers.length;
                }
                res.json({
                    code: 1,
                    data: {
                        friends: foundFriends,
                        total_friend: totalFriend,
                        strangers: foundStrangers,
                        total_stranger: totalStranger
                    }
                });
            }
        });
    });

    app.get('/api/friend/suggest_friend', function(req, res) {
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
            validate: function(callback) {
                validator(req.query, fields, function(error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function(callback) {
                authentication.getLoggedin(redisClient, data.token, function(error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data._id = currentUser._id;
                        lstFriend.push(data._id);
                        return callback(null, null);
                    }
                });
            },
            findFriend: function(callback) {
                friend.findFriend(data, function(error, result) {
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
                })
            },
            findSentRequest: function(callback) {
                friend_request.findRequestSent({ sender: data._id }, function(error, result) {
                    if (error === -5) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        for (id in result) {
                            lstFriend.push(result[id].recipient);
                        }
                        return callback(null, null);
                    }
                });
            },
            suggest: function(callback) {
                var option = data;
                option._id = lstFriend;
                friend.findListUserIsNotFriend(option, function(error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            }
        }, function(error, results) {
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
                var foundUser = results.suggest;
                var total = foundUser.length;
                res.json({
                    code: 1,
                    data: foundUser,
                    total: total
                });
            }
        });
    });
};
