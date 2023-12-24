const { log } = require("console");

module.exports = function (RED) {
    
    "use strict";
    var oracledb = require("oracledb");
    var resolvePath = require("object-resolve-path");
    var events = require("events");
    var util = require("util");
    oracledb.fetchAsBuffer = [oracledb.BLOB];

    function initialize(node) {
        if (node.server) {
            node.status({ fill: "grey", shape: "dot", text: "unconnected" });
            //node.serverStatus = node.server.claimConnection();
            node.serverStatus = node.server.status;
            node.serverStatus.on("connecting", function () {
                node.status({ fill: "green", shape: "ring", text: "connecting" });
            });
            node.serverStatus.on("connected", function () {
                node.status({ fill: "green", shape: "dot", text: "connected" });
                //node.initialize();
            });
            node.serverStatus.on("closed", function () {
                node.status({ fill: "red", shape: "ring", text: "disconnected" });
            });
            node.serverStatus.on("error", function () {
                node.status({ fill: "red", shape: "dot", text: "connect error" });
            });
            node.serverStatus.on("reconnecting", function () {
                node.status({ fill: "red", shape: "ring", text: "reconnecting" });
            });
            node.on("close", function () {
                node.server.freeConnection();
            });
        }
        else {
            node.status({ fill: "red", shape: "dot", text: "error" });
            node.error("Oracle " + node.oracleType + " error: missing Oracle server configuration");
        }
    }

    //
    //-- Execute -----------------------------------------------------------------
    //
    function Stored(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        node.useQuery = n.usequery;
        node.query = n.query;
        node.useMappings = n.usemappings;
        try {
            node.mappings = n.mappings ? JSON.parse(n.mappings) : [];
        }
        catch (err) {
            node.error("Error parsing mappings: " + err.message);
            node.mappings = [];
        }
        node.resultAction = n.resultaction;
        node.resultLimit = n.resultlimit;
        node.server = RED.nodes.getNode(n.server);
        // set oracle node type initialization parameters
        node.oracleType = "storage";
        node.serverStatus = null;
        // node specific initialization code
        //node.initialize = function () {
        node.on("input", function (msg) {
            var values = [];
            var value;
            if (node.useMappings || (msg.payload && !util.isArray(msg.payload))) {
                // use mappings file to map values to array
                for (var i = 0, len = node.mappings.length; i < len; i++) {
                    try {
                        value = resolvePath(msg.payload, node.mappings[i]);
                    }
                    catch (err) {
                        value = null;
                    }
                    values.push(value);
                }
            }
            else {
                values = msg.payload;
            }
            var query;
            if (node.useQuery || !msg.query) {
                query = node.query;
            }
            else {
                query = msg.query;
            }
            var resultAction = msg.resultAction || node.resultAction;
            var resultSetLimit = parseInt(msg.resultSetLimit || node.resultLimit, 10);
            node.server.query(msg, node, query, values, resultAction, resultSetLimit);
        });
        //};
        initialize(node);
    }
    RED.nodes.registerType("stored", Stored);
};