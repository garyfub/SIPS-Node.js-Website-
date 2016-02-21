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
    getAdminAccessPositions: getAdminAccessPositions,
    getGroups: getGroups
}

//Checks for user in database
function UserCheck(profile, callback) {
    var userid = profile.id;

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("select count(*) from USER WHERE UserID = \'" + userid + "\'", function (err, result, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                conn.close();
                return callback(result[0][1]);
            }
        });
    });
}

//Adds user to database after checking if they exist
function UserCreate(profile, callback) {
    console.log(JSON.stringify(profile, null, 2))
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
                        return conn.closeSync();
                    }

                    stmt.execute([userid, name_first, name_last, date], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                        }
                        else {
                            console.log("New user created");
                            result.closeSync();
                        }
                    });
                });
            }
        });
        ibmdb.close();
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
        conn.close();
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

//Retrieves data from organization table related to current user
function getAdminAccessPositions(req, callback) {
    user = req.user;
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.*, ROLEPERMISSIONS.*, ORGANIZATION.* FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name= MEMBERS.role_name INNER JOIN ORGANIZATION On ORGANIZATION.organizationid = MEMBERS.organizationid WHERE MEMBERS.userid =  \'" + user.id + "\' and MEMBERS.role_name = 'Administrator'", function (err, rows, moreResultSets) {
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

                        conn.query("SELECT GROUPID FROM GROUPS WHERE ORGANIZATIONID =  \'" + req.user.Admin[i].ORGANIZATIONID + "\'", function (err, rows, moreResultSets) {
                            if (err) {
                                console.log(err);
                            } else {
                                for (var t = 0; t < Object.keys(rows).length; t++) {
                                    admin["GROUPS"][t] = rows[t]["GROUPID"];
                                }
                                console.log("ADMIN ROW: " + JSON.stringify(req.user.Admin, null, 2));
                            }
                        });
                    }
                    return callback(req);
                }
                else {
                    req.user.Admin.GroupID = null;
                    conn.closeSync()
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
        conn.query("SELECT MEMBERS.*, ROLEPERMISSIONS.*, GROUPS.* FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name= MEMBERS.role_name INNER JOIN GROUPS On Groups.groupid = MEMBERS.groupid WHERE MEMBERS.userid =  \'" + user.id + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                console.log("GROUP ROWS: " + JSON.stringify(rows, null, 2));
                req.user.Groups = rows;
                conn.closeSync()
                return callback(req);
            }
        });
    });
}
