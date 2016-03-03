//Controller (Route) of Forms
var express = require('express');
var router = express.Router();
var model = require('../models/forms');
var modelUsers = require('../models/users');

/* GET home page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
    res.render('forms', {
        title: 'Forms', isAdmin: req.user.isAdmin
    });
});

router.post('/next', ensureAuthenticated, function (req, res, next) {
    console.log("NEXT: " + JSON.stringify(req.body, null, 2));

    modelUsers.UserCheck(req.user, function (result) {
        model.addFormEntry(req, function () {
            console.log("FORM ENTRY USER CHECK: " + result);
            res.redirect('/forms/sport-fitness-injury');
        });
    });


});

/* Displays Sports Fitness and Injury Form static version */
router.get('/sport-fitness-injury', ensureAuthenticated, function (req, res, next) {
    res.render('forms/sport-fitness-injury', {title: 'Sport Fitness and Injury Form', isAdmin: req.user.isAdmin});
});

/* Displays Sports Fitness and Injury Form static version */
router.get('/user-registration', ensureAuthenticated, function (req, res, next) {
    res.render('forms/user-registration', {title: 'Basic User Information Form', isAdmin: 0});
});

/* Retrieves Sports Fitness and Injury Form Data and sends it to be added to the database */
router.post('/submission-complete', ensureAuthenticated, function (req, res, next) {

    model.addFormEntry(req, function () {
        res.render('forms/submission-complete', {title: 'Sport Fitness and Injury Form', isAdmin: req.user.isAdmin});
    });
});


//route functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}

module.exports = router;



