/**
 * Created by Brucelee Thanh on 19/12/2016.
 */

var async = require('async');
var path = require('path');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var notification = require(path.join(__dirname, '../', 'cores/notification.js'));
var Notification = require(path.join(__dirname, '../', 'schemas/notification.js'));

module.exports = function (app, redisClient) {
    app.post('/api/notification/browse', function (req, res) {
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
            browse: function (callback) {
                data.id_user = currentUser._id;
                notification.getAll(data, function (error, results) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                })
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
                    message = 'Notification is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            }
            else {
                var foundNotifications = results.browse;
                res.json({
                    code: 1,
                    data: foundNotifications,
                    total: foundNotifications.length
                });
            }
        });
    });

    app.post('/api/notification/viewed', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'list_id_notification',
            type: 'strings_array',
            required: true
        }];
        var currentUser = null;
        var list_id_notification = [];
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        if (data.list_id_notification) {
                            list_id_notification = JSON.parse(JSON.stringify(data.list_id_notification));
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
                        return callback(null, null);
                    }
                });
            },
            viewed: function (callback) {
                var leng = list_id_notification.length;
                for (let i = 0; i < leng; i++) {
                    Notification.findByIdAndUpdate(list_id_notification[i], {viewed: 1}, {new: true}, function (error, result) {

                    });
                    if (i == leng - 1) {
                        return callback(null, null);
                    }
                }
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
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            }
            else {
                res.json({
                    code: 1,
                    data: 'Done'
                });
            }
        });
    });

    app.post('/api/notification/clicked', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_notification',
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
            clicked: function (callback) {
                Notification.findByIdAndUpdate(data.id_notification, {clicked: 1}, {new: true}, function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-4, null);
                    } else {
                        if (typeof callback === 'function') return callback(null, result);
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
                } else if(error === -4){
                    message = 'Can not update this notification';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            }
            else {
                var foundNotification = result.clicked;
                res.json({
                    code: 1,
                    data: foundNotification
                });
            }
        });
    });
};