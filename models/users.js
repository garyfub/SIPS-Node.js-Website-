//Model for interacting with Users
var ibmdb = require('ibm_db');

var env = null;
var keySql = null;

var serviceName2 = 'SQLDB';
var newUser;
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


//TODO: Add actions for interacting with Users
module.exports = {
    UserCheck: UserCheck,
    UserCreate: UserCreate,
    isAdmin: isAdmin,
    getPositions: getPositions,
    getPermissions: getPermissions,
    getAdminAccessPositions: getAdminAccessPositions,
    getGroups: getGroups,
    appGetGroupMembers: appGetGroupMembers
}

//Checks for user in database
function UserCheck(profile, callback) {
    var userid = profile.id;

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("select count(*) from USER WHERE UserID = \'" + userid + "\'", function (err, result, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                conn.close(function () {
                    return callback(result[0][1]);
                });
            }
        });
    });
}

//Adds user to database after checking if they exist
function UserCreate(profile, callback) {
    console.log(JSON.stringify(profile, null, 2));
    var userid = profile.id;
    var name_first = profile.name.hasOwnProperty("givenName") ? profile.name.givenName : "";
    var name_last = profile.name.hasOwnProperty("familyName") ? profile.name.familyName : "";
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var date = year + "-" + month + "-" + day;


    //checks is user exists in database;
    var conn1 = ibmdb.openSync(dsnString);
    var obj = conn1.querySync("select count(*) from USER WHERE UserID = \'" + userid + "\'");
    newUser = obj[0][1];

    conn1.closeSync();

    //Inserts new user if doesn't exist
    if (newUser == 0 || newUser == "0") {
        console.log("New User Create: " + userid);
        console.log("First name: " + name_first);
        console.log("Last name: " + name_last);
        console.log("Date: " + date);

        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                return false;
            } else {
                conn.prepare("INSERT INTO USER (UserID, name_first, name_last, dateAdded) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        //return conn.closeSync();
                    }

                    stmt.execute([userid, name_first, name_last, date], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                            conn.closeSync();
                        }
                        else {
                            console.log("New user created");
                            conn.closeSync();
                        }
                    });
                });
            }
        });
    }
    else console.log("User exists");

    return callback(newUser);
}

//Checks if user is an Admin and then retrieves Admin info if applicable
function isAdmin(profile, callback) {
    var userid = profile.id;
    var admin = null;
    var isAdmin = 0;
    var conn = ibmdb.openSync(dsnString);
    var results = null;

    try {
        console.log("Admin - Check");
        //checks is user exists in database;
        var obj = conn.querySync("select COUNT(*) from Members WHERE UserID = \'" + userid + "\' AND ROLE_NAME = 'Administrator'");

        isAdmin = obj[0][1];

        results = isAdmin;
        if (isAdmin > 0) {
            obj2 = conn.querySync("select * from Members WHERE UserID = \'" + userid + "\' AND ROLE_NAME = 'Administrator'");
            admin = obj2[0];
            admin['check'] = isAdmin;
            results = admin;
        }
        conn.closeSync();
    } catch (e) {
        console.log(e.message);
    }
    return callback(results); //return 0 if user is an admin, returns json object if user is an admin.

}

//Retrieves list of all groups a user is related to and the subsequent permissions for each one
function getPositions(req, callback) {
    getAdminAccessPositions(req, function (req) {
        getGroups(req, function (req) {
            return callback(req);
        });
    });


}

/**
 * Retrieves user's permissions for a specific group or organization.
 *
 * Admin check: If user is an admin then a check is made to see if the group is under the Organization(s) the Admin is under.
 *  If yes then the group member check will be skipped
 * Group Member check: If user is a group member then the permissions for that will be returned
 * @param user
 * @param groupID
 * @param callback
 * @returns {*}
 */
function getPermissions(user, idNum, callback) {
    var permissions = {};
    var isAdmin = false;

    //console.log("USER" + JSON.stringify(user, null, 2));
    //Admin Check
    for (var i = 0; i < Object.keys(user.Admin).length; i++) {
        //if idNum matches the id of an organization
        if (user.Admin[i]['ORGANIZATIONID'] == idNum) {
            permissions = user.Admin[i];
            isAdmin = true;
            break;
        }
        //Check each organization's group to find matching groupID
        for (var t = 0; t < Object.keys(user.Admin[i].GROUPS).length; t++) {
            if (user.Admin[i].GROUPS[t]['GROUPID'] == idNum) {
                permissions = user.Admin[i];
                isAdmin = true;
                break;
            }
        }
    }

    //Member Check
    if (!isAdmin) {
        for (var i = 0; i < Object.keys(user.Groups).length; i++) {
            if (user.Groups[i]['GROUPID'] == idNum) {
                permissions = user.Groups[i];
                break;
            }
        }
    }
    return callback(permissions);
}

//Retrieves data from organization table related to current user
function getAdminAccessPositions(req, callback) {
    user = req.user;
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.*, ROLEPERMISSIONS.*, ORGANIZATION.* FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name= MEMBERS.role_name INNER JOIN ORGANIZATION On ORGANIZATION.organizationid = MEMBERS.organizationid WHERE ORGANIZATION.ORGANIZATIONID != 'any' and MEMBERS.userid =  \'" + user.id + "\' and (MEMBERS.role_name = 'Administrator' OR MEMBERS.role_name = 'Head Administrator')", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                req.user.isAdmin = Object.keys(rows).length > 0 ? 1 : 0;
                req.user.Admin = rows;
                if (req.user.isAdmin == 1) {
                    //retrieve list of group id's within each Organization under req.user.Admin and adds them to a nested object GroupID.
                    for (var i = 0; i < Object.keys(req.user.Admin).length; i++) {
                        var admin = req.user.Admin[i];
                        admin.GROUPS = {};
                        groups = admin.GROUPS;
                        gRows = conn.querySync("SELECT GROUPID, GROUP_NAME FROM GROUPS WHERE ORGANIZATIONID =  \'" + req.user.Admin[i].ORGANIZATIONID + "\'");
                        for (var t = 0; t < Object.keys(gRows).length; t++) {
                            admin["GROUPS"][t] = {};
                            admin["GROUPS"][t]["GROUPID"] = gRows[t]["GROUPID"];
                            admin["GROUPS"][t]["GROUP_NAME"] = gRows[t]["GROUP_NAME"];
                        }
                         console.log("ADMIN ROW: " + JSON.stringify(req.user.Admin, null, 2));
                    
                    }
                    conn.close(function () {
                        return callback(req);
                    });
                }
                else {
                    req.user.Admin.GroupID = null;
                    conn.closeSync();
                    return callback(req);
                }
            }
        });
    });
}


//retrieves all groups and group positions connected to user
function getGroups(req, callback) {
    user = req.user;
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.*, ROLEPERMISSIONS.*, GROUPS.*, ORGANIZATION.org_name FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name= MEMBERS.role_name INNER JOIN GROUPS On Groups.groupid = MEMBERS.groupid INNER JOIN Organization ON GROUPS.organizationid = ORGANIZATION.organizationid WHERE MEMBERS.userid =  \'" + user.id + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);

            } else {
                console.log("GROUP ROWS: " + JSON.stringify(rows, null, 2));
                req.user.Groups = rows;
                conn.closeSync();
                return callback(req);
            }
        });
    });
}

//Retrieves group members and places them within the req.user.Admin.GROUPS object in the corresponding sub-object for the group
function appGetGroupMembers(req, callback) {
    ibmdb.open(dsnString, function (err, conn) {
        if(err) {
            console.log(err);
            return callback(req);
        }

        //console.log("CHECK: " + JSON.stringify(req.user, null, 2));

        var adminLength = Object.keys(req.user.Admin).length;
        var gLength = Object.keys(req.user.Groups).length;

        var dateObj = new Date();
        var currentDate = dateObj.getUTCFullYear() + "-" + (dateObj.getUTCMonth() + 1) + "-" + dateObj.getUTCDate();

        for(var y = 0; y < gLength; y++){
            var groups = req.user.Groups;
            var group = groups[y];
           
            if(group["GROUP_TEST"] == 1) {
                group["Members"] = {};
                
                //Add Members
                var mRows = conn.querySync("SELECT USER.*, MEMBERS.*, ROLEPERMISSIONS.* FROM MEMBERS INNER JOIN USER ON USER.userid = MEMBERS.userid INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name = MEMBERS.role_name WHERE MEMBERS.groupid =  \'" + group["GROUPID"] + "\'");
                group["Members"] = mRows;

                //Add Sessions
                var sRows = conn.querySync("SELECT * FROM SESSIONS WHERE groupid =  \'" + group["GROUPID"] + "\' AND \'" + currentDate + "\' BETWEEN start_date AND end_date");
                console.log("SESSIONS: " + JSON.stringify(sRows, null, 2));
                group["Sessions"] = sRows;
                
                console.log("HAS GROUP TEST PERMISSIONS" + JSON.stringify(group, null, 2));
            }
        }

        //return if not an admin
        if(req.user["isAdmin"] == 0) {
            return callback(req);
        }

        for (var i = 0; i < adminLength; i++) {
            admin = req.user["Admin"][i];


            groups = admin.GROUPS;
            groupLength = Object.keys(groups).length;
            for (var t = 0; t < groupLength; t++) {
                group = groups[t + ""];
                //console.log("GROUP: " + t);

                //Add Group Members
                var rows = conn.querySync("SELECT USER.*, MEMBERS.*, ROLEPERMISSIONS.* FROM MEMBERS INNER JOIN USER ON USER.userid = MEMBERS.userid INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name = MEMBERS.role_name WHERE MEMBERS.groupid =  \'" + group["GROUPID"] + "\'");
                        group["Members"] = rows;

                //Add Group Sessions
                var sRows = conn.querySync("SELECT * FROM SESSIONS WHERE groupid =  \'" + group["GROUPID"] + "\' AND \'" + currentDate + "\' BETWEEN start_date AND end_date");
                console.log("SESSIONS: " + JSON.stringify(sRows, null, 2));
                group["Sessions"] = sRows;
                
                        //console.log("//QUERY MADE//" );
                        if (i == (adminLength-1) && t == (groupLength-1)) {

                           // console.log("EXIT CHECK: GROUP: " + t + " of " + (groupLength - 1) + " Org: " + i + " of " + adminLength);
                           // console.log("CALLBACK CALLED");
                            conn.close(function () {
                                return callback(req);
                            });
                        }
            }
        }
    });
}