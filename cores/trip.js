/**
 * Created by Brucelee Thanh on 27/11/2016.
 */

var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));
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
        type: data.type,
        end_at: {$gt: new Date()}
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

exports.getDetail = function (id_trip, id_user, callback) {
    checkTripExits(id_trip, function (error, result) {
        if (result) {

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