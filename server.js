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

var request = require('request');
var data = require('./dropbox.json');
var index = 0;

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 4000; // used to create, sign, and verify tokens
mongoose.connect("mongodb://mendy-db:shme3184@ds161315.mlab.com:61315/mendy-edri-db");
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

app.get('/send', function(req, res) {

  var accountSid = 'AC2cbcc9d2a2a26af287dd08f68131f4ec';
  var authToken = "4322b0334d35375c3a9e157954d56e69";
  var client = require('twilio')(accountSid, authToken);

  client.messages.create({
      body: "Hey, i need a taxi at this place: ..",
      to: "18058643424",
      from: "+12406075476"
  }, function(err, sms) {
      //process.stdout.write(sms.sid);
      console.log('/send ' + sms);
      if (err) {
        console.log('err: ' + JSON.stringify(err));
      }
      res.json({ message: sms });
  });
});

app.get('sms/out', function(req, res) {
  res.json({ message: req.query });
});

app.get('/sms', function(req, res) {
  console.log('-------- Message --------');
  console.log('Sender: ' + JSON.stringify(req.query.From));
  console.log('Body: ' + JSON.stringify(req.query.Body));
  console.log('-------- End --------');
  res.json({ message: req.query });
});


app.get('/upload', function(req, res) {
  res.json({ message: 'uploading positions..' });
  //index = 0;
  //uploadPositions();
});


function uploadPositions() {
  var title = data.source.job[index].title.__cdata;
  var location = data.source.job[index].city.__cdata + ', ' + data.source.job[index].state.__cdata;
  var city = data.source.job[index].city.__cdata;
  var country = data.source.job[index].country.__cdata;
  var positionNumber = data.source.job[index].referencenumber.__cdata;
  var description = data.source.job[index].description.__cdata
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
            index++;
            if (index < data.source.job.length) {
              console.log('index: ' + index);
              uploadPositions();
            }
        }
    }
);
}


// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/api', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

app.get('/api/test', function(req, res) {
  var newUser = new User({
    email: "mendy@talenttribe.me",
    password: "102030",
    admin: true
  });

  newUser.save();
  res.json({ success: true, message: 'User has saved!'});
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
