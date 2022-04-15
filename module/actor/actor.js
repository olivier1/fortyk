import {getSkills} from "../utilities.js";
import {isEmpty} from "../utilities.js";
import {FORTYKTABLES} from "../FortykTables.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
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
        if (data.type !=="npc" && data.type!=="owComrade" && data.type!=="owRegiment" && data.type!=="spaceship"){
            for(let s of startingSkills){
                data.items.push(s);
            }
        }
        if (data.type !=="npc" && data.type!=="owComrade" && data.type!=="owRegiment" && data.type!=="spaceship"){
            // Set wounds, fatigue, and display name visibility
            mergeObject(data,
                        {"token.bar1" :{"attribute" : "secChar.wounds"},                 // Default Bar 1 to Wounds
                         "token.bar2" :{"attribute" : "secChar.fatigue"},               // Default Bar 2 to Fatigue
                         "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display name to be on owner hover
                         "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display bars to be always on
                         "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
                         "token.name" : data.name                                       // Set token name to actor name
                        })
            // Default characters to HasVision = true and Link Data = true
            if (data.type !== "npc")
            {
                data.token.vision = true;
                data.token.actorLink = true;
            }
        }else if(data.type==="spaceship"){
            mergeObject(data,
                        {"token.bar1" :{"attribute" : "hullIntegrity"},                 // Default Bar 1 to Hull integrity
                         "token.bar2" :{"attribute" : "crew"},               // Default Bar 2 to Crew %
                         "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display name to be on owner hover
                         "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display bars to be always on
                         "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
                         "token.name" : data.name                                       // Set token name to actor name
                        })
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

            let newFatigue=false;
            try{
                newFatigue=data["data.secChar.fatigue.value"];
            }catch(err){
                newFatigue=false;
            }

            if(newFatigue){
                let token=null;
                if(this.isToken){
                    token=this.token;
                }else{
                    token=this.getActiveTokens()[0]
                }
                if(newFatigue>=this.data.data.secChar.fatigue.max*2){

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

            let wounds=false;

            try{
                wounds=data["data.secChar.wounds.value"];
            }catch(err){
                wounds=false;
            }
            let size=false;
            try{
                size=data["data.secChar.size.value"]; 
            }catch(err){
                size=false;
            }


            if(wounds&&(this.data.data.horde.value||this.data.data.formation.value)||size){


                if(this.data.data.horde.value||this.data.data.formation.value){
                    newSize= data["data.secChar.wounds.value"];
                    if(newSize<0){newSize=0}
                }else{
                    newSize= data["data.secChar.size.value"];
                }

                if ( (!this.data.data.horde.value&&!this.data.data.formation.value&&newSize && (newSize !== this.data.data.secChar.size.value))||((this.data.data.horde.value||this.data.data.formation.value)&&newSize!==undefined && (newSize !== this.data.data.secChar.wounds.value)) ) {

                    let size= 0;
                    if(this.data.data.horde.value||this.data.data.formation.value){
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
        }

        return super.update(data, options);
    }
    /**
   * Augment the basic actor data with additional dynamic data.
   */
    prepareData(){

        if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
        if ( !this.data.name ) this.data.name = "New " + this.entity;
        this.data.reset();
        this.prepareBaseData();

        this.prepareEmbeddedEntities();
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
        data.secChar.wornGear.armor={};
        data.secChar.wornGear.weapons=[{},{}];
        data.secChar.wornGear.forceField={};
        if(this.getFlag("fortyk","marksman")){
            data.secChar.attacks.range.long=0;
            data.secChar.attacks.range.extreme=0;
        }
        if(this.getFlag("fortyk","precisionkiller")){
            data.secChar.attacks.called=0;
        }
        if(this.getFlag("fortyk","berserkcharge")){
            data.secChar.attacks.charge=30;
        }
        for(let [key, hitLoc] of Object.entries(data.characterHitLocations)){
            hitLoc.armor=0;
        }
        if(this.getFlag("fortyk","quadruped")){

            data.secChar.movement.multi=parseInt(data.secChar.movement.multi)*2; 
        }
        if(this.getFlag("fortyk","crawler")){
            data.secChar.movement.multi=parseInt(data.secChar.movement.multi)/2; 
        }
        //initialize skill modifiers from active events so that they are integers
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;

            if(item.type==="skill"){
                let name="";
                if(item.data.parent.value){name+=item.data.parent.value.toLowerCase()+":"}
                name+=item.name.toLowerCase();
                data.skillmods[name]=0;
            }
        });
    }
    /*OVERRIDE
    *Prepare the sub documents and apply changes to the actor resulting*/
    prepareEmbeddedEntities(){
        this.applyActiveEffects();
        let actorData=this.data;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC'){
            let items=this.data.items;
            const data=actorData.data;

            data.experience.earned=0;
            data.experience.spent=0;
            data.characteristics["inf"].advance=0;
            data.carry.value=0;
            let forRaces=[];
            this.items.forEach((fortykItem,id,items)=>{

                let item=fortykItem.data;

                if(item.type==="skill"){
                    if(item.data.parent.value==="Forbidden Lore"){
                        if(game.fortyk.FORTYK.races.includes(item.name)){
                            forRaces.push(item.name.toLowerCase());
                        }
                    }
                }
                if(item.type==="cybernetic"){
                    this.data.data.characterHitLocations[item.data.location.value].cyber=true;

                }
                if(item.type==="advancement"){
                    //calculates spent exp
                    data.experience.spent=parseInt(data.experience.spent)+parseInt(item.data.cost.value);

                }
                if(item.type==="mission"){

                    data.experience.earned=parseInt(data.experience.earned)+parseInt(item.data.exp.value);
                    data.characteristics["inf"].advance= parseInt(data.characteristics["inf"].advance)+parseInt(item.data.inf.value);
                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                    //total weight calcs
                    item.data.weight.total=(parseInt(item.data.amount.value)*parseFloat(item.data.weight.value)).toFixed(2);
                    data.carry.value=(parseFloat(data.carry.value)+parseFloat(item.data.weight.total)).toFixed(2);


                }
                if(item.type==="rangedWeapon"){
                    if(!this.getFlag("fortyk","irongrip")){
                        if((this.getFlag("fortyk","firmgrip")&&item.data.class.value!=="Heavy")||item.data.class.value==="Pistol"||item.data.class.value==="Thrown"){

                            item.data.twohanded.value=false;

                        }else{

                            item.data.twohanded.value=true;
                        }
                    }else{
                        item.data.twohanded.value=false;
                    }
                }
                if(item.type==="meleeWeapon"){
                    if(!this.getFlag("fortyk","irongrip")){
                        if(item.data.class.value==="Melee Two-handed"){
                            item.data.twohanded.value=true;
                        }else{
                            item.data.twohanded.value=false;
                        }
                    }else{
                        item.data.twohanded.value=false; 
                    }
                }
                //check if equipped
                if((item.type==="meleeWeapon"||item.type==="rangedWeapon")&&item.data.isEquipped){

                    if(item.data.isEquipped.indexOf("right")!==-1){
                        data.secChar.wornGear.weapons[0]=fortykItem; 

                        if(item.data.twohanded.value){
                            data.secChar.wornGear.weapons[1]=fortykItem;
                        }
                    }else if(item.data.isEquipped.indexOf("left")!==-1){
                        data.secChar.wornGear.weapons[1]=fortykItem;  
                        if(item.data.twohanded.value){
                            data.secChar.wornGear.weapons[0]=fortykItem;
                        }
                    }else if(item.data.isEquipped.includes("extra")){
                        let index=parseInt(item.data.isEquipped.substring(5));
                        data.secChar.wornGear.extraWeapons[index]=fortykItem;
                    }



                    if(item.data.twohanded.value){
                        data.secChar.wornGear.weapons.push(item);
                    }
                }
                if(item.type==="armor"&&item.data.isEquipped){
                    data.secChar.wornGear.armor=item;
                    //set max agi from equipped armor
                    data.characteristics.agi.max=item.data.maxAgi.value;
                }
                if(item.type==="forceField"&&item.data.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
            })
            //store known xenos for deathwatchtraining

            if(this.getFlag("fortyk","deathwatchtraining")){

                actorData.flags.fortyk.deathwatchtraining=forRaces;
            }
            if(this.getFlag("fortyk","fieldvivisection")){
                actorData.flags.fortyk.fieldvivisection=forRaces;
            }
            data.characteristics["inf"].total=data.characteristics["inf"].value+data.characteristics["inf"].advance;

            data.experience.value=parseInt(data.experience.starting)+parseInt(data.experience.earned)-parseInt(data.experience.spent);

        }
        else if(actorData.type === 'npc'){
            let items=this.data.items;
            const data=actorData.data;
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem.data;
                if(item.type==="armor"&&item.data.isEquipped){
                    data.secChar.wornGear.armor=item;
                }
                if(item.type==="forceField"&&item.data.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
            })
        }


        else if(actorData.type === "spaceship"){
            let items=this.data.items;
            let data=actorData.data;

            data.cargo.value=0;
            data.cargo.profit=0;
            data.power.value=0;
            data.space.value=0;
            data.shipPoints.spent=0;
            data.shipPoints.remaining=0;

            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem.data;
                if(item.type==="spaceshipComponent"||item.type==="spaceshipWeapon"){
                    data.power.value+=parseInt(item.data.power.value);
                    data.space.value+=parseInt(item.data.space.value);
                    data.shipPoints.spent+=parseInt(item.data.sp.value);
                }else if(item.type==="spaceshipCargo"){

                    data.cargo.value+=parseInt(item.data.space.value);
                    item.data.pf.total=eval(item.data.pf.value)*parseFloat(item.data.space.value);
                    data.cargo.profit+=item.data.pf.total;
                }


            });

            data.shipPoints.remaining=parseInt(data.shipPoints.value)-data.shipPoints.spent;
        }

    }
    //OVERRIDE
    //custom function to manage effects that are linked to equippable items
    applyActiveEffects(){
        let actor=this;
        let actorData=this.data;
        let data=actorData.data;
        this.effects.forEach(function(ae,id){
            if(!ae.data.disabled){

                let proceed=false;
                //check if ae is from an item
                if(ae.data.origin){
                    let itemId=ae.data.origin.split('.')[3];
                    let item=actor.getEmbeddedDocument("Item",itemId);
                    if(item){
                        let equipped=item.data.data.isEquipped;
                        if(equipped===undefined||equipped){
                            proceed=true;
                        }else{
                            proceed=false;
                        }
                    }

                }else{
                    proceed=true;
                }
                //if item is equipped and/or not disabled
                if(proceed){
                    ae.data.changes.forEach(function(change,i){
                        
                        let basevalue=parseInt(objectByString(actorData,change.key));
                        let newvalue=parseFloat(change.value);
                        let path=change.key.split(".");
                        if(newvalue>=0){
                            newvalue=Math.ceil(newvalue);
                        }else{
                            newvalue=Math.floor(newvalue);
                        }
                        if(change.mode===0||(!isNaN(basevalue)&&!isNaN(newvalue))){


                            let changedValue=0;
                            if(change.mode===0){
                                setNestedKey(actorData,path,change.value);
                            }
                            else if(change.mode===1){
                                changedValue=basevalue*newvalue
                                setNestedKey(actorData,path,changedValue);

                            }else if(change.mode===2){
                                changedValue=basevalue+newvalue;
                                setNestedKey(actorData,path,changedValue);
                            }else if(change.mode===3){
                                if(change.value<basevalue){
                                    changedValue=newvalue;
                                    setNestedKey(actorData,path,changedValue);
                                }
                            }else if(change.mode===4){
                                if(change.value>basevalue){
                                    changedValue=newvalue;
                                    setNestedKey(actorData,path,changedValue);
                                }
                            }else if(change.mode===5){

                                setNestedKey(actorData,path,newvalue);
                            } 
                        }
                        

                    })
                }

            }

        })
    }
    prepareDerivedData() {

        const actorData = this.data;
        const data = actorData.data;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC') {this._prepareCharacterData(actorData)}
        else if (actorData.type === 'npc') {this._prepareNPCData(actorData)}
        else if (actorData.type === 'owRegiment'){this._prepareRegimentData(actorData)};
    }
    _prepareRegimentData(actorData){
        const data=actorData.data;
        data.characteristics.inf.total=parseInt(data.characteristics.inf.value)+parseInt(data.characteristics.inf.not)+parseInt(data.characteristics.inf.time)+parseInt(data.characteristics.inf.frontActive)+parseInt(data.characteristics.inf.war)+parseInt(data.characteristics.inf.mod);
    }
    /**
   * Prepare Character type specific data
   * 
   */
    _prepareCharacterData(actorData) {
        const data = actorData.data;



        //prepare characteristics data
        for (let [key, char] of Object.entries(data.characteristics)){
            if(key==="inf"){
                char.total=Math.min(char.total,char.max);
            }else{
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod);
                char.total=Math.min(char.total,char.max);
                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);  
                char.total+=parseInt(data.globalMOD.value);

                char.total=Math.min(char.total,char.max);
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
        if(this.getFlag("fortyk","soundconstitution")&&!isNaN(parseInt(this.getFlag("fortyk","soundconstitution")))){
            data.secChar.wounds.max=parseInt(data.secChar.wounds.max)+parseInt(this.getFlag("fortyk","soundconstitution"));
        }
        //parse skill modifiers from active effects
        for (let [key, char] of Object.entries(data.skillmods)){
            char=parseInt(char);
        }


        //prepare psyker stuff
        data.psykana.pr.effective=parseInt(data .psykana.pr.value)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(game.fortyk.FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        //get max carry weight ensure it is not out of bounds
        if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)>19){
            data.carry.max=game.fortyk.FORTYK.carry[19].carry+data.carry.mod;
        }else if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)<=19){
            data.carry.max=game.fortyk.FORTYK.carry[(data.characteristics["s"].bonus+data.characteristics["t"].bonus)].carry+data.carry.mod;
        }else{
            data.carry.max=game.fortyk.FORTYK.carry[1].carry+data.carry.mod;
        }
        //get income based on influence for dark heresy PCs
        if(this.data.type==="dhPC"){
            let inf=data.characteristics["inf"].total;
            if(this.getFlag("fortyk","breedingcounts")){
                inf+=10;
            }

            data.currency.income=FORTYKTABLES.income[inf]; 
        }
        //movement
        this.prepareMovement(data);
        
        //add up all armor and stuff

        var armor= data.secChar.wornGear.armor;

        var rightHandWeapon= data.secChar.wornGear.weapons[0];

        let rightHandWeaponData=null;
        if(rightHandWeapon){
            rightHandWeaponData=rightHandWeapon.data;
        }


        var leftHandWeapon= data.secChar.wornGear.weapons[1];


        let leftHandWeaponData=null;
        if(leftHandWeapon){
            leftHandWeaponData=leftHandWeapon.data;
        }
        if(this.getFlag("fortyk","WeaponMaster")){
            //weaponmaster initiative
            let master=false;
            if(rightHandWeaponData&&this.getFlag("fortyk","WeaponMaster").toLowerCase().includes(rightHandWeaponData.data.type.value.toLowerCase())){
                master=true;
            }else if(leftHandWeaponData&&this.getFlag("fortyk","WeaponMaster").toLowerCase().includes(leftHandWeaponData.data.type.value.toLowerCase())){
                master=true;
            }
            if(master){
                data.secChar.initiative.value+=2;
            }

        }

        //handle shields
        data.characterHitLocations.body.shield= 0;
        data.characterHitLocations.rArm.shield= 0;
        data.characterHitLocations.lArm.shield= 0;
        if(rightHandWeaponData!==undefined&&rightHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.rArm.shield= parseInt(rightHandWeaponData.data.shield.value);
            data.characterHitLocations.body.shield= parseInt(rightHandWeaponData.data.shield.value);

            if(rightHandWeapon.getFlag("fortyk","bulwark")&&this.getFlag("core","prone")){
                data.characterHitLocations.lArm.shield=parseInt(rightHandWeaponData.data.shield.value);
                data.characterHitLocations.lLeg.shield=parseInt(rightHandWeaponData.data.shield.value);
                data.characterHitLocations.rLeg.shield=parseInt(rightHandWeaponData.data.shield.value);
            }
        }
        if(leftHandWeaponData!==undefined&&leftHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.lArm.shield= parseInt(leftHandWeaponData.data.shield.value);
            data.characterHitLocations.body.shield= parseInt(leftHandWeaponData.data.shield.value);
            if(leftHandWeapon.getFlag("fortyk","bulwark")&&this.getFlag("core","prone")){
                data.characterHitLocations.rArm.shield=parseInt(leftHandWeaponData.data.shield.value);
                data.characterHitLocations.lLeg.shield=parseInt(leftHandWeaponData.data.shield.value);
                data.characterHitLocations.rLeg.shield=parseInt(leftHandWeaponData.data.shield.value);
            }
        }
        //machine
        let machine=0;
        if(this.getFlag("fortyk","machine")&&!isNaN(parseInt(this.getFlag("fortyk","machine")))){
            machine=parseInt(this.getFlag("fortyk","machine"));
        }
        //natural armor
        let natural=0;
        if(this.getFlag("fortyk","naturalarmor")&&!isNaN(parseInt(this.getFlag("fortyk","naturalarmor")))){
            natural=parseInt(this.getFlag("fortyk","naturalarmor"));
        }
        //compute rest of armor and absorption
        for(let [key, hitLoc] of Object.entries(data.characterHitLocations)){

            if(armor.data!==undefined){
                hitLoc.armor=hitLoc.armor+parseInt(armor.data.ap[key].value);
            }
            hitLoc.armor=hitLoc.armor+hitLoc.shield;
            if(hitLoc.cyber){
                hitLoc.armor=hitLoc.armor+2;
            }
            hitLoc.armor+=hitLoc.armorMod;
            hitLoc.armor+=Math.max(machine,natural);
            hitLoc.armor=Math.max(0,hitLoc.armor);
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
                char.total=Math.min(char.total,char.max);
            }else{
                char.total=parseInt(char.value);

                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);  
                char.total+=parseInt(data.globalMOD.value);
                char.total=Math.min(char.total,char.max);

            }
        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        //modify total characteristics depending on fatigue
        var fatigueMult=1;
        for (let [key,char] of Object.entries(data.characteristics)){
            if(!this.getFlag("core","frenzy")&&char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.value/2);
            }
        }
        //prepare psyker stuff
        data.psykana.pr.effective=parseInt(data .psykana.pr.value)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(game.fortyk.FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        //movement

        
        this.prepareMovement(data);
        //total soak
        var armor= data.secChar.wornGear.armor;
        //machine
        let machine=0;
        if(this.getFlag("fortyk","machine")&&!isNaN(parseInt(this.getFlag("fortyk","machine")))){
            machine=parseInt(this.getFlag("fortyk","machine"));
        }
        let natural=0;
        if(this.getFlag("fortyk","naturalarmor")&&!isNaN(parseInt(this.getFlag("fortyk","naturalarmor")))){
            natural=parseInt(this.getFlag("fortyk","naturalarmor"));
        }
        //compute rest of armor and absorption
        for(let [key, hitLoc] of Object.entries(data.characterHitLocations)){
            hitLoc.armor=parseInt(hitLoc.armor);
            if(armor.data!==undefined){
                hitLoc.armor=parseInt(hitLoc.armor)+parseInt(armor.data.ap[key].value);
            }

            hitLoc.armor+=hitLoc.armorMod;
            hitLoc.armor+=Math.max(machine,natural);
            hitLoc.armor=Math.max(0,hitLoc.armor);
            hitLoc.value=parseInt(hitLoc.armor)+data.characteristics.t.bonus;
            let daemonic=this.getFlag("fortyk","daemonic");
            if(daemonic){
                if(!isNaN(daemonic)){
                    hitLoc.value+=parseInt(daemonic);
                }
            }
        }
    }
    prepareMovement(data) {
        let size=data.secChar.size.value;
        data.secChar.size.label=game.fortyk.FORTYK.size[size].name;
        data.secChar.size.mod=game.fortyk.FORTYK.size[size].mod;
        data.secChar.size.movement=game.fortyk.FORTYK.size[size].movement;
        data.secChar.size.stealth=game.fortyk.FORTYK.size[size].stealth
        if(this.getFlag("fortyk","flyer")){
            data.secChar.movement.half=Math.max(Math.ceil((parseInt(this.getFlag("fortyk","flyer"))+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1);
        }else if(this.getFlag("fortyk","hoverer")){
            data.secChar.movement.half=Math.max(Math.ceil((parseInt(this.getFlag("fortyk","hoverer"))+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1);
        }else{
            
           data.secChar.movement.half=Math.max(Math.ceil((data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1); 
        }
        
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;
    }
    prepare(){
        let preparedData = this.data
        // Call prepareItems first to organize and process Items
        if(preparedData.type==='dwPC'||preparedData.type==='dhPC'||preparedData.type==='owPC'){
            mergeObject(preparedData, this.preparePCItems(preparedData));
        }else if(preparedData.type==='npc'){
            mergeObject(preparedData, this.prepareNPCItems(preparedData));
        }else if(preparedData.type==="spaceship"){
            mergeObject(preparedData, this.prepareSpaceshipItems(preparedData));
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
        const favoritePowers=[];
        const wornGear={weapons:[],"armor":"","forceField":""};

        let unrelenting=false;

        //get worn weapon ids into an array so that they can be accessed by the sheet easily
        let wornWeapons=data.secChar.wornGear.weapons;
        if(!Array.isArray(data.secChar.wornGear.weapons)){
            wornWeapons=Object.values(data.secChar.wornGear.weapons);
        }
        try{
            var rightHandWeapon= data.secChar.wornGear.weapons[0];
        }
        catch(err){var rightHandWeapon= undefined;}
        try{
            var leftHandWeapon= data.secChar.wornGear.weapons[1];
        }
        catch(err){var leftHandWeapon= undefined;}


        //figure out parry bonus from equipped weapons
        let leftParry=this.weaponParry(leftHandWeapon);
        let rightParry=this.weaponParry(rightHandWeapon);
        let parry=Math.max(leftParry,rightParry);

        let psyniscience=0;

        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;
            fortykItem.prepareData();
            if(item._id===data.secChar.wornGear.armor.id){
                wornGear["armor"]=item;
            }
            if(item._id===data.secChar.wornGear.forceField.id){
                wornGear["forceField"]=item;
            }
            if(item.type=="skill"){
                item.data.total.value=0
                item.data.mod.value=parseInt(item._source.data.mod.value);
                let name="";
                if(item.data.parent.value){name+=item.data.parent.value.toLowerCase()+":"}
                name+=item.name.toLowerCase();
                if(data.skillmods[name]){

                    item.data.mod.value+=parseInt(data.skillmods[item.name.toLowerCase()]);

                }
                if(item.name==="Stealth"){
                    item.data.mod.value+=data.secChar.size.stealth;  
                }
                if(item.name==="Parry"){
                    if(parry){
                        item.data.mod.value+=parry;
                    } 
                }
                if(this.getFlag("fortyk","fieldvivisection")&&item.name==="Medicae"){
                    data.fieldVivisection=parseInt(item.data.value)+parseInt(item.data.mod.value);
                }

                item.data.total.value+=parseInt(item.data.value)+parseInt(item.data.mod.value)+parseInt(data.characteristics[item.data.characteristic.value].total);
                if(item.name==="Psyniscience"){
                    psyniscience=item.data.total.value;
                }
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

                if(data.psykana.filter){

                    if(data.psykana.filter===item.data.discipline.value){
                        psychicPowers.push(item);
                    }
                }else{
                    psychicPowers.push(item);
                }
                if(item.data.favorite){
                    favoritePowers.push(item);
                }

            }
            if(item.type==="talentntrait"){

                talentsntraits.push(item);
            }
            if(item.type==="mission"){

                missions.push(item);
            }
            if(item.type==="advancement"){

                advancements.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                //total weight calcs
                item.data.weight.total=(parseInt(item.data.amount.value)*parseFloat(item.data.weight.value)).toFixed(2);



            }
            if(item.type==="meleeWeapon"){

                meleeweapons.push(item);
                wargear.push(item);
            }
            if(item.type==="rangedWeapon"){

                rangedWeapons.push(item);
                wargear.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){

                if(item.data.isEquipped){
                    wornGear.weapons.push(fortykItem);
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

        })





        let sortedSkills=skills;
        let sortedTnt=talentsntraits;
        let sortedGear=wargear;

        let preparedItems={skills:sortedSkills,
                           wargear:sortedGear,
                           cybernetics:cybernetics,
                           forceFields:forceFields,
                           mods:mods,
                           consummables:consummables,
                           psychicPowers:psychicPowers,
                           mutations:mutations,
                           malignancies:malignancies,
                           injuries:injuries,
                           disorders:disorders,
                           talentsntraits:sortedTnt,
                           missions:missions,
                           advancements:advancements,
                           meleeWeapons:meleeweapons,
                           rangedWeapons:rangedWeapons,
                           armors:armors,
                           ammunitions:ammunitions,
                           equippableAmmo:equippableAmmo,
                           wornGear:wornGear,
                           favoritePowers:favoritePowers};
        try{
            this._sortItems(preparedItems);
        }catch(err){}
        return preparedItems;
    }

    prepareNPCItems(actorData){
        let data=actorData.data;           
        const psychicPowers=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const talentsntraits=[];
        const armors=[];
        const forceFields=[];
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;
            fortykItem.prepareData();
            if(item.type==="talentntrait"){

                talentsntraits.push(item);
            }
            if(item.type==="armor"){
                armors.push(item);
            }
            if(item.type==="forceField"){
                forceFields.push(item);
            }
            if(item.type==="psychicPower"){

                psychicPowers.push(item);
            }
            if(item.type==="meleeWeapon"){

                meleeweapons.push(item);
            }
            if(item.type==="rangedWeapon"){

                rangedWeapons.push(item);

            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){

            }
        })
        let preparedItems={
            psychicPowers:psychicPowers,
            meleeWeapons:meleeweapons,
            rangedWeapons:rangedWeapons,
            talentsntraits:talentsntraits,
            armors:armors,
            forceFields:forceFields
        };
        try{
            this._sortItems(preparedItems);
        }catch(err){}
        return preparedItems;
    }
    //sort spaceship items and apply light logic
    prepareSpaceshipItems(actorData){
        let data=actorData.data;
        const weapons=[];
        const components=[];
        const cargo=[];
        const squadrons=[];
        const torpedoes=[];
        const bombers=[];
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem.data;
            let unmodItem=item._source;
            if(item.type==="spaceshipComponent"){
                components.push(item);
            }else if(item.type==="spaceshipWeapon"){
                if(item.data.type.value==="Hangar"){
                    item.data.damage.value="1d10+"+Math.ceil(data.crew.rating/10);
                    let squadron=this.items.get(item.data.torpedo.id);
                    if(squadron.data.data.halfstr.value){
                        item.data.torpedo.rating=squadron.data._source.data.rating.value-10;
                    }else{
                        item.data.torpedo.rating=squadron.data.data.rating.value;
                    }

                }
                if(item.data.type.value==="Torpedo"){

                    let torpedo=this.items.get(item.data.torpedo.id);
                    item.data.damage.value=torpedo.data.data.damage.value;

                    item.data.torpedo.rating=torpedo.data.data.rating.value;
                }
                components.push(item);
                weapons.push(item);

            }else if(item.type==="spaceshipCargo"){
                cargo.push(item);
                if(item.data.type.value==="Torpedoes"){
                    torpedoes.push(item);
                }
            }else if(item.type==="spaceshipSquadron"){
                if(item.data.halfstr.value){
                    item.data.rating.value=unmodItem.data.rating.value-10;
                }
                squadrons.push(item);
                if(item.data.type.value.toLowerCase()==="bomber"){

                    bombers.push(item);
                }
            }
        });
        let preparedItems={
            weapons:weapons,
            components:components,
            cargo:cargo,
            squadrons:squadrons,
            torpedoes:torpedoes,
            bombers:bombers
        }
        try{
            this._sortItems(preparedItems);
        }catch(err){}

        return preparedItems


    }
    //function to sort the item containers for display
    _sortItems(itemContainers){
        let data=this.data;

        let sorts=data.data.sort;

        let containers=Object.entries(itemContainers);
        containers.forEach((container, index )=>{

            if(sorts[container[0]]){
                let sortPath=sorts[container[0]].path;

                let sorted=[];
                if(sorts[container[0]].reverse){
                    sorted=container[1].sort(function compare(a, b) {
                        let valueA=objectByString(a,sortPath);
                        let valueB=objectByString(b,sortPath);
                        if (valueA<valueB) {
                            return 1;
                        }
                        if (valueA>valueB) {
                            return -1;
                        }
                        // a must be equal to b
                        return 0;
                    });
                }else{
                    sorted=container[1].sort(function compare(a, b) {
                        let valueA=objectByString(a,sortPath);
                        let valueB=objectByString(b,sortPath);
                        if (valueA<valueB) {
                            return -1;
                        }
                        if (valueA>valueB) {
                            return 1;
                        }
                        // a must be equal to b
                        return 0;
                    });
                }


                itemContainers[container[0]]=sorted;
            }
        })
    }
    //this function deletes items from an actor, certain items need more logic to process
    deleteItem(itemId){
        let item=this.items.get(itemId);
        //iterate through skills to delete all the children of a group skill
        if(item.type==="skill"&&item.data.hasChildren){
            let skills=this.items.filter(function(item){return item.type==="skill"});
            for(let s of skills){                
                if(s.data.data.parent.value===item.name){
                    this.deleteEmbeddedDocuments("Item",[s._id]);
                }
            }
        }
        this.deleteEmbeddedDocuments("Item", [itemId]);
    }
    //calculate the parry bonus from a weapon, if no weapon returns -20
    weaponParry(weapon){
        if(weapon===undefined||weapon.data===undefined||weapon.data.type==="rangedWeapon"&&weapon.data.data.class.value!=="Pistol"){return -20}
        let parry=0;
        if(weapon.getFlag("fortyk","unbalanced")){
            parry-=10;
        }
        if(weapon.getFlag("fortyk","balanced")){
            parry+=10;
        }
        if(weapon.getFlag("fortyk","defensive")){
            parry+=15;
        }
        if(weapon.data.data.quality.value==="Best"){
            parry+=10;
        }else if(weapon.data.data.quality.value==="Good"){
            parry+=5;
        }else if(weapon.data.data.quality.value==="Poor"){
            parry-=10;
        }
        return parry; 

    }
    //when creating active effects check if they are transferred from an item, if so give the active effect flag to the item for referrence.
    _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId){
        if(embeddedName==="ActiveEffect"){
            let actor=this;
            documents.forEach(async function(item,i){
                if(item.data.origin){
                    let powerId=item.data.origin.split('.')[3];
                    let power=actor.getEmbeddedDocument("Item",powerId);
                    await power.update({"data.transferId":item.id})

                }
            })
        }
        super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }
    _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId){

        if(this.dialog){




            this.dialog.updateDialog(this);


        }
        super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }
    //when deleting talents, remove the flag associated with each of them.
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId){
        let actor=this;

        if(embeddedName==="Item"){
            documents.forEach(async function(item,i){

                if(item.data.type==="talentntrait"){
                    let flag=item.data.data.flagId.value;
                    await actor.setFlag("fortyk",flag,false); 
                }else if(item.data.type==="advancement"){
                    let advType=item.data.data.type.value
                    let data=item.data.data;

                    if(advType==="Skill Upgrade"){

                        let skill=actor.getEmbeddedDocument("Item",data.itemId.value);
                        let skillAdv=parseInt(skill.data.data.value);
                        if(skillAdv===0){skillAdv=-20}else{skillAdv-=10}
                        skill.update({"data.value":skillAdv});
                    }else if(advType==="New Skill"){

                        try{
                            actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                        }catch(err){}


                    }else if(advType==="Talent"){

                        try{
                            actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                        }catch(err){}
                    }else if(advType==="Characteristic Upgrade"){

                        let char=data.characteristic.value;
                        let charAdv=actor.data.data.characteristics[char].advance;
                        charAdv-=5;
                        let path=`data.characteristics.${char}.advance`;
                        let upd={}
                        upd[path]=charAdv;
                        actor.update(upd);
                    }
                }
            })
        }
        super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }

}