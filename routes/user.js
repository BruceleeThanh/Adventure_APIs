var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var user = require(path.join(__dirname, '../', 'cores/user.js'));

module.exports = function (app, redisClient) {

    app.post('/api/user/sign_up', function (req, res) {
        var data = {};
        var fields = [{
            name: 'phone_number_email',
            type: 'string',
            required: true
        }, {
            name: 'password',
            type: 'string',
            required: true,
            bound: [6, 32]
        }, {
            name: 'first_name',
            type: 'string',
            required: true
        }, {
            name: 'last_name',
            type: 'string',
            required: true
        }];
        var email_exits = true;
        var phone_number_exits = true;
        var isEmail = false;
        var isPhone_number = false;
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        isEmail = helper.isEmail(data.phone_number_email);
                        isPhone_number = helper.isNumber(data.phone_number_email);
                        if (!isEmail && !isPhone_number) {
                            return callback(-3, null);
                        }
                        return callback(null, null);
                    }
                });
            },
            checkEmailExits: function (callback) {
                if (isEmail) {
                    data.email = data.phone_number_email;
                    user.checkEmailExits(data, function (error, result) {
                        if (error === -1) {
                            // email is not exits
                            email_exits = false;
                            return callback(null, null);
                        } else if (error) {
                            return callback(-4, null);
                        } else {
                            return callback(null, null);
                        }
                    });
                } else {
                    return callback(null, null);
                }
            },
            checkPhoneNumberExits: function (callback) {
                if (isPhone_number) {
                    data.phone_number = data.phone_number_email;
                    user.checkPhoneNumberExits(data, function (error, result) {
                        if (error === -1) {
                            // phone number is not exits
                            phone_number_exits = false;
                            return callback(null, null);
                        } else if (error) {
                            return callback(-5, null);
                        } else {
                            return callback(null, null);
                        }
                    });
                } else {
                    return callback(null, null);
                }
            },
            create: function (callback) {
                var created = false;
                if (email_exits === false) {
                    user.create(data, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            created = true;
                            return callback(null, result);
                        }
                    });
                } else if (phone_number_exits === false && created === false) {
                    user.create(data, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            created = true;
                            return callback(null, result);
                        }
                    });
                } else {
                    return callback(-1, null);
                }
            }
        }, function (error, results) {
            if (error) {
                var code = error;
                var message = '';
                if (error === -1) {
                    message = 'Email or phone_number is existed';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Email or phone_number is required';
                } else if (error === -4) {
                    message = 'Email is existed';
                } else if (error === -5) {
                    message = 'Phone number is existed';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundUser = results.create.toObject();
                res.json({
                    code: 1,
                    data: foundUser
                });
            }
        });
    });

    app.post('/api/user/login', function (req, res) {
        var data = {};
        var fields = [{
            name: 'phone_number_email',
            type: 'string',
            required: true
        }, {
            name: 'password',
            type: 'string',
            required: true
        }, {
            name: 'fcm_token',
            type: 'string',
            required: false, // not done yet
        }];

        var currentUser = null;
        var isEmail = false;
        var isPhone_number = false;
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        isEmail = helper.isEmail(data.phone_number_email);
                        isPhone_number = helper.isNumber(data.phone_number_email);
                        if (isEmail) {
                            data.email = data.phone_number_email;
                            return callback(null, null);
                        } else if (isPhone_number) {
                            data.phone_number = data.phone_number_email;
                            return callback(null, null);
                        } else {
                            return callback(-3, null);
                        }
                    }
                });
            },
            login: function (callback) {
                user.login(data, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        currentUser = result;
                        return callback(null, result);
                    }
                });
            }
        }, function (error, results) {
            if (error) {
                var code = error;
                var message = '';
                if (error === -1) {
                    message = 'Email or phone_number is not existed';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Email or phone_number is required';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                if (typeof data.fcm_token == 'undefined') {
                    data.fcm_token = "";
                }
                var token = uuid.v4();
                var foundUser = results.login.toObject();
                foundUser.token = token;
                foundUser.fcm_token = data.fcm_token;

                var options = {
                    _id: foundUser._id,
                    fcm_token: data.fcm_token
                };
                authentication.cacheLogin(redisClient, token, options);
                res.json({
                    code: 1,
                    data: foundUser
                });

                // var token = uuid.v4();
                // var foundUser = results.login.toObject();
                // foundUser.token = token;
                // console.log(foundUser);
                // authentication.cacheLogin(redisClient, token, foundUser);
                // res.json({
                //     code: 1,
                //     data: foundUser
                // });
            }
        });
    });

    app.get('/api/user/profile', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_user',
            type: 'hex_string',
            required: false
        }];

        var currentUser = null;
        var _id = null;
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
                        if (data.id_user) {
                            if (currentUser._id === data.id_user) {
                                _id = currentUser._id;
                            } else {
                                _id = data.id_user;
                            }
                        } else {
                            _id = currentUser._id;
                        }

                        return callback(null, null);
                    }
                });
            },
            get: function (callback) {
                user.get({_id: _id}, function (error, result) {
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
                var foundUser = results.get.toObject();
                res.json({
                    code: 1,
                    data: foundUser
                });
            }
        });
    });

    app.post('/api/user/edit_profile', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: '_id',
            type: 'hex_string',
            required: false
        }, {
            name: 'first_name',
            type: 'string',
            required: false
        }, {
            name: 'last_name',
            type: 'string',
            required: false
        }, {
            name: 'email',
            type: 'string',
            required: false
        }, {
            name: 'phone_number',
            type: 'string',
            required: false
        }, {
            name: 'gender',
            type: 'number',
            required: false
        }, {
            name: 'birthday',
            type: 'date',
            required: false
        }, {
            name: 'address',
            type: 'string',
            required: false
        }, {
            name: 'religion',
            type: 'string',
            required: false
        }, {
            name: 'intro',
            type: 'string',
            required: false
        }, {
            name: 'avatar',
            type: 'string',
            required: false
        }, {
            name: 'avatar_actual',
            type: 'string',
            required: false
        }, {
            name: 'cover',
            type: 'string',
            required: false
        }];

        var currentUser = null;
        var foundUser = null;
        var _id = null;
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
                        if (data._id) {
                            if (currentUser._id === data._id) {
                                _id = currentUser._id;
                            } else {
                                _id = data._id;
                            }
                        } else {
                            _id = currentUser._id;
                        }

                        return callback(null, null);
                    }
                });
            },
            checkExisted: function (callback) {
                user.checkExisted(_id, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundUser = result;
                        return callback(null, result);
                    }
                });
            },
            update: function (callback) {
                user.update(foundUser, data, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
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
                    message = 'User is not found';
                } else if (error === -5) {
                    message = 'Can not update profile info.';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundUser = result.update;
                res.json({
                    code: 1,
                    data: foundUser
                });
            }
        });
    });

    app.post('/api/user/fb_login', function (req, res) {
        var data = {};
        var fields = [{
            name: 'fb_token',
            type: 'string',
            required: true
        }, {
            name: 'fcm_token',
            type: 'string',
            required: false, // not done yet
        }];
        var fb_id = null;
        var exits = false;


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
            fblogin: function (callback) {
                user.fblogin(data, function (error, result) {
                    if (error == -3) {
                        return callback(null, result);
                    } else if (error == -4) {
                        return callback(-3, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            }
        }, function (error, result) {
            if (error) {
                var message = '';
                var code = error;
                if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Email is existed';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundAccount = result.fblogin.toObject();
                if (typeof data.fcm_token == 'undefined') {
                    data.fcm_token = "";
                }
                var token = uuid.v4();

                foundAccount.fcm_token = data.fcm_token;
                foundAccount.token = token;
                console.log(foundAccount);
                var options = {
                    _id: foundAccount._id,
                    fcm_token: data.fcm_token
                };
                authentication.cacheLogin(redisClient, token, options);
                res.json({
                    code: 1,
                    data: foundAccount
                });
            }
        });
    });

};
