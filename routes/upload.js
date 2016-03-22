var express = require('express');
var router = express.Router();
var request = require('request');
var model = require('../models/upload');
var modelForm = require('../models/forms');
var modelUsers = require('../models/users');

/* Get app data */
router.get('/', function (req, res, next) {
    res.redirect('/');
});

//Socket request to recieve data from app and calls to model to insert it into database
io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (req) {
        appAuthenticate(req, null, function () {
            console.log("Socket connection made for uploading app data");
            console.log("Object keys: " + Object.keys(req));

            /*
            modelUsers.UserCheck(req.user, function (result) {
                if (result == 0) {
                    modelUsers.UserCreate(req.user, function (user) {
                    });
                }
                */
                
                 model.taskEntry(req.user, req.body, function () {
                 socket.emit('Done');
                 //socket.disconnect('unauthorized');
                 });
            });
        });
   // });
});


router.post('/form', function (req, res, next) {
    console.log("Post connection made:" + JSON.stringify(req.body, null, 2));

    if (req.body.user) {
        req.user = req.body.user;
        req.body = req.body.body;
    }

    //Create user on submission of registration form if not exists
    modelUsers.UserCheck(req.user, function (result) {

        if (result == 0) {
            modelUsers.UserCreate(req.user, function (result) {
            });
        }
        modelForm.addFormEntry(req, function () {

            console.log("FORM:" + JSON.stringify(req.body, null, 2));
        });
    });
});

//route functions
function appAuthenticate(req, res, next) {
    //console.log("APP AUTHENTICATION CALLED");
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + req.body.id_token, function (error, response, tokenInfo) {
        if (!error && response.statusCode == 200) {
            // console.log("CHECK: " + response.statusCode + ", " + JSON.stringify(JSON.parse(tokenInfo), null, 2));
            //TODO: check if aud key's value matches clientID before proceeding. Double checks that response is related to project

            request('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + req.body.access_token, function (error, response, userInfo) {
                if (!error && response.statusCode == 200) {
                    req.user = JSON.parse(userInfo);
                    console.log("CHECK2: " + response.statusCode + ", " + JSON.stringify(req.user, null, 2));

                    return next(); //return to route
                }
            })
        }
    })
}


module.exports = router;
