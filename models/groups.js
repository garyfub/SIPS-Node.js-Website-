//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');

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
    getGroups: getGroups,
    inviteCode: inviteCode
}


/**
 * Retrieves list of groups user is in
 * TODO: Add query to GroupMember table to find groups user is connected to
 */
function getGroups(userID, callback) {
/*
    console.log(orgID + ", " + JSON.stringify(callback, null, 2));
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
    */

}

/**
 * Checks if submitted code is an active group invitation code.
 * Adds user to group if connection is found
 */

function inviteCode(req, callback){
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
            } else{
                console.log("RESULT: " + JSON.stringify(rows,null,2));
                if(Object.keys(rows).length == 0){ //if no results
                    return callback(true);
                }

                //Add user to single group if code is valid
                conn.prepare("insert into Members (role_name, UserID, GROUPID, DATEADDED) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log(err);
                        conn.closeSync()
                        return callback(err);
                    }
                    stmt.execute(["Pending", userid, rows[0].GROUPID, date], function (err, result) {
                        if (err){
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
