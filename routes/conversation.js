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
var message = require(path.join(__dirname, '../', 'cores/message.js'));

module.exports = function (app, redisClient) {

    app.post('/api/conversation/browse', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
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

    app.post('/api/conversation/initialize', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_partner',
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
        var isPartnerOnline = false;
        var idConversation = null;

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
            checkPartnerOnline: function (callback) {
                user.checkUserOnline(redisClient, data.id_partner, function (error, result) {
                    if (error) {
                        isPartnerOnline = false;
                        return callback(null, null);
                    } else {
                        isPartnerOnline = true;
                        return callback(null, result); // return socket.id
                    }
                });
            },
            getPartnerVisitedAt: function (callback) {
                if (isPartnerOnline === false) {
                    user.getLastVisitedAt(data.id_partner, function (error, result) {
                        if (error) {
                            return callback(null, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                }else{
                    return callback(null, null);
                }
            },
            checkConversation: function (callback) {
                conversation.checkExistedByUser(data.id_user, data.id_partner, function (error, result) {
                    if (error) {
                        return callback(null, null);
                    } else if (result) {
                        var foundConversation = JSON.parse(JSON.stringify(result));
                        idConversation = foundConversation._id;
                        return callback(null, result);
                    }
                })
            },
            createConversation: function (callback) {
                if (!idConversation) {
                    var option = {
                        user_one: data.id_user,
                        user_two: data.id_partner
                    };
                    conversation.create(option, function (error, result) {
                        if (error) {
                            return callback(-4, null);
                        } else if (result) {
                            return callback(null, result);
                        }
                    });
                } else {
                    return callback(null, null);
                }
            },
            getMessage: function (callback) {
                if (idConversation) {
                    var option = {
                        id_conversation: idConversation,
                        page: data.page,
                        per_page: data.per_page
                    };
                    message.browse(option, function (error, results) {
                        if (error) {
                            return callback(null, null);
                        } else if (results) {
                            return callback(null, results);
                        }
                    });
                } else {
                    return callback(null, null);
                }
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
                } else if (error === -4) {
                    message = 'Can not create conversation';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var partnerSocketId = null;
                var partnerVisitedAt = null;
                var foundConversation = null;
                var foundMessages = null;
                var totalFoundMessages = 0;
                if (isPartnerOnline === true) {
                    partnerSocketId = results.checkPartnerOnline;
                } else {
                    partnerVisitedAt = JSON.parse(JSON.stringify(results.getPartnerVisitedAt));
                    partnerVisitedAt = partnerVisitedAt.last_visited_at;
                }
                if (idConversation) {
                    foundConversation = JSON.parse(JSON.stringify(results.checkConversation));
                } else {
                    foundConversation = JSON.parse(JSON.stringify(results.createConversation));
                }
                if (results.getMessage) {
                    foundMessages = JSON.parse(JSON.stringify(results.getMessage));
                    totalFoundMessages = foundMessages.length;
                }

                res.json({
                    code: 1,
                    data: {
                        partner_socket_id: partnerSocketId,
                        partner_visited_at: partnerVisitedAt,
                        conversation: foundConversation,
                        messages: foundMessages,
                        total_message: totalFoundMessages
                    }
                });
            }
        });
    });
};