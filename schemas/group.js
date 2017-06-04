/**
 * Created by Brucelee Thanh on 01/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var groupSchema = Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required:true
    },
    description:{
        type:String,
        required:false
    },
    cover:{
        type:String,
        required:false
    },
    total_member:{
        type: Number,
        required:false,
        default: 1
    },
    permission:{ // 1: Secret group, 2: Close group, 3: Open group
        type: Number,
        required:false,
        default: 3
    },
    created_at:{
        type:Date,
        required:false,
        default:Date.now()
    }
});

module.exports = mongoose.model('Group', groupSchema);