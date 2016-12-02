/**
 * Created by Brucelee Thanh on 03/11/2016.
 */

var mongoose = required('mongoose');
var Schema = mongoose.Schema;

var requestGroup = mongoose.Schema({
    id_group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default:Date.now()
    }
});

module.exports = mongoose.model('Request_Group', requestGroup);