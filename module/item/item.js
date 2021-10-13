/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import {getItem} from "../utilities.js";
import {isEmpty} from "../utilities.js";

export class FortyKItem extends Item {
    //@Override the create function to add an activeeffect for modifiers to an item
    static async create(data, options) {
        // If the created item has effects (only applicable to duplicated actors) bypass the new item creation logic

        if (data.effects)
        {
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
        data.effects.push(modifiers.data);
        //resume item creation
        */
        return super.create(data, options);
    }
    /** 
    ** @override talents and traits should update their flags on the owning actor if the specialisation field is changed
    **/
    async update(data, options={}){
        if(this.data.type==="talentntrait"){

            if(this.isEmbedded){

                if(this.data.data.specialisation.value!==data["data.specialisation.value"]){
                    await this.actor.setFlag("fortyk",this.data.data.flagId.value,data["data.specialisation.value"])
                }
            }
        }
        super.update(data,options);
    }

    /**
   * Augment the basic Item data model with additional dynamic data.
   */
    async prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const data = itemData.data;

        itemData["FORTYK"]=game.fortyk.FORTYK;

        //ensure this is an owned item

        if(this.actor!==null&&this.actor.data!==undefined){
            const actorData = this.actor.data;

            //prepare skill total value
            if(itemData.type==="skill"){
                data.total.value=parseInt(data.value)+parseInt(data.mod.value)+parseInt(actorData.data.characteristics[data.characteristic.value].total);
            }
            //logic for weapons

            if(itemData.type==="meleeWeapon"){
                data.range.value=data.range.formula;
                data.pen.value=data.pen.formula;





                //ensure that a weapon that is not a shield does not have an armor rating
                if(data.class.value!=="Shield"&&data.shield.value!==0){
                    data.shield.value=0;

                }


            }
            if(itemData.type==="rangedWeapon"){

                


                
            }
            //prepare psychicpowers, calculates pushing and target numbers
            if(itemData.type==="psychicPower"){
                if(actorData.data.psykana.psykerType.value.toLowerCase()==="navigator"){
                    let range=data.range.formula.toLowerCase();

                    data.range.value=eval(range);
                    data.pen.value=eval(data.pen.formula.toLowerCase());
                    let training=0;
                    switch(data.training.value){
                        case "Novice":
                            training=0;
                            break;
                        case "Adept":
                            training=10;
                            break;
                        case "Master":
                            training=20;
                            break;
                    }
                    let char=0;
                    if(data.testChar.value==="psy"){

                    }else{
                        char=parseInt(actorData.data.characteristics[data.testChar.value].total);
                        data.testChar.type=data.testChar.value;
                    }

                    data.target.value=char+training;
                }else{
                    let pr=parseInt(data.curPR.value);


                    let range=data.range.formula.toLowerCase();

                    data.range.value=eval(range);

                    data.pen.value=eval(data.pen.formula.toLowerCase());



                    let derivedPR=Math.abs(parseInt(actorData.data.psykana.pr.effective)-parseInt(data.curPR.value));

                    let specials=itemData.flags.specials;
                    for(const spec in specials){

                        if(specials[spec].value&&specials[spec].num!==undefined){


                            if(isNaN(specials[spec].num)&&specials[spec].form!==undefined&&specials[spec].num!==specials[spec].form){

                                specials[spec].form=specials[spec].num;

                            }else if(isNaN(specials[spec].num)&&specials[spec].form===undefined){

                                specials[spec].form=specials[spec].num;

                            } 




                            if(specials[spec].form!==undefined){
                                specials[spec].num=eval(specials[spec].form);
                            }
                        }
                    }

                    let char=0;
                    if(data.testChar.value==="psy"){

                    }else{
                        char=parseInt(actorData.data.characteristics[data.testChar.value].total);
                        data.testChar.type=data.testChar.value;
                    }

                    data.target.value=parseInt(char)+(derivedPR*10)+parseInt(data.testMod.value)+parseInt(actorData.data.psykana.mod.value); 
                }

            }
            if(itemData.type==="meleeWeapon"||itemData.type==="rangedWeapon"||itemData.type==="psychicPower"){








            }

        }

    }
}

