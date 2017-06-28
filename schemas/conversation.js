/**
 * Created by Brucelee Thanh on 29/06/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var conversationSchema = Schema({
    user_one: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user_two: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notify_user_one: {
        type: Number,
        required: false
    },
    notify_user_two: {
        type: Number,
        required: false
    },
    created_at: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('Conversation', conversationSchema);