const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import WeaponItemData from "./WeaponItemData.js";
export default class RangedWeaponItem extends WeaponItemData {
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
            "rof": new SchemaField({
                "0": new SchemaField({"value":new StringField({"initial":"S"})}),
                "1": new SchemaField({"value":new StringField({"initial":"-"})}),
                "2": new SchemaField({"value":new StringField({"initial":"-"})})
            }),
            "clip": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 }),
                "max": new NumberField({ required: true, integer: true, initial: 0 }),
                "consumption": new NumberField({ required: true, integer: true, initial: 1 }),
                "formula": new StringField({"initial":""})
            }),
            "ammo": new SchemaField({
                "_id": new StringField({"initial":""})
            }),
            "reload": new SchemaField({
                "value": new StringField({"initial":""})
            })
        };
    }
    static migrateData(data){
        if(data.isEquipped===false || data.isEquipped===true){
            data.isEquipped="";
        }
        if(Array.isArray(data.rof)){
            let rof=data.rof;
            let rofObj={"0":{value:rof[0]},
                        "1":{value:rof[1]},
                        "2":{value:rof[2]}};
            data.rof=rofObj;
        }
        const clip=data.clip;
        if(clip!==undefined){
            var clipValue = data?.clip?.value;
            if(clipValue&&isNaN(parseInt(clipValue))){
                data.clip.value=0;
            }
            var clipMax = data?.clip?.max;
            if(!clipMax&&isNaN(parseInt(clipMax))){
                data.clip.max=1;
            }
        }

        return super.migrateData(data);
    }
}