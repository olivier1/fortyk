const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class SkillItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "parent": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "hasChildren": new SchemaField({
                "value": new BooleanField({required: true, initial:false})
            }),
            "value": new NumberField({ required: true, integer: true, initial: -20 }),
            "characteristic": new SchemaField({
                "value": new StringField({ initial: "int" })
            }),
            "mod": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "total": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "aptitudes": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "skillUse": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}