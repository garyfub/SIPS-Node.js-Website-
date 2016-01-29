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
    UserCreate:UserCreate,
    isAdmin: isAdmin,
    isNewUser:isNewUser
}

    //Checks for user in database
function UserCheck(profile) {
            var userid = profile.id;

        var conn = ibmdb.openSync(dsnString);

        try {
            //checks is user exists in database;
            var obj = conn.querySync("select count(*) from USER WHERE UserID = \'" + userid + "\'");
            str = JSON.stringify(obj, null, 2);
            newUser = str.charAt(15);
            conn.close();
        } catch (e) {
            console.log(e.message);
        }
        return newUser;

    }

    //Adds user to database after checking if they exist
function UserCreate(profile) {
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
        str = JSON.stringify(obj, null, 2);
        newUser = str.charAt(15);

        conn1.closeSync();
        console.log("New user?: " + newUser);

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

        return newUser;
    }

function isAdmin(profile){
    var userid = profile.id;

    var conn = ibmdb.openSync(dsnString);

    try {
        console.log("User - Check");
        //checks is user exists in database;
        var obj = conn.querySync("select count(*) from ADMIN WHERE gUserID = \'" + userid + "\'");
        str = JSON.stringify(obj, null, 2);
        isAdmin = str.charAt(15);

        conn.close();
    } catch (e) {
        console.log(e.message);
    }
    return isAdmin > 0 ? 1 : 0; //return 1 if user is an admin

}

    //Returns 0 if user id is not in database, 1 if located
    //Must be run after UserCheck()
    function isNewUser() {
        return newUser;
    }