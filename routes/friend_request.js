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

module.exports = function (app, redisClient) {

    app.post('/api/friend_request/send_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'user',
            type: 'hex_string',
            required: true
        }];

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
                        if (currentUser._id === data.user) {
                            return callback(-4, null);
                        }
                        data._id = data.user;
                        return callback(null, null);
                    }
                });
            },
            checkUserExits: function (callback) {
                user.get(data, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            checkSent: function (callback) {
                var options = {
                    sender: currentUser._id,
                    recipient: data._id
                };
                friend_request.get(options, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(-6, null);
                    }
                });
            },
            send_request: function (callback) {
                var options = {
                    sender: currentUser._id,
                    recipient: data._id,
                    status: 0
                };
                friend_request.create(options, function (error, result) {
                    if (error) {
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
                    message = 'Can not add yourself';
                } else if (error === -5) {
                    message = 'User id is not existed';
                } else if (error === -6) {
                    message = 'Error. Request sent';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundRequest = results.send_request.toObject();
                res.json({
                    code: 1,
                    data: foundRequest
                });
            }
        });
    });

    app.post('/api/friend_request/confirm', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: '_id',
            type: 'hex_string', // friend_request id
            required: true
        }];

        var currentUser = null;
        var request = null;
        var confirm = false;
        var FriendData = null;
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
                        return callback(null, null);
                    }
                });
            },
            checkExits: function (callback) {
                friend_request.checkExits(data, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        request = result;
                        return callback(null, null);
                    }
                });
            },
            checkSent: function (callback) {
                console.log('sender ', request.sender);
                console.log('recipient ', currentUser._id);
                var options = {
                    sender: request.sender,
                    recipient: currentUser._id
                };
                friend_request.get(options, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            accept: function (callback) {
                var updateData = {
                    status: 1
                };
                friend_request.update(request, updateData, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        confirm = true;
                        return callback(null, result);
                    }
                });
            },
            addFriend: function (callback) {
                if (confirm) {
                    var createData = {
                        user_one: request.sender,
                        user_two: currentUser._id
                    };
                    friend.create(createData, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            FriendData = result;
                            return callback(null, result);
                        }
                    });
                } else {
                    return callback(-6, null);
                }
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
                    message = 'Request is not exits';
                } else if (error === -5) {
                    message = 'Request is not sent';
                } else if (error === -6) {
                    message = 'Can not confirm friend';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundFriend = results.addFriend.toObject();
                res.json({
                    code: 1,
                    data: foundFriend
                });
            }
        });
    });

    app.get('/api/friend_request/browse', function (req, res) {
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
            name: 'perPage',
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
                        data._id = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            browse: function (callback) {
                friend_request.browse(data, function (error, result) {
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
                    message = 'Friend request is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundFriend = results.browse.get;
                var total = results.browse.count;
                res.json({
                    code: 1,
                    data: foundFriend,
                    total: total
                });
            }
        });
    });

};