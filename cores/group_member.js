/**
 * Created by Brucelee Thanh on 23/05/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var GroupMember = require(path.join(__dirname, '../', 'schemas/group_member.js'));
var friend = require(path.join(__dirname, '../', 'cores/friend.js'));

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
                    for (let i in results) {
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
                    for (let i in results) {
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

exports.getById = function (id_group_member, callback) {
    var query = GroupMember.findById(id_group_member);
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

exports.getAllByGroupAndStatus = getAllByGroupAndStatus;
function getAllByGroupAndStatus(id_group, status, callback) {
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

exports.getAllByGroupAndPermission = function (id_group, permission, callback) {
    var query = GroupMember.find({
        id_group: id_group,
        permission: permission
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

exports.getByGroupAndUserAndStatus = function (data, callback) { // data:{id_group, owner, status}
    var query = GroupMember.findOne({
        id_group: data.id_group,
        owner: data.owner,
        status: data.status
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

exports.searchInvite = function (data, callback) { // data : {id_group, keyword, _id, page, per_page}
    var lstFriend = [];
    var lstMemberGroup = [];
    async.series({
        findFriends: function (callback) {
            friend.searchFriend(data, function (error, results) {
                lstFriend = JSON.parse(JSON.stringify(results));
                callback(null, null);
            });
        },
        findMemberGroup: function (callback) {
            getAllByGroupAndStatus(data.id_group, 3, function (error, results) {
                lstMemberGroup = JSON.parse(JSON.stringify(results));
                callback(null, null);
            });
        },
        filterUser: function (callback) {
            async.filter(lstFriend, function (item, callback) {
                for(let i = 0; i <lstMemberGroup.length; i++){
                    if(lstMemberGroup[i].owner._id === item._id){
                        callback(null, false);
                    }else if(i == lstMemberGroup.length -1){
                        callback(null, true);
                    }
                }
            }, function (error, filteredItems) {
                callback(null, filteredItems);
            });
        }
    }, function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
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

exports.removeById = function (id_group_member, callback) {
    GroupMember.remove({
        _id: id_group_member
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