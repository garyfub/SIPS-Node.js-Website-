var express = require('express');
var router = express.Router();
var model = require('../models/admin')
var model_users = require('../models/users');
var model_data = require('../models/data');


/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.user.isAdmin != 0 && req.user) {
        var user = req.user;
        var admin = req.user.Admin;
        var orgID = req.user.Admin.ORGANIZATIONID;

        model.getGroups(orgID, function (err, groups) {
            console.log("Results: " + JSON.stringify(groups, null, 2));

            console.log("OBJECT: " + Object.keys(groups));
        res.render('admin/dash', {
            title: 'Admin Dashboard',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin,
            organizationid: admin.ORGANIZATIONID,
            groups: groups
        })
        });
    }
    else {
        res.send('404: Page not Found', 404);
    }
});

router.get('/create-group', function (req, res, next) {

    if (req.user.isAdmin != 0 && req.user) {
        var user = req.user;
        var admin = req.user.Admin;
        res.render('admin/create-group', {
            title: 'Create New Group',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin
        })
    }
    else {
        res.send('404: Page not Found', 404);
    }
});

router.post('/create-group', function (req, res, next) {

    if (req.user.isAdmin != 0) {
        var name = req.body.group_name;
        var orgID = req.user.Admin.ORGANIZATIONID;

        model.createGroup(name, orgID, function (err, data) {
            res.redirect('/admin');
        });
    }
    else {
        res.send('404: Page not Found', 404);
    }
});

//TODO:edit post endpoint to call model function for deleting a group, verify admin identity and access to group
router.post('/delete-group', function (req, res, next) {

    var groupID = req.body.group;

    if (req.user.isAdmin != 0) {
        var admin = req.user.Admin;

        model.deleteGroup(groupID, function (err) {
            res.redirect('/admin');
        });

    }
    else {
        res.send('404: Page not Found', 404);
    }
});


//TODO: Use single results page for users and Admin?
router.get('/results', function (req, res, next) {


    if (req.user.isAdmin != 0) {
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
    else {
        res.send('404: Page not Found', 404);
    }
});

router.post('/results/data', function (req, res, next) {
    if (req.user.isAdmin != 0) {
        var data = model_data.getUserTaskData(req);

        console.log("RESULTS_AJAX: " + JSON.stringify(data, null, 2));
        res.send({
            data: data
        })
    }
    else {
        res.send('404: Page not Found', 404);
    }
});


module.exports = router;
