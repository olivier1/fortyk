const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import PhysicalItemData from "./PhysicalItemData.js";
export default class KnightComponentItemData extends PhysicalItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "isEquipped": new StringField({required: true, initial:""}),
            "structuralIntegrity": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "tonnage": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "space": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "armor": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "speed": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "manoeuvrability": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "quirk": new SchemaField({
                "uuid": new StringField({ initial: "" })
            }),
            "size": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 9 })
            }),
            "hardPoints": new SchemaField({
                "carapace": new SchemaField({
                    "titanicArtillery": new ArrayField(new SchemaField({})),
                    "titanicRanged": new ArrayField(new SchemaField({})),
                    "auxiliary": new ArrayField(new SchemaField({}))
                }),
                "leftArm": new SchemaField({
                    "titanicRanged": new ArrayField(new SchemaField({})),
                    "titanicMelee": new ArrayField(new SchemaField({})),
                    "auxiliary": new ArrayField(new SchemaField({}))
                }),
                "torso": new SchemaField({
                    "titanicRanged": new ArrayField(new SchemaField({})),
                    "titanicMelee": new ArrayField(new SchemaField({})),
                    "auxiliary": new ArrayField(new SchemaField({}))
                }),
                "rightArm": new SchemaField({
                    "titanicRanged": new ArrayField(new SchemaField({})),
                    "titanicMelee": new ArrayField(new SchemaField({})),
                    "auxiliary": new ArrayField(new SchemaField({}))
                })
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