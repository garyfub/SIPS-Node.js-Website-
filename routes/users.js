var express = require('express');
var router = express.Router();
var passport = require('passport');
//var GooglePlusStrategy = require('passport-google-plus');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var request = require('request');
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
router.post('/check', appAuthenticate, function (req, res, next) {
//console.log("APP USER CHECK: "  + JSON.stringify(req.user, null, 2));
        model.UserCheck(req.body, function (check) {
            if(req.user) {
                model.getPositions(req, function (req) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({check: check == 1, user: req.user}));
                });
            }
            else{
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({check: check}));
            }
            });
});


//route functions
    function appAuthenticate(req, res, next) {

        request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.id_token, function (error, response, tokenInfo) {
            if (!error && response.statusCode == 200) {
               // console.log("CHECK: " + response.statusCode + ", " + JSON.stringify(JSON.parse(tokenInfo), null, 2));
                //TODO: check if aud key's value matches clientID before proceeding

                request('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + req.body.access_token, function (error, response, userInfo) {
                    if (!error && response.statusCode == 200) {
                        req.user = JSON.parse(userInfo);
                      //  console.log("CHECK2: " + response.statusCode + ", " + JSON.stringify(req.user, null, 2));

                        return next(); //return to route
                    }
                })
            }
        })
    }


module.exports = router;
