import {getSkills} from "../utilities.js";
import {isEmpty} from "../utilities.js";
import {FORTYKTABLES} from "../FortykTables.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import {radToDeg} from "../utilities.js";
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class FortyKActor extends Actor {
    //@Override the create function to add starting skills to a character and setup token stuff
    static async create(data, options) {
        // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
        if (data.items)
        {
            return super.create(data, options);
        }
        data.items = [];
        //initialise starting skills
        let startingSkills= await getSkills();
        if (data.type !=="npc" && data.type!=="owComrade" && data.type!=="owRegiment" && data.type!=="spaceship" && data.type!=="vehicle" && data.type!=="knightHouse"){
            for(let s of startingSkills){
                data.items.push(duplicate(s));
            }
        }
        if (data.type !=="npc" && data.type!=="owComrade" && data.type!=="owRegiment" && data.type!=="spaceship" && data.type!=="vehicle" && data.type!=="knightHouse"){
            // Set wounds, fatigue, and display name visibility
            mergeObject(data,
                        {"token.bar1" :{"attribute" : "secChar.wounds"},                
                         "token.bar2" :{"attribute" : "secChar.fatigue"},               
                         "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,   
                         "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,   
                         "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         
                         "token.name" : data.name                                       
                        })
            // Default non npcs to HasVision = true and Link Data = true
            if (data.type !== "npc")
            {
                data.token.vision = true;
                data.token.actorLink = true;
            }
        }else if(data.type==="spaceship"){
            //spaceships have different attributes but same stuff
            mergeObject(data,
                        {"token.bar1" :{"attribute" : "hullIntegrity"},                 
                         "token.bar2" :{"attribute" : "crew"},               
                         "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    
                         "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    
                         "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         
                         "token.name" : data.name                                       
                        })
        }
        //resume actor creation
        super.create(data, options);
    }
    //@Override the update function to modify token size for hordes and larger entities
    async update(data, options={}) {

        let actor=this;
        let actorData=actor;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC' || actorData.type === 'npc'|| actorData.type === 'vehicle'){

            //check for fatigue unconsciousness/death
            let newFatigue=false;
            try{
                newFatigue=data["system.secChar.fatigue.value"];
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
                if(newFatigue>=this.system.secChar.fatigue.max*2){
                    await game.fortyk.FortykRolls.applyDead(token,this,"fatigue");
                }else if(!this.getFlag("core","frenzy")&&!this.getFlag("core","unconscious")&&newFatigue>=this.system.secChar.fatigue.max){
                    let effect=[];
                    effect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
                    let chatUnconscious={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:`${actor.name} falls unconscious from fatigue!`,
                                         classes:["fortyk"],
                                         flavor:`Fatigue pass out`,
                                         author:actor.name};
                    await ChatMessage.create(chatUnconscious,{});
                    await actor.createEmbeddedDocuments("ActiveEffect",effect);
                }
            }
            // Apply changes in Actor size to Token width/height
            let newSize= 0;
            let wounds=false;
            try{
                wounds=data["system.secChar.wounds.value"];
            }catch(err){
                wounds=false;
            }
            let size=false;
            try{
                size=data["system.secChar.size.value"]; 
            }catch(err){
                size=false;
            }
            let vehicle=false;
            if(actorData.type==='vehicle'){
                vehicle=true
            }
            if(vehicle){
                newSize= data["system.secChar.size.value"];
                if(newSize && (newSize !== this.system.secChar.size.value)){
                    let size= 0;
                    size= game.fortyk.FORTYK.size[newSize].size;
                    if ( this.isToken ) this.token.update({height: size, width: size});
                    else if ( !data["token.width"] && !hasProperty(data, "token.width") ) {
                        data["token.height"] = size;
                        data["token.width"] = size;
                    }
                }
            }else{
                if(wounds&&(this.system.horde.value||this.system.formation.value)||size){
                    if(this.system.horde.value||this.system.formation.value){
                        newSize= data["system.secChar.wounds.value"];
                        if(newSize<0){newSize=0}
                    }else{
                        newSize= data["system.secChar.size.value"];
                    }
                    if ( (!this.system.horde.value&&!this.system.formation.value&&newSize && (newSize !== this.system.secChar.size.value))||((this.system.horde.value||this.system.formation.value)&&newSize!==undefined && (newSize !== this.system.secChar.wounds.value)) ) {
                        let size= 0;
                        if(this.system.horde.value||this.system.formation.value){
                            size= FORTYKTABLES.hordeSizes[newSize];
                            if(this.isToken){
                                //modify token dimensions if scene ratio isnt 1
                                let gridRatio=canvas.dimensions.distance;
                                size=Math.max(1,size/gridRatio);
                            }

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
        }




        return super.update(data, options);
    }
    /**
   * Augment the basic actor data with additional dynamic data.
   */
    prepareData(){
        if (!this.img) this.img = CONST.DEFAULT_TOKEN;
        if ( !this.name ) this.name = "New " + this.entity;

        this.prepareBaseData();
        this.prepareEmbeddedEntities();
        this.prepareDerivedData();
        this.isPrepared=true;
    }
    prepareBaseData(){
        let actorData=this;
        if(actorData.flags.fortyk===undefined){actorData.flags.fortyk={}}
        const data = this.system;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC' || actorData.type === 'npc'){
            this._prepareCharacterBaseData(data);
        }else if(actorData.type === 'vehicle'){
            this._prepareVehicleBaseData(data);
        }
    }
    _prepareCharacterBaseData(data){
        data.secChar.wornGear.armor={};
        data.secChar.wornGear.weapons=[{},{}];
        data.secChar.wornGear.forceField={};
        if(this.getFlag("fortyk","marksman")||this.getFlag("fortyk","marksmanshonor")){
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

        if(this.getFlag("fortyk","doubleteam")){
            data.secChar.attacks.gangup["1"]=20;
            data.secChar.attacks.gangup["2"]=30;
        }
        data.evasion=0;
        data.evasionMod=0;

        //initialize skill modifiers from active events so that they are integers
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem;
            if(item.type==="skill"){
                let name="";
                if(item.system.parent.value){name+=item.system.parent.value.toLowerCase()+":"}
                name+=item.name.toLowerCase();
                data.skillmods[name]=0;
            }
        });
    }
    _prepareVehicleBaseData(data){
        data.secChar.wornGear.forceField={};
        //check if this is a token actor
        let height;
        let width;
        if(this.isToken){
            height=this.token.height;
            width=this.token.width;
        }else{
            height=this.prototypeToken.height;
            width=this.prototypeToken.width;
        }
        /*
        not really useable until somone makes uneven tokens rotate
        if(width!==height){
            //calculate facing angle ranges for non square tokens
            let angleFrontRear=2*(radToDeg(Math.atan((width/2)/(height/2))));
            let angleSides=(360-angleFrontRear*2)/2;
            angleFrontRear=Math.round(angleFrontRear);
            angleSides=Math.round(angleSides);
            let front=data.facings.front;
            let lSide=data.facings.lSide;
            let rear=data.facings.rear;
            let rSide=data.facings.rSide;
            front.angle=angleFrontRear;
            lSide.angle=angleSides;
            rear.angle=angleFrontRear;
            rSide.angle=angleSides;
            front.start=360-Math.floor(front.angle/2);
            front.end=0+Math.ceil(front.angle/2);
            rSide.start=front.end+1;
            rSide.end=front.end+lSide.angle;
            rear.start=rSide.end+1;
            rear.end=rSide.end+rear.angle;
            lSide.start=rear.end+1;
            lSide.end=front.start-1;
        }*/
        data.evasion=0;
        data.evasionMod=0;

        //prepare base stats for imperial knights if they have a chassis selected
        if(data.knight.chassis){
            data.chassis=this.getEmbeddedDocument("Item",data.knight.chassis);
            let chassis=data.chassis.system;
            data.secChar.wounds.max=parseInt(chassis.structuralIntegrity.value);
            data.secChar.speed.tactical=parseInt(chassis.speed.value);
            data.knight.armorValues={};
            data.knight.armorValues.value=0;
            data.knight.armorValues.max=parseInt(chassis.armor.value);
            data.knight.armorValues.sideMax=45;
            data.knight.space={};
            data.knight.space.max=parseInt(chassis.space.value);
            data.knight.space.value=0;
            data.knight.tonnage={};
            data.knight.tonnage.max=parseInt(chassis.tonnage.value);
            data.knight.tonnage.value=0;
        }
        if(data.knight.spirit){
            data.spirit=this.getEmbeddedDocument("Item",data.knight.spirit);
        }
        if(this.getFlag("fortyk","longrangetargetters")){
            data.secChar.attacks.range.long=0;
            data.secChar.attacks.range.extreme=0;
        }

    }
    /*OVERRIDE
    *Prepare the sub documents and apply changes to the actor resulting*/
    prepareEmbeddedEntities(){

        let actorData=this;
        if(actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC'){
            this.applyActiveEffects();
            let items=this.items;
            const data=this.system;
            data.experience.earned=0;
            data.experience.spent=0;
            data.characteristics["inf"].advance=0;
            data.carry.value=0;
            let forRaces=[];
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                if(item.type==="skill"){
                    if(item.system.parent.value==="Forbidden Lore"){
                        if(game.fortyk.FORTYK.races.includes(item.name)){
                            forRaces.push(item.name.toLowerCase());
                        }
                    }
                }
                if(item.type==="cybernetic"){
                    this.system.characterHitLocations[item.system.location.value].cyber=true;
                }
                if(item.type==="advancement"){
                    //calculates spent exp
                    data.experience.spent=parseInt(data.experience.spent)+parseInt(item.system.cost.value);
                }
                if(item.type==="mission"){
                    data.experience.earned=parseInt(data.experience.earned)+parseInt(item.system.exp.value);
                    data.characteristics["inf"].advance= parseInt(data.characteristics["inf"].advance)+parseInt(item.system.inf.value);
                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){

                    //total weight calcs
                    item.system.weight.total=(parseInt(item.system.amount.value)*parseFloat(item.system.weight.value)).toFixed(2);
                    data.carry.value=(parseFloat(data.carry.value)+parseFloat(item.system.weight.total)).toFixed(2);
                }
                if(item.type==="rangedWeapon"){
                    if(!this.getFlag("fortyk","irongrip")){
                        if((this.getFlag("fortyk","firmgrip")&&item.system.class.value!=="Heavy")||item.system.class.value==="Pistol"||item.system.class.value==="Thrown"){
                            item.system.twohanded.value=false;
                        }else{
                            item.system.twohanded.value=true;
                        }
                    }else{
                        item.system.twohanded.value=false;
                    }
                }
                if(item.type==="meleeWeapon"){
                    if(!this.getFlag("fortyk","irongrip")){
                        if(item.system.class.value==="Melee Two-handed"){
                            item.system.twohanded.value=true;
                        }else{
                            item.system.twohanded.value=false;
                        }
                    }else{
                        item.system.twohanded.value=false; 
                    }
                }
                //check if equipped
                if(item.system.isEquipped){
                    console.log(this.name,item)
                    if(item.getFlag("fortyk","encumbering")){
                        data.secChar.movement.mod-=item.getFlag("fortyk","encumbering");
                    }
                }
                if((item.type==="meleeWeapon"||item.type==="rangedWeapon")&&item.system.isEquipped){

                    if(item.system.isEquipped.indexOf("right")!==-1){
                        data.secChar.wornGear.weapons[0]=fortykItem; 
                        if(item.system.twohanded.value){
                            data.secChar.wornGear.weapons[1]=fortykItem;
                        }
                    }else if(item.system.isEquipped.indexOf("left")!==-1){
                        data.secChar.wornGear.weapons[1]=fortykItem;  
                        if(item.system.twohanded.value){
                            data.secChar.wornGear.weapons[0]=fortykItem;
                        }
                    }else if(item.system.isEquipped.includes("extra")){
                        let index=parseInt(item.system.isEquipped.substring(5));
                        data.secChar.wornGear.extraWeapons[index]=fortykItem;
                    }
                    if(item.system.twohanded.value){
                        data.secChar.wornGear.weapons.push(item);
                    }
                }
                if(item.type==="armor"&&item.system.isEquipped){
                    data.secChar.wornGear.armor=item;
                    //set max agi from equipped armor
                    data.characteristics.agi.max=item.system.maxAgi.value;
                }
                if(item.type==="forceField"&&item.system.isEquipped){
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
            this.applyActiveEffects();
            let items=this.items;
            const data=this.system;
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                if(item.system.isEquipped){
                    if(item.getFlag("fortyk","encumbering")){
                        data.secChar.movement.mod-=item.getFlag("fortyk","encumbering");
                    }
                }
                if(item.type==="armor"&&item.system.isEquipped){
                    data.secChar.wornGear.armor=item;
                }
                if(item.type==="forceField"&&item.system.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
            })
        }
        else if(actorData.type === "spaceship"){
            let items=this.items;
            let data=this.system;
            data.cargo.value=0;
            data.cargo.profit=0;
            data.power.value=0;
            data.space.value=0;
            data.shipPoints.spent=0;
            data.shipPoints.remaining=0;
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                if(item.type==="spaceshipComponent"||item.type==="spaceshipWeapon"){
                    data.power.value+=parseInt(item.system.power.value);
                    data.space.value+=parseInt(item.system.space.value);
                    data.shipPoints.spent+=parseInt(item.system.sp.value);
                }else if(item.type==="spaceshipCargo"){
                    data.cargo.value+=parseInt(item.system.space.value);
                    item.system.pf.total=parseFloat(item.system.pf.value)*parseFloat(item.system.space.value);
                    data.cargo.profit+=item.system.pf.total;
                }
            });
            data.shipPoints.remaining=parseInt(data.shipPoints.value)-data.shipPoints.spent;
        }
        else if(actorData.type === "vehicle"){
            this.applyActiveEffects();
            let data=this.system;
            data.rightSideWeapons=[];
            data.leftSideWeapons=[];
            data.frontWeapons=[];
            data.rearWeapons=[];
            this.items.forEach((fortykItem,id,items)=>{
                fortykItem.prepareData();
                let item=fortykItem;
                if(item.type==="forceField"&&item.system.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                    if(item.system.mounting.value==="turret"){
                        data.rightSideWeapons.push(item); 
                        data.leftSideWeapons.push(item); 
                        data.frontWeapons.push(item); 
                        data.rearWeapons.push(item); 
                    }else if(item.system.facing.value==="front"){
                        data.rightSideWeapons.push(item); 
                        data.leftSideWeapons.push(item); 
                        data.frontWeapons.push(item); 
                    }else if(item.system.facing.value==="lSide"){
                        data.leftSideWeapons.push(item); 
                        data.frontWeapons.push(item);
                        data.rearWeapons.push(item); 
                    }else if(item.system.facing.value==="rSide"){
                        data.rightSideWeapons.push(item); 
                        data.frontWeapons.push(item);
                        data.rearWeapons.push(item); 
                    }else if(item.system.facing.value==="rear"){
                        data.leftSideWeapons.push(item); 
                        data.rightSideWeapons.push(item);
                        data.rearWeapons.push(item); 
                    }
                    if(data.knight.chassis){
                        data.knight.space.value+=parseFloat(item.system.space.value);
                        data.knight.tonnage.value+=parseFloat(item.system.weight.value);
                    }
                }
            });
        }else if(actorData.type === "knightHouse"){
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                fortykItem.prepareData();
            });
        }
    }
    //OVERRIDE
    //custom function to manage effects that are linked to equippable items
    applyActiveEffects(){
        let actor=this;
        let actorData=this;
        let data=this.system;
        this.effects.forEach(function(ae,id){
            if(!ae.disabled){
                let proceed=false;
                //check if ae is from an item
                if(ae.origin){
                    let itemId=ae.origin.split('.')[3];
                    let item=actor.getEmbeddedDocument("Item",itemId);
                    if(item){
                        let equipped=item.system.isEquipped;
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
                    ae.changes.forEach(function(change,i){
                        let basevalue=parseFloat(objectByString(actorData,change.key));

                        let newvalue=parseFloat(change.value);
                        let path=change.key.split(".");
                        /*if(newvalue>=0){
                            newvalue=Math.ceil(newvalue);
                        }else{
                            newvalue=Math.floor(newvalue);
                        }*/
                        if((!isNaN(basevalue)&&!isNaN(newvalue))){
                            let changedValue=0;
                            if(change.mode===1){
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
                            }else if(change.mode===0){
                                setNestedKey(actorData,path,change.value);
                            }
                        }else{
                            if(change.mode===0){
                                setNestedKey(actorData,path,change.value);
                            }
                        }
                    })
                }
            }
        })
    }
    prepareDerivedData() {
        const actorData = this;
        const data = this.system;
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC') {this._prepareCharacterData(actorData)}
        else if (actorData.type === 'npc') {this._prepareNPCData(actorData)}
        else if (actorData.type === 'vehicle') {this._prepareVehicleData(actorData)}
        else if (actorData.type === 'owRegiment'){this._prepareRegimentData(actorData)}
        else if(actorData.type === 'knightHouse'){this._prepareHouseData(actorData)};
    }
    _prepareRegimentData(actorData){
        const data=this.system;
        data.characteristics.inf.total=parseInt(data.characteristics.inf.value)+parseInt(data.characteristics.inf.not)+parseInt(data.characteristics.inf.time)+parseInt(data.characteristics.inf.frontActive)+parseInt(data.characteristics.inf.war)+parseInt(data.characteristics.inf.mod);
    }
    /**
   * Prepare Character type specific data
   * 
   */
    _prepareCharacterData(actorData) {
        const data = this.system;
        //prepare characteristics data
        for (let [key, char] of Object.entries(data.characteristics)){
            if(key==="inf"){
                char.total=Math.min(char.total,char.max);
            }else{
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod);
                char.total=Math.min(char.total,char.max);
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
        if(!this.getFlag("core","frenzy")&&!this.getFlag("fortyk","tireless")){
            for (let [key,char] of Object.entries(data.characteristics)){
                if(key!=="inf"&&char.bonus*fatigueMult<data.secChar.fatigue.value){
                    char.total=Math.ceil(char.total/2);
                }
            }  
        }
        if(this.getFlag("fortyk","soundconstitution")&&!isNaN(parseInt(this.getFlag("fortyk","soundconstitution")))){
            data.secChar.wounds.max=parseInt(data.secChar.wounds.max)+parseInt(this.getFlag("fortyk","soundconstitution"));
        }
        data.secChar.wounds.heavy=false;

        let damage=data.secChar.wounds.max-data.secChar.wounds.value;
        if(damage>data.characteristics.t.bonus*2){
            data.secChar.wounds.heavy=true;
        }
        if(this.getFlag("fortyk","desperatestrength")&&data.secChar.wounds.heavy){
            data.characteristics.s.bonus++;
            data.characteristics.s.uB++;
            data.characteristics.t.bonus++;
            data.characteristics.t.uB++;
            if(data.secChar.wounds.value<0){
                data.characteristics.s.bonus++;
                data.characteristics.s.uB++;
                data.characteristics.t.bonus++;
                data.characteristics.t.uB++;
            }
        }
        if(this.getFlag("fortyk","hardy")){
            data.secChar.wounds.heavy=false; 
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
        if(this.type==="dhPC"){
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
        if(!jQuery.isEmptyObject(rightHandWeapon)){
            rightHandWeaponData=rightHandWeapon;
        }
        var leftHandWeapon= data.secChar.wornGear.weapons[1];
        let leftHandWeaponData=null;
        if(!jQuery.isEmptyObject(leftHandWeapon)){
            leftHandWeaponData=leftHandWeapon;
        }
        if(this.getFlag("fortyk","WeaponMaster")){
            //weaponmaster initiative
            let master=false;
            if(rightHandWeaponData&&this.getFlag("fortyk","WeaponMaster").toLowerCase().includes(rightHandWeaponsystem.type.value.toLowerCase())){
                master=true;
            }else if(leftHandWeaponData&&this.getFlag("fortyk","WeaponMaster").toLowerCase().includes(leftHandWeaponsystem.type.value.toLowerCase())){
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
        if(rightHandWeaponData!==null&&rightHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.rArm.shield+= parseInt(rightHandWeapon.system.shield.value);
            data.characterHitLocations.body.shield+= parseInt(rightHandWeapon.system.shield.value);
            if(rightHandWeapon.getFlag("fortyk","bulwark")&&this.getFlag("core","prone")){
                data.characterHitLocations.lArm.shield=parseInt(rightHandWeapon.system.shield.value);
                data.characterHitLocations.lLeg.shield=parseInt(rightHandWeapon.system.shield.value);
                data.characterHitLocations.rLeg.shield=parseInt(rightHandWeapon.system.shield.value);
            }
        }
        if(leftHandWeaponData!==null&&leftHandWeaponData.type!=="rangedWeapon"){
            data.characterHitLocations.lArm.shield+= parseInt(leftHandWeapon.system.shield.value);
            data.characterHitLocations.body.shield+= parseInt(leftHandWeapon.system.shield.value);
            if(leftHandWeapon.getFlag("fortyk","bulwark")&&this.getFlag("core","prone")){
                data.characterHitLocations.rArm.shield+=parseInt(leftHandWeapon.system.shield.value);
                data.characterHitLocations.lLeg.shield+=parseInt(leftHandWeapon.system.shield.value);
                data.characterHitLocations.rLeg.shield+=parseInt(leftHandWeapon.system.shield.value);
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
            if(!jQuery.isEmptyObject(armor)){
                hitLoc.armor=hitLoc.armor+parseInt(armor.system.ap[key].value);
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
        this.prepareItems(data);
    }
    _prepareNPCData(actorData){
        const data=this.system;
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
            if(!this.getFlag("core","frenzy")&&!this.getFlag("fortyk","tireless")&&char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.value/2);
            }
        }
        data.secChar.wounds.heavy=false;

        let damage=data.secChar.wounds.max-data.secChar.wounds.value;
        if(damage>data.characteristics.t.bonus*2){
            data.secChar.wounds.heavy=true;
        }
        if(this.getFlag("fortyk","desperatestrength")&&data.secChar.wounds.heavy){
            data.characteristics.s.bonus++;
            data.characteristics.s.uB++;
            data.characteristics.t.bonus++;
            data.characteristics.t.uB++;
            if(data.secChar.wounds.value<0){
                data.characteristics.s.bonus++;
                data.characteristics.s.uB++;
                data.characteristics.t.bonus++;
                data.characteristics.t.uB++;
            }
        }
        //prepare parry/dodge
        data.parry.total=data.characteristics.ws.total+parseInt(data.parry.mod)+data.evasionMod;
        data.dodge.total=data.characteristics.agi.total+parseInt(data.dodge.mod)+data.evasionMod;
        //prepare psyker stuff
        data.psykana.pr.effective=parseInt(data .psykana.pr.value)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(game.fortyk.FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        data.secChar.wounds.heavy=false;
        if(!this.getFlag("fortyk","hardy")){
            let damage=data.secChar.wounds.max-data.secChar.wounds.value;
            if(damage>data.characteristics.t.bonus*2){
                data.secChar.wounds.heavy=true;
            }
        }
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
            if(!jQuery.isEmptyObject(armor)){
                hitLoc.armor=parseInt(hitLoc.armor)+parseInt(armor.system.ap[key].value);
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
    async _prepareVehicleData(actorData){
        const data=this.system;


        let knight=data.knight;
        var armorRatio=1;
        this.preparePilot();

        if(knight.chassis){
            if(knight.core){
                data.knight.core=this.getEmbeddedDocument("Item",knight.core);

                data.knight.heat.cap+=data.knight.core.system.heatCap.value;
                data.knight.heat.max=parseInt(data.knight.heat.cap)+parseInt(data.knight.heat.mod);
                data.knight.space.value+=parseFloat(data.knight.core.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.core.system.weight.value);
                data.secChar.speed.tactical+=parseInt(data.knight.core.system.speed.value);
                data.secChar.speed.tactical+=data.secChar.speed.mod;
                data.secChar.speed.tactical=data.secChar.speed.tactical*parseFloat(data.secChar.speed.multi);
                data.secChar.speed.cruising=Math.ceil(data.secChar.speed.tactical*1.2);
            }
            if(knight.armor){
                data.knight.armor=this.getEmbeddedDocument("Item",knight.armor);
                armorRatio=data.knight.armor.system.weightRatio.value;
                data.knight.tonnage.armor=0;
                data.knight.totalArmor=0;
                data.knight.space.value+=Math.ceil(parseFloat(data.knight.armor.system.space.value)*parseFloat(data.knight.space.max));
                data.knight.armorValues.max=Math.ceil(data.knight.armorValues.max*parseFloat(data.knight.armor.system.armor.mod));
                data.knight.armorValues.sideMax=Math.ceil(data.knight.armorValues.sideMax*parseFloat(data.knight.armor.system.armor.mod))
            }
            if(knight.structure){
                data.knight.structure=this.getEmbeddedDocument("Item",knight.structure);
                data.knight.space.value+=Math.ceil(parseFloat(data.knight.structure.system.space.value)*parseInt(data.knight.space.max));
                data.knight.tonnage.value+=parseFloat(data.knight.structure.system.weight.value);
                data.secChar.wounds.max=Math.ceil(parseInt(data.secChar.wounds.max)*parseFloat(data.knight.structure.system.SI.mod));
                data.knight.space.max=Math.ceil(parseInt(data.knight.space.max)*parseFloat(data.knight.structure.system.space.mod));
            }
            if(knight.forceField){
                data.knight.forceField=this.getEmbeddedDocument("Item",knight.forceField);
            }
            if(knight.coreMod){
                data.knight.coreMod=this.getEmbeddedDocument("Item",knight.coreMod);
                data.knight.space.value+=parseFloat(data.knight.coreMod.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.coreMod.system.weight.value);
            }
            if(knight.armActuator){
                data.knight.armActuator=this.getEmbeddedDocument("Item",knight.armActuator);
                data.knight.space.value+=parseFloat(data.knight.armActuator.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.armActuator.system.weight.value);
            }
            if(knight.legActuator){
                data.knight.legActuator=this.getEmbeddedDocument("Item",knight.legActuator);
                data.knight.space.value+=parseFloat(data.knight.legActuator.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.legActuator.system.weight.value);
            }
            if(knight.plating){
                data.knight.plating=this.getEmbeddedDocument("Item",knight.plating);
                data.knight.space.value+=parseFloat(data.knight.plating.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.plating.system.weight.value);
            }
            if(knight.sensor){
                data.knight.sensor=this.getEmbeddedDocument("Item",knight.sensor);
                data.knight.space.value+=parseFloat(data.knight.sensor.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.sensor.system.weight.value);
            }
            if(knight.throneMod){
                data.knight.throneMod=this.getEmbeddedDocument("Item",knight.throneMod);
                data.knight.space.value+=parseFloat(data.knight.throneMod.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.throneMod.system.weight.value);
            }

            let chassis=this.getEmbeddedDocument("Item",knight.chassis);

            let hardPoints=chassis.system.hardPoints;
            var rightShield=0;
            var leftShield=0;
            for (let [key, wpnType] of Object.entries(hardPoints.rightArm)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        let wpn=this.getEmbeddedDocument("Item",wpnType[i]);
                        if(wpn.type==="meleeWeapon"){
                            rightShield+=parseInt(wpn.system.shield.value);
                        }
                    }
                }
            }
            for (let [key, wpnType] of Object.entries(hardPoints.leftArm)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        let wpn=this.getEmbeddedDocument("Item",wpnType[i]);

                        if(wpn&&wpn.type==="meleeWeapon"){
                            leftShield+=parseInt(wpn.system.shield.value);
                        }
                    }
                }
            }
            knight.instancedComponents=[];
            for(let i=0;i<knight.components.length;i++){
                let component=knight.components[i];
                let instancedComponent=this.getEmbeddedDocument("Item",component);

                if(instancedComponent){
                    knight.space.value+=parseFloat(instancedComponent.system.space.value);
                    knight.tonnage.value+=parseFloat(instancedComponent.system.weight.value);
                }

                knight.instancedComponents.push(instancedComponent);

            }
        }
        //calculate thresholds for superheavies and set min wounds
        if(this.getFlag("fortyk","superheavy")){
            let max=data.secChar.wounds.max
            let thresholdSize=Math.ceil(max/4);
            data.secChar.wounds.thresholds["1"]=max-thresholdSize;
            data.secChar.wounds.thresholds["2"]=max-2*thresholdSize;
            data.secChar.wounds.thresholds["3"]=max-3*thresholdSize;
            data.secChar.wounds.thresholds["4"]=0;
            data.secChar.wounds.min=-100;
        }
        //initialize armor
        for(let [key, hitLoc] of Object.entries(data.facings)){
            hitLoc.value=hitLoc.armor;
            if(data.knight.chassis){
                data.knight.armorValues.value+=parseInt(hitLoc.armor);
                if(key==="lSide"){
                    hitLoc.value+=leftShield;
                    hitLoc.shield=leftShield;
                }else if(key==="rSide"){
                    hitLoc.value+=rightShield;
                    hitLoc.shield=rightShield;
                }
            }

            let daemonic=this.getFlag("fortyk","daemonic");
            if(daemonic){
                if(!isNaN(daemonic)){
                    hitLoc.value+=parseInt(daemonic);
                }
            }
        }
        if(data.knight.chassis){
            //multiply by the armor weight ratio and round to 2 decimals
            data.knight.tonnage.armor=Math.round((data.knight.armorValues.value*armorRatio + Number.EPSILON) * 100) / 100;
            data.knight.tonnage.value+=data.knight.tonnage.armor;
            //round the total tonnage to 2 decimals
            data.knight.tonnage.value=Math.round((data.knight.tonnage.value + Number.EPSILON) * 100) / 100
        }

        data.crew.ratingTotal=data.crew.rating+data.secChar.manoeuvrability.value;
        data.crew.jink=data.crew.ratingTotal+data.evasionMod;
    }
    _prepareHouseData(actorData){
        const data=this.system;
        //income
        data.wealth.income=parseInt(data.wealth.rating)*50;

    }
    preparePilot(){
        let data=this.system;
        if(data.crew.pilotID){
            if(game.actors){
                data.knight.pilot=game.actors.get(data.crew.pilotID);
                let pilot=data.knight.pilot;
                if(!pilot.isPrepared){
                    pilot.prepareData(); 
                }
                data.crew.ws=parseInt(pilot.system.characteristics.ws.total);
                data.crew.bs=parseInt(pilot.system.characteristics.bs.total);
                let operate=parseInt(pilot.system.skills[data.knight.operate]);
                if(isNaN(operate)){
                    operate=0;
                }
                data.crew.rating=operate;
            }

        }
    }
    prepareItems(data){
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
        //prepare weapons and powers
        let rangedWeapons=this.itemTypes.rangedWeapon;
        for(let i=0;i<rangedWeapons.length;i++){
            rangedWeapons[i].prepareData();
        }
        let meleeWeapons=this.itemTypes.meleeWeapon;
        for(let i=0;i<meleeWeapons.length;i++){
            meleeWeapons[i].prepareData();
        }
        let psychicPowers=this.itemTypes.psychicPower;
        for(let i=0;i<psychicPowers.length;i++){
            psychicPowers[i].prepareData();
        }
        //prepare skills
        let skills=this.itemTypes.skill;
        data.skills={};
        for(let i=0;i<skills.length;i++){
            skills[i].prepareData();
            let item=skills[i];
            item.system.total.value=0
            item.system.mod.value=parseInt(item._source.system.mod.value);
            let name="";
            if(item.system.parent.value){name+=item.system.parent.value.toLowerCase()+":"}
            name+=item.name.toLowerCase();

            name=name.replace(/\s/g,"");


            if(data.skillmods[name]){
                item.system.mod.value+=parseInt(data.skillmods[name]);
            }
            if(item.name==="Stealth"){
                item.system.mod.value+=data.secChar.size.stealth;  
            }

            if(item.name==="Parry"){
                item.system.mod.value+=data.evasionMod;
                if(parry){
                    item.system.mod.value+=parry;
                } 
            }
            if(item.name==="Dodge"){
                item.system.mod.value+=data.evasionMod;

            }

            if(this.getFlag("fortyk","fieldvivisection")&&item.name==="Medicae"){
                data.fieldVivisection=parseInt(item.system.value)+parseInt(item.system.mod.value);
            }
            item.system.total.value+=parseInt(item.system.value)+parseInt(item.system.mod.value)+parseInt(data.characteristics[item.system.characteristic.value].total);

            data.skills[name]=item.system.total.value;
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
        if(this.getFlag("fortyk","preternaturalspeed")){
            data.secChar.movement.charge=data.secChar.movement.half*6;
        }else{
            data.secChar.movement.charge=data.secChar.movement.half*3;
        }

        data.secChar.movement.run=data.secChar.movement.half*6;
    }
    prepare(){
        let preparedData = this
        if(!preparedData.isPrepared){
            preparedData.prepareData();
        }

        // Call prepareItems first to organize and process Items
        if(preparedData.type==='dwPC'||preparedData.type==='dhPC'||preparedData.type==='owPC'){
            this.preparePCItems(preparedData);
        }else if(preparedData.type==='npc'){
            this.prepareNPCItems(preparedData);
        }else if(preparedData.type==="spaceship"){
            this.prepareSpaceshipItems(preparedData);
        }else if(preparedData.type==="vehicle"){
            this.prepareVehicleItems(preparedData);
        }
        return preparedData;
    }
    //this prepares all items into containers that can be easily accessed by the html sheets, also adds in logic for sorting and all computing logic for items
    preparePCItems(actorData){
        let data=this.system;
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

        let psyniscience=0;
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem;
            if(!item.isPrepared){

                fortykItem.prepareData();
            }
            if(item._id===data.secChar.wornGear.armor.id){
                wornGear["armor"]=item;
            }
            if(item._id===data.secChar.wornGear.forceField.id){
                wornGear["forceField"]=item;
            }
            if(item.type=="skill"){



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
                    if(data.psykana.filter===item.system.discipline.value){
                        psychicPowers.push(item);
                    }
                }else{
                    psychicPowers.push(item);
                }
                if(item.system.favorite){
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

                // item.system.weight.total=(parseInt(item.system.amount.value)*parseFloat(item.system.weight.value)).toFixed(2);
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
                if(item.system.isEquipped){
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
                if(item.system.amount.value>=0){
                    equippableAmmo.push(item);
                }
            }
        })
        let sortedSkills=skills;
        let sortedTnt=talentsntraits;
        let sortedGear=wargear;
        actorData.skills=sortedSkills
        actorData.wargear=sortedGear
        actorData.cybernetics=cybernetics
        actorData.forceFields=forceFields
        actorData.mods=mods
        actorData.consummables=consummables
        actorData.psychicPowers=psychicPowers
        actorData.mutations=mutations
        actorData.malignancies=malignancies
        actorData.injuries=injuries
        actorData.disorders=disorders
        actorData.talentsntraits=sortedTnt
        actorData.missions=missions
        actorData.advancements=advancements
        actorData.meleeWeapons=meleeweapons
        actorData.rangedWeapons=rangedWeapons
        actorData.armors=armors
        actorData.ammunitions=ammunitions
        actorData.equippableAmmo=equippableAmmo
        actorData.wornGear=wornGear
        actorData.favoritePowers=favoritePowers;
        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    prepareNPCItems(actorData){
        let data=this.system;           
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
            let item=fortykItem;
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

        actorData.psychicPowers=psychicPowers
        actorData.meleeWeapons=meleeweapons
        actorData.rangedWeapons=rangedWeapons
        actorData.talentsntraits=talentsntraits
        actorData.armors=armors
        actorData.forceFields=forceFields

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    //sort spaceship items and apply light logic
    prepareSpaceshipItems(actorData){
        let data=this.system;
        const weapons=[];
        const components=[];
        const cargo=[];
        const squadrons=[];
        const torpedoes=[];
        const bombers=[];
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem;
            let unmodItem=item._source;
            if(item.type==="spaceshipComponent"){
                components.push(item);
            }else if(item.type==="spaceshipWeapon"){
                if(item.system.type.value==="Hangar"){
                    item.system.damage.value="1d10+"+Math.ceil(data.crew.rating/10);

                    let squadron=this.items.get(item.system.torpedo.id);
                    if(squadron){
                        if(squadron.system.halfstr.value){
                            item.system.torpedo.rating=squadron._source.system.rating.value-10;
                        }else{
                            item.system.torpedo.rating=squadron.system.rating.value;
                        }
                    }

                }
                if(item.system.type.value==="Torpedo"){
                    let torpedo=this.items.get(item.system.torpedo.id);
                    if(torpedo){
                        item.system.damage.value=torpedo.system.damage.value;
                        item.system.torpedo.rating=torpedo.system.rating.value;
                    }

                }
                components.push(item);
                weapons.push(item);
            }else if(item.type==="spaceshipCargo"){
                cargo.push(item);
                if(item.system.type.value==="Torpedoes"){
                    torpedoes.push(item);
                }
            }else if(item.type==="spaceshipSquadron"){
                if(item.system.halfstr.value){
                    item.system.rating.value=unmodItem.system.rating.value-10;
                }
                squadrons.push(item);
                if(item.system.type.value.toLowerCase()==="bomber"){
                    bombers.push(item);
                }
            }
        });

        actorData.weapons=weapons
        actorData.components=components
        actorData.cargo=cargo
        actorData.squadrons=squadrons
        actorData.torpedoes=torpedoes
        actorData.bombers=bombers

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData
    }
    prepareVehicleItems(actorData){
        let data=this.system;    

        const meleeWeapons=[];
        const rangedWeapons=[];
        const talentsntraits=[];
        const forceFields=[];
        const upgrades=[];
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem;
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
            if(item.type==="meleeWeapon"){
                meleeWeapons.push(item);
            }
            if(item.type==="rangedWeapon"){
                rangedWeapons.push(item);
            }
            if(item.type==="upgrade"){
                upgrades.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
            }
        })

        actorData.upgrades=upgrades
        actorData.meleeWeapons=meleeWeapons
        actorData.rangedWeapons=rangedWeapons
        actorData.talentsntraits=talentsntraits
        actorData.forceFields=forceFields

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    //function to sort the item containers for display
    _sortItems(itemContainers){
        let data=this;
        let sorts=system.sort;
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
        if(item.type==="skill"&&item.hasChildren){
            let skills=this.items.filter(function(item){return item.type==="skill"});
            for(let s of skills){                
                if(s.system.parent.value===item.name){
                    this.deleteEmbeddedDocuments("Item",[s._id]);
                }
            }
        }
        this.deleteEmbeddedDocuments("Item", [itemId]);
    }
    //calculate the parry bonus from a weapon, if no weapon returns -20
    weaponParry(weapon){
        if(jQuery.isEmptyObject(weapon)||weapon.type==="rangedWeapon"&&weapon.system.class.value!=="Pistol"){return -20}
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
        if(weapon.system.quality.value==="Best"){
            parry+=10;
        }else if(weapon.system.quality.value==="Good"){
            parry+=5;
        }else if(weapon.system.quality.value==="Poor"){
            parry-=10;
        }
        return parry; 
    }
    //when creating active effects check if they are transferred from an item, if so give the active effect flag to the item for referrence.
    _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId){
        console.log(embeddedName, documents, result, options, userId)
        if(game.user.isGM){
            if(embeddedName==="ActiveEffect"){
                let actor=this;
                documents.forEach(async function(item,i){
                    if(item&&item.origin){
                        let powerId=item.origin.split('.')[3];
                        let power=actor.getEmbeddedDocument("Item",powerId);
                        await power.update({"system.transferId":item.id})
                    }
                })
            }
            if(this.type==="knightHouse"){
                this.updateKnights();
            }
        }
        if(userId===game.user.id){
            if(embeddedName==="Item"){
                var actor=this;
                documents.forEach(async function(item,i){
                    if(item.type==="talentntrait"){
                        let flag=item.system.flagId.value;
                        let spec=item.system.specialisation.value;


                        if(spec==="N/A"){

                            await actor.setFlag("fortyk",flag,true);
                        }else{
                            let chosenSpec=await Dialog.prompt({
                                title: `Choose specialisation for ${item.name}`,
                                content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${item.system.specialisation.value}" autofocus/></p>`,



                                callback: async(html) => {
                                    const choosenSpec = $(html).find('input[name="spec"]').val();
                                    await actor.setFlag("fortyk",flag,choosenSpec);
                                    return choosenSpec;
                                },
                                render: (html)=>{
                                    document.getElementById('specInput').select();
                                },






                                width:100});
                            await item.update({"system.specialisation.value":chosenSpec});
                        }
                    }

                })
            } 
        }



        super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }

    _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId){

        if(this.dialog){
            this.dialog.updateDialog(this);
        }
        if(this.type==="knightHouse"){
            this.updateKnights();
        }
        if(documents[0].type==="skill"){
            if(this.system.riding){
                this.updateVehicle();
            }
        }

        super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }


    //when deleting talents, remove the flag associated with each of them.
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId){
        if(userId===game.user.id){
            let actor=this;
            if(embeddedName==="Item"){
                documents.forEach(async function(item,i){
                    if(item.type==="talentntrait"){
                        let flag=item.system.flagId.value;
                        await actor.setFlag("fortyk",flag,false); 
                    }else if(item.type==="advancement"){
                        let advType=item.system.type.value
                        let data=item.system;
                        if(advType==="Skill Upgrade"){
                            let skill=actor.getEmbeddedDocument("Item",data.itemId.value);
                            let skillAdv=parseInt(skill.system.value);
                            if(skillAdv===0){skillAdv=-20}else{skillAdv-=10}
                            skill.update({"system.value":skillAdv});
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
                            let charAdv=actor.system.characteristics[char].advance;
                            charAdv-=5;
                            let path=`system.characteristics.${char}.advance`;
                            let upd={}
                            upd[path]=charAdv;
                            actor.update(upd);
                        }else if(advType==="Psy Rating"){
                            let pr=actor.system.psykana.pr.value;
                            let newPr=pr-1;
                            actor.update({"system.psykana.pr.value":newPr});
                        }else if(advType==="Psychic Power"){
                            try{
                                await actor.setFlag("fortyk",data.flagId,false);
                                actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                            }catch(err){} 
                        }
                    }
                })
            }
            if(this.type==="knightHouse"){
                this.updateKnights();
            } 
        }

        super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
    }
    _onUpdate(changed, options, userId){
        if(this.system.riding){
            this.updateVehicle();
        }
        super._onUpdate(changed, options, userId);
    }
    async updateVehicle(){
        let actor=game.actors.get(this.system.riding.id);


        if(actor){
            actor.preparePilot();
            let apps=actor.apps;
            Object.values(apps).forEach(app => {
                app.render(true);
            }); 
        }



    }

    async updateKnights() {
        let actors=duplicate(this.system.knights);
        actors.push(this.id);
        for(let i=0;i<actors.length;i++){
            let actor=await game.actors.get(actors[i]);
            if(actor){
                let apps=actor.apps;
                Object.values(apps).forEach(app => {
                    app.render(true);
                }); 
            }

        }
        let socketOp={type:"renderSheets",package:{actors:actors}}
        await game.socket.emit("system.fortyk",socketOp);
    }
}