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
        required: false,
        default: 0
    },
    notify_user_two: {
        type: Number,
        required: false,
        default: 0
    },
    created_at: {
        type: Date,
        required: false,
        default: new Date()
    }
});

module.exports = mongoose.model('Conversation', conversationSchema);