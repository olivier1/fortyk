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
export default class SpaceshipData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        return {
                "class": new SchemaField({
                    "value": new StringField({ initial: ""})
                }),
                "hull": new SchemaField({
                    "value": new StringField({ initial: ""})
                }),
                "speed": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "manoeuvrability": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "detection": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "turret": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "shields": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "armor": new SchemaField({
                    "value": new NumberField({ initial: 0 })
                }),
                "hullIntegrity": new SchemaField({
                    "value": new NumberField({ initial: 40 }),
                    "max": new NumberField({ initial: 40 }),
                    "min": new NumberField({ initial: 0 })
                }),
                "space": new SchemaField({
                    "value": new NumberField({ initial: 0 }),
                    "max": new NumberField({ initial: 0 }),
                    "min": new NumberField({ initial: 0 })
                }),
                "power": new SchemaField({
                    "value": new NumberField({ initial: 0 }),
                    "max": new NumberField({ initial: 0 }),
                    "min": new NumberField({ initial: 0 })
                }),
                "crew": new SchemaField({
                    "value": new NumberField({ initial: 100 }),
                    "max": new NumberField({ initial: 100 }),
                    "min": new NumberField({ initial: 0 }),
                    "rating": new NumberField({ initial: 30 }),
                    "capacity": new StringField({ initial: ""})
                }),
                "morale": new SchemaField({
                    "value": new NumberField({ initial: 100 }),
                    "max": new NumberField({ initial: 100 }),
                    "min": new NumberField({ initial: 0 })
                }),
                "weaponCapacity": new SchemaField({
                    "dorsal": new NumberField({ initial: 0 }),
                    "prow": new NumberField({ initial: 0 }),
                    "keel": new NumberField({ initial: 0 }),
                    "port": new NumberField({ initial: 0 }),
                    "starboard": new NumberField({ initial: 0 })
                }),
                "complications": new SchemaField({
                    "0": new StringField({ initial: ""}),
                    "1": new StringField({ initial: ""})
                }),
                "shipPoints": new SchemaField({
                    "value": new NumberField({ initial: 0 }),
                    "spent": new NumberField({ initial: 0 }),
                    "remaining": new NumberField({ initial: 0 })
                }),
                "cargo": new SchemaField({
                    "value": new NumberField({ initial: 0 }),
                    "max": new NumberField({ initial: 0 }),
                    "min": new NumberField({ initial: 0 }),
                    "supplies": new NumberField({ initial: 180 }),
                    "suppliesMax": new NumberField({ initial: 180 }),
                    "fuel": new NumberField({ initial: 0 }),
                    "fuelMax":new NumberField({ initial: 0 }),
                    "profit": new NumberField({ initial: 0 }),
                    "trade":new NumberField({ initial: 0 })
                })
               };
    }
}
