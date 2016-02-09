var express = require('express');
var router = express.Router();
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var session = require('express-session');
var passport = require('passport');
var model_users = require('../models/users');
var model_data = require('../models/data');
userjson = null;
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'utcisasecret' }));
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function(user, done) {
    return done(null, user);
});

passport.deserializeUser(function(obj, done) {
        return done(null, obj);
});

/* GET home page. */
router.get('/', function(req, res, next) {
   // console.log("USER_2: " + JSON.stringify(req.user, null, 2));

    if (req.user) {
        // logged in
        res.render('index', {title: 'SIPS',
            name: req.user.name.givenName + " " + req.user.name.familyName,
            isAdmin: req.user.isAdmin});
    } else {
    passport.use(new GoogleStrategy({
            clientID: '185585020623-o8hdaup59vfnlt18hpbss7utdsjng85j.apps.googleusercontent.com',
            clientSecret: 'vFXPWHiA18ssRJ606AAOERHY',
            callbackURL: req.protocol + '://' + req.get('host')+ '/users/auth/google/callback'
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
    }
});

router.get('/admin', function (req, res, next) {


    if(req.user.isAdmin != 0 && req.user) {
        var user = req.user;
        var admin = req.user.Admin;
      //  console.log("ORG ID value: " + admin.ORGANIZATIONID);
        var org = model_users.getOrganization(req);

        res.render('admin/dash', {
            title: 'Admin Dashboard',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin,
            organizationid: admin.ORGANIZATIONID
        })
    }
    else{
        res.send('404: Page not Found', 404);
    }
});

router.get('/admin/create-group', function (req, res, next) {


    if(req.user.isAdmin != 0 && req.user) {
        var user = req.user;
        var admin = req.user.Admin;
        var org = model_users.getOrganization(req);

        res.render('admin/create-group', {
            title: 'Create New Group',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin,
            organizationid: admin.ORGANIZATIONID
        })
    }
    else{
        res.send('404: Page not Found', 404);
    }
});

//TODO:edit post endpoint to call model function for deleting a group, verify admin identity and access to group
router.post('/admin/delete-group', function (req, res, next) {


    if(req.user.isAdmin != 0 && req.user) {
        var user = req.user;
        var admin = req.user.Admin;
        var org = model_users.getOrganization(req);

        res.render('admin', {
            title: 'Admin Dashboard',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin,
            organizationid: admin.ORGANIZATIONID
        })
    }
    else{
        res.send('404: Page not Found', 404);
    }
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/results', function (req, res, next) {


    if(req.user) {
        var results = model_data.getUserTaskList(req);
       // console.log("CHECK USER:: " + req.user);
        res.render('results', {
            title: 'Results',
            name: req.user.name.givenName + " " + req.user.name.familyName,
            id: req.user.id,
            isAdmin: req.user.isAdmin,
            taskList: results
        })
    }
    else{
        res.send('404: Page not Found', 404);
    }
});

router.post('/results/data', function (req, res, next) {
    if(req.user) {
        var data = model_data.getUserTaskData(req);

        console.log("RESULTS_AJAX: " + JSON.stringify(data, null, 2));
        res.send( {
            data: data
        })
    }
    else{
        res.send('404: Page not Found', 404);
    }
});


module.exports = router;
