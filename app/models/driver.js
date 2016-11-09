var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Driver', new Schema({
    phoneNumber: String,
    startDate: Date,
    active: Boolean,
    ridesCount: Number,
    imageUrl: String,
    blocked: Boolean
}));
