var express = require('express');
var router = express.Router();
var model = require('../models/admin')
var model_users = require('../models/users');
var model_data = require('../models/data');

/* GET Admin page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {
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

router.get('/create-group', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin) {
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

router.post('/create-group', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin) {
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

/**
 * TODO
 * 1. Double check that admin has access to group?
 *
 */

router.post('/delete-group', ensureAuthenticated, function (req, res, next) {

    var groupID = req.body.group;

    if (req.user.Admin) {
        var admin = req.user.Admin;

        model.deleteGroup(groupID, function (err) {
            res.redirect('/admin');
        });

    }
    else {
        res.send('404: Page not Found', 404);
    }
});

/**
 * TODO
 * 1. ✓ Be able to send users invite code via email (using client's email program)
 * 2. Remove user from group
 * 3. Create and assign group positions
 * 4. Edit Group properties (name, group type, etc)
 */
router.all('/edit-group', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {

        var gid = req.body.groupID;
        var gName = req.body.groupName;
        var getPermissions = 1;
        console.log("Group: " + gid + ", " + gName);
        if (typeof gid !== 'undefined' && gid) {

            model.getGroupUsers(gid, getPermissions, function(result) {

                //console.log("RESULT: " + JSON.stringify(result, null, 2));
                //console.log("RESULT: " + JSON.stringify(req.body, null, 2));
                res.render('admin/edit-group', {
                    title: 'Edit Group',
                    name: req.user.name.givenName + " " + req.user.name.familyName,
                    id: req.user.id,
                    isAdmin: req.user.isAdmin,
                    groupID: gid,
                    groupName: gName,
                    orgID: req.user.Admin.ORGANIZATIONID,
                    inviteCode: req.body.inviteCode,
                    groupInfo: result
                })
            });

        }
        else
            res.redirect('/admin');
    }
    else {
        res.send('404: Page not Found', 404);
    }
});

/**
 * GROUP
 * Remove user from group
 */
router.post('/remove-user', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {
        console.log("RESULT: " + JSON.stringify(req.body, null, 2));
    }
    else {
        res.redirect('/logout');
    }
});

/**
 * GROUP
 * Remove position
 */
router.post('/remove-position', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {
        console.log("RESULT: " + JSON.stringify(req.body, null, 2));
    }
    else {
        res.redirect('/logout');
    }
});


/**
 * TODO
 * 1. Should there be a single results page or is it easier to manage a separate admin version?
 */
router.get('/results', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin) {
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


/**
 * TODO: Need results first
 */
router.post('/results/data', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {
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


//route functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}

module.exports = router;
