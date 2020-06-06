/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class FortyKActor extends Actor {

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
        //prepare skills data
        for (let [key, skill] of Object.entries(data.skills)){

            if(skill.specialties !== undefined){
                for (let [s, spec] of Object.entries(skill.specialties)){
                    spec.total=parseInt(spec.value)+parseInt(spec.mod)+parseInt(data.characteristics[spec.characteristic].total); 
                }
            }else{

                if(skill.total!==undefined){
                    skill.total=parseInt(skill.value)+parseInt(skill.mod)+parseInt(data.characteristics[skill.characteristic].total);
                }

            }
        }
        

    }
    //add a new skill to the skill list for the character
    createSkill(dlg){

        const data=this.data.data;
        const $content=$(dlg);

        var skillName=$content.find('input[name="skillName"]').val().toLowerCase().replace(" ","");
        var newSkill={value:-20,characteristic:$content.find('select[name="char"]').val(),mod:0,total:0,name:$content.find('input[name="skillName"]').val()};
        console.log(newSkill);


        if($content.find('select[name="skillType"]').val()=="new"){
            let target="data.skills."+skillName;
            console.log(target);
            console.log(this.update({[target]:newSkill}));


        }else{

            let special=data.skills[$content.find('select[name="skillType"]').val()];
            //this.update({'data.skills['$content.find('select[name="skillType"]').val()'].specialties':newSkill})



        }
       
       
        
    }
    
}

