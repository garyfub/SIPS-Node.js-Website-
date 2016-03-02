var express = require('express');
var router = express.Router();
var model = require('../models/groups');
var model_user = require('../models/users');


/**
 * Displays group page based on ID in url
 */
router.get('/:groupID/', ensureAuthenticated, function (req, res, next) {

    var gid = req.params.groupID;
    model_user.getPermissions(req.user, gid, function (access) {
        if (result == {}) {
            console.log("RESULT WAS == to {}");
            res.redirect('/');
            return;
        }
        model.getGroupInfo(gid, function (groupInfo) {
            res.render('group/index', {
                title: groupInfo.info["GROUP_NAME"],
                isAdmin: req.user.isAdmin,
                access: access,
                groupName: groupInfo.info["GROUP_NAME"],
                groupInfo: groupInfo
            });
        });
    });
});


/**
 * Retrieves group editing page and handles edits to a single group
 */
router.all('/:groupID/edit/:action?/:type?', ensureAuthenticated, function (req, res, next) {

    var gid = req.params.groupID;
    var action = req.params.action;
    var type = req.params.type;
    model_user.getPermissions(req.user, gid, function (access) {
        if (Object.keys(access).length == 0) {
            res.redirect('/group/' + gid);
            return;
        }
        if (action && type && access.GROUP_EDITING == 1) {//Handle edit requests
            console.log("EDIT GROUP ACTION: " + action + ", " + JSON.stringify(req.params));
            model.editActionIndex(access, action, type, req.body, function (result) {
                edit_group_callback(req, res, access, gid);
            });
        }
        else
            edit_group_callback(req, res, access, gid);
    });
});

//Added to minimize repeated code.
function edit_group_callback(req, res, access, gid) {

    model.getGroupInfo(gid, function (groupInfo) {
        if (access.GROUP_EDITING == 1) {
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
            res.redirect('/group/' + gid);
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