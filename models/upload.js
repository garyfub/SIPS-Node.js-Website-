//Model for uploads

var Cloudant = require('cloudant');
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var qs = require('qs');

var env = null;
var key = null;
var keySql = null;

//Service to get account information for
var serviceName = 'CLOUDANTNOSQLDB';
var serviceName2 = 'SQLDB';

//VCAP_SERVICES
function findKey(obj, lookup) {
    for (var i in obj) {
        if (typeof(obj[i]) === "object") {
            if (i.toUpperCase().indexOf(lookup) > -1) {
                // Found the key
                console.log("Key was found");
                return i;
            }
            findKey(obj[i], lookup);
        }
    }
    return -1;
}
if (process.env.VCAP_SERVICES) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    key = findKey(env, serviceName);
    keySql = findKey(env, serviceName2);
}

//Get Bluemix Cloudant account credentials
var credentials = env[key][0].credentials;
var me = credentials.username;
var password = credentials.password;

//Get Bluemix SQL Database account credentials
var credentialsSQL = env[keySql][0].credentials;
var dsnString = "DRIVER={DB2};DATABASE=" + credentialsSQL.db + ";UID=" + credentialsSQL.username + ";PWD=" +
    credentialsSQL.password + ";HOSTNAME=" + credentialsSQL.hostname + ";port=" + credentialsSQL.port;


// Initialize Cloudant library.
var cloudant = Cloudant({account: me, password: password});

// Specify a cloudant database to be used
var datapoints = cloudant.db.use('sampletaskdb');

module.exports = {
    userCheckUpload: userCheckUpload, //TODO: User check part is Deprecated because users model already has a working version.
    taskDataUploadSQLMultiTable: taskDataUploadSQLMultiTable,
    taskDataUploadCloudant: taskDataUploadCloudant
}

//Checks of data is form or task data, if user exists, and then calls function based on data type
function userCheckUpload(msg) {

    var userid = msg.USERID;

    ibmdb.open(dsnString, function (err, conn) {
        if (err) {
            response.write("error: ", err.message + "<br>\n");
            response.end();
            console.log("ERROR Test of VCAP_SERVICES ERROR");
        } else {
            console.log("Test of VCAP_SERVICES");


            var obj = conn.querySync("select count(*) from USER WHERE UserID = \'" + userid + "\'");
            str = JSON.stringify(obj, null, 2)
            newUser = str.charAt(15);
            console.log("New user?: " + newUser);


            //Inserts new user if doesn't exist
            if (newUser == 0 || newUser == "0") {

                var dateObj = new Date();
                var month = dateObj.getUTCMonth() + 1;
                var day = dateObj.getUTCDate();
                var year = dateObj.getUTCFullYear();

                var date = year + "-" + month + "-" + day;

                console.log("New User Create: " + userid);
                console.log("Date: " + date);

                conn.prepare("INSERT INTO USER (UserID, dateAdded) VALUES (?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        return conn.closeSync();
                    }

                    stmt.execute([userid, date], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                        }
                        else {
                            console.log("New user created");
                            result.closeSync();

                            taskDataUploadSQLMultiTable(msg);
                        }
                    });
                });
            }
            else {
                console.log("User exists");
                //taskDataUploadCloudant(msg);
                taskDataUploadSQLMultiTable(msg);
            }
        }
    });
};

function taskDataUploadCloudant(msg) {
    var keyNames = Object.keys(msg);

    //Print out key names to verify session object loaded
    for (var i in keyNames) {
        console.log("msg." + keyNames[i] + " in WebApp");
    }
    // Insert a document into cloudant database specified above.
    datapoints.insert(msg, function (err, body, header) {
        if (err) {
            console.log('[session.insert] ', err.message);
            return false;
        }
        else {
            console.log('Insertion completed without error')
            return true;
        }
    });
};

function taskDataUploadSQLMultiTable(msg) {
    ibmdb.open(dsnString, function (err, conn) {
        if (err) {
            response.write("error: ", err.message + "<br>\n");
            response.end();
            console.log("ERROR Test of VCAP_SERVICES ERROR");
        } else {
            console.log("Test of VCAP_SERVICES");

            var taskEntryID = uuid.v1();
            var userID = msg.USERID;
            var sessionID = msg.SESSIONID;
            var userInput = msg.USERINPUT;

            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1;
            var day = dateObj.getUTCDate();
            var year = dateObj.getUTCFullYear();
            var date = year + "-" + month + "-" + day;

            var accelx = (msg.ACCELX.substring(1, msg.ACCELX.length - 1)).split(",");
            var accely = (msg.ACCELY.substring(1, msg.ACCELY.length - 1)).split(",");
            var accelz = (msg.ACCELZ.substring(1, msg.ACCELZ.length - 1)).split(",");
            var tstmpA = (msg.ACCELTIMESTAMP.substring(1, msg.ACCELTIMESTAMP.length - 1)).split(",");
            var gyrox = (msg.GYROX.substring(1, msg.GYROX.length - 1)).split(",");
            var gyroy = (msg.GYROY.substring(1, msg.GYROY.length - 1)).split(",");
            var gyroz = (msg.GYROZ.substring(1, msg.GYROZ.length - 1)).split(",");
            var tstmpG = (msg.GYROTIMESTAMP.substring(1, msg.GYROTIMESTAMP.length - 1)).split(",");
            var magx = (msg.MAGX.substring(1, msg.MAGX.length - 1)).split(",");
            var magy = (msg.MAGY.substring(1, msg.MAGY.length - 1)).split(",");
            var magz = (msg.MAGZ.substring(1, msg.MAGZ.length - 1)).split(",");
            var tstmpM = (msg.MAGTIMESTAMP.substring(1, msg.MAGTIMESTAMP.length - 1)).split(",");

            var appSensorData = accelx.length > 0 ? 1 : 0;

            var lo = 0;
            //Preparing to excecute SQL command, ? are placements for values given in the execute command
            conn.prepare("INSERT INTO TaskEntryList ( TaskEntryID, USERID, TaskNotes, appSensorData, DateAdded) VALUES ( ?, ?, ?, ?, ?)", function (err, stmt) {
                if (err) {
                    console.log(err);
                    return conn.closeSync();
                }
                stmt.execute([taskEntryID, String(userID), String(userInput), appSensorData, date], function (err, result) {
                    if (err) {
                        console.log("ERROR: " + err);
                    }
                    else {

                        //Preparing to excecute SQL command, ? are placements for values given in the execute command
                        conn.prepare("INSERT INTO AppSensorData (TaskEntryID, ACCELTIMESTAMP, ACCELX, ACCELY, ACCELZ,  GYROTIMESTAMP, GYROX, GYROY, GYROZ, MAGTIMESTAMP, MAGX, MAGY, MAGZ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
                            if (err) {
                                console.log(err);
                                return conn.closeSync();
                            }

                            console.log("SQL prepare command  - - DONE");

                            //Send data to database
                            for (var i = 0; i < tstmpA.length; i++) {
                                lo++;
                                try {
                                    //Check if values are undefined at the position, if it is defined then check if null and if so add 0
                                    if (magx[i] === 'undefined') {
                                        magx.push("0");
                                    }
                                    else {
                                        magx[i] = magx[i] != null ? magx[i] : "0";
                                    }
                                    if (magy[i] === 'undefined') {
                                        magx.push("0");
                                    }
                                    else {
                                        magy[i] = magy[i] != null ? magy[i] : "0";
                                    }
                                    if (magz[i] === 'undefined') {
                                        magz.push("0");
                                    }
                                    else {
                                        magz[i] = magz[i] != null ? magz[i] : "0";
                                    }
                                    if (tstmpM[i] === 'undefined') {
                                        tstmpM.push("0");
                                    }
                                    else {
                                        tstmpM[i] = tstmpM[i] != null ? tstmpM[i] : "0";
                                    }
                                    if (gyrox[i] === 'undefined') {
                                        gyrox.push("0");
                                    }
                                    else {
                                        gyrox[i] = gyrox[i] != null ? gyrox[i] : "0";
                                    }
                                    if (gyroy[i] === 'undefined') {
                                        gyroy.push("0");
                                    }
                                    else {
                                        gyroy[i] = gyroy[i] != null ? gyroy[i] : "0";
                                    }
                                    if (gyroz[i] === 'undefined') {
                                        gyroz.push("0");
                                    }
                                    else {
                                        gyroz[i] = gyroz[i] != null ? gyroz[i] : "0";
                                    }
                                    if (tstmpG[i] === 'undefined') {
                                        tstmpG.push("0");
                                    }
                                    else {
                                        tstmpG[i] = tstmpG[i] != null ? tstmpG[i] : "0";
                                    }
                                    if (accelx[i] === 'undefined') {
                                        accelx.push("0");
                                    }
                                    else {
                                        accelx[i] = accelx[i] != null ? accelx[i] : "0";
                                    }
                                    if (accely[i] === 'undefined') {
                                        accely.push("0");
                                    }
                                    else {
                                        accely[i] = accely[i] != null ? accely[i] : "0";
                                    }
                                    if (accelz[i] === 'undefined') {
                                        accelz.push("0");
                                    }
                                    else {
                                        accelz[i] = accelz[i] != null ? accelz[i] : "0";
                                    }
                                    if (tstmpA[i] === 'undefined') {
                                        tstmpA.push("0");
                                    }
                                    else {
                                        tstmpA[i] = tstmpA[i] != null ? tstmpA[i] : "0";
                                    }

                                   // console.log(i + " - of - " + tstmpA.length); //Shows progress when uploading (for debugging)

                                    stmt.execute([taskEntryID, parseFloat(tstmpA[i]), parseFloat(accelx[i]), parseFloat(accely[i]), parseFloat(accelz[i]), parseFloat(tstmpG[i]), parseFloat(gyroy[i]), parseFloat(gyroy[i]), parseFloat(gyroz[i]), parseFloat(tstmpM[i]), parseFloat(magx[i]), parseFloat(magy[i]), parseFloat(magz[i])], function (err, result) {
                                        if (err) {
                                            console.log("ERROR: " + lo);
                                            console.log(err);
                                        }
                                        else {

                                            result.closeSync();
                                        }
                                    });
                                } catch (err) {
                                    console.log("ERROR: " + err.message);
                                }
                            }
                            ;
                            console.log("Upload completed");
                        })
                    }
                });
            });
        }
    });
};
