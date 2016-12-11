var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Ride', new Schema({
    rideId: String,
    location: String,
    passengerId: String,
    driverId: String,
    orderTime: Date,
    watingTime: Date,
    startingDate: Date,
    pending: Boolean,
    taken: Boolean,
    done: Boolean,
    canceled: Boolean
}));
