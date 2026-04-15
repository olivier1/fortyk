const {
  BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;
function resourceField(initialValue, initialMax) {
  return new SchemaField({
    // Make sure to call new so you invoke the constructor!
    min: new fields.NumberField({ initial: 0 }),
    value: new fields.NumberField({ initial: initialValue }),
    max: new fields.NumberField({ initial: initialMax }),
  });
}
export class CharacterData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {

      "skillmods": new SchemaField({}),
      "secChar": new SchemaField({
        "tempMod": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0 }),
          "command": new NumberField({ required: true, integer: true, initial: 0 })
        }),
        "wounds": new SchemaField({
          "min": new NumberField({ required: true, integer: true, initial: -10 }),
          "value": new NumberField({ required: true, integer: true, initial: 10 }),
          "max": new NumberField({ required: true, integer: true, initial: 10 }),
          "bonus": new NumberField({ required: true, integer: true, initial: 0 })
        }),
        "fatigue": new SchemaField({
          "min": new NumberField({ required: true, integer: true, initial: 0 }),
          "value": new NumberField({ required: true, integer: true, initial: 0 }),
          "max": new NumberField({ required: true, integer: true, initial: 0 })
        }),
        "fate": resourceField(0,0),
        "corruption": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0 }),
          "chars": new StringField({ initial: "" }),
          "mod": new NumberField({ required: true, integer: true, initial: 0 }),
          "khorne": new NumberField({ required: true, integer: true, initial: 0 }),
          "nurgle": new NumberField({ required: true, integer: true, initial: 0 }),
          "slaanesh": new NumberField({ required: true, integer: true, initial: 0 }),
          "tzeentch": new NumberField({ required: true, integer: true, initial: 0 }),
          "malice": new NumberField({ required: true, integer: true, initial: 0 })
        }),
        "insanity": new SchemaField({
          "type": "Number",
          "value": new NumberField({ required: true, integer: true, initial: 0 , min: 0 }),
          "shock": new StringField({ initial: "" }),
          "mod":  new NumberField({ required: true, integer: true, initial: 0 })
        }),
        "wornGear": new SchemaField({
          "weapons": new ArrayField(),
          "extraWeapons": new ArrayField(),
          "armor": new SchemaField({}),
          "forceField": new SchemaField({})
        }),
        "movement": new SchemaField({
          "half":  new NumberField({ required: true, integer: true, initial: 1 , min: 1 }),
          "full":  new NumberField({ required: true, integer: true, initial: 1 , min: 1 }),
          "charge":  new NumberField({ required: true, integer: true, initial: 0 , min: 0 }),
          "run": new NumberField({ required: true, integer: true, initial: 0 , min: 0 }),
          "mod":  new NumberField({ required: true, integer: true, initial: 0 , min: 0 }),
          "multi":  new NumberField({ required: true, integer: true, initial: 1 , min: 0 })
        }),
        "attacks": new SchemaField({
          "standard": new NumberField({ required: true, integer: true, initial: 10}),
          "charge": new NumberField({ required: true, integer: true, initial: 20}),
          "allOut": new NumberField({ required: true, integer: true, initial: 30}),
          "stun": new NumberField({ required: true, integer: true, initial: -20}),
          "guarded": new NumberField({ required: true, integer: true, initial: -10}),
          "semi": new NumberField({ required: true, integer: true, initial: 0}),
          "full": new NumberField({ required: true, integer: true, initial: -10}),
          "aim": new SchemaField( {
            "half": new NumberField({ required: true, integer: true, initial: 10}),
            "full": new NumberField({ required: true, integer: true, initial: 20})
          }),
          "swift": new NumberField({ required: true, integer: true, initial: 0}),
          "lightning": new NumberField({ required: true, integer: true, initial: -10}),
          "cad": new NumberField({ required: true, integer: true, initial: -20}),
          "gangup": new SchemaField({
            "0": new NumberField({ required: true, integer: true, initial: 0}),
            "1": new NumberField({ required: true, integer: true, initial: 10}),
            "2": new NumberField({ required: true, integer: true, initial: 20})
          }),
          "range": new SchemaField({
            "pointblank": new NumberField({ required: true, integer: true, initial: 30}),
            "short": new NumberField({ required: true, integer: true, initial: 10}),
            "standard": new NumberField({ required: true, integer: true, initial: 0}),
            "long": new NumberField({ required: true, integer: true, initial: -10}),
            "extreme": new NumberField({ required: true, integer: true, initial: -30})
          })
        }),
        "size": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 3}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "stealth": new NumberField({ required: true, integer: true, initial: 0}),
          "movement": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Average" }),
          "size": new NumberField({ required: true, integer: true, initial: 1})
        }),
        "lastHit": new SchemaField({
          "value": new StringField({ initial: "body" }),
          "label": new StringField({ initial: "Body" }),
          "dos": new NumberField({ required: true, integer: true, initial: 1}),
          "aim": new BooleanField({required: true, initial:false}),
          "hits": new NumberField({ required: true, integer: true, initial: 1}),
          "attackRange": new StringField({ initial: "" }),
          "vehicle": new BooleanField({required: true, initial:false}),
          "vehicleFacing": new StringField({ initial: "" }),
          "vehicleHitLocation": new StringField({ initial: "" })
        }),
        "cover": new SchemaField({
          "value": new NumberField({ required: true, integer: false, initial: 0})
        }),
        "initiative": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0})
        }),
        "fearMod": new NumberField({ required: true, integer: true, initial: 0})
      }),
      "globalMOD": new SchemaField({
        "value": new NumberField({ required: true, integer: true, initial: 0})
      }),
      "characteristics": new SchemaField({
        "ws": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Weapon Skill" })
        }),
        "bs": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Ballistic Skill" })
        }),
        "s": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Strength" })
        }),
        "t": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Toughness" })
        }),
        "agi": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Agility" })
        }),
        "int": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Intelligence" })
        }),
        "per": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Perception" })
        }),
        "wp": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Willpower" })
        }),
        "fel": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Fellowship" })
        }),
        "inf": new SchemaField({

          "value": new NumberField({ required: true, integer: true, initial: 30}),
          "mod": new NumberField({ required: true, integer: true, initial: 0}),
          "advance": new NumberField({ required: true, integer: true, initial: 0}),
          "total": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "bonusMulti": new NumberField({ required: true, integer: true, initial: 1}),
          "uB": new NumberField({ required: true, integer: true, initial: 0}),
          "max": new NumberField({ required: true, integer: true, initial: 100}),
          "label": new StringField({ initial: "Influence" })
        })
      }),
      "characterHitLocations": new SchemaField({
        "head": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Head" }),
          "key": new StringField({ initial: "head" })
        }),
        "body": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Body" }),
          "key": new StringField({ initial: "body" })
        }),
        "rArm": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Right Arm" }),
          "key": new StringField({ initial: "rArm" })
        }),
        "lArm": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Left Arm" }),
          "key": new StringField({ initial: "lArm" })
        }),
        "rLeg": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Right Leg" }),
          "key": new StringField({ initial: "rLeg" })
        }),
        "lLeg": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "armor": new NumberField({ required: true, integer: true, initial: 0}),
          "armorMod": new NumberField({ required: true, integer: true, initial: 0}),
          "psy": new NumberField({ required: true, integer: true, initial: 0}),
          "cyber": new BooleanField({required: true, initial:false}),
          "shield": new NumberField({ required: true, integer: true, initial: 0}),
          "label": new StringField({ initial: "Left Leg" }),
          "key": new StringField({ initial: "lLeg" })
        })
      }),
      "psykana": new SchemaField({
        "pr": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0}),
          "bonus": new NumberField({ required: true, integer: true, initial: 0}),
          "maxPush": new NumberField({ required: true, integer: true, initial: 0}),
          "sustain": new NumberField({ required: true, integer: true, initial: 0}),
          "sustained": new ArrayField(),
          "effective": new NumberField({ required: true, integer: true, initial: 0})
        }),
        "psykerType": new SchemaField({
          "value": new StringField({ initial: "bound" })
        }),
        "mod": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0})
        }),
        "phenomena": new SchemaField({
          "value": new NumberField({ required: true, integer: true, initial: 0})
        }),
        "disciplines": new SchemaField({})
      }),
      "suddenDeath": new SchemaField({
        "value": new BooleanField({required: true, initial:false})
      }),
      "horde": new SchemaField({
        "value": new BooleanField({required: true, initial:false})
      }),
      "formation": new SchemaField({
        "value": new BooleanField({required: true, initial:false})
      }),
      "riding": new SchemaField({
        "id": new StringField({ initial: "" })
      }),
      "sort":new SchemaField({}),
      "sex": new SchemaField({
        "value": new StringField({ initial: "" })
      }),
      "age": new SchemaField({
        "value": new NumberField({ required: true, integer: true, initial: 0})
      }),
      "build": new SchemaField({
        "value": new StringField({ initial: "" })
      }),
      "hair": new SchemaField({
        "value": new StringField({ initial: "" })
      }),
      "eye": new SchemaField({
        "value": new StringField({ initial: "" })
      }),
      "race": new SchemaField({
        "value": new StringField({ initial: "" })
      }),
      "notesAndBackground": new SchemaField({
        "background": new HTMLField({ initial: "" }),
        "notes": new HTMLField({ initial: "" })
      })


    };
  }
}