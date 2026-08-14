const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class MissionItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "exp": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "inf": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
}