/**
 * Created by Brucelee Thanh on 03/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var memberGroupSchema = mongoose.Schema({
    id_group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    id_member: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default:Date.now()
    },
    permission: { // 1: Creator, 2: Admin (except Creator), 3: Member
        type: Number,
        required: false
    }
});

module.exports = mongoose.model('Member_Group', memberGroupSchema);