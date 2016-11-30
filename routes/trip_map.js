/**
 * Created by Brucelee Thanh on 30/11/2016.
 */
var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var validator = require(path.join(__dirname, '../', 'ultis/validator.js'));
var authentication = require(path.join(__dirname, '../', 'ultis/authentication.js'));
var config = require(path.join(__dirname, '../', 'config.json'));
var mail = require(path.join(__dirname, '../', 'ultis/mail.js'));
var helper = require(path.join(__dirname, '../', 'ultis/helper.js'));
var trip_map = require(path.join(__dirname, '../', 'cores/trip_map.js'));

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
            checkExitsTrip: function (callback) {
                trip_map.checkExitsTrip(data.id_trip, function (error) {
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
                var options = {
                    id_trip: data.id_trip,
                    order: data.order,
                    title: data.title,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    content: data.content,
                    type: data.type,
                    status: data.status
                };
                trip_map.createPlace(options, function (error, result) {
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
                var foundTripMap = result.create.toObject();
                res.json({
                    code: 1,
                    data: foundTripMap
                });
            }
        });
    });
};