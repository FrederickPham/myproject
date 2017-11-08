
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    email = require('../routes/libs/email'),
    utils = require('../routes/libs/utils'),
    _ = require('underscore');
mongoose.Promise = require('bluebird');



var Wallet = Schema({
    userId: {
        type: ObjectId,
        required: true,
        ref: 'User'
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    status: {
        type: String,
        required: true,
        lowercase: true,
        default: 'new',
        enum: ['new', 'acitve']
    },
    balance: {
        type: [
            {
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                verify: { type: Boolean, require: true, default: false },
                _id: false
            }
        ],
        required: true
    },
    deposit: {
        type: [
            {
                name: { type: String, lowercase: true, required: true },
                amount: { type: Number },
                method: { type: String },
                status: { type: String, enum: ['new', 'done'], default: 'new' },
                time: { type: Number },
                _id: false
            }
        ]
    },
    withdraw: {
        type: [
            {
                name: { type: String, lowercase: true, required: true },
                amount: { type: Number },
                method: { type: String },
                status: { type: String, enum: ['new', 'done'], default: 'new' },
                _id: false
            }
        ]
    },

    createdAt: {
        type: Date,
        default: new Date()
    }
});

Wallet.set('versionKey', false);







module.exports = Wallet;
// the above is necessary as you might have embedded schemas which you don't export

