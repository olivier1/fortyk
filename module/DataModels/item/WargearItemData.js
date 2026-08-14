const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class WargearItemData extends PhysicalItemData {
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
                })
        };
    }
}