/**
 * Created by Brucelee Thanh on 30/11/2016.
 */
var async = require('async');
var path = require('path');
var Place = require(path.join(__dirname, '../', 'schemas/place.js'));
var Trip = require(path.join(__dirname, '../', 'schemas/trip.js'));

exports.checkTripExits = function (data, callback) {
    var query = Trip.findOne({
        _id : data
    });
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
    })
}

exports.createPlace = function (data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    console.log(data);
    var creatingPlace = new Place(data);
    creatingPlace.save(function (error, result) {
        if(error){
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') {
                return callback(-2, null);
            }
        }else{
            if (typeof callback === 'function') {
                return callback(null, result);
            }
        }
    });
};
