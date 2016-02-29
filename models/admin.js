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


module.exports = {
    //Groups
    createGroup: createGroup,
    groupUpdateInfo: groupUpdateInfo,
    deleteGroup: deleteGroup,
    getGroups: getGroups,
    //Group Users
    groupRemoveUser: groupRemoveUser,
    groupUpdateUser: groupUpdateUser,
    //Group Positions
    groupRemovePosition: groupRemovePosition,
    groupCreatePosition: groupCreatePosition,
    groupUpdatePosition: groupUpdatePosition
    //Group Sessions
}

//Creates new group
function createGroup(name, orgID, callback) {

    var groupID = shortid.generate();
    //console.log(name + ", " + orgID + ", " + JSON.stringify(callback, null, 2));
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into GROUPS (groupID, group_name, invite_code, organizationID) VALUES (?, ?, ?, ?)", function (err, stmt) {
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

//Updates group information in Groups table
function groupUpdateInfo(data, callback){

    console.log("UPDATE GROUP INFO: " + JSON.stringify(data, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE GROUPS SET GROUP_NAME = \'"+ data.group_name + "\' WHERE GROUPID = \'" + data.groupID + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

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

//Retrieves list of groups
function getGroups(orgID, callback) {

    // console.log(orgID + ", " + JSON.stringify(callback, null, 2));
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

/**
 * Group
 * Remove user
 */
function groupRemoveUser(groupID, userID, callback) {

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM MEMBERS WHERE groupID = \'" + groupID + "\' AND userID = \'" + userID + "\'", function (err, stmt) {
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
}

function groupUpdateUser(data, callback){
    var obj = JSON.parse(data.data);
    console.log("UPDATE USER: " + JSON.stringify(obj, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE MEMBERS SET ROLE_NAME = \'"+ obj.position + "\' WHERE USERID = \'"+ obj.userid + "\' AND GROUPID = \'" + data.groupID + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}


/////
//POSITIONS
/////


/**
 * Group
 * Remove position
 */
function groupRemovePosition(data, callback) {

    var groupID = data.groupID;
    var position = data.data;
    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("DELETE FROM ROLEPERMISSIONS WHERE groupID = \'" + groupID + "\' AND ROLE_NAME = \'" + position + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statment asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

/**
 * Adds new entry to RolePermissions table with the supplied groupID
 * @param groupID
 * @param positionData
 * @param callback
 */
function groupCreatePosition(data, callback){

    console.log("POSITION CREATE: " + JSON.stringify(data, null, 2));

    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

        if(!obj.hasOwnProperty('groupEdit')){
            obj.groupEdit = 0;
        }
        if(!obj.hasOwnProperty('groupSessions')){
            obj.groupSessions = 0;
        }
        if(!obj.hasOwnProperty('groupMembers')){
            obj.groupMembers = 0;
        }
        if(!obj.hasOwnProperty('groupPositions')){
            obj.groupPos = 0;
        }
        if(!obj.hasOwnProperty('groupResults')){
            obj.groupResults = 0;
        }
        if(!obj.hasOwnProperty('groupTests')){
            obj.groupTests = 0;
        }

    console.log("Create POSITION: " + JSON.stringify(obj, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("insert into ROLEPERMISSIONS (organizationID, groupID, Role_name, Group_Editing, Group_Sessions, Group_Members, Group_Positions, Group_Results, Group_Test, org_initial, org_groupCreate, org_groupDelete, org_editAdmin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statement asynchronously
            stmt.execute([obj.orgID, data.groupID, obj.positionTitle, obj.groupEdit, obj.groupSessions, obj.groupMembers, obj.groupPositions, obj.groupResults, obj.groupTests, -1, -1, -1, -1], function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}

function groupUpdatePosition(data, callback){

    /*
     //Update group by removing the group and recreating it with the changed values
    groupRemovePosition(data, function(){
        groupCreatePosition(data, function(){
            return callback();
        })
    })
    */
    var groupID = data.groupID;
    var obj = JSON.parse(data.data);

    if(!obj.hasOwnProperty('groupEdit')){
        obj.groupEdit = 0;
    }
    if(!obj.hasOwnProperty('groupSessions')){
        obj.groupSessions = 0;
    }
    if(!obj.hasOwnProperty('groupMembers')){
        obj.groupMembers = 0;
    }
    if(!obj.hasOwnProperty('groupPositions')){
        obj.groupPositions = 0;
    }
    if(!obj.hasOwnProperty('groupResults')){
        obj.groupResults = 0;
    }
    if(!obj.hasOwnProperty('groupTests')){
        obj.groupTests = 0;
    }
    console.log("UPDATE POSITION: " + JSON.stringify(obj, null, 2));

    ibmdb.open(dsnString, function (err, conn) {
        conn.prepare("UPDATE ROLEPERMISSIONS SET  GROUP_EDITING= \'"+obj.groupEdit+"\', GROUP_SESSIONS= \'"+obj.groupSessions+"\', GROUP_MEMBERS= \'"+obj.groupMembers+"\' , GROUP_POSITIONS = \'"+obj.groupPositions+"\' , GROUP_RESULTS= \'"+obj.groupResults+"\' , GROUP_TEST= \'"+obj.groupTests+"\' WHERE GROUPID = \'" + groupID + "\' AND ROLE_NAME = \'" + obj.positionTitle + "\'", function (err, stmt) {
            if (err) {
                //could not prepare for some reason
                console.log(err);
                return conn.closeSync();
            }

            //Bind and Execute the statement asynchronously
            stmt.execute(function (err, result) {
                if (err) console.log(err);
                else conn.close(function () {
                    return callback();
                });
            });
        });
    });
}