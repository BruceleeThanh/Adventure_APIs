/**
 * Created by Brucelee Thanh on 19/01/2017.
 */

var async = require('async');
var path = require('path');
var TripMember = require(path.join(__dirname, '../', 'schemas/trip_member.js'));

exports.create = function (data, callback) { // data:{ id_trip owner status}
    data.created_at = new Date();
    var creating = new TripMember(data);
    creating.save(function (error, result) {
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

exports.update = function (data, callback) { // data:{id_trip, owner, status}
    data.created_at = new Date();
    TripMember.findOneAndUpdate({
        id_trip: data.id_trip,
        owner: data.owner
    }, data, {new: true}, function (error, result) {
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

exports.remove = function (id_trip, owner, callback) {
    TripMember.remove({
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

exports.getAllByIdTrip = function (id_trip, callback) {
    var query = TripMember.find({
        id_trip: id_trip
    });
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

exports.getAllRequestByIdTrip = function (id_trip, callback) {
    var query = TripMember.find({
        id_trip: id_trip,
        status: 1
    });
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

exports.getAllInviteByIdTrip = function (id_trip, callback) {
    var query = TripMember.find({
        id_trip: id_trip,
        status: 2
    });
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

exports.getAllMemberByIdTrip = function (id_trip, callback) {
    var query = TripMember.find({
        id_trip: id_trip,
        status: 3
    });
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

exports.checkTripMemberExisted = function (id_trip, owner, callback) {
    var query = TripMember.findOne({
        id_trip: id_trip,
        owner: owner
    });
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        }
        if (typeof callback === 'function') return callback(null, result);
    });
};

exports.checkTripMemberExistedById = function (_id, callback) {
    var query = TripMember.findById(_id);
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        }
        if (typeof callback === 'function') return callback(null, result);
    });
};

exports.getIdTripByOwnerAndStatus = function (data, callback) { // data:{id_user, status, page, per_page}
    var query = TripMember.find({
        owner: data.id_user,
        status: data.status
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.skip(offset).limit(limit);
    }
    query.select('-_id id_trip');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-1, null);
        }
        if (typeof callback === 'function') return callback(null, results);
    });
};