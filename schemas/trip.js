/**
 * Created by Brucelee Thanh on 03/11/2016.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tripSchema = mongoose.Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    id_group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: false,
        default: null
    },
    name: {
        type: String,
        required: false,
        default: null
    },
    description: {
        type: String,
        required: false,
        default: null
    },
    start_position:{
        type: String,
        required: false,
        default: null
    },
    start_at: {
        type: Date,
        required: false,
        default: null
    },
    end_at: {
        type: Date,
        required: false,
        
        default: null
    },
    destination_summary: {
        type: String,
        required: false,
        default: null
    },
    expense: {
        type: String,
        required: false,
        default: null
    },
    amount_people: {
        type: Number,
        required: false,
        default: 1 // when just created
    },
    vehicles: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    routes: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    images: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    prepare: {
        type: String,
        required: false,
        default: null
    },
    note: {
        type: String,
        required: false,
        default: null
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now()
    },
    amount_member:{
        type: Number,
        required: false,
        default: 1 // when just created
    },
    amount_interested:{
        type: Number,
        required: false,
        default: 0
    },
    amount_rating:{
        type: Number,
        required: false,
        default: 0
    },
    rating:{
        type: Number,
        required: false,
        default: 0
    },
    permission: {
        type: Number,
        required: false,
        default: null
    },
    type: {
        type: Number,
        required: false,
        default: null
    }
});

module.exports = mongoose.model('Trip', tripSchema);