var mongoose = require('mongoose');
var GeoJSON = require('mongoose-geojson-schema');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Driver', new Schema({
    driverId: ObjectId,
    phoneNumber: String,
    loc: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2d'      // create the geospatial index
    }
    startDate: Date,
    active: Boolean,
    ridesCount: Number,
    imageUrl: String,
    blocked: Boolean
}));
