/**
 * Created by Brucelee Thanh on 02/12/2016.
 */

var async = require('async');
var path = require('path');
var CommentStatus = require(path.join(__dirname, '../', 'schemas/comment_status.js'));
var status = require(path.join(__dirname, '../', 'cores/status.js'));

exports.create = function (data, callback) {
    var statusExits = null;
    async.series({
        checkStatusExits: function (callback) {
            status.checkStatusExits(data.id_status, function (error, result) {
                if (error === -1) {
                    return callback(-1, null);
                } else if (error) {
                    return callback(error, null);
                } else {
                    statusExits = result;
                    return callback(null, null);
                }
            });
        },
        createCommentStatus:function (callback) {
            var currentDate = new Date();
            data.created_at = currentDate;
            var creatingCommentStatus = new CommentStatus(data);
            creatingCommentStatus.save(function (error, result) {
                if (error) {
                    require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
                    if (typeof callback === 'function') return callback(-2, null);
                } else {
                    if (typeof callback === 'function') {
                        return callback(null, result);
                    }
                }
            });
        },
        increaseCommentStatus:function (callback) {
            var increase = {
                amount_comment: statusExits.amount_comment + 1
            };
            status.updateStatus(statusExits, increase, function (error, status) {
                if (error) {
                    return callback(error, null);
                } else {
                    return callback(null, null);
                }
            });
        }
    }, function (error, result) {
        if(error === -1){
            return callback(-4, null);
        }else if(error){
            return callback(error, null);
        }else{
            return callback(null, result.createCommentStatus);
        }
    });

};

exports.getAll = function (data, callback) { // data : Obj(id_status, page, per_page)
    var query = CommentStatus.find({
        id_status:data.id_status
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id owner id_status content created_at');
    query.populate('owner', '_id first_name last_name avatar');
    query.exec(function (error, results) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else if (results.length < 0) {
            if (typeof callback === 'function') return callback(-1, null);
        } else {
            if (typeof callback === 'function') {
                return callback(null, results);
            }
        }
    });
};

exports.checkCommentStatusExits = function (id_status, owner, callback) {
    var query = CommentStatus.findOne({
        id_status: id_status,
        owner: owner
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
    });
}
