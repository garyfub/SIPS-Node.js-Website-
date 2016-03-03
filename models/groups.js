//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var model = require('../models/groups');

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
    //Group Invite Code actions
    inviteCode: inviteCode,
    //Group Information
    getGroupInfo: getGroupInfo,
    groupUpdateInfo: groupUpdateInfo,
    //Members
    getGroupUsers: getGroupUsers,
    groupUpdateMember: groupUpdateMember,
    groupRemoveUser: groupRemoveMember,
    //Positions
    getGroupPositions: getGroupPositions,
    groupCreatePosition: groupCreatePosition,
    groupUpdatePosition: groupUpdatePosition,
    groupRemovePosition: groupRemovePosition,
    //Sessions
    getGroupSessions: getGroupSessions,
    groupCreateSession: groupCreateSession,
    groupUpdateSession: groupUpdateSession,
    groupRemoveSession: groupRemoveSession,
    //Group Action Index
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

//Retrieves group info
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

//Updates group information in Groups table
function groupUpdateInfo(data, callback) {
    //console.log("UPDATE GROUP INFO: " + JSON.stringify(data, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE GROUPS SET GROUP_NAME = \'" + data.group_name + "\' WHERE GROUPID = \'" + data.groupID + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

/****************
 *
 * USERS
 *
 ***************/

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
 * Update member
 * @param data
 * @param callback
 */
function groupUpdateMember(data, callback) {
    var obj = JSON.parse(data.data);
    console.log("UPDATE USER: " + JSON.stringify(obj, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE MEMBERS SET ROLE_NAME = \'" + obj.position + "\' WHERE USERID = \'" + obj.userid + "\' AND GROUPID = \'" + data.groupID + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }
            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

/**
 * Remove Member
 * @param groupID
 * @param userID
 * @param callback
 */
function groupRemoveMember(groupID, userID, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM MEMBERS WHERE groupID = \'" + groupID + "\' AND userID = \'" + userID + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback(err);
                });
            });
        });
    });
}


/******************
 *
 * POSITIONS
 *
 ******************/

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


/**
 * Adds new entry to RolePermissions table with the supplied groupID
 * @param groupID
 * @param positionData
 * @param callback
 */
function groupCreatePosition(data, callback) {

    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

    if (!obj.hasOwnProperty('groupEdit')) {
        obj.groupEdit = 0;
    }
    if (!obj.hasOwnProperty('groupSessions')) {
        obj.groupSessions = 0;
    }
    if (!obj.hasOwnProperty('groupMembers')) {
        obj.groupMembers = 0;
    }
    if (!obj.hasOwnProperty('groupPositions')) {
        obj.groupPos = 0;
    }
    if (!obj.hasOwnProperty('groupResults')) {
        obj.groupResults = 0;
    }
    if (!obj.hasOwnProperty('groupTests')) {
        obj.groupTests = 0;
    }
    //console.log("Create POSITION: " + JSON.stringify(obj, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into ROLEPERMISSIONS (organizationID, groupID, Role_name, Group_Editing, Group_Sessions, Group_Members, Group_Positions, Group_Results, Group_Test, org_initial, org_groupCreate, org_groupDelete, org_editAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute([obj.orgID, data.groupID, obj.positionTitle, obj.groupEdit, obj.groupSessions, obj.groupMembers, obj.groupPositions, obj.groupResults, obj.groupTests, -1, -1, -1, -1], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

function groupUpdatePosition(data, callback) {
    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

    if (!obj.hasOwnProperty('groupEdit')) {
        obj.groupEdit = 0;
    }
    if (!obj.hasOwnProperty('groupSessions')) {
        obj.groupSessions = 0;
    }
    if (!obj.hasOwnProperty('groupMembers')) {
        obj.groupMembers = 0;
    }
    if (!obj.hasOwnProperty('groupPositions')) {
        obj.groupPositions = 0;
    }
    if (!obj.hasOwnProperty('groupResults')) {
        obj.groupResults = 0;
    }
    if (!obj.hasOwnProperty('groupTests')) {
        obj.groupTests = 0;
    }
    //console.log("UPDATE POSITION: " + JSON.stringify(obj, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE ROLEPERMISSIONS SET  GROUP_EDITING= \'" + obj.groupEdit + "\', GROUP_SESSIONS= \'" + obj.groupSessions + "\', GROUP_MEMBERS= \'" + obj.groupMembers + "\' , GROUP_POSITIONS = \'" + obj.groupPositions + "\' , GROUP_RESULTS= \'" + obj.groupResults + "\' , GROUP_TEST= \'" + obj.groupTests + "\' WHERE GROUPID = \'" + groupID + "\' AND ROLE_NAME = \'" + obj.positionTitle + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

/**
 * Removes specified position from group
 * @param data
 * @param callback
 */
function groupRemovePosition(data, callback) {

    var groupID = data.groupID;
    var position = data.data;
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM ROLEPERMISSIONS WHERE groupID = \'" + groupID + "\' AND ROLE_NAME = \'" + position + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}


/***************
 *
 * SESSIONS
 *
 **************/

/**
 * Retrieves Group Sessions
 * @param groupID
 * @param callback
 */
function getGroupSessions(groupID, callback) {
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
 * Creates new Session entry for group
 * @param req
 * @param callback
 */
function groupCreateSession(req, callback) {

    var obj = JSON.parse(req.body.data);
    var sessionID  = uuid.v1();
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    var date = year + "-" + month + "-" + day;

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into SESSIONS (SESSIONID, SESSION_DESC, START_DATE, END_DATE, SESSION_TYPE, CREATEDBY, GROUPID, DATEADDED) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute([sessionID, obj.session_desc, obj.start_date, obj.end_date, obj.session_type, req.user.id, req.body.groupID, date ], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

function groupUpdateSession(req, callback) {
    var groupID = req.body.groupID;
    var obj = JSON.parse(req.body.data);
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE SESSIONS SET  SESSION_DESC= \'" + obj.session_desc + "\', START_DATE= \'" + obj.start_date  + "\', END_DATE= \'" + obj.end_date + "\' , SESSION_TYPE = \'" + obj.session_type + "\' WHERE GROUPID = \'" + groupID + "\' AND SESSIONID = \'" + obj.sessionID + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

function groupRemoveSession(req, callback) {
    var groupID = req.body.groupID;
    var session = req.body.data;
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM SESSIONS WHERE groupID = \'" + groupID + "\' AND SESSIONID = \'" + session + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
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
function editActionIndex(access, action, type, req, callback) {
    console.log("GROUP EDITING INITIATED: " + action + " " + type);
    var data = req.body;
    switch (action) {
        //REMOVE
        case 'remove':
            if (type == "user") {
                groupRemoveMember(data.groupID, data.data, function () {
                    return callback(true);
                });
            }
            else if (type == "position") {
                groupRemovePosition(data, function () {
                    return callback(true);
                })
            }
            else if (type == "session") {
                groupRemoveSession(req, function(){
                    return callback(true);
                })
            }
            break;
        //ADD
        case 'add':
            if (type == "position") {
                groupCreatePosition(data, function () {
                    return callback(true);
                });
            }
            else if (type == 'session') {
                groupCreateSession(req, function(){
                    return callback(true);
                })
            }
            break;
        //UPDATE
        case 'update':
            if (type == "user") {
                groupUpdateMember(data, function () {
                    return callback(true);
                });
            }
            else if (type == "position") {
                groupUpdatePosition(data, function () {
                    return callback(true);
                });
            }
            else if (type == "group") {
                groupUpdateInfo(data, function () {
                    return callback(true);
                });
            }
            else if (type == "session") {
                groupUpdateSession(req, function(){
                    return callback(true);
                })
            }
            break;

        default:
            return callback(true);
            break;
    }
}
