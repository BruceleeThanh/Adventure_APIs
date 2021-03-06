/**
 * Created by Brucelee Thanh on 08/11/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var placeSchema = mongoose.Schema({
    id_trip: {
        type: Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    order: {
        type: Number,
        required: false,
        default: 0
    },
    title: {
        type: String,
        required: false,
        default: null
    },
    address:{
        type: String,
        required: false,
        default: null
    },
    latitude: {
        type: String,
        required: true,
        default: 0
    },
    longitude: {
        type: String,
        required: true,
        default: 0
    },
    content: {
        type: String,
        required: false,
        default: null
    },
    created_at: {
        type: Date,
        required: false,
        default: null
    },
    type: { //1. Start Location; 2. Destinations; 3. Normal
        type: Number,
        required: true,
        default: 3
    },
    status: { //1: Just created; 2: Waiting; 3: Passed
        type: Number,
        required: false,
        default: 1
    }
});
module.exports = mongoose.model('Place', placeSchema);