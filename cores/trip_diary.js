/**
 * Created by Brucelee Thanh on 04/03/2017.
 */

var async = require('async');
var path = require('path');
var mongoose = require('mongoose');
var TripDiary = require(path.join(__dirname, '../', 'schemas/trip_diary.js'));
var trip_diary = require(path.join(__dirname, '../', 'cores/trip_diary.js'));
var ObjectId = mongoose.Types.ObjectId;

exports.create = function (data, callback) {
    data.created_at = new Date();
    if (data.image_description) {
        data.images.push(data.image_description);
        for (var item in data.images) {
            if (data.images[item] === undefined) {
                data.images.splice(item, 1);
            }
        }
    }
    if (data.detail_diary) {
        for (let item in data.detail_diary) {
            if (data.detail_diary[item] === undefined) {
                data.detail_diary.splice(item, 1);
            } else {
                data.detail_diary[item]._id = new ObjectId();
            }
        }
    }
    var creatingTripDiary = new TripDiary(data);
    creatingTripDiary.save(function (error, result) {
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

exports.getAll = function (data, callback) { // data:{id_trip, owner, permission, type, page, per_page}
    var query = TripDiary.find({
        $or: [{
            id_trip: data.id_trip,
            permission: {$in: data.permission},
            type: data.type
        }, {
            id_trip: data.id_trip,
            owner: data.owner,
            permission: 1,
            type: data.type
        }]
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.skip(offset).limit(limit);
    }
    query.select('_id owner title images permission created_at');
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

exports.checkTripDiaryExisted = function (id_trip_diary, callback) {
    var query = TripDiary.findById(id_trip_diary);
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

