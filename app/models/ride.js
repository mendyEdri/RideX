var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Ride', new Schema({
    rideId: Objectid,
    location: String,
    passengerId: String,
    driverId: String,
    orderTime: Date,
    watingTime: Date
}));
