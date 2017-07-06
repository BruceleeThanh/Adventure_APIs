/**
 * Created by Brucelee Thanh on 29/06/2017.
 */

var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Conversation = require(path.join(__dirname, '../', 'schemas/conversation.js'));
var message = require(path.join(__dirname, '../', 'cores/message.js'));

exports.create = function (data, callback) {
    data.created_at = new Date();
    var creatingConversation = new Conversation(data);
    creatingConversation.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.browse = function (data, callback) { // data : {id_user, page, per_page}
    var query = Conversation.find({
        $or: [{
            user_one: data.id_user
        }, {
            user_two: data.id_user
        }]
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id user_one user_two notify_user_one notify_user_two created_at');
    query.populate('user_one', '_id first_name last_name avatar');
    query.populate('user_two', '_id first_name last_name avatar');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length <= 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                results = JSON.parse(JSON.stringify(results));
                var conversations = [];
                async.eachSeries(results, function (item, callback) {
                    var partner = null;
                    var notify = null;
                    if (item.user_one._id === data.id_user) {
                        partner = item.user_two;
                        notify = item.notify_user_two;
                    } else if (item.user_two._id === data.id_user) {
                        partner = item.user_one;
                        notify = item.notify_user_one;
                    }
                    delete item.user_one;
                    delete item.user_two;
                    delete item.notify_user_one;
                    delete item.notify_user_two;
                    item.partner = partner;
                    item.notify = notify;
                    message.getLatestMessageByConversation(item._id, function (error, result) {
                        var latestMessage = null;
                        if (result) {
                            latestMessage = JSON.parse(JSON.stringify(result));

                        }
                        item.latest_message = latestMessage[0];
                        conversations.push(item);
                        return callback(null);
                    });
                }, function (error) {
                    if (typeof callback === 'function') return callback(null, conversations);
                });
            }
        }
    });
};

exports.checkExisted = function (id_conversation, callback) {
    var query = Conversation.findOne({
        _id: id_conversation
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

exports.checkExistedByUser = function (user_one, user_two, callback) {
    var query = Conversation.findOne({
        $or: [{
            user_one: user_one,
            user_two: user_two
        }, {
            user_one: user_two,
            user_two: user_one
        }]
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
