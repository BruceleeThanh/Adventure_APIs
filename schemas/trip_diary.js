/**
 * Created by Brucelee Thanh on 04/03/2017.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tripDiarySchema = Schema({
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
    title: {
        type: String,
        required: true,
        default: null
    },
    content: {
        type: String,
        required: false,
        default: null
    },
    images: {
        type: [{
            url: String,
            description: String
        }], // id , url , description
        required: false
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now()
    },
    detail_diary: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    permission: { // 1: Only me, 2: Member in trip, 3: Public
        type: Number,
        required: false,
        default: null
    },
    type: { // 1: Diary in trip, 2: Diary on timelines, 3: Diary in group
        type: Number,
        required: false,
        default: null
    }
});

module.exports = mongoose.model('Trip_Diary', tripDiarySchema);