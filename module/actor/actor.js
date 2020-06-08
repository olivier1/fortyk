
import {getSkills} from "../utilities.js";
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
            char.total=parseInt(char.value)+parseInt(char.advance)+parseInt(char.mod)+parseInt(data.globalMOD.value);
            char.bonus=Math.floor(char.total/10)+parseInt(char.uB);
        }
        data.secChar.fatigue.max=parseInt(data.characteristics.wp.bonus)+parseInt(data.characteristics.t.bonus);
        //modify total characteristics depending on fatigue
        var fatigueMult=1;
        for (let [key,char] of Object.entries(data.characteristics)){
            if(char.bonus*fatigueMult<data.secChar.fatigue.value){
                char.total=Math.ceil(char.total/2);
            }
        }
        
       


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
        const aptitudes=[];
        const talentsntraits=[];
        const missions=[];
        const advancements=[];
        const meleeweapons=[];
        const rangedWeapons=[];
        const armors=[];
        const ammunitions=[];
        //put all items in their respective containers
        for(let i of data.items){
            if(i.type=="skill"){
              i.data.total.value=parseInt(i.data.value.value)+parseInt(i.data.mod.value)+parseInt(data.data.characteristics[i.data.characteristic.value].total);
               
                skills.push(i);
            }
        }
        skills.sort();
        let preparedItems={skills:skills,
                           wargear:wargear,
                           cybernetics:cybernetics,
                           forceFields:forceFields,
                           mods:mods,
                           consummables:consummables,
                           psychicPowers:psychicPowers,
                           mutations:mutations,
                           malignancies:malignancies,
                           disorders:disorders,
                           aptitudes:aptitudes,
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
    //add a new skill to the skill list for the character
    createSkill(dlg){

        const data=this.data.data;
        const $content=$(dlg);

        var skillName=$content.find('input[name="skillName"]').val().toLowerCase().replace(" ","");
        var newSkill={value:-20,characteristic:$content.find('select[name="char"]').val(),mod:0,total:0,name:$content.find('input[name="skillName"]').val()};



        if($content.find('select[name="skillType"]').val()=="new"){
            let target="data.skills."+skillName;



        }else{

            let special=data.skills[$content.find('select[name="skillType"]').val()];
            //this.update({'data.skills['$content.find('select[name="skillType"]').val()'].specialties':newSkill})



        }



    }

}

