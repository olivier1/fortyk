const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import CharacterData from "./CharacterData.js";
export class NPCData extends CharacterData {
    static defineScheme(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "skills": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "equipment": new SchemaField({
                "value": new HTMLField({ initial: "" })
            }),
            "description": new SchemaField({
                "value": new HTMLField({ initial: "" })
            }),
            "parry": new SchemaField({
                "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                "total": new NumberField({ required: true, integer: true, initial: 0 })
            }),
            "dodge": new SchemaField({
                "mod": new NumberField({ required: true, integer: true, initial: 0 }),
                "total": new NumberField({ required: true, integer: true, initial: 0 })
            })
        };
    }
}
