/**
 * Created by Brucelee Thanh on 29/06/2017.
 */

var async = require('async');
var path = require('path');
var config = require(path.join(__dirname, '../', 'config.json'));
var Message = require(path.join(__dirname, '../', 'schemas/message.js'));

exports.create = function (data, callback) {
    data.created_at = new Date();
    var creatingMessage = new Message(data);
    creatingMessage.save(function (error, result) {
        if (error) {
            require(path.join(__dirname, '../', 'ultis/logger.js'))().log('error', JSON.stringify(error));
            if (typeof callback === 'function') return callback(-2, null);
        } else {
            if (typeof callback === 'function') return callback(null, result);
        }
    });
};

exports.browse = browse;
function browse(data, callback) { // data : {id_conversation, page, per_page}
    var query = Message.find({
        id_conversation : data.id_conversation
    });
    var limit = 10;
    var offset = 0;
    if (data.page !== undefined && data.per_page !== undefined) {
        limit = data.per_page;
        offset = (data.page - 1) * data.per_page;
        query.limit(limit).offset(offset);
    }
    query.select('_id owner content created_at');
    query.sort({created_at: -1});
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
}