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
        node.connection = null;
        node.connectString = "";
        node.user = node.credentials.user || "hr";
        node.password = node.credentials.password || "hr";

        node.execute = (msg, requestingNode, query, values, resultAction, errorName)=>{
            requestingNode.setStatus('connecting');
            if (!node.instantclientpath) {
                node.error("You must set the Instant Client Path!");
            }
            else {
                try { oracledb.initOracleClient({ libDir: node.instantclientpath }); }
                catch (err) { }
            }
            if (node.tnsname) node.connectString = node.tnsname;
            else node.connectString = node.host + ":" + node.port + (node.db ? "/" + node.db : "");

            oracledb.getConnection({
                user: node.user,
                password: node.password,
                connectString: node.connectString
            }, function (error, connection) {
                if (error) {
                    requestingNode.setStatus('error');
                    RED.util.setObjectProperty(msg, errorName, error.message, true);
                    requestingNode.send([null,msg]);
                }
                else {
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
                            requestingNode.log("execution", e.sql);
                            if(Array.isArray(e.param)){
                                const promise = connection.executeMany(e.sql, e.param, options);
                                _promises.push(promise);
                            }else{
                                const promise = connection.execute(e.sql, e.param, options);
                                _promises.push(promise);
                            }
                        });
                        Promise.all(_promises).then((results) => {
                            connection.commit();
                            connection.release();
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
                            connection.rollback();
                            connection.release();
                            RED.util.setObjectProperty(msg, errorName, error.message, true);
                            requestingNode.send([null,msg]);
                        });
                    }
                }
            });
        };
    }
    
    RED.nodes.registerType("oracle-server", OracleServer, {
        credentials: {
            user: { type: "text" },
            password: { type: "password" }
        }
    });
};
