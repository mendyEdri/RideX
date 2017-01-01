
var rides = [];

module.exports = {

  api: function() {
      var express     = require('express');
      var app         = express();
      var bodyParser  = require('body-parser');
      var morgan      = require('morgan');
      var mongoose    = require('mongoose');
      var server    = require('./server.js');
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

      app.get('/test', function(req, res) {
        res.json({ success: true });
      });

      function saveRide(userId, locationString, callback) {
        Ride.findOne({ userId: userId }, function(err, ride) {
          if (err) {
            callback({ success: false, message: 'User Aleardy has an active ride' });
            return;
          }
          if (!userId) {
            callback({success: false, message: 'User Phone number must be provided'});
            return;
          }
          if (!ride) {
            googleMapsClient.geocode({
              address: locationString,
            }, function(err, response) {
              if (err) {
                console.log('error: ' + err);
              }

              var newRide = new Ride({
                userId: userId,
                orderTime: new Date(),
                locationString: locationString,
                geo: [response.json.results[0].geometry.location.lat, response.json.results[0].geometry.location.lng],
                pending: true,
              });
              newRide.save(function(err) {
                if (err) {
                  callback({ success: false, message: 'Error saving ride. please try again' })
                  return;
                };
                console.log('Ride saved successfully');
                callback({
                  success: true,
                  message: 'Ride has been added',
                  rideId: newRide._id,
                  ride: newRide
                });
                return;
              });
            });
          } else if (ride) {
            //res.json({ success: false, message: 'cannot override and existing ride' });
            callback({ success: false, message: 'cannot override and existing ride' });
            return;
          }
        })
      }

      app.post('/getRideState', function(req, res) {
        if (!req.body.rideId || !req.body.driverId) {
          res.json({ success: false, message: 'ride id and driver id are mandatory'});
          return;
        }
        console.log(rides);
        for (var i = 0; i < rides.length; i++) {
          if (req.body.rideId == rides[i]._id) {
            res.json({ success: true, message: rides[i]});
            return;
          }
          if (i+1 == rides.length) {
            res.json({ success: false, message: 'can not find ride with this id' });
          }
        }
      });

      app.post('/updateRideState', function(req, res) {
        console.log(req.body);
        if (!req.body.rideId || !req.body.driverId) {
          res.json({ success: false, message: 'ride id and driver id are mandatory'});
          return;
        }
        for (var i = 0; i < rides.length; i++) {
          if (req.body.rideId != rides[i]._id) {
            continue;
          }

          if (rides[i].taken === true) {
            res.json({ success: false, message: 'ride has already been taken'});
            return;
          }

          if (req.body.accepted === false) {
            var temp = rides[i].ignoredDriversId;
            temp.push(req.body.driverId);

            var obj = rides[i].toObject();
            obj.ignoredDriversId = temp;
            rides[i] = obj;
            res.json({ success: true, message: rides[i] });
            return;
          } else if (req.body.accepted === true) {
            // saves to DB
            Ride.update({ _id: req.body.rideId }, {$set: {taken: true, driverId: req.body.driverId}}, function(err) {
              if (!err) {
                res.json({ success: true, message: rides[i]});
                return;
              }
              res.json({ success: false, message: 'please try again'});
            });
            return;
          }

          res.json({ success: true, message: rides[i]});
          return;
        }
        res.json({ success: false, message: 'can not find ride with this id' });
      });

      app.post('/requestRide', function(req, res) {
        // saveRide(req.body.userId, req.body.locationString, function(data) {
        //   console.log(data);
        //   res.json(data);
        // });

        //TODO add ride and hold it till driver answer

        googleMapsClient.geocode({
          address: req.body.locationString,
        }, function(err, response) {
          if (err) {
            console.log('error: ' + err);
          }

          var newRide = new Ride({
            userId: req.body.userId,
            orderTime: new Date(),
            locationString: req.body.locationString,
            geo: [response.json.results[0].geometry.location.lat, response.json.results[0].geometry.location.lng],
            pending: true,
            taken: false,
            driverId: ''
          });
          rides.push(newRide);
          if (newRide) {
            res.json({ success: true, ride: newRide });
            return;
          }
          res.json({ success: false, message: 'error, please try again'});
        });
      });

      app.post('/sendRideToDriver', function(req, res) {
        console.log(req.body);
        googleMapsClient.distanceMatrix({
          origins: req.body.driverGeo[0] + ',' + req.body.driverGeo[1],
          destinations: req.body.geo[0] + ',' + req.body.geo[1],
          mode: 'driving'
        }, function(err, response) {
          if (err) {
            res.json({ success: false, message: err });
            return;
          }

          if (rides.length == 0) {
            sendPush(req.body.driverId, req.body.locationString, response.json.rows[0].elements[0].duration.text,  response.json.rows[0].elements[0].distance.text, req.body.rideId, function(success) {
              res.json({ success: success });
            });
            return;
          }
          // check if driver already ignored this ride
          for (var i = 0; i < rides.length; i++) {
            if (rides[i].rideId == req.body.rideId && rides[i].ignoredDriversId.indexOf(req.body.driverId) > -1) {
                res.json({ success: false, message: 'driver already passed this ride' });
                return;
            }
            if (i == rides.length) {
              sendPush(req.body.driverId, req.body.locationString, response.json.rows[0].elements[0].duration.text,  response.json.rows[0].elements[0].distance.text, req.body.rideId, function(success) {
                res.json({ success: success });
              });
            }
          }
        });
      });

      function sendPush(driverId, stringLocation, duration, distance, rideId, callback) {
        if (driverId.indexOf('+') > -1) {
          driverId = driverId.replace('+', '');
        }
        var message = {
            to: '/topics/' + driverId,
            "notification": {
              "title": "New Ride!",
              "body": stringLocation,
              "click_action": "fcm.ACTION.HELLO",
              "sound": "default"
          },
          "data": {
            "rideId": rideId,
            "location": stringLocation,
            "duration": duration,
            "distance": distance
          }
        };

        fcm.send(message, function(err, response){
          if (err) {
              console.log("Something has gone wrong!");
              callback(false);
          } else {
              console.log("Successfully sent with response: ", response);
              callback(true);
          }
        });
      }

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
  },

  rides: function() {
    return rides;
  },
}
