var express = require('express');
var router = express.Router();
var passport = require('passport');
//var GooglePlusStrategy = require('passport-google-plus');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var model = require('../models/users');

var userjson;
var isNew;

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

/* GET /users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET /users/login page and handle user login */
router.get('/login', function(req, res, next) {

  passport.use(new GoogleStrategy({
        clientID: '185585020623-o8hdaup59vfnlt18hpbss7utdsjng85j.apps.googleusercontent.com',
        clientSecret: 'vFXPWHiA18ssRJ606AAOERHY',
          callbackURL: 'http://utc-vat.mybluemix.net/users/auth/google/callback'
      },
      function(token, refreshToken, profile, done) {
         // console.log("Received User: " + JSON.stringify(profile, null, 2));
          model.UserCreate(profile, req);
          isNew =  model.isNewUser(req);
          userjson = profile;

          check = 1;
        //call done() when complete...
        done(null, profile);
      }
  ));
  res.render('users/login');
});

//Sends user to google for authentication
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

//Retrieves Google callback and confirms user is authenticated.
router.all('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {

    console.log("User Authenticated")
    if(isNew == 1)//located in db
        res.render('forms/sport-fitness-injury', {title: 'Sport Fitness and Injury Form'});
    else
    res.render('forms/user-registration', {title: 'Basic User Information Form'});
});


module.exports = router;
