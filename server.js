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


// =======================
// configuration =========
// =======================
var port = process.env.PORT || 4000; // used to create, sign, and verify tokens
mongoose.connect('mongodb://heroku_kc5krpgj:5tbspvggrtia5h8adh2eln4r8n@ds015760.mlab.com:15760/heroku_kc5krpgj'); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Headers', 'Accept');
    //res.header('Access-Control-Allow-Headers', 'Origin');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
}

app.use(allowCrossDomain);
//apiRoutes.use(allowCrossDomain);

// API ROUTES -------------------
// get an instance of the router for api routes
var apiRoutes = express.Router();

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

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

  newUser.save(function(err) {
    if (err) throw err;
    console.log('User saved successfully');
    res.json({ success: true });
  });
  var data = { message: 'Welcome to the coolest API on earth!' };
  console.log('data: ' + JSON.stringify(data));
  res.json(data);
});


app.post('/api/signup', function(req, res) {
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
        res.json({ success: true });
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

app.post('/api/login', function(req, res) {
  var data = req.body || req.query || req.headers;
  console.log('data: ' + JSON.stringify(data));
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

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
  app.listen(port);
  console.log('DB is ready! http://localhost:' + port);
});
