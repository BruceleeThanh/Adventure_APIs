/**
 * Created by Brucelee Thanh on 01/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var friendRequestSchema = mongoose.Schema({
    sender:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    recipient:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    created_at:{
        type:Date,
        required:false
    }
});

module.exports = mongoose.model('Friend_Request', friendRequestSchema);