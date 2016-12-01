/**
 * Created by Brucelee Thanh on 30/11/2016.
 */

var async = require('async');
var path = require('path');
var LikeStatus = require(path.join(__dirname, '../', 'schemas/like_status.js'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));

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
            LikeStatus.remove({id_status:data.id_status, owner:data.owner}, function (error) {
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
    })
};