/**
 * Created by Brucelee Thanh on 27/11/2016.
 */

var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));
var trip_member = require(path.join(__dirname, '../', 'cores/trip_member.js'));
var trip_interested = require(path.join(__dirname, '../', 'cores/trip_interested.js'));
var ObjectId = mongoose.Types.ObjectId;

exports.create = function (data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    console.log(data);
    if (data.routes) {
        for (let item in data.routes) {
            if (data.routes[item] === undefined) {
                data.routes.splice(item, 1);
            } else {
                data.routes[item]._id = new ObjectId();
                data.routes[item].start_at = new Date(data.routes[item].start_at);
                data.routes[item].end_at = new Date(data.routes[item].end_at);
            }
        }
    }
    var creatingTrip = new Trip(data);
    creatingTrip.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') {
                return callback(-2, null);
            }
        } else {
            if (typeof callback === 'function') {
                return callback(null, result);
            }
        }
    });
};

exports.getAll = function (data, callback) { // data: {permission, type, page, per_page}
    var query = Trip.find({
        permission: data.permission,
        type: data.type
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.skip(offset).limit(limit);
    }
    query.select('_id owner name start_position start_at end_at destination_summary expense images amount_people amount_member amount_interested amount_rating rating created_at permission');
    query.populate('owner', '_id first_name last_name avatar');
    query.sort({created_at: -1});
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') {
                return callback(null, results);
            }
        }
    });
};

exports.findOneAndCheckInteract = function (id_trip, owner, callback) {
    var foundTrip = null;
    checkTripExits(id_trip, function (error, resultTrip) {
        if (resultTrip) {
            foundTrip = JSON.parse(JSON.stringify(resultTrip));
            async.parallel({
                checkMember: function (callback) {
                    trip_member.checkTripMemberExisted(id_trip, owner, function (error, resultMemberTrip) {
                        if (error) { // 1. Request member; 2. Invite member; 3. Member; 4. Nothing happen
                            foundTrip.is_member = 4;
                            return callback(null, null);
                        } else {
                            var foundTripMember = JSON.parse(JSON.stringify(resultMemberTrip));
                            foundTrip.is_member = foundTripMember.status;
                            return callback(null, null);
                        }
                    });
                },
                checkInterested: function (callback) {
                    trip_interested.checkTripInterestedExisted(id_trip, owner, function (error, resultInterestedTrip) {
                        if (error) {
                            foundTrip.is_interested = 0;
                            return callback(null, null);
                        } else {
                            foundTrip.is_interested = 1;
                            return callback(null, null);
                        }
                    });
                }
            }, function (error, result) {
                return callback(null, foundTrip);
            });
        } else if (error === -1) {
            return callback(-1, null);
        } else if (error) {
            return callback(error, null);
        }
    });
};

function checkTripExits(id_trip, callback) {
    var query = Trip.findById(id_trip);
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (!result) {
                if (typeof callback === 'function') return callback(-1, null);
            }
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};
exports.checkTripExits = checkTripExits;

exports.update = function (updatingData, data, callback) {
    for (var field in data) {
        updatingData[field] = data[field];
    }
    updatingData.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};