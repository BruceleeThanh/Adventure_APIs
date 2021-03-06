/**
 * Created by Brucelee Thanh on 30/11/2016.
 */
var async = require('async');
var path = require('path');
var Place = require(path.join(__dirname, '../', 'schemas/place.js'));
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));

exports.createPlace = function (data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    var creatingPlace = new Place(data);
    creatingPlace.save(function (error, result) {
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

exports.getAllByIdTrip = function (id_trip, callback) {
    var query = Place.find({
        id_trip: id_trip
    });
    query.sort({created_at: 1});
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

exports.countAllPlaceArrivedByUser = function (id_user, callback) {
    var idTrips = [];
    trip.getAllIdTripCreatedAndJoinedByUser(id_user, function (error, results) {
        if (error === -1) {
            return callback(-1, null);
        } else if (error) {
            return callback(error, null);
        } else {
            var trips = JSON.parse(JSON.stringify(results));
            for(let i in trips){
                idTrips.push(trips[i]._id);
            }
            Place.count({id_trip: {$in : idTrips}}, function (error, count) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (typeof callback === 'function') return callback(null, count);
                }
            });
        }
    });
};

exports.countAllTripsCreatedByUser = countAllTripsCreatedByUser;
function countAllTripsCreatedByUser(id_user, callback) {
    Trip.count({owner: id_user}, function (error, count) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, count);
        }
    });
};