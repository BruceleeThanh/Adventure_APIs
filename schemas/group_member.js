/**
 * Created by Brucelee Thanh on 03/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var groupMemberSchema = Schema({
    id_group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    permission: { // 1: Creator, 2: Admin (except Creator), 3: Member / 0: Pending
        type: Number,
        required: false,
        default: 0
    },
    status: { // 1: Request member, 2: Invite member, 3: Member, 4: Blocked member
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default:Date.now()
    }
});

module.exports = mongoose.model('Group_Member', groupMemberSchema);