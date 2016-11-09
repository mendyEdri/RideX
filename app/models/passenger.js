var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Passenger', new Schema({
    phoneNumber: String,
    lastCoordinate: Array,
    lastLocation: String,
    ridesCount: Number,
    lastRideDate: Date,
    blocked: Boolean,
    joinDate: Date
}));
