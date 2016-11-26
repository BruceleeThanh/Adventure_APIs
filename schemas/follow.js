/**
 * Created by Brucelee Thanh on 01/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var followSchema = new Schema({
    following:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    follower:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    created_at:{
        type:Date,
        required:false,
        default:Date.now
    }
});

module.exports = mongoose.model('Follow', followSchema);