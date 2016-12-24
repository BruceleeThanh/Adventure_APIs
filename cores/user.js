var path = require('path');
var crypto = require('crypto');
var async = require('async');
var shortid = require('shortid');
var config = require(path.join(__dirname, '../', 'config.json'));
var fb = require(path.join(__dirname, '../', 'ultis/fb.js'));
var User = require(path.join(__dirname, '../', 'schemas/user.js'));

exports.create = function(data, callback) {
    data.password = crypto.createHash('sha256').update(data.password).digest('hex');

    var creatingUser = new User(data);
    var currentDate = new Date();
    creatingUser.created_at = currentDate;
    creatingUser.save(function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.update = function(updatingData, data, callback) {
    for (var field in data) {
        updatingData[field] = data[field];
    }
    updatingData.save(function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (!result) {
                if (typeof callback === 'function') return callback(-8, null);
            }
            var updated = result;
            if (typeof callback === 'function') return callback(null, updated);
        }
    });
};

exports.checkEmailExits = function(data, callback) {
    User.findOne({
        email: data.email
    }, function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.checkPhoneNumberExits = function(data, callback) {
    User.findOne({
        phone_number: data.phone_number
    }, function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.login = function(data, callback) {
    var password = crypto.createHash('sha256').update(data.password).digest('hex');
    var currentDate = new Date();
    data.last_visited_at = currentDate;
    var currentUser = null;
    async.series({
        login: function(callback) {
            if (data.email) {
                User.findOne({
                    email: data.email,
                    password: password
                }, function(error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    } else if (!result) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        currentUser = result;
                        result.latest_active = currentDate;
                        result.fcm_token = data.fcm_token;
                        result.save(function(error, doc) {
                            if (error) {
                                throw error;
                            }
                        });
                        if (typeof callback === 'function') return callback(null, result);
                    }
                });
            } else if (data.phone_number) {
                User.findOne({
                    phone_number: data.phone_number,
                    password: password
                }, function(error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    } else if (!result) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        currentUser = result;
                        result.latest_active = currentDate;
                        result.fcm_token = data.fcm_token;
                        result.save(function(error, doc) {
                            if (error) {
                                throw error;
                            }
                        });
                        if (typeof callback === 'function') return callback(null, result);
                    }
                });
            } else {
                if (typeof callback === 'function') return callback(-3, null);
            }
        }
    }, function(error, result) {
        if (error === -1) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-1, null);
        } else if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result.login);
        }
    });

};

exports.fblogin = function(data, callback) {
    var fbUser = null;
    var foundAccount = null;
    async.series({
        checkFbToken: function(callback) {
            fb.checkToken(data.fb_token, function(error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    return callback(-2, null);
                } else {
                    fbUser = result;
                    return callback(null, null);
                }
            });
        },
        checkEmail: function(callback) {
            var query = User.findOne({
                email: fbUser.email
            });
            query.exec(function(error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    return callback(-2, null);
                }
                if (result) {
                    if (result.fb_id !== fbUser.fb_id) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        return callback(-3, null);
                    }
                    foundAccount = result;
                }
                return callback(-3, null);
            });
        },
        checkAccount: function(callback) {
            if (!foundAccount) {
                var query = User.findOne({
                    fb_id: fbUser.fb_id
                });
                query.exec(function(error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    }
                    if (result) {
                        foundAccount = result;
                    }
                    return callback(null, null);
                });
            } else {
                return callback(-3, null);
            }
        },
        createAccount: function(callback) {
            if (!foundAccount) {
                var creatingAccount = new User(fbUser);
                var currentDate = new Date();
                creatingAccount.created_at = currentDate;
                creatingAccount.save(function(error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    }
                    foundAccount = result;
                    return callback(null, null);
                });
            } else {
                return callback(-3, null);
            }
        }
    }, function(error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, foundAccount);
        }
    });
};

exports.get = function(data, callback) {
    var query = User.findOne({
        _id: data._id
    });
    query.select('_id first_name last_name email phone_number gender birthday address religion intro fb_id avatar cover created_at last_visited_at');
    query.exec(function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};


exports.saveLoginDate = function(data, callback) {
    User.findOne({ _id: data._id }).update({
        last_visited_at: new Date()
    }, function(error, result) {
        if (error) {
            if (typeof callback === 'function') return callback(error, null);
        }
        if (typeof callback === 'function') return callback(null, null);
    });
};
