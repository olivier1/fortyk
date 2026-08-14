const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class TalentnTraitItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "isAura": new SchemaField({
                    "value": new BooleanField({required: true, initial:false}),
                    "range": new NumberField({ required: true, integer: true, initial: 0 }),
                    "auraType": new StringField({ initial: "indiscriminate" }),
                    "los": new BooleanField({required: true, initial:false}),
                    "notSelf": new BooleanField({required: true, initial:false}),
                    "reqFlags": new StringField({ initial: "" }),
                    "negReqFlags": new StringField({ initial: "" })
                }),
            "tier": new SchemaField({
                "value": new StringField({ initial: "N/A" })
            }),
            "prereqs": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "aptitudes": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "specialisation": new SchemaField({
                "value": new StringField({ initial: "N/A" })
            }),
            "flagId": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "tags": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}