/**
 * Created by Brucelee Thanh on 29/10/2016.
 */
var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: false,
    },
    last_name: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    phone_number: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: Number, // 1 : male , 2 : female, 3: other
        required: false,
        default: 0
    },
    birthday: {
        type: Date,
        required: false
    },
    address: {
        type: String,
        required: false,
    },
    religion: {
        type: String,
        required: false,
    },
    intro: {
        type: String,
        required: false,
    },
    id_facebook: {
        type: String,
        required: false,
    },
    avatar: {
        type: String,
        required: false,
    },
    avatar_actual: {
        type: String,
        required: false,
    },
    cover: {
        type: String,
        required: false,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now()
    },
    latest_active: {
        type: Date,
        required: false,
        default: Date.now()
    },
    fcm_token:{
        type:String,
        required:false,
    }
});
module.exports = mongoose.model('User', userSchema);