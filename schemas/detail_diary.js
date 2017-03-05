/**
 * Created by Brucelee Thanh on 04/03/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var detailDiarySchema = Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    title: {
        type: String,
        required: false,
        default: null
    },
    content: {
        type: String,
        required: false,
        default: null
    }
});

module.exports = mongoose.model('Detail_Diary', detailDiarySchema);