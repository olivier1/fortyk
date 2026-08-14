const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class SpaceshipComponentItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "power": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "space": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "sp": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "type": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "status": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}