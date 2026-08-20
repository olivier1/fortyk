const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class ForcefieldItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "originalId": new StringField({"initial":""}),
            "loaned": new ArrayField(new StringField({ initial: "" })),
            
            "isEquipped": new StringField({required: true, initial:""}),
            "rating": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 }),
                "overload": new NumberField({ required: true, integer: true, initial: 0 }),
                "overloadOnDigit": new NumberField({ required: true, integer: true, initial: -1 })
            }),
            "overloadBreak": new SchemaField({
                "value": new BooleanField({required: true, initial:true})
            }),
            "broken": new SchemaField({
                "value": new BooleanField({required: true, initial:false})
            }),
            "type": new SchemaField({
                "value": new StringField({"initial":"field"})
            }),
            "barrier": new SchemaField({
                "max": new NumberField({ required: true, integer: true, initial: 0 }),
                "rate": new NumberField({ required: true, integer: true, initial: 0 }),
                "cooldown": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
    static migrateData(data){
        if(data.isEquipped===false || data.isEquipped===true){
            data.isEquipped="true";
        }
        return super.migrateData(data);
    }
}