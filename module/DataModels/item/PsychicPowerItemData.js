const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class PsychicPowerItemData extends BaseItemData {
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
                "value": new StringField({ initial: "Energy" })
            }),
            "class": new SchemaField({
                "value": new StringField({ initial: "Psychic Bolt" })
            }),
            "action": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "subtype": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "discipline": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "testChar": new SchemaField({
                "value": new StringField({ initial: "wp" }),
                "type": new StringField({ initial: "Characteristic" })
            }),
            "sustain": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "curPR": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 1 })
            }),
            "reqs": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "affects": new SchemaField({
                "value": new StringField({ initial: "multiple" })
            }),
            "target": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "training": new SchemaField({
                "value": new StringField({ initial: "Novice" })
            }),
            "cost": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "macro": new SchemaField({
                "id": new StringField({ initial: "" }),
                "user": new StringField({ initial: "gm" })
            })
        };
    }
}