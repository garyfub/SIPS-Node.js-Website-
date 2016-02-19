var express = require('express');
var router = express.Router();
var model = require('../models/admin');
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
 * 2. ✓ Remove user from group
 * 3. Make the route dynamic based on the url
 * 4. Check user's permissions to see if they have access to group
 * 5. Create and assign group positions
 * 6. Edit Group properties (name, group type, etc)
 */
router.all('/edit-group/:groupID', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin) {

        var gid = req.params.groupID;
        var userID = req.user.id;
        model.getUserAccessPermissions(gid, userID, function (result) {
            var access = result[0];

            console.log("RESULT: " + JSON.stringify(access, null, 2));

            var gName = access["NAME"];

            console.log("Group: " + gid + ", " + gName);
            if (typeof gid !== 'undefined' && gid || access.GROUP_EDITING) {

                model.getGroupUsers(gid, 1, function (result) {

                    res.render('admin/edit-group', {
                        title: 'Edit Group',
                        name: req.user.name.givenName + " " + req.user.name.familyName,
                        id: req.user.id,
                        isAdmin: req.user.isAdmin,
                        access: access,
                        groupID: gid,
                        groupName: gName,
                        orgID: req.user.Admin.ORGANIZATIONID,
                        inviteCode: access["INVITE_CODE"],
                        groupInfo: result
                    })
                });
            }
            else
                res.redirect('/admin');

        });
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
        var gid = req.body.groupID;
        var userID = req.body.userID;

        console.log("RESULT: " + JSON.stringify(req.body, null, 2));

        model.groupRemoveUser(gid, userID, function (err) {
            res.redirect('/admin');
        });
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
        var gid = req.body.groupID;
        var position = req.body.position;

        console.log("RESULT: " + JSON.stringify(req.body, null, 2));
        model.groupRemovePosition(gid, position, function () {
            res.sendStatus(200);
        });
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
    if (req.user.Admin) {
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
