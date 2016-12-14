var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Friend = require(path.join(__dirname, '../', 'schemas/friend.js'));
var User = require(path.join(__dirname, '../', 'schemas/user.js'));

exports.create = function(data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    var creatingFriend = new Friend(data);
    creatingFriend.save(function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.browse = function(data, callback) {
    async.parallel({
        count: function(callback) {
            var query = Friend.find({
                $or: [{
                    user_one: data._id
                }, {
                    user_two: data._id
                }]
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }

            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (results.length < 0) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else if (typeof callback === 'function') return callback(null, results.length);
                }
            });
        },
        get: function(callback) {
            var query = Friend.find({
                $or: [{
                    user_one: data._id
                }, {
                    user_two: data._id
                }]
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id user_one user_two created_at');
            query.populate('user_one', '_id first_name last_name avatar');
            query.populate('user_two', '_id first_name last_name avatar');
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (results.length < 0) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        var user = [];
                        for (var i = 0; i < results.length; i++) {
                            if (results[i].user_one._id.toHexString() !== data._id) {
                                user.push(results[i].user_one);
                            }
                            if (results[i].user_two._id.toHexString() !== data._id) {
                                user.push(results[i].user_two);
                            }
                        }
                        if (typeof callback === 'function') return callback(null, user);
                    }

                }
            });
        }
    }, function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.checkExits = function(data, callback) {
    var query = Friend.findOne({
        user_one: {
            $in: [data.user_one, data.user_two]
        },
        user_two: {
            $in: [data.user_one, data.user_two]
        }
    });
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

exports.findListUserIsNotFriend = function(data, callback) {
    async.parallel({
        count: function(callback) {
            var query = User.find({
                _id: {
                    $nin: data._id
                }
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.exec(function(error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (result.length < 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') return callback(null, result.length);
                }
            });
        },
        get: function(callback) {
            var query = User.find({
                _id: {
                    $nin: data._id
                }
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id first_name last_name avatar');
            query.sort({ create_at: -1 });
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length < 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') return callback(null, results);
                }
            });
        }
    }, function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.findFriend = function(data, callback) {
    async.parallel({
        count: function(callback) {
            var query = Friend.find({
                $or: [{
                    user_one: data._id
                }, {
                    user_two: data._id
                }]
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.exec(function(error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (result.length < 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') return callback(null, result.length);
                }
            });
        },
        get: function(callback) {
            var query = Friend.find({
                $or: [{
                    user_one: data._id
                }, {
                    user_two: data._id
                }]
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id user_one user_two created_at');
            query.populate('user_one', '_id first_name last_name avatar');
            query.populate('user_two', '_id first_name last_name avatar');
            query.sort({ created_at: -1 });
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length < 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') return callback(null, results);
                }
            });
        }
    }, function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};
