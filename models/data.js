/**
 *Model for pulling result data
 */
//Model for Forms
var qs = require('qs');
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
    getUserTaskList: getUserTaskList,
    getUserTaskData: getUserTaskData
}

//Adds form entry to FORMENTYLIST table and calls appropriate function to insert form data into db
function getUserTaskList(req) {
    var userid = req.user.id;
    var results = null;
    try {
        var conn = ibmdb.openSync(dsnString);
        results = conn.querySync("select * from TASKENTRYLIST WHERE USERID = \'" + userid + "\'");

    } catch (e) {
        console.log(e.message);
    }
    console.log("Task Entry RESULTS: " + JSON.stringify(results, null, 2));
    return results;
}


function getUserTaskData(req) {
    var taskID = String(req.body.taskID);
    var results = null;
    console.log("taskID = " + taskID);
    try {
        var conn = ibmdb.openSync(dsnString);
        results = conn.querySync("select ACCELX, ACCELY, ACCELZ, ACCELTIMESTAMP, GYROX, GYROY, GYROZ, GYROTIMESTAMP, MAGX, MAGY, MAGZ, MAGTIMESTAMP from APPSENSORDATA WHERE TASKENTRYID = \'" + taskID + "\'");

    } catch (e) {
        console.log(e.message);
    }
    return results;
}



