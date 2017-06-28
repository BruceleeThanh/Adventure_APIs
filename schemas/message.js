/**
 * Created by Brucelee Thanh on 29/06/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = Schema({
    id_conversation:{
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('Message', messageSchema);