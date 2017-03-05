/**
 * Created by Brucelee Thanh on 04/03/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));
var trip_diary = require(path.join(__dirname, '../', 'cores/trip_diary.js'));
var trip_member = require(path.join(__dirname, '../', 'cores/trip_member.js'));
var DetailDiary = require(path.join(__dirname, '../', 'schemas/detail_diary.js'));

module.exports = function (app, redisClient) {
    app.post('/api/trip_diary/create', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
            type: 'string',
            required: false,
        }, {
            name: 'title',
            type: 'string',
            required: false
        }, {
            name: 'content',
            type: 'string',
            required: false,
        }, {
            name: 'image_description',
            type: 'image_description_object_array',
            required: false
        }, {
            name: 'detail_diary',
            type: 'routes_object_array',
            required: false
        }, {
            name: 'permission',
            type: 'string',
            required: true
        }, {
            name: 'type',
            type: 'string',
            required: true
        }];

        var currentUser = null;
        var detail_diary = null;
        var image_description = null;

        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        if (data.detail_diary) {
                            detail_diary = JSON.parse(data.detail_diary);
                        }
                        if (data.image_description) {
                            image_description = JSON.parse(data.image_description);
                        }
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
            create: function (callback) {
                var options = {
                    owner: data.owner,
                    id_trip: data.id_trip,
                    title: data.title,
                    content: data.content,
                    image_description: image_description,
                    detail_diary: detail_diary,
                    permission: data.permission,
                    type: data.type
                };
                trip_diary.create(options, function (error, result) {
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
                    data: result.create
                });
            }
        });
    });

    app.post('/api/trip_diary/browse', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
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
        var isMember = null;
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
                    if (error) {
                        isMember = false;
                        return callback(null, null);
                    } else {
                        var tripMember = JSON.parse(JSON.stringify(result));
                        if (tripMember.status == 3) {
                            isMember = true;
                            return callback(null, null);
                        } else {
                            isMember = false;
                            return callback(null, null);
                        }
                    }
                });
            },
            browse: function (callback) {
                var option = null;
                if (isMember === true) {
                    option = {
                        permission: [2, 3], // 2: Member in trip, 3: Public
                        type: 1, // 1: Diary in trip
                        page: data.page,
                        per_page: data.per_page
                    }
                } else {
                    option = {
                        permission: [3], // 3: Public
                        type: 1, // 1: Diary in trip
                        page: data.page,
                        per_page: data.per_page
                    }
                }
                trip_diary.getAll(option, function (error, results) {
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
                    message = 'Trip diary is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripDiaries = results.browse;
                res.json({
                    code: 1,
                    data: foundTripDiaries,
                    total: foundTripDiaries.length
                });
            }
        });
    });

    app.post('/api/trip_diary/detail', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip_diary',
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
            getTripDiary: function (callback) {
                trip_diary.checkTripDiaryExisted(data.id_trip_diary, function (error, result) {
                    if (error === -1) {
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
                    message = 'Trip diary is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripDiary = result.getTripDiary;
                res.json({
                    code: 1,
                    data: foundTripDiary
                });
            }
        });
    });
};