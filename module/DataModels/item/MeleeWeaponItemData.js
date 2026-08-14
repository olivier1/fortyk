const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import WeaponItemData from "./WeaponItemData.js";
export default class MeleeWeaponItemData extends WeaponItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "originalId": new StringField({"initial":""}),
            "loaned": new ArrayField(new StringField({ initial: "" })),
            "isEquipped": new StringField({required: true, initial:""}),
            "mods": new SchemaField({
                "max": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "shield": new SchemaField({
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