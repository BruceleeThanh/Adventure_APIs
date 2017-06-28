var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Friend = require(path.join(__dirname, '../', 'schemas/friend.js'));
var User = require(path.join(__dirname, '../', 'schemas/user.js'));

exports.create = function (data, callback) {
    var currentDate = new Date();
    data.created_at = currentDate;
    var creatingFriend = new Friend(data);
    creatingFriend.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.search = function (data, callback) { // data : {keyword, _id, page, per_page}
    var keyword = data.keyword.toLowerCase();
    var friends = null;
    var lstFriend = [];
    async.series({
        findFriends: function (callback) {
            searchBrowse(data, function (error, results) {
                results = JSON.parse(JSON.stringify(results));
                friends = results;
                async.filter(results, function (item, callback) {
                    var fullName = item.first_name + " " + item.last_name;
                    var fullName2 = item.last_name + " " + item.first_name;
                    var phoneNumber = item.phone_number == null || item.phone_number == undefined ? "" : item.phone_number;
                    var email = item.email == null || item.email == undefined ? "" : item.email;
                    if(keyword.indexOf('@') == -1) {
                        if (keyword.length >= 10) {
                            callback(null, (fullName.toLowerCase().indexOf(keyword) != -1 || fullName2.toLowerCase().indexOf(keyword) != -1) || phoneNumber.indexOf(keyword) != -1);
                        } else {
                            callback(null, (fullName.toLowerCase().indexOf(keyword) != -1 || fullName2.toLowerCase().indexOf(keyword) != -1));
                        }
                    }else{
                        callback(null, email.indexOf(keyword) != -1);
                    }
                }, function (error, filteredItems) {
                    callback(null, filteredItems);
                });
            });
        },
        findStrangers: function (callback) {
            lstFriend.push(data._id);
            for (i in friends) {
                lstFriend.push(friends[i]._id);
            }
            var option = data;
            option._id = lstFriend;
            findListUserIsNotFriend(option, function (error, results) {
                results = JSON.parse(JSON.stringify(results));
                async.filter(results, function (item, callback) {
                    var fullName = item.first_name + " " + item.last_name;
                    var fullName2 = item.last_name + " " + item.first_name;
                    callback(null, (fullName.toLowerCase().indexOf(keyword) != -1 || fullName2.toLowerCase().indexOf(keyword) != -1));
                }, function (error, filteredItems) {
                    callback(null, filteredItems);
                });
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

exports.searchFriend = function (data, callback) { // data : {keyword, _id, page, per_page}
    var keyword = data.keyword.toLowerCase();
    var friends = null;
    async.series({
        findFriends: function (callback) {
            browse(data, function (error, results) {
                results = JSON.parse(JSON.stringify(results));
                friends = results;
                async.filter(results, function (item, callback) {
                    var fullName = item.first_name + " " + item.last_name;
                    var fullName2 = item.last_name + " " + item.first_name;
                    var phoneNumber = item.phone_number == null || item.phone_number == undefined ? "" : item.phone_number;
                    var email = item.email == null || item.email == undefined ? "" : item.email;
                    if(keyword.indexOf('@') == -1) {
                        if (keyword.length >= 10) {
                            callback(null, (fullName.toLowerCase().indexOf(keyword) != -1 || fullName2.toLowerCase().indexOf(keyword) != -1) || phoneNumber.indexOf(keyword) != -1);
                        } else {
                            callback(null, (fullName.toLowerCase().indexOf(keyword) != -1 || fullName2.toLowerCase().indexOf(keyword) != -1));
                        }
                    }else{
                        callback(null, email.indexOf(keyword) != -1);
                    }
                }, function (error, filteredItems) {
                    callback(null, filteredItems);
                });
            });
        }
    }, function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else {
            if (typeof callback === 'function') return callback(null, results.findFriends);
        }
    });
};

exports.browse = browse;
function browse(data, callback) {
    var query = Friend.find({
        $or: [{
            user_one: data._id
        }, {
            user_two: data._id
        }]
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id user_one user_two created_at');
    query.populate('user_one', '_id first_name last_name avatar');
    query.populate('user_two', '_id first_name last_name avatar');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length <= 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                var users = [];
                for (var i = 0; i < results.length; i++) {
                    if (results[i].user_one._id.toHexString() !== data._id) {
                        users.push(results[i].user_one);
                    }
                    if (results[i].user_two._id.toHexString() !== data._id) {
                        users.push(results[i].user_two);
                    }
                }
                if (typeof callback === 'function') return callback(null, users);
            }
        }
    });
}

exports.searchBrowse = searchBrowse;
function searchBrowse(data, callback) {
    var query = Friend.find({
        $or: [{
            user_one: data._id
        }, {
            user_two: data._id
        }]
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id user_one user_two created_at');
    query.populate('user_one', '_id first_name last_name avatar phone_number email');
    query.populate('user_two', '_id first_name last_name avatar phone_number email');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (results.length <= 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                var users = [];
                for (var i = 0; i < results.length; i++) {
                    if (results[i].user_one._id.toHexString() !== data._id) {
                        users.push(results[i].user_one);
                    }
                    if (results[i].user_two._id.toHexString() !== data._id) {
                        users.push(results[i].user_two);
                    }
                }
                if (typeof callback === 'function') return callback(null, users);
            }
        }
    });
};

exports.checkExits = function (data, callback) {
    var query = Friend.findOne({
        user_one: {
            $in: [data.user_one, data.user_two]
        },
        user_two: {
            $in: [data.user_one, data.user_two]
        }
    });
    query.exec(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.findListUserIsNotFriend = findListUserIsNotFriend;
function findListUserIsNotFriend(data, callback) {
    var query = User.find({
        _id: {
            $nin: data._id
        }
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id first_name last_name avatar');
    query.sort({created_at: -1});
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
}

exports.findFriend = function (data, callback) {
    var query = Friend.find({
        $or: [{
            user_one: data._id
        }, {
            user_two: data._id
        }]
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.skip(limit).offset(offset);
    }
    query.select('_id user_one user_two created_at');
    query.populate('user_one', '_id first_name last_name avatar');
    query.populate('user_two', '_id first_name last_name avatar');
    query.sort({created_at: -1});
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length <= 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, results);
        }
    });
};
