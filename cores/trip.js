/**
 * Created by Brucelee Thanh on 27/11/2016.
 */

var async = require('async');
var path = require('path');
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));

exports.create = function (data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    console.log(data);
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
    query.select('_id owner name start_at end_at destination_summary expense images amount_people amount_member amount_interested rating created_at permission');
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