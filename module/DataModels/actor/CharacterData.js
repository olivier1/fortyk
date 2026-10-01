import SecondaryCharacteristicsModel from "./SecondaryDataSchema.js";


export default class CharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
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
    return {

      skillmods: new SchemaField({}),
      secChar: new foundry.data.fields.EmbeddedDataField(SecondaryCharacteristicsModel),
      globalMOD: new SchemaField({
        value: new NumberField({ required: true,  initial: 0})
      }),
      characteristics: new SchemaField({
      ws: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Weapon Skill" })
        }),
        bs: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Ballistic Skill" })
        }),
        s: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Strength" })
        }),
        t: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
        total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Toughness" })
        }),
        agi: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Agility" })
        }),
        int: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Intelligence" })
        }),
        per: new SchemaField({

        value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Perception" })
        }),
        wp: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Willpower" })
        }),
        fel: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
        total: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
          label: new StringField({ initial: "Fellowship" })
        }),
        inf: new SchemaField({

          value: new NumberField({ required: true,  initial: 30}),
          mod: new NumberField({ required: true,  initial: 0}),
          advance: new NumberField({ required: true,  initial: 0}),
          total: new NumberField({ required: true,  initial: 0}),
        bonus: new NumberField({ required: true,  initial: 0}),
          bonusMulti: new NumberField({ required: true,  initial: 1}),
          uB: new NumberField({ required: true,  initial: 0}),
          max: new NumberField({ required: true,  initial: 100}),
        label: new StringField({ initial: "Influence" })
        })
      }),
      characterHitLocations: new SchemaField({
      head: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          armor: new NumberField({ required: true,  initial: 0}),
          armorMod: new NumberField({ required: true,  initial: 0}),
          psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Head" }),
          key: new StringField({ initial: "head" })
        }),
        body: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
        armor: new NumberField({ required: true,  initial: 0}),
          armorMod: new NumberField({ required: true,  initial: 0}),
          psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Body" }),
          key: new StringField({ initial: "body" })
        }),
        rArm: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          armor: new NumberField({ required: true,  initial: 0}),
        armorMod: new NumberField({ required: true,  initial: 0}),
        psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Right Arm" }),
          key: new StringField({ initial: "rArm" })
        }),
        lArm: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          armor: new NumberField({ required: true,  initial: 0}),
          armorMod: new NumberField({ required: true,  initial: 0}),
          psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Left Arm" }),
          key: new StringField({ initial: "lArm" })
        }),
        rLeg: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          armor: new NumberField({ required: true,  initial: 0}),
          armorMod: new NumberField({ required: true,  initial: 0}),
          psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Right Leg" }),
          key: new StringField({ initial: "rLeg" })
        }),
        lLeg: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          armor: new NumberField({ required: true,  initial: 0}),
          armorMod: new NumberField({ required: true,  initial: 0}),
          psy: new NumberField({ required: true,  initial: 0}),
          cyber: new BooleanField({required: true, initial:false}),
          shield: new NumberField({ required: true,  initial: 0}),
          label: new StringField({ initial: "Left Leg" }),
          key: new StringField({ initial: "lLeg" })
        })
      }),
      psykana: new SchemaField({
        pr: new SchemaField({
          value: new NumberField({ required: true,  initial: 0}),
          bonus: new NumberField({ required: true,  initial: 0}),
          maxPush: new NumberField({ required: true,  initial: 0}),
          sustain: new NumberField({ required: true,  initial: 0}),
          sustained: new ArrayField(new StringField({ initial: "" })),
          effective: new NumberField({ required: true,  initial: 0})
        }),
        psykerType: new SchemaField({
          value: new StringField({ initial: "bound" })
        }),
        mod: new SchemaField({
          value: new NumberField({ required: true,  initial: 0})
        }),
        phenomena: new SchemaField({
          value: new NumberField({ required: true,  initial: 0})
        }),
        disciplines: new ArrayField(new StringField({initial:""}))
      }),
      suddenDeath: new SchemaField({
        value: new BooleanField({required: true, initial:false})
      }),
      horde: new SchemaField({
        value: new BooleanField({required: true, initial:false})
      }),
      formation: new SchemaField({
        value: new BooleanField({required: true, initial:false})
      }),
      riding: new SchemaField({
        id: new StringField({ initial: "" })
      }),
      sort:new SchemaField({}),
      sex: new SchemaField({
        value: new StringField({ initial: "" })
      }),
      age: new SchemaField({
        value: new NumberField({ required: true,  initial: 0})
      }),
      build: new SchemaField({
        value: new StringField({ initial: "" })
      }),
      hair: new SchemaField({
      value: new StringField({ initial: "" })
      }),
    eye: new SchemaField({
        value: new StringField({ initial: "" })
      }),
      race: new SchemaField({
        value: new StringField({ initial: "" })
      }),
      notesAndBackground: new SchemaField({
        background: new HTMLField({ initial: "" }),
        notes: new HTMLField({ initial: "" })
      })


    };
  }

}