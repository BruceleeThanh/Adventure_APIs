var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = mongoose.Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: false
    },
    id_group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: false
    },
    content: {
        type: String,
        required: false
    },
    images: {
        type: [{
            url: String,
            description: String
        }], // id , url , description
        required: false
    },
    amount_like: {
        type: Number,
        required: false,
        default: 0
    },
    amount_comment: {
        type: Number,
        required: false,
        default: 0
    },
    created_at: {
        type: Date,
        required: false
    },
    permission: {
        type: Number, //permission 1: Only me, 2: Friend, 3: Public (permission use to type == 1)
        required: false,
    },
    type: {
        type: Number, // type 1: Normal Status , 2: Status in Travel_Discuss , 3: Status in Group
        required: true,
        default: 1
    }
});

module.exports = mongoose.model('Status', schema);


