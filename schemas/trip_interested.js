/**
 * Created by Brucelee Thanh on 22/01/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tripInterestedSchema = Schema({
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
    }
});
module.exports = mongoose.model('Trip_Interested', tripInterestedSchema);