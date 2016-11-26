/**
 * Created by Brucelee Thanh on 17/11/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var routesSchema = mongoose.Schema({
    start_at:{
        type:Date,
        required:false,
        default:null
    },
    end_at:{
        type:Date,
        required:false,
        default:null
    },
    title:{
        type:String,
        required:false,
        default:null
    },
    content:{
        type:String,
        required:false,
        default:null
    }
});

module.exports = mongoose.model('Routes', routesSchema);