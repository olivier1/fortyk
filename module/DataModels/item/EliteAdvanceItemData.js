const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class EliteAdvanceItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "type": new SchemaField({
                "value": new StringField({ initial: "ea" })
            }),
            "items": new ArrayField(new SchemaField({
                "isAND": new BooleanField({initial:false}),
                "isOR": new BooleanField({initial:false}),
                "name": new StringField({initial:""}),
                "spec": new StringField({initial:"n/a"}),
                "uuid": new StringField({initial:""}),
                "amount": new NumberField({initial:0, required:false}),
                "quality": new StringField({required: false, initial:"Common"})
            })),
            "itemIds": new ArrayField(new StringField({ initial: "" })),
            "requirements": new StringField({ initial: "" }),
            "skills": new StringField({ initial: "" }),
            "flag": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "cost": new SchemaField({
                "value": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "flagId": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "aptitude": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "experience": new NumberField({ required: true, integer: true, initial: 2000 }),
            "hasSubtype": new BooleanField({required: true, initial:false}),
            "parentType": new StringField({ initial: "" }),
            "wounds": new SchemaField({
                "formula": new StringField({ initial: "" }),
                "alternate": new StringField({ initial: "" })
            }),
            "fate": new SchemaField({
                "threshold": new NumberField({ required: true, integer: true, initial: 0 }),
                "roll": new StringField({ initial: "" })
            }),
            "asuryani":new SchemaField({
                "base":new SchemaField({
                    "id":new StringField({ initial: "" }),
                    "name":new StringField({ initial: "" })
                }),
                "mastery":new SchemaField({
                    "id":new StringField({ initial: "" }),
                    "name":new StringField({ initial: "" })
                }),
                "lost":new SchemaField({
                    "id":new StringField({ initial: "" }),
                    "name":new StringField({ initial: "" })
                })
            }),
            "characteristics": new SchemaField({
                "all": new NumberField({ required: true, integer: true, initial: 25 }),
                "hasInfluence": new BooleanField({required: true, initial:false}),
                "ws": new NumberField({ required: true, integer: true, initial: 0 }),
                "bs": new NumberField({ required: true, integer: true, initial: 0 }),
                "s": new NumberField({ required: true, integer: true, initial: 0 }),
                "t": new NumberField({ required: true, integer: true, initial: 0 }),
                "agi": new NumberField({ required: true, integer: true, initial: 0 }),
                "per": new NumberField({ required: true, integer: true, initial: 0 }),
                "int": new NumberField({ required: true, integer: true, initial: 0 }),
                "wp": new NumberField({ required: true, integer: true, initial: 0 }),
                "fel": new NumberField({ required: true, integer: true, initial: 0 }),
                "inf": new NumberField({ required: true, integer: true, initial: 0 }),
                "cor": new StringField({ initial: "" }),
                "ins": new StringField({ initial: "" }),
                "plus1": new StringField({ initial: "" }),
                "plus2": new StringField({ initial: "" }),
                "minus": new StringField({ initial: "" })
            }),
            "pointBuy": new SchemaField({
                "type": new StringField({ initial: "" }),
                "amount": new NumberField({ required: true, integer: true, initial: 60 }),
                "charLimit": new NumberField({ required: true, integer: true, initial: 40 }),
                "limitPerChar": new NumberField({ required: true, integer: true, initial: 20 })
            })
        };
    }
}
