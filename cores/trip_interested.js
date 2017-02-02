/**
 * Created by Brucelee Thanh on 29/01/2017.
 */
var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var TripInterested = require(path.join(__dirname, '../', 'schemas/trip_interested.js'));
var trip_member = require(path.join(__dirname, '../', 'cores/trip_member.js'));
var ObjectId = mongoose.Types.ObjectId;

exports.create = function (data, callback) { // data {id_trip, owner}
    data.created_at = new Date();
    var creatingTripInterested = new TripInterested(data);
    creatingTripInterested.save(function (error, result) {
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

exports.getAll = function (data, callback) { // data: {id_trip, page, per_page}
    var query = TripInterested.find({
        id_trip: data.id_trip
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.skip(offset).limit(limit);
    }
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

exports.checkTripInterestedExisted = function (id_trip, owner, callback) {
    var query = TripInterested.findOne({
        id_trip: id_trip,
        owner: owner
    });
    query.exec(function (error, result) {
            if (error) {
                require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                if (typeof callback === 'function') return callback(-2, null);
            } else if (!result) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                if (typeof callback === 'function') return callback(null, results);
            }
        }
    );
};

exports.remove = function (id_trip, owner, callback) {
    TripInterested.remove({
        id_trip: id_trip,
        owner: owner
    }, function (error) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') {
                return callback(null, null);
            }
        }
    });
};