const { log } = require("console");
const pattern = /\${([^}]+)}/g;
// const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase();
//object = sources.reduce((a,b)=> Object.assign(a, b))

// const insert = (name, param)=>{
//     let object = Array.isArray(param) ? param.reduce((a,b)=> Object.assign(a, b)) : param;
//     object = Object.keys(object);
//     let output = `INSERT INTO ${name.toUpperCase()} (${object.join(', ')})`;
// }

const checkParams = (sql, param)=>{
    if(Array.isArray(param)){
        let output = [];
        param.forEach((e, i)=>{
            output.push(removeParam(sql, e));
        });
        return output;
    }else if(typeof param === 'object' || param instanceof Object){
        return removeParam(sql, param);
    }
};

const removeParam = (sql, param)=>{
    sql = sql.toUpperCase()
    Object.keys(param).forEach((e, i)=>{
        if(sql.indexOf(`:${e.toUpperCase()}`) < 0) delete param[e];
    });
    return param;
}

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

    function Execute(n) {
        var node = this;
        RED.nodes.createNode(node, n);
        node.useQuery = n.usequery;
        node.prepare = n.prepare;
        node.errorName = n.error;
        node.remove = n.remove;
        node.query = n.query || [];
        node.resultAction = n.resultaction;
        node.server = RED.nodes.getNode(n.server);
        node.oracleType = "storage";
        node.serverStatus = null;

        node.on("input", function (msg) {
            var query;
            var globalContext = node.context().global;
            var flowContext = node.context().flow;

            let getEnv = (name)=> RED.util.evaluateNodeProperty(name,'env',node);
            let getFlow = (name)=> flowContext.get(name);
            let getGlobal = (name)=> globalContext.get(name);
            let getMsg = (name)=> RED.util.getMessageProperty(msg, name);

            if (node.useQuery || !msg.query) {
                query = [];
                node.query.forEach(function (e, i) {   
                    let param = {};                        
                    if(e.param && e.param.type == 'obj'){
                        param = e.param
                    }else if(e.param && e.param.type == 'msg'){
                        param = (!e.param.value || e.param.value == '') ? {} : RED.util.getObjectProperty(msg, e.param.value);
                    }

                    if(node.remove) checkParams(e.sql, param);

                    let matches = e.sql.match(pattern);
                    if(matches){
                        matches.forEach((match)=>{
                            try {
                                e.sql = e.sql.replace(match, eval(match.replace(/\${|}/g, '')));
                            } catch (error) {
                                // console.log(error.message);
                            }
                        });
                    }

                    query.push({
                        name: e.name || '',
                        sql: e.sql,
                        param
                    })
                });
            }
            else {
                if(Array.isArray(msg.query)){
                    query = msg.query;
                }else if(typeof msg.query === 'object' || msg.query instanceof Object){
                    query = [{
                        name: msg.query.name || 'result',
                        sql: msg.query.sql,
                        param: msg.query.param
                    }];
                }else if(typeof msg.query === 'string' || msg.query instanceof String){
                    query = [{
                        name: 'result',
                        sql: msg.query,
                        param: {}
                    }];
                }
            }

            if(query){
                if(node.prepare){
                    RED.util.setObjectProperty(msg, 'query', query, true);
                    node.send([msg,null]);
                }else{
                    var resultAction = msg.resultAction || node.resultAction;
                    node.server.query(msg, node, query, {}, resultAction, node.errorName || 'error');
                }
            }
        });
        initialize(node);
    }
    RED.nodes.registerType("oracle-exec", Execute);
};