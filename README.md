# @nitisakc/node-red-oracledb

![GitHub package.json version](https://img.shields.io/github/package-json/v/nitisakc/node-red-oracledb?label=package)


## Example flow:
![example flow](https://github.com/nitisakc/node-red-oracledb/blob/main/example.jpg?raw=true)

Example flow:

```
[
    {
        "id": "ce9de74d0c91d797",
        "type": "tab",
        "label": "Example",
        "disabled": false,
        "info": "",
        "env": []
    },
    {
        "id": "7767ae6264f855d1",
        "type": "group",
        "z": "ce9de74d0c91d797",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "52b008d763c0cbd0",
            "10b3a44c60cf663d",
            "dd2413dd89673d31",
            "52ad5e94a0436974",
            "90d9d1fd18688526"
        ],
        "x": 74,
        "y": 259,
        "w": 572,
        "h": 162
    },
    {
        "id": "c2bea28554a72fbb",
        "type": "group",
        "z": "ce9de74d0c91d797",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "c52cdec8293d64f6",
            "c061649673ee8454",
            "308a1c4b5aaee5dc",
            "721d79c896909a98",
            "57334808a0ee7685"
        ],
        "x": 74,
        "y": 59,
        "w": 572,
        "h": 162
    },
    {
        "id": "0bd884ea091f535a",
        "type": "group",
        "z": "ce9de74d0c91d797",
        "style": {
            "stroke": "#999999",
            "stroke-opacity": "1",
            "fill": "none",
            "fill-opacity": "1",
            "label": true,
            "label-position": "nw",
            "color": "#a4a4a4"
        },
        "nodes": [
            "34064f5b851de2e7",
            "ddfc9d25e6340a2f",
            "57e4f1d1cb1394b5",
            "2c813bdd55de77ec",
            "f4332b9ccdf3cd3d"
        ],
        "x": 74,
        "y": 459,
        "w": 572,
        "h": 162
    },
    {
        "id": "c52cdec8293d64f6",
        "type": "inject",
        "z": "ce9de74d0c91d797",
        "g": "c2bea28554a72fbb",
        "name": "Simple",
        "props": [],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 170,
        "y": 160,
        "wires": [
            [
                "c061649673ee8454"
            ]
        ]
    },
    {
        "id": "c061649673ee8454",
        "type": "oracle-exec",
        "z": "ce9de74d0c91d797",
        "g": "c2bea28554a72fbb",
        "name": "",
        "usequery": true,
        "prepare": false,
        "error": "error",
        "remove": false,
        "query": [
            {
                "sql": "SELECT * \nFROM SCHEMA_NAME.TABLE_NAME_A\nWHERE 1 = 1",
                "name": "tableA",
                "param": {
                    "type": "wop",
                    "value": ""
                }
            },
            {
                "sql": "SELECT * \nFROM SCHEMA_NAME.TABLE_NAME_B\nWHERE 1 = 1",
                "name": "tableB",
                "param": {
                    "type": "wop",
                    "value": ""
                }
            }
        ],
        "server": "ec68b70a38aefb78",
        "resultaction": "single",
        "x": 320,
        "y": 160,
        "wires": [
            [
                "308a1c4b5aaee5dc"
            ],
            [
                "721d79c896909a98"
            ]
        ]
    },
    {
        "id": "308a1c4b5aaee5dc",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "c2bea28554a72fbb",
        "name": "Result Data",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 510,
        "y": 140,
        "wires": []
    },
    {
        "id": "721d79c896909a98",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "c2bea28554a72fbb",
        "name": "Error message",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "error",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 520,
        "y": 180,
        "wires": []
    },
    {
        "id": "52b008d763c0cbd0",
        "type": "inject",
        "z": "ce9de74d0c91d797",
        "g": "7767ae6264f855d1",
        "name": "",
        "props": [
            {
                "p": "param",
                "v": "{\"fname\":\"Nitisak\",\"lname\":\"Chancham\"}",
                "vt": "json"
            },
            {
                "p": "paramNotUse",
                "v": "{\"fname\":\"Nitisak\",\"lname\":\"Chancham\",\"age\":37,\"nickname\":\"North\"}",
                "vt": "json"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 170,
        "y": 360,
        "wires": [
            [
                "10b3a44c60cf663d"
            ]
        ]
    },
    {
        "id": "10b3a44c60cf663d",
        "type": "oracle-exec",
        "z": "ce9de74d0c91d797",
        "g": "7767ae6264f855d1",
        "name": "",
        "usequery": true,
        "prepare": false,
        "error": "error",
        "remove": true,
        "query": [
            {
                "sql": "SELECT * \nFROM SCHEMA_NAME.EMPLOYEE\nWHERE EMP_FNAME = :fname\nAND EMP_LNAME - :lname",
                "name": "result1",
                "param": {
                    "type": "msg",
                    "value": "param"
                }
            },
            {
                "sql": "SELECT * \nFROM SCHEMA_NAME.EMPLOYEE\nWHERE NICKNAME= :nickname",
                "name": "result2",
                "param": {
                    "type": "msg",
                    "value": "paramNotUse"
                }
            }
        ],
        "server": "ec68b70a38aefb78",
        "resultaction": "single",
        "x": 320,
        "y": 360,
        "wires": [
            [
                "dd2413dd89673d31"
            ],
            [
                "52ad5e94a0436974"
            ]
        ]
    },
    {
        "id": "dd2413dd89673d31",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "7767ae6264f855d1",
        "name": "Result Data",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 510,
        "y": 340,
        "wires": []
    },
    {
        "id": "52ad5e94a0436974",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "7767ae6264f855d1",
        "name": "Error message",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "error",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 520,
        "y": 380,
        "wires": []
    },
    {
        "id": "90d9d1fd18688526",
        "type": "comment",
        "z": "ce9de74d0c91d797",
        "g": "7767ae6264f855d1",
        "name": "Select with parameter",
        "info": "",
        "x": 220,
        "y": 300,
        "wires": []
    },
    {
        "id": "57334808a0ee7685",
        "type": "comment",
        "z": "ce9de74d0c91d797",
        "g": "c2bea28554a72fbb",
        "name": "Simple",
        "info": "",
        "x": 170,
        "y": 100,
        "wires": []
    },
    {
        "id": "34064f5b851de2e7",
        "type": "inject",
        "z": "ce9de74d0c91d797",
        "g": "0bd884ea091f535a",
        "name": "",
        "props": [
            {
                "p": "single",
                "v": "{\"fname\":\"Nitisak\",\"lname\":\"Chancham\",\"age\":37,\"nickname\":\"North\"}",
                "vt": "json"
            },
            {
                "p": "mutil",
                "v": "[{\"fname\":\"Nitisak\",\"lname\":\"Chancham\",\"age\":37,\"nickname\":\"North\"},{\"fname\":\"Taveesak\",\"lname\":\"Chancham\",\"age\":67,\"nickname\":\"Ood\"},{\"fname\":\"Nitaya\",\"lname\":\"Chancham\",\"age\":65,\"nickname\":\"Nid\"}]",
                "vt": "json"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "x": 170,
        "y": 560,
        "wires": [
            [
                "ddfc9d25e6340a2f"
            ]
        ]
    },
    {
        "id": "ddfc9d25e6340a2f",
        "type": "oracle-exec",
        "z": "ce9de74d0c91d797",
        "g": "0bd884ea091f535a",
        "name": "",
        "usequery": true,
        "prepare": false,
        "error": "error",
        "remove": true,
        "query": [
            {
                "sql": "INSERT INTO SCHEMA_NAME.EMPLOYEE (EMP_FNAME, EMP_LNAME, EMP_AGE, NICKNAME)\nVALUES (:fname, :lname, :age, :nickname)",
                "name": "result1",
                "param": {
                    "type": "msg",
                    "value": "single"
                }
            },
            {
                "sql": "INSERT INTO SCHEMA_NAME.EMPLOYEE (EMP_FNAME, EMP_LNAME, EMP_AGE, NICKNAME)\nVALUES (:fname, :lname, :age, :nickname)",
                "name": "result2",
                "param": {
                    "type": "msg",
                    "value": "multi"
                }
            }
        ],
        "server": "ec68b70a38aefb78",
        "resultaction": "single",
        "x": 320,
        "y": 560,
        "wires": [
            [
                "57e4f1d1cb1394b5"
            ],
            [
                "2c813bdd55de77ec"
            ]
        ]
    },
    {
        "id": "57e4f1d1cb1394b5",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "0bd884ea091f535a",
        "name": "Result Data",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 510,
        "y": 540,
        "wires": []
    },
    {
        "id": "2c813bdd55de77ec",
        "type": "debug",
        "z": "ce9de74d0c91d797",
        "g": "0bd884ea091f535a",
        "name": "Error message",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "error",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 520,
        "y": 580,
        "wires": []
    },
    {
        "id": "f4332b9ccdf3cd3d",
        "type": "comment",
        "z": "ce9de74d0c91d797",
        "g": "0bd884ea091f535a",
        "name": "Insert with parameter",
        "info": "",
        "x": 220,
        "y": 500,
        "wires": []
    },
    {
        "id": "ec68b70a38aefb78",
        "type": "oracle-server",
        "connectionname": "Connection Name",
        "tnsname": "TESTDB",
        "connectiontype": "TNS Name",
        "instantclientpath": "F:\\instantclient_21_9",
        "host": "",
        "port": "",
        "reconnect": true,
        "reconnecttimeout": "5000",
        "db": ""
    }
]
```

