const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import CharacterData from "./CharacterData.js";
class PCData extends CharacterData {
    static defineScheme(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "experience": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 }),
                "spent": new NumberField({ required: true, integer: true, initial: 0 }),
                "starting": new NumberField({ required: true, integer: true, initial: 2000 }),
                "earned": new NumberField({ required: true, integer: true, initial: 0 }),
            }),
            "carry": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 }),
                "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                "max": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "aptitudes": new SchemaField({
                "0": new StringField({ initial: "" }),
                "1": new StringField({ initial: "" }),
                "2": new StringField({ initial: "" }),
                "3": new StringField({ initial: "" }),
                "4": new StringField({ initial: "" }),
                "5": new StringField({ initial: "" }),
                "6": new StringField({ initial: "" }),
                "7": new StringField({ initial: "" })
            }),
            "currency": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 }),
                "income": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "goal": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "chapter": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "background": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "role": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "honours": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "eliteAdvances": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "quirks": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "superstitions": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "momentos": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}