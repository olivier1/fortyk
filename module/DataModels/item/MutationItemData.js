const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class MutationItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "min": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "max": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
}