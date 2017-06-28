/**
 * Created by Brucelee Thanh on 19/01/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));
var trip_member = require(path.join(__dirname, '../', 'cores/trip_member.js'));
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));

module.exports = function (app, redisClient) {
    app.post('/api/trip_member/request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
            type: 'string',
            required: true
        },{
            name: 'message',
            type: 'string',
            required: false
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            checkTripMemberExisted: function (callback) {
                trip_member.checkTripMemberExisted(data.id_trip, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var tripMember = JSON.parse(JSON.stringify(result));
                        if (tripMember.status == 1) {
                            return callback(-5, null);
                        } else if (tripMember.status == 2) {
                            return callback(-6, null);
                        } else if (tripMember.status == 3) {
                            return callback(-7, null);
                        }
                    }
                });
            },
            create: function (callback) {
                var option = {
                    id_trip: data.id_trip,
                    owner: data.owner,
                    message: data.message,
                    status: 1
                };
                trip_member.create(option, function (error, result) {
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'This request have existed';
                } else if (error === -6) {
                    message = 'You have been invited';
                } else if (error === -7) {
                    message = 'You\'re already member';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMember = result.create;
                res.json({
                    code: 1,
                    data: foundTripMember
                });
            }
        });
    });

    app.post('/api/trip_member/cancel_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            checkTripMemberExisted: function (callback) {
                trip_member.checkTripMemberExisted(data.id_trip, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var tripMember = JSON.parse(JSON.stringify(result));
                        if (tripMember.status == 1) {
                            return callback(null, null);
                        } else if (tripMember.status == 2) {
                            return callback(-6, null);
                        } else if (tripMember.status == 3) {
                            return callback(-7, null);
                        }
                    }
                });
            },
            remove: function (callback) {
                trip_member.remove(data.id_trip, data.owner, function (error, result) {
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'Request is not found';
                } else if (error === -6) {
                    message = 'You have been invited';
                } else if (error === -7) {
                    message = 'You\'re already member';
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

    app.post('/api/trip_member/browse_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
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
                trip_member.getAllRequestByIdTrip(data.id_trip, function (error, results) {
                    if (error === -1) {
                        return callback(-5, null);
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'Request member trip is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMemberRequest = results.browse;
                res.json({
                    code: 1,
                    data: foundTripMemberRequest,
                    total: foundTripMemberRequest.length
                });
            }
        });
    });

    app.post('/api/trip_member/browse_invite', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
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
                trip_member.getAllInviteByIdTrip(data.id_trip, function (error, results) {
                    if (error === -1) {
                        return callback(-5, null);
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'Invite member trip is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMemberRequest = results.browse;
                res.json({
                    code: 1,
                    data: foundTripMemberRequest
                });
            }
        });
    });

    app.post('/api/trip_member/browse_member', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
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
                trip_member.getAllMemberByIdTrip(data.id_trip, function (error, results) {
                    if (error === -1) {
                        return callback(-5, null);
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'Member trip is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMemberRequest = results.browse;
                res.json({
                    code: 1,
                    data: foundTripMemberRequest
                });
            }
        });
    });

    app.post('/api/trip_member/accept_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip_member',
            type: 'string',
            required: true
        }];
        var currentUser = null;
        var foundTripMember = null;
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
            checkTripMemberExisted: function (callback) {
                trip_member.checkTripMemberExistedById(data.id_trip_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundTripMember = JSON.parse(JSON.stringify(result));
                        return callback(null, null);
                    }
                });
            },
            acceptRequest: function (callback) {
                var option = {
                    id_trip: foundTripMember.id_trip,
                    owner: foundTripMember.owner,
                    status: 3
                };
                trip_member.update(option, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            },
            increaseAmountMember: function (callback) {
                Trip.findByIdAndUpdate(foundTripMember.id_trip, {$inc: {amount_member: 1}}, {new: true}, function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(null, null);
                    } else {
                        if (typeof callback === 'function') return callback(null, result);
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
                    message = 'This request is not found';
                } else if (error === -5) {
                    message = 'Cannot accept this request';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMemberRequest = result.acceptRequest;
                var foundTrip = result.increaseAmountMember;
                res.json({
                    code: 1,
                    data: {
                        trip_member: foundTripMemberRequest,
                        schedule: foundTrip
                    }
                });
            }
        });
    });

    app.post('/api/trip_member/reject_request', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip_member',
            type: 'string',
            required: true
        }];
        var currentUser = null;
        var foundTripMember = null;
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
            checkTripMemberExisted: function (callback) {
                trip_member.checkTripMemberExistedById(data.id_trip_member, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        foundTripMember = JSON.parse(JSON.stringify(result));
                        return callback(null, null);
                    }
                });
            },
            remove: function (callback) {
                trip_member.remove(foundTripMember.id_trip, foundTripMember.owner, function (error, result) {
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
                    message = 'This request is not found';
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

    app.post('/api/trip_member/leave_trip', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
            checkTripExisted: function (callback) {
                trip.checkTripExisted(data.id_trip, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            checkTripMemberExisted: function (callback) {
                trip_member.checkTripMemberExisted(data.id_trip, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        var tripMember = JSON.parse(JSON.stringify(result));
                        if (tripMember.status == 3) {
                            return callback(null, null);
                        } else
                            return callback(-5, null);
                    }
                });
            },
            remove: function (callback) {
                trip_member.remove(data.id_trip, data.owner, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            decreaseAmountMember: function (callback) {
                Trip.findByIdAndUpdate(data.id_trip, {$inc: {amount_member: -1}}, {new: true}, function (error, result) {
                    if (error) {
                        require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                        if (typeof callback === 'function') return callback(null, null);
                    } else {
                        if (typeof callback === 'function') return callback(null, result);
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
                    message = 'Trip is not found';
                } else if (error === -5) {
                    message = 'You are not member of this trip';
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