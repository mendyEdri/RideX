module.exports = (function() {
    'use strict';
    var express     = require('express');
    //var router = require('express').Router();
    var bodyParser  = require('body-parser');
    var app         = express();
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
    var index = 0;

    var accountSid = 'AC2cbcc9d2a2a26af287dd08f68131f4ec';
    var authToken = 'd6bdb9ca36ab74d839fd59c6c5be7617';

    //require the Twilio module and create a REST client
    var client = require('twilio')(accountSid, authToken);

    var googleMapsClient = require('@google/maps').createClient({
      key: 'AIzaSyDMV69WkmHWjQM9KZ7Ugo293B0mZ_4UrhA'
    });

    app.post('/updateLocation', function(req, res) {
      console.log(req.body);
      Driver.findOne({ phoneNumber: req.body.driverId } , function(err, driver) {
        if (err) {
          res.json({ message: err});
          return;
        }
        if (driver) {
          var coords = [];
          coords[0] = req.body.coordinates[0];
          coords[1] = req.body.coordinates[1];

          driver.geo = coords;
          driver.save(function (err) {
            if (err) {
              res.json({ success: false, message: err });
              return;
            }
            res.json({ success: true, message: driver });
          });
        } else {
          res.json({ success: false, message: 'Driver not found' });
        }
      });
    });

    app.post('/order', function(req, res) {
      googleMapsClient.geocode({
        address: req.body.userLocation[0] + ',' + req.body.userLocation[1],
      }, function(err, response) {
        if (err) {
          console.log('error: ' + err);
        }
        //res.json({ error: err, message: response.json.results[0].formatted_address});

        var newRide = new Ride({
          rideId: this.generateRideId(),
          location: response.json.results[0].formatted_address,
          passengerId: req.body.passengerId,
          driverId: req.body.driverId,
          orderTime: new Date(),
          canceled: false
        });
        newRide.save(function(err) {
          if (err) {
            res.json({ error: err });
            return;
          };

          if (req.body.driverId.indexOf('+') > -1) {
            req.body.driverId = req.body.driverId.replace('+', '');
          }
          console.log(req.body.driverId);
          var message = {
              to: '/topics/' + req.body.driverId,
              "notification": {
                "title": "New Ride!",
                "body": response.json.results[0].formatted_address,
                "click_action": "fcm.ACTION.HELLO",
                "sound": "default"
            },
            "data": {
              "body": response.json.results[0].formatted_address,
            }
          };

          fcm.send(message, function(err, response){
            if (err) {
                console.log("Something has gone wrong!");
                res.json({ message: err });
            } else {
                console.log("Successfully sent with response: ", response);
                res.json({ message: response });
            }
          });
        });
      });
    });

    app.post('/findFreeDriver', function(req, res) {
      var limit = req.body.limit || 10;
      // get the max distance or set it to 8 kilometers
      var maxDistance = req.body.distance || 8;

      // we need to convert the distance to radians
      // the raduis of Earth is approximately 6371 kilometers
      maxDistance /= 6371;

      // get coordinates [ <longitude> , <latitude> ]
      var coords = [];
      coords[0] = req.body.location[0];
      coords[1] = req.body.location[1];

      var query = Driver.find({'geo': {
          $near: [
            coords[0],
            coords[1]
          ],
          $maxDistance: 3
        },
      }).where({ "freeForRide" : true }).where({ "blocked": false });
      query.exec(function (err, driver) {
        if (err) {
          console.log(err);
          throw err;
        }
        if (!driver) {
          res.json({ success: false, message: 'driver not found' });
        } else {
          var temp = [];
          for (var i = 0; i < driver.length; i++) {
            temp.push(driver[i]);
          }
          res.json({ success: true, message: temp});
       }
      });
    });

    app.post('/getDriverById', function(req, res) {
      if (!req.body.driverId) {
        req.json({ success: false, message: 'driverId must be provided' });
        return;
      }
      Driver.findOne({ phoneNumber: req.body.driverId }, function(err, driver) {
        if (err) {
          res.json({ success: false, message: "internal server error"});
        }
        if (!driver) {
          res.json({ success: false, message: "Driver not found" });
        }
        res.json({ success: true, message: driver });
      });
    });

    app.post('/updateState', function(req, res) {
      if (!req.body.driverId) {
        res.json({ success: false, message: "driver id is mandatory" });
      }
      Driver.findOneAndUpdate({ phoneNumber: req.body.driverId }, { freeForRide: req.body.freeForRide }, function(err, driver) {
        if (err) {
          res.json({ success: false, message: "internal server error"});
        }
        if (!driver) {
          res.json({ success: false, message: "Driver not found" });
        }
        res.json({ success: true, message: driver });
      });
    });

    app.post('/register', function(req, res) {
      console.log('phone: ' + req.body.phoneNumber);
      Driver.findOne({ phoneNumber: req.body.phoneNumber }, function(err, driver) {
        if (err) { throw err; }
        if (!req.body.phoneNumber) {
          res.json({success: false, message: 'Driver Phone number must be provided'});
          return;
        }
        if (!driver) {
          var newDriver = new Driver({
            phoneNumber: req.body.phoneNumber,
            startDate: new Date(),
            active: false,
            ridesCount: 0,
            imageUrl: '',
            freeForRide: false,
            blocked: false,
            geo: [0, 0]
          });
          newDriver.save(function(err) {
            if (err) throw err;
            console.log('User saved successfully');
            res.json({
              success: true,
              message: 'Welcome New Driver!',
              userId: newDriver._id,
            });
          });
        } else if (driver) {
          res.json({success: false, message: 'Driver already exist'});
        }
      });
    });

    app.post('/findall', function(req, res) {
      var query = Driver.find();
      query.exec(function (err, driver) {
        if (err) {
          console.log(err);
          throw err;
        }
        if (!driver) {
          res.json({ success: false, message: 'driver not found' });
        } else {
          console.log('Cant save: Found Driver:' + driver);
          res.json({ success: true, message: driver});
       }
      });
    });

    return app;
})();
