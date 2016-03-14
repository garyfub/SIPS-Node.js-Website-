//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var shortid = require('shortid');
var moment = require('moment');

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
    //Invites
    generateInvite: generateInvite,
    inviteAdmin: inviteAdmin,
    getAdmins: getAdmins,
    //Edit Admin
    removeAdmin: removeAdmin

}

//Creates new group
function createGroup(name, orgID, callback) {

    var groupID = shortid.generate();
    //console.log(name + ", " + orgID + ", " + JSON.stringify(callback, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into GROUPS (groupID, group_name, invite_code, organizationID) VALUES (?, ?, ?, ?)", function (err, stmt) {
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

//Deletes group that matched GroupID
function deleteGroup(groupID, callback) {

    console.log("Deleting: " + JSON.stringify(groupID, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM GROUPS WHERE groupID = \'" + groupID + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback(err);
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
                conn.close(function () {
                    return callback(err, rows);
                });
            }
        });
    });
}

function generateInvite(req, callback){
    var startDate =  moment().add(2, 'hours');
    console.log("START TIME: " + startDate);
    var code = uuid.v1();

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE ORGANIZATION SET INVITE_CODE = '" + code + "', INVITE_TIME = '" + startDate.format('x') + "' WHERE ORGANIZATIONID = \'" + req.params.orgID + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                conn.closeSync();
                return callback(false);
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback(code);
                });
            });
        });
    });
}

function inviteAdmin(req, callback){
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM ORGANIZATION WHERE ORGANIZATIONID =  \'" + req.params.orgID + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                var org = rows[0];

                if(req.params.code == org["INVITE_CODE"]) {
                    console.log("INVITE_TIME_ORIGINAL: " + org["INVITE_CODE"] );
                    var b = moment("'"+ org["INVITE_TIME"]+ "'", "x");
                    var now = moment();
                    console.log("TIME DIFF: " + b.isAfter(now) + ", " + b.format('x') + "::" + now.format('x'));

                    conn.close(function () {
                        return callback(b.isAfter(now));
                    });
                }
                else conn.close(function () {
                    return callback(false);
                });
            }
        });
    });
}

function getAdmins(req, access, callback){
    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT MEMBERS.*, ROLEPERMISSIONS.*, USER.* FROM MEMBERS INNER JOIN ROLEPERMISSIONS ON Rolepermissions.role_name = MEMBERS.role_name INNER JOIN USER ON MEMBERS.USERID = USER.USERID WHERE MEMBERS.ORGANIZATIONID =  \'" + access.ORGANIZATIONID + "\' AND (MEMBERS.ROLE_NAME = 'Administrator' OR MEMBERS.ROLE_NAME = 'Head Administrator')", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                conn.closeSync();
                return callback(rows);
            }
        });
    });
}

function removeAdmin(adminID, access, callback){
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM MEMBERS WHERE USERID = \'" + adminID + "\' AND ORGANIZATIONID = \'" + access.ORGANIZATIONID + "\'", function (err, stmt) {
            if (err) {
                console.log(err);
                return conn.closeSync();
            }
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback(err);
                });
            });
        });
    });
}
