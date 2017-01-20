/**
 * Created by Brucelee Thanh on 19/01/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tripMemberSchema = Schema({
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default: null
    },
    status: { //1. Request member; 2. Invite member; 3. Member
        type: Number,
        required: true,
        default: null
    }
});
module.exports = mongoose.model('Trip_Member', tripMemberSchema);