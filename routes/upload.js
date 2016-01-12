var express = require('express');
var router = express.Router();
var model = require('../models/upload');
var modelform = require('../models/forms');

/* Get app data */
router.get('/', function(req, res, next) {
    console.log("Post connection made.");
  res.render('index', { title: 'Express' });
});

//Socket request to recieve data from app and calls to model to insert it into database
io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (msg) {
        console.log("Socket connection made.");
        model.userCheckUpload(msg); //Checks user and then calls to insert data

       // model.taskDataUploadSQLMultiTable(msg);
       // model.taskDataUploadCloudant(msg);
    });
});

//TODO: check if Sports Fitness and Injury form includes form_id
io.of('/upload/form').on('connection', function (socket) {
    socket.on('data', function (msg) {
        console.log("Socket connection made.");
                    modelform.addFormEntry(msg);
    });
});

/* Get app data */
router.post('/form', function(req, res, next) {
    console.log("Post connection made:" + JSON.stringify(req.body, null, 2));
                modelform.addFormEntry(req);

      //  model.userCheckUpload(msg);
});



module.exports = router;
