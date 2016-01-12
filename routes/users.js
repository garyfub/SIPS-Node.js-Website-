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
         //check if user is in database
          model.UserCheck(profile);
          userjson = profile;

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
    //console.log("USER: " + JSON.stringify(req.user.id, null, 2));
    console.log("User Authenticated");
    isNew =  model.isNewUser();
    if(isNew == 1)//if user id is located in db
        res.redirect('/forms/sport-fitness-injury');
    else{
        model.UserCreate(userjson);
       // console.log("Received UserJSON: " + JSON.stringify(userjson, null, 2))
        res.redirect('/forms/user-registration');
    }
});

//Check if user is in database
router.post('/check', function(req, res, next) {
    var result = model.UserCheck(req.body);

    console.log("CHECK: " + result);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ check: result }));
});

module.exports = router;
