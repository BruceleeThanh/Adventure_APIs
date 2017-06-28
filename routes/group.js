/**
 * Created by Brucelee Thanh on 23/05/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var group = require(path.join(__dirname, '../', 'cores/group.js'));
var group_member = require(path.join(__dirname, '../', 'cores/group_member.js'));

module.exports = function (app, redisClient) {
    app.post('/api/group/create', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'name',
            type: 'string',
            required: true,
        }, {
            name: 'description',
            type: 'string',
            required: false
        }, {
            name: 'cover',
            type: 'string',
            required: false
        }, {
            name: 'permission',
            type: 'number',
            required: true
        }];

        var currentUser = null;
        var createdGroup = null;

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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            create: function (callback) {
                var option = {
                    owner: data.owner,
                    name: data.name,
                    description: data.description,
                    cover: data.cover,
                    total_member: 1,
                    permission: data.permission
                };
                group.create(option, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        createdGroup = JSON.parse(JSON.stringify(result));
                        var option = {
                            id_group: createdGroup._id,
                            owner: createdGroup.owner,
                            permission: 1,
                            status: 3
                        };
                        group_member.create(option, function (error, result) {
                            return callback(null, result);
                        });
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
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                res.json({
                    code: 1,
                    data: createdGroup
                });
            }
        });
    });

    app.get('/api/group/browse', function (req, res) {
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
                validator(req.query, fields, function (error, result) {
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
            browse: function (callback) {
                async.parallel({
                    yourCreate: function (callback) {
                        group_member.getGroupByUserAndPermission(data.id_user, 1, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    yourManage: function (callback) {
                        group_member.getGroupByUserAndPermission(data.id_user, 2, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    yourJoin: function (callback) {
                        group_member.getGroupByUserAndPermission(data.id_user, 3, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    yourRequest: function (callback) {
                        group_member.getGroupByUserAndStatus(data.id_user, 1, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    suggest: function (callback) {
                        var option = {
                            id_user: data.id_user,
                            page: data.page,
                            per_page: data.per_page
                        };
                        group.getSuggestGroup(option, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    yourInvite: function (callback) {
                        group_member.getGroupByUserAndStatus(data.id_user, 2, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    }
                }, function (error, results) {
                    return callback(null, results);
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
                var groupYourCreate = results.browse.yourCreate;
                var groupYourManage = results.browse.yourManage;
                var groupYourJoin = results.browse.yourJoin;
                var groupYourRequest = results.browse.yourRequest;
                var groupSuggest = results.browse.suggest;
                var groupYourInvite = results.browse.yourInvite;

                res.json({
                    code: 1,
                    data: {
                        group_create: groupYourCreate,
                        group_manage: groupYourManage,
                        group_join: groupYourJoin,
                        group_request: groupYourRequest,
                        group_suggest: groupSuggest,
                        group_invite: groupYourInvite
                    }
                });
            }
        });
    });

    app.post('/api/group/detail', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
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
            getDetail: function (callback) {
                group.getDetail(data, function (error, result) {
                    if (error == -4) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            }
            // check admin or member or guest
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
                    message = 'Group is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundGroupPost = null;
                var total = 0;
                if(result.getDetail.getPost){
                    if(result.getDetail.getPost == "Close"){
                        total = -1;
                    }else{
                        foundGroupPost = JSON.parse(JSON.stringify(result.getDetail.getPost));
                        total = foundGroupPost.length;
                    }
                }
                res.json({
                    code: 1,
                    data: {
                        group: result.getDetail.getGroup,
                        your_status: result.getDetail.getYourStatus,
                        group_post: foundGroupPost,
                        total: total
                    }
                });
            }
        });
    });

    app.post('/api/group/info', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
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
                        data.id_user = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            getInfo: function (callback) {
                group.getInfo(data, function (error, result) {
                    if (error == -4) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
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
                    message = 'Group is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundImages = null;
                var total = 0;
                if(result.getInfo.getImages){
                    if(result.getInfo.getImages == "Close"){
                        total = -1;
                    }else{
                        foundImages = JSON.parse(JSON.stringify(result.getInfo.getImages));
                        total = foundImages.length;
                    }
                }
                res.json({
                    code: 1,
                    data: {
                        group: result.getInfo.getGroup,
                        your_status: result.getInfo.getYourStatus,
                        group_images: foundImages,
                        total: total
                    }
                });
            }
        });
    });
};