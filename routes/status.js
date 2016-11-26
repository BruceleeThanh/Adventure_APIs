var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));

module.exports = function(app, redisClient) {

    app.post('/api/status/create', function(req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'content',
            type: 'string',
            required: false
        }, {
            name: 'image_description',
            type: 'image_description_object_array',
            required: false
        }, {
            name: 'type',
            type: 'string',
            required: true
        }];

        var currentUser = null;
        var image_description = null;
        async.series({
            validate: function(callback) {
                validator(req.body, fields, function(error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        if (data.image_description) {
                            image_description = JSON.parse(data.image_description);
                        }

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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            create: function(callback) {
                // if (image_description === null) {
                //     return callback(null, null);
                // } else if (image_description.length > 0) {
                //     var options = {
                //         owner: data.owner,
                //         content: data.content,
                //         images: image_description,
                //         type: data.type
                //     };
                //     status.create(options, function (error, result) {
                //         if (error) {
                //             return callback(error, null);
                //         } else {
                //             return callback(null, result);
                //         }
                //     });
                // } else {
                //     return callback(null, null);
                // }
                console.log(typeof image_description);
                if (data.content || data.image_description) {
                    var options = {
                        owner: data.owner,
                        content: data.content,
                        images: image_description,
                        type: data.type
                    };
                    status.create(options, function(error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                } else {
                    return callback(-4, null);
                }
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
                    message = 'Content or images is required';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = results.create.toObject();
                res.json({
                    code: 1,
                    data: foundStatus
                });
            }
        });
    });


    app.get('/api/status/time_line', function(req, res) {
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
            name: 'perPage',
            type: 'number',
            required: false,
            min: 10,
            max: 100
        }];

        var currentUser = null;
        var userId = null;
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
            getOwnStatus: function(callback) {
                status.getTimeLine({
                    owner: userId
                }, function(error, results) {
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
                var foundStatus = results.getOwnStatus.get;
                var total = results.getOwnStatus.total;
                res.json({
                    code: 1,
                    data: foundStatus,
                    total: total
                });
            }
        });
    });

    app.get('/api/status/new_feeds', function(req, res) {
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
                        lstFriend.push(currentUser._id);
                        return callback(null, null);
                    }
                });
            },
            getFriend: function(callback) {
                friend.findFriend({ _id: currentUser._id }, function(error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var friends = result.get;
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
            new_feeds: function(callback) {
                var opts = {
                    _id: lstFriend,
                    type: 1 // normal status
                };
                status.getNewFeeds(opts, function(error, result) {
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
                    message = 'New Feeds is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = results.new_feeds.get;
                var total = results.new_feeds.total;
                res.json({
                    code: 1,
                    data: foundStatus,
                    total: total
                });
            }
        });
    });
};
