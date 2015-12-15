
//Model for uploads

var Cloudant = require('cloudant');

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
    //TODO: Show data can be retieved here, then create database connections
    taskDataUploadCloudant: function (msg) {
        var keyNames = Object.keys(msg);

        //Print out key names to verify session object loaded
        for (var i in keyNames) {
            console.log("msg." + keyNames[i] + " in WebApp");
        }
        // Insert a document into cloudant database specified above.
        datapoints.insert(msg, function (err, body, header) {
            if (err) {
                console.log('[session.insert] ', err.message);
                return false ;
            }
            else {
                console.log('Insertion completed without error')
                return true;
            }
        });
    }
};

