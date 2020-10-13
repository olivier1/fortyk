
import {getSkills} from "../utilities.js";
import {FORTYK} from "../FortykConfig.js";
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
        //give token the right attribute bars

        //initialise starting skills
        let startingSkills= await getSkills();
        if (data.type !=="npc"){
            for(let s of startingSkills){
                data.items.push(s);
            }
        }

        //resume actor creation
        super.create(data, options);
    }
    //@Override the update function to modify token size for hordes and larger entities
    async update(data, options={}) {

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
                size= FORTYK.size[newSize].size;
            }

            if ( this.isToken ) this.token.update({height: size, width: size});
            else if ( !data["token.width"] && !hasProperty(data, "token.width") ) {
                data["token.height"] = size;
                data["token.width"] = size;
            }
        }



        return super.update(data, options);
    }
    /**
   * Augment the basic actor data with additional dynamic data.
   */
    prepareData() {



        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;
        //set default flags
        flags["truegrit"]=false;
        flags["atsknf"]=false;
        flags["diehard"]=false;
        if(flags["unrelenting"]===undefined){flags["unrelenting"]=false};

        if(data.skillFilter===undefined){
            data.skillFilter="";

        }

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.

        if (actorData.type === 'dwPC') this._prepareCharacterData(actorData);
        if (actorData.type === 'npc') this._prepareNPCData(actorData);
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
                char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod)+parseInt(data.globalMOD.value);
                char.bonus=Math.floor(char.total/10)+parseInt(char.uB);  
            }

        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        //modify total characteristics depending on fatigue
        var fatigueMult=1;
        if(actorData.flags["unrelenting"]){
            fatigueMult=2;
        }
        for (let [key,char] of Object.entries(data.characteristics)){
            if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.total/2);
            }
        }
        //initialise cybernetics
        for (let [key, hitLoc] of Object.entries(data.characterHitLocations)){
            hitLoc.cyber=false;
        }
        //prepare psyker stuff
        data.psykana.pr.effective=parseInt(data.psykana.pr.value)-(Math.max(0,(parseInt(data.psykana.pr.sustain)-1)));
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.effective)+parseInt(FORTYK.psykerTypes[data.psykana.psykerType.value].push);

        //movement

        let size=data.secChar.size.value;
        data.secChar.size.label=FORTYK.size[size].name;
        data.secChar.size.mod=FORTYK.size[size].mod;
        data.secChar.size.movement=FORTYK.size[size].movement;
        data.secChar.size.stealth=FORTYK.size[size].stealth
        //movement
        data.secChar.movement.half=data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod;
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;
        data.secChar.movement.half=data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod;
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;

        //add up all armor and stuff
        var armor= this.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.armor._id);
        var rightHandWeapon= this.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.weapons[0]);
        var leftHandWeapon= this.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.weapons[1]);
        //handle shields
        data.characterHitLocations.body.shield= 0;
        data.characterHitLocations.rArm.shield= 0;
        data.characterHitLocations.lArm.shield= 0;
        if(rightHandWeapon!==null&&rightHandWeapon.type!=="rangedWeapon"){

            data.characterHitLocations.rArm.shield= parseInt(rightHandWeapon.data.shield.value);

            data.characterHitLocations.body.shield= Math.max(data.characterHitLocations.body.shield,parseInt(rightHandWeapon.data.shield.value));
        }
        if(leftHandWeapon!==null&&leftHandWeapon.type!=="rangedWeapon"){
            data.characterHitLocations.lArm.shield= parseInt(leftHandWeapon.data.shield.value);
            data.characterHitLocations.body.shield= 0;
            data.characterHitLocations.body.shield= Math.max(data.characterHitLocations.body.shield,parseInt(leftHandWeapon.data.shield.value));
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
        }

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
        //apply logic to items that depends on actor data so that it updates readily when the actor is updated

        //put all items in their respective containers and do some item logic
        for(let item of actorData.items){



            if(item._id===data.secChar.wornGear.armor._id){
                wornGear["armor"]=item;
            }
            if(item._id===data.secChar.wornGear.forceField._id){
                wornGear["forceField"]=item;
            }
            if(item.type=="skill"){

                item.data.total.value=parseInt(item.data.value)+parseInt(item.data.mod.value)+parseInt(data.characteristics[item.data.characteristic.value].total);

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
                data.characterHitLocations[item.data.location.value].cyber=true;
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

                    item.data.range.value=eval(range);

                    item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                    item.data.damageFormula.value=item.data.damageFormula.formula.replace(/pr/gmi,pr);
                }catch{
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

                if(item.name==="True Grit"){
                    if(!this.getFlag("fortyk","truegrit")){
                        this.setFlag("fortyk","truegrit",true);
                    }



                }else if(item.name==="And They Shall Know No Fear"){
                    actorData.flags["atsknf"]=true;
                }else if(item.name==="Unrelenting"){
                    actorData.flags["unrelenting"]=true;
                    unrelenting=true;
                }else if(item.name==="Die Hard"){
                    actorData.flags["diehard"]=true;
                    this.setFlag("fortyk","diehard",true);
                }
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

                if(item.flags.specials.crushing.value){

                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+2*data.characteristics.s.bonus;
                }else{
                    item.data.damageFormula.value=item.data.damageFormula.formula+"+"+data.characteristics.s.bonus;
                }

                meleeweapons.push(item);
                wargear.push(item);
            }

            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){


                try{
                    if(item.flags.specials.force.value){

                        let pr=parseInt(data.psykana.pr.value);
                        item.data.pen.value=eval(item.data.pen.formula.toLowerCase());

                        item.data.damageFormula.value=item.data.damageFormula.value.replace(/pr/gmi,pr);

                    }
                }catch{
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
                    item.data.weight.total=parseInt(item.data.amount.value)*parseInt(item.data.weight.value);

                    data.carry.value=parseInt(data.carry.value)+parseInt(item.data.weight.total);



                }

                if(item.type==="rangedWeapon"){

                    try
                    {
                        let sb=data.characteristics.s.bonus;

                        let formula=item.data.range.formula.toLowerCase();

                        item.data.range.value=eval(formula);
                    } 
                    catch{
                        item.data.range.value="";
                } 

                        rangedWeapons.push(item);
                    wargear.push(item);

                }
            }
            //check if actor has the unrelenting trait
            if(!unrelenting){actorData.flags["unrelenting"]=false};

            //compile total exp and influence
            data.characteristics["inf"].total=data.characteristics["inf"].value+data.characteristics["inf"].advance;
            data.experience.value=parseInt(data.experience.starting)+parseInt(data.experience.earned)-parseInt(data.experience.spent);
            //get max carry weight ensure it is not out of bounds

            if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)>19){
                data.carry.max=FORTYK.carry[19].carry;

            }else if((data.characteristics["s"].bonus+data.characteristics["t"].bonus)<=19){

                data.carry.max=FORTYK.carry[(data.characteristics["s"].bonus+data.characteristics["t"].bonus)].carry;

            }else{
             data.carry.max=FORTYK.carry[1].carry;
            }
            let wornWeapons=data.secChar.wornGear.weapons;

            if(!Array.isArray(data.secChar.wornGear.weapons)){
                wornWeapons=Object.values(data.secChar.wornGear.weapons);
            }
            for( let w of wornWeapons){
                wornGear.weapons.push(this.getEmbeddedEntity("OwnedItem",w));
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


            //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc


            //apply logic to items that depends on actor data so that it updates readily when the actor is updated

            //put all items in their respective containers and do some item logic
            for(let item of actorData.items){










                if(item.type==="psychicPower"){
                    try{
                        let pr=parseInt(item.data.curPR.value);
                        let range=item.data.range.formula.toLowerCase();

                        item.data.range.value=eval(range);

                        item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                        item.data.damageFormula.value=item.data.damageFormula.formula.replace(/pr/gmi,pr);
                    }catch{
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


                if(item.type==="meleeWeapon"){

                    if(item.flags.specials.crushing.value){

                        item.data.damageFormula.value=item.data.damageFormula.formula+"+"+2*data.characteristics.s.bonus;
                    }else{
                        item.data.damageFormula.value=item.data.damageFormula.formula+"+"+data.characteristics.s.bonus;
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
                    catch{
                        item.data.range.value="";
                } 
                        rangedWeapons.push(item);


                }
                if(item.type==="meleeWeapon"||item.type==="rangedWeapon"){


                    try{
                        if(item.flags.specials.force.value){
                            
                            let pr=parseInt(data.psykana.pr.value);
                           
                            item.data.pen.value=eval(item.data.pen.formula.toLowerCase());

                            item.data.damageFormula.value=item.data.damageFormula.value.replace(/pr/gmi,pr);
                          
                        }
                    }catch{
                        item.data.pen.value="";
                        item.data.damageFormula.value="";
                }
                }
                }








                        let preparedItems={
                        psychicPowers:psychicPowers,
                        meleeWeapons:meleeweapons,
                        rangedWeapons:rangedWeapons
                };
                        return preparedItems;
                }
                        prepare(){
                            let preparedData = this.data

                            // Call prepareItems first to organize and process OwnedItems
                            if(preparedData.type==='dwPC'){
                                mergeObject(preparedData, this.preparePCItems(preparedData));
                            }
                            if(preparedData.type==='npc'){
                                mergeObject(preparedData, this.prepareNPCItems(preparedData));
                            }

                            return preparedData;
                        }
                    _prepareNPCData(actorData){

                        const data=actorData.data;
                        //calc char bonuses
                        for (let [key, char] of Object.entries(data.characteristics)){
                            if(key==="inf"){

                            }else{

                                char.bonus=Math.floor(char.total/10)+parseInt(char.uB); 

                            }

                        }


                        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
                        //modify total characteristics depending on fatigue
                        var fatigueMult=1;


                        for (let [key,char] of Object.entries(data.characteristics)){
                            if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                                char.total=Math.ceil(char.value/2);
                            }else{
                                char.total=char.value;
                            }
                        }
                        //size
                        let size=data.secChar.size.value;

                        data.secChar.size.label=FORTYK.size[size].name;
                        data.secChar.size.mod=FORTYK.size[size].mod;
                        data.secChar.size.movement=FORTYK.size[size].movement;
                        data.secChar.size.stealth=FORTYK.size[size].stealth
                        //movement
                        data.secChar.movement.half=data.characteristics["agi"].bonus+data.secChar.size.movement+data.secChar.movement.mod;
                        data.secChar.movement.full=data.secChar.movement.half*2;
                        data.secChar.movement.charge=data.secChar.movement.half*3;
                        data.secChar.movement.run=data.secChar.movement.half*6;
                        //total soak
                        for(let [key, hitLoc] of Object.entries(data.characterHitLocations)){


                            hitLoc.value=parseInt(hitLoc.armor)+parseInt(data.characteristics.t.bonus);
                        }

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

