/**
 * Created by Brucelee Thanh on 01/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var groupSchema = ({
    name: {
        type: String,
        required:false,
        default:null
    },
    description:{
        type:String,
        required:false,
        default:null
    },
    cover_photo:{
        type:String,
        required:false,
        default:null
    },
    permission:{ // 1: Open group, 2: Close group, 3: Secret group
        type: Number,
        required:false,
        default: 1
    },
    created_at:{
        type:Date,
        required:false,
        default:Date.now()
    }
});

module.exports = mongoose.model('Group', groupSchema);