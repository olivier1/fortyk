
export const FORTYK={};
FORTYK.races=[{value:"Human"},
              {value:"Ogryn"},
              {value:"Ratling"},
              {value:"Astartes"},
              {value:"Eldar"},
              {value:"Genestealer"},
              {value:"Tyranid"},
              {value:"Necron"},
              {value:"Ork"},
              {value:"Kroot"},
              {value:"Tau"},
              {value:"Daemon"},
              {value:"Laek"},
              {value:"Faceless"},
              {value:"Mortiseran"},
              {value:"Servitor"},
              {value:"Other"}];
FORTYK.size=[
    {"name":"Miniscule",
     "mod":-30,
     "stealth":30,
     "movement":-3,
     "size":0.6,
    "index":0},
    {"name":"Puny",
     "mod":-20,
     "stealth":20,
     "movement":-2,
     "size":0.7,
    "index":1},
    {"name":"Scrawny",
     "mod":-10,
     "stealth":10,
     "movement":-1,
     "size":0.8,
    "index":2},
    {"name":"Average",
     "mod":0,
     "stealth":0,
     "movement":0,
     "size":1,
    "index":3},
    {"name":"Hulking",
     "mod":10,
     "stealth":-10,
     "movement":1,
     "size":1.2,
    "index":4},
    {"name":"Enormous",
     "mod":20,
     "stealth":-20,
     "movement":2,
     "size":2,
    "index":5},
    {"name":"Massive",
     "mod":30,
     "stealth":-30,
     "movement":3,
     "size":5,
    "index":6},
    {"name":"Immense",
     "mod":40,
     "stealth":-40,
     "movement":4,
     "size":8,
    "index":7},
    {"name":"Monumental",
     "mod":50,
     "stealth":-50,
     "movement":5,
     "size":10,
    "index":8},
    {"name":"Titanic",
     "mod":60,
     "stealth":-60,
     "movement":6,
     "size":15,
    "index":9},
    {"name":"Gargantuan",
     "mod":70,
     "stealth":-70,
     "movement":7,
     "size":20,
    "index":10},
    {"name":"Colossal",
     "mod":80,
     "stealth":-80,
     "movement":8,
     "size":25,
    "index":11},
    {"name":"Immeasurable",
     "mod":90,
     "stealth":-90,
     "movement":9,
     "size":30,
    "index":12}];
FORTYK.carry=[
    {"carry":0.9,
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
     "push":9000}];
FORTYK.coverTypes=[{"value":0,"label":"None"},{"value":0.1,"label":"Light Cover"},{"value":0.3,"label":"Medium Cover"},{"value":0.5,"label":"Heavy Cover"}];
FORTYK.extraHits={ 
    "head":[{"value":"head","label":"Head"},{"value":"head","label":"Head"},{"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"},{"value":"lArm","label":"Left Arm"},{"value":"body","label":"Body"}],
    "rArm":[{"value":"rArm","label":"Right Arm"},{"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"},{"value":"head","label":"Head"},{"value":"body","label":"Body"},{"value":"lArm","label":"Left Arm"}],
    "lArm":[{"value":"lArm","label":"Left Arm"},{"value":"lArm","label":"Left Arm"},{"value":"body","label":"Body"},{"value":"head","label":"Head"},{"value":"body","label":"Body"},{"value":"rArm","label":"Right Arm"}],
    "body":[{"value":"body","label":"Body"}, {"value":"body","label":"Body"}, {"value":"lArm","label":"Left Arm"}, {"value":"head","label":"Head"}, {"value":"rArm","label":"Right Arm"},{"value":"body","label":"Body"}],
    "lLeg":[{"value":"lLeg","label":"Left Leg"}, {"value":"lLeg","label":"Left Leg"}, {"value":"body","label":"Body"},{"value":"lArm","label":"Left Arm"}, {"value":"head","label":"Head"},{"value":"body","label":"Body"}],
    "rLeg":[{"value":"rLeg","label":"Right Leg"}, {"value":"rLeg","label":"Right Leg"}, {"value":"body","label":"Body"},{"value":"rArm","label":"Right Arm"}, {"value":"head","label":"Head"}, {"value":"body","label":"Body"}]};
FORTYK.damageTypes=[{value:"Explosive"},{value:"Rending"},{value:"Impact"},{value:"Energy"}];
FORTYK.meleeWeaponTypes=[{value:"Chain"}, {value:"Force"}, {value:"Power"}, {value:"Shock"}, {value:"Low-tech"}, {value:"Exotic"}];
FORTYK.rangedWeaponTypes=[{value:"Bolt"},{value:"Grenade"}, {value:"Flame"}, {value:"Las"}, {value:"Melta"}, {value:"Plasma"}, {value:"Solid projectile"}, {value:"Launcher"}, {value:"Low-tech"}, {value:"Exotic"}];
FORTYK.rangedWeaponClasses=[{value:"Basic"},{value:"Pistol"}, {value:"Heavy"}, {value:"Thrown"}, {value:"Titanic Ranged Weapon"}, {value:"Titanic Artillery Weapon"}];
FORTYK.meleeWeaponClasses=[{value:"Melee"}, {value:"Melee Two-handed"}, {value:"Shield"}, {value:"Titanic Melee Weapon"}];
FORTYK.psychicPowerTypes=[{value:"Psychic Bolt"}, {value:"Psychic Barrage"}, {value:"Psychic Storm"}, {value:"Psychic Blast"}, {value:"Buff/Debuff"}, {value:"Other"}, {value:"Macro"}];
FORTYK.psychicDisciplines=[{value:"Biomancy"}, {value:"Chronomancy"},{value:"Divination"},{value:"Pyromancy"},{value:"Telekinesis"},{value:"Telepathy"},{value:"Sanctic Daemonology"},{value:"Malefic Daemonology"},{value:"Tzeench"},{value:"Slaanesh"},{value:"Nurgle"},{value:"Chapter"},{value:"WAAAGH!"},{value:"Navigator"}];
FORTYK.spaceshipWeaponLocations=[{value:"Dorsal"},{value:"Prow"},{value:"Keel"},{value:"Port"},{value:"Starboard"}];
FORTYK.outpostTypes=[{value:"Outpost"},{value:"Enclave"},{value:"Stronghold"}];
FORTYK.knightComponentTypes=[{"value":"rangedWeapon","label":"Ranged Weapons"},{"value":"meleeWeapon","label":"Melee Weapons"},{"value":"auxiliaryWeapon","label":"Auxiliary Weapons"},{"value":"ammunition","label":"Ammunition"},{"value":"knightArmor","label":"Armors"},{"value":"knightCore","label":"Cores"},{"value":"knightStructure","label":"Structure"},{"value":"forceField","label":"Force Fields"},{"value":"gyro","label":"Gyros"},{"value":"sensor","label":"Sensors"},{"value":"throne-mod","label":"Throne Modifications"},{"value":"plating","label":"Platings"},{"value":"core-mod","label":"Core Modifications"},{"value":"arm-actuator","label":"Arm Actuators"},{"value":"leg-actuator","label":"Leg Actuators"},{"value":"other","label":"Other Components"}];
FORTYK.vehicleRepairCostTimeDiff={
    "firstthresholddmg":{
        amount:10,
        time:14400,
        cost:10,
        hardReq:[],
        diff:0,
        hasTech:10,
        hasAdmech:10,
        hasTechnAdmech:10
    },
    "secondthresholddmg":{
        amount:10,
        time:36000,
        cost:20,
        hardReq:[],
        diff:-20,
        hasTech:0,
        hasAdmech:10,
        hasTechnAdmech:10
    },
    "thirdthresholddmg":{
        amount:10,
        time:54000,
        cost:40,
        hardReq:[],
        diff:-30,
        hasTech:-10,
        hasAdmech:0,
        hasTechnAdmech:0
    },
    "fourththresholddmg":{
        amount:10,
        time:86400,
        cost:80,
        hardReq:[],
        diff:-40,
        hasTech:-20,
        hasAdmech:0,
        hasTechnAdmech:0
    },
    "criticaldmg":{
        amount:1,
        time:259200,
        cost:200,
        hardReq:["tech-use","commonlore:tech"],
        diff:-50,
        hasTech:-50,
        hasAdmech:-50,
        hasTechnAdmech:0
    },
    "damagedcomponent":{
        amount:1,
        time:86400,
        timePerRarityAboveScarce:86400,
        cost:50,
        costPerRarityAboveScarce:100,
        hardReq:["tech-use","commonlore:adeptusmechanicus"],
        diff:-20,
        hasTech:-20,
        hasAdmech:-20,
        hasTechnAdmech:10
    },
    "firedamage":{
        amount:6,
        time:10800,
        cost:20,
        hardReq:[],
        diff:20,
        hasTech:20,
        hasAdmech:20,
        hasTechnAdmech:20
    },
    "motiveimpaired":{
        amount:1,
        time:86400,
        cost:50,
        hardReq:[],
        diff:0,
        hasTech:0,
        hasAdmech:0,
        hasTechnAdmech:10
    },
    "motivecrippled":{
        amount:1,
        time:604800,
        cost:100,
        hardReq:["tech-use","commonlore:tech"],
        diff:-30,
        hasTech:-20,
        hasAdmech:-20,
        hasTechnAdmech:-20 
    },
    "motivedestroyed":{
        amount:1,
        time:3127680,
        cost:300,
        hardReq:["tech-use",["commonlore:tech","commonlore:adeptusmechanicus"]],
        diff:-40,
        hasTech:-40,
        hasAdmech:-40,
        hasTechnAdmech:-20 
    },
    "damagedcore":{
        amount:1,
        time:172800,
        cost:200,
        hardReq:[["tech-use","forbiddenlore:archeotech"]],
        diff:-20,
        hasTech:-20,
        hasAdmech:-20,
        hasTechnAdmech:-20 
    },
    "armordmg":{
        amount:5,
        time:86400,
        cost:30,
        hardReq:[],
        diff:-20,
        hasTech:0,
        hasAdmech:-20,
        hasTechnAdmech:0 
    },
    "targetting":{
        amount:1,
        time:1209600,
        cost:200,
        hardReq:["tech-use",["commonlore:adeptusmechanicus","forbiddenlore:archeotech"]],
        diff:-30,
        hasTech:-30,
        hasAdmech:-30,
        hasTechnAdmech:-30 
    },
    "damagedionshield":{
        amount:1,
        time:604800,
        cost:100,
        hardReq:[["tech-use","forbiddenlore:archeotech"]],
        diff:-20,
        hasTech:-20,
        hasAdmech:-20,
        hasTechnAdmech:-20 
    },
    "destroyedionshield":{
        amount:1,
        time:3127680,
        cost:100,
        hardReq:[["tech-use","forbiddenlore:archeotech"]],
        diff:-40,
        hasTech:-40,
        hasAdmech:-40,
        hasTechnAdmech:-40 
    },
    "refittitanicweapon":{
        amount:1,
        time:86400,
        cost:10,
        hardReq:["tech-use"],
        diff:10,
        hasTech:10,
        hasAdmech:10,
        hasTechnAdmech:10 
    },
    "install/removecomponent":{
        amount:1,
        time:36000,
        cost:10,
        hardReq:["tech-use"],
        diff:10,
        hasTech:10,
        hasAdmech:10,
        hasTechnAdmech:10 
    },
    "changearmor":{
        amount:1,
        time:604800,
        cost:100,
        hardReq:["commonlore:tech"],
        diff:0,
        hasTech:0,
        hasAdmech:0,
        hasTechnAdmech:0 
    },
    "changecore":{
        amount:1,
        time:604800,
        cost:100,
        hardReq:[["tech-use","forbiddenlore:archeotech"]],
        diff:-10,
        hasTech:-10,
        hasAdmech:-10,
        hasTechnAdmech:-10 
    },
    "changestructure":{
        amount:1,
        time:18766080,
        cost:1000,
        hardReq:[["tech-use","forbiddenlore:archeotech","commonlore:tech","commonlore:adeptusmechanicus"]],
        diff:-40,
        hasTech:-40,
        hasAdmech:-40,
        hasTechnAdmech:-40 
    }

};
FORTYK.repairTimeAdjustment=[
    {

        "upperRange":14400,
        "adjustment":600
    },
    {

        "upperRange":28800,
        "adjustment":1200
    },
    {

        "upperRange":57600,
        "adjustment":1800
    },
    {

        "upperRange":172800,
        "adjustment":3600
    },
    {

        "upperRange":432000,
        "adjustment":14400
    },
    {

        "upperRange":3127680,
        "adjustment":43200
    },
    {

        "upperRange":6255360,
        "adjustment":86400
    },
    {

        "upperRange":18766080,
        "adjustment":1036800
    },
    {

        "upperRange":Infinity,
        "adjustment":2592000
    }
];
FORTYK.vehicleRepairTypes={
    "normal":{
        "time":1,
        "cost":1,
        "difficulty":0
    },
    "rush":{
        "time":0.5,
        "cost":1.5,
        "difficulty":-30
    },
    "careful":{
        "time":1.5,
        "cost":0.5,
        "difficulty":30
    }
};
FORTYK.coreIntegrities={"Common":3,"Poor":1,"Good":4,"Best":5};
FORTYK.spaceshipWeaponTypes=[{value:"Macrocannon"},{value:"Lance"},{value:"Torpedo"},{value:"Hangar"}];
FORTYK.spaceshipCargoTypes=[{value:"Food Supplies"},{value:"Unrefined Materials"},{value:"Refined Materials"},{value:"Military Technology"},{value:"Manufacturing Technology"},{value:"Survival Technology"},{value:"Ship Parts"},{value:"Energy Source"},{value:"Entertainment"},{value:"Contraband"},{value:"Livestock"},{value:"Xeno-Artifacts"},{value:"Archeotech"},{value:"Torpedoes"}];
FORTYK.spaceshipComponentStatuses=[{value:"Online"}, {value:"Damaged"}, {value:"Destroyed"}];
FORTYK.spaceshipSquadronTypes=["Fighter","Bomber","Assault Boat","Civilian"];
FORTYK.aptitudes=[{"key":"weaponskill","label":"Weapon Skill"}, {"key":"ballisticskill","label":"Ballistic Skill"}, {"key":"strength","label":"Strength"},{"key":"toughness","label":"Toughness"} ,{"key":"agility","label":"Agility"} ,{"key":"intelligence","label": "Intelligence"},{"key":"perception","label":"Perception"} ,{"key":"willpower","label":"Willpower"} ,{"key":"fellowship","label":"Fellowship"} ,{"key":"offence","label":"Offence"} ,{"key":"finesse","label":"Finesse"} ,{"key":"defence","label":"Defence"} ,{"key":"tech","label":"Tech"},{"key":"knowledge","label":"Knowledge"} ,{"key":"leadership","label":"Leadership"} ,{"key":"fieldcraft","label":"Fieldcraft"} ,{"key":"social","label":"Social"} ,{"key":"psyker","label":"Psyker"}];
FORTYK.advancementTypes=[{value:"Custom"},{value:"Characteristic Upgrade"},{value:"Skill Upgrade"},{value:"New Skill"}, {value:"Talent"}];
//For costs put the number of matching aptitudes into the array, then whatever other parameter
FORTYK.characteristicUpgradeCosts=[{"5":500,"10":750,"15":1000,"20":1500,"25":2500},
                                   {"5":250,"10":500,"15":750,"20":1000,"25":1500},
                                   {"5":100,"10":250,"15":500,"20":750,"25":1250}];
FORTYK.skillUpgradeCosts=[{"0":300,"10":600,"20":900,"30":1200},
                          {"0":200,"10":400,"20":600,"30":800},
                          {"0":100,"10":200,"20":300,"30":400}];
FORTYK.talentCosts=[[600,900,1200],
                    [300,450,600],
                    [200,300,400]];
FORTYK.psykerTypes={"bound":{value:"bound",label:"Bound","push":2,"sustain":"+10 to Phenomena rolls, -1 to PR per power after the first","perils":0},"unbound":{value:"unbound",label:"Unbound","push":4,"sustain":"+10 to all rolls on Table 6–2: Psychic Phenomena (see page 196), decrease psy rating by 1 per power.","perils":5}, "daemon":{value:"daemon",label:"Daemon","push":3, "sustain":"+10 to all rolls on Table 6–2: Psychic Phenomena (see page 196), decrease psy rating by 1 per power. He is not affected by the result unless the result causes Perils of the Warp, though those around him might be.","perils":10},
                    "navigator":{value:"navigator",label:"Navigator","push":-1,"sustain":"N/A","perils":-1}};
FORTYK.navigatorPowerTraining=[{value:"Novice"},{value:"Adept"},{value:"Master"}];
FORTYK.itemStates=[{value:"O"},{value:"D"},{value:"X"}];
FORTYK.armorFlags={
    "explosive": {
        "value": false,
        "label": "Explosive Resistant",
        "description": "This armor is built to resist explosions, its armor value counts as double against explosive damage."
    },
    "rending": {
        "value": false,
        "label": "Rending Resistant",
        "description": "This armor is built to resist rending attacks, its armor value counts as double against rending damage."
    },
    "sealed": {
        "value": false,
        "label": "Sealed",
        "description": "This armor is sealed against vacuum and airborne toxins. It gives a +20 bonus to resist the hallucinogenic weapon quality and immunity to vacuum."
    },
    "impact": {
        "value": false,
        "label": "Impact Resistant",
        "description": "This armor is built to resist impacts, its armor value counts as double against impact damage."
    },
    "irongrip": {
        "value": false,
        "label": "Iron Grip",
        "description": "This armor grants great arm strength to the wearer which allows him to wield two handed weapons in one hand."
    },
    "energy": {
        "value": false,
        "label": "Energy Resistant",
        "description": "This armor is built to resist energy attacks, its armor value counts as double against energy damage."
    },
    "flamerepellent": {
        "value": false,
        "label": "Flame Repellent",
        "description": "This armor negates flammable substances that come into contact with it, making the wearer immune to the flame weapon quality."
    },
    "holy": {
        "value": false,
        "label": "Holy",
        "description": "This armor has been blessed by a higher power, it still blocks warp attacks or attacks that normally bypass armor."
    },
    "impenetrable": {
        "value": false,
        "label": "Impenetrable",
        "description": "This armor reduces damage taken by the wearer by half (rounded up) after ALL mitigation."
    }
};
FORTYK.weaponFlags={
    "accurate": {
        "value": false,
        "num": 0,
        "label": "Accurate",
        "description": "The weapon is crafted for precision attacks, with perfectly crafted las-lenses or finely honed barrels. This grants an additional bonus of +10 to the firer’s Ballistic Skill when used with an Aim action, in addition to the normal bonus granted from Aiming. When a character fires a single shot from a single Basic weapon with the Accurate quality while benefiting from the Aim action, the attack inflicts an additional 1d10 damage for every two degrees of success beyond the first (to a maximum of an extra Xd10, x is equal to 2 by default). These extra d10s cannot generate Righteous Fury. The accurate quality is only active while the target is further than 10m away."
    },
    "abyssalDrain": {
        "value": false,
        "label": "Abyssal Drain",
        "description": "The weapon drains the life force of the target. Characters who take damage from weapons with this quality must take a -20 toughness test or take 2d10 strength and toughness damage."
    },
    "balanced": {
        "value": false,
        "label": "Balanced",
        "description": "Carefully weighted, the weapon moves naturally with the user, making his parries more successful. Balanced weapons grant a +10 bonus to Weapon Skill tests made to Parry. Even if the wielder is using multiple Balanced weapons, he only gains the bonus once."
    },
    "blast": {
        "value": false,
        "num": 0,
        "label": "Blast",
        "description": "Attacks from this weapon explode on impact, hurling debris and shrapnel in all directions. When working out a hit from a Blast weapon, anyone within the weapon’s blast radius in metres, indicated by the number in parentheses, is also suffers a single hit from the weapon. Roll damage once and apply it to each character affected by the blast. A Blast weapon also scatters when the user fails his Ballistic Skill test when firing it (see page 230)."
    },
    "blinding": {
        "value": false,
        "label": "Blinding",
        "num": 0,
        "description": "These weapons emit bliding flashes of light or toxic fumes that blind their targets. When hit with such a weapon a creature must pass an agility test with a difficulty equal to -10 times the X value of this trait or be blinded for a number of rounds equal to the degrees of failure on the test."
    },
    "bulwark": {
        "value":false,
        "label":"Bulwark",
        "description":"Shields with this trait extend their AP to all hit locations except the head when the wearer is prone."
    },
    "brutalcharge": {
        "value":false,
        "num": 0,
        "label":"Brutal Charge",
        "description":"Melee weapons with this quality deal X extra damage on a charge attack."
    },
    "concussive": {
        "value": false,
        "num": -1,
        "label": "Concussive",
        "description": "Concussive weapons strike with a powerful impact strong enough to temporarily knock a foe senseless. When a target is struck by a Concussive weapon, he must take a Toughness test with a penalty equal to 10 times the number in parentheses (X). For example, a weapon with Concussive (2) would impose a –20 on this Toughness test and Concussive (0) would cause a test with no penalty. If he fails, the target is Stunned for 1 round per degree of failure. If the attack also inflicted an amount of damage greater than the target’s Strength bonus, the target is knocked Prone. When dealing damage to a vehicle with the walker trait, concussive weapons make the pilot of the vehicle have to pass a +60 operate test modified by the manoeuvrability of the walker, minus 10 times X, minus the damage taken. If the test is failed the walker is knocked down."
    },
    "corrosive": {
        "value": false,
        "label": "Corrosive",
        "description": "These weapons utilise highly caustic acids which cause damage to both the target and his equipment. If a target is struck by an attack from a Corrosive weapon, the Armour points of any armour worn by the target in that location are reduced by 1d10 points. If the Armour points of the armour are reduced below 0 or the target is not wearing any armour in that location, the excess amount of Armour point damage (or the whole amount if the target is wearing no armour in that location) is dealt to the target. This excess damage is not reduced by Toughness. A target’s armour can be reduced multiple times by the effects of a Corrosive weapon, and the Armour point damage is cumulative. A suit of armour can be repaired with a successful Challenging (+0) Tech-Use test, and an Acolyte who possesses the Armour Monger talent can repair the armour while making use of that talent."
    },
    "crippling": {
        "value": false,
        "num": 0,
        "label": "Crippling",
        "description": "Designed for cruelty and viciousness, crippling devices are favourites amongst those who prize pain and suffering. When a target suffers at least one wound from this weapon, he is considered Crippled for the remainder of the encounter or until healed of all damage. If a Crippled character takes more than a Half Action on his turn, he suffers Rending damage equal to the number in parentheses (X) to the Hit Location that suffered the original damage. This damage is not reduced by Armour or Toughness."
    },
    "crushing": {
        "value": false,
        "label": "Crushing",
        "description": "This weapon is extremely weighty and impactful, as such it applies twice it's wielder's strength bonus in melee combat."
    },
    "cryogenic": {
        "value": false,
        "label": "Cryogenic",
        "description": "Targets who suffer damage from this weapon must pass a -40 toughness test or suffer 2d10 toughness damage per round for 1d5 rounds. Creatures reduced to 0 toughness by this effect are frozen solid."
    },
    "daemonbane": {
        "value": false,
        "label": "Daemonbane",
        "description": "Some weapons receive blessings that give them a level of power against the minions of the Dark Gods, but there are special Ordo Malleus rites that go beyond mere sanctification. When used against targets with the Daemonic trait, weapons with this quality gain the Vengeful (8) quality and their damage is not reduced by the target’s Toughness bonus."
    },
    "defensive": {
        "value": false,
        "label": "Defensive",
        "description": "A Defensive weapon, such as a shield, is intended to be used to block attacks and is awkward when used to attack. A weapon with this quality grants a +15 bonus to tests made when used to Parry, but imposes a –10 penalty on tests to make attacks with it."
    },
    "encumbering": {
        "value": false,
        "num": 0,
        "label": "Encumbering",
        "description": "Encumbering(X) reduces your movement by X"
    },
    "felling": {
        "value": false,
        "num": 0,
        "label": "Felling",
        "description": "Felling weapons make a mockery of even the most resilient enemies, cutting dense tissue and bone with ease. When calculating damage from Felling weapons, reduce the target’s Unnatural Toughness bonus by the number in parentheses (X). Felling only reduces Unnatural Toughness, not the target’s base Toughness bonus, and does not persist once the damage has been calculated."
    },
    "flame": {
        "value": false,
        "label": "Flame",
        "description": "Using materials such as promethium and incendiary powders, this weapon ignites with primordial fire. Whenever a target is struck by an attack with this quality (even if he suffers no damage), he must make an Agility test or be set on fire (see page 243). If the target of the Flame attack is a vehicle, the pilot must make the appropriate Operate skill test with a bonus equal to the vehicle’s Armour value on the facing hit by the Flame attack. If the pilot fails, the vehicle immediately catches fire (see the On Fire! sidebar on page 263)."
    },
    "flexible": {
        "value": false,
        "label": "Flexible",
        "description": "These are often made of linked metal, rope, or other non-rigid materials that deny defensive counters. They cannot be Parried, though they themselves can be used to Parry an opponent’s weapon."
    },
    "force": {
        "value": false,
        "label": "Force",
        "description": "A force weapon relies on the user’s mind to unlock its true potential, suddenly turning a sword or staff into a device burning with eldritch energies able to reave tanks. Force weapons count as Best craftsmanship Mono variants of the equivalent Low-Tech weapon. In the hands of a psyker, the weapon also deals bonus damage and gains bonus penetration equal to the psyker’s base psy rating (so a psy rating 3 would grant +3 damage and +3 penetration), and the damage type changes to Energy. In addition, whenever a psyker damages an opponent, he may take a Focus Power action (Opposed with Willpower) as a Half Action. If he wins the test, then for every degree of success, the Force weapon’s wielder deals an additional 1d10 Energy damage, ignoring Armour and Toughness bonus. Psykers always use their base psy rating when determining psychic strength for this test, and cannot generate Psychic Phenomena on this test. Force weapons cannot be destroyed by weapons with the Power Field quality."
    },
    "gauss": {
        "value": false,
        "label": "Gauss",
        "description": "Gauss weapons are terrifying examples of advanced technology. Gauss weapons generate Righteous Fury on a 9 or 10, and reduce the armor of the struck location by 1d5 on a Righteous Fury."
    },
    "graviton": {
        "value": false,
        "label": "Graviton",
        "description": "Graviton weapons alter the target’s local gravity field, transforming protective armour into crushing force. When a weapon with the Graviton quality hits a target, it gives 2x of the target's AP in bonus damage. When damaging vehicles the weapon deals 1d10 damage ignoring armor and gains vengeful(9)."
    },
    "hallucinogenic": {
        "value": false,
        "num": 0,
        "label": "Hallucinogenic",
        "description": "Where most weapons seek to harm the body, those with this quality seek to damage the mind with exotic chemicals and neurotoxic drugs. When a creature is struck by a weapon with the Hallucinogenic quality, it must make a Toughness test with a penalty equal to 10 times the number in parentheses (X) or suffer a temporary delusion and roll 1d10 on Table 5–3: Hallucinogenic Effects. Respirators and sealed armour provide a +20 bonus to this test. The effects last for 1 round, plus 1 additional round for every degree of failure."
    },
    "haywire": {
        "value": false,
        "num": 0,
        "label": "Haywire",
        "description": "A foul affront to the Omnissiah in the eyes of many Tech-Priests, devices with this quality seek to cripple machine spirits and make metal as weak as flesh. Everything within the field’s radius, indicated by the number in parentheses, is affected; Haywire (3), for example, would affect an area with a three metre radius. Roll 1d10 on Table 5–4: Haywire Field Effects (adding any modifiers from the weapon) to determine the strength of the effect. As the field slowly dissipates, the strength lessens one step in severity each round until it becomes Insignificant (i.e., a result of Major Disruption would become Minor Disruption the following round and then cease to have an effect the round after that). Additional Haywire attacks in the same area do not stack but instead create a new effect that is either ignored if lower than the current effect or replaces the old one if higher."
    },
    "heavy": {
        "value": false,
        "label": "Heavy",
        "description": "This weapon is extremely weighty and impactful, as such it applies three times it's wielder's strength bonus in melee combat. These weapons are so heavy that the wielder needs at least a strength bonus of 10 to wield it effectively. These weapons can never be one handed and cannot be used to parry, swift attack or lightning attack."
    },
    "ignoreCover": {
        "value": false,
        "label": "Ignore Cover",
        "description": "Ranged weapons with this trait ignore the bonus from cover their targets receive."
    },
    "ignoreNaturalArmor": {
        "value": false,
        "label": "Ignore Natural Armor",
        "description": "Some weapons ignore the natural armor of their targets. This weapon ignores the armor granted by the natural armor trait."
    },
    "ignoreSoak": {
        "value": false,
        "label": "Ignore Soak",
        "description": "Some weapons deal damage regardless on the target's resilience. This weapon deals damage which ignores armor and toughness bonus reduction."
    },
    "indirect": {
        "value": false,
        "num": 0,
        "label": "Indirect",
        "description": "Many weapons are designed to be fired in high arcs at unseen foes or thrown from protective cover at charging enemies. Indirect weapons do not require line of sight to their target, but the attacker must still be aware of his intended target’s location, either through last known position, use of a spotter, or other means. When making any ranged attack action (Standard Attack, Semi-Auto Burst, or Full Auto Burst) with an Indirect weapon, the attack does not have to target a location in line of sight of the active player, but is made at a –10 penalty and requires a Full Action instead of the normal Half Action. The GM makes the final determination on whether the character is aware of his target’s location, and can add penalties to this ranged attack based on how aware the character is of his target. For each hit the ranged attack inflicts, roll once on the Scatter Diagram (see page 230). The hit instead strikes the ground at a location a number of metres away from the intended target, in the direction rolled on the Scatter Diagram, equal to 1d10 minus the firer’s Ballistic Skill bonus (to a minimum of zero). If the ranged attack fails, or if the Semi-Auto Burst or Full Auto Burst actions fail to achieve the maximum potential hits, the remaining missed hits—up to the maximum potential hits for the rate of fire used in the attack—are still fired, but miss their target. For each missed hit, roll once on the Scatter Diagram. The hit instead strikes the ground at a location Xd10 metres away from the intended target in the direction rolled on the Scatter Diagram, where X is equal to the number in parentheses (X). X is increased by 1 for shots at long range and by 2 for shots at extreme range."
    },
    "innacurate": {
        "value": false,
        "label": "Inaccurate",
        "description": "Poorly manufactured with often shoddy construction, inaccurate weapons are common in underhive gangs and heretical cults. A character gains no benefit from the Aim action when attacking with a weapon with this quality."
    },
    "lance": {
        "value": false,
        "label": "Lance",
        "description": "Lance weapons focus devastating energy, piercing armour with ease. Weapons with this quality have a variable penetration value that is dependent on the accuracy of each shot. When a target is hit by a weapon with the Lance quality, increase the weapon’s penetration value by its base value once for each degree of success the attacker achieves. For example, if a Lance weapon had a base penetration value of 5 and hit with three degrees of success (adding 3x5=15), the total penetration for the attack would be 20."
    },
    "lasModal": {
        "value": false,
        "label": "Las Modal",
        "mode":0,
        "description": "The standard las weapon has a variable setting option, allowing it to fire higher-powered bursts. It may be set to overcharge mode, dealing +1 damage, but using two shots worth of ammunition per shot fired. Further, the weapon may be set to overload mode, dealing +2 damage and gaining +2 penetration. In this case, it uses four shots of ammunition per shot fired, loses Reliable, and gains Unreliable."
    },
    "luminagen": {
        "value": false,
        "label": "Luminagen",
        "description": "Targets hit with these weapons gain a -10 penalty to evasion tests for 1d5 rounds."
    },
    "mastercrafted": {
        "value": false,
        "label": "Master Crafted",
        "description": "Weapons with this quality have been made by a legendary artisan ensuring their deadliness. Weapons with this quality reroll 1s when rolling for damage. Only best quality weapons may have this quality."
    },
    "maximal": {
        "value": false,
        "maximal": false,
        "label": "Maximal",
        "description": "Many energy weapons have multiple settings, allowing the user greater tactical flexibility in combat. As a Free Action, this weapon can be switched between two modes: Standard (which uses the normal weapon profile) and Maximal. When the weapon is fired on Maximal, it adds 10 metres to its range, 1d10 to its damage, and +2 to its penetration. If it has the Blast quality, then the value of this quality is increased by 2 (i.e., Blast [3] becomes Blast [5]). The weapon also uses three times the normal amount of ammunition per shot and gains the Recharge quality."
    },
    "mindscrambler": {
        "value": false,
        "label": "Mindscrambler",
        "description": "These weapons emit intense electromagnetic and magnetic waves which interfere with the functioning of machine to a dangerous degree. Weapons with this quality ignore all armor and toughness when dealing damage to a creature with the machine trait."
    },
    "mirror": {
        "value": false,
        "label": "Mirror",
        "description": "A weapon with the Mirror Quality double the number of melee hits that the user scores on a successful attack. For example, when attacking with a weapon with the Mirror quality using a lightning attack, each degree of success yields two additional hits (to a maximum of twice the user's weapon skill bonus). When evading hits from a weapon with the Mirror quality, 2 hits are evaded per degree of success."
    },
    "melta": {
        "value": false,
        "label": "Melta",
        "description": "These weapons rely on intense heat to negate protective armour, turning even the thickest to steaming liquid. This weapon triples its penetration when firing at Short range or closer."
    },
    "niditus": {
        "value": false,
        "label": "Niditus",
        "description": "When a psyker suffers damage from this weapon, he must make a Difficult (–10) Willpower test or be Stunned for a number of rounds equal to his degrees of failure. When a target with the Warp Instability trait suffers damage from this weapon, it must immediately test for Instability with a –10 penalty."
    },
    "nonexplosive": {
        "value": false,
        "label": "Non Explosive",
        "description": "This weapon and its ammunition do not explode when destroyed."
    },
    "nonexplosiveammunition": {
        "value": false,
        "label": "Non Explosive Ammunition",
        "description": "This weapon's ammunition does not explode when destroyed, the weapon itself may still explode and damage the vehicle when destroyed."
    },
    "overheats": {
        "value": false,
        "label": "Overheats",
        "description": "Through inefficient shielding, defective venting, or simply inherent design, the weapon often becomes overcome with the heat of its ammunition or firing methods. On an attack roll of 91 or higher, this weapon overheats. The wielder suffers Energy damage equal to the weapon’s damage with a penetration of 0 to an arm location (the arm holding the weapon if the weapon was fired one-handed, or a random arm if the weapon was fired with two hands). The wielder may choose to avoid taking the damage by dropping the weapon as a Free Action. A weapon that overheats must spend the round afterwards cooling down, and cannot be fired again until the second round after overheating. A weapon with this quality does not jam, and any effect that would cause the weapon to jam instead causes the weapon to overheat."
    },
    "purifyingflame": {
        "value": false,
        "label": "Purifying Flame",
        "description": "This weapon roars with blessed psychic flames. Daemons hit must succeed a Willpower test or be afflicted by Purifying Flames which deal 1d10+PR ignoring both armor and toughness every round. These flames also cause the target to make a willpower test on each of their turn or flail around in panic. The fire debuff deals normal damage against non daemonic targets."
    },
    "powerfield": {
        "value": false,
        "label": "Power Field",
        "description": "Power fields form a cloud of disruptive energy, allowing a weapon to strike with terrible force. When the character successfully uses this weapon to Parry an attack made with a weapon that lacks this quality, roll 1d100; on a result of 26 or higher, he destroys the attacker’s weapon. Weapons with the Warp Weapon or Force quality, and Natural Weapons, are immune to this effect."
    },
    "primitive": {
        "value": false,
        "num": 0,
        "label": "Primitive",
        "description": "Crude and basic in design, these kinds of weapons, while still deadly, are less effective against modern armour. When rolling for damage with these weapons, any die result greater than the number in parentheses (X) counts as that number instead. For example, a weapon with Primitive (7) would count all damage rolls of 8, 9 or 10 as 7. These weapons can still generate Righteous Fury (see page 227) as normal, on a damage roll of 10."
    },
    "proven": {
        "value": false,
        "num": 0,
        "label": "Proven",
        "description": "These weapons always inflict massive trauma. When rolling for damage with these weapons, any die result lower than the number in parentheses (X) counts as that number instead. Thus, a Proven (3) weapon would treat any die result of 1 or 2 as a 3 for the purposes of calculating damage."
    },
    "radpoisoning": {
        "value": false,
        "label": "Rad Poisoning",
        "description": "Anyone within 3m of the target must test against toxic(0)"
    },
    "razorsharp": {
        "value": false,
        "label": "Razor Sharp",
        "description": "Certain weapons or ammunition types have the ability to slice right through armour if they hit just right. If the wielder scores three or more degrees of success when attacking with this weapon, the weapon’s penetration value is doubled when resolving any hits from that attack."
    },
    "recharge": {
        "value": false,
        "label": "Recharge",
        "description": "Some weapons lack continuous power or ammunition supplies, and each strike drains capacitors or empties fuel reservoirs. When a weapon with this quality is used to make an attack, that weapon cannot be used to attack again until the end of the next round (in effect, it can only be used once every other round)."
    },
    "reliable": {
        "value": false,
        "label": "Reliable",
        "description": "Using ancient and well-consecrated designs, reliable weapons bring glory to the Omnissiah with each attack. Reliable weapons only jam on an unmodified result of 100. Reliable weapons with the Spray quality, or which do not make hit rolls, never jam."
    },
    "sanctified": {
        "value": false,
        "label": "Sanctified",
        "description": "These weapons are blessed against the forces of Chaos. Any damage inflicted by a Sanctified weapon counts as Holy damage, which can have unique effects against some terrible Daemons and other denizens of the Warp."
    },
    "scatter": {
        "value": false,
        "label": "Scatter",
        "description": "Scatter weapons are more deadly in shorter ranges. When firing at point blank range a scatter weapon scores an extra hit for every degree of success, when firing at short range the weapon scores an extra hit for every two degrees of success. Firing at any range greater than short range causes the armor of the opponent to count as double. Scatter weapons ignore hit penalties due to size."
    },
    "shatterresistant": {
        "value": false,
        "label": "Shatter Resistant",
        "description": "Shatter resistant weapons do not get destroyed by weapons with the power field quality."
    },
    "shieldbreaker": {
        "value": false,
        "label": "Shieldbreaker",
        "description": "Shieldbreaker weapons ignore force fields."
    },
    "shocking": {
        "value": false,
        "label": "Shocking",
        "description": "Shocking weapons can incapacitate their opponents with a powerful surge of energy or other non-lethal means. A target that takes at least 1 point of damage from a Shocking weapon (after Armour and Toughness bonus) must make a Challenging (+0) Toughness test. If he fails, he suffers 1 level of Fatigue and is Stunned for a number of rounds equal to half of his degrees of failure (rounding up)."
    },
    "shockwave": {
        "value": false,
        "label": "Shockwave",
        "description": "When the character scores 4+ DoS on an attack roll the weapon releases shockwaves on every hit, in a blast(3). Secondary targets take half damage and half pen but still must test against concussive(0)"
    },
    "shredding": {
        "value": false,
        "label": "Shredding",
        "description": "Double the weapon's d10s and drop the lowest half."
    },
    "skyfire": {
        "value": false,
        "label": "Skyfire",
        "description": "Skyfire weapons ignore penalties to hit targets with the supersonic trait, but they suffer a -20 penalty to hit targets without the trait."
    },
    "smoke": {
        "value": false,
        "num": 0,
        "label": "Smoke",
        "description": "Rather than inflicting damage, these weapons throw up dense clouds to create cover. When a hit is scored from a weapon with this quality, it creates a smokescreen at the point of impact with a radius in metres equal to the number in parentheses (X). This screen lasts for 1d10+10 rounds, or a shorter time in adverse weather conditions (see the effects of smoke on page 229)."
    },
    "snare": {
        "value": false,
        "num": -1,
        "label": "Snare",
        "description": "These ensnaring devices use masses of fibrous webbing, adhesive fluids, and other entangling materials to bring an enemy down. When a target is struck by a weapon with this quality, it must make an Agility test with a penalty equal ten times the number in parentheses (X) or be Immobilised. For example, a weapon with Snare (1) would impose a –10 penalty on this test. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a Challenging (+0) Strength or Agility test, with a penalty equal to ten times the number in parentheses (X). If he succeeds, he bursts free or wriggles out. The target is considered Helpless (see page 229) until he escapes."
    },
    "spray": {
        "value": false,
        "label": "Spray",
        "description": "Spray weapons use large area-effect shots to strike more foes, sacrificing range for wider coverage. Unlike other weapons,they have just one range and, when fired, hit all those in their area of effect. The wielder does not need to test Ballistic Skill; all creatures in the weapon’s path (a cone-shaped area extending in a 30° arc from the firer out to the weapon’s range) must make a Challenging (+0) Agility test or suffer one hit from the weapon. If the wielder does not possess the appropriate Weapon Training talent, targets gain a +20 bonus on the test; this rises to +30 if the weapon is Heavy and the wielder is not braced. Cover does not protect from Spray attacks unless it completely conceals a target. Because there is no attack roll, they are always considered to strike the Body location. They jam if the firer rolls a 9 on any damage dice (before any modifiers are applied). Due to the inaccurate nature of their design, they cannot be used to make Called Shot actions."
    },
    "storm": {
        "value": false,
        "label": "Storm",
        "description": "A weapon with the Storm Quality unleashes shots at rapid speed, often through use of a double-barrelled design. This Quality doubles the number of hits inflicted on the target and the amount of ammunition expended. For example, when firing a weapon with the Storm Quality in fully automatic mode, each degree of success yields two additional hits (to a maximum of twice the weapon’s Full Automatic rate of fire). When evading hits from a weapon with the storm quality, 2 hits are evaded per degree of success."
    },
    "sweeping": {
        "value": false,
        "label": "Sweeping",
        "description": "Sweeping weapons allow the character to make sweeping attacks. A sweeping attack is a +30 weapon skill test as a full action. If successful the character hits every enemy character of 2 lower size categories or smaller that is within reach of the weapon. Sweeping attacks count as an all out attack in that they consume a reaction. Sweeping weapons also inflict additional hits to hordes in melee combat. A sweeping weapon gets a number of additional hits equal to 3 times DoS against hordes."
    },
    "tainted": {
        "value": false,
        "label": "Tainted",
        "description": "Permeated with the power of the Warp, these weapons draw out the inner darkness of their wielders. Weapons with this quality inflict additional damage equal to the value of the user’s Corruption bonus or Daemonic (X) trait value (whichever is higher)."
    }, 
    "tarHead": {
        "value": false,
        "label": "Targets Head",
        "description": "Some weapons always hit the head, this trait represents that."
    }, 
    "taxing": {
        "value": false,
        "num": 0,
        "label": "Taxing",
        "description": "Taxing weapons generate an amount of heat equal to X when fired."
    },
    "tearing": {
        "value": false,
        "label": "Tearing",
        "description": "These weapons call on spinning chainblades, serrated claws, burrowing projectiles, and other vicious means to rip apart targets. These weapons roll one extra die for damage, and the lowest result is discarded."
    },
    "thermal": {
        "value": false,
        "label": "Thermal",
        "description": "These weapons cause vehicles hit by them to build up internal heat. Superheavy vehicles gain 1 heat, normal vehicles are set ablaze."
    },
    "torrent": {
        "value": false,
        "num": 0,
        "label": "Torrent",
        "description": "This represents weapons with a high volume of fire which fill the air with projectiles. When firing such a weapon on full automatic, use a cone template with an angle equal to X and a size equal to the weapon range. All characters inside the template must pass an agility test minus -5*RoF of the weapon. Hits are then distributed by priority of targets which failed worse, until either all hits are allocated or a target has received hits equal to its degrees of failure. Once the hits are allocated targets may try to evade, if they can move out of the template with a half move."
    },
    "toxic": {
        "value": false,
        "num": 0,
        "label": "Toxic",
        "description": "Filled with malignant chemicals and fast acting poisons, toxic weapons bring down enemies through virulence and sickness. At the end of his turn, if a character has suffered damage (after Armour and Toughness bonus) in the last round from a weapon with this quality, he must make a Toughness test with a penalty equal to 10 times the number in parentheses (X) or suffer 1d10 additional damage (of the same type as the first weapon with this quality to damage him that round). For example, a weapon with Toxic (4) imposes a –40 on the tests to resist its effects. Some weapons or creatures carry additional effects with their toxins or inflict more damage, as indicated in their individual descriptions."
    },
    "twinlinked": {
        "value": false,
        "label": "Twin-Linked",
        "description": "A Twin-Linked weapon represents two identical weapons connected together and set to fire at the same time, increasing the chances of scoring a hit by blasting more shots at the target. A weapon with this quality gains a +20 to hit when fired and uses twice as much ammunition. In addition, the weapon scores one additional hit if the attack roll succeeds by two or more degrees of success. When emptied, the weapon’s reload time is doubled."
    },
    "unbalanced": {
        "value": false,
        "label": "Unbalanced",
        "description": "Cumbersome, awkward to use, and often heavy, these are usually powerful offensively, but suffer in defence actions such as parrying. These weapons cannot be used to make Lighting Attack actions, and impose a –10 penalty when used to Parry."
    },
    "unreliable": {
        "value": false,
        "label": "Unreliable",
        "description": "A clear affront to the Omnissiah, Unreliable devices represent poorly designed, badly manufactured, or improperly consecrated weapons that are perhaps better than no weapon at all, but not by a great measure. An Unreliable weapon suffers a jam on a roll of 91 or higher, even if fired on Semi- or Full Auto."
    },
    "unwieldy": {
        "value": false,
        "label": "Unwieldy",
        "description": "Huge and often top-heavy, Unwieldy weapons are too awkward to be used with finesse. They cannot be used to Parry or make Lightning Attack actions."
    },
    "vengeful": {
        "value": false,
        "num": 10,
        "label": "Vengeful",
        "description": "These weapons seemingly embody the Emperor’s wrath, and eagerly strike down any who would stand against His servants. When attacking with this weapon, the attacker triggers Righteous Fury (see page 227) on any damage die result with a value of X or higher (before any modifiers are applied)."
    },
    "volkite": {
        "value": false,
        "label": "Volkite",
        "description": "Damage rolls of 10 add another d10 to the damage, extra d10s do not generate further d10s."
    },
    "voidstrike": {
        "value": false,
        "label": "Voidstrike",
        "description": "Weapons with the Voidstrike quality score an additional degree of success on a successful attack roll."
    },
    "warp": {
        "value": false,
        "label": "Warp",
        "description": "Creatures with this trait have weapons that are partially insubstantial, able to ignore such mundane things as armour or cover. Natural weapons and attacks made by a creature with this trait ignore physical armour, unless the armour is created from psychoactive materials or is somehow warded against the Warp. Force fields still work against these attacks normally."
    },
    "wpSoak": {
        "value": false,
        "label": "Willpower Soak",
        "description": "Certain psychic powers have their damage reduced by the target's willpower bonus instead of toughness. This trait represents that ability."
    }
};
FORTYK.weaponFacings=[{value:"",label:"None"},{value:"front",label:"Front"},{value:"rear",label:"Rear"},{value:"lSide",label:"Left Side"},{value:"rSide",label:"Right Side"}];
FORTYK.weaponMounts=[
    {value:"fixed",label:"Fixed",description:"Fixed weapons are embedded within the hull of a vehicle and do not possess the ability to turn. They might have a limited vertical traversal ability, but otherwise only fire in a direct straight line from the Facing the weapon is mounted. To turn the gun from left to right the vehicle must move. A Basilisk’s earthshaker cannon is an example of a Fixed Weapon Mounting."},
    {value:"hull",label:"Hull",description:"Hull weapons are similar to Fixed weapons in that they have a limited range of movement, but benefit from being able to move from left to right as well as up and down. A Hull weapon has a 45-degree Fire Arc from the Facing the weapon is mounted. A Baneblade’s demolisher cannon is an example of a Hull Weapon Mounting in the Front Facing."},
    {value:"turret",label:"Turret",description:"Turret-mounted weapons are often placed high on a vehicle on top of its hull to give them the greatest line of sight in as many directions as possible. They give the greatest tactical flexibility in their ability to point in almost every direction. A Turret weapon has a 360-degree Fire Arc, and only the vehicle itself can block this arc (e.g. a vehicle with multiple turrets would find that the Fire Arc of one turret blocks the other turret, or the vehicle itself, if the turret is mounted low enough, such as the lascannon turrets on a Baneblade). Turrets cannot turn to face directions instantaneously, and thus it takes a Half Action for every full 180-degrees that a turret needs to turn. The GM and the players should always be aware of which direction their turrets are facing, as this can be important for Critical Damage. Additionally, due to their heavier armour, turrets treat all hits as hits to the Front Facing, regardless of the direction the attack came from in relation to the turret’s current facing (see Table 8–24 Vehicle Hit Locations on page 275). A Leman Russ’ battle cannon is an example of a Turret Weapon Mounting."},
    {value:"sponson",label:"Sponson",description:"Sponson-mounted weapons are often used defensively on the flanks and sometimes even the rear of a vehicle, whilst the vehicle’s main weapon continues its assault upon the enemy. A Sponson weapon has a 180-degree Fire Arc from the Facing the weapon is mounted (e.g. a Sponson-mounted Weapon on a vehicle’s Left Side Facing has a 180 degree Fire Arc to the left of the vehicle). Walkers, unless specified otherwise, treat all their weapons as Sponson-mounted, specifically a Sponson mounting that gives them a 180 degree Fire Arc to the Walker’s Front Facing. This is to represent the fact that most Walkers have the ability to twist their torsos or even move their arms independently of the Walker’s main body in much the same way as a regular infantryman. A Leman Russ’ left and right heavy bolters and a Sentinel’s multi-laser are examples of Sponson Weapon Mountings."},
    {value:"coaxial",label:"Co-Axial",description:"Co-Axial weapons are specially designed to be linked with other (usually larger) weapons. This is done for a variety of reasons, but most commonly to act as a guide (via tracer rounds) for the other gun. A Co-Axial weapon has the same Fire Arc as the weapon it is attached to and, as an exception to the standard rules for making attacks, a Co-Axial weapon may be fired at the same time as the gun it is linked to as a Full Action. The player first works out the shot from the Co-Axial weapon, as well as any Damage. If the Co- Axial weapon missed, then the other weapon just fires as normal. If the Co-Axial weapon hit with any shots, then the other weapon it is linked to gains a further +20 to the Ballistic Skill Test (but only for that shot, not subsequent shots unless the Co-Axial weapon is used again). A Baneblade’s autocannon is an example of a Co- Axial Weapon mounting."},
    {value:"pintle",label:"Pintle",description:"Pintle weapons are usually optional or additional weapons bolted onto turret rings or placed in areas where spare crew or even passengers can use them. They are usually comparatively light weapons, such as heavy stubbers, and are used to defend the vehicle in much the same way as sponson weaponry. Unlike the other weaponry mounted on a vehicle, Pintle weapons do not automatically have a crew member assigned to them. Instead, they may be fired by anyone who can realistically reach one during his Turn, or who reached one in a previous Turn. Even passengers may fire a Pintle weapon if they are able. Pintle weapons usually have a 360 degree Fire Arc, as they are often mounted on the highest point of a vehicle, but there are exceptions to this and the GM should be aware of what might block a Pintle weapon’s Fire Arc."}];
FORTYK.lasModes=[{key:0,label:"normal"},{key:1,label:"overcharge"},{key:2,label:"overload"}];
FORTYK.itemQualities=[{value:"Poor"},{value:"Common"},{value:"Good"},{value:"Best"}];
FORTYK.skillChars={"ws":{"name":"ws","caps":"WS"},"bs":{"name":"bs","caps":"BS"},"s":{"name":"s","caps":"S"},"t":{"name":"t","caps":"T"},"agi":{"name":"agi","caps":"AGI"},"int":{"name":"int","caps":"INT"},"per":{"name":"per","caps":"PER"},"wp":{"name":"wp","caps":"WP"},"fel":{"name":"fel","caps":"FEL"}};
FORTYK.characteristics={"ws":{"key":"ws","label":"Weapon Skill","aptitudes":"weapon skill, offence"},"bs":{"key":"bs","label":"Ballistic Skill","aptitudes":"ballistic skill, finesse"},"s":{"key":"s","label":"Strength","aptitudes":"strength, offence"},"t":{"key":"t","label":"Toughness","aptitudes":"toughness, defence"},"agi":{"key":"agi","label":"Agility","aptitudes":"agility, finesse"},"int":{"key":"int","label":"Intelligence","aptitudes":"intelligence, knowledge"},"per":{"key":"per","label":"Perception","aptitudes":"perception, fieldcraft"},"wp":{"key":"wp","label":"Willpower","aptitudes":"willpower, psyker, leadership"},"fel":{"key":"fel","label":"Fellowship","aptitudes":"fellowship, social"}};
FORTYK.skillTraining={"0":{"name":"Untrained","value":-20},"1":{"name":"Known","value":0},"2":{"name":"Trained","value":10},"3":{"name":"Experienced","value":20},"4":{"name":"Veteran","value":30}};
FORTYK.ACTIVE_EFFECT_MODES = {
    CUSTOM: 0,
    MULTIPLY: 1,
    ADD: 2,
    DOWNGRADE: 3,
    UPGRADE: 4,
    OVERRIDE: 5
};
FORTYK.StatusEffects = [
    {
        id: "dead",
        name: "Dead",
        icon: "icons/svg/skull.svg",
        overlay: true,
        statuses:["dead"],
        flags: { core: {overlay: true,
                        statusId: "dead"} }
    },
    {
        id: "unconscious",
        name: "Unconscious",
        icon: "icons/svg/unconscious.svg",
        statuses:["unconscious"],
        flags: { core: {overlay: true
                       } }
    },
    {
        id: "running",
        name: "Running",
        icon: "systems/fortyk/icons/running.png",
        statuses:["running"],
        duration:{

            rounds:0
        }
    },
    {
        id: "totalDef",
        name: "Total Defense",
        icon: "systems/fortyk/icons/defense.png",
        statuses:["totalDef"],
        duration:{

            rounds:0
        }
    },
    {
        id: "stunned",
        name: "Stunned",
        icon: "icons/svg/daze.svg",
        statuses:["stunned"]
    },
    {
        id: "prone",
        name: "Prone",
        icon: "icons/svg/falling.svg",
        statuses:["prone"]
    },
    {
        id: "snare",
        name: "Snare",
        icon: "icons/svg/net.svg",
        statuses:["snare"]
    },
    {
        id: "blind",
        name: "Blind",
        icon: "icons/svg/blind.svg",
        statuses:["blind"]
    },
    {
        id: "deaf",
        name: "Deaf",
        icon: "icons/svg/deaf.svg",
        statuses:["deaf"]
    },
    {
        id: "shock",
        name: "Shocked",
        icon: "icons/svg/terror.svg",
        statuses:["shock"],
        changes:[
            {key: "system.globalMOD.value", value: -10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
        ]
    },
    {
        id: "fire",
        name: "Fire",
        icon: "icons/svg/fire.svg",
        statuses:["fire"]
    },
    {
        id: "purifyingflame",
        name: "Purifying Flame",
        icon: "systems/fortyk/icons/purefire.png",
        statuses:["purifyingflame"]
    },
    {
        id: "corrode",
        name: "Corroded",
        icon: "icons/svg/acid.svg",
        statuses:["corrode"]
    },
    {
        id: "bleeding",
        name: "Bleeding",
        icon: "icons/svg/blood.svg",
        tint:"#8a0303",
        statuses:["bleeding"]
    },
    {
        id: "cryogenic",
        name: "Cryogenic",
        icon: "systems/fortyk/icons/cryo.png",
        statuses:["cryogenic"]
    },
    {
        id: "toxic",
        name: "Toxic",
        icon: "icons/svg/poison.svg",
        statuses:["toxic"]
    },

    {
        id: "rad",
        name: "Radiation",
        icon: "icons/svg/radiation.svg",
        statuses:["rad"]
    },
    {
        id: "frenzy",
        name: "Frenzy",
        icon: "systems/fortyk/icons/frenzy.png",
        statuses:["frenzy"],
        changes:[
            {key: "system.characteristics.s.value", value: 10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.t.value", value: 10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.wp.value", value: 10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.ws.value", value: 10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.bs.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.int.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD},
            {key: "system.characteristics.fel.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}
        ]
    },
    {
        id: "hallucinogenic",
        name: "Hallucinogenic",
        icon: "systems/fortyk/icons/spiral.png",
        statuses:["hallucinogenic"]
    },
    {
        id: "buff",
        name: "Buff",
        icon: "icons/svg/upgrade.svg",
        statuses:["buff"]
    },
    {
        id: "weakened",
        name: "Weakened",
        icon: "icons/svg/downgrade.svg",
        statuses:["weakened"]
    },
    {
        id: "target",
        name: "Target",
        icon: "icons/svg/target.svg",
        statuses:["target"]
    },
    {
        id: "marked",
        name: "Marked",
        icon: "icons/svg/eye.svg",
        statuses:["marked"]
    },
    {
        id: "crippled",
        name: "Crippled",
        icon: "icons/svg/sun.svg",
        statuses:["crippled"]
    },
    {
        id: "blessed",
        name: "Blessed",
        icon: "icons/svg/angel.svg",
        statuses:["blessed"]
    },
    {
        id: "fireShield",
        name: "FireShield",
        icon: "icons/svg/fire-shield.svg",
        statuses:["fireShield"]
    },
    {
        id: "coldShield",
        name: "IceShield",
        icon: "icons/svg/ice-shield.svg",
        statuses:["coldShield"]
    },
    {
        id: "magicShield",
        name: "MagicShield",
        icon: "icons/svg/mage-shield.svg",
        statuses:["magicShield"]
    },
    {
        id: "holyShield",
        name: "HolyShield",
        icon: "icons/svg/holy-shield.svg",
        statuses:["holyShield"]
    },
    {
        id: "ws",
        name: "Weapon Skill Damage",
        icon: "systems/fortyk/icons/ws.png",
        statuses:["ws"]
    },
    {
        id: "bs",
        name: "Ballistic Skill Damage",
        icon: "systems/fortyk/icons/bs.png",
        statuses:["bs"]
    },
    {
        id: "s",
        name: "Strength Damage",
        icon: "systems/fortyk/icons/s.png",
        statuses:["s"]
    },
    {
        id: "t",
        name: "Toughness Damage",
        icon: "systems/fortyk/icons/t.png",
        statuses:["t"]
    },
    {
        id: "agi",
        name: "Agility Damage",
        icon: "systems/fortyk/icons/agi.png",
        statuses:["agi"]
    },
    {
        id: "int",
        name: "Intelligence Damage",
        icon: "systems/fortyk/icons/int.png",
        statuses:["int"]
    },
    {
        id: "per",
        name: "Perception Damage",
        icon: "systems/fortyk/icons/per.png",
        statuses:["per"]
    },
    {
        id: "wp",
        name: "Willpower Damage",
        icon: "systems/fortyk/icons/wp.png",
        statuses:["wp"]
    },
    {
        id: "fel",
        name: "Fellowship Damage",
        icon: "systems/fortyk/icons/fel.png",
        statuses:["fel"]
    },
    {
        id: "arm",
        name: "Arm Injury",
        icon: "systems/fortyk/icons/arm.png",
        statuses:["arm"]
    },
    {
        id: "leg",
        name: "Leg Injury",
        icon: "systems/fortyk/icons/leg.png",
        statuses:["leg"]
    },
    {
        id: "rough",
        name: "Rough Terrain",
        icon: "systems/fortyk/icons/sticky-boot.png",
        statuses:["rough"]
    },
    {
        id: "tough",
        name: "Tough Terrain",
        icon: "systems/fortyk/icons/232784.png",
        statuses:["tough"]
    },
    {
        id: "severe",
        name: "Severe Terrain",
        icon: "systems/fortyk/icons/quarry-512.png",
        statuses:["severe"]
    }
];
FORTYK.itemRarityLabels = {"100":"Ubiquitous","30":"Abundant","20":"Plentiful","10":"Common","0":"Average","-10":"Scarce","-20":"Rare","-30":"Very Rare","-40":"Extremely Rare","-50":"Near Unique","-60":"Unique"};
FORTYK.itemRarity= [{value:100,"label":"Ubiquitous"},{value:30,label:"Abundant"},{value:20,label:"Plentiful"},{value:10,label:"Common"},{value:0,label:"Average"},{value:-10,label:"Scarce"},{value:-20,label:"Rare"},{value:-30,label:"Very Rare"},{value:-40,label:"Extremely Rare"},{value:-50,label:"Near Unique"},{value:-60,label:"Unique"}];
FORTYK.cargoRarityValue = {"100":2,"30":5,"20":10,"10":20,"0":50,"-10":100,"-20":200,"-30":400,"-40":1000,"-50":3000,"-60":6000};
FORTYK.cargoQualityMultiplier = {"Poor":0.5,"Common":1,"Good":2,"Best":4};
FORTYK.comradeRanks=[{value:"Green"},{value:"Guardsman"},{value:"Veteran"}];
FORTYK.vehicleTypes=[{value:"Tracked"},{value:"Wheeled"},{value:"Skimmer"},{value:"Walker"},{value:"Aircraft"},{value:"Spacecraft"}];
FORTYK.meldTypes={"default":20,"experimental":20,"safe":10};
FORTYK.itemStates=[{value:"O"},{value:"D"},{value:"X"}];
FORTYK.advances=[{value:0,label:"0%"},{value:5,label:"5%"},{value:10,label:"10%"},{value:15,label:"15%"},{value:20,label:"20%"},{value:25,label:"25%"}];
FORTYK.psyChars=[{value:"wp",label:"Willpower"},{value:"per",label:"Perception"},{value:"psy",label:"Psyniscience"}];
