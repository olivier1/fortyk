export const FORTYK={};

FORTYK.size=[{"name":"Miniscule",
             "mod":-30,
             "stealth":30,
             "movement":-3},
             {"name":"Puny",
             "mod":-20,
             "stealth":20,
             "movement":-2},
             {"name":"Scrawny",
             "mod":-10,
             "stealth":10,
             "movement":-1},
             {"name":"Average",
             "mod":0,
             "stealth":0,
             "movement":0},
             {"name":"Hulking",
             "mod":10,
             "stealth":-10,
             "movement":1},
             {"name":"Enormous",
             "mod":20,
             "stealth":-20,
             "movement":2},
             {"name":"Massive",
             "mod":30,
             "stealth":-30,
             "movement":3},
             {"name":"Immense",
             "mod":40,
             "stealth":-40,
             "movement":4},
             {"name":"Monumental",
             "mod":50,
             "stealth":-50,
             "movement":5},
             {"name":"Titanic",
             "mod":60,
             "stealth":-60,
             "movement":6}]
FORTYK.carry=[{"carry":0.9,
              "lift":2.25,
              "push":4.5},
             {"carry":2.25,
              "lift":4.5,
              "push":9},
             {"carry":4.5,
              "lift":9,
              "push":18},
             {"carry":9,
              "lift":18,
              "push":36},
             {"carry":18,
              "lift":36,
              "push":72},
             {"carry":27,
              "lift":54,
              "push":108},
             {"carry":36,
              "lift":72,
              "push":144},
             {"carry":45,
              "lift":90,
              "push":180},
             {"carry":56,
              "lift":112,
              "push":224},
             {"carry":67,
              "lift":134,
              "push":268},
             {"carry":78,
              "lift":156,
              "push":312},
             {"carry":90,
              "lift":180,
              "push":360},
             {"carry":112,
              "lift":224,
              "push":448},
             {"carry":225,
              "lift":450,
              "push":900},
             {"carry":337,
              "lift":674,
              "push":1348},
             {"carry":450,
              "lift":900,
              "push":1800},
             {"carry":675,
              "lift":1350,
              "push":2700},
             {"carry":900,
              "lift":1800,
              "push":3600},
             {"carry":1350,
              "lift":2700,
              "push":5400},
             {"carry":1800,
              "lift":3600,
              "push":7200},
             {"carry":2250,
              "lift":4500,
              "push":9000}]
FORTYK.extraHits={ 
    "head":[{"value":"head","label":"Head"},{"value":"head","label":"Head"},{"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"},"lArm",{"value":"body","label":"Body"}],
    "rArm":[{"value":"rArm","label":"Right Arm"},{"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"},{"value":"head","label":"Head"},{"value":"body","label":"Body"},{"value":"lArm","label":"Left Arm"}],
    "lArm":[{"value":"lArm","label":"Left Arm"},{"value":"lArm","label":"Left Arm"},{"value":"body","label":"Body"},{"value":"head","label":"Head"},{"value":"body","label":"Body"},{"value":"rArm","label":"Right Arm"}],
    "body":[{"value":"body","label":"Body"}, {"value":"body","label":"Body"}, {"value":"lArm","label":"Left Arm"}, {"value":"head","label":"Head"}, {"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"}],
    "lLeg":[{"value":"lLeg","label":"Left Leg"}, {"value":"lLeg","label":"Left Leg"}, {"value":"body","label":"Body"},{"value":"lArm","label":"Left Arm"}, {"value":"head","label":"Head"},{"value":"body","label":"Body"}],
    "rLeg":[{"value":"rLeg","label":"Right Leg"}, {"value":"rLeg","label":"Right Leg"}, {"value":"body","label":"Body"},{"value":"rArm","label":"Right Arm"}, {"value":"head","label":"Head"}, {"value":"body","label":"Body"}]}
FORTYK.damageTypes=["Explosive","Rending","Impact","Energy"]
FORTYK.meleeWeaponTypes=["Chain", "Force", "Power", "Shock", "Low-tech", "Exotic"]
FORTYK.rangedWeaponTypes=["Bolt", "Flame", "Las", "Launcher", "Low-tech", "Melta", "Plasma", "Solid projectile", "Exotic"]
FORTYK.rangedWeaponClasses=["Pistol", "Basic", "Heavy", "Thrown"]
FORTYK.meleeWeaponClasses=["Melee", "Melee Two-handed", "Shield"]
FORTYK.aptitudes=["Weapon Skill", "Ballistic Skill", "Strength", "Toughness", "Agility", "Intelligence", "Perception", "Willpower", "Fellowship", "Offence", "Finesse", "Defence", "Psyker", "Tech", "Knowledge", "Leadership", "Fieldcraft", "Social"]
FORTYK.psykerTypes={"bound":{"push":2,"sustain":"+10 to Phenomena rolls, -1 to PR per power after the first","perils":0},"unbound":{"push":4,"sustain":"+10 to all rolls on Table 6–2: Psychic Phenomena (see page 196), decrease psy rating by 1 per power.","perils":5}, "daemon":{"push":3, "sustain":"+10 to all rolls on Table 6–2: Psychic Phenomena (see page 196), decrease psy rating by 1 per power. He is not affected by the result unless the result causes Perils of the Warp, though those around him might be.","perils":10}}
