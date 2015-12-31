var express = require('express');
var router = express.Router();
var model = require('../models/upload');

/* Get app data */
router.get('/', function(req, res, next) {
    console.log("Post connection made.");
  res.render('index', { title: 'Express' });
});

//Socket request to recieve data from app and calls to model to insert it into database
io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (msg) {
        console.log("Socket connection made.");
        model.userCheckUpload(msg);
        model.taskDataUploadSQLMultiTable(msg);

       // model.taskDataUploadCloudant(msg);
       // model.taskDataUploadSQL(msg);

    });
});

module.exports = router;
