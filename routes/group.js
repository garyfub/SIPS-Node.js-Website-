var express = require('express');
var router = express.Router();
var model_admin = require('../models/admin');
var model = require('../models/groups');


/**
 * Retrieves group editing page and handles edits to group
 */
router.all('/:groupID/edit/:action?/:type?', ensureAuthenticated, function (req, res, next) {
    if (req.user.Admin[0]) {

        var gid = req.params.groupID;
        var action = req.params.action;
        var type = req.params.type;
        console.log("EDIT GROUP ACTION: " + action + ", " + JSON.stringify(req.params));


        model.getGroupPermissions(req.user, gid, function (result) {
            if (result == {}) {
                console.log("RESULT WAS == to {}");
                res.redirect('/');
                return;
            }
            var access = result;


            if (action && type && access.GROUP_EDITING == 1) {//Handle edits
                model.editActionIndex(access, action, type, req.body, function (result) {
                    edit_group_callback(req, res, access, gid);
                });
            }
            else
                edit_group_callback(req, res, access, gid);
        });
    }
    else {
        res.send('404: Page not Found', 404);
    }
});

//Added to minimize repeated code.
function edit_group_callback(req, res, access, gid) {
    var admin = req.user.Admin[0];
    model.getGroupInfo(gid, function (result) { //TODO: Move getGroupUsers into getGroupInfo for an all-in-one function call

        var groupInfo = result;

        // console.log("ACCESS RESULT: " + JSON.stringify(result, null, 2));
        // console.log("Group: " + gid + ", " + groupInfo.name);
        if (typeof gid !== 'undefined' && gid || access.GROUP_EDITING) {

            model_admin.getGroupUsers(gid, 1, function (result) {

                console.log("GROUP-EDIT: " + JSON.stringify(groupInfo, null, 2));
                res.render('admin/edit-group', {
                    title: 'Edit Group',
                    name: req.user.name.givenName + " " + req.user.name.familyName,
                    id: req.user.id,
                    isAdmin: req.user.isAdmin,
                    access: access,
                    groupID: gid,
                    groupName: groupInfo["NAME"],
                    orgID: admin.ORGANIZATIONID,
                    inviteCode: groupInfo["INVITE_CODE"],
                    groupInfo: result
                })
            });
        }
        else
            res.redirect('/admin');

    });
}

/**
 * Universal add route, limited to groupID.
 *
 * Adds user or position based on URL parameters
 */

router.post('/add/:type', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin[0]) {
        var admin = req.user.Admin[0];

        var gid = req.body.groupID;
        var type = req.params.type;
        var formData = req.body.form;


        console.log('Add: ' + gid + ", " + type + ", " + JSON(formData, null, 2));
        /*
         model.delete(id, function (err) {
         res.redirect('/admin');
         });
         */

    }
    else {
        res.send('404: Page not Found', 404);
    }
});


/**
 * Universal delete/removal route, limited to groupID
 *
 * Removes user or position
 */

router.post('/remove/:type', ensureAuthenticated, function (req, res, next) {

    if (req.user.Admin[0]) {
        var admin = req.user.Admin[0];

        var gid = req.body.groupID;
        var type = req.params.type;
        var removeID = req.body.removeID;


        console.log('REMOVE: ' + gid + ", " + type + ", " + removeID);
        /*
         model.delete(id, function (err) {
         res.redirect('/admin');
         });
         */

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