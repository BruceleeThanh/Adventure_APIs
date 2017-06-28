/**
 * Created by Brucelee Thanh on 02/06/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var group_member = require(path.join(__dirname, '../', 'cores/group_member.js'));
var group = require(path.join(__dirname, '../', 'cores/group.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));


module.exports = function (app, redisClient) {
    app.post('/api/group_member/browse', function (req, res) {
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
        var isOwner = false;
        var lstAdmins = [];

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
            checkOwner: function (callback) {
                group.checkOwner(data.id_group, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        isOwner = true;
                        return callback(null, null);
                    }
                });
            },
            browseMember: function (callback) {
                group_member.getAllByGroupAndPermission(data.id_group, 3, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                });
            },
            browseCreator: function (callback) {
                group_member.getAllByGroupAndPermission(data.id_group, 1, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        results = JSON.parse(JSON.stringify(results));
                        for (let i in results) {
                            lstAdmins.push(results[i]);
                        }
                        return callback(null, results);
                    }
                });
            },
            browseAdmin: function (callback) {
                group_member.getAllByGroupAndPermission(data.id_group, 2, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        results = JSON.parse(JSON.stringify(results));
                        for (let i in results) {
                            lstAdmins.push(results[i]);
                        }
                        return callback(null, results);
                    }
                });
            },
            browseRequest: function (callback) {
                if (isOwner === true) {
                    group_member.getAllByGroupAndStatus(data.id_group, 1, function (error, results) {
                        if (error === -1) {
                            return callback(null, null);
                        } else if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, results);
                        }
                    });
                } else {
                    return callback(null, null);
                }
            },
            browseBlock: function (callback) {
                if (isOwner === true) {
                    group_member.getAllByGroupAndStatus(data.id_group, 4, function (error, results) {
                        if (error === -1) {
                            return callback(null, null);
                        } else if (error) {
                            return callback(error, null);
                        } else {
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
                var foundRequests = results.browseRequest;
                var foundMembers = results.browseMember;
                var foundBlocks = results.browseBlock;
                var totalRequest = 0;
                var totalMember = 0;
                var totalBlock = 0;
                if (foundRequests) {
                    totalRequest = foundRequests.length;
                }
                if (foundMembers) {
                    totalMember = foundMembers.length;
                }
                if (foundBlocks) {
                    totalBlock = foundBlocks.length;
                }
                res.json({
                    code: 1,
                    data: {
                        requests: foundRequests,
                        admins: lstAdmins,
                        members: foundMembers,
                        blocks: foundBlocks,
                        total_request: totalRequest,
                        total_admin: lstAdmins.length,
                        total_member: totalMember,
                        total_block: totalBlock
                    },
                });
            }
        });
    });

    app.post('/api/group_member/request', function (req, res) {
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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            checkGroup: function (callback) {
                group.getById(data.id_group, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var foundGroup = JSON.parse(JSON.stringify(result));
                        if (foundGroup.permission === 1) {
                            return callback(-5, null);
                        } else {
                            return callback(null, null);
                        }
                    }
                });
            },
            create: function (callback) {
                var option = {
                    id_group: data.id_group,
                    owner: data.owner,
                    permission: 0,
                    status: 1
                };
                group_member.create(option, function (error, result) {
                    if (error) {
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
                } else if (error === -5) {
                    message = 'Group is secret';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var createdGroupMember = result.create.toObject;
                res.json({
                    code: 1,
                    data: createdGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/browse_request', function (req, res) {
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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            checkGroup: function (callback) {
                group.getById(data.id_group, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            browse: function (callback) {
                group_member.getAllByGroupAndStatus(data.id_group, 1, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
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
                var foundRequests = JSON.parse(JSON.stringify(results));
                var total = 0;
                if (foundRequests) {
                    total = foundRequests.length;
                }
                res.json({
                    code: 1,
                    data: foundRequests,
                    total: total
                });
            }
        });
    });

    app.post('/api/group_member/cancel_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
            type: 'string',
            required: true,
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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            checkMemberRequest: function (callback) {
                group_member.getByGroupAndUser(data.id_group, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 2) {
                            return callback(-5, null);
                        } else if (foundGroupMember.status === 3) {
                            return callback(-6, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-7, null);
                        } else if (foundGroupMember.status === 1) {
                            return callback(null, null);
                        }
                    }
                });
            },
            remove: function (callback) {
                group_member.remove(data.id_group, data.owner, function (error, result) {
                    if (error) {
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
                    message = 'Member request is not found';
                } else if (error === -5) {
                    message = 'You have been invited';
                } else if (error === -6) {
                    message = 'You\'re already member';
                } else if (error === -7) {
                    message = 'You have been blocked';
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
                    data: 'done'
                });
            }
        });
    });

    app.post('/api/group_member/accept_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var foundGroupMember = null;

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
            checkMemberRequest: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 2) {
                            return callback(-5, null);
                        } else if (foundGroupMember.status === 3) {
                            return callback(-6, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-7, null);
                        } else if (foundGroupMember.status === 1) {
                            return callback(null, null);
                        }
                    }
                });
            },
            acceptRequest: function (callback) {
                foundGroupMember.status = 3;
                foundGroupMember.permission = 3;
                group_member.update(foundGroupMember, function (error, result) {
                    if (error === -1) {
                        return callback(-8, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            },
            increaseTotalMember: function (callback) {
                group.increaseTotalMember(foundGroupMember.id_group, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy yêu cầu này.';
                } else if (error === -5) {
                    message = 'Không tìm thấy yêu cầu này.';
                } else if (error === -6) {
                    message = 'Người này đã là thành viên nhóm.';
                } else if (error === -7) {
                    message = 'Người này hiện đang bị chặn.';
                } else if (error === -8) {
                    message = 'Không thành công. Vui lòng thử lại!';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                foundGroupMember = result.acceptRequest.toObject();
                res.json({
                    code: 1,
                    data: foundGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/reject_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var foundGroupMember = null;

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
            checkMemberRequest: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 2) {
                            return callback(-5, null);
                        } else if (foundGroupMember.status === 3) {
                            return callback(-6, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-7, null);
                        } else if (foundGroupMember.status === 1) {
                            return callback(null, null);
                        }
                    }
                });
            },
            remove: function (callback) {
                group_member.remove(foundGroupMember.id_group, foundGroupMember.owner, function (error, result) {
                    if (error) {
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy yêu cầu này.';
                } else if (error === -5) {
                    message = 'Không tìm thấy yêu cầu này.';
                } else if (error === -6) {
                    message = 'Người này đã là thành viên nhóm.';
                } else if (error === -7) {
                    message = 'Người này hiện đang bị chặn.';
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
                    data: 'done'
                });
            }
        });
    });

    app.post('/api/group_member/invite', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
            type: 'string',
            required: true,
        }, {
            name: 'id_user',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var existedInvite = null;

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
            findExistedInvite: function (callback) {
                var option = {
                    id_group: data.id_group,
                    owner: data.id_user,
                    status: 2
                };
                group_member.getByGroupAndUserAndStatus(option, function (error, result) {
                    if(error){
                        return callback(null, null);
                    }else{
                        existedInvite = JSON.parse(JSON.stringify(result));
                        return callback(null, null);
                    }
                });
            },
            create: function (callback) {
                if(existedInvite){
                    return callback(null, existedInvite);
                }else{
                    var option = {
                        id_group: data.id_group,
                        owner: data.id_user,
                        permission: 0,
                        status: 2
                    };
                    group_member.create(option, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                }
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
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
                var createdGroupMember = result.create.toObject;
                res.json({
                    code: 1,
                    data: createdGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/remove_invite', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var existedInvite = null;

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
            findExistedInvite: function (callback) {
                var option = {
                    id_group: data.id_group,
                    owner: data.owner,
                    status: 2
                };
                group_member.getByGroupAndUserAndStatus(option, function (error, result) {
                    if(error){
                        return callback(null, null);
                    }else{
                        existedInvite = JSON.parse(JSON.stringify(result));
                        return callback(null, null);
                    }
                });
            },
            remove_invite: function (callback) {
                if(existedInvite){
                    group_member.removeById(existedInvite._id, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, null);
                        }
                    });
                }else{
                    return callback(null, null);
                }
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
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
                    data: 'done'
                });
            }
        });
    });

    app.post('/api/group_member/search_invite', function(req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        },{
            name: 'keyword',
            type: 'string',
            required: true
        },{
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
            validate: function(callback) {
                validator(req.body, fields, function(error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        return callback(null, null);
                    }
                });
            },
            getLoggedin: function(callback) {
                authentication.getLoggedin(redisClient, data.token, function(error, result) {
                    if (error) {
                        return callback(-1, null);
                    } else if (!result) {
                        return callback(-3, null);
                    } else {
                        currentUser = JSON.parse(result);
                        data._id = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            searchInvite: function(callback) {
                group_member.searchInvite(data, function(error, results) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, results);
                    }
                });
            }
        }, function(error, results) {
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
                var foundSearchInvites = results.searchInvite.filterUser;
                var totalSearchInvite = 0;
                if(foundSearchInvites){
                    totalSearchInvite = foundSearchInvites.length;
                }
                res.json({
                    code: 1,
                    data: {
                        friends: foundSearchInvites,
                        total_search_invite: totalSearchInvite,
                    }
                });
            }
        });
    });

    app.post('/api/group_member/make_admin', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var foundGroupMember = null;

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
            checkMember: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 3) {
                            return callback(null, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-5, null);
                        }
                    }
                });
            },
            makeAdmin: function (callback) {
                foundGroupMember.permission = 2;
                group_member.update(foundGroupMember, function (error, result) {
                    if (error === -1) {
                        return callback(-6, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy thành viên này.';
                } else if (error === -5) {
                    message = 'Thành viên này đã bị chặn';
                } else if (error === -6) {
                    message = 'Không thành công. Vui lòng thử lại!';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                foundGroupMember = result.makeAdmin.toObject();
                res.json({
                    code: 1,
                    data: foundGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/remove_admin', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var foundGroupMember = null;

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
            checkMember: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 3) {
                            return callback(null, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-5, null);
                        }
                    }
                });
            },
            removeAdmin: function (callback) {
                foundGroupMember.permission = 3;
                group_member.update(foundGroupMember, function (error, result) {
                    if (error === -1) {
                        return callback(-6, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy thành viên này.';
                } else if (error === -5) {
                    message = 'Thành viên này đã bị chặn';
                } else if (error === -6) {
                    message = 'Không thành công. Vui lòng thử lại!';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                foundGroupMember = result.removeAdmin.toObject();
                res.json({
                    code: 1,
                    data: foundGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/leave_group', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group',
            type: 'string',
            required: true,
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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            checkMember: function (callback) {
                group_member.getByGroupAndUser(data.id_group, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 3) {
                            return callback(null, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-5, null);
                        }
                    }
                });
            },
            remove: function (callback) {
                group_member.remove(data.id_group, data.owner, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            decreaseTotalMember: function (callback) {
                group.decreaseTotalMember(data.id_group, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy thành viên này.';
                } else if (error === -5) {
                    message = 'Thành viên này đã bị chặn';
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
                    data: 'done'
                });
            }
        });
    });

    app.post('/api/group_member/remove_member', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var idGroup = null;

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
            checkMember: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var foundGroupMember = JSON.parse(JSON.stringify(result));
                        idGroup = foundGroupMember.id_group;
                        if (foundGroupMember.status === 3) {
                            return callback(null, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-5, null);
                        }
                    }
                });
            },
            remove: function (callback) {
                group_member.removeById(data.id_group_member, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            decreaseTotalMember: function (callback) {
                group.decreaseTotalMember(idGroup, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Member is not found';
                } else if (error === -5) {
                    message = 'Member is blocked';
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
                    data: 'done'
                });
            }
        });
    });

    app.post('/api/group_member/block_member', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
        }];

        var currentUser = null;
        var foundGroupMember = null;
        var idGroup = null;

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
            checkMember: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundGroupMember = JSON.parse(JSON.stringify(result));
                        idGroup = foundGroupMember.id_group;
                        if (foundGroupMember.status === 3) {
                            return callback(null, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(-5, null);
                        }
                    }
                });
            },
            blockMember: function (callback) {
                foundGroupMember.status = 4;
                foundGroupMember.permission = 0;
                group_member.update(foundGroupMember, function (error, result) {
                    if (error === -1) {
                        return callback(-6, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            },
            decreaseTotalMember: function (callback) {
                group.decreaseTotalMember(idGroup, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy thành viên này.';
                } else if (error === -5) {
                    message = 'Thành viên này đã bị chặn';
                } else if (error === -6) {
                    message = 'Không thành công. Vui lòng thử lại!';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                foundGroupMember = result.blockMember.toObject();
                res.json({
                    code: 1,
                    data: foundGroupMember
                });
            }
        });
    });

    app.post('/api/group_member/unblock_member', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_group_member',
            type: 'string',
            required: true,
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
                        data.owner = currentUser._id;
                        return callback(null, null);
                    }
                });
            },
            checkMember: function (callback) {
                group_member.getById(data.id_group_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var foundGroupMember = JSON.parse(JSON.stringify(result));
                        if (foundGroupMember.status === 3) {
                            return callback(-5, null);
                        } else if (foundGroupMember.status === 4) {
                            return callback(null, null);
                        }
                    }
                });
            },
            unblockMember: function (callback) {
                group_member.removeById(data.id_group_member, function (error, result) {
                    if (error) {
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
                    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại!';
                } else if (error === -4) {
                    message = 'Không tìm thấy thành viên này.';
                } else if (error === -5) {
                    message = 'Thành viên này không còn bị chặn';
                } else if (error === -6) {
                    message = 'Không thành công. Vui lòng thử lại!';
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
                    data: 'done'
                });
            }
        });
    });
};