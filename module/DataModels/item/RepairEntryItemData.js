const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class RepairEntryItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "time": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "cost": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "calendar": new SchemaField({
                "calendarId": new StringField({ initial: "" }),
                "noteId": new StringField({ initial: "" })
            }),
            "knight": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "repairs": new SchemaField({
                "entries": new ArrayField(new SchemaField({})),
                "wounds": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
}