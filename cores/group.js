/**
 * Created by Brucelee Thanh on 23/05/2017.
 */

var path = require('path');
var async = require('async');
var uuid = require('node-uuid');
var Group = require(path.join(__dirname, '../', 'schemas/group.js'));
var group_member = require(path.join(__dirname, '../', 'cores/group_member.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));

exports.create = function (data, callback) {
    data.created_at = new Date();
    var creatingGroup = new Group(data);
    creatingGroup.save(function (error, result) {
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

exports.increaseTotalMember = function (id_group, callback) {
    Group.findByIdAndUpdate(id_group, {$inc: {total_member: 1}}, {new: true}, function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.decreaseTotalMember = function (id_group, callback) {
    Group.findByIdAndUpdate(id_group, {$inc: {total_member: -1}}, {new: true}, function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(error, null);
        } else if (!result) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};


exports.getSuggestGroup = function (data, callback) { // data: id_user, page, per_page
    var lstGroupIds = [];
    group_member.getAllIdGroupByUser(data.id_user, function (error, results) {
        var groups = JSON.parse(JSON.stringify(results));
        for (let i in groups) {
            lstGroupIds.push(groups[i].id_group);
        }
        var query = Group.find({
            _id: {
                $nin: lstGroupIds
            },
            permission: {$in: [2, 3]}
        });
        query.select('_id name cover permission');
        var limit = 10;
        var offset = 0;
        if (data.page !== undefined && data.per_page !== undefined) {
            limit = data.per_page;
            offset = (data.page - 1) * data.per_page;
            query.skip(limit).offset(offset);
        }
        query.exec(function (error, results) {
            if (error) {
                require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                if (typeof callback === 'function') return callback(-2, null);
            } else if (results.length < 0) {
                if (typeof callback === 'function') return callback(-1, null);
            } else {
                if (typeof callback === 'function') return callback(null, results);
            }
        });
    });
};

exports.getById = getById;
function getById(id_group, callback) {
    var query = Group.findById(id_group);
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
}

exports.getDetail = function (data, callback) { // data: id_user, id_group, page, per_page
    var foundGroup = null;
    // 0: none activity, 1: request member, 2: invite member, 3: member, 4: blocked member, 5: admin, 6: creator
    var yourStatus = null;
    async.series({
        getGroup: function (callback) {
            getById(data.id_group, function (error, result) {
                if (error == -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    foundGroup = result.toObject();
                    return callback(null, foundGroup);
                }
            });
        },
        getYourStatus: function (callback) {
            group_member.getByGroupAndUser(data.id_group, data.id_user, function (error, result) {
                if (error == -1) {
                    yourStatus = 0;
                    return callback(null, yourStatus);
                } else if (error) { // error
                    return callback(error, null);
                } else {
                    if (result.status == 3) {
                        if (result.permission == 3) {
                            yourStatus = 3;
                            return callback(null, yourStatus);
                        } else if (result.permission == 2) {
                            yourStatus = 5;
                            return callback(null, yourStatus);
                        } else if (result.permission == 1) {
                            yourStatus = 6;
                            return callback(null, yourStatus);
                        }
                    } else {
                        yourStatus = result.status;
                        return callback(null, yourStatus);
                    }
                }
            });
        },
        getPost: function (callback) {
            if (yourStatus == 3 || yourStatus == 5 || yourStatus == 6 || (foundGroup.permission == 3 && yourStatus != 4)) {
                async.parallel({
                    getStatus: function (callback) {
                        status.getByGroup(data, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    },
                    getTrips: function (callback) {
                        trip.getByGroup(data, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    }
                }, function (error, results) {
                    var foundPost = [];
                    var foundStatus = JSON.parse(JSON.stringify(results.getStatus));
                    var foundTrips = JSON.parse(JSON.stringify(results.getTrips));
                    for (let i in foundStatus) {
                        foundStatus[i].type_item = 1;
                        foundPost.push(foundStatus[i]);
                    }
                    for (let i in foundTrips) {
                        foundTrips[i].type_item = 2;
                        foundPost.push(foundTrips[i]);
                    }
                    async.sortBy(foundPost, function (obj, callback) {
                        callback(error, new Date(obj.created_at).getTime() * -1);
                    }, function (error, sorted) {
                        foundPost = sorted;
                        return callback(null, foundPost);
                    });
                });
            } else {
                return callback(null, "Close");
            }
        }
    }, function (error, result) {
        if (error == -1) {
            if (typeof callback === 'function') return callback(-4, null);
        } else if (error) {
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.getInfo = function (data, callback) { // data: id_user, id_group
    var foundGroup = null;
    var yourStatus = null; // 1: you are NOT a member, 2: you are a member of this group.
    async.series({
        getGroup: function (callback) {
            getById(data.id_group, function (error, result) {
                if (error == -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    foundGroup = result.toObject();
                    return callback(null, foundGroup);
                }
            });
        },
        getYourStatus: function (callback) {
            group_member.getByGroupAndUser(data.id_group, data.id_user, function (error, result) {
                if (error == -1) {
                    yourStatus = 1;
                    return callback(null, yourStatus);
                } else if (error) { // error
                    return callback(error, null);
                } else {
                    if (result.status == 3) { // you are a member of this group
                        yourStatus = 2;
                        return callback(null, yourStatus);
                    } else {
                        yourStatus = 1;
                        return callback(null, yourStatus);
                    }
                }
            });
        },
        getImages: function (callback) {
            if (yourStatus == 2 || foundGroup.permission == 3) {
                var lstStatus = [];
                async.series({
                    getStatus: function (callback) {
                        status.getByGroup(data, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                lstStatus = JSON.parse(JSON.stringify(results));

                                // console.log(foundStatus);
                                // async.eachSeries(foundStatus, function (status, cbStatus) {
                                //     lstStatus.push(status);
                                //     cbStatus(null);
                                // }, function (error) {
                                //     return callback(null, results);
                                // });
                                return callback(null, results);
                            }
                        });
                    },
                    filterImages: function (callback) {
                        status.filterImages(lstStatus, function (error, results) {
                            if (error) {
                                return callback(null, null);
                            } else {
                                return callback(null, results);
                            }
                        });
                    }
                }, function (error, results) {
                    var foundImages = JSON.parse(JSON.stringify(results.filterImages));
                    return callback(null, foundImages);
                });
            } else {
                return callback(null, "Close");
            }
        }
    }, function (error, result) {
        if (error == -1) {
            if (typeof callback === 'function') return callback(-4, null);
        } else if (error) {
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.checkOwner = checkOwner;
function checkOwner(id_group, id_user, callback) {
    var query = Group.find({
        _id: id_group,
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
}
