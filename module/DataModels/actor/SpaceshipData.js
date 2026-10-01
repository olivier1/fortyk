
export class SpaceshipData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
function resourceField(initialValue=0, initialMax=0) {
    return new SchemaField({
        // Make sure to call new so you invoke the constructor!
        min: new NumberField({ required: true,initial: 0 }),
        value: new NumberField({ required: true,initial: initialValue }),
        max: new NumberField({ required: true,initial: initialMax }),
    });
}
        return {
            "shipClass": new SchemaField({
                "value": new StringField({required: true, initial: ""})
            }),
            "hull": new SchemaField({
                "value": new StringField({required: true, initial: ""})
            }),
            "speed": new SchemaField({
                "value": new StringField({required: true, initial: "0" })
            }),
            "manoeuvrability": new SchemaField({
                "value": new NumberField({required: true, initial: 0 })
            }),
            "detection": new SchemaField({
                "value": new NumberField({required: true, initial: 0 })
            }),
            "turret": new SchemaField({
                "value": new NumberField({required: true, initial: 0  })
            }),
            "globalMOD": new SchemaField({
                "value": new NumberField({ required: true,  initial: 0})
            }),
            "secChar": new SchemaField({
                "tempMod": new SchemaField({
                    "value": new NumberField({ required: true,  initial: 0 }),
                    "command": new NumberField({ required: true,  initial: 0 })
                }),
                "lastHit": new SchemaField({
                    "value": new StringField({ initial: "body" }),
                    "label": new StringField({ initial: "Body" }),
                    "dos": new NumberField({ required: true,  initial: 1}),
                    "aim": new BooleanField({required: true, initial:false}),
                    "hits": new NumberField({ required: true,  initial: 1}),
                    "attackRange": new StringField({ initial: "" }),
                    "vehicle": new BooleanField({required: true, initial:false}),
                    "vehicleFacing": new StringField({ initial: "" }),
                    "vehicleHitLocation": new StringField({ initial: "" })
                })}),
            "shields": new SchemaField({
                "value": new NumberField({required: true, initial: 0 })
            }),
            "armor": new SchemaField({
                "value": new NumberField({required: true, initial: 0 })
            }),
            "hullIntegrity": new SchemaField({
                "value": new NumberField({required: true, initial: 40 }),
                "max": new NumberField({required: true, initial: 40 }),
                "min": new NumberField({required: true, initial: 0 })
            }),
            "space": new SchemaField({
                "value": new NumberField({required: true, initial: 0 }),
                "max": new NumberField({required: true, initial: 0 }),
                "min": new NumberField({required: true, initial: 0 })
            }),
            "power": new SchemaField({
                "value": new NumberField({required: true, initial: 0 }),
                "max": new NumberField({required: true, initial: 0 }),
                "min": new NumberField({required: true, initial: 0 })
            }),
            "crew": new SchemaField({
                "value": new NumberField({required: true, initial: 100 }),
                "max": new NumberField({required: true, initial: 100 }),
                "min": new NumberField({required: true, initial: 0 }),
                "rating": new NumberField({required: true, initial: 30 }),
                "capacity": new StringField({required: true, initial: ""})
            }),
            "morale": new SchemaField({
                "value": new NumberField({required: true, initial: 100 }),
                "max": new NumberField({required: true, initial: 100 }),
                "min": new NumberField({ required: true,initial: 0 })
            }),
            "weaponCapacity": new SchemaField({
                "dorsal": new NumberField({required: true, initial: 0 }),
                "prow": new NumberField({required: true, initial: 0 }),
                "keel": new NumberField({required: true, initial: 0 }),
                "port": new NumberField({required: true, initial: 0 }),
                "starboard": new NumberField({required: true, initial: 0 })
            }),
            "complications": new ArrayField(new StringField()),
            "shipPoints": new SchemaField({
                "value": new NumberField({required: true, initial: 0 }),
                "spent": new NumberField({required: true, initial: 0 }),
                "remaining": new NumberField({required: true, initial: 0 })
            }),
            "cargo": new SchemaField({
                "value": new NumberField({ required: true,initial: 0 }),
                "max": new NumberField({required: true, initial: 0 }),
                "min": new NumberField({required: true, initial: 0 }),
                "supplies": new NumberField({required: true, initial: 180 }),
                "suppliesMax": new NumberField({ required: true,initial: 180 }),
                "fuel": new NumberField({ required: true,initial: 0 }),
                "fuelMax":new NumberField({ required: true,initial: 0 }),
                "profit": new NumberField({required: true, initial: 0 }),
                "trade":new NumberField({required: true, initial: 0 })
            })
        };
    }
    static migrateData(data){
        if(data.class){
            data.shipClass=data.class;
        }
        return data;
    }
}
