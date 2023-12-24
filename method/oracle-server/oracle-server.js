const { log } = require("console");

module.exports = function (RED) {
    
    "use strict";
    var oracledb = require("oracledb");
    var resolvePath = require("object-resolve-path");
    var events = require("events");
    var util = require("util");
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    function OracleServer(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        // Store local copies of the node configuration (as defined in the .html)
        node.connectionname = n.connectionname || "";
        node.tnsname = n.tnsname || "";
        node.connectiontype = n.connectiontype || "Classic";
        node.instantclientpath = n.instantclientpath || "";
        node.host = n.host || "localhost";
        node.port = n.port || "1521";
        node.db = n.db || "orcl";
        node.reconnect = n.reconnect;
        node.reconnectTimeout = n.reconnecttimeout || 5000;
        node.connectionInProgress = false;
        node.firstConnection = true;
        node.connection = null;
        node.connectString = "";
        node.queryQueue = [];
        node.user = node.credentials.user || "hr";
        node.password = node.credentials.password || "hr";
        node.status = new events.EventEmitter();
        node.status.setMaxListeners(0);
        node.claimConnection = function () {
            node.log("Connection claim started");
            if (!node.Connection && !node.connectionInProgress) {
                node.connectionInProgress = true;
                if (node.firstConnection) {
                    node.status.emit("Connecting with " + node.connectionname);
                }
                else {
                    node.status.emit("Reconnecting with " + node.connectionname);
                }
                // Create the connection for the Oracle server
                if (!node.instantclientpath) {
                    node.status.emit("error", "You must set the Instant Client Path!");
                    node.error("You must set the Instant Client Path!");
                }
                else {
                    try {
                        oracledb.initOracleClient({ libDir: node.instantclientpath });
                    }
                    catch (err) {
                        // do nothing
                    }
                }
                if (node.tnsname) {
                    node.connectString = node.tnsname;
                }
                else {
                    node.connectString = node.host + ":" + node.port + (node.db ? "/" + node.db : "");
                }
                node.firstConnection = false;
                oracledb.getConnection({
                    user: node.user,
                    password: node.password,
                    connectString: node.connectString
                }, function (err, connection) {
                    node.connectionInProgress = false;
                    if (err) {
                        node.status.emit("error", err);
                        node.error("Oracle-server error connection to " + node.connectString + ": " + err.message);
                        // start reconnection process (retry connection claim)
                        if (node.reconnect) {
                            node.log("Retry connection to Oracle server in " + node.reconnectTimeout + " ms");
                            node.reconnecting = setTimeout(node.claimConnection, node.reconnectTimeout);
                        }
                    }
                    else {
                        node.connection = connection;
                        node.status.emit("connected");
                        node.log("Connected to Oracle server " + node.connectString);
                        node.queryQueued();
                        delete node.reconnecting;
                    }
                });
            }
            return node.status;
        };
        node.freeConnection = function () {
            if (node.reconnecting) {
                clearTimeout(node.reconnecting);
                delete node.reconnecting;
            }
            if (node.connection) {
                node.connection.release(function (err) {
                    if (err) {
                        node.error("Oracle-server error closing connection: " + err.message);
                    }
                    node.connection = null;
                    node.status.emit("closed");
                    node.status.removeAllListeners();
                    node.log("Oracle server connection " + node.connectString + " closed");
                });
            }
        };
        node.query = function (msg, requestingNode, query, values, resultAction, errorName) {

            values = typeof values === 'undefined' ? [] : values;
            requestingNode.log("Oracle query start execution");
            if (node.connection) {
                delete node.reconnecting;
                requestingNode.log("Oracle query execution started");
                var options = {
                    autoCommit: false,
                    outFormat: oracledb.OBJECT,
                    resultSet: resultAction === "multi"
                };

                if(Array.isArray(query)){
                    try {
                        const _promises = [];
                        query.forEach(function (e, i) {   
                            if(Array.isArray(e.param)){
                                const promise = node.connection.executeMany(e.sql, e.param, options);
                                _promises.push(promise);
                            }else{
                                const promise = node.connection.execute(e.sql, e.param, options);
                                _promises.push(promise);
                            }
                        });
                        Promise.all(_promises).then((results) => {
                            node.connection.commit();
                            results.forEach(function (e, i){
                                if(resultAction === "single"){
                                    if(query[i].name != '' && query[i].name != '_'){
                                        RED.util.setObjectProperty(msg, query[i].name, e.rowsAffected ? e :  e.rows, true);
                                    }
                                }
                            });
                            requestingNode.send([msg,null]);
                        })
                        .catch(function(error) {
                            var errorCode = error.message.slice(0, 9);
                            node.connection.rollback();
                            requestingNode.error("Oracle query error: " + error.message + ", errorCode:" + errorCode);
                            node.status.emit("error", error);

                            requestingNode.log("Checking errors for retry");
                            if (errorCode === "DPI-1080:" || errorCode === "DPI-1010:" || errorCode === "ORA-12541" || errorCode === "ORA-12514" || errorCode === "ORA-01109" || errorCode === "ORA-03113" || errorCode === "ORA-03114") {
                                node.connection = null;

                                if (node.reconnect) {
                                    requestingNode.log("Oracle server connection lost, retry in " + node.reconnectTimeout + " ms");
                                    node.status.emit("reconnecting", "Reconnecting to " + node.connectionname);
                                    node.reconnecting = setTimeout(node.query, node.reconnectTimeout, requestingNode, query, values, resultAction, errorName);
                                }
                            }

                            RED.util.setObjectProperty(msg, errorName, error.message, true);
                            requestingNode.send([null,msg]);
                        });
                    } catch (error) {
                        RED.util.setObjectProperty(msg, errorName, error.message, true);
                        requestingNode.send([null,msg]);
                    }
                }
            }
            else {
                requestingNode.log("Oracle query execution queued");
                node.queryQueue.push({
                    msg: msg,
                    requestingNode: requestingNode,
                    query: query,
                    values: values,
                    resultAction: resultAction,
                    errorName: errorName
                });
                node.claimConnection();
            }
        };
        node.queryQueued = function () {
            while (node.connection && node.queryQueue.length > 0) {
                var e = node.queryQueue.shift();
                node.query(e.msg, e.requestingNode, e.query, e.values, e.resultAction, e.errorName, e.sendResult);
            }
        };
    }
    
    RED.nodes.registerType("oracle-server", OracleServer, {
        credentials: {
            user: { type: "text" },
            password: { type: "password" }
        }
    });
};
