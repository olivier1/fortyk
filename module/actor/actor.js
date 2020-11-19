import {getSkills} from "../utilities.js";
import {isEmpty} from "../utilities.js";
import {FORTYKTABLES} from "../FortykTables.js";
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class FortyKActor extends Actor {
    //@Override the create function to add starting skills to a character
    static async create(data, options) {
        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (data.items)
        {
            return super.create(data, options);
        }
        data.items = [];
        //initialise starting skills
        let startingSkills= await getSkills();
        if (data.type !=="npc" && data.type!=="owComrade" && data.type!=="owRegiment"){
            for(let s of startingSkills){
                data.items.push(s);
            }
        }
        //resume actor creation
        super.create(data, options);
    }
    //@Override the update function to modify token size for hordes and larger entities
    async update(data, options={}) {
        let actor=this;
        let actorData=actor.data;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC' || actorData.type === 'npc'){
            //check for fatigue unconsciousness/death
            let newFatigue=data["data.secChar.fatigue.value"];
            if(newFatigue){
                if(newFatigue>=this.data.data.secChar.fatigue.max*2){
                    let token=null;
                    if(this.isToken){
                        token=this.token;
                    }else{
                        token=this.getActiveTokens()[0]
                    }
                    let chatDead={user: game.user._id,
                                  speaker:{actor,alias:actor.name},
                                  content:`${actor.name} dies from fatigue!`,
                                  classes:["fortyk"],
                                  flavor:`Fatigue death`,
                                  author:actor.name};
                    await ChatMessage.create(chatDead,{});
                    await game.fortyk.FortykRolls.applyDead(token,this);
                }else if(!this.getFlag("core","frenzy")&&!this.getFlag("core","unconscious")&&newFatigue>=this.data.data.secChar.fatigue.max){
                    let effect=[];
                    effect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
                    let chatUnconscious={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:`${actor.name} falls unconscious from fatigue!`,
                                         classes:["fortyk"],
                                         flavor:`Fatigue pass out`,
                                         author:actor.name};
                    await ChatMessage.create(chatUnconscious,{});
                    await game.fortyk.FortykRolls.applyActiveEffect(token,effect);
                }
            }
            // Apply changes in Actor size to Token width/height
            let newSize= 0;
            if(this.data.data.horde.value){
                newSize= data["data.secChar.wounds.value"];
                if(newSize<0){newSize=0}
            }else{
                newSize= data["data.secChar.size.value"];
            }
            if ( (!this.data.data.horde.value&&newSize && (newSize !== this.data.data.secChar.size.value))||(this.data.data.horde.value&&newSize!==undefined && (newSize !== this.data.data.secChar.wounds.value)) ) {
                let size= 0;
                if(this.data.data.horde.value){
                    size= FORTYKTABLES.hordeSizes[newSize];
                }else{
                    size= game.fortyk.FORTYK.size[newSize].size;
                }
                if ( this.isToken ) this.token.update({height: size, width: size});
                else if ( !data["token.width"] && !hasProperty(data, "token.width") ) {
                    data["token.height"] = size;
                    data["token.width"] = size;
                }
            }
        }
        return super.update(data, options);
    }
    /**
   * Augment the basic actor data with additional dynamic data.
   */
    prepareData(){
        this.data = duplicate(this._data);
        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
        if ( !this.data.name ) this.data.name = "New " + this.entity;
        this.prepareBaseData();
        this.prepareEmbeddedEntities();
        this.applyActiveEffects();
        this.prepareDerivedData();
    }
    prepareBaseData(){

        let actorData=this.data;
        if(actorData.flags.fortyk===undefined){actorData.flags.fortyk={}}
        const data = actorData.data;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC' || actorData.type === 'npc'){
            this._prepareCharacterBaseData(data);
        }
    }
    _prepareCharacterBaseData(data){
        if(this.getFlag("fortyk","marksman")){
            data.secChar.attacks.range.long=0;
            data.secChar.attacks.range.extreme=0;
        }
        if(this.getFlag("fortyk","precisionkiller")){
            data.secChar.attacks.called=0
        }
    }
    prepareEmbeddedEntities(){
        super.prepareEmbeddedEntities();
        let items=this.data.items;
        for(let item of items){
            if(item.type==="cybernetic"){
                this.data.data.characterHitLocations[item.data.location.value].cyber=true;

            }
        }
    }

    prepareDerivedData() {

        const actorData = this.data;
        const data = actorData.data;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC') {this._prepareCharacterData(actorData)};
        if (actorData.type === 'npc') {this._prepareNPCData(actorData)};
        if (actorData.type === 'owRegiment'){this._prepareRegimentData(actorData)};
    }
    _prepareRegimentData(actorData){
        const data=actorData.data;
        data.characteristics.inf.total=parseInt(data.characteristics.inf.value)+parseInt(data.characteristics.inf.not)+parseInt(data.characteristics.inf.time)+parseInt(data.characteristics.inf.frontActive)+parseInt(data.characteristics.inf.war)+parseInt(data.characteristics.inf.mod);
    }
    /**
   * Prepare Character type specific data
   * this only has light computation other more complex data that process items see prepare()
   */
    _prepareCharacterData(actorData) {
        const data = actorData.data;
        //prepare characteristics data
        for (let [key, char] of Object.entries(data.characteristics)){
            if(key==="inf"){
            }else{
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod);
                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);  
                char.total+=parseInt(data.globalMOD.value);
            }
        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        if(this.getFlag("fortyk","neverquit")){
            data.secChar.fatigue.max+=2;
        }
        //modify total characteristics depending on fatigue
        var fatigueMult=1;
        if(this.getFlag("fortyk","unrelenting")){
            fatigueMult=2;
        }
        if(!this.getFlag("core","frenzy")){
            for (let [key,char] of Object.entries(data.characteristics)){
                if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                    char.total=Math.ceil(char.total/2);
                }
            }  
        }


        //prepare psyker stuff
        data.psykana.pr.effective=parseInt(data.psykana.pr.value)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(game.fortyk.FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        //movement
        let size=data.secChar.size.value;
        data.secChar.size.label=game.fortyk.FORTYK.size[size].name;
        data.secChar.size.mod=game.fortyk.FORTYK.size[size].mod;
        data.secChar.size.movement=game.fortyk.FORTYK.size[size].movement;
        data.secChar.size.stealth=game.fortyk.FORTYK.size[size].stealth
        //movement
        data.secChar.movement.half=Math.max(Math.ceil((data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod)*parseInt(data.secChar.movement.multi)),1);
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;
        //add up all armor and stuff
        var armor= this.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.armor._id);
        var rightHandWeapon= this.getOwnedItem(data.secChar.wornGear.weapons[1]);
        let rightHandWeaponData=null;
        if(rightHandWeapon){
            rightHandWeaponData=rightHandWeapon.data;
        }
        var leftHandWeapon= this.getOwnedItem(data.secChar.wornGear.weapons[0]);
        let leftHandWeaponData=null;
        if(leftHandWeapon){
            leftHandWeaponData=leftHandWeapon.data;
        }
        let parry=false;
        if((rightHandWeapon!==null&&rightHandWeapon.getFlag("fortyk","balanced"))||(leftHandWeapon!==null&&leftHandWeapon.getFlag("fortyk","balanced"))){
            parry=10;
        }
        if((rightHandWeapon!==null&&rightHandWeapon.getFlag("fortyk","defensive"))||(leftHandWeapon!==null&&leftHandWeapon.getFlag("fortyk","defensive"))){
            parry=15;
        }

        actorData.flags.fortyk.parry=parry;

        //handle shields
        data.characterHitLocations.body.shield= 0;
        data.characterHitLocations.rArm.shield= 0;
        data.characterHitLocations.lArm.shield= 0;
        if(rightHandWeaponData!==null&&rightHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.rArm.shield= parseInt(rightHandWeaponData.data.shield.value);
            data.characterHitLocations.body.shield= parseInt(rightHandWeaponData.data.shield.value);
        }
        if(leftHandWeaponData!==null&&leftHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.lArm.shield= parseInt(leftHandWeaponData.data.shield.value);
            data.characterHitLocations.body.shield= parseInt(leftHandWeaponData.data.shield.value);
        }
        //compute rest of armor and absorption
        for(let [key, hitLoc] of Object.entries(data.characterHitLocations)){
            hitLoc.armor=0;
            if(armor!==null){
                hitLoc.armor=hitLoc.armor+parseInt(armor.data.ap[key].value);
            }
            hitLoc.armor=hitLoc.armor+hitLoc.shield;
            if(hitLoc.cyber){
                hitLoc.armor=hitLoc.armor+2;
            }
            hitLoc.value=hitLoc.armor+data.characteristics.t.bonus;
            let daemonic=this.getFlag("fortyk","daemonic");
            if(daemonic){
                if(!isNaN(daemonic)){
                    hitLoc.value+=parseInt(daemonic);
                }
            }
        }
    }
    _prepareNPCData(actorData){
        const data=actorData.data;
        //calc char bonuses
        for (let [key, char] of Object.entries(data.characteristics)){
            if(key==="inf"){
            }else{
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod)+parseInt(data.globalMOD.value);
                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);  
            }
        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        //modify total characteristics depending on fatigue
        var fatigueMult=1;
        for (let [key,char] of Object.entries(data.characteristics)){
            if(!this.getFlag("core","frenzy")&&char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.value/2);
            }else{
                char.total=char.value;
            }
        }
        //movement
        let size=data.secChar.size.value;
        data.secChar.size.label=game.fortyk.FORTYK.size[size].name;
        data.secChar.size.mod=game.fortyk.FORTYK.size[size].mod;
        data.secChar.size.movement=game.fortyk.FORTYK.size[size].movement;
        data.secChar.size.stealth=game.fortyk.FORTYK.size[size].stealth
        //movement
        data.secChar.movement.half=Math.max(Math.ceil((data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod)*parseInt(data.secChar.movement.multi)),1);
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;
        //total soak
        for(const hitLoc in data.characterHitLocations){
            data.characterHitLocations[hitLoc].value=parseInt(data.characterHitLocations[hitLoc].armor)+parseInt(data.characteristics.t.bonus);
            let daemonic=this.getFlag("fortyk","daemonic");
            if(daemonic){
                if(!isNaN(daemonic)){
                    data.characterHitLocations[hitLoc].value+=parseInt(daemonic);
                }
            }
        }
    }
    prepare(){
        let preparedData = this.data
        // Call prepareItems first to organize and process OwnedItems
        if(preparedData.type==='dwPC'||preparedData.type==='dhPC'||preparedData.type==='owPC'){
            mergeObject(preparedData, this.preparePCItems(preparedData));
        }
        if(preparedData.type==='npc'){
            mergeObject(preparedData, this.prepareNPCItems(preparedData));
        }
        return preparedData;
    }
    //this prepares all items into containers that can be easily accessed by the html sheets, also adds in logic for sorting and all computing logic for items
    preparePCItems(actorData){
        let data=actorData.data;
        const skills=[];
        const wargear=[];
        const cybernetics=[];
        const forceFields=[];
        const mods=[];
        const consummables=[];
        const psychicPowers=[];
        const mutations=[];
        const injuries=[];
        const malignancies=[];
        const disorders=[];
        const talentsntraits=[];
        const missions=[];
        const advancements=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const armors=[];
        const ammunitions=[];
        const equippableAmmo=[];
        const wornGear={weapons:[],"armor":"","forceField":""};
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        data.experience.earned=0;
        data.characteristics["inf"].advance=0;
        data.experience.spent=0;
        data.carry.value=0;
        let unrelenting=false;
        let forRaces=[];
        //get worn weapon ids into an array so that they can be accessed by the sheet easily
        let wornWeapons=data.secChar.wornGear.weapons;
        if(!Array.isArray(data.secChar.wornGear.weapons)){
            wornWeapons=Object.values(data.secChar.wornGear.weapons);
        }

        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;
            if(item._id===data.secChar.wornGear.armor._id){
                wornGear["armor"]=item;
            }
            if(item._id===data.secChar.wornGear.forceField._id){
                wornGear["forceField"]=item;
            }
            if(item.type=="skill"){
                
                    if(this.getFlag("fortyk",item.name.toLowerCase())){
                        item.data.mod.value=parseInt(item.data.mod.value)+this.getFlag("fortyk",item.name.toLowerCase());
                    }
                
                if(item.data.parent.value==="Forbidden Lore"){
                    if(game.fortyk.FORTYK.races.includes(item.name)){
                        forRaces.push(item.name);
                    }
                } item.data.total.value=parseInt(item.data.value)+parseInt(item.data.mod.value)+parseInt(data.characteristics[item.data.characteristic.value].total);
                skills.push(item);
            }
            if(item.type==="malignancy"){
                malignancies.push(item);
            }
            if(item.type==="injury"){
                injuries.push(item);
            }
            if(item.type==="mutation"){
                mutations.push(item);
            }
            if(item.type==="disorder"){
                disorders.push(item);
            }
            if(item.type==="wargear"){
                wargear.push(item);
            }
            if(item.type==="cybernetic"){

                cybernetics.push(item);
            }
            if(item.type==="forceField"){
                forceFields.push(item);
                wargear.push(item);
            }
            if(item.type==="mod"){
                mods.push(item);
            }
            if(item.type==="consummable"){
                consummables.push(item);
                wargear.push(item);
            }
            if(item.type==="psychicPower"){
                try{
                    let pr=parseInt(item.data.curPR.value);
                    let range=item.data.range.formula.toLowerCase();
                    let wp=data.characteristics.wp.bonus;
                    item.data.range.value=eval(range);
                    item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                    let temp;
                    temp=item.data.damageFormula.formula.replace(/pr/gmi,pr);
                    item.data.damageFormula.value=temp.replace(/wp/gmi,wp);
                }catch(err){
                    item.data.range.value="";
                    item.data.pen.value="";
                    item.data.damageFormula.value=="";
                }
                let derivedPR=Math.abs(parseInt(actorData.data.psykana.pr.effective)-parseInt(item.data.curPR.value));
                let char=0;
                if(item.data.testChar.value==="psy"){
                    char=getItem(this,"Psyniscience").data.total.value;
                    data.testChar.type="per";
                }else{
                    char=parseInt(actorData.data.characteristics[item.data.testChar.value].total);
                    item.data.testChar.type=item.data.testChar.value;
                }
                item.data.target.value=parseInt(char)+(derivedPR*10)+parseInt(item.data.testMod.value)+parseInt(actorData.data.psykana.mod.value);
                psychicPowers.push(item);
            }
            if(item.type==="talentntrait"){

                talentsntraits.push(item);
            }
            if(item.type==="mission"){
                //adds up earned exp and influence
                data.experience.earned=parseInt(data.experience.earned)+parseInt(item.data.exp.value);
                data.characteristics["inf"].advance= parseInt(data.characteristics["inf"].advance)+parseInt(item.data.inf.value);
                missions.push(item);
            }
            if(item.type==="advancement"){
                //calculates spent exp
                data.experience.spent=parseInt(data.experience.spent)+parseInt(item.data.cost.value);
                advancements.push(item);
            }
            if(item.type==="meleeWeapon"){
                if(item.data.class.value==="Melee Two-handed"){
                    item.data.twohanded.value=true;
                }else{
                    item.data.twohanded.value=false;
                }
                if(fortykItem.getFlag("fortyk","crushing")){
                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+2*data.characteristics.s.bonus;
                }else{
                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+data.characteristics.s.bonus;
                }
                if(this.getFlag("fortyk","crushingblow")){
                    item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.ws.bonus/2);
                }
                meleeweapons.push(item);
                wargear.push(item);
            }
            if(item.type==="rangedWeapon"){
                try
                {
                    let sb=data.characteristics.s.bonus;
                    let formula=item.data.range.formula.toLowerCase();
                    item.data.range.value=eval(formula);
                } 
                catch(err){
                    item.data.range.value="";
                } 
                if(item.data.class.value==="Pistol"||item.data.class.value==="Thrown"){

                    item.data.twohanded.value=false;

                }else{
                    item.data.twohanded.value=true;
                }
                if(this.getFlag("fortyk","mightyshot")){
                    item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.bs.bonus/2);
                }
                rangedWeapons.push(item);
                wargear.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                for( let w of wornWeapons){
                    if(w===item._id){
                        wornGear.weapons.push(item);
                    }
                }
                try{
                    if(fortykItem.getFlag("fortyk","force")){
                        let pr=parseInt(data.psykana.pr.value);
                        item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                        item.data.damageFormula.value=item.data.damageFormula.value.replace(/pr/gmi,pr);
                    }
                }catch(err){
                    item.data.pen.value="";
                    item.data.damageFormula.value="";
                }
            }
            if(item.type==="armor"){
                armors.push(item);
                wargear.push(item);
            }
            if(item.type==="ammunition"){
                ammunitions.push(item);
                wargear.push(item);
                if(item.data.amount.value>=0){
                    equippableAmmo.push(item);
                }
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                //total weight calcs
                item.data.weight.total=(parseInt(item.data.amount.value)*parseFloat(item.data.weight.value)).toFixed(2);
                data.carry.value=(parseFloat(data.carry.value)+parseFloat(item.data.weight.total)).toFixed(2);
            }
        })

        //store known xenos for deathwatchtraining
        if(this.getFlag("fortyk","deathwatchtraining")){
            actorData.flags.fortyk.deathwatchtraining=forRaces;
        }
        //compile total exp and influence
        data.characteristics["inf"].total=data.characteristics["inf"].value+data.characteristics["inf"].advance;
        data.experience.value=parseInt(data.experience.starting)+parseInt(data.experience.earned)-parseInt(data.experience.spent);
        //get max carry weight ensure it is not out of bounds
        if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)>19){
            data.carry.max=game.fortyk.FORTYK.carry[19].carry+data.carry.mod;
        }else if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)<=19){
            data.carry.max=game.fortyk.FORTYK.carry[(data.characteristics["s"].bonus+data.characteristics["t"].bonus)].carry+data.carry.mod;
        }else{
            data.carry.max=game.fortyk.FORTYK.carry[1].carry+data.carry.mod;
        }

        let sortedSkills=skills.sort(function compare(a, b) {
            if (a.name<b.name) {
                return -1;
            }
            if (a.name>b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let preparedItems={skills:sortedSkills,
                           wargear:wargear,
                           cybernetics:cybernetics,
                           forceFields:forceFields,
                           mods:mods,
                           consummables:consummables,
                           psychicPowers:psychicPowers,
                           mutations:mutations,
                           malignancies:malignancies,
                           injuries:injuries,
                           disorders:disorders,
                           talentsntraits:talentsntraits,
                           missions:missions,
                           advancements:advancements,
                           meleeWeapons:meleeweapons,
                           rangedWeapons:rangedWeapons,
                           armors:armors,
                           ammunitions:ammunitions,
                           equippableAmmo:equippableAmmo,
                           wornGear:wornGear};
        return preparedItems;
    }
    prepareNPCItems(actorData){
        let data=actorData.data;           
        const psychicPowers=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const talentsntraits=[];
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;
            if(item.type==="talentntrait"){

                talentsntraits.push(item);
            }
            if(item.type==="psychicPower"){
                try{
                    let pr=parseInt(item.data.curPR.value);
                    let range=item.data.range.formula.toLowerCase();
                    item.data.range.value=eval(range);
                    item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                    item.data.damageFormula.value=item.data.damageFormula.formula.replace(/pr/gmi,pr);
                }catch(err){
                    item.data.range.value="";
                    item.data.pen.value="";
                    item.data.damageFormula.value=="";
                }
                let derivedPR=Math.abs(parseInt(actorData.data.psykana.pr.effective)-parseInt(item.data.curPR.value));
                let char=0;
                if(item.data.testChar.value==="psy"){
                    char=getItem(this,"Psyniscience").data.total.value;
                    item.data.testChar.type="per";
                }else{
                    char=parseInt(actorData.data.characteristics[item.data.testChar.value].total);
                    item.data.testChar.type=item.data.testChar.value;
                }
                item.data.target.value=parseInt(char)+(derivedPR*10)+parseInt(item.data.testMod.value)+parseInt(actorData.data.psykana.mod.value);
                psychicPowers.push(item);
            }
            if(item.type==="meleeWeapon"){
                if(fortykItem.getFlag("fortyk","crushing")){
                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+2*data.characteristics.s.bonus;
                }else{
                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+data.characteristics.s.bonus;
                }
                if(this.getFlag("fortyk","crushingblow")){
                    item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.ws.bonus/2);
                }
                meleeweapons.push(item);
            }
            if(item.type==="rangedWeapon"){
                try
                {
                    let sb=data.characteristics.s.bonus;
                    let formula=item.data.range.formula.toLowerCase();
                    item.data.range.value=eval(formula);
                } 
                catch(err){
                    item.data.range.value="";
                } 
                if(this.getFlag("fortyk","mightyshot")){
                    item.data.damageFormula.value+="+"+Math.ceil(data.characteristics.bs.bonus/2);
                }
                rangedWeapons.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                try{
                    if(fortykItem.getFlag("fortyk","force")){
                        let pr=parseInt(data.psykana.pr.value);
                        item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                        item.data.damageFormula.value=item.data.damageFormula.value.replace(/pr/gmi,pr);
                    }
                }catch(err){
                    item.data.pen.value="";
                    item.data.damageFormula.value="";
                }
            }
        })
        let preparedItems={
            psychicPowers:psychicPowers,
            meleeWeapons:meleeweapons,
            rangedWeapons:rangedWeapons,
            talentsntraits:talentsntraits
        };
        return preparedItems;
    }
    //this function deletes items from an actor, certain items need more logic to process
    deleteItem(itemId){
        let item=this.getEmbeddedEntity("OwnedItem",itemId);
        //iterate through skills to delete all the children of a group skill
        if(item.type==="skill"&&item.data.hasChildren){
            let skills=this.items.filter(function(item){return item.type==="skill"});
            for(let s of skills){                
                if(s.data.data.parent.value===item.name){
                    this.deleteEmbeddedEntity("OwnedItem",s._id);
                }
            }
        }
        this.deleteEmbeddedEntity("OwnedItem", itemId);
    }
}