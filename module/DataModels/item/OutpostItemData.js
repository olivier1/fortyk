const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class OutpostItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "location": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "type": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}