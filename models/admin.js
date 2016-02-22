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
    createGroup: createGroup,
    getGroups: getGroups,
    deleteGroup: deleteGroup,
    getGroupUsers: getGroupUsers,
    getGroupPositions: getGroupPositions,
    getUserAccessPermissions: getUserAccessPermissions,
    groupRemoveUser: groupRemoveUser,
    groupRemovePosition: groupRemovePosition,
    groupCreatePosition: groupCreatePosition
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

/**
 * Group
 * Remove position
 */
function groupRemovePosition(groupID, position, callback) {

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
                    return callback(err);
                });
            });
        });
    });

    return callback();
}


/**
 * Adds new entry to RolePermissions table with the supplied groupID
 * @param groupID
 * @param positionData
 * @param callback
 */
//TODO: Add Organization ID, double check database entry is working fully.
function groupCreatePosition(groupID, data, callback){
   console.log("CREATE-POSITION: " + JSON.stringify(data, null, 2));

    console.log("CREATE-POSITION-KEYS: " + Object.keys(data));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into ROLEPERMISSIONS (organizationID, groupID, Role_name, view_Org_Admin_Dash, Group_Editing, Remove_users, View_Group_Results, Give_Tests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(["", data.groupID, data["data[positionTitle]"], data["data[adminAccess]"], data["data[editGroup]"], data["data[removeUsers]"], data["data[viewGroup]"], data["data[giveTests]"]], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback;
                });
            });
        });
    });


}