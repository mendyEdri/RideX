module.exports = (function() {
    'use strict';
    var express     = require('express');
    var app = require('express').Router();
    var bodyParser  = require('body-parser');
    var morgan      = require('morgan');
    var mongoose    = require('mongoose');
    var FCM = require('fcm-push');
    var serverKey = 'AAAAacxj0vM:APA91bGj74iPbIyslE_2lJF6xSLSBap70orqYGNpwSWsBiu3Hn0cwLi2WYv8Ypk8oZEdd9Te54yKG8FVxUM0PvCfwHQ8siMU2hwCgtJX_tBObb0n9ead8nPrg9gf8wmj6x0lKnZR03-5VPcZioH-DVdqzXOpOPNFwg';
    var fcm = new FCM(serverKey);

    var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
    var config = require('./config'); // get our config file
    var User   = require('./app/models/user'); // get our mongoose model
    var Driver = require('./app/models/driver'); // get our mongoose model
    var Passenger = require('./app/models/passenger'); // get our mongoose model
    var Ride = require('./app/models/ride'); // get our mongoose model
    var DriverApi = require('./driver-api.js');

    var request = require('request');
    var data = require('./dropbox.json');
    var index = 0;

    var accountSid = 'AC2cbcc9d2a2a26af287dd08f68131f4ec';
    var authToken = 'd6bdb9ca36ab74d839fd59c6c5be7617';

    //require the Twilio module and create a REST client
    var client = require('twilio')(accountSid, authToken);

    var googleMapsClient = require('@google/maps').createClient({
      key: 'AIzaSyDMV69WkmHWjQM9KZ7Ugo293B0mZ_4UrhA'
    });

    app.post('/requestRide', function(req, res) {
      Ride.findOne({ userId: req.body.userId }, function(err, ride) {
        if (err) {
          res.json({ success: false, message: 'User Aleardy has an active ride' });
          return;
        }
        if (!req.body.userId) {
          res.json({success: false, message: 'User Phone number must be provided'});
          return;
        }
        if (!ride) {
          var newRide = new Ride({
            userId: req.body.userId,
            orderTime: new Date(),
            locationString: req.body.locationString,
            pending: true,
          });
          newRide.save(function(err) {
            if (err) {
              res.json({ success: false, message: 'Error saving ride. please try again' });
              return;
            };
            console.log('Ride saved successfully');
            res.json({
              success: true,
              message: 'Ride has been added',
              rideId: newRide._id,
            });
          });
        } else if (ride) {
          res.json({ success: false, message: 'cannot override and existing ride' });
        }
      })
    });

    app.post('/getAllPendingRides', function(req, res) {
      var query = Ride.find().where({ 'pending': true });
      query.exec(function (err, ride) {
        if (err) {
          console.log(err);
          res.json({ success: false, error: err});
        }
        if (!ride) {
          res.json({ success: false, message: 'ride not found' });
        } else {
          res.json({ success: true, message: ride});
       }
      });
    });

    return app;
})();
