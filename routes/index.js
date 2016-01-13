var express = require('express');
var router = express.Router();
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var passport = require('passport');
var model_users = require('../models/users');
userjson = null;
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

/* GET home page. */
router.get('/', function(req, res, next) {
 // res.render('index', { title: 'Express' });

    passport.use(new GoogleStrategy({
            clientID: '185585020623-o8hdaup59vfnlt18hpbss7utdsjng85j.apps.googleusercontent.com',
            clientSecret: 'vFXPWHiA18ssRJ606AAOERHY',
            callbackURL: 'http://utc-vat.mybluemix.net/users/auth/google/callback'
        },
        function(token, refreshToken, profile, done) {
            //check if user is in database
            model_users.UserCheck(profile);
            userjson = profile;

            //call done() when complete...
            done(null, profile);
        }
    ));
    res.render('users/login');
});


router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});


module.exports = router;
