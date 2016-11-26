/**
 * Created by Brucelee Thanh on 08/11/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var placeSchema = {
    id_trip:{
        type:Schema.Types.ObjectId,
        ref:'Trip',
        required:true
    },
    order:{
        type:Number,
        required:false,
        default:0
    },
    title:{
        type:String,
        required:false,
        default:null
    },
    latitude:{
        type:String,
        required:false,
        default:null
    },
    longitude:{
        type:String,
        required:false,
        default:null
    },
    content:{
        type:String,
        required:false,
        default:null
    },
    type:{ //1. Start Location; 2. Destinations; 3. Makers
        type:Number,
        required:false,
        default:3
    },
    status:{ //1: Waiting...; 2: Arrived; 3: Passed
        type:Number,
        required:false,
        default:1
    }
};
module.exports = mongoose.model('Place', placeSchema);