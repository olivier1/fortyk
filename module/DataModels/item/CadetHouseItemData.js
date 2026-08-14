const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
import BaseItemData from "./BaseItemData.js";
export default class CadetHouseItemData extends BaseItemData {
    static defineSchema(){
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "location": new SchemaField({
                "value": new StringField({ initial: "" })
            }),
            "houseHead": new SchemaField({
                "value": new StringField({ initial: "" })
            })
        };
    }
}