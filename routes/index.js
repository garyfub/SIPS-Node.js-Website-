var express = require('express');
var router = express.Router();
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var model_users = require('../models/users');
var model_groups = require('../models/groups');
var model_data = require('../models/data');
userjson = null;


/**
 * Homepage
 */
router.get('/', function (req, res, next) {

    if (req.isAuthenticated()) {
        // logged in
        model_users.getPositions(req, function (req) {
            console.log("USER LOGGED IN ON INDEX");
            res.render('index', {
                title: 'Sports Injury Prevention Screen',
                name: req.user.name.givenName + " " + req.user.name.familyName,
                isAdmin: req.user.isAdmin,
                admin: req.user.Admin,
                groups: req.user.Groups
            });
        });
    } else {
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

        //console.log("Invite code found  " + req.query.code);
        if(req.query.code){
            console.log("Invite code found for position " + req.query.num);
            //req.tempVal = {};
            req.session.code_insert = req.query.code;
            req.session.pos_num = req.query.num;
        }
        res.render('users/login');
    }
});

/**
 * Logs user out in the active session
 */
router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});


/**
 * Retrieves code, checks if code is used by GROUPS table, adds user to group on success
 */
router.post('/code-submit', ensureAuthenticated, function (req, res, next) {


    model_groups.inviteCode(req, function (err) {
        if (!err)
            model_users.getPositions(req, function (req) {
                res.sendStatus(200); //success
            });
        else
            res.sendStatus(404); //fail
    });

});

router.get('/group/invite/:code/:num?', ensureAuthenticated, function (req, res, next) {

    req.body.code_insert = req.params.code;
   if(req.params.num){
       req.body.pos_num = req.params.num;
   }
    model_groups.inviteCode(req, function (err) {
        if (!err)
            model_users.getPositions(req, function (req) {
                res.redirect('/'); //success
            });
        else
            res.sendStatus(404); //fail
    });

});


/**
 * Opens Results page
 * TODO: Separate results page for users and admin (for groups/organizations)?
 */
router.get('/results', ensureAuthenticated, function (req, res, next) {

    model_data.getUserTaskList(req, function (results) {
        res.render('results', {
            title: 'Results',
            name: req.user.name.givenName + " " + req.user.name.familyName,
            id: req.user.id,
            isAdmin: req.user.isAdmin,
            taskList: results
        })
    });
});

//Retrieves data requested from Results page
router.post('/results/data', ensureAuthenticated, function (req, res, next) {

    model_data.getUserTaskData(req, function (data) {
        console.log("RESULTS_AJAX: " + JSON.stringify(data, null, 2));
        res.send({
            data: data
        })
    });
});


/**
 * Function that checks if the user is authenticated.
 * Called as route parameter
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}


module.exports = router;
