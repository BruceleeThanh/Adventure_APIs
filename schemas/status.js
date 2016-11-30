var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = mongoose.Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    type: {
        type: String, // type 1: Normal Status , 2: Status in Travel_Discuss , 3: Status in Group
        default: 1
    },
    created_at: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('Status', schema);


