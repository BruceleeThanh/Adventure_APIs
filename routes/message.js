/**
 * Created by Brucelee Thanh on 29/06/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var user = require(path.join(__dirname, '../', 'cores/user.js'));
var conversation = require(path.join(__dirname, '../', 'cores/conversation.js'));

module.exports = function (app, redisClient) {

    app.post('/api/message/browse', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_conversation',
            type: 'string',
            required: true
        }, {
            name: 'page',
            type: 'number',
            required: false,
            min: 1
        }, {
            name: 'per_page',
            type: 'number',
            required: false,
            min: 10,
            max: 100
        }];

        var currentUser = null;
        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function (callback) {
                authentication.getLoggedin(redisClient, data.token, function (error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data.id_user = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            getUserOnline: function (callback) {
                user.getUserOnline(redisClient, data.id_user, function (error, results) {
                    if (error) {
                        return callback(null, null);
                    } else {
                        return callback(null, results);
                    }
                });
            },
            getConversation: function (callback) {
                conversation.browse(data, function (error, results) {
                    if (error) {
                        return callback(null, null);
                    } else {
                        return callback(null, results);
                    }
                });
            }
        }, function (error, results) {
            if (error) {
                var code = error;
                var message = '';
                if (error === -1) {
                    message = 'Redis error';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Token is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundUserOnline = JSON.parse(JSON.stringify(results.getUserOnline));
                var totalUserOnline = foundUserOnline ? foundUserOnline.length : 0;
                var foundConversation = JSON.parse(JSON.stringify(results.getConversation));
                var totalConversation = foundConversation ? foundConversation.length : 0;
                res.json({
                    code: 1,
                    data: {
                        user_online: foundUserOnline,
                        total_user_online: totalUserOnline,
                        conversation: foundConversation,
                        total_conversation: totalConversation
                    }
                });
            }
        });
    });


};