/**
 * Created by Brucelee Thanh on 02/12/2016.
 */
var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Status = require(path.join(__dirname, '../', 'schemas/status.js'));
var like_status = require(path.join(__dirname, '../', 'cores/like_status.js'));
var comment_status = require(path.join(__dirname, '../', 'cores/comment_status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));
var trip = require(path.join(__dirname, '../', 'cores/trip.js'));

exports.getTimeLine = function (data, callback) { // data : {id_user, relation, page, per_page}
    async.parallel({
        getStatus: function (callback) {
            status.getByUser(data, function (error, results) {
                if (error) {
                    return callback(null, null);
                } else {
                    return callback(null, results);
                }
            });
        },
        getTrips: function (callback) {
            trip.getByUser(data, function (error, results) {
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
        if (foundPost.length === 0) {
            return callback(null, null);
        } else {
            async.sortBy(foundPost, function (obj, callback) {
                callback(error, new Date(obj.created_at).getTime() * -1);
            }, function (error, sorted) {
                foundPost = sorted;
                return callback(null, foundPost);
            });
        }
    });
};

exports.getNewsFeed = function (data, callback) {
    var lstStatus = null;
    async.series({
        getStatus: function (callback) {
            var query = Status.find({
                $or: [{
                    $and: [
                        {owner: {$in: data.friends}},
                        {permission: {$in: [2, 3]}}
                    ],
                    type: 1
                },{
                    id_group: {$in: data.groups},
                    type: 3
                }]
            });
            var limit = 10;
            var offset = 0;
            if (data.page !== undefined && data.per_page !== undefined) {
                limit = data.per_page;
                offset = (data.page - 1) * data.per_page;
                query.skip(offset).limit(limit);
            }
            query.select('_id owner id_group content images amount_like amount_comment type permission created_at');
            query.populate('owner', '_id first_name last_name avatar');
            query.populate('id_group', '_id name');
            query.sort({created_at: -1});
            query.exec(function (error, results) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else if (results.length <= 0) {
                    if (typeof callback === 'function') return callback(-1, null);
                } else {
                    if (typeof callback === 'function') {
                        lstStatus = JSON.parse(JSON.stringify(results));
                        return callback(null, null);
                    }
                }
            });
        },
        checkInteract: function (callback) {
            var newsFeed = [];
            async.eachSeries(lstStatus, function (item, callback) {
                async.parallel({
                    checkLike: function (callback) {
                        like_status.checkLikeStatusExits(item._id, data.id_user, function (error, result) {
                            if (error) {
                                item.is_like = 0;
                                return callback(null, null);
                            } else {
                                item.is_like = 1;
                                return callback(null, null);
                            }
                        });
                    },
                    checkComment: function (callback) {
                        comment_status.checkUserAlreadyCommentOnStatus(item._id, data.id_user, function (error, result) {
                            if (error) {
                                item.is_comment = 0;
                                return callback(null, null);
                            } else {
                                item.is_comment = 1;
                                return callback(null, null);
                            }
                        });
                    }
                }, function (error, result) {
                    newsFeed.push(item);
                    return callback(null);
                });
            }, function (error) {
                return callback(null, newsFeed);
            })
        }
    }, function (error, results) {
        if (error === -1) {
            return callback(-4, null);
        } else if (error) {
            return callback(error, null);
        } else {
            return callback(null, results.checkInteract);
        }

    });

};