/**
 * Created by Brucelee Thanh on 27/11/2016.
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
var trip_map = require(path.join(__dirname, '../', 'cores/trip_map.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var trip_diary = require(path.join(__dirname, '../', 'cores/trip_diary.js'));
var trip_member = require(path.join(__dirname, '../', 'cores/trip_member.js'));
var trip_interested = require(path.join(__dirname, '../', 'cores/trip_interested.js'));
var Route = require(path.join(__dirname, '../', 'schemas/route.js'));

module.exports = function (app, redisClient) {
    app.post('/api/trip/create', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'name',
            type: 'string',
            required: false,
        }, {
            name: 'description',
            type: 'string',
            required: false
        }, {
            name: 'start_position',
            type: 'string',
            required: false
        }, {
            name: 'start_at',
            type: 'date',
            required: false,
        }, {
            name: 'end_at',
            type: 'date',
            required: false
        }, {
            name: 'destination_summary',
            type: 'string',
            required: false
        }, {
            name: 'expense',
            type: 'string',
            required: false
        }, {
            name: 'amount_people',
            type: 'number',
            required: false
        }, {
            name: 'vehicles',
            type: 'numbers_array',
            required: false
        }, {
            name: 'routes',
            type: 'routes_object_array',
            required: false
        }, {
            name: 'images',
            type: 'strings_array',
            required: false
        }, {
            name: 'prepare',
            type: 'string',
            required: false
        }, {
            name: 'note',
            type: 'string',
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
        var routes = null;
        var createdTrip = null;

        async.series({
            validate: function (callback) {
                validator(req.body, fields, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        data = result;
                        if (data.routes) {
                            routes = JSON.parse(data.routes);
                            for (var i in routes) {
                                console.log(routes[i].start_at);
                                console.log(routes[i].end_at);
                                routes[i].start_at = new Date(routes[i].start_at);
                                routes[i].end_at = new Date(routes[i].end_at);
                                console.log(routes[i].start_at);
                                console.log(routes[i].end_at);
                            }
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
            create: function (callback) {
                var options = {
                    owner: data.owner,
                    name: data.name,
                    description: data.description,
                    start_position: data.start_position,
                    start_at: data.start_at,
                    end_at: data.end_at,
                    destination_summary: data.destination_summary,
                    expense: data.expense,
                    amount_people: data.amount_people,
                    vehicles: data.vehicles,
                    routes: routes,
                    images: data.images,
                    prepare: data.prepare,
                    note: data.note,
                    permission: data.permission,
                    type: data.type
                };
                trip.create(options, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        createdTrip = JSON.parse(JSON.stringify(result));
                        var option = {
                            id_trip: createdTrip._id,
                            owner: createdTrip.owner,
                            status: 3
                        };
                        trip_member.create(option, function (error, result) {
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
                    data: createdTrip
                });
            }
        });
    });

    app.get('/api/trip/browse', function (req, res) {
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
                        return callback(null, null);
                    }
                });
            },
            browse: function (callback) {
                var opt = {
                    permission: 3,
                    type: 1,
                    page: data.page,
                    per_page: data.per_page
                };
                trip.getAll(opt, function (error, results) {
                    if (error === -1) {
                        return callback(-4, null);
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
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTrips = results.browse;
                res.json({
                    code: 1,
                    data: foundTrips,
                    total: foundTrips.length
                });
            }
        });
    });

    app.post('/api/trip/detail', function (req, res) {
        var data = {};
        var fields = [{
            name: 'token',
            type: 'string',
            required: true
        }, {
            name: 'id_trip',
            type: 'string',
            required: true,
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
            getTripAndMember: function (callback) {
                trip.findOneAndCheckInteract(data.id_trip, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        if (result.schedule.is_member == 3) {
                            isMember = true;
                        } else {
                            isMember = false;
                        }
                        return callback(null, result);
                    }
                });
            },
            getPlaces: function (callback) {
                trip_map.getAllByIdTrip(data.id_trip, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
                        return callback(null, null);
                    } else {
                        return callback(null, results);
                    }
                });
            },
            getDiscuss: function (callback) {
                if (isMember === true) {
                    var option = {
                        id_user: data.owner,
                        id_trip: data.id_trip
                    };
                    status.getTripDiscuss(option, function (error, results) {
                        if (error === -1) {
                            return callback(null, null);
                        } else if (error) {
                            return callback(null, null);
                        } else {
                            return callback(null, results);
                        }
                    });
                } else {
                    return callback(null, null);
                }
            },
            getDiaries: function (callback) {
                var option = null;
                if (isMember === true) {
                    option = {
                        id_trip: data.id_trip,
                        owner: data.owner,
                        permission: [2, 3], // 2: Member in trip, 3: Public
                        type: 1, // 1: Diary in trip
                        page: data.page,
                        per_page: data.per_page
                    }
                } else {
                    option = {
                        id_trip: data.id_trip,
                        owner: data.owner,
                        permission: [3], // 3: Public
                        type: 1, // 1: Diary in trip
                        page: data.page,
                        per_page: data.per_page
                    }
                }
                trip_diary.getAll(option, function (error, results) {
                    if (error === -1) {
                        return callback(null, null);
                    } else if (error) {
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
                var foundTrip = results.getTripAndMember;
                var foundPlaces = results.getPlaces;
                var foundDiscuss = results.getDiscuss;
                var foundDiaries = results.getDiaries;
                res.json({
                    code: 1,
                    data: {
                        schedule: foundTrip.schedule,
                        members: foundTrip.members,
                        map: foundPlaces,
                        discuss: foundDiscuss,
                        diaries: foundDiaries
                    }
                });
            }
        });
    });

    app.post('/api/trip/interested', function (req, res) {
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
        var foundTrip = null;
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
                        foundTrip = result;
                        return callback(null, null);
                    }
                });
            },
            create: function (callback) {
                var option = {
                    id_trip: data.id_trip,
                    owner: data.owner
                };
                trip_interested.create(option, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, result);
                    }
                });
            },
            increaseInterested: function (callback) {
                var increase = {
                    amount_interested: foundTrip.amount_interested + 1
                };
                trip.update(foundTrip, increase, function (error, result) {
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
                var foundTripInterested = result.create;
                var foundTrip = result.increaseInterested;
                res.json({
                    code: 1,
                    data: {
                        trip_interested: foundTripInterested,
                        schedule: foundTrip
                    }
                });
            }
        });
    });

    app.post('/api/trip/uninterested', function (req, res) {
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
        var foundTrip = null;
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
                        foundTrip = result;
                        return callback(null, null);
                    }
                });
            },
            checkTripInterestedExisted: function (callback) {
                trip_interested.checkTripInterestedExisted(data.id_trip, data.owner, function (error, result) {
                    if (error === -1) {
                        return callback(-5, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            remove: function (callback) {
                trip_interested.remove(data.id_trip, data.owner, function (error, result) {
                    if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                });
            },
            decreaseInterested: function (callback) {
                if (foundTrip.amount_interested > 0) {
                    var decrease = {
                        amount_interested: foundTrip.amount_interested - 1
                    };
                    trip.update(foundTrip, decrease, function (error, result) {
                        if (error) {
                            return callback(error, null);
                        } else {
                            return callback(null, result);
                        }
                    });
                } else return callback(null, null);
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
                    message = 'Trip Interested is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTrip = result.decreaseInterested;
                res.json({
                    code: 1,
                    data: {
                        trip_interested: 'done',
                        schedule: foundTrip
                    }
                });
            }
        });
    });

    app.post('/api/trip/browse_interested', function (req, res) {
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
                trip_interested.getAll(data, function (error, results) {
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
                    message = 'Trip interested is not found';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripInteresteds = results.browse;
                res.json({
                    code: 1,
                    data: foundTripInteresteds,
                    total: foundTripInteresteds.length
                });
            }
        });
    });
};