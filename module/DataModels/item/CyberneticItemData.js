const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class CyberneticItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "location": new SchemaField({
                "value": new StringField({ initial: "head" })
            })
        };
    }
}