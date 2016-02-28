var express = require('express');
var router = express.Router();
var model_admin = require('../models/admin');
var model = require('../models/groups');
var model_user = require('../models/users');


/**
 * Displays group page based on ID in url
 */
router.get('/:groupID/', ensureAuthenticated, function (req, res, next) {
    //TODO: Create group page, decide on staying with groupID's or using group name or short id for group pages.

    var gid = req.params.groupID;

    model_user.getPermissions(req.user, gid, function (result) {
        if (result == {}) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }
        var access = result;

        model.getGroupInfo(gid, function (result) { //TODO: Move getGroupUsers into getGroupInfo for an all-in-one function call

            var groupInfo = result;

            res.render('group/index', {
                title: groupInfo["NAME"],
                isAdmin: req.user.isAdmin,
                access: access,
                groupName: groupInfo["NAME"],
                groupInfo: result
            });
        });
    });



   // res.redirect('/group/' + req.params.groupID + "/edit"); //temp redirect to edit page
});


/**
 * Retrieves group editing page and handles edits to a single group
 */
router.all('/:groupID/edit/:action?/:type?', ensureAuthenticated, function (req, res, next) {

    var gid = req.params.groupID;
    var action = req.params.action;
    var type = req.params.type;

    model_user.getPermissions(req.user, gid, function (result) {
        if (result == {}) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }
        var access = result;

        if (action && type && access.GROUP_EDITING == 1) {//Handle edits
            console.log("EDIT GROUP ACTION: " + action + ", " + JSON.stringify(req.params));
            model.editActionIndex(access, action, type, req.body, function (result) {
                edit_group_callback(req, res, access, gid);
            });
        }
        else //TODO: Redirect to group page when group page is built out
            edit_group_callback(req, res, access, gid);
    });
});

//Added to minimize repeated code.
function edit_group_callback(req, res, access, gid) {
    model.getGroupInfo(gid, function (result) {

        var groupInfo = result;
        console.log("GROUP INFO: " + groupInfo.info['GROUP_NAME']);
        if (typeof gid !== 'undefined' && gid || access.GROUP_EDITING) {
                res.render('group/edit', {
                    title: 'Edit Group',
                    name: req.user.name.givenName + " " + req.user.name.familyName,
                    id: req.user.id,
                    isAdmin: req.user.isAdmin,
                    access: access,
                    groupID: gid,
                    groupName: groupInfo.info["GROUP_NAME"],
                    orgID: access.ORGANIZATIONID,
                    inviteCode: groupInfo.info["INVITE_CODE"],
                    groupInfo: groupInfo
                })

        }
        else
            res.redirect('/group/'+ groupID);

    });
}


//route functions
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else
        res.redirect('/');
}

module.exports = router;