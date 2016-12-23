/**
 * Created by Brucelee Thanh on 02/12/2016.
 */

var async = require('async');
var path = require('path');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var comment_status = require(path.join(__dirname, '../', 'cores/comment_status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var notification = require(path.join(__dirname, '../', 'cores/notification.js'));

module.exports = function (app, redisClient) {
    app.post('/api/comment_status/create', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
            type: 'string',
            required: true
        }, {
            name: 'content',
            type: 'string',
            required: true
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
                        return callback(null, null);
                    }
                });
            },
            create: function (callback) {
                if (data.content) {
                    var options = {
                        id_status: data.id_status,
                        owner: currentUser._id,
                        content: data.content
                    };
                    comment_status.create(options, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                } else {
                    return callback(-5, null);
                }
            },
            createNotification: function (callback) {
                notification.commentStatus(data.id_status, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            }
        }, function (error, result) {
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
                    message = 'Status is not found';
                } else if (error === -5) {
                    message = 'Content is required';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundCommentStatus = result.create;
                res.json({
                    code: 1,
                    data: foundCommentStatus
                });
            }
        });
    });

    app.post('/api/comment_status/edit_content', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
            type: 'string',
            required: true
        }, {
            name: 'id_comment',
            type: 'string',
            required: true
        }, {
            name: 'content',
            type: 'string',
            required: true
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
                        return callback(null, null);
                    }
                });
            },
            checkStatusExits: function (callback) {
                status.checkStatusExits(data.id_status, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                })
            },
            checkCommentStatusExits: function (callback) {
                var options = {
                    id_comment: data.id_comment,
                    id_status: data.id_status,
                    owner: currentUser._id
                };
                comment_status.checkCommentStatusExits(options, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            updateCommentStatus: function (callback) {
                comment_status.updateContentOfCommentStatus(data.id_comment, data.content, function (error, result) {
                    if (error === -1) {
                        return callback(-6, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                })
            }
        }, function (error, result) {
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
                    message = 'Status is not found';
                } else if (error === -5) {
                    message = 'Comment is not found';
                } else if (error === -6) {
                    message = 'Can not update comment';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundCommentStatus = result.updateCommentStatus;
                res.json({
                    code: 1,
                    data: foundCommentStatus
                });
            }
        });
    });

    app.post('/api/comment_status/delete', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
            type: 'string',
            required: true
        }, {
            name: 'id_comment',
            type: 'string',
            required: true
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
                        return callback(null, null);
                    }
                });
            },
            deleteCommentStatus: function (callback) {
                data.owner = currentUser._id;
                comment_status.removeCommentStatus(data, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            },
            createNotification: function (callback) {
                notification.commentStatus(data.id_status, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            }
        }, function (error, result) {
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
                    message = 'Status is not found';
                } else if (error === -5) {
                    message = 'Comment is not found';
                } else if (error === -6) {
                    message = 'Can not delete comment';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundStatusUpdate = result.deleteCommentStatus.decreaseCommentStatus;
                var isComment = result.deleteCommentStatus.checkOrtherComment;
                res.json({
                    code: 1,
                    data: {
                        status: foundStatusUpdate,
                        is_comment: isComment
                    }
                });
            }
        });
    });

    app.post('/api/comment_status/browse', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_status',
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
                        return callback(null, null);
                    }
                });
            },
            checkStatusExits: function (callback) {
                status.checkStatusExits(data.id_status, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                })
            },
            browse: function (callback) {
                comment_status.getAll(data, function (error, results) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                })
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
                    message = 'Status is not found';
                } else if (error === -5) {
                    message = 'CommentStatus is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            }
            else {
                var foundCommentStatus = results.browse;
                res.json({
                    code: 1,
                    data: foundCommentStatus,
                    total: foundCommentStatus.length
                });
            }
        });
    });
};