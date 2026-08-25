/*
example input json:

{
    "materialType": "MeshPhysicalNodeMaterial",
    "rootNodeId": "b495a934-979a-4316-b9bc-f1bab6b14de7",
    "materialSlots": {
        "colorNode": "b495a934-979a-4316-b9bc-f1bab6b14de7"
    },
    "nodes": [
        {
            "id": "b495a934-979a-4316-b9bc-f1bab6b14de7",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "8baba18f-5f3d-40cb-aed3-a3fd2bd78082"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "8baba18f-5f3d-40cb-aed3-a3fd2bd78082",
            "type": "JoinNode",
            "data": {
                "inputNodes": {
                    "nodes": [
                        "d228129c-923d-423b-aeb6-f136e6d044c4",
                        "ef9f2295-1813-43a4-bbd4-86e731922bc5",
                        "d32aa8b5-a490-4462-a56c-0d178db8ef83"
                    ]
                }
            },
            "customData": {
                "nodeType": "vec3",
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isTempNode": true
            }
        },
        {
            "id": "d228129c-923d-423b-aeb6-f136e6d044c4",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "93e295ce-20b9-437b-9e81-d8621e9c8577"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "93e295ce-20b9-437b-9e81-d8621e9c8577",
            "type": "OperatorNode",
            "data": {
                "inputNodes": {
                    "aNode": "b2f44d86-500b-4cfb-9e28-a24df0a120cb",
                    "bNode": "a4fbd93c-00eb-4ab3-ac19-394440d8aa10"
                },
                "op": "*"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isTempNode": true,
                "isOperatorNode": true,
                "intent": true
            }
        },
        {
            "id": "b2f44d86-500b-4cfb-9e28-a24df0a120cb",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "20d0616c-0f81-4808-9ba2-cbabad0b362d"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "20d0616c-0f81-4808-9ba2-cbabad0b362d",
            "type": "OperatorNode",
            "data": {
                "inputNodes": {
                    "aNode": "27d1876f-6fb6-4709-bc83-da2db0d6136d",
                    "bNode": "c9567ad0-24cb-4345-a89c-fa08b0643731"
                },
                "op": "+"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isTempNode": true,
                "isOperatorNode": true,
                "intent": true
            }
        },
        {
            "id": "27d1876f-6fb6-4709-bc83-da2db0d6136d",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "69b02419-0f62-4103-86e7-5cc6da97e4c9"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "69b02419-0f62-4103-86e7-5cc6da97e4c9",
            "type": "OperatorNode",
            "data": {
                "inputNodes": {
                    "aNode": "5c12d3df-abde-4ee8-a053-e9f89c1a79a6",
                    "bNode": "c9567ad0-24cb-4345-a89c-fa08b0643731"
                },
                "op": "*"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isTempNode": true,
                "isOperatorNode": true,
                "intent": true
            }
        },
        {
            "id": "5c12d3df-abde-4ee8-a053-e9f89c1a79a6",
            "type": "SplitNode",
            "data": {
                "inputNodes": {
                    "node": "3d42a7ea-bc3d-4e92-831d-dd86eb644415"
                },
                "components": "y"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isSplitNode": true
            }
        },
        {
            "id": "3d42a7ea-bc3d-4e92-831d-dd86eb644415",
            "type": "AttributeNode",
            "data": {
                "global": true,
                "_attributeName": "uv"
            },
            "customData": {
                "nodeType": "vec2",
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "parents": false,
                "isNode": true
            }
        },
        {
            "id": "c9567ad0-24cb-4345-a89c-fa08b0643731",
            "type": "ConstNode",
            "data": {
                "value": 0.5,
                "valueType": "float",
                "nodeType": null,
                "precision": null
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isInputNode": true,
                "isConstNode": true
            }
        },
        {
            "id": "a4fbd93c-00eb-4ab3-ac19-394440d8aa10",
            "type": "ConstNode",
            "data": {
                "value": 1.5,
                "valueType": "float",
                "nodeType": null,
                "precision": null
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isInputNode": true,
                "isConstNode": true
            }
        },
        {
            "id": "ef9f2295-1813-43a4-bbd4-86e731922bc5",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "edf2b573-95ac-4fc5-a167-cae8565992e8"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "edf2b573-95ac-4fc5-a167-cae8565992e8",
            "type": "ConvertNode",
            "data": {
                "inputNodes": {
                    "node": "202eaece-184d-4e1b-87cb-b33d22694e8e"
                },
                "convertTo": "float"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true
            }
        },
        {
            "id": "202eaece-184d-4e1b-87cb-b33d22694e8e",
            "type": "SplitNode",
            "data": {
                "inputNodes": {
                    "node": "56fd6776-0afa-423b-9697-7f78f343b748"
                },
                "components": "x"
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isSplitNode": true
            }
        },
        {
            "id": "56fd6776-0afa-423b-9697-7f78f343b748",
            "type": "AttributeNode",
            "data": {
                "global": true,
                "_attributeName": "uv"
            },
            "customData": {
                "nodeType": "vec2",
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "parents": false,
                "isNode": true
            }
        },
        {
            "id": "d32aa8b5-a490-4462-a56c-0d178db8ef83",
            "type": "VarNode",
            "data": {
                "inputNodes": {
                    "node": "db17973a-c6d8-43fb-b3d9-8dcaf0848873"
                }
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "global": true,
                "parents": true,
                "isNode": true,
                "isVarNode": true,
                "readOnly": false,
                "intent": true
            }
        },
        {
            "id": "db17973a-c6d8-43fb-b3d9-8dcaf0848873",
            "type": "ConstNode",
            "data": {
                "value": 0.3,
                "valueType": "float",
                "nodeType": "float",
                "precision": null
            },
            "customData": {
                "updateType": "none",
                "updateBeforeType": "none",
                "updateAfterType": "none",
                "version": 0,
                "name": "",
                "global": false,
                "parents": false,
                "isNode": true,
                "isInputNode": true,
                "isConstNode": true
            }
        }
    ],
    "edges": []
}


*/
