const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class WeaponItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
           
                "damageFormula": new SchemaField({
                    "value": new StringField({ initial: "1d10" }),
                    "formula": new StringField({ initial: "1d10" })
                }),
                "pen": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 }),
                    "formula": new StringField({ initial: "0" })
                }),
                "attackMods": new SchemaField({
                    "single": new NumberField({ required: true, integer: true, initial: 10 }),
                    "semi": new NumberField({ required: true, integer: true, initial: 0 }),
                    "full": new NumberField({ required: true, integer: true, initial: -10 }),
                    "suppressive": new NumberField({ required: true, integer: true, initial: -20 }),
                    "aim": new SchemaField({
                        "half": new NumberField({ required: true, integer: true, initial: 10 }),
                        "full": new NumberField({ required: true, integer: true, initial: 20 })
                    }),
                    "range": new SchemaField({
                        "pointblank": new NumberField({ required: true, integer: true, initial: 30 }),
                        "short": new NumberField({ required: true, integer: true, initial: 10 }),
                        "standard": new NumberField({ required: true, integer: true, initial: 0 }),
                        "long": new NumberField({ required: true, integer: true, initial: -10 }),
                        "extreme": new NumberField({ required: true, integer: true, initial: -30 })
                    })
                }),
                "testMod": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "range": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 1 }),
                    "formula": new StringField({ initial: "1" }),
                    "multi": new NumberField({ required: true, integer: true, initial: 1 })
                }),
                "damageType": new SchemaField({
                    "value": new StringField({ initial: "Explosive" })
                }),
                "class": new SchemaField({
                    "value": new StringField({ initial: "Basic" })
                }),
                "type": new SchemaField({
                    "value": new StringField({ initial: "Bolt" })
                }),
                "twohanded": new SchemaField({
                    "value": new BooleanField({required: true, initial:true})
                }),
                "facing": new SchemaField({
                    "value": new StringField({ initial: "" })
                }),
                "mounting": new SchemaField({
                    "value": new StringField({ initial: "" })
                })
        };
    }
}