/**
 * Created by Brucelee Thanh on 23/05/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var GroupMember = require(path.join(__dirname, '../', 'schemas/group_member.js'));

exports.create = function (data, callback) {
    data.created_at = new Date();
    var creatingGroupMember = new GroupMember(data);
    creatingGroupMember.save(function (error, result) {
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

exports.update = function (data, callback) {
    data.created_at = new Date();
    GroupMember.findOneAndUpdate({
        id_group: data.id_group,
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

exports.getGroupByUserAndPermission = function (id_user, permission, callback) {
    var query = GroupMember.find({
        owner: id_user,
        permission: permission
    });
    query.select('id_group -_id');
    query.populate('id_group', '_id name cover permission');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length < 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                var promise = new Promise(function (resolve, reject) {
                    results = JSON.parse(JSON.stringify(results));
                    var lstGroups = [];
                    for(let i in results){
                        lstGroups.push(results[i].id_group);
                    }
                    resolve(lstGroups);
                });
                promise.then(function (data) {
                    if (typeof callback === 'function') return callback(null, data);
                }, function (error) {
                    if (typeof callback === 'function') return callback(null, null);
                });
            }
        }
    });
};

exports.getGroupByUserAndStatus = function (id_user, status, callback) {
    var query = GroupMember.find({
        owner: id_user,
        status: status
    });
    query.select('_id id_group owner permission status created_at');
    query.populate('id_group', '_id name cover permission');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length < 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                var promise = new Promise(function (resolve, reject) {
                    results = JSON.parse(JSON.stringify(results));
                    var lstGroups = [];
                    for(let i in results){
                        lstGroups.push(results[i].id_group);
                    }
                    resolve(lstGroups);
                });
                promise.then(function (data) {
                    if (typeof callback === 'function') return callback(null, data);
                }, function (error) {
                    if (typeof callback === 'function') return callback(null, null);
                });
            }
        }
    });
};

exports.getAllIdGroupByUser = function (id_user, callback) {
    var query = GroupMember.find({
        owner: id_user
    });
    query.select('id_group -_id');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length < 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                if (typeof callback === 'function') return callback(null, results);
            }
        }
    });
};

exports.getAllByGroupAndStatus = function (id_group, status, callback) {
    var query = GroupMember.find({
        id_group: id_group,
        status: status
    });
    query.populate('owner', '_id first_name last_name avatar');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length <= 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                if (typeof callback === 'function') return callback(null, results);
            }
        }
    });
};

exports.getByGroupAndUser = function (id_group, id_user, callback) {
    var query = GroupMember.findOne({
        id_group: id_group,
        owner: id_user
    });
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (!result) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                if (typeof callback === 'function') return callback(null, result);
            }
        }
    });
};

exports.remove = function (id_group, id_user, callback) {
    GroupMember.remove({
        id_group: id_group,
        owner: id_user
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