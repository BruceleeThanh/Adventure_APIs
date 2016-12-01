/**
 * Created by Brucelee Thanh on 30/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commentStatusSchema = Schema({
    id_status:{
        type:Schema.Types.ObjectId,
        ref:'Status',
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    content:{
        type:String,
        required:false
    },
    created_at:{
        type:Date,
        required:false
    }
});

module.exports = mongoose.model('CommentStatus', commentStatusSchema);