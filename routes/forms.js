//Controller (Route) of Forms
var express = require('express');
var router = express.Router();
var model = require('../models/forms');
var modelUsers = require('../models/users');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/next', function (req, res, next) {
    console.log("NEXT: " + JSON.stringify(req.body, null, 2));
    var result = modelUsers.UserCheck(req.user);
    model.addFormEntry(req);
    console.log("FORM ENTRY USER CHECK: " + result);

    res.redirect('/forms/sport-fitness-injury');
});

/* Displays Sports Fitness and Injury Form static version */
router.get('/sport-fitness-injury', function (req, res, next) {
    res.render('forms/sport-fitness-injury', {title: 'Sport Fitness and Injury Form'});
});

/* Displays Sports Fitness and Injury Form static version */
router.get('/user-registration', function (req, res, next) {
    res.render('forms/user-registration', {title: 'Basic User Information Form'});
});

/* Retrieves Sports Fitness and Injury Form Data and sends it to be added to the database */
router.post('/submission-complete', function (req, res, next) {

    model.addFormEntry(req);
    res.render('forms/submission-complete', {title: 'Sport Fitness and Injury Form'});
});


module.exports = router;



