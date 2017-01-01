/**
 * Created by Brucelee Thanh on 19/12/2016.
 */

var async = require('async');
var path = require('path');
var Notification = require(path.join(__dirname, '../', 'schemas/notification.js'));
var comment_status = require(path.join(__dirname, '../', 'cores/comment_status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var like_status = require(path.join(__dirname, '../', 'cores/like_status.js'));
var fcm = require(path.join(__dirname, '../', 'ultis/fcm.js'));

/*
 * Notification types: {1 : comment on status}, {2 : like status}
 * */

exports.commentStatus = function (id_status, callback) { // data: id_status
    var foundStatus = null;
    var notis = [];
    var fcm_content = null;
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
            genContent: function (callback) {
                comment_status.getAllOwnerDistinct(id_status, function (error, results) {
                    async.series({
                        checkOwnerExitsInComment: function (callback) {
                            var leng = results.length;
                            for (let i = 0; i < leng; i++) {
                                if (results[i]._id == foundStatus.owner._id) {
                                    return callback(null, null);
                                } else {
                                    if (i == leng - 1) {
                                        results.unshift(foundStatus.owner);
                                        return callback(null, null);
                                    }
                                }
                            }
                        },
                        genContent: function (callback) {
                            var leng = results.length;
                            for (let i = 0; i < leng; i++) {
                                var content = null;
                                var remain = leng - (i + 1);
                                if (remain > 2) {
                                    content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name + "</b>, <b>" +
                                        results[leng - 2].first_name + " " + results[leng - 2].last_name + "</b> và <b>" +
                                        (remain - 2) + " người khác</b> đã bình luận về trạng thái của ";
                                    fcm_content = results[leng - 1].first_name + " " + results[leng - 1].last_name + ", " +
                                        results[leng - 2].first_name + " " + results[leng - 2].last_name + " và " +
                                        (remain - 2) + " người khác đã bình luận về trạng thái của ";
                                } else if (remain == 2) {
                                    content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name + "</b> và <b>" +
                                        results[leng - 2].first_name + " " + results[leng - 2].last_name + "</b> đã bình luận về trạng thái của ";
                                    fcm_content = results[leng - 1].first_name + " " + results[leng - 1].last_name + " và " +
                                        results[leng - 2].first_name + " " + results[leng - 2].last_name + " đã bình luận về trạng thái của ";

                                } else if (remain == 1) {
                                    content = "<b>" + results[leng - 1].first_name + " " + results[leng - 1].last_name +
                                        "</b> đã bình luận về trạng thái của ";
                                    fcm_content = results[leng - 1].first_name + " " + results[leng - 1].last_name +
                                        " đã bình luận về trạng thái của ";
                                }
                                if (content) {
                                    if (foundStatus) {
                                        if (foundStatus.owner._id == results[i]._id) {
                                            content = content + "bạn";
                                            fcm_content = fcm_content + "bạn";
                                        } else {
                                            content = content + "<b>" + foundStatus.owner.first_name + " " + foundStatus.owner.last_name + "</b>";
                                            fcm_content = fcm_content + foundStatus.owner.first_name + " " + foundStatus.owner.last_name;
                                        }
                                        if (foundStatus.content != "" && foundStatus.content != null) {
                                            content = content + ": " + foundStatus.content;
                                            fcm_content = fcm_content + ": " + foundStatus.content;
                                        }
                                    }
                                }
                                if (content) {
                                    notis.push({
                                        sender_avatar: results[leng - 1].avatar,
                                        sender: results[leng - 1]._id,
                                        recipient: results[i]._id,
                                        object: foundStatus._id,
                                        type: 1,
                                        content: content,
                                        fcm_content: fcm_content,
                                        fcm_token: results[i].fcm_token
                                    });
                                }
                                if (i == leng - 1) {
                                    return callback(null, null);
                                }
                            }
                        }
                    }, function (error, result) {
                        return callback(null, null);
                    });
                });
            },
            genTimeAndCreate: function (callback) {
                comment_status.getLatestCommentTime(id_status, function (error, result) {
                    var leng = notis.length;
                    var latestCommentTime = JSON.parse(JSON.stringify(result));
                    async.eachSeries(notis, function (item, callback) {
                        item.created_at = latestCommentTime.created_at;
                        var option = {
                            sender_avatar: item.sender_avatar,
                            sender: item.sender,
                            recipient: item.recipient,
                            object: item.object,
                            type: item.type,
                            content: item.content,
                            created_at: item.created_at
                        }
                        updateOrCreate(option, function (error, result) {
                            result = JSON.parse(JSON.stringify(result));
                            result.fcm_content = item.fcm_content;
                            if(item.fcm_token != undefined && item.fcm_token != null && item.fcm_token != ""){
                                fcm.sendMessageToUser(foundStatus.owner.fcm_token, result);
                            }
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

exports.likeStatus = function (id_status, callback) {
    var foundStatus = null;
    var noti = null;
    var fcm_content = null;
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
            genContent: function (callback) {
                like_status.getAll({id_status: id_status}, function (error, results) {
                    var array = [];
                    array = JSON.parse(JSON.stringify(results));
                    var content = null;
                    async.series({
                        removeOwner: function (callback) {
                            var leng = array.length;
                            for (let i = 0; i < leng; i++) {
                                if (array[i].owner._id == foundStatus.owner._id) {
                                    array.splice(i, 1);
                                    return callback(null, null);
                                }
                                if (i == leng - 1) {
                                    return callback(null, null);
                                }
                            }
                        },
                        genContent: function (callback) {
                            var leng = array.length;
                            if (leng > 2) {
                                content = "<b>" + array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name + "</b>, <b>" +
                                    array[leng - 2].owner.first_name + " " + array[leng - 2].owner.last_name + "</b> và <b>" +
                                    (leng - 2) + " người khác</b> đã thích trạng thái của bạn";
                                fcm_content = array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name + ", " +
                                    array[leng - 2].owner.first_name + " " + array[leng - 2].owner.last_name + " và " +
                                    (leng - 2) + " người khác đã thích trạng thái của bạn";
                            } else if (leng == 2) {
                                content = "<b>" + array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name + "</b> và <b>" +
                                    array[leng - 2].owner.first_name + " " + array[leng - 2].owner.last_name + "</b> đã thích trạng thái của bạn";
                                fcm_content = array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name + " và " +
                                    array[leng - 2].owner.first_name + " " + array[leng - 2].owner.last_name + " đã thích trạng thái của bạn";

                            } else if (leng == 1) {
                                content = "<b>" + array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name +
                                    "</b> đã thích trạng thái của bạn";
                                fcm_content = array[leng - 1].owner.first_name + " " + array[leng - 1].owner.last_name +
                                    " đã thích trạng thái của bạn";
                            }
                            if (content) {
                                if (foundStatus) {
                                    if (foundStatus.content != "" && foundStatus.content != null) {
                                        content = content + ": " + foundStatus.content;
                                    }
                                }
                            }
                            if (content) {
                                noti = {
                                    sender_avatar: array[leng - 1].owner.avatar,
                                    sender: array[leng - 1].owner._id,
                                    recipient: foundStatus.owner._id,
                                    object: foundStatus._id,
                                    type: 2,
                                    content: content,
                                    created_at: array[leng - 1].created_at
                                };
                            }
                            return callback(null, null);
                        }
                    }, function (error, result) {
                        return callback(null, null);
                    });
                });
            },
            create: function (callback) {
                if (noti) {
                    updateOrCreate(noti, function (error, result) {
                        result = JSON.parse(JSON.stringify(result));
                        result.fcm_content = fcm_content;
                        fcm.sendMessageToUser(foundStatus.owner.fcm_token, result);
                        return callback(null, result);
                    });
                } else {
                    var options = {
                        recipient: foundStatus.owner._id,
                        object: foundStatus._id,
                        type: 2
                    };
                    console.log(options);
                    remove(options, function (error, result) {
                        return callback(null, null);
                    });
                }
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

function updateOrCreate(data, callback) { // data: sender, sender_avatar, recipient, object (id_status, id_trip), type, content, created_at
    data.viewed = 0;
    data.clicked = 0;
    Notification.findOneAndUpdate({
        recipient: data.recipient,
        object: data.object,
        type: data.type
    }, data, {upsert: true, new: true}, function (error, result) {
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

function remove(data, callback) { // data: recipient, object, type
    Notification.remove({
        recipient: data.recipient,
        object: data.object,
        type: data.type
    }, function (error) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') {
                return callback(null, null);
            }
        }
    });
};