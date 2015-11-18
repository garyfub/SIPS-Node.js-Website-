//Module Dependencies
var app = require("express")();
var bodyparser = require("body-parser");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var namespace = require('express-namespace');
//Bluemix Mobile Cloud dependencies
var ibmbluemix = require('ibmbluemix');
var ibmpush = require('ibmpush');
var Cloudant = require('cloudant');

var env = null;
var key = null;
var num = 0;

//Service to get account information for
var serviceName = 'CLOUDANTNOSQLDB';


app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))

var config = {
    // change to real application route assigned for your application        
    applicationRoute: "http://utc-vat.mybluemix.net",
    // change to real application key generated by Bluemix for your application        
    applicationId: "0a27a50e-8c7f-487d-9135-5b360732abbf"
};

// init core sdk
ibmbluemix.initialize(config);
var logger = ibmbluemix.getLogger();
var ibmconfig = ibmbluemix.getConfig(); //Getting context for app
//Basic GET test
app.get("/", function (req, res) {
    res.status(200).send("GET, OK :D");
    res.sendfile('public/index.html');
});


// init service sdks 
app.use(function (req, res, next) {
    // req.data = ibmdata.initializeService(req);
    //    req.ibmpush = ibmpush.initializeService(req);
    req.logger = logger;
    next();
});

// init basics for an express app
app.use(require('./lib/setup'));

//uncomment below code to protect endpoints created afterwards by MAS
//var mas = require('ibmsecurity')();
//app.use(mas);


logger.info('mbaas context root: ' + ibmconfig.getContextRoot());
// "Require" modules and files containing endpoints and apply the routes to our application
app.use(ibmconfig.getContextRoot(), require('./lib/accounts'));
app.use(ibmconfig.getContextRoot(), require('./lib/staticfile'));


http.listen(ibmconfig.getPort(), function () {
    console.log('Express server listening on port ' + ibmconfig.getPort());
});

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
}

//Get Bluemix Cloudant account credentials
var credentials = env[key][0].credentials;
var me = credentials.username;
var password = credentials.password;

// Initialize Cloudant library.
var cloudant = Cloudant({account: me, password: password});


//Test of URI using app context
app.get(ibmconfig.getContextRoot() + '/test', function (req, res) {
    res.status(200).send("Test Complete"); //Removing status code affects the android app's response.

});

//Test if Cloudant databases are accessible. Displays name of databases on page and logs
app.get(ibmconfig.getContextRoot() + '/test1', function (req, res) {

    cloudant.db.list(function (err, allDbs) {
        console.log('All my databases: %s', allDbs.join(', '));
        res.status(200).send('All my databases: ' + allDbs.join(', ')); //Removing status code affects the android app's response.
    });

});

// Specify the database we are going to use
var datapoints = cloudant.db.use('utc-vat') // database is named utc-vat


io.of('/upload').on('connection', function (socket) {
    socket.on('data', function (msg) {
        console.log("Socket connection made.");

        keyNames = Object.keys(msg); //Gets key names from object in array form
        //Print out key names to verify session object loaded
        for (var i in keyNames) {
            console.log("msg." + keyNames[i]);
        }


        // Insert a document into cloudant database specified above.
        datapoints.insert(msg, function (err, body, header) {
            if (err) {
                return console.log('[session.insert] ', err.message);
            }
            else{console.log('Insertion completed without error')}

        });
    });
});


//BlueList Auth Sample Push notification code


//uncomment below code to protect endpoints created afterwards by MAS
//var mas = require('ibmsecurity')();
//app.use(mas);

/*

 //initialize mbaas-config module
 ibmbluemix.initialize(config);
 var logger = ibmbluemix.getLogger();

 app.use(function(req, res, next) {
 req.ibmpush = ibmpush.initializeService(req);
 req.logger = logger;
 next();
 });

 //initialize ibmconfig module
 var ibmconfig = ibmbluemix.getConfig();

 //get context root to deploy your application
 //the context root is '${appHostName}/v1/apps/${applicationId}'
 var contextRoot = ibmconfig.getContextRoot();
 appContext=express.Router();
 app.use(contextRoot, appContext);

 console.log("contextRoot: " + contextRoot);

 // log all requests
 app.all('*', function(req, res, next) {
 console.log("Received request to " + req.url);
 next();
 });

 // create resource URIs
 // endpoint: https://mobile.ng.bluemix.net/${appHostName}/v1/apps/${applicationId}/notifyOtherDevices/
 appContext.post('/notifyOtherDevices', function(req,res) {
 var results = 'Sent notification to all registered devices successfully.';

 console.log("Trying to send push notification via JavaScript Push SDK");
 var message = { "alert" : "The data has been updated.",
 "url": "http://www.google.com"
 };

 req.ibmpush.sendBroadcastNotification(message,null).then(function (response) {
 console.log("Notification sent successfully to all devices.", response);
 res.send("Sent notification to all registered devices.");
 }, function(err) {
 console.log("Failed to send notification to all devices.");
 console.log(err);
 res.send(400, {reason: "An error occurred while sending the Push notification.", error: err});
 });
 });

 // host static files in public folder
 // endpoint:  https://mobile.ng.bluemix.net/${appHostName}/v1/apps/${applicationId}/static/
 appContext.use('/static', express.static('public'));

 //redirect to cloudcode doc page when accessing the root context
 app.get('/', function(req, res){
 res.sendfile('public/index.html');
 });



 */