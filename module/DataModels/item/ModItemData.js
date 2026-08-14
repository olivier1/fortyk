const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class ModItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "type": new SchemaField({
                "value": new StringField({"initial":""})
            }),
            "isOneUse": new BooleanField({required: true, initial:false})
        };
    }
}