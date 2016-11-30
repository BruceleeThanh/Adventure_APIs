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