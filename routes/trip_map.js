/**
 * Created by Brucelee Thanh on 30/11/2016.
 */
var path = require('path');
var async = require('async');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var trip_map = require(path.join(__dirname, '../', 'cores/trip_map.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));

module.exports = function (app, redisClient) {
    app.post('/api/trip_map/create_place', function (req, res) {
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
            name: 'order',
            type: 'number',
            required: false
        }, {
            name: 'title',
            type: 'string',
            required: false
        }, {
            name: 'address',
            type: 'string',
            required: false
        }, {
            name: 'latitude',
            type: 'string',
            required: false
        }, {
            name: 'longitude',
            type: 'string',
            required: false
        }, {
            name: 'content',
            type: 'string',
            required: false
        }, {
            name: 'type',
            type: 'number',
            required: false
        }, {
            name: 'status',
            type: 'number',
            required: false
        }];
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
                        return callback(null, null);
                    }
                });
            },
            checkTripExits: function (callback) {
                trip.checkTripExits(data.id_trip, function (error, result) {
                    if (error === -1) {
                        return callback(-4, null);
                    } else if (error) {
                        return callback(error, null);
                    } else {
                        return callback(null, null);
                    }
                })
            },
            create: function (callback) {
                trip_map.createPlace(data, function (error, result) {
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
                if (code == -1) {
                    message = 'Redis error';
                } else if (error === -2) {
                    message = 'DB error';
                } else if (error === -3) {
                    message = 'Token is not found';
                } else if (error === -4) {
                    message = 'Trip is not exist';
                } else {
                    message = error;
                    code = 0;
                }
                res.json({
                    code: code,
                    message: message
                });
            } else {
                var foundTripMap = result.create;
                res.json({
                    code: 1,
                    data: foundTripMap
                });
            }
        });
    });
};