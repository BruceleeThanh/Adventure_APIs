var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Friend_Request = require(path.join(__dirname, '../', 'schemas/friend_request.js'));

exports.create = function(data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    var creatingRequest = new Friend_Request(data);
    creatingRequest.save(function(error, result) {
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
            // if (!result) {
            //     if (typeof callback === 'function') return callback(-8, null);
            // }
            var updated = result;
            if (typeof callback === 'function') return callback(null, updated);
        }
    });
};

exports.get = function(data, callback) {
    var query = Friend_Request.findOne({
        sender: data.sender,
        recipient: data.recipient
    });
    query.exec(function(error, result) {
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

exports.checkExits = function(data, callback) {
    var query = Friend_Request.findOne({
        _id: data._id
    });
    query.exec(function(error, result) {
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

exports.browse = function(data, callback) {
    async.parallel({
        count: function(callback) {
            var query = Friend_Request.find({
                recipient: data._id,
                status: 0
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
                    if (results.length <= 0) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else if (typeof callback === 'function') return callback(null, results.length);
                }
            });
        },
        get: function(callback) {
            var query = Friend_Request.find({
                recipient: data._id,
                status: 0
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id sender recipient status created_at');
            query.populate('sender', '_id first_name last_name email intro fb_id phone_number address gender birthday religion avatar cover created_at');
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (results.length <= 0) {
                        if (typeof callback === 'function') return callback(-1, null);
                    } else {
                        if (typeof callback === 'function') return callback(null, results);
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

exports.findRequestSent = function(data, callback) {
    var query = Friend_Request.find({
        sender: {
            $in: [data.sender]
        },
        status: 0
    });
    query.select('_id recipient ');
    query.exec(function(error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-5, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
};
