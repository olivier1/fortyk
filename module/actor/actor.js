
import {getSkills} from "../utilities.js";
import {FORTYK} from "../FortykConfig.js";
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
   */
    _prepareCharacterData(actorData) {
        const data = actorData.data;
        data.secChar.movement.mod=1;
         
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
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        data.experience.earned=0;
        data.characteristics["inf"].advance=0;
        data.experience.spent=0;
        data.carry.value=0;
        let unrelenting=false;
        for(let item of this.data.items){
            if(item.type==="skill"){
                item.data.total.value=parseInt(item.data.value)+parseInt(item.data.mod.value)+parseInt(data.characteristics[item.data.characteristic.value].total);
            }
            if(item.type==="talentntrait"){

                if(item.name==="True Grit"){
                    actorData.flags["truegrit"]=true;
                }else if(item.name==="And They Shall Know No Fear"){
                    actorData.flags["atsknf"]=true;
                }else if(item.name==="Unrelenting"){
                    actorData.flags["unrelenting"]=true;
                    unrelenting=true;
                }

            }

            if(item.type==="cybernetic"){
                data.characterHitLocations[item.data.location.value].cyber=true;

            }
            if(item.type==="mission"){
                //adds up earned exp and influence
                data.experience.earned=parseInt(data.experience.earned)+parseInt(item.data.exp.value);
                data.characteristics["inf"].advance= parseInt(data.characteristics["inf"].advance)+parseInt(item.data.inf.value);
            }
            if(item.type==="advancement"){
                //calculates spent exp
                data.experience.spent=parseInt(data.experience.spent)+parseInt(item.data.cost.value);
            }
            if(item.type==="psychicPower"){
                let pr=parseInt(item.data.curPR.value);
                let range=item.data.range.formula.toLowerCase();

                item.data.range.value=eval(range);

                item.data.pen.value=eval(item.data.pen.formula.toLowerCase());
                item.data.damageFormula.value=item.data.damageFormula.formula.replace(/pr/gmi,pr);
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

            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                //total weight calcs
                item.data.weight.total=parseInt(item.data.amount.value)*parseInt(item.data.weight.value);

                data.carry.value=parseInt(data.carry.value)+parseInt(item.data.weight.total);
                
                

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
        }else{
            data.carry.max=FORTYK.carry[(data.characteristics["s"].bonus+data.characteristics["t"].bonus)].carry;
        }

        //movement
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
    //this prepares all items into containers that can be easily accessed by the html sheets, also adds in logic for sorting and the like
    prepareItems(){
        let data=duplicate(this.data);
        const skills=[];
        const wargear=[];
        const cybernetics=[];
        const forceFields=[];
        const mods=[];
        const consummables=[];
        const psychicPowers=[];
        const mutations=[];
        const malignancies=[];
        const disorders=[];
        const talentsntraits=[];
        const missions=[];
        const advancements=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const armors=[];
        const ammunitions=[];
        const wornGear={weapons:[],"armor":"","forceField":""};
       
        if(!Array.isArray(data.data.secChar.wornGear.weapons)){
                data.data.secChar.wornGear.weapons=Object.values(data.data.secChar.wornGear.weapons);
            }
        for( let w of data.data.secChar.wornGear.weapons){
            wornGear.weapons.push(this.getEmbeddedEntity("OwnedItem",w));
        }
        
        if (wornGear.weapons.length<2){wornGear.weapons.push("")};  
        
        //put all items in their respective containers
        for(let i of data.items){
            
            
            
            if(i._id===data.data.secChar.wornGear.armor._id){
                wornGear["armor"]=i;
            }
            if(i._id===data.data.secChar.wornGear.forceField._id){
                wornGear["forceField"]=i;
            }
            if(i.type=="skill"){



                skills.push(i);
            }
            if(i.type==="malignancy"){
                malignancies.push(i);
            }
            if(i.type==="mutation"){
                mutations.push(i);
            }
            if(i.type==="disorder"){
                disorders.push(i);
            }
            if(i.type==="wargear"){
                wargear.push(i);
            }
            if(i.type==="cybernetic"){
                cybernetics.push(i);
            }
            if(i.type==="forceField"){
                forceFields.push(i);
                wargear.push(i);
            }
            if(i.type==="mod"){
                mods.push(i);
            }
            if(i.type==="consummable"){
                consummables.push(i);
                wargear.push(i);
            }
            if(i.type==="psychicPower"){

                psychicPowers.push(i);
            }
            if(i.type==="talentntrait"){
                talentsntraits.push(i);
            }
            if(i.type==="mission"){
                missions.push(i);
            }
            if(i.type==="advancement"){
                advancements.push(i);
            }
            if(i.type==="meleeWeapon"){
                meleeweapons.push(i);
                wargear.push(i);
            }
            if(i.type==="rangedWeapon"){
                rangedWeapons.push(i);
                wargear.push(i);
            }
            if(i.type==="armor"){
                armors.push(i);
                wargear.push(i);
            }
            if(i.type==="ammunition"){
                ammunitions.push(i);
                wargear.push(i);
            }
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
                           disorders:disorders,
                           talentsntraits:talentsntraits,
                           missions:missions,
                           advancements:advancements,
                           meleeWeapons:meleeweapons,
                           rangedWeapons:rangedWeapons,
                           armors:armors,
                           ammunitions:ammunitions,
                           wornGear:wornGear};
        return preparedItems;
    }
    prepare(){
        let preparedData = duplicate(this.data)

        // Call prepareItems first to organize and process OwnedItems
        mergeObject(preparedData, this.prepareItems());

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

        if(data.talentsntraits.value.toLowerCase().includes("true grit")){
            actorData.flags["truegrit"]=true;

        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        //modify total characteristics depending on fatigue
        var fatigueMult=1;


        for (let [key,char] of Object.entries(data.characteristics)){
            if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.total/2);
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

