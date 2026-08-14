const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class SpaceshipCargoItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "type": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "space": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 1 })
            }),
            "pf": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 1 }),
                "total": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "rarity": new SchemaField({
                "value": new StringField({ initial: "Common" })
            }),
            "quality": new SchemaField({
                "value": new StringField({ initial: "Common" })
            }),
            "damage": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "rating": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 20 })
            })
        };
    }
}