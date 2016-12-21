/**
 * Created by Brucelee Thanh on 19/12/2016.
 */

var async = require('async');
var path = require('path');
var Notification = require(path.join(__dirname, '../', 'schemas/notification.js'));
var comment_status = require(path.join(__dirname, '../', 'cores/comment_status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));

exports.commentStatus = function (id_status, callback) { // data: id_status
    var foundStatus = null;
    var notis = [];
    async.series({
            findStatus: function (callback) {
                status.findStatusWithOwner(id_status, function (error, result) {
                    if (error === -1) {
                        return callback(-1, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundStatus = JSON.parse(JSON.stringify(result));
                        return callback(null, null);
                    }
                });
            },
            createNoti: function (callback) {
                comment_status.getAllOwnerDistinct(id_status, function (error, results) {
                    var leng = results.length;
                    for (let i = 0; i < leng; i++) {
                        var content = null;
                        var remain = leng - (i + 1);
                        if (remain > 2) {
                            content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name + "</b>, <b>" +
                                results[leng - 2].first_name + " " + results[leng - 2].last_name + "</b> và <b>" +
                                (remain - 2) + " người khác</b> đã bình luận về trạng thái của ";
                        } else if (remain == 2) {
                            content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name + "</b> và <b>" +
                                results[leng - 2].first_name + " " + results[leng - 2].last_name + "</b> đã bình luận về trạng thái của ";
                        } else if (remain == 1) {
                            content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name +
                                "</b> đã bình luận về trạng thái của ";
                        }
                        if (content) {
                            if (foundStatus) {
                                if (foundStatus.owner._id == results[i]._id) {
                                    content = content + "bạn";
                                } else {
                                    content = content + "<b>" + foundStatus.owner.first_name + " " + foundStatus.owner.last_name + "</b>";
                                }
                                if (foundStatus.content != "" && foundStatus.content != null) {
                                    content = content + ": " + foundStatus.content;
                                }
                            }
                        }
                        if (content) {
                            notis.push({
                                sender: results[leng - 1]._id,
                                recipient: results[i]._id,
                                id_status: foundStatus._id,
                                type: 1,
                                content: content
                            });
                        }
                    }
                    return callback(null, null);
                });
            },
            genNotiTimeAndCreate: function (callback) {
                comment_status.getLatestCommentTime(id_status, function (error, result) {
                    var leng = notis.length;
                    var latestCommentTime = JSON.parse(JSON.stringify(result));
                    async.eachSeries(notis, function (item, callback) {
                        item.created_at = latestCommentTime.created_at;
                        updateOrCreate(item, function (error, result) {
                            return callback(null);
                        });
                    }, function (error) {
                        return callback(null, null);
                    });
                });
            }
        },
        function (error, result) {
            if (error === -1) {
                return (-1, null);
            } else if (error) {
                return callback(error, null);
            } else {
                return callback(null, null);
            }
        });
};

exports.getAll = function (data, callback) {
    var query = Notification.find({
        recipient: data.id_user
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.populate('sender', '_id first_name last_name avatar');
    query.sort({created_at: -1});
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

exports.create = function (data, callback) {
    var creatingNotification = new Notification(data);
    creatingNotification.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.findNotification = function (data, callback) { // data: recipient, object, type
    var query = Notification.findOne({
        recipient: data.recipient,
        object: data.object,
        type: data.type
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

function updateOrCreate(data, callback) { // data: sender, recipient, id_status, type, content, created_at
    data.viewed = 0;
    data.clicked = 0;
    Notification.update({
        sender: data.sender,
        recipient: data.recipient,
        object: data.id_status,
        type: data.type
    }, data, {upsert: true}, function (error, result) {
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
exports.updateOrCreate = updateOrCreate;