var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var like_status = require(path.join(__dirname, '../', 'cores/like_status.js'));
var comment_status = require(path.join(__dirname, '../', 'cores/comment_status.js'));

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

function findStatusWithOwner(id_status, callback) {
    var query = Status.findById(id_status);
    query.populate('owner', '_id first_name last_name avatar fcm_token');
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
exports.findStatusWithOwner = findStatusWithOwner;

exports.findOneAndCheckInteract = function (id_user, id_status, callback) {
    var foundStatus = null;
    async.series({
        findOne: function (callback) {
            findStatusWithOwner(id_status, function (error, result) {
                if (error === -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    foundStatus = JSON.parse(JSON.stringify(result));
                    foundStatus.owner.fcm_token = undefined;
                    return callback(null, null);
                }
            });
        },
        checkInteract : function (callback) {
            async.parallel({
                checkLike: function (callback) {
                    like_status.checkLikeStatusExits(id_status, id_user, function (error, result) {
                        if (error) {
                            foundStatus.is_like = 0;
                            return callback(null, null);
                        } else {
                            foundStatus.is_like = 1;
                            return callback(null, null);
                        }
                    });
                },
                checkComment: function (callback) {
                    comment_status.checkUserAlreadyCommentOnStatus(id_status, id_user, function (error, result) {
                        if (error) {
                            foundStatus.is_comment = 0;
                            return callback(null, null);
                        } else {
                            foundStatus.is_comment = 1;
                            return callback(null, null);
                        }
                    });
                }
            }, function (error, result) {
                return callback(null, null);
            });
        }
    }, function (error, result) {
        if (error === -1) {
            return callback(-1, null);
        } else if (error) {
            return callback(error, null);
        } else {
            return callback(null, foundStatus);
        }
    });
};

exports.checkStatusExits = function (id_status, callback) {
    var query = Status.findOne({
        _id: id_status
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

exports.getTripDiscuss = function (data, callback) { // data:{id_user, id_trip}
    var lstStatus = null;
    async.series({
        getStatus: function (callback) {
            var query = Status.find({
                id_trip : data.id_trip,
                type: 2
            });
            query.select('_id owner content images amount_like amount_comment type permission created_at');
            query.populate('owner', '_id first_name last_name avatar');
            query.sort({created_at: -1});
            query.exec(function (error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length <= 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') {
                        lstStatus = JSON.parse(JSON.stringify(results));
                        return callback(null, null);
                    }
                }
            });
        },
        checkInteract: function (callback) {
            var newsFeed = [];
            async.eachSeries(lstStatus, function (item, callback) {
                async.parallel({
                    checkLike: function (callback) {
                        like_status.checkLikeStatusExits(item._id, data.id_user, function (error, result) {
                            if (error) {
                                item.is_like = 0;
                                return callback(null, null);
                            } else {
                                item.is_like = 1;
                                return callback(null, null);
                            }
                        });
                    },
                    checkComment: function (callback) {
                        comment_status.checkUserAlreadyCommentOnStatus(item._id, data.id_user, function (error, result) {
                            if (error) {
                                item.is_comment = 0;
                                return callback(null, null);
                            } else {
                                item.is_comment = 1;
                                return callback(null, null);
                            }
                        });
                    }
                }, function (error, result) {
                    newsFeed.push(item);
                    return callback(null);
                });
            }, function (error) {
                return callback(null, newsFeed);
            })
        }
    }, function (error, results) {
        if (error === -1) {
            return callback(-1, null);
        } else if (error) {
            return callback(error, null);
        } else {
            return callback(null, results.checkInteract);
        }

    });

};