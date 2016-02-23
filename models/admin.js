//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var shortid = require('shortid');

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
    //Groups
    createGroup: createGroup,
    deleteGroup: deleteGroup,
    getGroups: getGroups,
    getGroupUsers: getGroupUsers,
    //Permissions
    getGroupPositions: getGroupPositions,
    getUserAccessPermissions: getUserAccessPermissions,
    //Group Users
    groupRemoveUser: groupRemoveUser,
    //Group Positions
    groupRemovePosition: groupRemovePosition,
    groupCreatePosition: groupCreatePosition,
    groupUpdatePosition: groupUpdatePosition
}

//Creates new group
function createGroup(name, orgID, callback) {

    var groupID = uuid.v1();
    //console.log(name + ", " + orgID + ", " + JSON.stringify(callback, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into GROUPS (groupID, name, invite_code, organizationID) VALUES (?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute([groupID, name, shortid.generate(), orgID], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback(err, result);
                });


            });
        });
    });

};

//Retrieves list of groups
function getGroups(orgID, callback) {

    // console.log(orgID + ", " + JSON.stringify(callback, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM GROUPS WHERE ORGANIZATIONID =  \'" + orgID + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                //return results
                return callback(err, rows);
            }
        });
    });

};

//Deletes group that matched GroupID
function deleteGroup(groupID, callback) {

    console.log("Deleting: " + JSON.stringify(groupID, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM GROUPS WHERE groupID = \'" + groupID + "\'", function (err, stmt) {
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
};


/**
 * Retrieves list of users in the group from the id used.
 * Retrieves user's names from User table via inner join.
 * @param groupID
 * @param getPos
 * @param callback
 */
function getGroupUsers(groupID, getPos, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.role_name, MEMBERS.userid, USER.name_first, USER.name_last FROM MEMBERS INNER JOIN USER ON MEMBERS.userid = USER.userid WHERE GROUPID =  \'" + groupID + "\' ORDER BY USER.name_first;", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
                return false;
            } else {
                //return results
                if (getPos == 1) {
                    return getGroupPositions(groupID, rows, callback);
                }
                else {
                    var result = {};
                    result['users'] = rows;
                    conn.closeSync();
                    return callback(result);
                }
            }
        });
    });
}

/**
 * Retrieve Group role positions and their respective permissions
 * Attaches to getGroupUsers() if getPerms = 1
 * @param groupID
 * @param users
 * @param callback
 */
function getGroupPositions(groupID, users, callback) {
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM ROLEPERMISSIONS WHERE GROUPID =  \'" + groupID + "\' OR GROUPID IS NULL ORDER BY ROLEPERMISSIONS.ROLE_NAME", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
                return false;
            } else {
                //return results
                var result = {};
                if (users !== undefined) {
                    result['pos'] = rows;
                    result['users'] = users;
                    return callback(result);
                }
                else
                    return callback(rows);
            }
        });
    });
}

/**
 * ACCESS PERMISSIONS
 *Returns all roles and permissions connected to the user ID
 *
 * optional: get role and permissions for specific group if groupID isn't null.
 */
function getUserAccessPermissions(groupID, userID, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        if (groupID != null) {//Returns user positions for specified groupID
            conn.query("SELECT GROUPS.name, GROUPS.invite_code, MEMBERS.role_name, ROLEPERMISSIONS.VIEW_ORG_ADMIN_DASH, ROLEPERMISSIONS.group_creation, ROLEPERMISSIONS.group_editing, ROLEPERMISSIONS.remove_users, ROLEPERMISSIONS.view_group_results, ROLEPERMISSIONS.give_tests, ROLEPERMISSIONS.organizationID FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON MEMBERS.role_name = ROLEPERMISSIONS.role_name INNER JOIN GROUPS ON MEMBERS.GROUPID = GROUPS.GROUPID WHERE (ROLEPERMISSIONS.GROUPID =  \'" + groupID + "\' OR ROLEPERMISSIONS.GROUPID IS NULL) and USERID =  \'" + userID + "\';", function (err, rows, moreResultSets) {
                if (err) {
                    console.log(err);
                    return false;
                } else {
                    return callback(rows);
                }
            });
        }
        else {//Returns all positions/permissions the user has
            conn.query("SELECT MEMBERS.role_name, ROLEPERMISSIONS.groupID, ROLEPERMISSIONS.VIEW_ORG_ADMIN_DASH, ROLEPERMISSIONS.group_creation, ROLEPERMISSIONS.group_editing, ROLEPERMISSIONS.remove_users, ROLEPERMISSIONS.view_group_results, ROLEPERMISSIONS.give_tests, ROLEPERMISSIONS.organizationID FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON MEMBERS.role_name = ROLEPERMISSIONS.role_name WHERE USERID =  \'" + userID + "\';", function (err, rows, moreResultSets) {
                if (err) {
                    console.log(err);
                    return false;
                } else {
                    return callback(rows);
                }
            });

        }
    });

}

/**
 * Group
 * Remove user
 */
function groupRemoveUser(groupID, userID, callback) {

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


/////
//POSITIONS
/////


/**
 * Group
 * Remove position
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

/**
 * Adds new entry to RolePermissions table with the supplied groupID
 * @param groupID
 * @param positionData
 * @param callback
 */
function groupCreatePosition(data, callback){

    console.log("POSITION CREATE: " + JSON.stringify(data, null, 2));

    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

        if(!obj.hasOwnProperty('adminAccess')){
            obj.adminAccess = 0;
        }
        if(!obj.hasOwnProperty('editGroup')){
            console.log("NO editGroup FOUND!!");
            obj.editGroup = 0;
        }
        if(!obj.hasOwnProperty('removeUsers')){
            obj.removeUsers = 0;
        }
        if(!obj.hasOwnProperty('viewGroup')){
            obj.viewGroup = 0;
        }
        if(!obj.hasOwnProperty('giveTests')){
            obj.giveTests = 0;
        }
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into ROLEPERMISSIONS (organizationID, groupID, Role_name, view_Org_Admin_Dash, Group_Editing, Remove_users, View_Group_Results, Give_Tests, GROUP_CREATION) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statement asynchronously
            stmt.execute([obj.orgID, data.groupID, obj.positionTitle, obj.adminAccess, obj.editGroup, obj.removeUsers, obj.viewGroup, obj.giveTests, -1], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

function groupUpdatePosition(data, callback){

    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

    if(!obj.hasOwnProperty('adminAccess')){
        obj.adminAccess = 0;
    }
    if(!obj.hasOwnProperty('editGroup')){
        console.log("NO editGroup FOUND!!");
        obj.editGroup = 0;
    }
    if(!obj.hasOwnProperty('removeUsers')){
        obj.removeUsers = 0;
    }
    if(!obj.hasOwnProperty('viewGroup')){
        obj.viewGroup = 0;
    }
    if(!obj.hasOwnProperty('giveTests')){
        obj.giveTests = 0;
    }
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE ROLEPERMISSIONS SET (Role_name, view_Org_Admin_Dash, Group_Editing, Remove_users, View_Group_Results, Give_Tests) = VALUES ( ?, ?, ?, ?, ?, ?) WHERE GROUPID = \'" + groupID + "\' AND ORGANIZATIONID = \'" + obj.orgID + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statement asynchronously
            stmt.execute([obj.positionTitle, obj.adminAccess, obj.editGroup, obj.removeUsers, obj.viewGroup, obj.giveTests], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}