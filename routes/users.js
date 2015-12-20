var express = require('express');
var router = express.Router();
var passport = require('passport');
var GooglePlusStrategy = require('passport-google-plus');
var session = require('express-session');
var model = require('../models/users');

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'utcisasecret' }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET users listing. */
router.get('/login', function(req, res, next) {

  passport.use(new GooglePlusStrategy({
        clientId: '185585020623-o8hdaup59vfnlt18hpbss7utdsjng85j.apps.googleusercontent.com',
        apiKey: 'AIzaSyDoSdEDhOVmGp0qBTSTsnLsmUqkgV0t8PE'
      },
      function(tokens, profile, done) {
        //TODO: Create User if doesn't exist in database
       // console.log("TOKEN" + JSON.stringify(tokens, null, 2));
        console.log("Received User: " + JSON.stringify(profile, null, 2));
       result =  model.UserCreate(profile);
        //console.log("Result: " + result);

        //call done() when complete...
        done(null, profile, tokens);
      }
  ));
  res.render('users/login');
});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.
router.all('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {

  //TODO:Remove folowing 3 lines when testing is over
  //Print out Google Token/Profile
 // console.log("Callback received: " + JSON.stringify(req.authInfo, null, 2));
 // console.log("Callback received Continued:" + JSON.stringify(req.user, null, 2));

  req.session.googleCredentials = req.authInfo;
  // Return user profile back to client
  res.send(req.user);
});



module.exports = router;
