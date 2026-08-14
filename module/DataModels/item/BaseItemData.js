const {
  BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
function resourceField(initialValue, initialMax) {
  return new SchemaField({
    // Make sure to call new so you invoke the constructor!
    min: new NumberField({ initial: 0 }),
    value: new NumberField({ initial: initialValue }),
    max: new NumberField({ initial: initialMax }),
  });
}
export default class BaseItemData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
        "description": new SchemaField ({
                    "value": new HTMLField({"initial":""}),
                    "gm":new HTMLField({"initial":""})
                })
    };
  }
}