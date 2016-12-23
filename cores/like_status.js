/**
 * Created by Brucelee Thanh on 30/11/2016.
 */

var async = require('async');
var path = require('path');
var LikeStatus = require(path.join(__dirname, '../', 'schemas/like_status.js'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));

exports.doingLike = function (data, callback) {
    var statusExits = null;
    async.series({
        checkStatusExits: function (callback) {
            status.checkStatusExits(data.id_status, function (error, result) {
                if (error === -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    statusExits = result;
                    return callback(null, null);
                }
            });
        },
        createLikeStatus: function (callback) {
            var currentDate = new Date();
            data.created_at = currentDate;
            var creatingLikeStatus = new LikeStatus(data);
            creatingLikeStatus.save(function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (typeof callback === 'function') {
                        return callback(null, null);
                    }
                }
            });
        },
        increaseLikeStatus: function (callback) {
            var increase = {
                amount_like: statusExits.amount_like + 1
            };
            status.updateStatus(statusExits, increase, function (error, status) {
                if (error) {
                    return callback(error, null);
                } else {
                    return callback(null, status);
                }
            })
        }
    }, function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            // 1. Status is not exits, 2. DB error
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, result.increaseLikeStatus);
        }
    });
};

exports.doingUnLike = function (data, callback) {
    var statusExits = null;
    async.series({
        checkStatusExits: function (callback) {
            status.checkStatusExits(data.id_status, function (error, result) {
                if (error === -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    statusExits = result;
                    return callback(null, null);
                }
            });
        },
        deleteLikeStatus: function (callback) {
            LikeStatus.remove({id_status: data.id_status, owner: data.owner}, function (error) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (typeof callback === 'function') {
                        return callback(null, null);
                    }
                }
            });
        },
        decreaseLikeStatus: function (callback) {
            var increase = {
                amount_like: statusExits.amount_like - 1
            }
            status.updateStatus(statusExits, increase, function (error, status) {
                if (error) {
                    return callback(error, null);
                } else {
                    return callback(null, status);
                }
            })
        }
    }, function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            // 1. Status is not exits, 2. DB error
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, result.decreaseLikeStatus);
        }
    });
};

exports.getAll = function (data, callback) { //data: Obj(id_status, page, per_page)
    var query = LikeStatus.find({
        id_status: data.id_status
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id owner created_at');
    query.populate('owner', '_id first_name last_name avatar');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') {
                return callback(null, results);
            }
        }
    });
};

exports.getAllAndCheckFriend = function (data, callback) { //data: Obj(id_status, id_user, page, per_page)
    var lstLikeStatus = null;
    async.series({
        getAllLikeStatus: function (callback) {
            var query = LikeStatus.find({
                id_status: data.id_status
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.per_page !== undefined) {
                limit = data.per_page;
                offset = (data.page - 1) * data.per_page;
                query.limit(limit).offset(offset);
            }
            query.select('_id owner created_at');
            query.populate('owner', '_id first_name last_name avatar');
            query.exec(function (error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length <= 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') {
                        lstLikeStatus = JSON.parse(JSON.stringify(results));
                        return callback(null, null);
                    }
                }
            });
        },
        isFriend: function (callback) {
            var lstLikeStatusFilter = [];
            async.each(lstLikeStatus, function (item, callback) {
                var checkFriend = {
                    user_one: data.id_user,
                    user_two: item.owner._id
                };
                friend.checkExits(checkFriend, function (error, result) {
                    if (error) {
                        item.is_friend = 0;
                        lstLikeStatusFilter.push(item);
                        return callback(null);
                    } else {
                        item.is_friend = 1;
                        lstLikeStatusFilter.push(item);
                        return callback(null);
                    }
                })
            }, function (error) {
                return callback(null, lstLikeStatusFilter);
            });
        }
    }, function (error, results) {
        if (error) {
            return callback(error, null);
        } else {
            return callback(null, results.isFriend);
        }
    });
};

exports.checkLikeStatusExits = function checkLikeStatusExits(id_status, owner, callback) {
    var query = LikeStatus.findOne({
        id_status: id_status,
        owner: owner
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