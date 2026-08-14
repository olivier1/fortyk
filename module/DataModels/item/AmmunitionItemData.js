const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import WeaponItemData from "./WeaponItemData.js";
export default class AmmunitionItemData extends WeaponItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "originalId": new StringField({"initial":""}),
            "loaned": new ArrayField(new StringField({ initial: "" })),
            "isEquipped": new StringField({required: true, initial:""}),
            "currentClip": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "default": new SchemaField({
                "value": new BooleanField({required: true, initial:true})
            }),
            "isFresh": new BooleanField({required: true, initial:true})
        };
    }
    static migrateData(data){
        if(data.isEquipped===false || data.isEquipped===true){
            data.isEquipped="";
        }
        return super.migrateData(data);
    }
}