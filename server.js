// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var bodyParser  = require('body-parser');
var app         = express();
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Driver = require('./app/models/driver'); // get our mongoose model
var Passenger = require('./app/models/passenger'); // get our mongoose model
var Ride = require('./app/models/ride'); // get our mongoose model

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

var pendingRides = [];
var positives = ['yes', 'yep', 'sure', 'good', 'great', 'positive', 'just do it', '👍', 'alright', 'yes please'];
var negatives = ['no', 'not this time', 'negative', '👎', 'please dont', 'cancel', 'stop'];
var greetings = ['Hey there! what is your address?', 'i didn\'t understand that. What is your address?'];

function PendingRide(passengerId, driverId, rideId, passengerLocation, orderTime, watingTime) {
    this.passengerId = passengerId;
    this.driverId = driverId;
    this.rideId = rideId;
    this.passengerLocation = passengerLocation;
    this.orderTime = orderTime;
    watingTime = watingTime;
}

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 4000; // used to create, sign, and verify tokens
mongoose.connect("mongodb://mendy-db2:1mendymongo@ds161315.mlab.com:61315/mendy-edri-db");
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));
app.use(express.static('public'));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
app.use(allowCrossDomain);


// API ROUTES -------------------
// get an instance of the router for api routes
var apiRoutes = express.Router();
apiRoutes.use(allowCrossDomain);

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
  res.json({ message: 'this is home page' });
});

app.post('/sms/out', function(req, res) {
  console.log('sms/out');
  res.json({message: 'done'})
});

app.post('/location', function(req, res) {
  var address = req.body.address;
  console.log(address);

  if (address.indexOf('ghana') === -1) {
    address = address + ', ghana';
  }

  googleMapsClient.geocode({
    address: address
  }, function(err, response) {
    if (!err) {
      console.log(JSON.stringify(response.json.results));
      if (response.json.results.length > 0) { //&& response.json.results[0].types[0] === 'street_address'
        for (var i = 0; i < response.json.results[0].address_components.length; i++) {
          if (response.json.results[0].address_components[i].types[0] == 'street_number') {
              number = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'route') {
              street = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'locality') {
            city = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'country') {
            country = response.json.results[0].address_components[i].long_name;

            if (response.json.results[0].geometry.location_type === 'APPROXIMATE') {
              res.json({ success: false, message: 'I need the location with street and number'});
              return;
            }
            if (country.length > 0 && country != 'Ghana') {
              console.log(country);
              res.json({ success: false, message: 'Currently MyTaxi not supported in ' + country});
            } else {
              longitude = response.json.results[0].geometry.location.lng;
              latitude = response.json.results[0].geometry.location.lat;
              var formatedAddress = response.json.results[0].formatted_address;
              if (address.indexOf(', ghana') !== -1) {
                  address = address.replace(', ghana', '');
              }
              res.json({ success: true, message: response.json.results[0].formatted_address, coordinate: [latitude, longitude], userMessage: address });
            }
            break;
          }
        }
      } else {
       res.json({ success: false, message: 'You Must provide street number.'});
      }
    } else {
      res.json({ success: false, message: 'Address is not validate. try again', results: response.json.results });
    }
  });
  //res.json({ success: false, message: 'thanks'});
});

app.get('/arrivalTime', function(req, res) {
  if (!latitude || !longitude) {
    res.json({ success: false, message: 'No origin provided' });
  }
  googleMapsClient.distanceMatrix({
    origins: latitude + ',' + longitude,
    destinations: '5.628346,-0.168984',
    mode: 'driving'
  }, function(err, response) {
    if (!err) {
      res.json({ success: true, message: response.json });
      return;
    }
    res.json({ success: false, message: err });
  });
});


function findNear(req) {
  var limit = req.body.limit || 10;
  // get the max distance or set it to 8 kilometers
  var maxDistance = req.body.distance || 8;

  // we need to convert the distance to radians
  // the raduis of Earth is approximately 6371 kilometers
  maxDistance /= 6371;

  // get coordinates [ <longitude> , <latitude> ]
  var coords = [];
  coords[0] = req.body.longitude;
  coords[1] = req.body.latitude;

  // find a location
  Driver.find({
    loc: {
      $near: coords,
      $maxDistance: maxDistance
    }
  }).limit(limit).exec(function(err, drivers) {
    if (err) {
      return res.json(500, err);
    }
    res.json(200, drivers);
  });
}


app.post('/userLocation', function(req, res) {
  console.log(req.body.location);

  Driver.findOneAndUpdate({ phoneNumber: req.body.userId }, { $set: { loc:  [req.body.location.longitude, req.body.location.latitude] }}, function(err, driver) {
    if (err) { throw err; }
    console.log('updated: ' + driver);
  });
});

var geocoding = function(body, callback) {
  var phone = body.phoneNumber;
  var number = '';
  var street = '';
  var city = '';
  var country = ''
  var longitude = '';
  var latitude = '';

  if (body.indexOf('ghana') === -1) {
    body = body + ', ghana';
  }

  googleMapsClient.geocode({
    address: body
  }, function(err, response) {
    if (!err) {
      if (response.json.results.length > 0) { //&& response.json.results[0].types[0] === 'street_address'
        for (var i = 0; i < response.json.results[0].address_components.length; i++) {
          if (response.json.results[0].address_components[i].types[0] == 'street_number') {
              number = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'route') {
              street = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'locality') {
            city = response.json.results[0].address_components[i].long_name;
          } else if (response.json.results[0].address_components[i].types[0] == 'country') {
            country = response.json.results[0].address_components[i].long_name;

            if (response.json.results[0].geometry.location_type === 'APPROXIMATE') {
              callback({ success: false, message: greetings[0]});
              return;
            }

            if (country.length > 0 && country != 'Ghana') {
              //res.json({ success: false, message: 'Currently MyTaxi not supported in ' + country});
              //callback({ success: false, message: 'Sorry, this address is not valid'});
              console.log(country);
              callback({ success: false, message: 'My Taxi is Currently supports only in Ghana.'});
            } else {
              longitude = response.json.results[0].geometry.location.lng;
              latitude = response.json.results[0].geometry.location.lat;
              //res.json({ success: true, message: response.json.results[0].formatted_address, coordinate: [latitude, longitude] });
              var formatedAddress = response.json.results[0].formatted_address;
              googleMapsClient.distanceMatrix({
                origins: latitude + ',' + longitude,
                destinations: '5.628346,-0.168984',
                mode: 'driving'
              }, function(err, response) {
                if (!err) {
                  if (body.indexOf(', ghana') !== -1) {
                      body = body.replace(', ghana', '');
                  }
                  callback({ success: true, geocode: formatedAddress, userMessage: body, message: { distance: response.json.rows[0].elements[0].distance.text, time: response.json.rows[0].elements[0].duration.text } });
                  //res.json({ success: true, message: { distance: response.json.rows[0].elements[0].distance.text, time: response.json.rows[0].elements[0].duration.text } });
                  return;
                }
                //res.json({ success: false, message: 'Sorry..can\'t find taxi near you.' });
                callback({ success: false, message: 'Sorry..can\'t find taxi near you.' });
              });
            }
            break;
          }
        }

      } else {
       //res.json({ success: false, message: 'You Must provide street number.'});
       callback({ success: false, message: greetings[0]});
      }
    } else {
      //res.json({ success: false, message: 'Address is not validate. try again', results: response.json.results });
      callback({ success: false, message: greetings[1], results: response.json.results });
    }
  });
}

app.post('/order', function(req, res) {
  var passengerGlobal = null;
  var senderNumber = '';
  var messageBody = '';
  if (req.body.From) {
    senderNumber = req.body.From;
  }

  if (req.body.Body) {
    messageBody = req.body.Body;
  }

  //sendMessage(senderNumber, 'Hey There..');
  console.log(pendingRides);
  for (var i = 0; i < pendingRides.length; i++) {
    if (pendingRides[i].passengerId == senderNumber) {
      console.log('pending:' + senderNumber);
      if (positives.indexOf(messageBody.toLowerCase()) > -1) {
          sendMessage(senderNumber, 'Great! the taxi is on the way to you. Driver phone is ' + pendingRides[i].driverId + '. I Will let you know when he is coming.', function(success) {
            // insert pendgin ride to DB


            // check up on arrival, but should notify by driver's location
            setTimeout(function(){
              sendMessage(senderNumber, 'Your taxi should be there any minute now');
            }, pendingRides[i].watingTime * 60000);
            pendingRides.splice(i, 1);

            /*
            Ride.findOne({ rideId: pendingRides[i].rideId }, function(err, ride) {
              if (err) { throw err; }
              if (!passenger) {
                var newRide = new Ride({
                  rideId: pendingRides[i].rideId,
                  startingDate: new Date(),
                  blocked: false,
                  location: pendingRides[i].passengerLocation,
                  passengerId: pendingRides[i].passengerId,
                  driverId: pendingRides[i].driverId,
                  orderTime: pendingRides[i].orderTime,
                  watingTime: pendingRides[i].watingTime
                });
                newRide.save(function(err) {
                  if (err) throw err;

                });
              } else if (ride) {
                // somehow ride is already exist
              }
              pendingRides.splice(i, 1);
            });
            */

          });
          return;
      } else if (negatives.indexOf(messageBody.toLowerCase()) > -1) {
        sendMessage(senderNumber, 'I won\'t send it. maybe next time.', function(success) {

        });
        pendingRides.splice(i, 1);
        return;
      } else {
        sendMessage(senderNumber, 'I didn\'t get that. say it again please?', function(success) {

        });
        return;
      }
      pendingRides.splice(i, 1);
    }
  }

  if (messageBody && !messageBody.includes('ghana')) {
      //messageBody.concat(', ghana');
  }

  // create Passenger in db if not exist.
  Passenger.findOne({ phoneNumber: senderNumber }, function(err, passenger) {
    if (err) { throw err; }
    if (!passenger) {
      var newPassenger = new Passenger({
        phoneNumber: senderNumber,
        joinDate: new Date(),
        blocked: false
      });
      newPassenger.save(function(err) {
        if (err) throw err;
          passengerGlobal = passenger;
      });
    } else if (passenger) {
        passengerGlobal = passenger;
    }

    if (passengerGlobal) {
      // send sms searching for taxi around
      geocoding(messageBody, function(result) {
        if (!result.success) {
          sendMessage(passengerGlobal.phoneNumber, result.message);
          res.json(result);
          return;
        }
        var smsText = 'I found a taxi ' + result.message.distance + ' from you. ' + 'It can take ' + result.message.time + '.  ' + 'Should i send it to ' + result.geocode + '?';
        sendMessage(passengerGlobal.phoneNumber, smsText, function(success) {
          if (!success) {
              return;
          }
          var driverId = '0526850487';
          var pendingRide = new PendingRide(passengerGlobal.phoneNumber, driverId, generateRideId(passengerGlobal.phoneNumber, driverId, new Date(), result.message.time));
          pendingRides.push(pendingRide);
        });
        res.json(result);
      });
    } else {
      console.log('try again :(');
      sendMessage(passengerGlobal.phoneNumber, 'Please try again');
      res.json({ success: false, message: 'Please try again.'});
    }
  })
});


// TaxiSMS
app.post('/registerDriver', function(req, res) {
  Driver.findOne({ phoneNumber: req.body.phoneNumber }, function(err, driver) {
    if (err) { throw err; }
    if (!driver) {
      var newDriver = new Driver({
        phoneNumber: req.body.phoneNumber,
        startDate: new Date(),
        active: false,
        ridesCount: 0,
        imageUrl: '',
        blocked: false
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
  })
});

app.post('/registerPassenger', function(req, res) {
  Passenger.findOne({ phoneNumber: req.body.phoneNumber }, function(err, passenger) {
    if (err) { throw err; }
    if (!passenger) {
      var newPassenger = new Passenger({
        phoneNumber: req.body.phoneNumber,
        ridesCount: 0,
        blocked: false
      });
      newPassenger.save(function(err) {
        if (err) throw err;
        console.log('User saved successfully');
        res.json({
          success: true,
          message: 'Welcome New Passenger!',
          userId: newPassenger._id,
        });
      });
    } else if (passenger) {
      res.json({success: false, message: 'Passenger already exist'});
    }
  })
});


app.get('/upload', function(req, res) {
  res.json({ message: 'uploading positions..' });
  index = 0;
  //uploadPositions();
});

function uploadPositions() {
  var title = data.source.job[index].title.__cdata;
  var location = data.source.job[index].city.__cdata + ', ' + data.source.job[index].state.__cdata;
  var city = data.source.job[index].city.__cdata;
  var country = data.source.job[index].country.__cdata;
  var positionNumber = data.source.job[index].referencenumber.__cdata;
  var description = data.source.job[index].linkedin_description.__cdata
  var companyName = data.source.job[index].company.__cdata;
  var companyId = '47033f3d-e807-4669-b537-a5e9992f3d1e'; //'e510559d-13c9-4072-866c-7f3e4126a22e';
  console.log('positionnumber: ' + positionNumber);

  request.post(
    'https://talenttribe.me/tt-server/rest/positionCompany/addUpdateOpenPosition',
    { json: { title: title, location: { address: location, city: city }, positionNumber: positionNumber, description: description,
              company: {
                companyName: companyName,
                companyId: companyId
              }   }
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body)
            if (index < data.source.job.length) {
              console.log('index: ' + index);
              uploadPositions();
            }
            index++;
        }
    }
);
}


// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/api', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

app.post('/signup', function(req, res) {
  // create a sample users
  var newUser = new User({
    email: req.body.email,
    password: req.body.password,
    admin: false
  });

  //removeAll(res);
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) { throw err; }
    if (!user) {
      newUser.save(function(err) {
        if (err) throw err;
        console.log('User saved successfully');
        var token = jwt.sign(newUser, app.get('superSecret'), {
           expiresIn: 1440
        });
        res.json({ success: true, token: token});
      });
    } else {
      res.json({ success: false });
    }
  });
});

function removeAll(res) {
  User.remove({}, function(err) {
     console.log('collection removed')
  });
  console.log(req.body);
  res.json({ success: true });
}

app.post('/login', function(req, res) {
  var data = req.body || req.query || req.headers;
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) { throw err; }
    if (!user) {
      res.json({success: false, message: 'Authentication failed. User not found.'});
    } else if (user) {
      // check if password match
      if (user.password != req.body.password) {
        res.json({success: false, message: 'Authentication failed. Wrong password.'});
      } else {
        // if user is found and password is right
       // create a token
       var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440
       });

       res.json({
         success: true,
         message: 'Enjoy Your Token!',
         userId: user._id,
         token: token
       })
      }
    }
  })
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    console.log('validate: ' + JSON.stringify(token));
    if (token) {
      jwt.verify(token, app.get('superSecret'), function(err, decoded) {
          if (err) {
            res.json({success: false, message: 'Failed to authenticate token.'});
          } else {
              // if everything is good, save to request for use in other routes
              req.decoded = decoded;
              next();
          }
      });
    } else {
      return res.status(403).send({success: false, message: 'No Token Provided'});
    }
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.get('/validate', function(req, res) {
    res.json({success: true});
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('🍺🍺 http://localhost:' + port);

var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
  console.log('db is ready');
});


// helpers

function generateRideId(passengerId, driverId) {
  return passengerId + driverId + new Date().getSeconds();
}

// Twilio

function sendMessage(number, body, callback) {
  client.messages.create({
  	to: number,
  	from: "+12406075476",
  	body: body,
  }, function(err, message) {
    if (err) {
      if (callback) {
        callback(false);
      }
    } else {
      if (callback) {
        callback(true);
      }
    }
  });
}



// callback example
var usingItNow = function(callback) {
  callback('get it?');
};

app.get('/callback', function(req, res) {
  usingItNow(function(data) {
      console.log('got data: ' + data);
  });

  res.json({ message: 'finish' });
});
