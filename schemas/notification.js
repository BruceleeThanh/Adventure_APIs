/**
 * Created by Brucelee Thanh on 19/12/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_avatar:{
        type:String,
        required:false,
        default:null
    },
    recipient: { // id_user
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        default: null
    },
    object: { // id_status, id_trip
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        required: true
    },
    type: {
        type: Number,
        required: true
    },
    viewed: {
        type: Number,
        required: true,
        default: 0
    },
    clicked: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('Notification', notificationSchema);