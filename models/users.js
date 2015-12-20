//Model for interacting with Users
var ibmdb = require('ibm_db');

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
    //Checks for user in database
    UserCheck: function (profile) {
        var userid = profile.email;
        var check = false;

        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                check = false;
            } else {
                console.log("User - Check");
                check = true;
            }
        });


        return check;
    },
    //Adds user to database
    UserCreate: function (profile) {

        var userid = profile.email;
        var name_first = profile.name.givenName;
        var name_last = profile.name.familyName;

        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1;
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        var date = year + "-" + month + "-" + day;
      //  var date = null; //new Date().toISOString().slice(0, 19).replace('T', ' ');


        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                return false;
            } else {
                console.log("User - Check: " + userid);

                //checks is user exists in database;
                var obj = conn.querySync("select count(*) from USER WHERE UserID = \'" + userid + "\'");
                str = JSON.stringify(obj, null, 2)
                newUser = str.charAt(15);
                console.log("New user?: position " + newUser + " of " + str.length);

                //Inserts new user if doesn't exist
                if (newUser == 0 || newUser == "0") {
                    console.log("New User Create: " + userid);
                    console.log("First name: " + name_first);
                    console.log("Last name: " + name_last);
                    console.log("Date: " + date);


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
                else console.log("User exists");
            }
        });

    },
    //Edits a User's profile info
    UserEdit: function (profile) {
        //TODO
    },
    //Deletes a User
    UserDelete: function (profile) {
        //TODO
    }
};