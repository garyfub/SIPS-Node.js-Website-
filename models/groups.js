//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var models_admin = require('../models/admin');

var env = null;
var keySql = null;

var serviceName2 = 'SQLDB';

//VCAP_SERVICES
function findKey(obj, lookup) {
    for (var i in obj) {
        if (typeof(obj[i]) === "object") {
            if (i.toUpperCase().indexOf(lookup) > -1) {
                // Found the key
                return i;
            }
            findKey(obj[i], lookup);
        }
    }
    return -1;
}
if (process.env.VCAP_SERVICES) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    keySql = findKey(env, serviceName2);
}

//Get Bluemix SQL Database account credentials
var credentialsSQL = env[keySql][0].credentials;
var dsnString = "DRIVER={DB2};DATABASE=" + credentialsSQL.db + ";UID=" + credentialsSQL.username + ";PWD=" +
    credentialsSQL.password + ";HOSTNAME=" + credentialsSQL.hostname + ";port=" + credentialsSQL.port;


module.exports = {
    inviteCode: inviteCode,
    getGroupInfo: getGroupInfo,
    getGroupUsers: getGroupUsers,
    getGroupPositions: getGroupPositions,
    getGroupSessions: getGroupSessions,
    editActionIndex: editActionIndex
}

function inviteCode(req, callback) {
    var code = req.body.code_insert;
    var userid = req.user.id;
    console.log("InviteCode: " + code + ", " + userid);

    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var date = year + "-" + month + "-" + day;

    ibmdb.open(dsnString, function (err, conn) {


        conn.query("SELECT GROUPID FROM GROUPS WHERE invite_code =  \'" + code + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
                return callback(err)
            } else {
                //console.log("RESULT: " + JSON.stringify(rows,null,2));
                if (Object.keys(rows).length == 0) { //if no results
                    return callback(true);
                }

                //Add user to single group if code is valid
                conn.prepare("insert into Members (role_name, UserID, GROUPID, DATEADDED) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log(err);
                        conn.closeSync();
                        return callback(err);
                    }
                    stmt.execute(["Pending", userid, rows[0].GROUPID, date], function (err, result) {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        else conn.close(function () {
                            return callback(err);
                        });
                    });
                });
            }
        });
    });
}


function getGroupInfo(groupID, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM GROUPS WHERE GROUPID =  \'" + groupID + "\'", function (err, group, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                //return results
                var result = {};
                getGroupUsers(groupID, function (users) {
                    getGroupPositions(groupID, function (pos) {
                        getGroupSessions(groupID, function (sessions) {
                            result['info'] = group[0];//single result
                            result['pos'] = pos;
                            result['users'] = users;
                            result['sessions'] = sessions;
                            conn.closeSync();
                            return callback(result);
                        });
                    });
                });
            }
        });
    });
}

/**
 * Retrieves list of users in the group from the id used.
 * Retrieves user's names from User table via inner join.
 * @param groupID
 * @param callback
 */
function getGroupUsers(groupID, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.role_name, MEMBERS.userid, USER.name_first, USER.name_last FROM MEMBERS INNER JOIN USER ON MEMBERS.userid = USER.userid WHERE GROUPID =  \'" + groupID + "\' ORDER BY USER.name_first;", function (err, users, moreResultSets) {
            if (err) {
                console.log(err);
                return false;
            } else {
                conn.closeSync();
                return callback(users);
            }
        });
    });
}

/**
 * Retrieve Group role positions and their respective permissions
 * @param groupID
 * @param callback
 */
function getGroupPositions(groupID, callback) {
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM ROLEPERMISSIONS WHERE GROUPID =  \'" + groupID + "\' OR GROUPID IS NULL ORDER BY ROLEPERMISSIONS.ROLE_NAME", function (err, pos, moreResultSets) {
            if (err) {
                console.log(err);
                return false;
            } else {
                return callback(pos);
            }
        });
    });
}

function getGroupSessions(groupID, callback){
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM SESSIONS WHERE GROUPID =  \'" + groupID + "\'", function (err, sessions, moreResultSets) {
            if (err) {
                console.log(err);
                return false;
            } else {
                return callback(sessions);
            }
        });
    });
}


/**
 * Index for Group Editing actions
 * @param access
 * @param action
 * @param type
 * @param data
 * @param callback
 * @returns {*}
 */
function editActionIndex(access, action, type, data, callback) {
    console.log("GROUP EDITING INITIATED: " + action + " " + type);

    switch (action) {
        //REMOVE
        case 'remove':
            if (type == "user") {
                models_admin.groupRemoveUser(data.groupID, data.data, function () {
                    return callback(true);
                });
            }
            else if (type == "position") {
                models_admin.groupRemovePosition(data, function () {
                    return callback(true);
                })
            }
            else if (type == "session") {
                //TODO: remove Session
            }
            break;
        //ADD
        case 'add':
            if (type == "position") {
                models_admin.groupCreatePosition(data, function () {
                    return callback(true);
                });
            }
            else if (type == 'session') {
                //TODO: Add Session
            }
            break;
        //UPDATE
        case 'update':
            if (type == "user") {
                models_admin.groupUpdateUser(data, function () {
                    return callback(true);
                });
            }
            else if (type == "position") {
                models_admin.groupUpdatePosition(data, function () {
                    return callback(true);
                });
            }
            else if (type == "group") {
                models_admin.groupUpdateInfo(data, function () {
                    return callback(true);
                });
            }
            else if (type == "session") {
                //TODO: Update Session
            }
            break;

        default:
            return callback(true);
            break;
    }
}
