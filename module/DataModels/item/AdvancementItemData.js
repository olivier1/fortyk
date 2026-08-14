const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class AdvancementItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "cost": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "type": new SchemaField({
                "value": new StringField({ initial: "Custom" })
            }),
            "itemId": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "characteristic": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}