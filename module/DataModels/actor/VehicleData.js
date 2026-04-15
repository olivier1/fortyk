"name": {
                "value": "",
                "type": "String"
            },
            "type": {
                "value": "",
                "type": "String"
            },
            "secChar": {
                "tempMod": {
                    "value": 0,
                    "type": "Number"
                },
                "speed": {
                    "tactical": 0,
                    "cruising": 0,
                    "motive": "O",
                    "mod": 0,
                    "multi": 1
                },
                "manoeuvrability": {
                    "value": 0,
                    "type": "Number"
                },
                "wounds": {
                    "type": "Number",
                    "min": -10,
                    "value": 10,
                    "max": 10,
                    "thresholds": {
                        "1": 0,
                        "2": 0,
                        "3": 0,
                        "4": 0
                    }
                },
                "attacks": {
                    "standard": 10,
                    "charge": 20,
                    "allOut": 30,
                    "stun": -20,
                    "guarded": -10,
                    "semi": 0,
                    "full": -10,
                    "aim": {
                        "half": 10,
                        "full": 20
                    },
                    "swift": 0,
                    "lightning": -10,
                    "called": -20,
                    "gangup": {
                        "0": 0,
                        "1": 10,
                        "2": 20
                    },
                    "range": {
                        "pointblank": 30,
                        "short": 10,
                        "standard": 0,
                        "long": -10,
                        "extreme": -30
                    }
                },
                "size": {
                    "value": 3,
                    "mod": 0,
                    "stealth": 0,
                    "movement": 0,
                    "label": "Average",
                    "size": 1
                },
                "lastHit": {
                    "value": "body",
                    "label": "Body",
                    "dos": 1,
                    "type": "String",
                    "aim": false,
                    "hits": 1,
                    "attackRange": "",
                    "vehicle": false,
                    "vehicleFacing": "",
                    "vehicleHitLocation": ""
                },
                "cover": {
                    "value": 0,
                    "type": "String"
                },
                "initiative": {
                    "value": 0,
                    "type": "Number"
                },
                "wornGear": {
                    "forceField": {}
                }
            },
            "globalMOD": {
                "value": 0,
                "type": "Number"
            },
            "facings": {
                "front": {
                    "value": 0,
                    "armor": 0,
                    "armorMod": 0,
                    "type": "Number",
                    "label": "Front",
                    "angle": 90,
                    "start": 315,
                    "end": 45,
                    "path": "front"
                },
                "rSide": {
                    "value": 0,
                    "armor": 0,
                    "armorMod": 0,
                    "type": "Number",
                    "label": "Right Side",
                    "angle": 90,
                    "start": 46,
                    "end": 134,
                    "path": "rSide"
                },
                "rear": {
                    "value": 0,
                    "armor": 0,
                    "armorMod": 0,
                    "type": "Number",
                    "label": "Rear",
                    "angle": 90,
                    "start": 135,
                    "end": 225,
                    "path": "rear"
                },
                "lSide": {
                    "value": 0,
                    "armor": 0,
                    "armorMod": 0,
                    "type": "Number",
                    "label": "Left Side",
                    "angle": 90,
                    "start": 226,
                    "end": 314,
                    "path": "lSide"
                }
            },
            "hasTurret": {
                "value": false,
                "type": "Boolean"
            },
            "crew": {
                "value": "",
                "capacity": "",
                "type": "String",
                "pilotID": "",
                "rating": 30,
                "ws": 30,
                "bs": 30
            },
            "description": {
                "value": "",
                "type": "String"
            },
            "knight": {
                "house": "",
                "chassis": "",
                "plating": "",
                "sensor": "",
                "coreMod": "",
                "core": "",
                "overload": 0,
                "structure": "",
                "armor": "",
                "forceField": "",
                "armActuator": "",
                "legActuator": "",
                "throneMod": "",
                "gyro": "",
                "components": [
                    ""
                ],
                "spirit": "",
                "operate": "operate:titanicwalker",
                "heat": {
                    "value": 0,
                    "cap": 0,
                    "mod": 0,
                    "max": 0
                }
            }