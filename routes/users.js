var express = require('express');
var router = express.Router();
var passport = require('passport');
//var GooglePlusStrategy = require('passport-google-plus');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var model = require('../models/users');


/* GET /users listing. */
router.get('/', function (req, res, next) {

    res.redirect('/');
});

/* GET /users/login page and handle user login */
router.get('/login', function (req, res, next) {

    passport.use(new GoogleStrategy({
            clientID: '185585020623-o8hdaup59vfnlt18hpbss7utdsjng85j.apps.googleusercontent.com',
            clientSecret: 'vFXPWHiA18ssRJ606AAOERHY',
            callbackURL: req.protocol + '://' + req.get('host') + '/users/auth/google/callback'
        },
        function (token, refreshToken, profile, done) {
            //call done() when complete...
            done(null, profile);
        }
    ));
    res.render('users/login');
});

//Sends user to google for authentication
app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

//Retrieves Google callback and confirms user is authenticated.
router.all('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/login'}), function (req, res) {

    console.log("User Authenticated");
    model.UserCheck(req.user, function (isNew) {

        if (isNew == 1) {//if user id is located in db

            model.getPositions(req, function (req) {
                console.log("ADMIN: " + Object.keys(req.user.Admin));
                console.log("GROUP: " + Object.keys(req.user.Groups));


                res.redirect('/');
            });
        }
        else {
            model.UserCreate(req.user, function () {
                res.redirect('/forms/user-registration');
            });
        }
    });
});

//Check if user is in database
router.post('/check', function (req, res, next) {

    model.UserCheck(req.body, function (result) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({check: result}));
    });
});

module.exports = router;
