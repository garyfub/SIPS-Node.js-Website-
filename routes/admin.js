var express = require('express');
var router = express.Router();
var model = require('../models/admin');
var model_data = require('../models/data');
var model_user = require('../models/users');

/* GET Admin page. */
/*
 router.get('/', ensureAuthenticated, function (req, res, next) {
 if (req.user.Admin[0]) {
 var user = req.user;
 var admin = req.user.Admin[0];//TODO: Need to add ability to switch between organizations if more than one result
 var orgID = admin.ORGANIZATIONID;

 //console.log("OBJECt-OrgID: " + orgID);
 model.getGroups(orgID, function (err, groups) {
 //   console.log("Results: " + JSON.stringify(groups, null, 2));


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
 */

/* GET Dynamic Admin page. */
router.get('/:orgID', ensureAuthenticated, function (req, res, next) {

    var user = req.user;

    model_user.getPermissions(req.user, req.params.orgID, function (access) {
        if (access == null) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }

        model.getGroups(access.ORGANIZATIONID, function (err, groups) {

            console.log("ADMIN: " + JSON.stringify(access, null, 2));
            res.render('admin/dash', {
                title: access.ORG_NAME + ' Dashboard',
                name: user.name.givenName + " " + user.name.familyName,
                id: user.id,
                isAdmin: user.isAdmin,
                access: access,
                groups: groups
            })
        });
    });

});

router.get('/:orgID/create/group', ensureAuthenticated, function (req, res, next) {

    model_user.getPermissions(req.user, req.params.orgID, function (access) {
        if (result == {}) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }

        var user = req.user;
        res.render('admin/create-group', {
            title: 'Create New Group',
            name: user.name.givenName + " " + user.name.familyName,
            id: user.id,
            isAdmin: user.isAdmin,
            access: access
        })
    });
});

router.post('/:orgID/create/group', ensureAuthenticated, function (req, res, next) {

    model_user.getPermissions(req.user, req.params.orgID, function (access) {
        if (result == {}) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }
        var name = req.body.group_name;
        var orgID = access.ORGANIZATIONID;

        model.createGroup(name, orgID, function (err, data) {
            res.redirect('/admin/' + orgID);
        });
    });
});


/**
 * Remove group
 */
router.get('/:orgID/remove/group/:groupID', ensureAuthenticated, function (req, res, next) {

    model_user.getPermissions(req.user, req.params.orgID, function (access) {
        if (access == null) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }
        model.deleteGroup(req.params.groupID, function (err) {
            res.redirect('/admin/' + access.ORGANIZATIONID);
        });

    });
});

/**
 * TODO
 * 1. Should there be a single results page or is it easier to manage a separate admin version?
 */
router.get('/results', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin[0]) {
        model_data.getUserTaskList(req, function (results) {

            res.render('results', {
                title: 'Results',
                name: req.user.name.givenName + " " + req.user.name.familyName,
                id: req.user.id,
                isAdmin: req.user.isAdmin,
                taskList: results
            })
        });
    }
    else {
        res.send('404: Page not Found', 404);
    }
});


/**
 * TODO: Need results first
 */
router.post('/results/data', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin[0]) {
        model_data.getUserTaskData(req, function (data) {

            console.log("RESULTS_AJAX: " + JSON.stringify(data, null, 2));
            res.send({
                data: data
            })
        });


    }
    else {
        res.send('404: Page not Found', 404);
    }
});

//route functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}

module.exports = router;
