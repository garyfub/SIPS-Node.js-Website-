//Model for interacting with Users
var ibmdb = require('ibm_db');
var uuid = require('node-uuid');
var models_admin = require('../models/admin');

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
    inviteCode: inviteCode,
    getGroupInfo: getGroupInfo,
    getGroupPermissions: getGroupPermissions,
    editActionIndex: editActionIndex
}

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
                //console.log("RESULT: " + JSON.stringify(rows,null,2));
                if(Object.keys(rows).length == 0){ //if no results
                    return callback(true);
                }

                //Add user to single group if code is valid
                conn.prepare("insert into Members (role_name, UserID, GROUPID, DATEADDED) VALUES (?, ?, ?, ?)", function (err, stmt) {
                    if (err) {
                        console.log(err);
                        conn.closeSync();
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


function getGroupInfo(groupID, callback){

    ibmdb.open(dsnString, function (err, conn) {
        conn.query("SELECT * FROM GROUPS WHERE GROUPID =  \'" + groupID + "\'", function (err, rows, moreResultSets) {
            if (err) {
                console.log(err);
            } else {
                //return results
                conn.closeSync()
                return callback(rows[0]);
            }
        });
    });
}

/**
 * Retrieves user's permissions for a specific group.
 *
 * Admin check: If user is an admin then a check is made to see if the group is under the Organization(s) the Admin is under.
 *  If yes then the group member check will be skipped
 * Group Member check: If user is a group member then the permissions for that will be returned
 * @param user
 * @param groupID
 * @param callback
 * @returns {*}
 */
function getGroupPermissions(user, groupID, callback){
    var permissions = {};
    var isAdmin = false;

    //console.log("USER" + JSON.stringify(user, null, 2));

    //Admin Check
    for(var i = 0; i < Object.keys(user.Admin).length; i++){

        for(var t = 0; t < Object.keys(user.Admin[i].GROUPS).length; t++){
            if(user.Admin[i].GROUPS[t] == groupID){
                permissions = user.Admin[i];
                isAdmin = true;
                break;
            }
        }
    }

    //Member Check
    if(!isAdmin){
        for(var i = 0; i < Object.keys(user.Groups).length; i++){
            if(user.Groups[i].GroupID == groupID){
                permissions = user.Groups[i];
                break;
            }
        }
    }

    console.log("PERMISSIONS" + JSON.stringify(permissions, null, 2));
    return callback(permissions);
}


function editActionIndex(access, action, type, data ,callback){
    console.log("GROUP EDITING INITIATED: " + action + " " + type);

    switch (action){
        case 'remove':
            if(type == "user"){
                models_admin.groupRemoveUser(data.groupID, data.data, function(){ //data.data should be userID of user to be removed
                    return callback(true);
                });
            }
            else if (type == "position"){
                models_admin.groupRemovePosition(data, function(){//data.data is position name
                    return callback(true);
                })
            }
            break;
        case 'add':
            if (type == "position"){
                models_admin.groupCreatePosition(data, function(){
                    return callback(true);
                });
            }
            break;
        case 'update':
            if(type == "user"){
                //TODO call to update MEMBERS table
            }
            else if(type == "position"){
                //TODO call to update ROLEPERMISSIONS table
                console.log("Update position called");
                    models_admin.groupUpdatePosition(data,function(){
                        return callback(true);
                    })
            }
            else if(type == "group"){
                console.log("Update group called");
                //TODO: call to update group information in GROUPS table
            }
            break;
        default:
            return callback(true);
            break;
    }
}
