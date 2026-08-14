const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class OutpostItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "failure": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "meldMod": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "meldBonus": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "id": new StringField({ initial: "" })
        };
    }
}