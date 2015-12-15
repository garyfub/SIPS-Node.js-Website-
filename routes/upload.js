var express = require('express');
var router = express.Router();
var model = require('../models/upload');
//var http = require('http').Server(app);
//var io = require('socket.io')(http);

/* Get app data */
router.get('/', function(req, res, next) {
    console.log("Post connection made.");
  res.render('index', { title: 'Express' });
});

//Socket request to insert app data into database
io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (msg) {
        console.log("Socket connection made.");

        model.taskDataUploadCloudant(msg);

    });
});

module.exports = router;
