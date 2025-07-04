/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import { getItem } from "../utilities.js";
import { isEmpty } from "../utilities.js";
import { objectByString } from "../utilities.js";
import { setNestedKey } from "../utilities.js";
export class FortyKItem extends Item {
    //@Override the create function to add an activeeffect for modifiers to an item
    static async create(data, options) {
        // If the created item has effects (only applicable to duplicated actors) bypass the new item creation logic

        if (data.effects) {
            return super.create(data, options);
        }
        /*let modifiersData={
            id: "modifiers",
            label: data.name,
            changes:[],
            transfer:true,
            disabled:true}
        let modifiers= await ActiveEffect.create(modifiersData,{temporary:true});

        data.effects=[];
        data.effects.push(modifiers);
        //resume item creation
        */
        return super.create(data, options);
    }
    /**
     ** @override talents and traits should update their flags on the owning actor if the specialisation field is changed
     **/
    async update(data, options = {}) {

        if (this.type === "talentntrait") {
            if (this.isEmbedded) {
                if (this.system.specialisation.value !== data["system.specialisation.value"]) {
                    await this.actor.setFlag("fortyk", this.system.flagId.value, data["system.specialisation.value"]);
                }
            }
        }

        if (this.actor) {
            if (this.actor.type === "knightHouse") {
                if (this.system.loaned) {
                    if (game.user.isGM) {
                        let loaned = this.system.loaned;
                        for (let i = 0; i < loaned.length; i++) {
                            let knight = await game.actors.get(loaned[i].knightId);
                            let update = foundry.utils.duplicate(data);
                            update._id = loaned[i].itemId;

                            try {
                                await knight.updateEmbeddedDocuments("Item", [update]);
                            } catch (err) {}
                        }
                    } else {
                        //if user isnt GM use socket to have gm update the actor
                        let loans = this.system.loaned;
                        let socketOp = { type: "updateLoans", package: { loans: loans, update: data } };
                        await game.socket.emit("system.fortyk", socketOp);
                    }
                }
            }
        }

        super.update(data, options);
    }

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    async prepareData() {
        //super.prepareData();

        // Get the Item's data
        const item = this;
        item.FORTYK = game.fortyk.FORTYK;
        /*if(game.user.isGM){
            if(!item.flags.fortyk)item.flags.fortyk={};
            item.flags.fortyk.hidden=false;
        }*/
        if(this.system.quality?.value){

            this.name=`(${this.FORTYK.itemQualityAbrv[this.system.quality.value]}) ${this._source.name}`;


        }

        let qualityMods=this.FORTYK.qualityMods;
        if(item.type==="armor"){
            item.system.mods.max=3;
            item.system.mods.max+=qualityMods[item.system.quality.value];
        }else if(item.type==="rangedWeapon"){
            if(item.system.class.value==="Pistol"){
                item.system.mods.max=1; 
            }else{
                item.system.mods.max=2;
            }
            item.system.mods.max+=qualityMods[item.system.quality.value];
        }else if(item.type==="meleeWeapon"){
            if(item.system.class.value==="Melee Two-handed"){
                item.system.mods.max=2; 
            }else{
                item.system.mods.max=1;
            }
            item.system.mods.max+=qualityMods[item.system.quality.value];
        }
        //ensure this is an owned item

        if (this.actor) {


            const data = this.actor.system;
            let actor = this.actor;
            if (item.system.state) {
                if (
                    item.system.state.value === "X" ||
                    item.system.state.value === "D" ||
                    item.system.state.value === "0"
                ) {
                    if (!item.flags.fortyk) {
                        item.flags.fortyk = {};
                    }
                    item.flags.fortyk.disabled = true;
                }
            }
            if(actor.type==="loot"){
                return;
            }
            
            if (actor.type === "spaceship") {
                if (item.type === "spaceshipCargo") {
                    try {
                        item.system.pf.value = item.FORTYK.cargoRarityValue[this.system.rarity.value];
                        let craftMultiplier = item.FORTYK.cargoQualityMultiplier[this.system.quality.value];
                        item.system.pf.total =
                            item.system.pf.value * parseFloat(item.system.space.value) * craftMultiplier;
                        item.system.rarity.label = item.FORTYK.itemRarityLabels[item.system.rarity.value];
                    } catch (err) {}
                }
                return;
            }
            if (actor.type === "knightHouse") {
                if (item.type !== "repairEntry" && item.type !== "cadetHouse" && item.type !== "outpost") {
                    item.system.amount.left = item.system.amount.value - item.system.amount.taken;
                }
                if (item.type === "repairEntry") {
                    item.system.time.label = this.timeString(item.system.time.value, "");
                }
                if (item.type === "meleeWeapon" || item.type === "rangedWeapon" || item.type === "ammunition") {
                    if (item.type === "rangedWeapon") {
                        if (item.system.class.value.indexOf("Titanic") === -1) {
                            item.system.knightComponentType = "auxiliaryWeapon";
                        } else {
                            item.system.knightComponentType = item.type;
                        }
                    } else {
                        item.system.knightComponentType = item.type;
                    }
                } else if (item.type === "knightComponent") {
                    item.system.knightComponentType = item.system.type.value;
                } else {
                    item.system.knightComponentType = item.type;
                }
                return;
            }
            if(item.type === "skill"){
                if(actor.getFlag("fortyk","toomanysecrets")&&item.system.parent.value==="Forbidden Lore"){
                    item.system.aptitudes.value="General, Intelligence";
                }
            }
            if (item.type === "ammunition"){
                item.label=item.name+":"+item.system.amount.value;
            }
            if (item.type === "forceField") {
                if (actor.type === "vehicle") {
                    if (actor.getFlag("fortyk", "ionovercharge")) {
                        let heatCap = actor.system.knight.heat.max;
                        let currentHeat = actor.system.knight.heat.value;
                        if (currentHeat >= heatCap / 2) {
                            item.system.rating.value += 10;
                        }
                    }
                }else{
                    let wp=actor.system.characteristics.wp.total;
                    item.system.rating.value=Math.ceil(math.evaluate(item.system.rating.value,{wp:wp}));
                    item.system.rating.overload=Math.ceil(math.evaluate(item.system.rating.overload,{wp:wp}));
                }
                //logic for the sanctuary forcefields
                if (item.getFlag("fortyk", "adjustment")) {
                    let caster = fromUuidSync(item.getFlag("fortyk", "origin"));
                    let actorPr;
                    if (caster.uuid !== actor.uuid) {
                        if (!caster.system.isPrepared) {
                            caster.prepareData();
                        }
                        actorPr = caster.system.psykana.pr.effective;
                    } else {
                        actorPr =
                            parseInt(actor.system.psykana.pr.value) +
                            parseInt(actor.system.psykana.pr.bonus) -
                            Math.max(0, actor.system.psykana.pr.sustain - 1);
                    }
                    let adjustment = item.getFlag("fortyk", "adjustment");

                    let pr = actorPr - adjustment;
                    let max = 80;
                    if (item.getFlag("fortyk", "sanctuary")) {
                        item.system.rating.value = Math.min(max, 5 * pr);
                    }
                    if (item.getFlag("fortyk", "sanctuaryDaemon")) {
                        item.system.rating.value = Math.min(max, 10 * pr);
                    }
                }

                return;
            }
            if (item.getFlag("fortyk", "currentprofile")) {
                let currentProfileUuid = item.getFlag("fortyk", "currentprofile");

                let currentProfile = item.getFlag("fortyk", "currentprofile");
                if (typeof currentProfile === "string" || currentProfile instanceof String) {
                    currentProfile = await fromUuid(item.getFlag("fortyk", "currentprofile"));
                }
                currentProfile = foundry.utils.duplicate(currentProfile);
                this.applyActiveEffects(currentProfile);
                item.name = currentProfile.name;
                item.system.damageType.value = currentProfile.system.damageType.value;
                item.system.range.value = currentProfile.system.range.formula;
                item.system.range.formula = currentProfile.system.range.formula;
                item.system.range.multi = 1;
                item.system.pen.formula = currentProfile.system.pen.formula;
                if (item.type === "rangedWeapon") {
                    item.system.rof = currentProfile.system.rof;

                }
                item.system.damageFormula.formula = currentProfile.system.damageFormula.formula;
                let profiles = item.getFlag("fortyk", "profiles");
                item.flags = currentProfile.flags;
                item.flags.fortyk.profiles = profiles;
                item.flags.fortyk.alternateprofiles = true;
                item.flags.fortyk.currentprofile = currentProfileUuid;
                //item.applyActiveEffects();
            }
            if (item.type === "meleeWeapon") {
                item.system.damageFormula.value = item.system.damageFormula.formula;
                item.system.range.value = item.system.range.formula;
                item.system.pen.value = item.system.pen.formula;

                let weaponQuality = item.system.quality.value;
                item.system.testMod.value = parseInt(item._source.system.testMod.value);
                if (weaponQuality === "Poor") {
                    item.system.testMod.value += -10;
                } else if (weaponQuality === "Good") {
                    item.system.testMod.value += 5;
                } else if (weaponQuality === "Best") {
                    item.system.testMod.value += 10;
                    item.system.damageFormula.value += "+1";
                }
                if (this.getFlag("fortyk", "defensive")) {
                    item.system.testMod.value -= 10;
                }
            }
            if (item.type === "rangedWeapon") {
                //parse rof
                if(actor.getFlag("fortyk","psyrating")){
                    let pr=actor.system.psykana.pr.effective;
                    let scope={pr:pr};
                    try{

                        item.system.rof[1].value=Math.ceil(math.evaluate(item.system.rof[1].value,scope));

                        item.system.rof[2].value=Math.ceil(math.evaluate(item.system.rof[2].value,scope));
                    }catch (err){
                        item.system.rof[1].value=parseInt(item.system.rof[1].value);
                        if(isNaN(item.system.rof[1].value)){
                            item.system.rof[1].value=0;
                        }
                        item.system.rof[2].value=parseInt(item.system.rof[2].value);
                        if(isNaN(item.system.rof[2].value)){
                            item.system.rof[2].value=0;
                        }
                    }
                }else{
                    item.system.rof[1].value=parseInt(item.system.rof[1].value);
                    if(isNaN(item.system.rof[1].value)){
                        item.system.rof[1].value=0;
                    }
                    try {
                        item.system.rof[2].value=parseInt(item.system.rof[2].value);
                        if(isNaN(item.system.rof[2].value)){
                            item.system.rof[2].value=0;
                        }
                    } catch (e) {
                        item.system.rof[2]={value:0};
                    }
                }
                if(Number.isNaN(item.system.rof[0].value)&&item.system.rof[0].value?.toLowerCase()==="s"){
                    item.system.rof[0].value=1;
                }else{
                    item.system.rof[0].value=parseInt(item.system.rof[0].value);
                    if(isNaN(item.system.rof[0].value)){
                        item.system.rof[0].value="S";
                    }
                }

                if (actor.getFlag("fortyk", "filltheairwithdeath")) {
                    if (item.system.rof[1]?.value > 0) {
                        item.system.rof[1].value = parseInt(item.system.rof[1].value) + 1;
                        if(isNaN(item.system.rof[1].value)){
                            item.system.rof[1].value=0;
                        }
                    }
                    if (item.system.rof[2]?.value > 0) {
                        item.system.rof[2].value = parseInt(item.system.rof[2].value) + 1;
                        if(isNaN(item.system.rof[2].value)){
                            item.system.rof[2].value=0;
                        }
                    }
                }

                let ammo = actor.getEmbeddedDocument("Item", item.system.ammo._id);
                if (ammo) {
                    //this.applyActiveEffects(ammo);
                    item.system.ammo.name = ammo.name;
                }
                let ammos=actor.itemTypes.ammunition;
                let validAmmos=ammos.filter((ammo) => ammo.system.class.value===item.system.class.value&&ammo.system.type.value===item.system.type.value);
                item.validAmmos=validAmmos;
                if (ammo && !ammo.system.default.value) {

                    this.applyActiveEffects(ammo);
                    item.system.damageType.value = ammo.system.damageType.value;
                    item.system.range.value = ammo.system.range.formula;
                    item.system.range.formula = ammo.system.range.formula;
                    item.system.pen.value = ammo.system.pen.formula;
                    item.system.damageFormula.value = ammo.system.damageFormula.formula;
                    item.flags = ammo.flags;
                } else {
                    if (item.system.damTyp) {
                        item.system.damageType.value = item.system.damTyp;
                    } else {
                        item.system.damTyp = item.system.damageType.value;
                    }

                    item.system.range.value = item.system.range.formula.toString();
                    item.system.pen.value = item.system.pen.formula;
                    item.system.damageFormula.value = item.system.damageFormula.formula;
                }


                if (item.system.damTyp === undefined) {
                    item.system.damTyp = item.system.damageType.value;
                }

                item.system.testMod.value = parseInt(item.system.testMod.value);

                item.system.clip.max = item.system.clip.formula;

                if (actor.getFlag("fortyk", "dampeningarms") && item.system.path && item.system.path.includes("Arm")) {
                    item.system.attackMods.semi = parseInt(item.system.attackMods.semi) + 10;
                    item.system.attackMods.full = parseInt(item.system.attackMods.full) + 10;
                }
                if (actor.getFlag("fortyk", "purgationhelm")) {
                    item.system.attackMods.semi = parseInt(item.system.attackMods.semi) + 10;
                    item.system.attackMods.full = parseInt(item.system.attackMods.full) + 10;
                }
                if (actor.getFlag("fortyk", "lethalisarms") && item.system.path && item.system.path.includes("Arm")) {
                    item.system.attackMods.single = parseInt(item.system.attackMods.single) + 10;
                }
                if (this.getFlag("fortyk", "accurate")) {
                    item.system.attackMods.aim.half = 20;
                    item.system.attackMods.aim.full = 30;
                }
                /*
                *removed for new scatter bonus
                if(this.getFlag("fortyk","scatter")){
                    item.system.attackMods.range.pointblank=40;
                    item.system.attackMods.range.short=20;

                }
                */
                item.system.clip.consumption = item.system.clip.consumption;
                if (this.getFlag("fortyk", "twinlinked")) {
                    item.system.clip.consumption = item.system.clip.consumption * 2;
                }
                if (this.getFlag("fortyk", "storm")) {
                    item.system.clip.consumption = item.system.clip.consumption * 2;
                }
                if (this.getFlag("fortyk", "lasModal")) {
                    if (this.getFlag("fortyk", "lasMode") === 0) {
                    } else if (this.getFlag("fortyk", "lasMode") === 1) {
                        item.system.clip.consumption = 2;
                        item.system.damageFormula.value += "+1";
                    } else if (this.getFlag("fortyk", "lasMode") === 2) {
                        item.system.clip.consumption = 4;
                        item.system.damageFormula.value += "+2";
                        item.system.pen.value = parseInt(item.system.pen.formula) + 2;
                        item.flags.fortyk.reliable = false;
                        item.flags.fortyk.unreliable = true;
                    }
                }
                if (this.getFlag("fortyk", "maximalMode")) {
                    item.system.range.value = parseInt(item.system.range.formula) + 10;
                    let form = item.system.damageFormula.formula;
                    let dPos = form.indexOf("d");
                    let dieNum = form.substr(0, dPos);
                    let newNum = parseInt(dieNum) + 1;
                    item.system.damageFormula.value = form.slice(dPos);
                    item.system.damageFormula.value = newNum + item.system.damageFormula.value;
                    item.system.pen.value = parseInt(item.system.pen.formula) + 2;
                    item.system.clip.consumption = 3;
                }
            }

            if (actor.type !== "vehicle" && actor.type !== "knightHouse") {

                if(actor.getFlag("fortyk","iconofburningflame")&&item.system?.damageType?.value==="Energy"){
                    item.flags.fortyk.flame=true;
                }


                if(actor.getFlag("fortyk","purifyingflames")&&item.getFlag("fortyk","flame")){
                    item.flags.fortyk.flame=false;
                    item.flags.fortyk.purifyingflame=true;
                }
                if (item.type === "psychicPower") {
                    var psyniscience = 0;

                    try {
                        psyniscience = actor.system.skills.psyniscience;
                    } catch (err) {}

                    let pr = parseInt(item.system.curPR.value);
                    //iterate through item flags to evaluate PR strings
                    let flags = item.flags.fortyk;
                    for (const flag in flags) {
                        let fl = flags[flag];

                        if (typeof fl == "string") {
                            if (fl.toLowerCase().indexOf("pr") !== -1) {
                                try {
                                    flags[flag] = Math.ceil(math.evaluate(flags[flag],{pr:pr}));
                                } catch (err) {
                                    flags[flag] = 0;
                                }
                            }
                        }
                    }

                    if (this.getFlag("fortyk", "purifyingflame")) {
                        item.flags.fortyk.purifyingflame = `1d10+${pr}`;
                    }

                    if (data.psykana.psykerType.value.toLowerCase() === "navigator") {
                        let range = item.system.range.formula.toLowerCase();
                        let wp = data.characteristics.wp.bonus;
                        let per = data.characteristics.per.bonus;
                        let scope={per:per,wp:wp};
                        try {
                            item.system.range.value = Math.ceil(math.evaluate(range,scope));
                        } catch (err) {
                            item.system.range.value = 0;
                        }
                        try {
                            let penstr=item.system.pen.formula;
                            item.system.pen.value = Math.ceil(math.evaluate(penstr,scope));

                        } catch (err) {
                            item.system.pen.value = 0;
                        }

                        let training = 0;
                        switch (item.system.training.value) {
                            case "Novice":
                                training = 0;
                                break;
                            case "Adept":
                                training = 10;
                                break;
                            case "Master":
                                training = 20;
                                break;
                        }
                        let char = 0;
                        if (item.system.testChar.value === "psy") {
                            char = psyniscience;
                            item.system.testChar.type = "per";
                        } else {
                            char = parseInt(data.characteristics[item.system.testChar.value].total);
                            item.system.testChar.type = item.system.testChar.value;
                        }
                        let temp;
                        temp = item.system.damageFormula.formula.replace(/pr/gim, pr);
                        item.system.damageFormula.value = temp.replace(/wp/gim, wp);
                        item.system.target.value = char + training + parseInt(item.system.testMod.value);
                    } else {
                        try {

                            let range = item.system.range.formula.toLowerCase();


                            let wp = data.characteristics.wp.bonus;
                            let pr = parseInt(item.system.curPR.value); 
                            try {
                                item.system.range.value = Math.ceil(math.evaluate(range,{wp:wp,pr:pr}));
                            } catch (err) {
                                item.system.range.value = 0;
                            }
                            try {
                                let scope={wp:wp, pr:pr};
                                let penstr=item.system.pen.formula;
                                item.system.pen.value = Math.ceil(math.evaluate(penstr,scope));

                            } catch (err) {
                                item.system.pen.value = 0;
                            }

                            let temp;
                            temp = item.system.damageFormula.formula.replace(/pr/gim, pr);
                            item.system.damageFormula.value = temp.replace(/wp/gim, wp);
                            if (this.getFlag("fortyk", "tainted")) {
                                let corruptBonus = Math.floor(parseInt(actor.system.secChar.corruption.value) / 10);
                                let daemonic = parseFloat(actor.getFlag("fortyk", "daemonic"));
                                if (isNaN(daemonic)) {
                                    daemonic = 0;
                                }
                                var taintbonus = Math.max(corruptBonus, daemonic);
                                item.system.damageFormula.value += `+${taintbonus}`;
                            }
                        } catch (err) {
                            item.system.range.value = "";
                            item.system.pen.value = "";
                            item.system.damageFormula.value = "";
                        }
                        let derivedPR = Math.abs(
                            parseInt(data.psykana.pr.effective) - parseInt(item.system.curPR.value)
                        );
                        let char = 0;
                        if (item.system.testChar.value === "psy") {
                            char = psyniscience;
                            item.system.testChar.type = "per";
                        } else {
                            char = parseInt(data.characteristics[item.system.testChar.value].total);
                            item.system.testChar.type = item.system.testChar.value;
                        }
                        item.system.target.value =
                            parseInt(char) +
                            derivedPR * 10 +
                            parseInt(item.system.testMod.value) +
                            parseInt(data.psykana.mod.value);
                    }
                }

                if (item.type === "meleeWeapon") {
                    //ensure that a weapon that is not a shield does not have an armor rating
                    if (item.system.class.value !== "Shield" && item.system.shield.value !== 0) {
                        item.system.shield.value = 0;
                    }
                    if(this.getFlag("fortyk", "nosb")){    
                    }else if (this.getFlag("fortyk", "crushing")) {
                        item.system.damageFormula.value += "+" + 2 * data.characteristics.s.bonus;
                    } else if (this.getFlag("fortyk", "heavy")) {
                        item.system.damageFormula.value += "+" + 3 * data.characteristics.s.bonus;
                    } else {
                        item.system.damageFormula.value += "+" + data.characteristics.s.bonus;
                    }
                    if (actor.getFlag("fortyk", "crushingblow")) {
                        item.system.damageFormula.value += "+" + Math.ceil(data.characteristics.ws.bonus / 2);
                    }
                    if (actor.getFlag("fortyk", "meleedamagebonus")) {
                        item.system.damageFormula.value += "+" + parseInt(actor.getFlag("fortyk", "meleedamagebonus"));
                    }
                    let wp = data.characteristics.wp.bonus;
                    item.system.damageFormula.value = item.system.damageFormula.value.replace("wp", wp);
                    let sb = data.characteristics.s.bonus;
                    item.system.damageFormula.value = item.system.damageFormula.value.replace("sb", sb);
                    if (item.getFlag("fortyk", "heavy")) {
                        item.system.twohanded.value = true;
                    } else if (!actor.getFlag("fortyk", "irongrip")) {
                        if (item.system.class.value === "Melee Two-handed") {
                            item.system.twohanded.value = true;
                        } else {
                            item.system.twohanded.value = false;
                        }
                    } else {
                        item.system.twohanded.value = false;
                    }
                }

                if (item.type === "rangedWeapon") {
                    if (typeof item.system.range.formula === "string" || item.system.range.formula instanceof String) {
                        let sb = data.characteristics.s.bonus;
                        let formula = item.system.range.formula.toLowerCase();

                        try {
                            item.system.range.value = math.evaluate(formula,{sb:sb});
                        } catch (err) {
                            item.system.range.value = 0;
                        }
                    }
                    item.system.range.value = Math.ceil(item.system.range.value*item.system.range.multi);
                    if (actor.getFlag("fortyk", "mightyshot")) {
                        item.system.damageFormula.value += "+" + Math.ceil(data.characteristics.bs.bonus / 2);
                    }
                    let wp = data.characteristics.wp.bonus;
                    item.system.damageFormula.value = item.system.damageFormula.value.replace("wp", wp);

                    if (!actor.getFlag("fortyk", "irongrip")) {
                        if (
                            (actor.getFlag("fortyk", "firmgrip") && item.system.class.value !== "Heavy") ||
                            item.system.class.value === "Pistol" ||
                            item.system.class.value === "Thrown"
                        ) {
                            item.system.twohanded.value = false;
                        } else {
                            item.system.twohanded.value = true;
                        }
                    } else {
                        item.system.twohanded.value = false;
                    }
                }
                if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
                    if (actor.getFlag("fortyk", "WeaponMaster")) {
                        if (
                            actor
                            .getFlag("fortyk", "WeaponMaster")
                            .toLowerCase()
                            .includes(item.system.type.value.toLowerCase())
                        ) {
                            item.system.damageFormula.value += "+2";
                            item.system.testMod.value += 10;
                        }
                    }
                    //tainted weapon logic
                    if (this.getFlag("fortyk", "tainted")) {
                        let corruptBonus = Math.floor(parseInt(actor.system.secChar.corruption.value) / 10);
                        let daemonic = parseFloat(actor.getFlag("fortyk", "daemonic"));
                        if (isNaN(daemonic)) {
                            daemonic = 0;
                        }
                        var taintbonus = Math.max(corruptBonus, daemonic);
                        item.system.damageFormula.value += `+${taintbonus}`;
                    }
                    //horde logic
                    if (actor.system.horde.value) {
                        let hordeDmgBonus = Math.min(2, Math.floor(actor.system.secChar.wounds.value / 10));
                        if (
                            actor.getFlag("fortyk", "overwhelming") &&
                            item.type === "meleeWeapon" &&
                            actor.system.secChar.wounds.value >= 20
                        ) {
                            hordeDmgBonus += 1;
                        }
                        let form = item.system.damageFormula.value;
                        let dPos = form.indexOf("d");
                        let dieNum = form.substr(0, dPos);
                        let newNum = parseInt(dieNum) + hordeDmgBonus;
                        form = form.slice(dPos);
                        form = newNum + form;
                        item.system.damageFormula.value = form;
                    }

                    try {
                        let pr = parseInt(data.psykana.pr.value);
                        if (this.getFlag("fortyk", "force")) {
                            item.system.pen.value = parseInt(item.system.pen.value) + pr;
                            item.system.damageFormula.value += `+${pr}`;
                            if(actor.getFlag("fortyk","psy-weaponattunement")){
                                item.flags.fortyk.proven=pr;
                            }
                        }
                        if (this.getFlag("fortyk", "purifyingflame")) {
                            item.flags.fortyk.purifyingflame = `1d10+${pr}`;
                        }
                    } catch (err) {
                        item.system.pen.value = "";
                        item.system.damageFormula.value = "";
                    }
                }
            } else if (actor.type === "vehicle") {
                if (item.type === "meleeWeapon") {
                    if (actor.getFlag("fortyk", "meleedamagebonus")) {
                        item.system.damageFormula.value += `+${actor.getFlag("fortyk", "meleedamagebonus")}`;
                    }
                    if (actor.getFlag("fortyk", "crushingblow")) {
                        let bonus = Math.ceil(data.crew.ws / 20);
                        if (actor.getFlag("fortyk", "terribleoffensive")) {
                            bonus = bonus * 3;
                        }
                        item.system.damageFormula.value += "+" + bonus;
                    }
                } else if (item.type === "rangedWeapon") {
                    if (actor.getFlag("fortyk", "rangedWeaponBonus")) {
                        item.system.damageFormula.value += `+${actor.getFlag("fortyk", "rangedWeaponBonus")}`;
                    }
                    if (actor.getFlag("fortyk", "mightyshot")) {
                        let bonus = Math.ceil(data.crew.bs / 20);
                        if (actor.getFlag("fortyk", "terribleoffensive")) {
                            bonus = bonus * 3;
                        }
                        item.system.damageFormula.value += "+" + bonus;
                    }
                }
            }

            item.system.isPrepared = true;
        }
    }

    applyActiveEffects(item=this) {

        let itemData = item;
        let data = this.system;
        let actor=this.actor;
        let pr;
        if(actor.getFlag("fortyk","psyrating")){
            pr=actor.system.psykana.pr.value+actor.system.psykana.pr.bonus-Math.max(0,actor.system.psykana.pr.sustain-1);
        }

        let chars=actor.system.characteristics;
        let scope={
            pr:pr,
            felB:chars?.fel?.bonus

        };
        this.effects.forEach(function (ae, id) {
            if (!ae.disabled && !ae.transfer) {
                //if item is equipped and/or not disabled
                let proceed=false;
                let equipped=item.system.isEquipped;
                if(equipped===undefined){
                    proceed=true;
                }else if(equipped){
                    if(item.system.state){
                        let state=item.system.state.value;
                        if(state!=="0"&&state!=="X"&&state!=="D"){
                            proceed=true; 
                        }
                    }else{
                        proceed=true;
                    }
                }else{
                    proceed=false;
                }
                if(!proceed)return;
                ae.changes.forEach(function (change, i) {
                    let path = change.key.split(".");
                    if(change.mode===CONST.ACTIVE_EFFECT_MODES.CUSTOM){
                        if(typeof change.value==="string"){
                            if(change.value.toLowerCase()==="true"){
                                return setNestedKey(itemData,path,true); 
                            }else if(change.value.toLowerCase()==="false"){
                                return setNestedKey(itemData,path,false); 
                            }
                        }
                    }

                    if(actor.getFlag("fortyk","psyrating")){

                        try{

                            let value=math.evaluate(change.value,scope);

                            if(!Number.isNaN(value)){
                                change.value=value;
                            }

                        }catch (err){
                            //console.log(err,item);

                        }
                    }
                    let basevalue = Number(objectByString(itemData, change.key));
                    let isNumber=true;
                    if(Number.isNaN(basevalue)){
                        basevalue = objectByString(itemData, change.key);
                        isNumber=false;
                    }
                    let newvalue;
                    if(isNumber){
                        newvalue = parseFloat(change.value);
                    }else{
                        newvalue = change.value;
                    }

                    
                    /*if(newvalue>=0){
                            newvalue=Math.ceil(newvalue);
                        }else{
                            newvalue=Math.floor(newvalue);
                        }*/
                    if (!isNumber||(!Number.isNaN(basevalue) && !Number.isNaN(newvalue))) {
                        let changedValue = 0;
                        if (change.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY) {
                            changedValue = basevalue * newvalue;
                            setNestedKey(itemData, path, changedValue);
                        } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.ADD) {
                            changedValue = basevalue + newvalue;
                            setNestedKey(itemData, path, changedValue);
                        } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE) {
                            if (change.value < basevalue) {
                                changedValue = newvalue;
                                setNestedKey(itemData, path, changedValue);
                            }
                        } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE) {
                            if (change.value > basevalue) {
                                changedValue = newvalue;
                                setNestedKey(itemData, path, changedValue);
                            }
                        } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE) {
                            setNestedKey(itemData, path, newvalue);
                        } else if (change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM) {
                            setNestedKey(itemData, path, change.value);
                        }
                    } else {
                        if (change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM) {
                            setNestedKey(itemData, path, change.value);
                        }
                    }
                });
            }
        });
    }
    getModCount(){
        let effects=this.effects;
        let count=0;
        for(const effect of effects){
            if(effect.getFlag("fortyk","mod")){
                count++;
            }
        }
        return count;
    }
    static async applyPsyBuffs(actorId, powerId, targetIds) {
        if (game.user.isGM) {
            let actor = await fromUuid(actorId);
            let power = actor.getEmbeddedDocument("Item", powerId);
            let targets = game.canvas.tokens.children[0].children.filter((token) => targetIds.includes(token.id));

            let ae = power.effects.entries().next().value[1];
            let aeData = foundry.utils.duplicate(ae);


            aeData.name = ae.name + " Buff";
            let actorPR = actor.system.psykana.pr.effective;
            let powerPR = power.system.curPR.value;
            let adjustment = actorPR - powerPR;

            aeData.flags = { fortyk: { adjustment: adjustment, psy: true } };
            aeData.disabled = false;
            aeData.origin = actorId;
            aeData.statuses = [ae.name];
            let felB=actor.system.characteristics.fel.bonus;
            for(const change of aeData.changes){
                change.value=change.value.replace("felB",felB);
            }
            let effectUuIds = [];
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i];

                let targetActor = target.actor;
                let effect = await targetActor.createEmbeddedDocuments("ActiveEffect", [aeData]);

                let ae = effect[0];
                let effectuuid = await ae.uuid;

                effectUuIds.push(effectuuid);
            }


            if (power.system.sustain.value !== "No") {
                await power.setFlag("fortyk", "sustained", effectUuIds);
                let sustained = actor.system.psykana.pr.sustained;
                sustained.push(power.id);
                actor.update({ "system.psykana.pr.sustained": sustained });
            }
        } else {
            //if user isnt GM use socket to have gm apply the buffs/debuffs

            let socketOp = { type: "psyBuff", package: { actorId: actorId, powerId: powerId, targetIds: targetIds } };
            await game.socket.emit("system.fortyk", socketOp);
        }
    }
    static async cancelPsyBuffs(actorId, powerId) {
        if (game.user.isGM) {
            let power = await fromUuid(powerId);
            let buffs = power.getFlag("fortyk", "sustained");
            for (let i = 0; i < buffs.length; i++) {
                let buffId = buffs[i];
                let buff = await fromUuid(buffId);
                try {
                    await buff.delete();
                } catch (err) {}
            }
            await power.setFlag("fortyk", "sustained", false);
            let actor = await fromUuid(actorId);
            let sustained = actor.system.psykana.pr.sustained;
            let powerIndex = sustained.indexOf(power.id);
            sustained.splice(powerIndex, 1);
            actor.update({ "system.psykana.pr.sustained": sustained });
            if(power.getFlag("fortyk","initmods")){
                let combat=game.combats.active;
                let inits=power.getFlag("fortyk","initmods");
                for(const init of inits){
                    await combat.setInitiative(init.id,init.init);
                }
                await power.setFlag("fortyk","initmods",false);
            }
        } else {
            //if user isnt GM use socket to have gm cancel the buffs/debuffs

            let socketOp = { type: "cancelPsyBuff", package: { actorId: actorId, powerId: powerId } };
            await game.socket.emit("system.fortyk", socketOp);
        }
    }
    static async executePsyMacro(powerId, macroId, actorId, targets) {
        let actor = fromUuidSync(actorId);
        let power = actor.getEmbeddedDocument("Item", powerId);
        let macroCompendium = await game.packs.get("fortyk.fortykmacros");
        let macro = await macroCompendium.getDocument(macroId);
        macro.execute({ actor: actor, power: power, targets: targets });
    }
    timeString(time, timeLabel) {
        let calendar = SimpleCalendar.api.getCurrentCalendar().id;
        let timeInterval = SimpleCalendar.api.secondsToInterval(time, calendar);
        //Returns {year: 0, month: 0, day: 0, hour: 1, minute: 0, seconds: 0}
        if (timeInterval.year) {
            timeLabel += `${timeInterval.year} year`;
            if (timeInterval.year > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        if (timeInterval.month) {
            timeLabel += `${timeInterval.month} month`;
            if (timeInterval.month > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        if (timeInterval.day) {
            timeLabel += `${timeInterval.day} day`;
            if (timeInterval.day > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        if (timeInterval.hour) {
            timeLabel += `${timeInterval.hour} hour`;
            if (timeInterval.hour > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        if (timeInterval.minute) {
            timeLabel += `${timeInterval.minute} minute`;
            if (timeInterval.minute > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        if (timeInterval.second) {
            timeLabel += `${timeInterval.second} second`;
            if (timeInterval.second > 1) {
                timeLabel += "s ";
            } else {
                timeLabel += " ";
            }
        }
        return timeLabel;
    }
}
