/**
 * Created by Brucelee Thanh on 03/11/2016.
 */

var mongoose = required('mongoose');
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
        required: true
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
    period: {
        type: {
            start_at: Date,
            end_at: Date
        },
        required: false
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
    vehicles:{
        type:String,
        required:false,
        default:null
    },
    routes:{
        type:Schema.Types.Mixed,
        required:false,
        default:null
    },
    prepare:{
        type:String,
        required:false,
        default:null
    },
    note:{
        type:String,
        required:false,
        default:null
    },
    created_at:{
        type:Date,
        required:false,
        default:Date.now()
    },
    rating:{
        type:Schema.Types.Mixed,
        required:false,
        default:null
    },
    permission:{
        type:Number,
        required:false,
        default:null
    },
    type:{
        type:Number,
        required:false,
        default:null
    }
});

var routesSchema = {
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
};

module.exports = mongoose.model('Trip', tripSchema);