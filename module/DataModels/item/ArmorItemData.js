const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class ArmorItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "isEquipped": new StringField({required: true, initial:""}),
            "mods": new SchemaField({
                "max": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "maxAgi": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 100 })
            }),
            "ap": new SchemaField({
                "head": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "body": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "lArm": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "rArm": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "lLeg": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                }),
                "rLeg": new SchemaField({
                    "value": new NumberField({ required: true, integer: true, initial: 0 })
                })
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