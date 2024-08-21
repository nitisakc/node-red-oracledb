const { release } = require("process");

module.exports = function (RED) {

    "use strict";
    var oracledb = require("oracledb");
    oracledb.fetchAsBuffer = [oracledb.BLOB];
    oracledb.fetchAsString = [oracledb.CLOB];
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

        node.execute = (msg, requestingNode, query, values, resultAction, errorName) => {
            if (node.connection?.isHealthy()) {
                delete node.reconnecting;
                requestingNode.log("Oracle query execution started");
                var options = {
                    autoCommit: false,
                    outFormat: oracledb.OBJECT,
                    resultSet: resultAction === "multi"
                };

                if (Array.isArray(query)) {
                    requestingNode.setStatus('executing');
                    const _promises = [];
                    query.forEach((e, i) => {
                        // requestingNode.log("execution", e.sql);
                        if (Array.isArray(e.param)) {
                            const promise = node.connection.executeMany(e.sql, e.param, options);
                            _promises.push(promise);
                        } else {
                            const promise = node.connection.execute(e.sql, e.param, options);
                            _promises.push(promise);
                        }
                    });
                    Promise.all(_promises).then((results) => {
                        return node.connection.commit()
                            .then(() => {
                                results.forEach(function (e, i) {
                                    if (resultAction === "single") {
                                        if (query[i].name != '' && query[i].name != '_') {
                                            let res = null;
                                            if (e.rowsAffected) {
                                                res = e;
                                            } else if (e.outBinds) {
                                                res = e.outBinds;
                                            } else if (e.rows) {
                                                res = e.rows;
                                            }
                                            RED.util.setObjectProperty(msg, query[i].name, res, true);
                                        }
                                    }
                                });
                                requestingNode.setStatus('success');
                                requestingNode.send([msg, null]);
                            });
                    })
                        .catch(function (error) {
                            var errorText = error.message;
                            return node.connection.rollback()
                                .catch(function (rollbackError) {
                                    errorText = `${errorText} and Rollback failed with error: ${rollbackError.message}`;
                                    // Forget connection, its not working anymore ...
                                    // No worries, the execute function will claim a new connection!
                                    requestingNode.setStatus(errorText);
                                    delete node.connection;
                                })
                                .finally(() => {
                                    node.error(errorText);
                                    RED.util.setObjectProperty(msg, errorName, errorText, true);
                                    requestingNode.send([null, msg]);
                                });
                        });
                }
            }
            else {
                requestingNode.log("execution queued");
                requestingNode.setStatus('queued');
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
            if (!node.Connection && !node.connectionInProgress && !node.reconnecting) {
                if (node.tnsname) {
                    node.connectString = node.tnsname;
                }
                else {
                    node.connectString = node.host + ":" + node.port + (node.db ? "/" + node.db : "");
                }
                node.log(`claimConnection in progress to ${node.connectString}`);
                node.connectionInProgress = true;
                // Create the connection for the Oracle server
                if (node.instantclientpath) {
                    try {
                        node.log(`initializing Oracle Client ${node.instantclientpath}`);
                        oracledb.initOracleClient({ libDir: node.instantclientpath });
                        node.log(`initialized Oracle Client ${node.instantclientpath}`);
                    }
                    catch (err) {
                        node.error("initializing Oracle Client error: " + err.message);
                        // proceed with fallback to default Oracle client
                    }
                }
                node.firstConnection = false;
                requestingNode.setStatus('connecting');
                node.log(`connecting to ${node.connectString}`);
                oracledb.getConnection({
                    user: node.user,
                    password: node.password,
                    connectString: node.connectString
                }, function (err, connection) {
                    node.connectionInProgress = false;
                    if (err) {
                        const errorText = `getConnection error: ${err.message}`;
                        requestingNode.setStatus('error', errorText);
                        node.error(errorText);
                        // start reconnection process (retry connection claim)
                        if (node.reconnect) {
                            node.log(`claimConnection waiting ${node.reconnectTimeout} ms to reconnect to ${node.connectString}`);
                            node.reconnecting = setTimeout(function () {
                                delete node.reconnecting;
                                node.claimConnection(requestingNode);
                            }, node.reconnectTimeout);
                        }
                    }
                    else {
                        requestingNode.setStatus('connected');
                        node.connection = connection;
                        node.log(`connected to ${node.connectString}`);
                        node.queryQueued();
                    }
                });
            } else {
                node.log("Connection already in progress");
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
