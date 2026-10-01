
export default class SecondaryCharacteristicsModel extends foundry.abstract.DataModel {
    static defineSchema() {
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
        return {
            tempMod: new SchemaField({
                value: new NumberField({ required: true, initial: 0 }),
                command: new NumberField({ required: true, initial: 0 })
            }),
            wounds: new SchemaField({

                value: new NumberField({ required: true, initial: 10 }),
                max: new NumberField({ required: true, initial: 10 }),


                min: new NumberField({ required: true, min:-10, initial: -10 }),
                bonus: new NumberField({ required: true, initial: 0 })
            }),
            barrier:new SchemaField({
                max:new NumberField({ required: true, initial: 0 }),
                value:new NumberField({ required: true, initial: 0 }),
                rate:new NumberField({ required: true, initial: 0 }),
                cooldown:new NumberField({ required: true, initial: 0 }),
                currentCD:new NumberField({ required: true, initial: 0 })
            }),
            fatigue: new SchemaField({
                min: new NumberField({ required: true, initial: 0 }),
                value: new NumberField({ required: true, initial: 0 }),
                max: new NumberField({ required: true, initial: 0 })
            }),
            fate: resourceField(0,0),
            corruption: new SchemaField({
                value: new NumberField({ required: true, initial: 0 }),
                chars: new StringField({ initial: "" }),
                mod: new NumberField({ required: true, initial: 0 }),
                khorne: new NumberField({ required: true, initial: 0 }),
                nurgle: new NumberField({ required: true, initial: 0 }),
                slaanesh: new NumberField({ required: true, initial: 0 }),
                tzeentch: new NumberField({ required: true, initial: 0 }),
                malice: new NumberField({ required: true, initial: 0 })
            }),
            insanity: new SchemaField({
                value: new NumberField({ required: true, initial: 0 , min: 0 }),
                shock: new StringField({ initial: "" }),
                mod:  new NumberField({ required: true, initial: 0 })
            }),
            wornGear: new SchemaField({
                weapons: new ArrayField(new StringField({ initial: "" })),
                extraWeapons: new ArrayField(new StringField({ initial: "" })),
                armor: new SchemaField({}),
                forceField: new SchemaField({})
            }),
            movement: new SchemaField({
                half:  new NumberField({ required: true, initial: 1 , min: 1 }),
                full:  new NumberField({ required: true, initial: 1 , min: 1 }),
                charge:  new NumberField({ required: true, initial: 0 , min: 0 }),
                run: new NumberField({ required: true, initial: 0 , min: 0 }),
                mod:  new NumberField({ required: true, initial: 0 , min: 0 }),
                multi:  new NumberField({ required: true, initial: 1 , min: 0 })
            }),
            attacks: new SchemaField({
                standard: new NumberField({ required: true, initial: 10}),
                charge: new NumberField({ required: true, initial: 20}),
                allOut: new NumberField({ required: true, initial: 30}),
                stun: new NumberField({ required: true, initial: -20}),
                guarded: new NumberField({ required: true, initial: -10}),
                semi: new NumberField({ required: true, initial: 0}),
                full: new NumberField({ required: true, initial: -10}),
                aim: new SchemaField( {
                    half: new NumberField({ required: true, initial: 10}),
                    full: new NumberField({ required: true, initial: 20})
                }),
                swift: new NumberField({ required: true, initial: 0}),
                lightning: new NumberField({ required: true, initial: -10}),
                cad: new NumberField({ required: true, initial: -20}),
                gangup: new SchemaField({
                    0: new NumberField({ required: true, initial: 0}),
                    1: new NumberField({ required: true, initial: 10}),
                    2: new NumberField({ required: true, initial: 20})
                }),
                range: new SchemaField({
                    pointblank: new NumberField({ required: true, initial: 30}),
                    short: new NumberField({ required: true, initial: 10}),
                    standard: new NumberField({ required: true, initial: 0}),
                    long: new NumberField({ required: true, initial: -10}),
                    extreme: new NumberField({ required: true, initial: -30})
                })
            }),
            size: new SchemaField({
                value: new NumberField({ required: true, initial: 3}),
                mod: new NumberField({ required: true, initial: 0}),
                stealth: new NumberField({ required: true, initial: 0}),
                movement: new NumberField({ required: true, initial: 0}),
                label: new StringField({ initial: "Average" }),
                size: new NumberField({ required: true, initial: 1})
            }),
            lastHit: new SchemaField({
                value: new StringField({ initial: "body" }),
                label: new StringField({ initial: "Body" }),
                dos: new NumberField({ required: true, initial: 1}),
                aim: new BooleanField({required: true, initial:false}),
                hits: new NumberField({ required: true, initial: 1}),
                attackRange: new StringField({ initial: "" }),
                vehicle: new BooleanField({required: true, initial:false}),
                vehicleFacing: new StringField({ initial: "" }),
                vehicleHitLocation: new StringField({ initial: "" }),
                attackType: new StringField({initial: ""})
            }),
            cover: new SchemaField({
                value: new NumberField({ required: true, integer: false, initial: 0})
            }),
            initiative: new SchemaField({
                value: new NumberField({ required: true, initial: 0})
            }),
            fearMod: new NumberField({ required: true, initial: 0})
        };
    }
}
