const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class KnightCoreItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "originalId": new StringField({"initial":""}),
            "loaned": new ArrayField(new StringField({ initial: "" })),
            "isEquipped": new StringField({required: true, initial:""}),
            "speed": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "heatCap": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
    static migrateData(data){
        if(data.isEquipped===false || data.isEquipped===true){
            data.isEquipped="";
        }
        return super.migrateData(data);
    }
}