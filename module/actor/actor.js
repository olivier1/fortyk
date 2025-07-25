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

        if (data.type === "dwPC"){
            data["flags.fortyk.charactercreation"]=true;
        }

        if( data.type === "npc"){
            foundry.utils.mergeObject(data,
                                      {"prototypeToken.appendNumber":true                                      
                                      });

        }else if (data.type ==="dwPC" || data.type==="dhPC" || data.type==="owPC"){
            //initialise starting skills
            let startingSkills= await getSkills();
            for(let s of startingSkills){
                data.items.push(foundry.utils.duplicate(s));
            }

            // Set wounds, fatigue, and display name visibility
            foundry.utils.mergeObject(data,
                                      {"prototypeToken.bar1" :{"attribute" : "secChar.wounds"},                
                                       "prototypeToken.bar2" :{"attribute" : "secChar.fatigue"},               
                                       "prototypeToken.displayName" : CONST.TOKEN_DISPLAY_MODES.HOVER,   
                                       "prototypeToken.displayBars" : CONST.TOKEN_DISPLAY_MODES.HOVER,   
                                       "prototypeToken.disposition" : CONST.TOKEN_DISPOSITIONS.FRIENDLY,         
                                       "prototypeToken.name" : data.name,
                                       "prototypeToken.sight.enabled": true,
                                       "prototypeToken.actorLink": true
                                      });


        }else if(data.type==="spaceship"){
            //spaceships have different attributes but same stuff
            foundry.utils.mergeObject(data,
                                      {"prototypeToken.bar1" :{"attribute" : "hullIntegrity"},                 
                                       "prototypeToken.bar2" :{"attribute" : "crew"},               
                                       "prototypeToken.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    
                                       "prototypeToken.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    
                                       "prototypeToken.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         
                                       "prototypeToken.name" : data.name                                       
                                      });
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
                    token=this.getActiveTokens()[0];
                }
                if(newFatigue>=this.system.secChar.fatigue.max*2){
                    await game.fortyk.FortykRolls.applyDead(token,this,"fatigue");
                }else if(!this.getFlag("core","frenzy")&&!this.getFlag("core","unconscious")&&newFatigue>=this.system.secChar.fatigue.max){
                    let effect=[];
                    effect.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
                    let name=this.getName();
                    let chatUnconscious={author: game.user._id,
                                         speaker:{actor,alias:name},
                                         content:`${name} falls unconscious from fatigue!`,
                                         classes:["fortyk"],
                                         flavor:`Fatigue pass out`};
                    await ChatMessage.create(chatUnconscious,{});
                    await actor.createEmbeddedDocuments("ActiveEffect",effect);
                }
            }
            // Apply changes in Actor size to Token width/height
            let newSize= data["system.secChar.size.value"];
            if(!newSize){
                newSize=parseInt(data?.flags?.fortyk?.size)-1;
                if(newSize){
                    data["system.secChar.size.value"]=newSize;
                }
            }
            let wounds=false;

            wounds=data["system.secChar.wounds.value"];




            let vehicle=false;
            if(actorData.type==='vehicle'){
                vehicle=true;
            }
            if(vehicle){

                if(newSize && (newSize !== this.system.secChar.size.value)){
                    let size= 0;
                    size= game.fortyk.FORTYK.size[newSize].size;
                    let scale= game.fortyk.FORTYK.size[newSize].scale;
                    if ( this.isToken ) this.prototypeToken.update({height: size, width: size});
                    else if ( !data["prototypeToken.width"] && !foundry.utils.hasProperty(data, "prototypeToken.width") ) {
                        data["prototypeToken.height"] = size;
                        data["prototypeToken.width"] = size;
                        data["prototypeToken.texture.scaleX"] = scale;
                        data["prototypeToken.texture.scaleY"] = scale;
                    }
                }
            }else{
                if(wounds&&(this.system.horde.value||this.system.formation.value)||newSize){
                    if(this.system.horde.value||this.system.formation.value){
                        newSize= data["system.secChar.wounds.value"];
                        if(newSize<0){newSize=0;}
                    }else{

                    }
                    if ( (!this.system.horde.value&&!this.system.formation.value&&newSize && (newSize !== this.system.secChar.size.value))||((this.system.horde.value||this.system.formation.value)&&newSize!==undefined && (newSize !== this.system.secChar.wounds.value)) ) {
                        let size= 0;
                        let scale=1;
                        if(this.system.horde.value||this.system.formation.value){
                            size= FORTYKTABLES.hordeSizes[newSize];
                            if(this.isToken){
                                //modify token dimensions if scene ratio isnt 1
                                let gridRatio=canvas.dimensions.distance;
                                size=Math.max(1,size/gridRatio);
                            }

                        }else{
                            scale= game.fortyk.FORTYK.size[newSize].scale;
                            size= game.fortyk.FORTYK.size[newSize].size;
                        }
                        if ( this.isToken ) this.token.update({height: size, width: size});
                        else if ( !data["prototypeToken.width"] && !foundry.utils.hasProperty(data, "prototypeToken.width") ) {

                            data["prototypeToken.height"] = size;
                            data["prototypeToken.width"] = size;
                            data["prototypeToken.texture.scaleX"] = scale;
                            data["prototypeToken.texture.scaleY"] = scale;
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

        //this.reset();

        try {
            this.system = foundry.utils.duplicate(this._source.system);
            this.prepareBaseData();
            this.prepareEmbeddedEntities();
            this.prepareDerivedData();
            this.system.isPrepared=true;
        } catch (e) {
            console.log(e);
            ui.notifications.error(`Failed to prepare ${this.name}! Check log for details.`);
        }

    }
    prepareBaseData(){
        let actorData=this;
        if(actorData.flags.fortyk===undefined){actorData.flags.fortyk={};}
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
        data.reach=0;
        data.reactions=1;
        //prepare corruption for BC
        let corruption=data.secChar.corruption;
        if(game.settings.get("fortyk","bcCorruption")){
            corruption.value=parseInt(corruption.value)+parseInt(corruption.khorne)+parseInt(corruption.tzeentch)+parseInt(corruption.slaanesh)+parseInt(corruption.nurgle)+parseInt(corruption.malice); 
        }
        corruption.mod=FORTYKTABLES.malignancyModifiers[parseInt(data.secChar.corruption.value)];
        data.secChar.insanity.mod=FORTYKTABLES.traumaModifiers[parseInt(data.secChar.insanity.value)];
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
            let quad=this.getFlag("fortyk","quadruped");
            data.secChar.movement.mod=Math.max(0,(quad-4));
        }
        if(this.getFlag("fortyk","crawler")){
            data.secChar.movement.multi=parseInt(data.secChar.movement.multi)/2; 
        }
        if(this.getFlag("fortyk","psyrating")){
            data.psykana.pr.value=parseInt(this.getFlag("fortyk","psyrating"));
            data.psykana.disciplineSlots=game.fortyk.FORTYKTABLES.psyDisciplineSlots[data.psykana.pr.value];
            if(this.getFlag("fortyk","librariantraining")){
                data.psykana.disciplineSlots++;
            }
            let disciplines=data.psykana.disciplines;
            for(let i=0; i<data.psykana.disciplineSlots;i++){
                let discipline=disciplines[i];
                if(!discipline){
                    disciplines[i]="";
                }
            }

        }

        if(this.getFlag("fortyk","doubleteam")){
            data.secChar.attacks.gangup["1"]=20;
            data.secChar.attacks.gangup["2"]=30;
        }
        if(this.getFlag("fortyk","stepaside"))data.reactions++;
        for (let [key, char] of Object.entries(data.characteristics)){
            if(this.getFlag("fortyk",key+"UB")){
                char.uB=parseInt(this.getFlag("fortyk",key+"UB"));
            }
        }
        data.evasion=0;
        data.evasionMod=0;
        data.psykana.pr.sustain=data.psykana.pr.sustained.length;
        //initialize skill modifiers from active events so that they are integers
        this.items.forEach((fortykItem,id,items)=>{
            let item=fortykItem;
            if(item.type==="skill"){
                let name="";
                if(item.system.parent.value){name+=item.system.parent.value.toLowerCase()+":";}

                name+=item.name.toLowerCase();
                name=name.replace(/\s/g,"");
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
            height=this.prototypeToken.height;
            width=this.prototypeToken.width;
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
        data.reactions=1;
        //prepare base stats for imperial knights if they have a chassis selected
        if(data.knight.chassis){
            data.chassis=this.getEmbeddedDocument("Item",data.knight.chassis);
            let chassis=data.chassis.system;
            data.secChar.wounds.max=parseInt(chassis.structuralIntegrity.value);
            data.secChar.speed.tactical=parseInt(chassis.speed.value);
            data.secChar.manoeuvrability.value=parseInt(chassis.manoeuvrability.value);
            data.knight.armorValues={};
            data.knight.armorValues.value=0;
            data.knight.armorValues.max=parseInt(chassis.armor.value);
            data.knight.armorValues.sideMax=40;
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
            data.characteristics.inf.advance=0;
            data.carry.value=0;
            let forRaces=[];
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                item.system = foundry.utils.duplicate(item._source.system);
                item.applyActiveEffects();
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
                    data.characteristics.inf.advance= parseInt(data.characteristics.inf.advance)+parseInt(item.system.inf.value);
                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){

                    //total weight calcs
                    item.system.weight.total=(parseInt(item.system.amount.value)*parseFloat(item.system.weight.value)).toFixed(2);
                    data.carry.value=(parseFloat(data.carry.value)+parseFloat(item.system.weight.total)).toFixed(2);
                }
                var twohand=false;
                if(item.type==="rangedWeapon"){
                    if(!this.getFlag("fortyk","irongrip")){
                        if((this.getFlag("fortyk","firmgrip")&&item.system.class.value!=="Heavy")||item.system.class.value==="Pistol"||item.system.class.value==="Thrown"){

                        }else{

                            twohand=true;
                        }
                    }
                }
                if(item.type==="meleeWeapon"){
                    if(item.getFlag("fortyk","heavy")){

                        twohand=true;
                    }else if(!this.getFlag("fortyk","irongrip")){
                        if(item.system.class.value==="Melee Two-handed"){

                            twohand=true;
                        }
                    }

                }
                //check if equipped
                if(item.system.isEquipped){
                    if(item.getFlag("fortyk","encumbering")){
                        data.secChar.movement.mod-=item.getFlag("fortyk","encumbering");
                    }
                }
                if((item.type==="meleeWeapon"||item.type==="rangedWeapon")&&item.system.isEquipped){

                    if(item.system.isEquipped.indexOf("right")!==-1){
                        data.secChar.wornGear.weapons[1]=fortykItem; 
                        if(twohand){
                            data.secChar.wornGear.weapons[0]=fortykItem;
                        }
                    }else if(item.system.isEquipped.indexOf("left")!==-1){
                        data.secChar.wornGear.weapons[0]=fortykItem;  
                        if(twohand){
                            data.secChar.wornGear.weapons[1]=fortykItem;
                        }
                    }else if(item.system.isEquipped.includes("extra")){
                        let index=parseInt(item.system.isEquipped.substring(5));
                        data.secChar.wornGear.extraWeapons[index]=fortykItem;
                    }
                    /*if(twohand){
                        data.secChar.wornGear.weapons.push(item);
                    }*/
                }
                if(!this.getFlag("fortyk","homeinarmor")&&item.type==="armor"&&item.system.isEquipped){
                    data.secChar.wornGear.armor=item;
                    //set max agi from equipped armor

                    data.characteristics.agi.max=item.system.maxAgi.value;
                    if(item.getFlag("fortyk","irongrip")){
                        this.flags.fortyk.irongrip=true;
                    }else{
                        this.flags.fortyk.irongrip=false;
                    }

                }
                if(item.type==="forceField"&&item.system.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
            });
            //store known xenos for deathwatchtraining
            if(this.getFlag("fortyk","deathwatchtraining")){
                actorData.flags.fortyk.deathwatchtraining=forRaces;
            }
            if(this.getFlag("fortyk","fieldvivisection")){
                actorData.flags.fortyk.fieldvivisection=forRaces;
            }
            data.characteristics.inf.total=data.characteristics.inf.value+data.characteristics.inf.advance;
            data.experience.value=parseInt(data.experience.starting)+parseInt(data.experience.earned)-parseInt(data.experience.spent);
        }
        else if(actorData.type === 'npc'){
            this.applyActiveEffects();
            let items=this.items;
            const data=this.system;
            this.items.forEach((fortykItem,id,items)=>{
                let item=fortykItem;
                item.system = foundry.utils.duplicate(item._source.system);


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
                if(item.type==="rangedWeapon"||item.type==="meleeWeapon"){
                    item.system.isEquipped=true;
                }
                fortykItem.applyActiveEffects();
            });
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
                fortykItem.system = foundry.utils.duplicate(fortykItem._source.system);
                fortykItem.applyActiveEffects();
                fortykItem.prepareData();
                let item=fortykItem;
                if(item.type==="spaceshipComponent"||item.type==="spaceshipWeapon"){
                    data.power.value+=parseInt(item.system.power.value);
                    data.space.value+=parseInt(item.system.space.value);
                    data.shipPoints.spent+=parseInt(item.system.sp.value);
                }else if(item.type==="spaceshipCargo"){
                    data.cargo.value+=parseInt(item.system.space.value);
                    //item.system.pf.total=parseFloat(item.system.pf.value)*parseFloat(item.system.space.value);
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
                fortykItem.system = foundry.utils.duplicate(fortykItem._source.system);
                fortykItem.applyActiveEffects();
                fortykItem.prepareData();
                let item=fortykItem;
                if(item.type==="forceField"&&item.system.isEquipped){
                    data.secChar.wornGear.forceField=item;
                }
                if(item.type==="meleeWeapon"){
                    data.reach=Math.min(data.reach, item.system.range.value);
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
                fortykItem.system = foundry.utils.duplicate(fortykItem._source.system);
                fortykItem.applyActiveEffects();
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
        let selfPsy=[];
        this.effects.forEach(function(ae,id){
            if(!ae.disabled){
                if(actor.uuid===ae.origin){
                    
                    selfPsy.push(ae);
                    return;
                }
                var powerActor=fromUuidSync(ae.origin);
                
                let proceed=false;
                //check if ae is from an item if it origins drom a psychic power skip

                if(!ae.getFlag("fortyk","psy")&&ae.origin){

                    let itemId=ae.origin.split('.')[3];
                    let item=actor.getEmbeddedDocument("Item",itemId);

                    if(item){
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
                    }
                }else{
                    proceed=true;
                }
                //if item is equipped and/or not disabled
                if(proceed){
                    ae.changes.forEach(function(change,i){
                        let path=change.key.split(".");
                        let changeValue = change.value;
                        if(change.mode===CONST.ACTIVE_EFFECT_MODES.CUSTOM){

                            if(typeof changeValue==="string"){
                                if(changeValue.toLowerCase()==="true"){
                                    return setNestedKey(actorData,path,true); 
                                }else if(changeValue.toLowerCase()==="false"){
                                    return setNestedKey(actorData,path,false); 
                                }
                            }
                        }
                        if(ae.getFlag("fortyk","psy")){
                            let adjustment=ae.getFlag("fortyk","adjustment");
                            if(!powerActor.system.isPrepared){
                                let clone=powerActor.clone();
                                clone.prepareData();
                                powerActor=clone;
                            }
                            let actorPr=powerActor.system.psykana.pr.effective;
                            let scope=powerActor.getScope();
                            scope.pr=actorPr-adjustment;
                            try{
                                let changestr=changeValue;
                                changeValue=Math.ceil(math.evaluate(changestr,scope));

                            }catch (err){
                            }
                        }else if(actor.getFlag("fortyk","psyrating")){      
                            let pr=actor.system.psykana.pr.value+actor.system.psykana.pr.bonus-Math.max(0,actor.system.psykana.pr.sustain-1);
                            try{
                                let changestr=changeValue;
                                changeValue=Math.ceil(math.evaluate(changestr,{pr:pr}));

                            }catch (err){
                            }
                        }
                        let basevalue=parseFloat(objectByString(actorData,change.key));

                        let newvalue=parseFloat(changeValue);
                        /*if(newvalue>=0){
                            newvalue=Math.ceil(newvalue);
                        }else{
                            newvalue=Math.floor(newvalue);
                        }*/
                        if(isNaN(basevalue)||((!isNaN(basevalue)&&!isNaN(newvalue)))){
                            let changedValue=0;
                            if(change.mode===CONST.ACTIVE_EFFECT_MODES.MULTIPLY){
                                changedValue=basevalue*newvalue;
                                setNestedKey(actorData,path,changedValue);
                            }else if(change.mode===CONST.ACTIVE_EFFECT_MODES.ADD){
                                changedValue=basevalue+newvalue;
                                setNestedKey(actorData,path,changedValue);
                            }else if(change.mode===CONST.ACTIVE_EFFECT_MODES.DOWNGRADE){
                                if(changeValue<basevalue){
                                    changedValue=newvalue;
                                    setNestedKey(actorData,path,changedValue);
                                }
                            }else if(change.mode===CONST.ACTIVE_EFFECT_MODES.UPGRADE){
                                if(changeValue>basevalue){
                                    changedValue=newvalue;
                                    setNestedKey(actorData,path,changedValue);
                                }
                            }else if(change.mode===CONST.ACTIVE_EFFECT_MODES.OVERRIDE){
                                setNestedKey(actorData,path,newvalue);
                            }else if(change.mode===CONST.ACTIVE_EFFECT_MODES.CUSTOM){
                                setNestedKey(actorData,path,changeValue);
                            }
                        }else{
                            //custom mode
                            if(change.mode===CONST.ACTIVE_EFFECT_MODES.CUSTOM){
                                setNestedKey(actorData,path,changeValue);
                            }
                        }
                    });
                }
            }
        });
        if(selfPsy.length>0){

            for(let i=0;i<selfPsy.length;i++){
                let pr=this.system.psykana.pr.value+this.system.psykana.pr.bonus-Math.max(0,this.system.psykana.pr.sustain-1);
                let ae=selfPsy[i];
                let adjustment=ae.getFlag("fortyk","adjustment");

                pr=pr-adjustment;
                let selfScope=this.getScope();
                selfScope.pr=pr;
                ae.changes.forEach(function(change,i){
                    var changeValue = change.value;
                    if(ae.getFlag("fortyk","psy")){





                        try{

                            let changestr=changeValue;
                            changeValue=Math.ceil(math.evaluate(changestr,selfScope));
                        }catch (err){
                            console.log(err);
                        }
                    }
                    let basevalue=parseFloat(objectByString(actorData,change.key));

                    let newvalue=parseFloat(changeValue);
                    let path=change.key.split(".");
                    /*if(newvalue>=0){
                            newvalue=Math.ceil(newvalue);
                        }else{
                            newvalue=Math.floor(newvalue);
                        }*/
                    if((!isNaN(basevalue)&&!isNaN(newvalue))){
                        let changedValue=0;
                        if(change.mode===1){
                            changedValue=basevalue*newvalue;
                            setNestedKey(actorData,path,changedValue);
                        }else if(change.mode===2){
                            changedValue=basevalue+newvalue;
                            setNestedKey(actorData,path,changedValue);
                        }else if(change.mode===3){
                            if(changeValue<basevalue){
                                changedValue=newvalue;
                                setNestedKey(actorData,path,changedValue);
                            }
                        }else if(change.mode===4){
                            if(changeValue>basevalue){
                                changedValue=newvalue;
                                setNestedKey(actorData,path,changedValue);
                            }
                        }else if(change.mode===5){
                            setNestedKey(actorData,path,newvalue);
                        }else if(change.mode===0){
                            setNestedKey(actorData,path,changeValue);
                        }
                    }else{
                        if(change.mode===0){
                            setNestedKey(actorData,path,changeValue);
                        }
                    }
                });
            }
        }
    }
    prepareDerivedData() {
        const actorData = this;
        const data = this.system;
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'dwPC'||actorData.type === 'dhPC'||actorData.type === 'owPC') {this._prepareCharacterData(actorData);}
        else if (actorData.type === 'npc') {this._prepareNPCData(actorData);}
        else if (actorData.type === 'vehicle') {this._prepareVehicleData(actorData);}
        else if (actorData.type === 'owRegiment'){this._prepareRegimentData(actorData);}
        else if(actorData.type === 'knightHouse'){this._prepareHouseData(actorData);}
    }
    _prepareRegimentData(actorData){
        const data=this.system;
        data.characteristics.inf.total=parseInt(data.characteristics.inf.value)+parseInt(data.characteristics.inf.not)+parseInt(data.characteristics.inf.time)+parseInt(data.characteristics.inf.frontActive)+parseInt(data.characteristics.inf.war)+parseInt(data.characteristics.inf.mod);
    }
    /**
   * Prepare Character type specific data
   */
    _prepareCharacterData(actorData) {
        const data = this.system;
        //prepare characteristics data
        for (let [key, char] of Object.entries(data.characteristics)){
            if(key==="inf"){
                char.total=Math.min(char.total,char.max);
                char.preGlobal=char.total;
            }else{
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod);
                if(key==="agi"&&char.max!==100){
                    char.total=Math.min(char.total,char.max);
                }

                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);
                char.bonus*=char.bonusMulti;
                char.preGlobal=char.total;
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
        if(game.settings.get("fortyk","alternateWounds")){
            let tb = data.characteristics.t.bonus;
            let wpb = data.characteristics.wp.bonus;
            
            
            data.secChar.wounds.max=tb*wpb;
            let woundMod = parseInt(this.getFlag("fortyk","alternatewoundmodifier"));
            if(woundMod){
                data.secChar.wounds.max+=woundMod;
            }
        }
        if(this.getFlag("fortyk","soundconstitution")){
            data.secChar.wounds.max=parseInt(data.secChar.wounds.max)+2*data.characteristics.t.bonus;
        }
        data.secChar.wounds.max+=data.secChar.wounds.bonus;
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
        data.psykana.pr.effective=parseInt(data.psykana.pr.value)+parseInt(data.psykana.pr.bonus)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(game.fortyk.FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        //get max carry weight ensure it is not out of bounds
        if((data.characteristics.s.bonus+data.characteristics.t.bonus)>19){
            data.carry.max=game.fortyk.FORTYK.carry[19].carry+data.carry.mod;
        }else if((data.characteristics.s.bonus+data.characteristics.t.bonus)<=19){
            data.carry.max=game.fortyk.FORTYK.carry[(data.characteristics.s.bonus+data.characteristics.t.bonus)].carry+data.carry.mod;
        }else{
            data.carry.max=game.fortyk.FORTYK.carry[1].carry+data.carry.mod;
        }
        //get income based on influence for dark heresy PCs

        let inf=data.characteristics.inf.total;
        if(this.getFlag("fortyk","breedingcounts")){
            inf+=10;
        }
        data.currency.income=FORTYKTABLES.income[inf]; 

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
                hitLoc.armor=hitLoc.armor+5;
            }
            hitLoc.armor+=hitLoc.armorMod;
            hitLoc.armor+=hitLoc.psy;
            hitLoc.armor+=Math.max(machine,natural);
            hitLoc.armor=Math.max(0,hitLoc.armor);
            if(this.getFlag("fortyk","glancingblow")&&data.characteristics.agi.max===100){
                hitLoc.value=hitLoc.armor+data.characteristics.agi.bonus;
            }else{
                hitLoc.value=hitLoc.armor+data.characteristics.t.bonus;  
            }

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
                char.bonus*=char.bonusMulti;
                char.preGlobal=char.total;
                char.total+=parseInt(data.globalMOD.value);
                //char.total=Math.min(char.total,char.max);
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
        data.psykana.pr.effective=parseInt(data.psykana.pr.value)+parseInt(data.psykana.pr.bonus)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
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
            hitLoc.armor+=hitLoc.psy;
            hitLoc.armor+=Math.max(machine,natural);
            hitLoc.armor=Math.max(0,hitLoc.armor);
            if(this.getFlag("fortyk","glancingblow")&&data.characteristics.agi.max===100){
                hitLoc.value=hitLoc.armor+data.characteristics.agi.bonus;
            }else{
                hitLoc.value=hitLoc.armor+data.characteristics.t.bonus;  
            }
            let daemonic=this.getFlag("fortyk","daemonic");
            if(daemonic){
                if(!isNaN(daemonic)){
                    hitLoc.value+=parseInt(daemonic);
                }
            }
        }
        this.prepareItems(data);
    }
    async _prepareVehicleData(actorData){
        const data=this.system;


        let knight=data.knight;
        var armorRatio=1;
        this.preparePilot();
        var rightShield=0;
        var leftShield=0;
        if(knight.chassis){
            if(knight.core){
                data.knight.core=this.getEmbeddedDocument("Item",knight.core);

                data.knight.heat.cap+=parseInt(data.knight.core.system.heatCap.value);
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
                data.knight.armorValues.sideMax=Math.ceil(data.knight.armorValues.sideMax*parseFloat(data.knight.armor.system.armor.mod));
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
            if(knight.gyro){
                data.knight.gyro=this.getEmbeddedDocument("Item",knight.gyro);
                data.knight.space.value+=parseFloat(data.knight.gyro.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.gyro.system.weight.value);
            }
            if(knight.throneMod){
                data.knight.throneMod=this.getEmbeddedDocument("Item",knight.throneMod);
                data.knight.space.value+=parseFloat(data.knight.throneMod.system.space.value);
                data.knight.tonnage.value+=parseFloat(data.knight.throneMod.system.weight.value);
            }

            let chassis=this.getEmbeddedDocument("Item",knight.chassis);

            let hardPoints=chassis.system.hardPoints;

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
            let max=data.secChar.wounds.max;
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
            data.knight.tonnage.value=Math.round((data.knight.tonnage.value + Number.EPSILON) * 100) / 100;
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
                if(!pilot.system.isPrepared){
                    pilot.prepareData(); 
                }
                data.crew.ws=parseInt(pilot.system.characteristics.ws.total);
                data.crew.wsb=pilot.system.characteristics.ws.bonus;
                data.crew.bs=parseInt(pilot.system.characteristics.bs.total);
                data.crew.bsb=pilot.system.characteristics.bs.bonus;
                data.secChar.initiative=pilot.system.secChar.initiative;
                let operate=parseInt(pilot.system.skills[data.knight.operate]);
                if(isNaN(operate)){
                    operate=0;
                }
                data.crew.rating=operate;
            }

        }
    }
    prepareItems(data){
        //prepare wargear
        let wargears=this.itemTypes.wargear;
        wargears.forEach((wargear)=>wargear.prepareData());
        let cybernetics=this.itemTypes.cybernetic;
        cybernetics.forEach((cybernetic)=>cybernetic.prepareData());
        //prepare forcefields
        let forceFields=this.itemTypes.forceField;
        forceFields.forEach((forcefield)=>forcefield.prepareData());
        //prepare armor
        let armors=this.itemTypes.armor;
        armors.forEach((armor)=>armor.prepareData());
        //prepare ammunitions
        let ammunitions=this.itemTypes.ammunition;
        ammunitions.forEach((ammunition )=> ammunition.prepareData());
        //get worn weapon ids into an array so that they can be accessed by the sheet easily
        let wornWeapons=data.secChar.wornGear.weapons;
        if(!Array.isArray(data.secChar.wornGear.weapons)){
            wornWeapons=Object.values(data.secChar.wornGear.weapons);
        }
        var rightHandWeapon;
        try{
            rightHandWeapon= data.secChar.wornGear.weapons[0];
        }
        catch(err){rightHandWeapon= undefined;}
        var leftHandWeapon;
        try{
            leftHandWeapon= data.secChar.wornGear.weapons[1];
        }   
        catch(err){leftHandWeapon= undefined;}
        //prepare weapons and powers
        let rangedWeapons=this.itemTypes.rangedWeapon;
        for(let i=0;i<rangedWeapons.length;i++){
            rangedWeapons[i].prepareData();
            //pistols give you 1 reach
            if(rangedWeapons[i].system.isEquipped&&rangedWeapons[i].system.class.value==="Pistol"){
                this.system.reach=Math.max(this.system.reach, 1);
            }
        }
        let meleeWeapons=this.itemTypes.meleeWeapon;
        for(let i=0;i<meleeWeapons.length;i++){
            meleeWeapons[i].prepareData();
            //check reach
            if(meleeWeapons[i].system.isEquipped){
                this.system.reach=Math.max(this.system.reach, meleeWeapons[i].system.range.value);
            }
        }

        if(this.type!=="npc"){
            //figure out parry bonus from equipped weapons
            let leftParry=this.weaponParry(leftHandWeapon);
            let rightParry=this.weaponParry(rightHandWeapon);
            let parry=Math.max(leftParry,rightParry);

            //prepare skills
            let skills=this.itemTypes.skill;
            data.skills={};
            data.skillsTraining={};
            for(let i=0;i<skills.length;i++){
                skills[i].prepareData();
                let item=skills[i];
                item.system.total.value=0;
                item.system.mod.value=parseInt(item._source.system.mod.value);
                let name="";
                if(item.system.parent.value){name+=item.system.parent.value.toLowerCase()+":";}
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
                if(parseInt(item.system.value)>=0){
                    data.skillsTraining[name]=true; 
                }else{
                    data.skillsTraining[name]=false; 
                }

                data.skills[name]=item.system.total.value;
            }
        }
        let psychicPowers=this.itemTypes.psychicPower;
        for(let i=0;i<psychicPowers.length;i++){
            psychicPowers[i].prepareData();
        }

    }
    prepareMovement(data) {
        let size=data.secChar.size.value;
        data.secChar.size.label=game.fortyk.FORTYK.size[size].name;
        data.secChar.size.mod=game.fortyk.FORTYK.size[size].mod;
        data.secChar.size.movement=game.fortyk.FORTYK.size[size].movement;
        data.secChar.size.stealth=game.fortyk.FORTYK.size[size].stealth;
        if(this.getFlag("fortyk","flyer")){
            data.secChar.movement.half=Math.max(Math.ceil((parseInt(this.getFlag("fortyk","flyer"))+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1);
        }else if(this.getFlag("fortyk","hoverer")){
            data.secChar.movement.half=Math.max(Math.ceil((parseInt(this.getFlag("fortyk","hoverer"))+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1);
        }else{
            data.secChar.movement.half=Math.max(Math.ceil((data.characteristics.agi.bonus+data.secChar.size.movement+data.secChar.movement.mod)*parseFloat(data.secChar.movement.multi)),1); 
        }
        data.secChar.movement.full=data.secChar.movement.half*2;
        if(this.getFlag("fortyk","preternaturalspeed")){
            data.secChar.movement.charge=data.secChar.movement.half*6;
        }else{
            data.secChar.movement.charge=data.secChar.movement.half*3;
        }

        data.secChar.movement.run=data.secChar.movement.half*6;
    }
    async prepare(){
        let preparedData = this;
        if(!preparedData.system.isPrepared){
            preparedData.prepareData();
        }

        // Call prepareItems first to organize and process Items
        if(preparedData.type==='dwPC'||preparedData.type==='dhPC'||preparedData.type==='owPC'){
            await this.preparePCItems(preparedData);
        }else if(preparedData.type==='npc'){
            await this.prepareNPCItems(preparedData);
        }else if(preparedData.type==="spaceship"){
            await this.prepareSpaceshipItems(preparedData);
        }else if(preparedData.type==="vehicle"){
            await this.prepareVehicleItems(preparedData);
        }
        return preparedData;
    }
    //this prepares all items into containers that can be easily accessed by the html sheets, also adds in logic for sorting and all computing logic for items
    async preparePCItems(actorData){
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
        const eliteAdvances=[];
        let characterType;
        let characterSubtype;
        let role;
        let background;
        let planet;

        const wornGear={weapons:[],"armor":"","forceField":""};
        let unrelenting=false;

        let psyniscience=0;
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic



        for(const item of this.items){

            let hidden=item.getFlag("fortyk","hidden");
            if(game.user.isGM)hidden=false;
            if(item._id===data.secChar.wornGear.armor.id){
                wornGear.armor=item;
            }
            if(item._id===data.secChar.wornGear.forceField.id){
                wornGear.forceField=item;
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
                if(!hidden){
                    wargear.push(item); 
                }
            }
            if(item.type==="cybernetic"){
                cybernetics.push(item);
            }
            if(item.type==="forceField"){
                forceFields.push(item);
                if(!hidden){
                    wargear.push(item); 
                }
            }
            if(item.type==="mod"){
                mods.push(item);
                if(!hidden){
                    wargear.push(item); 
                }

            }
            if(item.type==="consummable"){
                consummables.push(item);
                if(!hidden){
                    wargear.push(item); 
                }
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
            if(item.type==="eliteAdvance"){
                let eaType=item.system.type.value;
                switch(eaType){
                    case "ea":
                        eliteAdvances.push(item);
                        break;
                    case "charactertype":
                        characterType=item;
                        break;
                    case "charactersubtype":
                        characterSubtype=item;
                        break;
                    case "background":
                        background=item;
                        break;
                    case "planet":
                        planet=item;
                        break;
                    case "role":
                        role=item;
                        break;
                }
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                //total weight calcs
                item.system.weight.total=(parseInt(item.system.amount.value)*parseFloat(item.system.weight.value)).toFixed(2);
                // item.system.weight.total=(parseInt(item.system.amount.value)*parseFloat(item.system.weight.value)).toFixed(2);
            }
            if(item.type==="meleeWeapon"){

                meleeweapons.push(item);
                if(!hidden){
                    wargear.push(item); 
                }
                await this.prepareAlternateProfiles(item);
            }
            if(item.type==="rangedWeapon"){
                await this.prepareAlternateProfiles(item);
                rangedWeapons.push(item);
                if(!hidden){
                    wargear.push(item); 
                }

            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
                if(item.system.isEquipped){
                    wornGear.weapons.push(item);
                }
            }
            if(item.type==="armor"){
                armors.push(item);
                if(!hidden){
                    wargear.push(item); 
                }
            }
            if(item.type==="ammunition"){
                ammunitions.push(item);
                if(!hidden){
                    wargear.push(item); 
                }
                if(item.system.amount.value>=0){
                    equippableAmmo.push(item);
                }
            }
        }
        let sortedSkills=skills;
        let sortedTnt=talentsntraits;
        let sortedGear=wargear;
        actorData.skills=sortedSkills;
        actorData.wargear=sortedGear;
        actorData.cybernetics=cybernetics;
        actorData.forceFields=forceFields;
        actorData.mods=mods;
        actorData.consummables=consummables;
        actorData.psychicPowers=psychicPowers;
        actorData.mutations=mutations;
        actorData.malignancies=malignancies;
        actorData.injuries=injuries;
        actorData.disorders=disorders;
        actorData.talentsntraits=sortedTnt;
        actorData.missions=missions;
        actorData.advancements=advancements;
        actorData.meleeWeapons=meleeweapons;
        actorData.rangedWeapons=rangedWeapons;
        actorData.armors=armors;
        actorData.ammunitions=ammunitions;
        actorData.equippableAmmo=equippableAmmo;
        actorData.wornGear=wornGear;
        actorData.favoritePowers=favoritePowers;
        actorData.eliteAdvances=eliteAdvances;
        actorData.characterType=characterType;
        actorData.characterSubtype=characterSubtype;
        actorData.role=role;
        actorData.background=background;
        actorData.planet=planet;
        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    async prepareAlternateProfiles(item) {

        if(item.getFlag("fortyk","alternateprofiles")){

            try {
                let profiles=item.getFlag("fortyk","profiles");
                let instancedProfiles=[];
                let copy=foundry.utils.duplicate(item._source);
                copy.uuid=item.uuid;
                instancedProfiles.push(copy);
                for(let i=0; i<profiles.length; i++){
                    if(typeof profiles[i] === 'string' || profiles[i] instanceof String){
                        let uuid=profiles[i];
                        let instance=await fromUuid(profiles[i]);

                        if(instance){
                            let instanceCopy=foundry.utils.duplicate(instance);
                            instancedProfiles.push(instanceCopy);
                        }


                    }

                }
                item.flags.fortyk.instancedProfiles=instancedProfiles;
            } catch (e) {
                item.flags.fortyk.instancedProfiles=[];
            }
        }
    }
    async prepareNPCItems(actorData){
        let data=this.system; 

        const psychicPowers=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const talentsntraits=[];
        const armors=[];
        const forceFields=[];
        const eliteAdvances=[];
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        for(const item of this.items){




            if(item.type==="talentntrait"){
                talentsntraits.push(item);
            }
            if(item.type==="armor"){
                armors.push(item);
            }
            if(item.type==="forceField"){
                forceFields.push(item);
            }
            if(item.type==="eliteAdvance"){
                eliteAdvances.push(item);
            }
            if(item.type==="psychicPower"){
                psychicPowers.push(item);
            }
            if(item.type==="meleeWeapon"){
                meleeweapons.push(item);
                await this.prepareAlternateProfiles(item);
            }
            if(item.type==="rangedWeapon"){

                rangedWeapons.push(item);
                await this.prepareAlternateProfiles(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
            }
        }

        actorData.psychicPowers=psychicPowers;
        actorData.meleeWeapons=meleeweapons;
        actorData.rangedWeapons=rangedWeapons;
        actorData.talentsntraits=talentsntraits;
        actorData.eliteAdvances=eliteAdvances;
        actorData.armors=armors;
        actorData.forceFields=forceFields;

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    //sort spaceship items and apply light logic
    async prepareSpaceshipItems(actorData){
        let data=this.system;
        const weapons=[];
        const components=[];
        const cargo=[];
        const squadrons=[];
        const torpedoes=[];
        const bombers=[];
        for(const item of this.items){

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
        }

        actorData.weapons=weapons;
        actorData.components=components;
        actorData.cargo=cargo;
        actorData.squadrons=squadrons;
        actorData.torpedoes=torpedoes;
        actorData.bombers=bombers;

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    async prepareVehicleItems(actorData){
        let data=this.system;    

        const meleeWeapons=[];
        const rangedWeapons=[];
        const talentsntraits=[];
        const forceFields=[];
        const upgrades=[];
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated
        //put all items in their respective containers and do some item logic
        for(const item of this.items){

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
                this.prepareAlternateProfiles(item);
            }
            if(item.type==="rangedWeapon"){
                rangedWeapons.push(item);
                this.prepareAlternateProfiles(item);
            }
            if(item.type==="upgrade"){
                upgrades.push(item);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){
            }
        }

        actorData.upgrades=upgrades;
        actorData.meleeWeapons=meleeWeapons;
        actorData.rangedWeapons=rangedWeapons;
        actorData.talentsntraits=talentsntraits;
        actorData.forceFields=forceFields;

        try{
            this._sortItems(actorData);
        }catch(err){}
        return actorData;
    }
    //function to sort the item containers for display
    _sortItems(itemContainers){
        let data=this.system;
        let sorts=data.sort;
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
        });
    }
    //this function deletes items from an actor, certain items need more logic to process
    deleteItem(itemId){
        let item=this.items.get(itemId);
        //iterate through skills to delete all the children of a group skill
        if(item.type==="skill"&&item.hasChildren){
            let skills=this.items.filter(function(item){return item.type==="skill";});
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
        if(jQuery.isEmptyObject(weapon)||weapon.type==="rangedWeapon"&&weapon.system.class.value!=="Pistol"){return -20;}
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
    async _createEliteAdvanceBonuses(itemData) {
        let bonuses=itemData.system.items;
        let bonusesInstances=[];
        let actor=this;
        await this.setFlag("fortyk",itemData.system.flagId.value,true);

        for(const bonus of bonuses){
            let currentInstance=await fromUuid(bonus.uuid);
            let cloneCurrentInstance=foundry.utils.duplicate(currentInstance);
            if(currentInstance.type==="talentntrait"){
                let spec=currentInstance.system.specialisation.value;
                let flag=cloneCurrentInstance.system.flagId.value;
                if(actor.getFlag("fortyk",flag)){
                    continue;
                }
                if(spec==="N/A"){

                    //await this.setFlag("fortyk",flag,true);
                }else{
                    cloneCurrentInstance.system.specialisation.value=bonus.spec;
                    //await actor.setFlag("fortyk",flag,bonus.spec);


                }
            }else if(currentInstance.type==="psychicPower"){
                //actor.setFlag("fortyk", currentInstance.id, true);
            }
            if(bonus.amount){
                cloneCurrentInstance.system.amount.value=bonus.amount;
            }
            bonusesInstances.push(cloneCurrentInstance);
        }


        if(this.type==="npc"){
            let instancedBonuses= await this.createEmbeddedDocuments("Item",bonusesInstances);
            let bonusIds=instancedBonuses.map((bonus)=> bonus.id);
            let parent=this.itemTypes.eliteAdvance.filter((item)=>item.system.flagId.value===itemData.system.flagId.value);
            await parent[0].update({"system.itemIds":bonusIds});
            return;
        }
        if(itemData.system.type.value==="characterType"){
            await actor.setFlag("fortyk","hasinfluence",itemData.system.characteristics.hasInfluence);
        }
        if(itemData.system.type.value==="ea"){
            let corruption = itemData.system.characteristics.cor;
            if(corruption){
                let corRoll=new Roll(corruption);
                await corRoll.evaluate();
                corRoll.toMessage({
                    flavor:`Rolling corruption for ${itemData.name}`,
                    author: game.user.id
                });
                let corValue=corRoll.total;
                let actorCorruption=parseInt(this.system.secChar.corruption.value);
                actorCorruption+=corValue;
                await actor.update({"system.secChar.corruption.value":actorCorruption});
            }
            let insanity = itemData.system.characteristics.ins;
            if(insanity){
                let insRoll=new Roll(insanity);
                await insRoll.evaluate();
                insRoll.toMessage({
                    flavor:`Rolling insanity for ${itemData.name}`,
                    author: game.user.id
                });
                let insValue=insRoll.total;
                let actorInsanity=parseInt(this.system.secChar.insanity.value);
                actorInsanity+=insValue;
                await actor.update({"system.secChar.insanity.value":actorInsanity});
            }
        }

        let aptitude=itemData.system.aptitude.value;
        let splitAptitudes=aptitude.split(",");
        let aptitudes=foundry.utils.duplicate(this.system.aptitudes);
        let replacedOnce=false;
        for(let apti of splitAptitudes){
            let i=0;
            let replaced=false;
            while(i<=7&&!replaced){
                let apt=aptitudes[i];
                if(apt===""){
                    replaced=true;
                    replacedOnce=true;
                    aptitudes[i]=apti;
                }
                i++;
            }
        }

        if(replacedOnce){await this.update({"system.aptitudes":aptitudes});}
        let skills=itemData.system.skills;
        if(skills){
            let splitSkills=skills.split(",");
            let actorSkills=actor.itemTypes.skill;

            for(const skill of splitSkills){
                let skillData={system:{}};
                let name;
                let parent="";
                if(skill.indexOf(":")!==-1){
                    let parentChild=skill.split(":");
                    skillData.system.parent={value:parentChild[0]};
                    name=parentChild[1];
                    parent=parentChild[0];
                }else{
                    name=skill;
                }
                let instance=actorSkills.find((skill)=> (skill.name.toLowerCase()===name.toLowerCase()&&parent.toLowerCase()===skill.system.parent.value.toLowerCase()));
                if(instance){
                    let training=instance.system.value;
                    if(training<0){
                        training=0;
                    }else{
                        training+=10;
                        training=Math.min(training,30);
                    }
                    await instance.update({"system.value":training});
                }else{
                    skillData.name=name;
                    skillData.system.value=0;
                    skillData.type="skill";
                    let aptitudes="";
                    let description="";
                    if(skillData.system.parent){
                        let parent=actorSkills.find((skill)=> skill.name.toLowerCase()===skillData.system.parent.value.toLowerCase());
                        if(parent){
                            aptitudes=parent.system.aptitudes.value;
                            description=parent.system.description.value;
                        }
                    }
                    skillData.system.aptitudes={"value":aptitudes};
                    skillData["system.description.value"]=description;
                    bonusesInstances.push(skillData);
                }
            }

        }
        let instancedBonuses= await this.createEmbeddedDocuments("Item",bonusesInstances);
        let bonusIds=instancedBonuses.map((bonus)=> bonus.id);
        let parent=this.itemTypes.eliteAdvance.filter((item)=>item.system.flagId.value===itemData.system.flagId.value);
        await parent[0].update({"system.itemIds":bonusIds});

    }
    async createEmbeddedDocuments(embeddedName, data=[], operation={}){
        let eliteAdvances=[];
        let flags={};
        for(const [index, itemData] of data.entries()){
            if(itemData?.type==="eliteAdvance"){
                if(this.getFlag("fortyk",itemData.system.flagId.value)){
                    data.splice(index, 1);
                    continue;
                }
                eliteAdvances.push(itemData);
            }else if(itemData.type==="talentntrait"){
                let spec=itemData.system.specialisation.value;
                let flag=itemData.system.flagId.value;
                let updateString=`flags.fortyk.${flag}`;
                if(spec!=="N/A"){

                    flags[updateString]=spec;
                }else{
                    flags[updateString]=true;
                }
            }else if(itemData.type==="psychicPower"){
                flags[`flags.fortyk.${itemData._id}`]=true;
            }
        }
        await this.update(flags);
        for(const ea of eliteAdvances){
            this._createEliteAdvanceBonuses(ea);
        }







        return super.createEmbeddedDocuments(embeddedName, data, operation);
    }
    _onCreateDescendantDocuments(parent, collection, documents, data, options, userId){


        if(this.type==="knightHouse"){
            this.updateKnights();
        }

        super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    }
    _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId){

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

        super._onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);
    }
    //when deleting talents, remove the flag associated with each of them.
    _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId){
        if(userId===game.user.id){
            let actor=this;
            if(collection==="items"){
                documents.forEach(async function(item,i){

                    if(item.type==="talentntrait"){
                        let flag=item.system.flagId.value;
                        await actor.setFlag("fortyk",flag,false);
                    }else if(item.type==="eliteAdvance"){
                        let flag=item.system.flagId.value;
                        let skills= item.system.skills;
                        if(skills){
                            let splitSkills=skills.split(",");
                            let actorSkills=actor.itemTypes.skill;

                            for(const skill of splitSkills){

                                let name;
                                let parent="";
                                if(skill.indexOf(":")!==-1){
                                    let parentChild=skill.split(":");

                                    name=parentChild[1];
                                    parent=parentChild[0];
                                }else{
                                    name=skill;
                                }
                                let instance=actorSkills.find((skill)=> (skill.name.toLowerCase()===name.toLowerCase()&&parent.toLowerCase()===skill.system.parent.value.toLowerCase()));
                                if(instance){
                                    let training=instance.system.value;
                                    if(training===0){
                                        training=-20;
                                    }else{
                                        training-=10;
                                    }
                                    await instance.update({"system.value":training});
                                }
                            }

                        }
                        let aptitudeString=item.system.aptitude.value;
                        //remove the last X many aptitudes, X is the number of aptitudes the EA gives
                        if(aptitudeString){
                            let aeAptitudes=aptitudeString.split(",");
                            let actorAptitudes=actor.system.aptitudes;
                            let aptitudesKeys=Object.keys(actorAptitudes);
                            aptitudesKeys.reverse();
                            let count=0;
                            for(let i=0; i<aptitudesKeys.length;i++){
                                let index=aptitudesKeys[i];
                                let actorAptitude=actorAptitudes[index];
                                if(actorAptitude){
                                    actorAptitudes[index]="";
                                    count++;
                                    if(count===aeAptitudes.length){
                                        break;
                                    }
                                }
                            }
                            await actor.update({"system.aptitudes":actorAptitudes});
                        }
                        await actor.deleteEmbeddedDocuments("Item",item.system.itemIds);
                        await actor.setFlag("fortyk",flag,false);
                    }else if(item.type==="advancement"){
                        let advType=item.system.type.value;
                        let data=item.system;
                        if(advType==="Skill Upgrade"){
                            let skill=actor.getEmbeddedDocument("Item",data.itemId.value);
                            let skillAdv=parseInt(skill.system.value);
                            if(skillAdv===0){skillAdv=-20;}else{skillAdv-=10;}
                            await skill.update({"system.value":skillAdv});
                        }else if(advType==="New Skill"){
                            try{
                                await actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                            }catch(err){}
                        }else if(advType==="Talent"){
                            try{
                                await actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                            }catch(err){}
                        }else if(advType==="Characteristic Upgrade"){
                            let char=data.characteristic.value;
                            let charAdv=actor.system.characteristics[char].advance;
                            charAdv-=5;
                            let path=`system.characteristics.${char}.advance`;
                            let upd={};
                            upd[path]=charAdv;
                            await actor.update(upd);
                        }else if(advType==="Psy Rating"){
                            let pr=actor.system.psykana.pr.value;
                            let newPr=pr-1;
                            let tnts=actor.itemTypes.talentntrait;
                            let prObject=tnts.find((tnt)=> (tnt.name.toLowerCase()==="psy rating"));
                            await prObject.update({"system.specialisation.value":newPr});
                        }else if(advType==="Psychic Power"){
                            try{
                                await actor.setFlag("fortyk",data.flagId,false);
                                await actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                            }catch(err){} 
                        }else if(advType==="Elite Advance"){
                            try{
                                await actor.deleteEmbeddedDocuments("Item",[data.itemId.value]);
                            }catch(err){} 
                        }
                    }
                });
            }
            if(this.type==="knightHouse"){
                this.updateKnights();
            } 
        }

        super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    }
    _onUpdate(changed, options, userId){
        if(this.system.riding){
            this.updateVehicle();
        }
        //handle if psy rating changed to update sustained powers
        let psy;
        try{
            psy=changed.system.psykana.pr.sustained;
        }catch(err){}
        if(psy!==undefined){
            this.updateSustainedActors();
        }
        let pr;
        try{
            pr=changed.system.psykana.pr.bonus;
        }catch(err){}

        if(pr!==undefined){
            this.updateSustainedActors();
        }
        try{
            pr=changed.system.psykana.pr.value;
        }catch(err){}
        if(pr!==undefined){
            this.updateSustainedActors();
        }
        super._onUpdate(changed, options, userId);
    }
    updateSustainedActors(){

        let sustained=this.system.psykana.pr.sustained;
        let actors=[];
        for(let i=0; i<sustained.length; i++){
            let power=this.getEmbeddedDocument("Item", sustained[i]);
            if(power.system.sustain.value === "No")continue;
            let effectIds=power.getFlag("fortyk","sustained");
            for(let j=0; j<effectIds.length; j++){
                let effect=fromUuidSync(effectIds[j]);
                if(effect){
                    let effectActor=effect.parent;

                    if(effectActor.id!==this.id){
                        effectActor._initialize(); 
                    }
                    let apps=effectActor.apps;
                    Object.values(apps).forEach(app => {
                        app.render(true, {focus:false});
                    }); 
                    actors.push(effectActor.uuid);
                }

            }
        }
        let socketOp={type:"prepActors",package:{actors:actors}};
        game.socket.emit("system.fortyk",socketOp);
    }
    async updateVehicle(){
        let actor=game.actors.get(this.system.riding.id);


        if(actor){
            actor.preparePilot();
            let apps=actor.apps;
            Object.values(apps).forEach(app => {
                app.render(true, {focus:false});
            }); 
        }



    }
    async updateKnights() {
        let actors=foundry.utils.duplicate(this.system.knights);
        actors.push(this.id);
        for(let i=0;i<actors.length;i++){
            let actor=await game.actors.get(actors[i]);
            if(actor){
                let apps=actor.apps;
                Object.values(apps).forEach(app => {
                    app.render(true, {focus:false});
                }); 
            }

        }
        let socketOp={type:"renderSheets",package:{actors:actors}};
        await game.socket.emit("system.fortyk",socketOp);
    }
    getRepairs(){
        if(this.type!=="vehicle"){return false;}
        let repairs=[];
        if(this.getFlag("fortyk","firedamage")){
            repairs.push({label:"Seconds of Fire Damage",amount:this.getFlag("fortyk","firedamage"),type:"firedamage"});
        }
        let integrity=this.system.secChar.wounds;

        //check for damage in each threshold
        let current=integrity.value;
        //1st threshold
        let max=integrity.max;
        let thresh1=integrity.thresholds["1"];
        let thresh1dmg=0;
        let disabled1=false;
        if(current>=thresh1){
            thresh1dmg=max-current;
        }else{
            disabled1=true;
            thresh1dmg=max-thresh1;
        }
        if(thresh1dmg>0){
            repairs.push({label:"First Threshold Damage",amount:thresh1dmg,type:"firstthresholddmg", disabled:disabled1});
        }
        //2nd threshold
        let thresh2=integrity.thresholds["2"];
        let thresh2dmg=0;
        let disabled2=false;
        if(current>=thresh2){
            thresh2dmg=thresh1-current;
        }else{
            disabled2=true;
            thresh2dmg=thresh1-thresh2;
        }
        if(thresh2dmg>0){
            repairs.push({label:"Second Threshold Damage",amount:thresh2dmg,type:"secondthresholddmg", disabled:disabled2});
        }
        //3rd threshold
        let thresh3=integrity.thresholds["3"];
        let thresh3dmg=0;
        let disabled3=false;
        if(current>=thresh3){
            thresh3dmg=thresh2-current;
        }else{
            disabled3=true;
            thresh3dmg=thresh2-thresh3;
        }
        if(thresh3dmg>0){
            repairs.push({label:"Third Threshold Damage",amount:thresh3dmg,type:"thirdthresholddmg", disabled:disabled3});
        }
        //4th threshold
        let thresh4=integrity.thresholds["4"];
        let thresh4dmg=0;
        let disabled4=false;
        if(current>=0){
            thresh4dmg=thresh3-current;
        }else{
            disabled4=true;
            thresh4dmg=thresh3;
        }
        if(thresh4dmg>0){
            repairs.push({label:"Fourth Threshold Damage",amount:thresh4dmg,type:"fourththresholddmg", disabled:disabled4});
        }
        //critical damage
        if(current<0){
            repairs.push({label:"Critical Damage",amount:-current,type:"criticaldmg"});
        }
        //setup armor damage tracking
        let frontArmorDmg={amount:0,
                           effectIds:[],
                           label:"Front armor damage",
                           type:"armordmg"};
        let leftSideArmorDmg={amount:0,
                              effectIds:[],
                              label:"Left side armor damage",
                              type:"armordmg"};
        let rightSideArmorDmg={amount:0,
                               effectIds:[],
                               label:"Right side armor damage",
                               type:"armordmg"};
        let rearArmorDmg={amount:0,
                          effectIds:[],
                          label:"Rear armor damage",
                          type:"armordmg"};
        //check AEs for AEs tagged as repair
        let AEs=this.effects;
        AEs.forEach(function(effect){
            if(effect.getFlag("fortyk","repair")){
                if(effect.getFlag("fortyk","repair")==="armordmg"){
                    let change=effect.changes[0];
                    switch(change.key){
                        case "system.facings.front.armor":
                            frontArmorDmg.amount+=Math.abs(change.value);
                            frontArmorDmg.effectIds.push(effect.uuid);
                            break;
                        case "system.facings.rSide.armor":
                            rightSideArmorDmg.amount+=Math.abs(change.value);
                            rightSideArmorDmg.effectIds.push(effect.uuid);
                            break;
                        case "system.facings.lSide.armor":
                            leftSideArmorDmg.amount+=Math.abs(change.value);
                            leftSideArmorDmg.effectIds.push(effect.uuid);
                            break;
                        case "system.facings.rear.armor":
                            rearArmorDmg.amount+=Math.abs(change.value);
                            rearArmorDmg.effectIds.push(effect.uuid);
                            break;
                    }
                }else{
                    repairs.push({label:effect.name,type:effect.getFlag("fortyk","repair"),amount:Math.abs(parseInt(effect.changes[0].value)),uuid:effect.uuid});
                }



            }
        });
        if(frontArmorDmg.amount>0){
            repairs.push(frontArmorDmg);
        }
        if(leftSideArmorDmg.amount>0){
            repairs.push(leftSideArmorDmg);
        }
        if(rightSideArmorDmg.amount>0){
            repairs.push(rightSideArmorDmg);
        }
        if(rearArmorDmg.amount>0){
            repairs.push(rearArmorDmg);
        }
        //check items for damage and repair active effects
        let items=this.items;
        items.forEach(function(item){
            if(!item.system.state){
                return;
            }
            if(item.type==="forceField"){
                if(item.system.state.value==="D"){
                    repairs.push({label:`${item.name} Damaged`,amount:1,type:"damagedionshield",uuid:item.uuid});
                }
                if(item.system.state.value==="X"){
                    repairs.push({label:`${item.name} Destroyed`,amount:1,type:"destroyedionshield",uuid:item.uuid});
                }
            }else if((item.type==="rangedWeapon"||item.type==="meleeWeapon")&&(item.system.class.value==="Titanic Ranged Weapon"||item.system.class.value==="Titanic Artillery Weapon"||item.system.class.value==="Titanic Melee Weapon")){
                if(item.system.state.value==="D"){
                    repairs.push({label:`${item.name} Damaged`,amount:1,type:"damagedcomponent",rarity:item.system.rarity.value,uuid:item.uuid});
                }
                if(item.system.state.value==="X"){
                    repairs.push({label:`${item.name} Destroyed`,amount:1,type:"refittitanicweapon",uuid:item.uuid});
                }
            }else{
                if(item.system.state.value==="D"){
                    repairs.push({label:`${item.name} Damaged`,amount:1,type:"damagedcomponent",rarity:item.system.rarity.value,uuid:item.uuid});
                }
                if(item.system.state.value==="X"){
                    repairs.push({label:`${item.name} Destroyed`,amount:Math.max(1,parseInt(item.system.space.value)),type:"install/removecomponent",uuid:item.uuid});
                }
            }

            if(item.type==="knightCore"){
                let quality=item.system.quality.value;
                let maxInt=game.fortyk.FORTYK.coreIntegrities[quality];
                let state=parseInt(item.system.state.value);
                let coreDmg=maxInt-state;
                if(coreDmg>0){
                    repairs.push({label:`${item.name} Damaged`,amount:coreDmg,type:"damagedcore",uuid:item.uuid}) ;
                }
            }
            let itemEffects=item.effects;
            itemEffects.forEach(function(effect){
                if(effect.getFlag("fortyk","repair")){
                    let amount=effect.changes[0]?.value;
                    if(amount<1){amount=1;}
                    repairs.push({label:`${item.name}: ${effect.name}`,type:effect.getFlag("fortyk","repair"),amount,uuid:effect.uuid});


                }
            });
        });

        return repairs;
    }
    getName(){
        let name;
        if(this.isToken){
            name=this.token.name;
        }else{
            name=this.name;
        }
        return name;
    }
    getScope(){
        let system=this.system;
        let characteristics=system.characteristics;
        if(this.type==="vehicle"||this.type==="spaceship")return {};
        let pr=system.psykana.pr.effective;
        if(!this.system.isPrepared){
            for (let [key, char] of Object.entries(characteristics)){
                if(key==="inf"){
                    char.total=Math.min(char.total,char.max);
                    char.preGlobal=char.total;
                }else{
                    char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod);
                    if(key==="agi"&&char.max!==100){
                        char.total=Math.min(char.total,char.max);
                    }

                    char.bonus=Math.floor(char.total/10)+parseInt(char.uB);
                    char.bonus*=char.bonusMulti;
                    char.preGlobal=char.total;
                    char.total+=parseInt(system.globalMOD.value);

                }
            }
            pr=parseInt(system.psykana.pr.value)+parseInt(system.psykana.pr.bonus)-(Math.max(0,(parseInt(system.psykana.pr.sustain)-1)));
        }

        return {
            wsb:characteristics.ws.bonus,
            ws:characteristics.ws.total,
            bsb:characteristics.bs.bonus,
            bs:characteristics.bs.total,
            sb:characteristics.s.bonus,
            s:characteristics.s.total,
            tb:characteristics.t.bonus,
            t:characteristics.t.total,
            perb:characteristics.per.bonus,
            per:characteristics.per.total,
            intb:characteristics.int.bonus,
            int:characteristics.int.total,
            agib:characteristics.agi.bonus,
            agi:characteristics.agi.total,
            wpb:characteristics.wp.bonus,
            wp:characteristics.wp.total,
            felb:characteristics.fel.bonus,
            fel:characteristics.fel.total,
            infb:characteristics.inf.bonus,
            inf:characteristics.inf.total,
            insb:Math.floor(system.secChar.insanity.value/10),
            ins:system.secChar.insanity.value,
            corrb:Math.floor(system.secChar.corruption.value/10),
            corr:system.secChar.corruption.value,
            pr:pr
        };


    }
    deleteAfterAttackEffects(){
        for(const effect of this.effects){
            if(effect.getFlag("fortyk","expireafterattack")){
                effect.delete();
            }
        }
        for(const item of this.items){
            for(const effect of item.effects){
                if(effect.getFlag("fortyk","expireafterattack")){
                    effect.delete();
                }
            }
        }
    }
}