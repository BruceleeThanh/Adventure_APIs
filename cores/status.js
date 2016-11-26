var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));

exports.create = function(data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    if (data.image_description) {
        data.images.push(data.image_description);
        for (var item in data.images) {
            if (data.images[item] === undefined) {
                data.images.splice(item, 1);
            }
        }
    }
    var creatingStatus = new Status(data);
    creatingStatus.save(function(error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};


exports.getTimeLine = function(data, callback) {
    async.parallel({
        total: function(callback) {
            var query = Status.find({
                owner: data.owner,
                type: 1
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner content images type created_at');
            query.populate('owner', '_id first_name last_name email intro fb_id phone_number address gender birthday religion avatar cover created_at');
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                }
                // else if (results.length < 0) {
                //     if (typeof callback === 'function') return callback(-1, null);
                // }
                else {
                    if (typeof callback === 'function') return callback(null, results.length);
                }
            });
        },
        get: function(callback) {
            var query = Status.find({
                owner: data.owner,
                type: 1
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner content images type created_at');
            query.populate('owner', '_id first_name last_name email intro fb_id phone_number address gender birthday religion avatar cover created_at');
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
    }, function(error, results) {
        if (error) {
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
};

exports.getNewFeeds = function(data, callback) {
    async.parallel({
        total: function(callback) {
            var query = Status.find({
                owner: { $in: data._id },
                type: data.type
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner content images type created_at');
            query.populate('owner', '_id first_name last_name email intro fb_id phone_number address gender birthday religion avatar cover created_at');
            query.exec(function(error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (typeof callback === 'function') return callback(null, results.length);
                }
            });
        },
        get: function(callback) {
            var query = Status.find({
                owner: { $in: data._id },
                type: data.type
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner content images type created_at');
            query.populate('owner', '_id first_name last_name email intro fb_id phone_number address gender birthday religion avatar cover created_at');
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
    }, function(error, results) {
        if (error) {
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
};
