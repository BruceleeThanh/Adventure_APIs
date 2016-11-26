/**
 * Created by Brucelee Thanh on 01/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var friendSchema = new Schema({
    user_one: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user_two: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        required: true,
        default:Date.now()
    }
});

module.exports = mongoose.model('Friend', friendSchema);
