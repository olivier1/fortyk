const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
function resourceField(initialValue, initialMax) {
    return new SchemaField({
        // Make sure to call new so you invoke the constructor!
        min: new NumberField({ initial: 0 }),
        value: new NumberField({ initial: initialValue }),
        max: new NumberField({ initial: initialMax }),
    });
}
export default class VehicleData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        return {
            "type": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "secChar": new SchemaField({
                "tempMod": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "speed": new SchemaField({
                    "tactical": new NumberField({ required: true, integer: true, initial: 0 }),
                    "cruising": new StringField({ required: true, initial: "" }),
                    "motive": new StringField({ initial: "O" }),
                    "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "multi": new NumberField({ required: true, integer: true, initial: 1 })
                }),
                "manoeuvrability": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "wounds": new SchemaField({
                    "min": new NumberField({ required: true, integer: true, initial: -10 }),
                    "value": new NumberField({ required: true, integer: true, initial: 10 }),
                    "max": new NumberField({ required: true, integer: true, initial: 10 }),
                    "thresholds": new SchemaField({
                        "1": new NumberField({ required: true, integer: true, initial: 0 }),
                        "2": new NumberField({ required: true, integer: true, initial: 0 }),
                        "3": new NumberField({ required: true, integer: true, initial: 0 }),
                        "4": new NumberField({ required: true, integer: true, initial: 0 })
                    })
                }),
                "barrier":new SchemaField({
                    "max":new NumberField({ required: true, integer: true, initial: 0 }),
                    "value":new NumberField({ required: true, integer: true, initial: 0 }),
                    "rate":new NumberField({ required: true, integer: true, initial: 0 }),
                    "cooldown":new NumberField({ required: true, integer: true, initial: 0 }),
                    "currentCD":new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "attacks": new SchemaField({
                    "standard": new NumberField({ required: true, integer: true, initial: 10 }),
                    "charge": new NumberField({ required: true, integer: true, initial: 20 }),
                    "allOut": new NumberField({ required: true, integer: true, initial: 30 }),
                    "stun": new NumberField({ required: true, integer: true, initial: -20 }),
                    "guarded": new NumberField({ required: true, integer: true, initial: -10 }),
                    "semi": new NumberField({ required: true, integer: true, initial: 0 }),
                    "full": new NumberField({ required: true, integer: true, initial: -10 }),
                    "aim": new SchemaField({
                        "half": new NumberField({ required: true, integer: true, initial: 10 }),
                        "full": new NumberField({ required: true, integer: true, initial: 20 })
                    }),
                    "swift": new NumberField({ required: true, integer: true, initial: 0 }),
                    "lightning": new NumberField({ required: true, integer: true, initial: -10 }),
                    "called": new NumberField({ required: true, integer: true, initial: -20 }),
                    "gangup": new SchemaField({
                        "0": new NumberField({ required: true, integer: true, initial: 0 }),
                        "1": new NumberField({ required: true, integer: true, initial: 10 }),
                        "2": new NumberField({ required: true, integer: true, initial: 20 })
                    }),
                    "range": new SchemaField({
                        "pointblank": new NumberField({ required: true, integer: true, initial: 30 }),
                        "short": new NumberField({ required: true, integer: true, initial: 10 }),
                        "standard": new NumberField({ required: true, integer: true, initial: 0 }),
                        "long": new NumberField({ required: true, integer: true, initial: -10 }),
                        "extreme": new NumberField({ required: true, integer: true, initial: -30 })
                    })
                }),
                "size": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 3 }),
                    "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "stealth": new NumberField({ required: true, integer: true, initial: 0 }),
                    "movement": new NumberField({ required: true, integer: true, initial: 0 }),
                    "label": new StringField({ initial: "Average" }),
                    "size": new NumberField({ required: true, integer: true, initial: 1 })
                }),
                "lastHit": new SchemaField({
                    "value": new StringField({ initial: "body" }),
                    "label": new StringField({ initial: "Body" }),
                    "dos": new NumberField({ required: true, integer: true, initial: 1 }),
                    "aim": new BooleanField({required: true, initial:false}),
                    "hits": new NumberField({ required: true, integer: true, initial: 1 }),
                    "attackRange": new StringField({ initial: "" }),
                    "vehicle": new BooleanField({required: true, initial:false}),
                    "vehicleFacing": new StringField({ initial: "" }),
                    "vehicleHitLocation": new StringField({ initial: "" })
                }),
                "cover": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "initiative": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "wornGear": new SchemaField({
                    "forceField": new SchemaField({})
                })
            }),
            "globalMOD": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "facings": new SchemaField({
                "front": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armor": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armorMod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "label": new StringField({ initial: "Front" }),
                    "angle": new NumberField({ readonly:true, required: true, integer: true, initial: 90 }),
                    "start": new NumberField({ readonly:true, required: true, integer: true, initial: 315 }),
                    "end": new NumberField({ readonly:true, required: true, integer: true, initial: 45 }),
                    "path": new StringField({ initial: "front" })
                }),
                "rSide": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armor": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armorMod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "label": new StringField({ initial: "Right Side" }),
                    "angle": new NumberField({ readonly:true, required: true, integer: true, initial: 90 }),
                    "start": new NumberField({ readonly:true, required: true, integer: true, initial: 46 }),
                    "end": new NumberField({ readonly:true, required: true, integer: true, initial: 134 }),
                    "path": new StringField({ initial: "rSide" })
                }),
                "rear": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armor": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armorMod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "label": new StringField({ initial: "Rear" }),
                    "angle": new NumberField({ readonly:true, required: true, integer: true, initial: 90 }),
                    "start": new NumberField({ readonly:true, required: true, integer: true, initial: 135 }),
                    "end": new NumberField({ readonly:true, required: true, integer: true, initial: 225 }),
                    "path": new StringField({ initial: "rear" })
                }),
                "lSide": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armor": new NumberField({ required: true, integer: true, initial: 0 }),
                    "armorMod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "label": new StringField({ initial: "Left Side" }),
                    "angle": new NumberField({ readonly:true, required: true, integer: true, initial: 90 }),
                    "start": new NumberField({ readonly:true, required: true, integer: true, initial: 226 }),
                    "end": new NumberField({ readonly:true, required: true, integer: true, initial: 314 }),
                    "path": new StringField({ initial: "lSide" })
                })
            }),
            "hasTurret": new SchemaField({
                "value": new BooleanField({required: true, initial:false})
            }),
            "crew": new SchemaField({
                "value": new StringField({ initial: "" }),
                "capacity": new StringField({ initial: "" }),
                "pilotID": new StringField({ initial: "" }),
                "rating": new NumberField({ required: true, integer: true, initial: 30 }),
                "ws": new NumberField({ required: true, integer: true, initial: 30 }),
                "bs": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "description": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "knight": new SchemaField({
                "house": new StringField({ initial: "" }),
                "chassis": new StringField({ initial: "" }),
                "plating": new StringField({ initial: "" }),
                "sensor": new StringField({ initial: "" }),
                "coreMod": new StringField({ initial: "" }),
                "core": new StringField({ initial: "" }),
                "overload": new NumberField({ required: true, integer: true, initial: 0 }),
                "structure": new StringField({ initial: "" }),
                "armor": new StringField({ initial: "" }),
                "forceField": new StringField({ initial: "" }),
                "armActuator": new StringField({ initial: "" }),
                "legActuator": new StringField({ initial: "" }),
                "throneMod": new StringField({ initial: "" }),
                "gyro": new StringField({ initial: "" }),
                "components": new ArrayField(new StringField({ initial: "" })),
                "spirit": new StringField({ initial: "" }),
                "operate": new StringField({ initial: "operate:titanicwalker" }),
                "heat": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "cap": new NumberField({ required: true, integer: true, initial: 0 }),
                    "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                    "max": new NumberField({ required: true, integer: true, initial: 0 })
                })
            })
        };
    }
}