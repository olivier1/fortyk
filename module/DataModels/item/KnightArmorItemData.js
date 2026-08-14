const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class KnightArmorItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "originalId": new StringField({"initial":""}),
            "loaned": new ArrayField(new StringField({ initial: "" })),
            
            "isEquipped": new StringField({required: true, initial:""}),
            "weightRatio": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "armor": new SchemaField({
                "mod": new NumberField({ required: true, integer: true, initial: 1 })
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