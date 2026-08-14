const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class SpaceshipWeaponItemData extends BaseItemData {
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
            "damage": new SchemaField({
                "value": new StringField({ initial: "1d10" })
            }),
            "range": new SchemaField({
                "value": new StringField({ initial: "0" })
            }),
            "strength": new SchemaField({
                "value": new StringField({ initial: "0" })
            }),
            "location": new SchemaField({
                "value": new StringField({ initial: "0" })
            }),
            "torpedo": new SchemaField({
                "rating": new NumberField({ required: true, integer: true, initial: 0 }),
                "id": new StringField({ initial: "" })
            }),
            "status": new SchemaField({
                "value": new StringField({ initial: "Online" })
            })
        };
    }
}