var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Ride', new Schema({
    rideId: String,
    locationString: String,
    geo: {
      type: [Number],
      index: '2dsphere'
    },
    passengerId: String,
    driverId: String,
    orderTime: Date,
    watingTime: Date,
    pending: Boolean,
    taken: Boolean,
    done: Boolean,
    ignoredDriversId: [],
    canceled: Boolean
}));
