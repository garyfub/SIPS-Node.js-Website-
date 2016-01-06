//Controller (Route) of Forms
var express = require('express');
var router = express.Router();
var model = require('../models/forms');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/next', function (req, res, next) {
    console.log(JSON.stringify(req.body, null, 2));
    res.render('forms/sport-fitness-injury', {title: 'Sport Fitness and Injury Form'});
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

    model.sportsFormEntry(req);
    res.render('forms/submission-complete', {title: 'Sport Fitness and Injury Form'});
});


module.exports = router;



