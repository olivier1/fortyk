const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class PhysicalItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "weight": new SchemaField({
                    "value": new NumberField({"initial":0, "integer":false}),
                    "total": new NumberField({"initial":0, "integer":false})
                }),
                "rarity": new SchemaField({
                    "value": new StringField({ initial: "" })
                }),
                "amount": new SchemaField({
                    "value": new NumberField({"initial":1, "integer":true}),
                    "taken": new NumberField({"initial":0, "integer":true}),
                    "left": new NumberField({"initial":0, "integer":true})
                }),
                "quality": new SchemaField({
                    "value": new StringField({ initial: "Common" })
                }),
                "space": new SchemaField({
                    "value": new NumberField({"initial":0, "integer":true})
                }),
                "state": new SchemaField({
                    "value": new StringField({ initial: "O" })
                }),
                "price": new SchemaField({
                    "value": new NumberField({"initial":0, "integer":true}),
                    "bonds": new NumberField({"initial":0, "integer":true})
                })
        };
    }
}