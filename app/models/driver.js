var mongoose = require('mongoose');
var GeoJSON = require('mongoose-geojson-schema');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Driver', new Schema({
    phoneNumber: String,
    geo: {
      type: [Number],
      index: '2dsphere'
    },
    startDate: Date,
    active: Boolean,
    freeForRide: Boolean,
    ridesCount: Number,
    imageUrl: String,
    blocked: Boolean
}));
