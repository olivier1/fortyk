
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

        //initialise starting skills
        let startingSkills= await getSkills();
        if (data.type !="npc"){
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
        if(data.skillFilter===undefined){
            data.skillFilter="";
        }

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'dwPC') this._prepareCharacterData(actorData);
    }

    /**
   * Prepare Character type specific data
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
        for (let [key,char] of Object.entries(data.characteristics)){
            if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.total/2);
            }
        }
        //prepare psyker stuff
        data.psykana.pr.maxPush=parseInt(data.psykana.pr.value)+parseInt(FORTYK.psykerTypes[data.psykana.psykerType.value].push);
        //iterate over items and add relevant things to character stuff, IE: adding up exp, weight etc
        data.experience.earned=0;
        data.characteristics["inf"].advance=0;
        data.experience.spent=0;
        data.carry.value=0;

        for(let item of this.data.items){
            
            if(item.type==="skill"){
               
               
            }
            if(item.type==="mission"){

                data.experience.earned=parseInt(data.experience.earned)+parseInt(item.data.exp.value);
                data.characteristics["inf"].advance= parseInt(data.characteristics["inf"].advance)+parseInt(item.data.inf.value);
            }
            if(item.type==="advancement"){
                data.experience.spent=parseInt(data.experience.spent)+parseInt(item.data.cost.value);
            }
            if(item.type==="meleeWeapon"||item.type==="rangedWeapon"||item.type==="forceField"||item.type==="wargear"||item.type==="ammunition"||item.type==="consummable"||item.type==="armor"||item.type==="mod"){
                item.data.weight.total=parseInt(item.data.amount.value)*parseInt(item.data.weight.value);

                data.carry.value=parseInt(data.carry.value)+parseInt(item.data.weight.total);
            }
            
        }
        data.characteristics["inf"].total=data.characteristics["inf"].value+data.characteristics["inf"].advance;
        data.experience.value=parseInt(data.experience.starting)+parseInt(data.experience.earned)-parseInt(data.experience.spent);
        data.carry.max=FORTYK.carry[(data.characteristics["s"].bonus+data.characteristics["t"].bonus)].carry;
        data.secChar.movement.half=data.characteristics["agi"].bonus+data.secChar.size.movement;
        data.secChar.movement.full=data.secChar.movement.half*2;
        data.secChar.movement.charge=data.secChar.movement.half*3;
        data.secChar.movement.run=data.secChar.movement.half*6;



    }
    //this prepares all items into containers that can be easily accessed by the html sheets, also adds in logic for sorting and the like
    prepareItems(){
        let data=duplicate(this.data);
        const skills=[];
        const wargear=[];
        const cybernetics=[];
        const forceFields=[];
        const mods={};
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
        const worngear={};

        //put all items in their respective containers
        for(let i of data.items){
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
                i.data
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
                           ammunitions:ammunitions};
        return preparedItems;
    }
    prepare(){
        let preparedData = duplicate(this.data)

        // Call prepareItems first to organize and process OwnedItems
        mergeObject(preparedData, this.prepareItems());

        return preparedData;
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

