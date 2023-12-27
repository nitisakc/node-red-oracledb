module.exports = function (RED) {
    
    "use strict";
    var oracledb = require("oracledb");
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    function OracleServer(n) {
        var node = this;
        RED.nodes.createNode(node, n);
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

        node.execute = (msg, requestingNode, query, values, resultAction, errorName)=>{
            if (node.connection) {
                delete node.reconnecting;
                requestingNode.log("Oracle query execution started");
                var options = {
                    autoCommit: false,
                    outFormat: oracledb.OBJECT,
                    resultSet: resultAction === "multi"
                };

                if(Array.isArray(query)){
                    requestingNode.setStatus('execute');
                    const _promises = [];
                    query.forEach(function (e, i) {   
                        // requestingNode.log("execution", e.sql);
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
                        requestingNode.setStatus('success');
                        requestingNode.send([msg,null]);
                    })
                    .catch(function(error) {
                        requestingNode.setStatus('error');
                        node.connection.rollback();
                        RED.util.setObjectProperty(msg, errorName, error.message, true);
                        requestingNode.send([null,msg]);
                    });
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
                node.claimConnection(requestingNode);
            }    
        };
        node.claimConnection = function (requestingNode) {
            node.log("Connection claim started");
            if (!node.Connection && !node.connectionInProgress) {
                node.connectionInProgress = true;
                // Create the connection for the Oracle server
                if (!node.instantclientpath) {
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
                requestingNode.setStatus('Connecting');
                oracledb.getConnection({
                    user: node.user,
                    password: node.password,
                    connectString: node.connectString
                }, function (err, connection) {
                    node.connectionInProgress = false;
                    if (err) {
                        requestingNode.setStatus('error', 'Oracle-server error connection');
                        node.error("Oracle-server error connection to " + node.connectString + ": " + err.message);
                        // start reconnection process (retry connection claim)
                        if (node.reconnect) {
                            node.log("Retry connection to Oracle server in " + node.reconnectTimeout + " ms");
                            node.reconnecting = setTimeout(node.claimConnection, node.reconnectTimeout);
                        }
                    }
                    else {
                        requestingNode.setStatus('Connected');
                        node.connection = connection;
                        node.log("Connected to Oracle server " + node.connectString);
                        node.queryQueued();
                        delete node.reconnecting;
                    }
                });
            }
            return node.status;
        };
        node.queryQueued = function () {
            while (node.connection && node.queryQueue.length > 0) {
                var e = node.queryQueue.shift();
                node.execute(e.msg, e.requestingNode, e.query, e.values, e.resultAction, e.errorName, e.sendResult);
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
