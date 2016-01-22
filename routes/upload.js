var express = require('express');
var router = express.Router();
var model = require('../models/upload');
var modelForm = require('../models/forms');
var modelUsers = require('../models/users');

/* Get app data */
router.get('/', function (req, res, next) {
    console.log("Post connection made.");
    res.render('index', {title: 'Express'});
});

//Socket request to recieve data from app and calls to model to insert it into database
io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (req) {
        console.log("Socket connection made for uploading task data");
        model.userCheckUpload(req); //Checks user and then calls to insert data

        socket.disconnect('unauthorized');
    });
});

/*
 io.of('/upload/form').on('connection', function (socket) {
 socket.on('data', function (req) {
 console.log("Socket connection made for uploading form data.");
 // console.log("FORM UPLOAD CHECK:" + JSON.stringify(req, null, 2));
 modelForm.addFormEntry(req);

 //Create user on submission of registration form if not exists
 var result = modelUsers.UserCheck(req.user);
 if(result == 0){
 modelUsers.UserCreate(req.user);
 }

 socket.disconnect('unauthorized');
 });
 });
 */


//TODO: Should form data be sent through post requests?
router.post('/form', function (req, res, next) {
    console.log("Post connection made:" + JSON.stringify(req.body, null, 2));

    if (req.body.user) {
        req.user = req.body.user;
        req.body = req.body.body;
    }

    //Create user on submission of registration form if not exists
    var result = modelUsers.UserCheck(req.user);
    if (result == 0) {
        modelUsers.UserCreate(req.user);
    }
    modelForm.addFormEntry(req);

    console.log("Post moved BODY:" + JSON.stringify(req.body, null, 2));
    console.log("Post added USER:" + JSON.stringify(req.user, null, 2));

});


module.exports = router;
