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
    //TODO: Collect data in per-line basis, add sql prep and execute commands in for loop
    sportsFormEntry: function (req) {
        console.log("USER: " + JSON.stringify(req.user.email, null, 2));
        var data = req.body;
        //Original form data from POST
        console.log(data);

        var userid = req.user.email;
        var formEntryID = uuid.v1();

        var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1;
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();
        var date = year + "-" + month + "-" + day;




        //Parse data to Object type
        var question = qs.parse(data);
        /*
         console.log('Question 1: ' + question.q1 + '\nQuestion 2: ' + question.q2);
         console.log('Question 3: ' + question.q3 + '\nQuestion 4: ' + question.q4);
         console.log('Question 5: ' + question.q5 + '\nQuestion 6: ' + question.q6);
         console.log('Question 7: ' + question.q7 + '\nQuestion 8: ' + question.q8);
         console.log('Question 9: ' + question.q9 + '\nQuestion 10: ' + question.q10);
         console.log('Question 11: ' + question.q11 + '\nQuestion 12: ' + question.q12);
         console.log('Question 13: ' + question.q13);
         */

       //prints out static questions
        for (var i = 1; i < 13; i++) {
            if (question.arr[i]) {
                console.log('Question ' + i + ': ' + question.arr[i]);

            }
        }

        //prints out dyanmic injury questions
        var t = 1;
        var injuryCount = 0;
        for (var i = 13; i > -1; i+5) {
            //Collect for each injury that exists
            if (question.arr[i] == 1) {
                injuryCount++;
                var location = question.arr[i + 1];
                var type = question.arr[i + 2];
                var typeSpecific = question.arr[i + 3];
                var customType = "0";
                if (typeSpecific = 6) {
                    customType = question.arr[t];
                    t++;
                }
                var timeLoss = question.arr[i + 4];

                console.log("Injury Count: " + injuryCont );
                console.log("location: " + location );
                console.log("type: " + type);
                console.log("customType: " + customType );
                console.log("Injury timeLoss: " + timeLoss );

            }
        }


/*
        ibmdb.open(dsnString, function (err, conn) {
            if (err) {
                console.log("SQL ERROR: " + err.message);
                check = false;
            } else {
                console.log("Form is being inserted");


                //Inserts static Form answers to appropriate table
                conn.prepare("INSERT INTO SportsFitnessForm (formentryID, dateAdded, question1, question2, question3, question4, question5, question6, question7, question8, question9, question10, question11, question12) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        return conn.closeSync();
                    }

                    stmt.execute([formEntryID, date, parseInt(question.arr[1]) + ", " + parseInt(question.arr[2]) + ", " + parseInt(question.arr[3]) + ", " + parseInt(question.arr[4]) + ", " + parseInt(question.arr[5]) + ", " + parseInt(question.arr[6]) + ", " + parseInt(question.arr[7]) + ", " + parseInt(question.arr[8]) + ", " + parseInt(question.arr[9]) + ", " + parseInt(question.arr[10]) + ", " + parseInt(question.arr[11]) + ", " + parseInt(question.arr[12])], function (err, result) {
                        if (err) {
                            console.log("ERROR: " + err);
                        }
                        else {
                            console.log("New Sport Form Entry made");
                            result.closeSync();
                        }
                    });
                });


                conn.prepare("INSERT INTO Injuries (formentryID, dateAdded, Type, TypeSpecific, CustomType, Location, TimeLoss) VALUES (?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log("ERROR: " + err);
                        return conn.closeSync();
                    }

                    var t = 1;
                    for (var i = 13; i > -1; i+5) {
                        //Collect for each injury that exists
                        if(question.arr[i] == 1) {
                            var location = question.arr[i+1];
                            var type = question.arr[i+2];
                            var typeSpecific = question.arr[i+3];
                            var customType = "0";
                            if (typeSpecific = 6) {
                                customType = question.arr[t];
                                t++;
                            }
                            var timeLoss = question.arr[i+4]

                            stmt.execute([formEntryID, date, type, typeSpecific, customType, location, timeLoss], function (err, result) {
                                if (err) {
                                    console.log("ERROR: " + err);
                                }
                                else {
                                    console.log("New user created");
                                    result.closeSync();
                                }
                            });
                        }
                    }
                });
            }

        });
 */
    }
};

