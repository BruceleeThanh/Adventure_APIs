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

module.exports = function (app, redisClient) {

    app.post('/api/status/create', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
            type: 'string',
            required: false
        }, {
            name: 'id_group',
            type: 'string',
            required: false
        }, {
            name: 'content',
            type: 'string',
            required: false
        }, {
            name: 'image_description',
            type: 'image_description_object_array',
            required: false
        }, {
            name: 'permission',
            type: 'number',
            required: false
        }, {
            name: 'type',
            type: 'number',
            required: true
        }];

        var currentUser = null;
        var image_description = null;
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
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
            create: function (callback) {
                if (data.content || data.image_description) {
                    var options = {
                        owner: data.owner,
                        id_trip: data.id_trip,
                        id_group: data.id_group,
                        content: data.content,
                        images: image_description,
                        permission: data.permission,
                        type: data.type
                    };
                    status.create(options, function (error, result) {
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

    app.post('/api/status/find_one', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
            type: 'string',
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
                        return callback(null, null);
                    }
                });
            },
            findOne: function (callback) {
                status.findOneAndCheckInteract(currentUser._id, data.id_status, function (error, result) {
                    if(error === -1){
                        return callback(-4, null);
                    }else if(error){
                        return callback(error, null);
                    }else {
                        return callback(null, result);
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
                    message = 'Status is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = result.findOne;
                res.json({
                    code: 1,
                    data: foundStatus
                });
            }
        });
    });

    app.post('/api/status/trip_browse', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            discussTrip: function (callback) {
                var option = {
                    id_user : currentUser._id,
                    id_trip : data.id_trip
                };
                status.getTripDiscuss(option, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
                    } else {
                        return callback(null, results);
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
                    message = 'Status is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatus = result.discussTrip;
                res.json({
                    code: 1,
                    data: foundStatus
                });
            }
        });
    });
};
