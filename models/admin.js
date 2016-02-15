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


//TODO: Add actions for interacting with Users
module.exports = {
    createGroup: createGroup,
    getGroups: getGroups,
    deleteGroup: deleteGroup
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
