var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var like_status = require(path.join(__dirname, '../', 'cores/like_status.js'));

exports.create = function (data, callback) {
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
    creatingStatus.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.checkStatusExits = function (data, callback) {
    var query = Status.findOne({
        _id: data
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
    })
};

exports.updateStatus = function (updatingData, data, callback) {
    for (var field in data) {
        updatingData[field] = data[field];
    }
    updatingData.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            var updated = result;
            if (typeof callback === 'function') return callback(null, updated);
        }
    });
};

exports.getTimeLine = function (data, callback) {
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
    query.sort({created_at: -1});
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length < 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
};

exports.getNewFeeds = function (id_user, data, callback) {
    var lstStatus = null;
    async.series({
        getStatus: function (callback) {
            var query = Status.find({
                $and: [
                    {owner: {$in: data._id}},
                    {permission: {$in: data.permission}}
                ],
                type: data.type
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.perPage !== undefined) {
                limit = data.perPage;
                offset = (data.page - 1) * data.perPage;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner content images amount_like amount_comment type permission created_at');
            query.populate('owner', '_id first_name last_name avatar');
            query.sort({created_at: -1});
            query.exec(function (error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length < 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') {
                        lstStatus = JSON.parse(JSON.stringify(results));
                        return callback(null, null);
                    }
                }
            });
        },
        isLike: function (callback) {
            var newsFeed = [];
            async.each(lstStatus, function (item, callback) {
                like_status.checkLikeStatusExits(item._id, id_user, function (error, result) {
                    if (error) {
                        item.is_like = 0;
                        newsFeed.push(item);
                        return callback(null);
                    } else {
                        item.is_like = 1;
                        newsFeed.push(item);
                        return callback(null);
                    }
                })
            }, function (error) {
                return callback(null, newsFeed);
            })
        }
    }, function (error, results) {
        if (error === -1) {
            return callback(-4, null);
        } else if (error) {
            return callback(error, null);
        } else {
            return callback(null, results.isLike.sort(function (a, b) {
                return new Date(a.date) - new Date(b.date)
            }));
        }

    });

};
