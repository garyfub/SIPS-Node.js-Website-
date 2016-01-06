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
    //TODO: addFormEntry needs to work for any form entry using async calls. Has to be called before form data is entered
    addFormEntry: function (req) {
        var userid = req.user.id;
        var formEntryID = uuid.v1();
        var formType = req.body.form_id;
        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1;
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        var date = year + "-" + month + "-" + day;

        //console.log("formType: " + formType);

        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                check = false;
            } else {
                console.log("Form is being inserted");

                //Adds form entry to list of table of form entries
                conn.prepare("INSERT INTO FormEntryList (formentryID, userID, formType, dateAdded) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        return conn.closeSync();
                    }
                    stmt.execute([formEntryID, userid, formType.toUpperCase(), date], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                        }
                        else {
                            console.log("New " + formType + " Entry added to FORMENTRYLIST");
                            result.closeSync();
                        }
                    });
                });

            }
        });
    },
    sportsFormEntry: function (req) {
       // console.log("USER: " + JSON.stringify(req.user.id, null, 2));
        var data = req.body;
        //Original form data from POST
        //console.log(data);

        var userid = req.user.id;
        var formEntryID = uuid.v1();

        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1;
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        var date = year + "-" + month + "-" + day;


        //Parse data to Object type
        var question = qs.parse(data);
        console.log(question);

        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                check = false;
            } else {

                //Adds form entry to list of table of form entries
                conn.prepare("INSERT INTO FormEntryList (formentryID, userID, formType, dateAdded) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        return conn.closeSync();
                    }
                    stmt.execute([formEntryID, userid, 'SPORTSFITNESSINJURY', date], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                        }
                        else {
                            console.log("New Sport Form Entry added to FORMENTRYLIST");

                            //Inserts static Form answers to appropriate table
                            conn.prepare("INSERT INTO SportsFitnessForm (formentryID, dateAdded, question1, question2, question3, question4, question5, question6, question7, question8, question9, question10, question11, concussion, INJURYSUSTAINED) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
                                if (err) {
                                    console.log("ERROR: " + err);
                                    return conn.closeSync();
                                }

                                stmt.execute([formEntryID, date, parseInt(question.arr[1]), parseInt(question.arr[2]), parseInt(question.arr[3]), parseInt(question.arr[4]), parseInt(question.arr[5]), parseInt(question.arr[6]), parseInt(question.arr[7]), parseInt(question.arr[8]), parseInt(question.arr[9]), parseInt(question.arr[10]), parseInt(question.arr[11]), parseInt(question.arr[12]), parseInt(question.arr[13])], function (err, result) {
                                    if (err) {
                                        console.log("ERROR: " + err);
                                    }
                                    else {
                                        console.log("SportFitnessForm table updated");

                                        conn.prepare("INSERT INTO Injuries (formentryID, Location, Type, TypeSpecific, CustomType, TimeLoss, dateAdded) VALUES (?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
                                            if (err) {
                                                console.log("ERROR: " + err);
                                                return conn.closeSync();
                                            }

                                            //Handle Dynamic injury questions
                                            var t = 0;
                                            var injuryCount = 0;
                                            for (var i = 13; i > -1; i++) {
                                                //Collect for each injury that exists
                                                var isInjury = parseInt(question.arr[i]);
                                                if (isInjury == 0 || isInjury === 'undefined' || injuryCount > 30) {
                                                    console.log("No more injuries entered");
                                                    break;
                                                }

                                                var location = parseInt(question.arr[i + 1]);
                                                var typeSpecific = parseInt(question.arr[i + 2]);
                                                var type = "null";
                                                var customType = "null";
                                                var timeLoss = parseInt(question.arr[i + 3]);
                                                if (typeSpecific <= 3) {
                                                    type = 0; //Sudden
                                                }
                                                else if(typeSpecific == 6 ){
                                                    console.log("typeSpecific is: " + typeSpecific);
                                                    customType = question.arr_1[injuryCount] + "";
                                                    type = -1; //custom input
                                                    t++;
                                                }
                                                else{
                                                    type = 1; //Gradual
                                                }



                                                console.log("Injury Count: " + injuryCount);
                                                console.log("next Injury?: " + isInjury + " at " + i);
                                                console.log("location: " + location + " at " + (i + 1));
                                                console.log("type: " + type);
                                                console.log("typeSpecific: " + typeSpecific + "at" + (i + 3))
                                                console.log("customType: " + customType + " at " + t);
                                                console.log("Injury timeLoss: " + timeLoss + " at " + (i + 4));
                                                i = i + 3;
                                                injuryCount++;

                                                stmt.execute([formEntryID, location, type, typeSpecific, customType, timeLoss, date], function (err, result) {
                                                    if (err) {
                                                        console.log("ERROR: " + err);
                                                    }
                                                    else {
                                                        console.log("New injury added by User");
                                                      //  result.closeSync();
                                                    }
                                                });
                                            }
                                        });
                                       // result.closeSync();
                                    }
                                });
                            });
                            result.closeSync();
                        }
                    });
                });



                //prints out static questions
                /* //TODO: delete when finished debugging
                for (var y = 0; y < 12; y++) {
                    if (question.arr[y]) {
                        console.log('Question ' + y + ': ' + question.arr[y]);
                    }
                } */
            }
        });
    },

    registrationform: function(reg){

    }
};

