var path = require('path');
var crypto = require('crypto');
var async = require('async');
var shortid = require('shortid');
var config = require(path.join(__dirname, '../', 'config.json'));
var fb = require(path.join(__dirname, '../', 'ultis/fb.js'));
var User = require(path.join(__dirname, '../', 'schemas/user.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));
var trip_map = require(path.join(__dirname, '../', 'cores/trip_map.js'));

exports.create = function (data, callback) {
    data.password = crypto.createHash('sha256').update(data.password).digest('hex');

    var creatingUser = new User(data);
    var currentDate = new Date();
    creatingUser.created_at = currentDate;
    creatingUser.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.update = function (updatingData, data, callback) {
    for (var field in data) {
        updatingData[field] = data[field];
    }
    var userUpdate = new User(updatingData);
    userUpdate.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (!result) {
                if (typeof callback === 'function') return callback(-1, null);
            }
            var updated = result;
            if (typeof callback === 'function') return callback(null, updated);
        }
    });
};

exports.checkEmailExits = function (data, callback) {
    User.findOne({
        email: data.email
    }, function (error, result) {
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

exports.checkPhoneNumberExits = function (data, callback) {
    User.findOne({
        phone_number: data.phone_number
    }, function (error, result) {
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

exports.login = function (data, callback) {
    var password = crypto.createHash('sha256').update(data.password).digest('hex');
    var currentUser = null;
    async.series({
        login: function (callback) {
            if (data.email) {
                User.findOne({
                    email: data.email,
                    password: password
                }, function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    } else if (!result) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        currentUser = result;
                        result.last_visited_at = new Date();
                        result.fcm_token = data.fcm_token;
                        result.save(function (error, doc) {
                            if (error) {
                                if (typeof callback === 'function') return callback(null, currentUser);
                            } else if (doc) {
                                if (typeof callback === 'function') return callback(null, doc);
                            }
                        });
                    }
                });
            } else if (data.phone_number) {
                User.findOne({
                    phone_number: data.phone_number,
                    password: password
                }, function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(-2, null);
                    } else if (!result) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        currentUser = result;
                        result.last_visited_at = new Date();
                        result.fcm_token = data.fcm_token;
                        result.save(function (error, doc) {
                            if (error) {
                                if (typeof callback === 'function') return callback(null, currentUser);
                            } else if (doc) {
                                if (typeof callback === 'function') return callback(null, doc);
                            }
                        });
                    }
                });
            } else {
                if (typeof callback === 'function') return callback(-3, null);
            }
        }
    }, function (error, result) {
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

exports.fblogin = function (data, callback) {
    var fbUser = null;
    var foundAccount = null;
    async.series({
        checkFbToken: function (callback) {
            fb.checkToken(data.fb_token, function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    return callback(-2, null);
                } else {
                    fbUser = result;
                    return callback(null, null);
                }
            });
        },
        checkEmail: function (callback) {
            if (fbUser.email) {
                var query = User.findOne({
                    email: fbUser.email
                });
                query.exec(function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        return callback(-2, null);
                    } else if (result) {
                        if (result.id_facebook == fbUser.id_facebook) {
                            foundAccount = result;
                            result.last_visited_at = new Date();
                            result.fcm_token = data.fcm_token;
                            result.save(function (error, doc) {
                                if (error) {
                                    return callback(-3, null); // match email, match fb_id => good, just login
                                } else if (doc) {
                                    foundAccount = doc;
                                    return callback(-3, null); // match email, match fb_id => good, just login
                                }
                            });
                        } else {
                            foundAccount = result;
                            return callback(-4, null); // match email, different fb_id => bad, email is existed
                        }
                    } else {
                        return callback(null, null);
                    }
                });
            } else {
                return callback(null, null);
            }
        },
        checkAccount: function (callback) {
            var query = User.findOne({
                id_facebook: fbUser.id_facebook
            });
            query.exec(function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (result) {
                    foundAccount = result;
                    result.last_visited_at = new Date();
                    result.fcm_token = data.fcm_token;
                    result.save(function (error, doc) {
                        if (error) {
                            return callback(-3, null); // match fb_id => good, just login
                        } else if (doc) {
                            foundAccount = doc;
                            return callback(-3, null); // match fb_id => good, just login
                        }
                    });
                } else {
                    return callback(null, null);
                }
            });
        },
        createAccount: function (callback) {

            var creatingAccount = new User(fbUser);
            creatingAccount.created_at = new Date();
            creatingAccount.last_visited_at = new Date();
            creatingAccount.fcm_token = data.fcm_token;
            creatingAccount.save(function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    foundAccount = result;
                    return callback(null, null);
                }
            });
        }
    }, function (error, result) {
        if (error == -3) {
            return callback(-3, foundAccount);
        } else if (error == -4) {
            return callback(-4, null);
        } else if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, foundAccount);
        }
    });
};

exports.get = function (id_user, callback) {
    var query = User.findOne({
        _id: id_user
    });
    query.select('_id first_name last_name email phone_number gender birthday address religion intro id_facebook avatar avatar_actual cover created_at last_visited_at');
    query.exec(function (error, result) {
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

exports.getDetail = function (id_user, callback) {
    async.series({
        getInfo: function (callback) {
            var query = User.findOne({
                _id: id_user
            });
            query.select('_id first_name last_name intro avatar avatar_actual cover');
            query.exec(function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (!result) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') return callback(null, result);
                }
            });
        },
        countAllTripsCreatedByUser: function (callback) {
            trip.countAllTripsCreatedByUser(id_user, function (error, result) {
                if (error) {
                    return callback(null, null);
                } else {
                    return callback(null, result);
                }
            })
        },
        countAllTripsJoinedOfUser: function (callback) {
            trip.countAllTripsJoinedOfUser(id_user, function (error, result) {
                if (error) {
                    return callback(null, null);
                } else {
                    return callback(null, result);
                }
            })
        },
        countAllPlaceArrivedByUser: function (callback) {
            trip_map.countAllPlaceArrivedByUser(id_user, function (error, result) {
                if (error) {
                    return callback(null, null);
                } else {
                    return callback(null, result);
                }
            })
        }
    }, function (error, result) {
        if (error === -1) {
            return callback(-1, null);
        } else if (error) {
            return callback(error, null);
        } else {
            return callback(null, result);
        }
    })
};

function checkExisted(id_user, callback) {
    var query = User.findOne({
        _id: id_user
    });
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (!result) {
                if (typeof callback === 'function') return callback(-1, null);
            }
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};
exports.checkExisted = checkExisted;

exports.saveLoginDate = function (id_user, callback) {
    User.findOne({_id: id_user}).update({
        last_visited_at: new Date()
    }, function (error, result) {
        if (error) {
            if (typeof callback === 'function') return callback(error, null);
        }
        if (typeof callback === 'function') return callback(null, null);
    });
};
