const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class SpaceshipSquadronItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "type": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "rating": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "halfstr": new SchemaField({
                "value": new BooleanField({required: true, initial:false})
            }),
            "isEquipped": new StringField({required: true, initial:""}),
        };
    }
}