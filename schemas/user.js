/**
 * Created by Brucelee Thanh on 29/10/2016.
 */
var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: false,
        default: null
    },
    last_name: {
        type: String,
        required: false,
        default: null
    },
    email: {
        type: String,
        required: false,
        default: null,
        unique: true
    },
    phone_number:{
        type:String,
        required:false,
        default:null
    },
    password:{
        type:String,
        required:true,
        default:null
    },
    gender:{
        type: Number, // 0 : male , 1 : female
        required: false,
        default: 0
    },
    birthday:{
        type:Date,
        required:false
    },
    address:{
        type:String,
        required:false,
        default:null
    },
    religion:{
        type:String,
        required: false,
        default: null
    },
    intro:{
        type:String,
        required: false,
        default: null
    },
    id_facebook:{
        type:String,
        required:false,
        default:null
    },
    profile_photo:{
        type:String,
        required:false,
        default:null
    },
    cover_photo:{
        type:String,
        required:false,
        default:null
    },
    created_at:{
        type:String,
        required:false,
        default:Date.now
    },
    latest_active:{
        type:String,
        required:false,
        default:null
    }
});
module.exports = mongoose.model('User', userSchema);